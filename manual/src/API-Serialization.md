# Serialization API

Methods for saving and loading graph state.

---

## `serialize()`

Exports the entire graph state as a JSON-compatible object.

**Signature:**

```typescript
serialize(): SerializedGraph
```

**Returns:** `SerializedGraph` — Plain object containing all graph data

**Example:**

```typescript
graph.createNode('entrance', { name: 'Entrance Hall' })
graph.createNode('library', { name: 'Library' })
graph.connect('entrance', Direction.NORTH, 'library')
graph.setGate('entrance', Direction.NORTH, {
  id: 'door',
  locked: true
})

const data = graph.serialize()
console.log(data)
// {
//   nodes: {
//     entrance: { id: 'entrance', metadata: {...}, layer: 1 },
//     library: { id: 'library', metadata: {...}, layer: 1 }
//   },
//   connections: {
//     entrance: { NORTH: { target: 'library', ... } },
//     library: { SOUTH: { target: 'entrance', ... } }
//   }
// }

// Convert to JSON string for storage
const json = JSON.stringify(data)
localStorage.setItem('game-map', json)
```

---

## `deserialize()`

Restores graph state from serialized data.

**Signature:**

```typescript
deserialize(data: SerializedGraph): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `SerializedGraph` | Yes | Previously serialized graph data |

**Returns:** `void`

**Example:**

```typescript
// Load from storage
const json = localStorage.getItem('game-map')
const data = JSON.parse(json)

// Create new graph and restore
const graph = createSpatialGraph()
graph.deserialize(data)

// Graph is now restored
console.log(graph.hasNode('entrance'))  // true
console.log(graph.getGate('entrance', Direction.NORTH)?.locked)  // true
```

**Throws:**

- `ValidationError` — When data is malformed (missing nodes object)

**Important:** `deserialize()` clears the graph before restoring. Any existing nodes are removed.

---

## Types

### `SerializedGraph`

Structure of serialized graph data.

```typescript
interface SerializedGraph {
  nodes: Record<string, NodeData>
  connections: Record<string, Record<Direction, ConnectionData>>
  customDirections?: Record<string, Direction | null>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `nodes` | `Record<string, NodeData>` | Map of node ID to node data |
| `connections` | `Record<string, Record<Direction, ConnectionData>>` | Nested map of connections |
| `customDirections` | `Record<string, Direction \| null>` | Custom direction opposite mappings |

---

## Serialization Details

### What's Included

The serialized data contains:

- All nodes with their metadata, tiles, layer, and zone
- All connections with direction, target, cost, and tile positions
- All gates with their full configuration
- Custom direction registrations (if any)

### What's NOT Included

- Event listeners (must be re-registered after deserialize)
- Custom `canTraverse` function (pass again to `createSpatialGraph`)
- Flag store reference (pass again to `createSpatialGraph`)

---

## Common Patterns

### Save/Load Functions

```typescript
function saveGame(graph: SpatialGraph, slot: string): void {
  const data = graph.serialize()
  localStorage.setItem(`save-${slot}`, JSON.stringify(data))
}

function loadGame(slot: string): SpatialGraph | null {
  const json = localStorage.getItem(`save-${slot}`)
  if (!json) return null

  const data = JSON.parse(json)
  const graph = createSpatialGraph()
  graph.deserialize(data)
  return graph
}
```

### Validation After Load

```typescript
function loadAndValidate(json: string): SpatialGraph {
  const data = JSON.parse(json)
  const graph = createSpatialGraph()
  graph.deserialize(data)

  const result = graph.validate()
  if (!result.valid) {
    console.error('Corrupted save:', result.errors)
    throw new Error('Save file corrupted')
  }

  return graph
}
```

### Pretty-Print for Debugging

```typescript
const data = graph.serialize()
const prettyJson = JSON.stringify(data, null, 2)
console.log(prettyJson)
```

### Copying a Graph

```typescript
function cloneGraph(source: SpatialGraph): SpatialGraph {
  const data = source.serialize()
  const clone = createSpatialGraph()
  clone.deserialize(data)
  return clone
}
```

---

## Error Handling

### Malformed Data

```typescript
try {
  graph.deserialize({})  // Missing 'nodes' property
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid save data:', error.message)
  }
}
```

### JSON Parse Errors

```typescript
try {
  const data = JSON.parse(corruptedJson)
  graph.deserialize(data)
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error('Save file is not valid JSON')
  } else if (error instanceof ValidationError) {
    console.error('Save file structure is invalid')
  }
}
```

### Version Migration

```typescript
interface VersionedSave {
  version: number
  data: SerializedGraph
}

function loadWithMigration(json: string): SpatialGraph {
  const save: VersionedSave = JSON.parse(json)

  if (save.version < 2) {
    // Migrate old format
    save.data = migrateV1ToV2(save.data)
  }

  const graph = createSpatialGraph()
  graph.deserialize(save.data)
  return graph
}
```
