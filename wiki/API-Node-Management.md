# Node Management API

Methods for creating, reading, updating, and deleting nodes in the graph.

---

## `createNode()`

Creates a new node with the given ID and optional metadata.

**Signature:**

```typescript
createNode(id: string, options?: CreateNodeOptions): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the node |
| `options` | `CreateNodeOptions` | No | Node configuration and metadata |

**Returns:** `void`

**Example:**

```typescript
// Simple node
graph.createNode('entrance')

// Node with metadata
graph.createNode('library', {
  name: 'Ancient Library',
  description: 'Dusty tomes line the walls.',
  customProp: 'any value'
})

// Node with tiles and layer
graph.createNode('great-hall', {
  name: 'Great Hall',
  tiles: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
  layer: 2
})
```

**Throws:**

- `ValidationError` — When node ID is empty or already exists

---

## `getNode()`

Retrieves node data by ID.

**Signature:**

```typescript
getNode(id: string): NodeData | null
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | The node ID to look up |

**Returns:** `NodeData | null` — The node data, or null if not found

**Example:**

```typescript
const node = graph.getNode('library')
if (node) {
  console.log(node.id)              // 'library'
  console.log(node.metadata.name)   // 'Ancient Library'
  console.log(node.layer)           // 1 (default)
}
```

---

## `hasNode()`

Checks if a node exists.

**Signature:**

```typescript
hasNode(id: string): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | The node ID to check |

**Returns:** `boolean` — True if node exists

**Example:**

```typescript
if (graph.hasNode('secret-room')) {
  console.log('Secret room exists!')
}
```

---

## `removeNode()`

Removes a node and all its connections.

**Signature:**

```typescript
removeNode(id: string): NodeData
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | The node ID to remove |

**Returns:** `NodeData` — The removed node's data

**Example:**

```typescript
const removed = graph.removeNode('old-room')
console.log('Removed:', removed.metadata.name)

// All connections to/from this node are also removed
```

**Throws:**

- `ValidationError` — When node does not exist

---

## `getAllNodes()`

Returns all node IDs in the graph.

**Signature:**

```typescript
getAllNodes(): string[]
```

**Returns:** `string[]` — Array of all node IDs

**Example:**

```typescript
const nodes = graph.getAllNodes()
console.log(`Graph has ${nodes.length} nodes`)
nodes.forEach(id => console.log(`  - ${id}`))
```

---

## Types

### `CreateNodeOptions`

Options for creating a node.

```typescript
interface CreateNodeOptions {
  name?: string
  description?: string
  tiles?: TilePosition[]
  layer?: number
  [key: string]: unknown
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | No | Display name for the node |
| `description` | `string` | No | Description text |
| `tiles` | `TilePosition[]` | No | Grid positions this node occupies |
| `layer` | `number` | No | Vertical layer. Default: `1` |
| `[key]` | `unknown` | No | Any additional custom properties |

### `NodeData`

Data structure for a node.

```typescript
interface NodeData {
  id: string
  metadata: NodeMetadata
  tiles?: TilePosition[]
  layer: number
  zone?: string
}
```

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The node's unique identifier |
| `metadata` | `NodeMetadata` | All metadata properties (name, description, custom) |
| `tiles` | `TilePosition[]` | Grid positions (if specified) |
| `layer` | `number` | Vertical layer |
| `zone` | `string` | Zone ID (if assigned) |

### `TilePosition`

Grid coordinates for a tile.

```typescript
interface TilePosition {
  x: number
  y: number
  layer?: number
}
```

### `NodeMetadata`

Flexible metadata container.

```typescript
type NodeMetadata = Record<string, unknown>
```
