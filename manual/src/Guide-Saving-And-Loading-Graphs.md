# Saving and Loading Graphs

Persist graph state for game saves and restore it later. The library provides `serialize()` and `deserialize()` methods that produce JSON-compatible data.

## Prerequisites

Before starting, you should:

- Have a working graph with nodes, connections, and gates

## Overview

We'll handle persistence by:

1. Serializing the graph to JSON-compatible data
2. Storing the data (localStorage, file, database)
3. Restoring the graph with deserialize
4. Validating restored data

## Step 1: Serialize the Graph

Call `serialize()` to get a plain object containing all graph state.

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// Build your graph
graph.createNode('entrance', { name: 'Entrance Hall' })
graph.createNode('library', { name: 'Library' })
graph.connect('entrance', Direction.NORTH, 'library')
graph.setGate('entrance', Direction.NORTH, {
  id: 'library-door',
  locked: true,
  keyId: 'library-key'
})

// Serialize to JSON-compatible object
const data = graph.serialize()
console.log(data)
// {
//   nodes: { entrance: {...}, library: {...} },
//   connections: { entrance: { NORTH: {...} }, library: { SOUTH: {...} } }
// }
```

The serialized data includes all nodes, connections, gates, metadata, tiles, layers, and zones.

## Step 2: Store the Data

Convert to JSON string and save wherever your game stores data.

```typescript
// Convert to JSON string
const json = JSON.stringify(data)

// Browser localStorage
localStorage.setItem('game-map', json)

// Node.js file
import { writeFileSync } from 'fs'
writeFileSync('save.json', json)

// Send to server
await fetch('/api/save', {
  method: 'POST',
  body: json,
  headers: { 'Content-Type': 'application/json' }
})
```

## Step 3: Restore the Graph

Create a new graph and call `deserialize()` with the saved data.

```typescript
// Load the JSON
const savedJson = localStorage.getItem('game-map')
const savedData = JSON.parse(savedJson)

// Create new graph and restore
const restoredGraph = createSpatialGraph()
restoredGraph.deserialize(savedData)

// Graph is now identical to when it was saved
console.log(restoredGraph.hasNode('entrance'))  // true
console.log(restoredGraph.getNode('library')?.metadata.name)  // 'Library'

const gate = restoredGraph.getGate('entrance', Direction.NORTH)
console.log(gate?.locked)  // true
```

Note: `deserialize()` clears the graph first, so any existing nodes are removed.

## Step 4: Validate Restored Data

After deserializing, use `validate()` to check for structural issues.

```typescript
const result = restoredGraph.validate()

if (result.valid) {
  console.log('Graph loaded successfully')
} else {
  console.error('Graph has issues:', result.errors)
}
```

Validation catches issues like connections pointing to non-existent nodes (which might happen if save data is corrupted or from an older version).

## Complete Example

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

// === SAVE GAME ===
function saveGame(graph: SpatialGraph): string {
  const data = graph.serialize()
  const json = JSON.stringify(data, null, 2)  // Pretty print for debugging
  localStorage.setItem('game-save', json)
  return json
}

// === LOAD GAME ===
function loadGame(): SpatialGraph | null {
  const json = localStorage.getItem('game-save')
  if (!json) {
    console.log('No save found')
    return null
  }

  try {
    const data = JSON.parse(json)
    const graph = createSpatialGraph()
    graph.deserialize(data)

    // Validate the loaded data
    const validation = graph.validate()
    if (!validation.valid) {
      console.error('Save file corrupted:', validation.errors)
      return null
    }

    console.log('Game loaded successfully')
    return graph
  } catch (error) {
    console.error('Failed to load save:', error)
    return null
  }
}

// === USAGE ===
const graph = createSpatialGraph()
graph.createNode('start', { name: 'Starting Room' })
graph.createNode('end', { name: 'Final Room' })
graph.connect('start', Direction.NORTH, 'end')

// Save
saveGame(graph)

// Later, load
const restored = loadGame()
if (restored) {
  console.log(restored.getAllNodes())  // ['start', 'end']
}
```

## Variations

### Merging Saved State with Fresh Graph

Load saved state but add new content from a fresh template.

```typescript
function loadWithUpdates(savedJson: string, templateGraph: SpatialGraph) {
  const graph = createSpatialGraph()
  const savedData = JSON.parse(savedJson)

  // Load saved state first
  graph.deserialize(savedData)

  // Add new nodes from template if they don't exist
  const templateData = templateGraph.serialize()
  for (const [id, nodeData] of Object.entries(templateData.nodes)) {
    if (!graph.hasNode(id)) {
      graph.createNode(id, nodeData.metadata)
      // Also add connections from template for this node
    }
  }

  return graph
}
```

### Saving Only Changed State

Track what changed since last save (for incremental saves).

```typescript
const changedNodes = new Set<string>()

graph.on('nodeCreated', (id) => changedNodes.add(id))
graph.on('gateUpdated', (from) => changedNodes.add(from))

function getChanges() {
  const fullData = graph.serialize()
  // Filter to only changed nodes
  return {
    nodes: Object.fromEntries(
      Object.entries(fullData.nodes)
        .filter(([id]) => changedNodes.has(id))
    ),
    connections: Object.fromEntries(
      Object.entries(fullData.connections)
        .filter(([id]) => changedNodes.has(id))
    )
  }
}
```

### Handling Missing Nodes in Old Saves

Guard against save files from older versions.

```typescript
function loadWithMigration(savedJson: string) {
  const graph = createSpatialGraph()
  const data = JSON.parse(savedJson)

  // Check version
  if (!data.version || data.version < 2) {
    // Migrate old format
    data.nodes = migrateOldNodes(data.nodes)
  }

  graph.deserialize(data)

  // Add nodes that must exist
  if (!graph.hasNode('spawn')) {
    graph.createNode('spawn', { name: 'Spawn Point' })
  }

  return graph
}
```

## Troubleshooting

### deserialize throws ValidationError

**Symptom:** `deserialize()` throws "Invalid serialized data: missing nodes".

**Cause:** The data object is malformed or empty.

**Solution:** Check that the data has the expected structure:
```typescript
if (!data || !data.nodes) {
  console.error('Invalid save data structure')
  return
}
```

### Gates not restored correctly

**Symptom:** Gates exist after deserialize but have unexpected values.

**Cause:** Gate data was corrupted or the structure changed.

**Solution:** Verify gate data before use:
```typescript
const gate = graph.getGate('node', Direction.NORTH)
if (gate && typeof gate.locked !== 'boolean') {
  console.warn('Gate has unexpected locked value:', gate.locked)
}
```

## See Also

- **[Events](Guide-Reacting-To-Graph-Changes)** — Track changes for incremental saves
- **[Graph Analysis](Guide-Analyzing-Graph-Structure)** — Validate graph structure
- **[Serialization API](API-Serialization)** — Full method reference
