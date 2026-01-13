# @motioneffector/spatial

A TypeScript library for building directional graphs for room-based spatial navigation. Perfect for text adventures, MUDs, roguelikes, and any game or application that needs to model connected spaces with directional movement, locked doors, hidden passages, and pathfinding.

[![npm version](https://img.shields.io/npm/v/@motioneffector/spatial.svg)](https://www.npmjs.com/package/@motioneffector/spatial)
[![license](https://img.shields.io/npm/l/@motioneffector/spatial.svg)](https://github.com/motioneffector/spatial/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @motioneffector/spatial
```

## Quick Start

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

// Create a graph
const graph = createSpatialGraph()

// Add rooms
graph.createNode('hall', { name: 'Grand Hall' })
graph.createNode('garden', { name: 'Garden' })

// Connect them
graph.connect('hall', 'garden', Direction.NORTH)

// Navigate
const exits = graph.getExits('hall')
console.log(exits) // [{ direction: 'NORTH', target: 'garden', allowed: true }]
```

## Features

- **Directional Navigation** - Compass directions (N, S, E, W, NE, SE, SW, NW), vertical (UP, DOWN), and special (IN, OUT)
- **Gated Connections** - Locked doors, hidden passages, one-way connections, and conditional barriers
- **Pathfinding** - Find shortest paths between rooms with Dijkstra's algorithm
- **Tile-Based Positioning** - Optional grid coordinates for visual mapping
- **Event System** - Subscribe to graph changes (node creation, connections, modifications)
- **Serialization** - Save and load graph state
- Full TypeScript support with complete type definitions
- Zero dependencies
- Tree-shakeable ESM build

## API Reference

### `createSpatialGraph(options?)`

Creates a new spatial graph instance.

**Options:**
- `flagStore` - Optional flag store for conditional gates (compatible with `@motioneffector/flags`)
- `canTraverse` - Custom traversal logic function (optional)

**Returns:** `SpatialGraph`

**Example:**
```typescript
const graph = createSpatialGraph({
  canTraverse: (connection, gate, context) => {
    // Custom logic
    return { allowed: true }
  }
})
```

### `graph.createNode(id, options?)`

Creates a new node (room/location) in the graph.

**Parameters:**
- `id` - Unique identifier for the node
- `options` - Optional metadata
  - `name` - Display name for the node
  - `description` - Description text
  - `tiles` - Array of tile positions `{ x, y, layer? }`
  - `layer` - Layer number (default: 0)
  - `[key: string]` - Any additional metadata

**Returns:** `NodeData`

**Example:**
```typescript
graph.createNode('tavern', {
  name: 'The Prancing Pony',
  description: 'A cozy tavern with a roaring fire',
  tiles: [{ x: 10, y: 5 }],
  npcCount: 3
})
```

### `graph.connect(fromId, toId, direction, options?)`

Connects two nodes with a directional connection.

**Parameters:**
- `fromId` - Source node ID
- `toId` - Target node ID
- `direction` - Direction constant from `Direction`
- `options` - Connection options
  - `bidirectional` - Create reverse connection (default: true)
  - `cost` - Pathfinding cost (default: 1)
  - `gate` - Gate configuration object
  - `fromTile` - Specific tile in source node
  - `toTile` - Specific tile in target node

**Example:**
```typescript
// Simple connection
graph.connect('hall', 'cellar', Direction.DOWN)

// Locked door
graph.connect('treasury', 'vault', Direction.EAST, {
  gate: {
    id: 'vault-door',
    locked: true,
    keyId: 'golden-key',
    description: 'A massive steel door',
    blockedMessage: 'The door is locked. You need a golden key.'
  }
})

// Hidden passage
graph.connect('study', 'secret-room', Direction.NORTH, {
  gate: {
    id: 'bookshelf',
    hidden: true,
    description: 'A bookshelf slides aside'
  },
  bidirectional: false
})

// Conditional gate (requires @motioneffector/flags)
graph.connect('throne', 'sanctum', Direction.UP, {
  gate: {
    id: 'magic-barrier',
    condition: {
      check: ['player.level', 'gte', 10]
    },
    blockedMessage: 'You are not powerful enough to pass'
  }
})
```

### `graph.getExits(nodeId, context?)`

Gets all available exits from a node, respecting gates and traversal rules.

**Parameters:**
- `nodeId` - Node to get exits from
- `context` - Traversal context
  - `inventory` - Array of key IDs the player has
  - `discovered` - Array of gate IDs that have been discovered
  - `flagStore` - Flag store for condition checks

**Returns:** `ExitInfo[]`

**Example:**
```typescript
const exits = graph.getExits('hall', {
  inventory: ['brass-key'],
  discovered: ['secret-passage-1']
})

exits.forEach(exit => {
  if (exit.allowed) {
    console.log(`Go ${exit.direction} to ${exit.target}`)
  } else {
    console.log(`${exit.direction}: ${exit.reason}`)
  }
})
```

### `graph.findPath(fromId, toId, options?)`

Finds the shortest path between two nodes using Dijkstra's algorithm.

**Parameters:**
- `fromId` - Starting node ID
- `toId` - Destination node ID
- `options` - Pathfinding options
  - `context` - Traversal context (inventory, discovered, etc.)
  - `maxCost` - Maximum total cost (optional)

**Returns:** `{ path: string[], cost: number } | null`

**Example:**
```typescript
const result = graph.findPath('entrance', 'treasure', {
  context: { inventory: ['master-key'] },
  maxCost: 10
})

if (result) {
  console.log(`Path: ${result.path.join(' -> ')}`)
  console.log(`Cost: ${result.cost}`)
}
```

### `graph.getReachable(nodeId, options?)`

Gets all nodes reachable from a given starting node.

**Parameters:**
- `nodeId` - Starting node ID
- `options` - Options
  - `context` - Traversal context
  - `maxCost` - Maximum cost to travel (optional)
  - `zone` - Only include nodes in this zone (optional)

**Returns:** `string[]` - Array of reachable node IDs

**Example:**
```typescript
const reachable = graph.getReachable('spawn', {
  maxCost: 5,
  context: { inventory: [] }
})
console.log(`You can reach ${reachable.length} locations`)
```

### `graph.getNode(id)` / `graph.getNodes()`

Retrieves node data.

**Returns:** `NodeData | null` or `NodeData[]`

### `graph.updateNode(id, metadata)`

Updates node metadata (merges with existing data).

**Example:**
```typescript
graph.updateNode('tavern', {
  name: 'The Prancing Pony (Closed)',
  isOpen: false
})
```

### `graph.deleteNode(id)`

Removes a node and all its connections.

### `graph.getConnection(fromId, direction)`

Gets connection data for a specific direction from a node.

**Returns:** `ConnectionData | null`

### `graph.deleteConnection(fromId, direction)`

Removes a connection in a specific direction.

### `graph.getZoneNodes(zone)`

Gets all nodes in a specific zone.

**Returns:** `NodeData[]`

### `graph.getNodeAtTile(x, y, layer?)`

Finds the node at specific grid coordinates.

**Returns:** `NodeData | null`

### `graph.getBounds(nodeIds?)`

Calculates bounding box for nodes (requires tile positions).

**Returns:** `BoundingBox | null` - `{ minX, minY, maxX, maxY, minLayer, maxLayer }`

### `graph.validate()`

Validates graph integrity (orphaned nodes, invalid connections, etc.).

**Returns:** `ValidationResult` - `{ valid: boolean, errors: string[] }`

### `graph.serialize()` / `graph.deserialize(data)`

Saves and loads graph state as JSON.

**Example:**
```typescript
const data = graph.serialize()
localStorage.setItem('map', JSON.stringify(data))

// Later...
const saved = JSON.parse(localStorage.getItem('map'))
graph.deserialize(saved)
```

### `graph.on(event, callback)` / `graph.off(event, callback)`

Event system for tracking changes.

**Events:**
- `'nodeCreated'` - `(node: NodeData) => void`
- `'nodeUpdated'` - `(id: string, metadata: NodeMetadata) => void`
- `'nodeDeleted'` - `(id: string) => void`
- `'connectionCreated'` - `(from: string, to: string, direction: Direction) => void`
- `'connectionDeleted'` - `(from: string, direction: Direction) => void`

**Example:**
```typescript
graph.on('nodeCreated', (node) => {
  console.log(`New location discovered: ${node.metadata.name}`)
})
```

## Direction

The `Direction` object provides standard direction constants:

```typescript
import { Direction } from '@motioneffector/spatial'

Direction.NORTH
Direction.NORTHEAST
Direction.EAST
Direction.SOUTHEAST
Direction.SOUTH
Direction.SOUTHWEST
Direction.WEST
Direction.NORTHWEST
Direction.UP
Direction.DOWN
Direction.IN
Direction.OUT
```

**Utilities:**

```typescript
Direction.opposite('NORTH') // Returns 'SOUTH'
Direction.parse('n') // Returns 'NORTH'
Direction.parse('northeast') // Returns 'NORTHEAST'
```

**Custom Directions:**

```typescript
import { registerCustomDirection } from '@motioneffector/spatial'

registerCustomDirection('PORTAL', {
  opposite: null, // No opposite direction
  aliases: ['p', 'portal', 'teleport']
})
```

## Error Handling

```typescript
import { SpatialError, ValidationError } from '@motioneffector/spatial'

try {
  graph.createNode('duplicate', {})
} catch (e) {
  if (e instanceof ValidationError) {
    console.error('Validation failed:', e.message)
  } else if (e instanceof SpatialError) {
    console.error('Spatial error:', e.message)
  }
}
```

## Demo

Try the [interactive demo](https://motioneffector.github.io/spatial/demo.html) to see the library in action.

## Browser Support

Works in all modern browsers (ES2022+). For older browsers, use a transpiler.

## License

MIT © [motioneffector](https://github.com/motioneffector)
