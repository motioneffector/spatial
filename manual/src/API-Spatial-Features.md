# Spatial Features API

Methods for grid-based positioning, layers, and zone management.

---

## `getNodeAt()`

Returns the node at a specific grid position.

**Signature:**

```typescript
getNodeAt(x: number, y: number, layer?: number): string | null
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `x` | `number` | Yes | X coordinate |
| `y` | `number` | Yes | Y coordinate |
| `layer` | `number` | No | Layer to search. Default: `1` |

**Returns:** `string | null` — Node ID at position, or null if empty

**Example:**

```typescript
graph.createNode('hall', { tiles: [{ x: 5, y: 3 }] })

const node = graph.getNodeAt(5, 3)
console.log(node)  // 'hall'

// Different layer
const basement = graph.getNodeAt(5, 3, 0)
console.log(basement)  // null (nothing at this layer)
```

---

## `getTiles()`

Returns all tile positions for a node.

**Signature:**

```typescript
getTiles(nodeId: string): TilePosition[]
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `nodeId` | `string` | Yes | The node ID |

**Returns:** `TilePosition[]` — Array of tile positions (empty if no tiles)

**Example:**

```typescript
graph.createNode('great-hall', {
  tiles: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
})

const tiles = graph.getTiles('great-hall')
console.log(tiles)
// [{ x: 0, y: 0, layer: 1 }, { x: 1, y: 0, layer: 1 }, { x: 2, y: 0, layer: 1 }]

// Node without tiles
const noTiles = graph.getTiles('abstract-node')
console.log(noTiles)  // []
```

---

## `getBounds()`

Returns the bounding box for a multi-tile node.

**Signature:**

```typescript
getBounds(nodeId: string): BoundingBox | null
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `nodeId` | `string` | Yes | The node ID |

**Returns:** `BoundingBox | null` — Bounding box, or null if no tiles

**Example:**

```typescript
graph.createNode('l-shaped', {
  tiles: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 }
  ]
})

const bounds = graph.getBounds('l-shaped')
console.log(bounds)
// { minX: 0, maxX: 1, minY: 0, maxY: 2 }
```

---

## `getNodesInLayer()`

Returns all nodes on a specific layer.

**Signature:**

```typescript
getNodesInLayer(layer: number): string[]
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `layer` | `number` | Yes | Layer number to query |

**Returns:** `string[]` — Array of node IDs on that layer

**Example:**

```typescript
graph.createNode('basement', { layer: 0 })
graph.createNode('ground', { layer: 1 })
graph.createNode('upstairs', { layer: 2 })
graph.createNode('also-ground', { layer: 1 })

const groundFloor = graph.getNodesInLayer(1)
console.log(groundFloor)  // ['ground', 'also-ground']
```

---

## `setZone()`

Assigns a node to a zone.

**Signature:**

```typescript
setZone(nodeId: string, zoneId: string): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `nodeId` | `string` | Yes | Node to assign |
| `zoneId` | `string` | Yes | Zone identifier |

**Returns:** `void`

**Example:**

```typescript
graph.setZone('throne-room', 'castle')
graph.setZone('guard-room', 'castle')
graph.setZone('market-stall', 'town')

// Reassigning overwrites previous zone
graph.setZone('throne-room', 'royal-quarters')
```

**Throws:**

- `ValidationError` — When node does not exist

---

## `getZone()`

Gets the zone ID for a node.

**Signature:**

```typescript
getZone(nodeId: string): string | null
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `nodeId` | `string` | Yes | Node to query |

**Returns:** `string | null` — Zone ID, or null if not in a zone

**Example:**

```typescript
graph.setZone('throne-room', 'castle')

const zone = graph.getZone('throne-room')
console.log(zone)  // 'castle'

const noZone = graph.getZone('wilderness')
console.log(noZone)  // null
```

---

## `getNodesInZone()`

Returns all nodes in a zone.

**Signature:**

```typescript
getNodesInZone(zoneId: string): string[]
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `zoneId` | `string` | Yes | Zone to query |

**Returns:** `string[]` — Array of node IDs in the zone

**Example:**

```typescript
graph.setZone('room-1', 'dungeon')
graph.setZone('room-2', 'dungeon')
graph.setZone('room-3', 'dungeon')
graph.setZone('shop', 'town')

const dungeonRooms = graph.getNodesInZone('dungeon')
console.log(dungeonRooms)  // ['room-1', 'room-2', 'room-3']

const emptyZone = graph.getNodesInZone('nonexistent')
console.log(emptyZone)  // []
```

---

## `removeZone()`

Removes a node from its zone.

**Signature:**

```typescript
removeZone(nodeId: string): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `nodeId` | `string` | Yes | Node to remove from zone |

**Returns:** `void`

**Example:**

```typescript
graph.setZone('room-1', 'dungeon')
console.log(graph.getZone('room-1'))  // 'dungeon'

graph.removeZone('room-1')
console.log(graph.getZone('room-1'))  // null
```

---

## Types

### `TilePosition`

Grid coordinates for a tile.

```typescript
interface TilePosition {
  x: number
  y: number
  layer?: number
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `x` | `number` | Yes | X coordinate |
| `y` | `number` | Yes | Y coordinate |
| `layer` | `number` | No | Layer (defaults to node's layer) |

### `BoundingBox`

Bounding box for multi-tile nodes.

```typescript
interface BoundingBox {
  minX: number
  maxX: number
  minY: number
  maxY: number
}
```

| Property | Type | Description |
|----------|------|-------------|
| `minX` | `number` | Leftmost X coordinate |
| `maxX` | `number` | Rightmost X coordinate |
| `minY` | `number` | Lowest Y coordinate |
| `maxY` | `number` | Highest Y coordinate |
