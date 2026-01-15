# Pathfinding

Find optimal routes between locations, check reachability, and calculate distances. The library uses Dijkstra's algorithm to handle weighted paths and respects gates based on player context.

## Prerequisites

Before starting, you should:

- [Understand connections](Concept-Nodes-And-Connections)
- [Understand gates](Concept-Gates) (if using locked paths)

## Overview

We'll use pathfinding by:

1. Finding a simple path between two nodes
2. Working with weighted connections
3. Handling locked gates in paths
4. Querying reachability and distance
5. Finding all reachable nodes from a position

## Step 1: Find a Simple Path

Connect some nodes and find the route between them.

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

graph.createNode('entrance')
graph.createNode('hallway')
graph.createNode('library')
graph.createNode('study')

graph.connect('entrance', Direction.NORTH, 'hallway')
graph.connect('hallway', Direction.EAST, 'library')
graph.connect('library', Direction.NORTH, 'study')

const path = graph.findPath('entrance', 'study')
console.log(path)  // ['entrance', 'hallway', 'library', 'study']
```

The path is an array of node IDs from start to finish, inclusive.

## Step 2: Use Weighted Connections

Make some routes more costly to influence pathfinding.

```typescript
graph.createNode('a')
graph.createNode('b')
graph.createNode('c')
graph.createNode('d')

// Fast route: a → b → d (cost 1 + 1 = 2)
graph.connect('a', Direction.NORTH, 'b', { cost: 1 })
graph.connect('b', Direction.EAST, 'd', { cost: 1 })

// Slow route: a → c → d (cost 5 + 1 = 6)
graph.connect('a', Direction.EAST, 'c', { cost: 5 })
graph.connect('c', Direction.NORTH, 'd', { cost: 1 })

// Pathfinding prefers lower total cost
const path = graph.findPath('a', 'd')
console.log(path)  // ['a', 'b', 'd'] (cost 2, not cost 6)
```

Use higher costs for difficult terrain, longer corridors, or routes you want players to avoid unless necessary.

## Step 3: Handle Locked Gates

Pathfinding respects gates. Pass player context to include inventory.

```typescript
graph.createNode('start')
graph.createNode('treasure')
graph.connect('start', Direction.EAST, 'treasure')

graph.setGate('start', Direction.EAST, {
  id: 'chest-lock',
  locked: true,
  keyId: 'chest-key'
})

// Without key: no path
const noKey = graph.findPath('start', 'treasure', {
  context: { inventory: [] }
})
console.log(noKey)  // null

// With key: path exists
const withKey = graph.findPath('start', 'treasure', {
  context: { inventory: ['chest-key'] }
})
console.log(withKey)  // ['start', 'treasure']
```

## Step 4: Check Distance and Reachability

Query without getting the full path.

```typescript
// Is the destination reachable at all?
const reachable = graph.canReach('entrance', 'study')
console.log(reachable)  // true

// What's the total cost to get there?
const distance = graph.getDistance('entrance', 'study')
console.log(distance)  // 3 (sum of connection costs)

// If unreachable, distance is Infinity
const blocked = graph.getDistance('entrance', 'unreachable-node')
console.log(blocked)  // Infinity
```

## Step 5: Find All Reachable Nodes

Get everywhere the player can currently access.

```typescript
const allReachable = graph.getReachable('entrance')
console.log(allReachable)  // ['entrance', 'hallway', 'library', 'study']

// With distance limit
const nearby = graph.getReachable('entrance', { maxDistance: 2 })
console.log(nearby)  // Nodes within 2 hops

// With player context (respects locked gates)
const withInventory = graph.getReachable('entrance', {
  context: { inventory: ['master-key'] }
})
```

## Complete Example

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// Create a dungeon
graph.createNode('entrance')
graph.createNode('corridor')
graph.createNode('armory')
graph.createNode('boss-room')
graph.createNode('treasure')

// Connect with varying costs
graph.connect('entrance', Direction.NORTH, 'corridor', { cost: 1 })
graph.connect('corridor', Direction.WEST, 'armory', { cost: 1 })
graph.connect('corridor', Direction.NORTH, 'boss-room', { cost: 1 })
graph.connect('boss-room', Direction.EAST, 'treasure', { cost: 1 })

// Lock the boss room
graph.setGate('corridor', Direction.NORTH, {
  id: 'boss-door',
  locked: true,
  keyId: 'boss-key'
})

// Player without key
const limitedReach = graph.getReachable('entrance', {
  context: { inventory: [] }
})
console.log('Without key:', limitedReach)
// ['entrance', 'corridor', 'armory']

// Player with key
const fullReach = graph.getReachable('entrance', {
  context: { inventory: ['boss-key'] }
})
console.log('With key:', fullReach)
// ['entrance', 'corridor', 'armory', 'boss-room', 'treasure']

// Find path to treasure
const path = graph.findPath('entrance', 'treasure', {
  context: { inventory: ['boss-key'] }
})
console.log('Path to treasure:', path)
// ['entrance', 'corridor', 'boss-room', 'treasure']

// Total distance
const distance = graph.getDistance('entrance', 'treasure', {
  context: { inventory: ['boss-key'] }
})
console.log('Distance:', distance)  // 3
```

## Variations

### Limiting Path Length

Reject paths that are too long.

```typescript
// Only find paths with 3 or fewer nodes
const shortPath = graph.findPath('start', 'end', { maxLength: 3 })

// Returns null if shortest path is longer than limit
```

### Finding Alternative Routes

If the direct path is blocked, pathfinding automatically finds alternatives.

```typescript
// Direct: a → b is locked
// Alternative: a → c → d → b
graph.setGate('a', Direction.EAST, { id: 'locked', locked: true, keyId: 'key' })

// Without key, finds the longer route (if one exists)
const alternatePath = graph.findPath('a', 'b', {
  context: { inventory: [] }
})
// Will return the unlocked route, or null if all routes blocked
```

### Same-Node Path

Finding a path to the current location returns just that node.

```typescript
const samePath = graph.findPath('entrance', 'entrance')
console.log(samePath)  // ['entrance']
```

## Troubleshooting

### Path returns null unexpectedly

**Symptom:** `findPath()` returns `null` even though nodes are connected.

**Cause:** A locked gate is blocking the path and the context doesn't include the required key.

**Solution:** Check for gates along the path and ensure the context includes needed keys:
```typescript
const exits = graph.getExits('node')
exits.forEach(exit => {
  if (exit.gate?.locked) {
    console.log(`Gate ${exit.gate.id} requires key: ${exit.gate.keyId}`)
  }
})
```

### Distance is Infinity

**Symptom:** `getDistance()` returns `Infinity`.

**Cause:** No valid path exists between the nodes (disconnected or fully blocked).

**Solution:** Verify the nodes are connected with `canReach()` first:
```typescript
if (graph.canReach('a', 'b')) {
  const dist = graph.getDistance('a', 'b')
}
```

## See Also

- **[Traversal and Pathfinding Concept](Concept-Traversal-And-Pathfinding)** — Understanding the algorithm
- **[Gates](Concept-Gates)** — How gates affect paths
- **[Pathfinding API](API-Pathfinding)** — Full method reference
