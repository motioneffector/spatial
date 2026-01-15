# @motioneffector/spatial

Stop thinking about rooms as items in an array. Start thinking about spaces players can navigate with natural directions like "go north" or "climb up." This library models your game world as a directional graph where locations connect via compass directions, doors can be locked until players find keys, and pathfinding just works. You focus on world-building; the graph handles relationships.

## I want to...

| Goal | Where to go |
|------|-------------|
| Get up and running quickly | [Your First Map](Your-First-Map) |
| Understand how nodes and connections work | [Nodes and Connections](Concept-Nodes-And-Connections) |
| Add locked doors to my map | [Adding Gates and Locked Doors](Guide-Adding-Gates-And-Locked-Doors) |
| Find paths between locations | [Pathfinding](Guide-Pathfinding) |
| Create multi-floor buildings | [Working with Layers](Guide-Working-With-Layers) |
| Look up a specific method | [API Reference](API-Node-Management) |

## Key Concepts

### Nodes and Connections

Nodes are locations in your game—rooms, areas, tiles, anything a player can be "in." Connections link nodes via directions (NORTH, UP, etc.). When you connect A to B going NORTH, the library automatically creates the reverse connection from B to A going SOUTH.

### Directions

The vocabulary of navigation. Built-in directions cover compass movement (N/S/E/W and diagonals), vertical movement (UP/DOWN), and special cases (IN/OUT). You can register custom directions for portals, teleporters, or game-specific movement.

### Gates

Access control for connections. A gate might be a locked door requiring a key, a hidden passage that must be discovered, or a drawbridge that only lowers when a game flag is set. Gates answer: "Can the player go this way right now?"

### Pathfinding

Find optimal routes between locations using Dijkstra's algorithm. The library handles weighted costs, respects locked gates based on player inventory, and can tell you all reachable locations from any starting point.

## Quick Example

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

// Create a graph and add rooms
const graph = createSpatialGraph()
graph.createNode('entrance', { name: 'Entrance Hall' })
graph.createNode('library', { name: 'Library' })
graph.createNode('treasury', { name: 'Treasury' })

// Connect rooms with directions
graph.connect('entrance', Direction.NORTH, 'library')
graph.connect('library', Direction.EAST, 'treasury')

// Add a locked door to the treasury
graph.setGate('library', Direction.EAST, {
  id: 'treasury-door',
  locked: true,
  keyId: 'gold-key'
})

// Check if player can enter treasury
const result = graph.canTraverse('library', Direction.EAST, {
  inventory: ['gold-key']
})
console.log(result.allowed) // true

// Find path from entrance to treasury
const path = graph.findPath('entrance', 'treasury')
console.log(path) // ['entrance', 'library', 'treasury']
```

---

**[Full API Reference →](API-Graph-Creation-And-Types)**
