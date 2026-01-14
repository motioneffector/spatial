# Traversal and Pathfinding

Traversal checks if a single move is allowed. Pathfinding finds the best route across multiple moves. Both respect gates and use context (player inventory, game state) to determine accessibility.

## How It Works

**Traversal** asks: "Can I move from A in direction D?" It checks if a connection exists and whether any gate blocks it. You provide context—the player's inventory, discovered passages, and flag store—and get back an allowed/blocked result with a reason.

**Pathfinding** asks: "What's the best route from A to B?" The library uses Dijkstra's algorithm with weighted costs. Connections have a default cost of 1, but you can make some paths longer (wading through swamp) or shorter (express elevator). Locked gates block paths unless the player has the key.

```
Start: [Entrance]
Goal:  [Treasury]

Path: Entrance → Hall → Treasury
Cost: 1 + 1 = 2

If Hall→Treasury is locked and player lacks key:
Path: null (no valid route)
```

## Basic Usage

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()
graph.createNode('entrance')
graph.createNode('hall')
graph.createNode('treasury')

graph.connect('entrance', Direction.NORTH, 'hall')
graph.connect('hall', Direction.EAST, 'treasury')

// Check single traversal
const canMove = graph.canTraverse('entrance', Direction.NORTH, {
  inventory: ['torch']
})
console.log(canMove.allowed) // true

// Find path between locations
const path = graph.findPath('entrance', 'treasury')
console.log(path) // ['entrance', 'hall', 'treasury']

// Check if destination is reachable
const reachable = graph.canReach('entrance', 'treasury')
console.log(reachable) // true

// Get distance (total cost)
const distance = graph.getDistance('entrance', 'treasury')
console.log(distance) // 2
```

## Key Points

- **Traversal returns detailed results** — `{ allowed, reason, gateId }` tells you exactly why movement failed.
- **Pathfinding uses weighted costs** — Connections default to cost 1. Higher costs make paths less attractive to the algorithm.
- **Locked gates block pathfinding** — Unless the player has the required key in their context, the path won't route through locked gates.
- **`getReachable()` finds all accessible nodes** — Useful for fog-of-war, minimap updates, or "where can I go from here?"

## Examples

### Weighted Paths

Make some routes more expensive to traverse.

```typescript
// Normal hallway
graph.connect('a', Direction.NORTH, 'b', { cost: 1 })

// Swamp (slow going)
graph.connect('a', Direction.EAST, 'c', { cost: 5 })

// Both lead to 'd'
graph.connect('b', Direction.EAST, 'd', { cost: 1 })
graph.connect('c', Direction.NORTH, 'd', { cost: 1 })

// Pathfinding prefers a→b→d (cost 2) over a→c→d (cost 6)
const path = graph.findPath('a', 'd')
console.log(path) // ['a', 'b', 'd']
```

### Context-Aware Pathfinding

Pass player state to pathfinding.

```typescript
graph.setGate('hall', Direction.EAST, {
  id: 'vault-door',
  locked: true,
  keyId: 'vault-key'
})

// Without key: can't reach treasury
const noKeyPath = graph.findPath('entrance', 'treasury', {
  context: { inventory: [] }
})
console.log(noKeyPath) // null

// With key: path exists
const withKeyPath = graph.findPath('entrance', 'treasury', {
  context: { inventory: ['vault-key'] }
})
console.log(withKeyPath) // ['entrance', 'hall', 'treasury']
```

### Finding All Reachable Locations

Discover everywhere the player can currently go.

```typescript
const reachable = graph.getReachable('entrance', {
  context: { inventory: ['brass-key'] }
})
console.log(reachable) // ['entrance', 'hall', 'treasury', 'armory', ...]
```

### Limiting Search Distance

Restrict pathfinding to nearby locations.

```typescript
// Only find nodes within 3 hops
const nearby = graph.getReachable('entrance', { maxDistance: 3 })

// Limit path length
const shortPath = graph.findPath('entrance', 'treasury', { maxLength: 2 })
// Returns null if path requires more than 2 nodes
```

### Custom Traversal Logic

Override the default gate checking with your own logic.

```typescript
const graph = createSpatialGraph({
  canTraverse: (connection, gate, context) => {
    // Custom logic: require specific level
    if (context.playerLevel < 10) {
      return { allowed: false, reason: 'Level too low' }
    }
    // Fall through to default behavior for gates
    if (gate?.locked && !context.inventory?.includes(gate.keyId)) {
      return { allowed: false, reason: 'locked', gateId: gate.id }
    }
    return { allowed: true }
  }
})
```

## Related

- **[Gates](Concept-Gates)** — How gates control access
- **[Pathfinding Guide](Guide-Pathfinding)** — Practical pathfinding examples
- **[Pathfinding API](API-Pathfinding)** — Full method reference
