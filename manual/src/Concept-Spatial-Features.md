# Spatial Features

For grid-based games, nodes can occupy specific tile positions, span multiple cells, and exist on different layers. Zones provide logical grouping across any nodes. These features bridge the abstract graph with visual or spatial representation.

## How It Works

**Multi-tile nodes** occupy grid positions. A large hall might span a 3×2 area. You query "what node is at position (5, 3)?" and get back the node ID. This connects your graph navigation to a visual map.

**Layers** stack spaces vertically. Floor 1, floor 2, basement—each is a layer. The same (x, y) coordinate on different layers represents different locations. Layers are independent; same coordinates don't conflict.

**Zones** are logical labels. Tag all rooms in "castle-east-wing" or all shops in "market-district." Query nodes by zone for game logic, quest tracking, or region-based effects.

```
Layer 2:  [Attic -----]
          (0,0)  (1,0)

Layer 1:  [Hall] [Kitchen]
          (0,0)   (1,0)

Same coordinates, different layers = different nodes
```

## Basic Usage

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// Multi-tile node (spans 2 cells)
graph.createNode('great-hall', {
  name: 'Great Hall',
  tiles: [{ x: 0, y: 0 }, { x: 1, y: 0 }]
})

// Query by position
const nodeAt = graph.getNodeAt(0, 0)
console.log(nodeAt) // 'great-hall'

const alsoHall = graph.getNodeAt(1, 0)
console.log(alsoHall) // 'great-hall' (same node, different tile)

// Nodes on different layers
graph.createNode('basement', { tiles: [{ x: 0, y: 0 }], layer: 0 })
graph.createNode('ground-floor', { tiles: [{ x: 0, y: 0 }], layer: 1 })

// Same coordinates, different layers
console.log(graph.getNodeAt(0, 0, 0)) // 'basement'
console.log(graph.getNodeAt(0, 0, 1)) // 'ground-floor'

// Zones
graph.setZone('great-hall', 'castle')
graph.setZone('throne-room', 'castle')
const castleRooms = graph.getNodesInZone('castle')
console.log(castleRooms) // ['great-hall', 'throne-room']
```

## Key Points

- **Layer defaults to 1** — If you don't specify a layer, nodes are on layer 1. `getNodeAt(x, y)` searches layer 1 by default.
- **Multi-tile nodes share the same ID** — All tiles of a multi-tile node return the same node ID. The node is one entity occupying multiple positions.
- **Zones are independent of layers** — A zone can contain nodes from any layer. They're logical groups, not spatial ones.
- **`getBounds()` returns the bounding box** — For multi-tile nodes, get the min/max coordinates to know the node's extent.

## Examples

### Multi-Tile Rooms

Model rooms that span multiple grid cells.

```typescript
// An L-shaped room
graph.createNode('l-room', {
  name: 'L-Shaped Chamber',
  tiles: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 0 }
  ]
})

// Get all tiles
const tiles = graph.getTiles('l-room')
console.log(tiles)
// [{ x: 0, y: 0, layer: 1 }, { x: 0, y: 1, layer: 1 }, ...]

// Get bounding box
const bounds = graph.getBounds('l-room')
console.log(bounds)
// { minX: 0, maxX: 1, minY: 0, maxY: 2 }
```

### Multi-Floor Buildings

Connect floors with UP/DOWN directions.

```typescript
graph.createNode('ground', { layer: 1 })
graph.createNode('upstairs', { layer: 2 })
graph.createNode('basement', { layer: 0 })

graph.connect('ground', Direction.UP, 'upstairs')
graph.connect('ground', Direction.DOWN, 'basement')

// Query nodes by layer
const groundFloor = graph.getNodesInLayer(1)
console.log(groundFloor) // ['ground']
```

### Zone-Based Queries

Group nodes for game logic.

```typescript
// Set up zones
graph.setZone('shop1', 'market')
graph.setZone('shop2', 'market')
graph.setZone('shop3', 'market')
graph.setZone('castle-gate', 'castle')
graph.setZone('throne-room', 'castle')

// Get all market shops
const marketShops = graph.getNodesInZone('market')
console.log(marketShops) // ['shop1', 'shop2', 'shop3']

// Check a node's zone
const zone = graph.getZone('throne-room')
console.log(zone) // 'castle'

// Remove from zone
graph.removeZone('shop1')
console.log(graph.getZone('shop1')) // null
```

### Connecting Multi-Tile Nodes at Specific Tiles

Specify which tiles form the connection point.

```typescript
graph.createNode('hall', {
  tiles: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
})
graph.createNode('kitchen', {
  tiles: [{ x: 3, y: 0 }]
})

// Connect from the east side of hall to kitchen
graph.connect('hall', Direction.EAST, 'kitchen', {
  fromTile: { x: 2, y: 0 },
  toTile: { x: 3, y: 0 }
})

const conn = graph.getConnection('hall', Direction.EAST)
console.log(conn?.fromTile) // { x: 2, y: 0 }
console.log(conn?.toTile)   // { x: 3, y: 0 }
```

## Related

- **[Working with Layers](Guide-Working-With-Layers)** — Building multi-floor structures
- **[Nodes and Connections](Concept-Nodes-And-Connections)** — Basic node concepts
- **[Spatial Features API](API-Spatial-Features)** — Full method reference
