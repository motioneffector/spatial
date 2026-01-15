# Connection Management API

Methods for creating, removing, and querying connections between nodes.

---

## `connect()`

Creates a connection between two nodes in a direction.

**Signature:**

```typescript
connect(
  from: string,
  direction: Direction,
  to: string,
  options?: ConnectOptions
): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Source node ID |
| `direction` | `Direction` | Yes | Direction of the connection |
| `to` | `string` | Yes | Target node ID |
| `options` | `ConnectOptions` | No | Connection options |

**Returns:** `void`

**Example:**

```typescript
import { Direction } from '@motioneffector/spatial'

// Bidirectional connection (default)
graph.connect('entrance', Direction.NORTH, 'hallway')
// Creates: entrance --NORTH--> hallway
// Creates: hallway --SOUTH--> entrance

// One-way connection
graph.connect('ledge', Direction.DOWN, 'pit', { bidirectional: false })
// Creates: ledge --DOWN--> pit
// No reverse connection

// With cost
graph.connect('swamp-start', Direction.EAST, 'swamp-end', { cost: 5 })

// With tile positions
graph.connect('hall', Direction.EAST, 'room', {
  fromTile: { x: 2, y: 0 },
  toTile: { x: 3, y: 0 }
})
```

**Throws:**

- `ValidationError` — When source or target node does not exist

---

## `disconnect()`

Removes a connection in a direction.

**Signature:**

```typescript
disconnect(
  from: string,
  direction: Direction,
  options?: { bidirectional?: boolean }
): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Source node ID |
| `direction` | `Direction` | Yes | Direction to disconnect |
| `options` | `{ bidirectional?: boolean }` | No | Whether to remove reverse connection. Default: matches original connection |

**Returns:** `void`

**Example:**

```typescript
// Remove connection (and its reverse if bidirectional)
graph.disconnect('entrance', Direction.NORTH)

// Remove only one direction
graph.disconnect('entrance', Direction.NORTH, { bidirectional: false })
```

**Throws:**

- `ValidationError` — When source node does not exist

---

## `getConnection()`

Retrieves connection data for a specific direction.

**Signature:**

```typescript
getConnection(from: string, direction: Direction): ConnectionData | null
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Source node ID |
| `direction` | `Direction` | Yes | Direction to check |

**Returns:** `ConnectionData | null` — Connection data, or null if no connection

**Example:**

```typescript
const conn = graph.getConnection('entrance', Direction.NORTH)
if (conn) {
  console.log('Target:', conn.target)
  console.log('Direction:', conn.direction)
  console.log('Cost:', conn.cost)
  console.log('Gate:', conn.gate)
}
```

---

## `getExits()`

Returns all exits (connections) from a node.

**Signature:**

```typescript
getExits(nodeId: string): ExitInfo[]
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `nodeId` | `string` | Yes | The node to get exits from |

**Returns:** `ExitInfo[]` — Array of exit information

**Example:**

```typescript
const exits = graph.getExits('hub')
exits.forEach(exit => {
  console.log(`${exit.direction} → ${exit.target}`)
  if (exit.gate?.locked) {
    console.log(`  (locked, needs ${exit.gate.keyId})`)
  }
})
```

**Throws:**

- `ValidationError` — When node does not exist

---

## `getDestination()`

Gets the target node ID for a direction, if a connection exists.

**Signature:**

```typescript
getDestination(from: string, direction: Direction): string | null
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Source node ID |
| `direction` | `Direction` | Yes | Direction to check |

**Returns:** `string | null` — Target node ID, or null if no connection

**Example:**

```typescript
const target = graph.getDestination('entrance', Direction.NORTH)
if (target) {
  console.log(`Going north leads to: ${target}`)
} else {
  console.log('Cannot go north from here')
}
```

**Throws:**

- `ValidationError` — When source node does not exist

---

## Types

### `ConnectOptions`

Options for creating a connection.

```typescript
interface ConnectOptions {
  bidirectional?: boolean
  cost?: number
  fromTile?: TilePosition
  toTile?: TilePosition
  gate?: Gate
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `bidirectional` | `boolean` | No | Create reverse connection. Default: `true` |
| `cost` | `number` | No | Traversal cost for pathfinding. Default: `1` |
| `fromTile` | `TilePosition` | No | Source tile position for multi-tile nodes |
| `toTile` | `TilePosition` | No | Target tile position for multi-tile nodes |
| `gate` | `Gate` | No | Gate to add to the connection |

### `ConnectionData`

Data structure for a connection.

```typescript
interface ConnectionData {
  target: string
  direction: Direction
  gate?: Gate | null
  cost?: number
  fromTile?: TilePosition
  toTile?: TilePosition
}
```

### `ExitInfo`

Information about an exit from a node.

```typescript
interface ExitInfo {
  direction: Direction
  target: string
  gate?: Gate | null
  cost?: number
}
```
