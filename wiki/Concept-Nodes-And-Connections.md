# Nodes and Connections

Nodes represent locations in your game world—rooms, areas, tiles, or any place a player can occupy. Connections are the pathways between them. Together they form a directional graph that models spatial relationships.

## How It Works

Think of it like a subway map. Stations are nodes, and the lines between them are connections. Each connection has a direction—"the library is NORTH of the entrance." When you say the library is north of the entrance, you're also implicitly saying the entrance is south of the library.

```
[Entrance] --NORTH--> [Library]
[Library]  --SOUTH--> [Entrance]  (created automatically)
```

The graph stores these relationships and lets you query them: "What's north of here?" "How do I get from A to B?" "What exits does this room have?"

## Basic Usage

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// Create nodes with IDs and optional metadata
graph.createNode('entrance', { name: 'Entrance Hall' })
graph.createNode('library', { name: 'Library' })

// Connect them - bidirectional by default
graph.connect('entrance', Direction.NORTH, 'library')

// Query the relationship
const destination = graph.getDestination('entrance', Direction.NORTH)
console.log(destination) // 'library'

// Reverse connection exists automatically
const reverse = graph.getDestination('library', Direction.SOUTH)
console.log(reverse) // 'entrance'
```

This creates two nodes and links them. Going NORTH from entrance reaches library; going SOUTH from library reaches entrance.

## Key Points

- **Node IDs must be unique** — Attempting to create a node with a duplicate ID throws a `ValidationError`.
- **Connections are bidirectional by default** — When you connect A→NORTH→B, the library automatically creates B→SOUTH→A. Disable this with `{ bidirectional: false }`.
- **Removing a node removes its connections** — Deleting a node cleans up all connections to and from it, so you don't have dangling references.
- **Metadata is flexible** — Store any properties you need: names, descriptions, item lists, flags, coordinates.

## Examples

### One-Way Connections

Sometimes movement only works in one direction—a one-way door, a jump down a ledge, or a teleporter exit.

```typescript
// Player can jump down, but can't climb back up
graph.connect('ledge', Direction.DOWN, 'pit', { bidirectional: false })

// From ledge: can go DOWN to pit
// From pit: cannot go UP to ledge
```

### Storing Custom Metadata

Nodes accept any properties. Use this for game-specific data.

```typescript
graph.createNode('shop', {
  name: 'Magic Shop',
  description: 'Potions bubble on dusty shelves.',
  shopInventory: ['health-potion', 'mana-potion'],
  ambientSound: 'bubbling.mp3',
  lightLevel: 0.7
})

const node = graph.getNode('shop')
console.log(node?.metadata.shopInventory) // ['health-potion', 'mana-potion']
```

### Checking Available Exits

List all directions a player can go from a location.

```typescript
graph.createNode('hub')
graph.createNode('north-wing')
graph.createNode('east-wing')
graph.createNode('basement')

graph.connect('hub', Direction.NORTH, 'north-wing')
graph.connect('hub', Direction.EAST, 'east-wing')
graph.connect('hub', Direction.DOWN, 'basement')

const exits = graph.getExits('hub')
// [
//   { direction: 'NORTH', target: 'north-wing', gate: null, cost: 1 },
//   { direction: 'EAST', target: 'east-wing', gate: null, cost: 1 },
//   { direction: 'DOWN', target: 'basement', gate: null, cost: 1 }
// ]
```

## Related

- **[Directions](Concept-Directions)** — The vocabulary of movement (NORTH, UP, custom directions)
- **[Gates](Concept-Gates)** — Controlling access on connections
- **[Your First Map](Your-First-Map)** — Practical tutorial using nodes and connections
- **[Node Management API](API-Node-Management)** — Full method reference
