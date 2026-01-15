# Graph Creation and Types API

Factory function for creating spatial graphs and TypeScript type definitions.

---

## `createSpatialGraph()`

Creates a new spatial graph instance for managing nodes, connections, and pathfinding.

**Signature:**

```typescript
function createSpatialGraph(options?: SpatialGraphOptions): SpatialGraph
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `SpatialGraphOptions` | No | Configuration options for the graph |

**Returns:** `SpatialGraph` — A new graph instance with all management methods

**Example:**

```typescript
import { createSpatialGraph } from '@motioneffector/spatial'

// Basic usage
const graph = createSpatialGraph()

// With flag store for conditional gates
const graphWithFlags = createSpatialGraph({
  flagStore: {
    check: (condition) => gameState.evaluate(condition)
  }
})

// With custom traversal logic
const graphWithCustomTraversal = createSpatialGraph({
  canTraverse: (connection, gate, context) => {
    if (context.godMode) return { allowed: true }
    // Default gate logic...
    return { allowed: true }
  }
})
```

---

## Types

### `SpatialGraphOptions`

Configuration options for creating a graph.

```typescript
interface SpatialGraphOptions {
  flagStore?: {
    check: (condition: Condition) => boolean
  }
  canTraverse?: CanTraverseFunction
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `flagStore` | `{ check: (condition: Condition) => boolean }` | No | Flag store for evaluating conditional gates |
| `canTraverse` | `CanTraverseFunction` | No | Custom function to override default traversal logic |

### `SpatialGraph`

The main graph interface with all management methods.

```typescript
interface SpatialGraph {
  // Node management
  createNode: (id: string, options?: CreateNodeOptions) => void
  getNode: (id: string) => NodeData | null
  hasNode: (id: string) => boolean
  removeNode: (id: string) => NodeData
  getAllNodes: () => string[]

  // Connection management
  connect: (from: string, direction: Direction, to: string, options?: ConnectOptions) => void
  disconnect: (from: string, direction: Direction, options?: { bidirectional?: boolean }) => void
  getConnection: (from: string, direction: Direction) => ConnectionData | null
  getExits: (nodeId: string) => ExitInfo[]
  getDestination: (from: string, direction: Direction) => string | null

  // Gate system
  setGate: (from: string, direction: Direction, gate: Gate) => void
  updateGate: (from: string, direction: Direction, updates: Partial<Gate>) => void
  removeGate: (from: string, direction: Direction) => void
  getGate: (from: string, direction: Direction) => Gate | null

  // Traversal
  canTraverse: (from: string, direction: Direction, context?: TraversalContext) => TraversalResult

  // Pathfinding
  findPath: (from: string, to: string, options?: PathfindingOptions) => string[] | null
  getDistance: (from: string, to: string, options?: PathfindingOptions) => number
  canReach: (from: string, to: string, options?: PathfindingOptions) => boolean
  getReachable: (from: string, options?: ReachableOptions) => string[]

  // Spatial features
  getNodeAt: (x: number, y: number, layer?: number) => string | null
  getTiles: (nodeId: string) => TilePosition[]
  getBounds: (nodeId: string) => BoundingBox | null
  getNodesInLayer: (layer: number) => string[]
  setZone: (nodeId: string, zoneId: string) => void
  getZone: (nodeId: string) => string | null
  getNodesInZone: (zoneId: string) => string[]
  removeZone: (nodeId: string) => void

  // Custom directions
  registerDirection: (direction: string, options: RegisterDirectionOptions) => void

  // Graph analysis
  getOrphans: () => string[]
  getDeadEnds: () => string[]
  getSubgraphs: () => string[][]
  validate: () => ValidationResult

  // Events
  on: (event: SpatialGraphEvent, callback: EventCallback) => () => void

  // Serialization
  serialize: () => SerializedGraph
  deserialize: (data: SerializedGraph) => void
}
```

### `Direction`

Direction constants and utilities.

```typescript
const Direction = {
  NORTH: 'NORTH',
  NORTHEAST: 'NORTHEAST',
  EAST: 'EAST',
  SOUTHEAST: 'SOUTHEAST',
  SOUTH: 'SOUTH',
  SOUTHWEST: 'SOUTHWEST',
  WEST: 'WEST',
  NORTHWEST: 'NORTHWEST',
  UP: 'UP',
  DOWN: 'DOWN',
  IN: 'IN',
  OUT: 'OUT',
} as const

type Direction = (typeof Direction)[keyof typeof Direction]
```

### `Condition`

Condition structure for conditional gates (integrates with @motioneffector/flags).

```typescript
type Condition = {
  check: [string, string, unknown]
}
```

### `TraversalContext`

Context passed to traversal checks.

```typescript
interface TraversalContext {
  inventory?: string[]
  flagStore?: {
    check: (condition: Condition) => boolean
  }
  discovered?: string[]
  [key: string]: unknown
}
```

### `TraversalResult`

Result of a traversal check.

```typescript
interface TraversalResult {
  allowed: boolean
  reason?: string
  gateId?: string
}
```

### `CanTraverseFunction`

Custom traversal check function signature.

```typescript
type CanTraverseFunction = (
  connection: ConnectionData,
  gate: Gate | null,
  context: TraversalContext
) => TraversalResult
```

---

## Errors

### `ValidationError`

Thrown when validation fails (invalid parameters, missing nodes, etc.).

```typescript
import { ValidationError } from '@motioneffector/spatial'

try {
  graph.createNode('')  // Empty ID
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message)
  }
}
```

### `SpatialError`

Base error class for all spatial errors.

```typescript
import { SpatialError } from '@motioneffector/spatial'
```
