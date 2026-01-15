# Working with Layers

Model multi-floor buildings, underground areas, and stacked spaces using layers. Each layer is an independent vertical level where the same (x, y) coordinates can exist without conflict.

## Prerequisites

Before starting, you should:

- [Understand nodes and connections](Concept-Nodes-And-Connections)
- [Understand directions](Concept-Directions) (especially UP/DOWN)

## Overview

We'll work with layers by:

1. Creating nodes on different layers
2. Connecting floors with UP/DOWN directions
3. Querying nodes by layer
4. Using tiles with layer-aware positioning

## Step 1: Create Nodes on Layers

Specify the `layer` option when creating nodes. Layer defaults to 1 if not specified.

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// Ground floor (layer 1 - the default)
graph.createNode('lobby', { name: 'Hotel Lobby', layer: 1 })
graph.createNode('restaurant', { name: 'Restaurant', layer: 1 })

// Second floor (layer 2)
graph.createNode('room-201', { name: 'Room 201', layer: 2 })
graph.createNode('room-202', { name: 'Room 202', layer: 2 })

// Basement (layer 0)
graph.createNode('storage', { name: 'Storage Room', layer: 0 })
graph.createNode('boiler-room', { name: 'Boiler Room', layer: 0 })
```

Each layer is independent—you can have different room layouts on each floor.

## Step 2: Connect Floors Vertically

Use UP and DOWN directions to link floors. Create a stairwell or elevator that spans multiple floors.

```typescript
// Create stairwell nodes on each floor
graph.createNode('stairs-0', { name: 'Basement Stairs', layer: 0 })
graph.createNode('stairs-1', { name: 'Ground Floor Stairs', layer: 1 })
graph.createNode('stairs-2', { name: 'Second Floor Stairs', layer: 2 })

// Connect stairwells vertically
graph.connect('stairs-0', Direction.UP, 'stairs-1')
graph.connect('stairs-1', Direction.UP, 'stairs-2')

// Connect stairwells to rooms on each floor
graph.connect('stairs-0', Direction.EAST, 'storage')
graph.connect('stairs-1', Direction.EAST, 'lobby')
graph.connect('stairs-2', Direction.EAST, 'room-201')
```

Now players can navigate from the basement to the second floor via the stairwell.

## Step 3: Query Nodes by Layer

Find all nodes on a specific floor.

```typescript
const groundFloor = graph.getNodesInLayer(1)
console.log(groundFloor)  // ['lobby', 'restaurant', 'stairs-1']

const basement = graph.getNodesInLayer(0)
console.log(basement)  // ['storage', 'boiler-room', 'stairs-0']
```

This is useful for floor-specific UI, minimap rendering, or layer-based game logic.

## Step 4: Use Tiles with Layers

When nodes have tile positions, include the layer to avoid conflicts.

```typescript
// Same coordinates, different floors
graph.createNode('kitchen-ground', {
  name: 'Kitchen',
  tiles: [{ x: 5, y: 3 }],
  layer: 1
})

graph.createNode('bedroom-above', {
  name: 'Master Bedroom',
  tiles: [{ x: 5, y: 3 }],
  layer: 2
})

// Query by position and layer
console.log(graph.getNodeAt(5, 3, 1))  // 'kitchen-ground'
console.log(graph.getNodeAt(5, 3, 2))  // 'bedroom-above'

// Default layer is 1
console.log(graph.getNodeAt(5, 3))     // 'kitchen-ground'
```

## Complete Example

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// === BASEMENT (Layer 0) ===
graph.createNode('basement-hall', { layer: 0 })
graph.createNode('wine-cellar', { layer: 0 })
graph.createNode('basement-stairs', { layer: 0 })

graph.connect('basement-hall', Direction.WEST, 'wine-cellar')
graph.connect('basement-hall', Direction.EAST, 'basement-stairs')

// === GROUND FLOOR (Layer 1) ===
graph.createNode('entrance', { layer: 1 })
graph.createNode('kitchen', { layer: 1 })
graph.createNode('dining-room', { layer: 1 })
graph.createNode('ground-stairs', { layer: 1 })

graph.connect('entrance', Direction.NORTH, 'dining-room')
graph.connect('dining-room', Direction.WEST, 'kitchen')
graph.connect('dining-room', Direction.EAST, 'ground-stairs')

// === SECOND FLOOR (Layer 2) ===
graph.createNode('upstairs-hall', { layer: 2 })
graph.createNode('master-bedroom', { layer: 2 })
graph.createNode('guest-room', { layer: 2 })
graph.createNode('upper-stairs', { layer: 2 })

graph.connect('upstairs-hall', Direction.WEST, 'master-bedroom')
graph.connect('upstairs-hall', Direction.EAST, 'guest-room')
graph.connect('upstairs-hall', Direction.SOUTH, 'upper-stairs')

// === VERTICAL CONNECTIONS ===
graph.connect('basement-stairs', Direction.UP, 'ground-stairs')
graph.connect('ground-stairs', Direction.UP, 'upper-stairs')

// Find path from wine cellar to master bedroom
const path = graph.findPath('wine-cellar', 'master-bedroom')
console.log(path)
// ['wine-cellar', 'basement-hall', 'basement-stairs',
//  'ground-stairs', 'upper-stairs', 'upstairs-hall', 'master-bedroom']

// Get all basement rooms
const basement = graph.getNodesInLayer(0)
console.log('Basement rooms:', basement)
```

## Variations

### Elevator Shaft

A single node that spans multiple floors (using multi-tile with different layers).

```typescript
// Elevator as a concept - represent on each floor
graph.createNode('elevator-0', { name: 'Elevator (B)', layer: 0 })
graph.createNode('elevator-1', { name: 'Elevator (1)', layer: 1 })
graph.createNode('elevator-2', { name: 'Elevator (2)', layer: 2 })

// Connect all floors directly
graph.connect('elevator-0', Direction.UP, 'elevator-1')
graph.connect('elevator-1', Direction.UP, 'elevator-2')
graph.connect('elevator-0', Direction.UP, 'elevator-2')  // Express to top
```

### Hidden Basement

Basement that must be discovered.

```typescript
graph.connect('ground-stairs', Direction.DOWN, 'basement-stairs')
graph.setGate('ground-stairs', Direction.DOWN, {
  id: 'basement-door',
  hidden: true
})

// Player can't go down until they discover the basement entrance
```

### Layer-Specific Events

React when players change floors.

```typescript
graph.on('nodeCreated', (id, data) => {
  console.log(`New room on floor ${data.layer}: ${id}`)
})
```

## Troubleshooting

### getNodeAt returns wrong node

**Symptom:** `getNodeAt(x, y)` returns a node from the wrong floor.

**Cause:** Not specifying the layer parameter (defaults to layer 1).

**Solution:** Always pass the layer when querying specific floors:
```typescript
const node = graph.getNodeAt(x, y, currentFloor)
```

### Nodes not appearing in getNodesInLayer

**Symptom:** Node exists but doesn't appear in layer query.

**Cause:** Node created without explicit layer (defaults to 1) or with wrong layer value.

**Solution:** Check the node's actual layer:
```typescript
const node = graph.getNode('my-node')
console.log('Node layer:', node?.layer)
```

## See Also

- **[Spatial Features](Concept-Spatial-Features)** — Tiles, layers, and zones
- **[Directions](Concept-Directions)** — UP and DOWN directions
- **[Spatial Features API](API-Spatial-Features)** — Full method reference
