# Pathfinding API

Methods for finding paths, calculating distances, and determining reachability.

---

## `findPath()`

Finds the optimal path between two nodes using Dijkstra's algorithm.

**Signature:**

```typescript
findPath(
  from: string,
  to: string,
  options?: PathfindingOptions
): string[] | null
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Starting node ID |
| `to` | `string` | Yes | Destination node ID |
| `options` | `PathfindingOptions` | No | Pathfinding configuration |

**Returns:** `string[] | null` — Array of node IDs from start to finish, or null if no path exists

**Example:**

```typescript
// Simple pathfinding
const path = graph.findPath('entrance', 'treasury')
console.log(path)  // ['entrance', 'hallway', 'treasury']

// With player context (respects locked gates)
const pathWithKey = graph.findPath('entrance', 'treasury', {
  context: { inventory: ['vault-key'] }
})

// Limit path length
const shortPath = graph.findPath('a', 'b', { maxLength: 3 })
// Returns null if path requires more than 3 nodes

// Same node returns single-element array
const samePath = graph.findPath('entrance', 'entrance')
console.log(samePath)  // ['entrance']
```

---

## `getDistance()`

Calculates the total cost to travel between two nodes.

**Signature:**

```typescript
getDistance(
  from: string,
  to: string,
  options?: PathfindingOptions
): number
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Starting node ID |
| `to` | `string` | Yes | Destination node ID |
| `options` | `PathfindingOptions` | No | Pathfinding configuration |

**Returns:** `number` — Total cost of the path, or `Infinity` if unreachable

**Example:**

```typescript
const distance = graph.getDistance('entrance', 'treasury')
console.log(distance)  // 2 (sum of connection costs)

// Same node has distance 0
console.log(graph.getDistance('entrance', 'entrance'))  // 0

// Unreachable returns Infinity
console.log(graph.getDistance('island1', 'island2'))  // Infinity
```

---

## `canReach()`

Checks if a path exists between two nodes.

**Signature:**

```typescript
canReach(
  from: string,
  to: string,
  options?: PathfindingOptions
): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Starting node ID |
| `to` | `string` | Yes | Destination node ID |
| `options` | `PathfindingOptions` | No | Pathfinding configuration |

**Returns:** `boolean` — True if a valid path exists

**Example:**

```typescript
if (graph.canReach('entrance', 'boss-room')) {
  console.log('Boss room is accessible')
}

// With context
const canReachWithKey = graph.canReach('entrance', 'vault', {
  context: { inventory: ['vault-key'] }
})
```

---

## `getReachable()`

Returns all nodes reachable from a starting point.

**Signature:**

```typescript
getReachable(from: string, options?: ReachableOptions): string[]
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Starting node ID |
| `options` | `ReachableOptions` | No | Reachability configuration |

**Returns:** `string[]` — Array of all reachable node IDs (including start)

**Example:**

```typescript
// All reachable nodes
const all = graph.getReachable('entrance')
console.log(all)  // ['entrance', 'hallway', 'library', ...]

// Within distance limit
const nearby = graph.getReachable('entrance', { maxDistance: 2 })
// Only nodes within 2 hops

// With context (respects gates)
const withKey = graph.getReachable('entrance', {
  context: { inventory: ['master-key'] }
})
```

---

## Types

### `PathfindingOptions`

Options for pathfinding operations.

```typescript
interface PathfindingOptions {
  avoidLocked?: boolean
  maxLength?: number
  context?: TraversalContext
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `avoidLocked` | `boolean` | No | Whether to avoid locked gates entirely |
| `maxLength` | `number` | No | Maximum number of nodes in path |
| `context` | `TraversalContext` | No | Player context for gate evaluation |

### `ReachableOptions`

Options for reachability queries.

```typescript
interface ReachableOptions {
  maxDistance?: number
  context?: TraversalContext
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `maxDistance` | `number` | No | Maximum hop count from start |
| `context` | `TraversalContext` | No | Player context for gate evaluation |

---

## Pathfinding Behavior

### Weighted Paths

Pathfinding uses connection costs to find the optimal (lowest total cost) path:

```typescript
// Path via A has lower total cost
graph.connect('start', Direction.NORTH, 'a', { cost: 1 })
graph.connect('a', Direction.EAST, 'end', { cost: 1 })

// Path via B has higher total cost
graph.connect('start', Direction.EAST, 'b', { cost: 5 })
graph.connect('b', Direction.NORTH, 'end', { cost: 1 })

const path = graph.findPath('start', 'end')
// Returns ['start', 'a', 'end'] (cost 2, not 6)
```

### Gate Handling

Locked gates block paths unless the context includes the required key:

```typescript
graph.setGate('a', Direction.EAST, {
  id: 'door',
  locked: true,
  keyId: 'key'
})

// Without key: blocked path
graph.findPath('start', 'end', { context: { inventory: [] } })
// Returns null or finds alternative route

// With key: path allowed
graph.findPath('start', 'end', { context: { inventory: ['key'] } })
// Returns path through the gate
```
