# Your First Map

Build a small dungeon with connected rooms, a locked door, and pathfinding in about 5 minutes.

By the end of this guide, you'll have a 4-room dungeon where players need a key to access the treasure room, and you'll know how to check if paths exist between locations.

## What We're Building

A simple dungeon layout:

```
                    [Treasure Room]
                          |
                     (locked door)
                          |
[Guard Room] --EAST-- [Great Hall] --NORTH-- [Armory]
```

The treasure room requires a `brass-key` to enter.

## Step 1: Create the Graph

Start by importing the library and creating an empty graph.

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()
```

The `createSpatialGraph()` function returns a new graph instance. All your rooms and connections will live here.

## Step 2: Add Rooms

Create nodes for each location. Nodes need a unique ID, and you can attach metadata like names and descriptions.

```typescript
graph.createNode('guard-room', {
  name: 'Guard Room',
  description: 'A small room with weapon racks on the walls.'
})

graph.createNode('great-hall', {
  name: 'Great Hall',
  description: 'A vast chamber with pillars reaching to the ceiling.'
})

graph.createNode('armory', {
  name: 'Armory',
  description: 'Shields and swords line every surface.'
})

graph.createNode('treasure-room', {
  name: 'Treasure Room',
  description: 'Gold coins glitter in the torchlight.'
})
```

Each call to `createNode()` registers a new location in the graph.

## Step 3: Connect Rooms

Link rooms together using directions. Connections are bidirectional by default—connecting A to B also connects B to A in the opposite direction.

```typescript
// Guard Room <-> Great Hall (via EAST/WEST)
graph.connect('guard-room', Direction.EAST, 'great-hall')

// Great Hall <-> Armory (via NORTH/SOUTH)
graph.connect('great-hall', Direction.NORTH, 'armory')

// Great Hall <-> Treasure Room (via EAST/WEST)
graph.connect('great-hall', Direction.EAST, 'treasure-room')
```

After these calls, a player in the Guard Room can go EAST to reach the Great Hall, and going WEST from the Great Hall returns to the Guard Room.

## Step 4: Add a Locked Door

Make the treasure room require a key. Gates attach to existing connections and control who can pass.

```typescript
graph.setGate('great-hall', Direction.EAST, {
  id: 'treasury-door',
  locked: true,
  keyId: 'brass-key',
  description: 'A heavy iron door with a brass lock.'
})
```

Now the connection from Great Hall to Treasure Room is blocked unless the player has the `brass-key`.

## Step 5: Test Traversal

Check if a player can move through the locked door, with and without the key.

```typescript
// Without the key
const blocked = graph.canTraverse('great-hall', Direction.EAST, {
  inventory: []
})
console.log(blocked.allowed)  // false
console.log(blocked.reason)   // 'locked'

// With the key
const allowed = graph.canTraverse('great-hall', Direction.EAST, {
  inventory: ['brass-key']
})
console.log(allowed.allowed)  // true
```

The `canTraverse()` method checks gates and returns whether movement is allowed, plus a reason if blocked.

## Step 6: Find a Path

Use pathfinding to get the route from the guard room to the treasure room.

```typescript
// Path with the key
const path = graph.findPath('guard-room', 'treasure-room', {
  context: { inventory: ['brass-key'] }
})
console.log(path)  // ['guard-room', 'great-hall', 'treasure-room']

// Path without the key
const noPath = graph.findPath('guard-room', 'treasure-room', {
  context: { inventory: [] }
})
console.log(noPath)  // null (no valid path exists)
```

Pathfinding respects locked gates—it won't route through doors the player can't open.

## The Complete Code

Here's everything together:

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

// Create the graph
const graph = createSpatialGraph()

// Add rooms
graph.createNode('guard-room', {
  name: 'Guard Room',
  description: 'A small room with weapon racks on the walls.'
})
graph.createNode('great-hall', {
  name: 'Great Hall',
  description: 'A vast chamber with pillars reaching to the ceiling.'
})
graph.createNode('armory', {
  name: 'Armory',
  description: 'Shields and swords line every surface.'
})
graph.createNode('treasure-room', {
  name: 'Treasure Room',
  description: 'Gold coins glitter in the torchlight.'
})

// Connect rooms
graph.connect('guard-room', Direction.EAST, 'great-hall')
graph.connect('great-hall', Direction.NORTH, 'armory')
graph.connect('great-hall', Direction.EAST, 'treasure-room')

// Add locked door
graph.setGate('great-hall', Direction.EAST, {
  id: 'treasury-door',
  locked: true,
  keyId: 'brass-key',
  description: 'A heavy iron door with a brass lock.'
})

// Test traversal
const canEnter = graph.canTraverse('great-hall', Direction.EAST, {
  inventory: ['brass-key']
})
console.log('Can enter treasury:', canEnter.allowed)  // true

// Find path
const path = graph.findPath('guard-room', 'treasure-room', {
  context: { inventory: ['brass-key'] }
})
console.log('Path to treasure:', path)  // ['guard-room', 'great-hall', 'treasure-room']
```

## What's Next?

Now that you have the basics:

- **[Understand nodes and connections better](Concept-Nodes-And-Connections)** — Learn about metadata, one-way connections, and node removal
- **[Add more gate types](Guide-Adding-Gates-And-Locked-Doors)** — Hidden passages, conditional gates, and custom blocked messages
- **[Explore pathfinding options](Guide-Pathfinding)** — Weighted costs, distance calculation, and reachability
- **[Browse the API](API-Node-Management)** — Full reference when you need details
