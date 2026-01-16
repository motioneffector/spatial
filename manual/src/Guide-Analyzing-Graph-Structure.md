# Analyzing Graph Structure

Find problems in your graph, detect unreachable areas, and get statistics. Use these tools during development to validate maps or at runtime for player exploration features.

## Prerequisites

Before starting, you should:

- Have a graph with multiple nodes and connections

## Overview

We'll analyze graphs by:

1. Finding orphan nodes (no connections at all)
2. Finding dead ends (single exit only)
3. Detecting disconnected subgraphs
4. Validating structural integrity

## Step 1: Find Orphan Nodes

Orphans are nodes with no connections—neither incoming nor outgoing.

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

graph.createNode('connected-1')
graph.createNode('connected-2')
graph.createNode('orphan')  // Never connected

graph.connect('connected-1', Direction.NORTH, 'connected-2')

const orphans = graph.getOrphans()
console.log(orphans)  // ['orphan']
```

Orphans are usually mistakes—rooms that should be connected but aren't.

## Step 2: Find Dead Ends

Dead ends are nodes with exactly one exit. Players can enter but have only one way out.

```typescript
graph.createNode('entrance')
graph.createNode('hallway')
graph.createNode('dead-end-room')

graph.connect('entrance', Direction.NORTH, 'hallway')
graph.connect('hallway', Direction.EAST, 'dead-end-room')

const deadEnds = graph.getDeadEnds()
console.log(deadEnds)  // ['entrance', 'dead-end-room']

// 'hallway' has 2 exits (SOUTH to entrance, EAST to dead-end-room)
// 'entrance' has 1 exit (NORTH to hallway)
// 'dead-end-room' has 1 exit (WEST to hallway)
```

Dead ends aren't always problems—treasure rooms or story endpoints are intentionally dead ends.

## Step 3: Detect Disconnected Subgraphs

Find groups of nodes that aren't connected to each other.

```typescript
graph.createNode('zone-a-1')
graph.createNode('zone-a-2')
graph.createNode('zone-b-1')
graph.createNode('zone-b-2')

// Zone A is internally connected
graph.connect('zone-a-1', Direction.NORTH, 'zone-a-2')

// Zone B is internally connected
graph.connect('zone-b-1', Direction.NORTH, 'zone-b-2')

// But zones A and B are NOT connected to each other

const subgraphs = graph.getSubgraphs()
console.log(subgraphs)
// [
//   ['zone-a-1', 'zone-a-2'],
//   ['zone-b-1', 'zone-b-2']
// ]
```

Multiple subgraphs mean players can't travel between areas (unless that's intentional, like separate levels).

## Step 4: Validate Graph Integrity

Check for structural problems like connections pointing to non-existent nodes.

```typescript
const result = graph.validate()

if (result.valid) {
  console.log('Graph structure is valid')
} else {
  console.error('Problems found:')
  result.errors?.forEach(error => console.error(`  - ${error}`))
}
```

Validation catches issues that might occur from corrupted save files or manual data manipulation.

## Complete Example

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

function analyzeMap(graph: SpatialGraph) {
  console.log('=== Map Analysis ===\n')

  // Basic stats
  const allNodes = graph.getAllNodes()
  console.log(`Total rooms: ${allNodes.length}`)

  // Orphans (probably mistakes)
  const orphans = graph.getOrphans()
  if (orphans.length > 0) {
    console.log(`\n⚠️  Orphan rooms (no connections):`)
    orphans.forEach(id => console.log(`   - ${id}`))
  }

  // Dead ends (may be intentional)
  const deadEnds = graph.getDeadEnds()
  console.log(`\nDead end rooms: ${deadEnds.length}`)
  deadEnds.forEach(id => {
    const node = graph.getNode(id)
    console.log(`   - ${id} (${node?.metadata.name || 'unnamed'})`)
  })

  // Subgraphs (disconnected areas)
  const subgraphs = graph.getSubgraphs()
  if (subgraphs.length > 1) {
    console.log(`\n⚠️  Disconnected areas found: ${subgraphs.length}`)
    subgraphs.forEach((group, i) => {
      console.log(`   Area ${i + 1}: ${group.length} rooms`)
      console.log(`      Rooms: ${group.slice(0, 5).join(', ')}${group.length > 5 ? '...' : ''}`)
    })
  } else {
    console.log(`\n✓ All rooms are connected`)
  }

  // Validation
  const validation = graph.validate()
  if (validation.valid) {
    console.log(`\n✓ Graph structure is valid`)
  } else {
    console.log(`\n❌ Structural problems:`)
    validation.errors?.forEach(err => console.log(`   - ${err}`))
  }
}

// Usage
const graph = createSpatialGraph()
// ... build your graph ...
analyzeMap(graph)
```

## Variations

### Player Exploration Percentage

Track how much of the map the player has discovered.

```typescript
function getExplorationPercent(visitedNodes: Set<string>, graph: SpatialGraph) {
  const totalNodes = graph.getAllNodes().length
  const visitedCount = visitedNodes.size
  return Math.round((visitedCount / totalNodes) * 100)
}

const visited = new Set(['entrance', 'hallway', 'library'])
console.log(`Explored: ${getExplorationPercent(visited, graph)}%`)
```

### Finding Bottlenecks

Identify nodes that connect otherwise separate areas.

```typescript
function findBottlenecks(graph: SpatialGraph): string[] {
  const bottlenecks: string[] = []

  for (const nodeId of graph.getAllNodes()) {
    // Temporarily "remove" node by checking subgraphs without it
    const originalSubgraphs = graph.getSubgraphs().length

    // Save and remove connections
    const exits = graph.getExits(nodeId)

    // Check what happens if this node didn't exist
    // (This is a simplified check - real implementation would be more complex)
    if (exits.length > 2) {
      bottlenecks.push(nodeId)  // Nodes with many connections are often bottlenecks
    }
  }

  return bottlenecks
}
```

### Development-Time Validation

Run analysis as part of your build process.

```typescript
// map-validator.ts
import { loadMap } from './map-loader'

const graph = loadMap('main-dungeon')

const orphans = graph.getOrphans()
if (orphans.length > 0) {
  console.error('Build failed: orphan rooms found:', orphans)
  process.exit(1)
}

const subgraphs = graph.getSubgraphs()
if (subgraphs.length > 1) {
  console.error('Build failed: disconnected areas found')
  process.exit(1)
}

console.log('Map validation passed')
```

### Zone Completeness

Check that all nodes in a zone are connected within that zone.

```typescript
function checkZoneConnectivity(graph: SpatialGraph, zoneId: string) {
  const zoneNodes = graph.getNodesInZone(zoneId)
  if (zoneNodes.length === 0) return true

  // Check if all zone nodes are in the same subgraph
  const subgraphs = graph.getSubgraphs()
  const nodeSubgraph = subgraphs.find(sg => sg.includes(zoneNodes[0]))

  const allConnected = zoneNodes.every(node => nodeSubgraph?.includes(node))

  if (!allConnected) {
    console.warn(`Zone "${zoneId}" has disconnected rooms`)
  }

  return allConnected
}
```

## Troubleshooting

### getOrphans returns unexpected nodes

**Symptom:** Nodes that should have connections appear as orphans.

**Cause:** Connections were created in wrong direction or to wrong node ID.

**Solution:** Check exits from both sides:
```typescript
const exitsA = graph.getExits('node-a')
const exitsB = graph.getExits('node-b')
console.log('A exits:', exitsA)
console.log('B exits:', exitsB)
```

### getSubgraphs returns single-node arrays

**Symptom:** Subgraphs contain one node each.

**Cause:** Nodes are created but not connected.

**Solution:** Verify connections exist:
```typescript
graph.getAllNodes().forEach(id => {
  const exits = graph.getExits(id)
  if (exits.length === 0) {
    console.log(`${id} has no exits`)
  }
})
```

## See Also

- **[Traversal and Pathfinding](Concept-Traversal-And-Pathfinding)** — Related reachability concepts
- **[Saving and Loading](Guide-Saving-And-Loading-Graphs)** — Validate after loading
- **[Graph Analysis API](API-Graph-Analysis)** — Full method reference
