# Graph Analysis API

Methods for analyzing graph structure, finding problems, and validating integrity.

---

## `getOrphans()`

Returns nodes with no connections (neither incoming nor outgoing).

**Signature:**

```typescript
getOrphans(): string[]
```

**Returns:** `string[]` — Array of orphan node IDs

**Example:**

```typescript
graph.createNode('connected-1')
graph.createNode('connected-2')
graph.createNode('orphan')

graph.connect('connected-1', Direction.NORTH, 'connected-2')

const orphans = graph.getOrphans()
console.log(orphans)  // ['orphan']
```

---

## `getDeadEnds()`

Returns nodes with exactly one connection (one exit).

**Signature:**

```typescript
getDeadEnds(): string[]
```

**Returns:** `string[]` — Array of dead end node IDs

**Example:**

```typescript
graph.createNode('entrance')
graph.createNode('hallway')
graph.createNode('treasury')

graph.connect('entrance', Direction.NORTH, 'hallway')
graph.connect('hallway', Direction.EAST, 'treasury')

const deadEnds = graph.getDeadEnds()
console.log(deadEnds)  // ['entrance', 'treasury']
// 'hallway' has 2 exits (SOUTH and EAST)
// 'entrance' has 1 exit (NORTH)
// 'treasury' has 1 exit (WEST)
```

---

## `getSubgraphs()`

Returns groups of connected nodes. Multiple groups indicate disconnected areas.

**Signature:**

```typescript
getSubgraphs(): string[][]
```

**Returns:** `string[][]` — Array of node ID arrays, one per connected group

**Example:**

```typescript
// Two separate areas
graph.createNode('island-1a')
graph.createNode('island-1b')
graph.createNode('island-2a')
graph.createNode('island-2b')

graph.connect('island-1a', Direction.NORTH, 'island-1b')
graph.connect('island-2a', Direction.NORTH, 'island-2b')
// No connection between islands

const subgraphs = graph.getSubgraphs()
console.log(subgraphs)
// [
//   ['island-1a', 'island-1b'],
//   ['island-2a', 'island-2b']
// ]

// Single connected graph
graph.connect('island-1b', Direction.EAST, 'island-2a')
const connected = graph.getSubgraphs()
console.log(connected)
// [['island-1a', 'island-1b', 'island-2a', 'island-2b']]
```

---

## `validate()`

Checks graph structural integrity.

**Signature:**

```typescript
validate(): ValidationResult
```

**Returns:** `ValidationResult` — Validation result with any errors

**Example:**

```typescript
// Valid graph
graph.createNode('a')
graph.createNode('b')
graph.connect('a', Direction.NORTH, 'b')

const valid = graph.validate()
console.log(valid)  // { valid: true }

// After deserializing corrupted data
const corrupted = graph.validate()
console.log(corrupted)
// {
//   valid: false,
//   errors: ['Connection from "a" direction "EAST" to non-existent node "missing"']
// }
```

---

## Types

### `ValidationResult`

Result of graph validation.

```typescript
interface ValidationResult {
  valid: boolean
  errors?: string[]
}
```

| Property | Type | Description |
|----------|------|-------------|
| `valid` | `boolean` | Whether the graph is structurally valid |
| `errors` | `string[]` | Array of error descriptions (if invalid) |

---

## Analysis Use Cases

### Development-Time Validation

Check maps during build:

```typescript
const orphans = graph.getOrphans()
if (orphans.length > 0) {
  throw new Error(`Orphan rooms found: ${orphans.join(', ')}`)
}

const subgraphs = graph.getSubgraphs()
if (subgraphs.length > 1) {
  throw new Error(`Disconnected areas: ${subgraphs.length}`)
}
```

### Player Exploration Stats

Track discovery progress:

```typescript
const totalRooms = graph.getAllNodes().length
const deadEnds = graph.getDeadEnds()

console.log(`Total rooms: ${totalRooms}`)
console.log(`Dead ends: ${deadEnds.length}`)
console.log(`Dead end ratio: ${(deadEnds.length / totalRooms * 100).toFixed(1)}%`)
```

### Post-Load Validation

Verify save data integrity:

```typescript
graph.deserialize(savedData)

const result = graph.validate()
if (!result.valid) {
  console.error('Save file corrupted:', result.errors)
  // Fallback to fresh graph
}
```
