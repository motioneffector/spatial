# Events API

Subscribe to graph changes for real-time updates.

---

## `on()`

Subscribes to a graph event.

**Signature:**

```typescript
on(event: SpatialGraphEvent, callback: EventCallback): () => void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `event` | `SpatialGraphEvent` | Yes | Event type to listen for |
| `callback` | `EventCallback` | Yes | Function called when event fires |

**Returns:** `() => void` — Unsubscribe function

**Example:**

```typescript
// Subscribe
const unsubscribe = graph.on('nodeCreated', (nodeId, nodeData) => {
  console.log(`New node: ${nodeId}`)
})

graph.createNode('test')  // Logs: "New node: test"

// Unsubscribe
unsubscribe()
graph.createNode('test2')  // No log
```

---

## Event Types

### `nodeCreated`

Fired when a node is added to the graph.

**Callback Signature:**

```typescript
(nodeId: string, nodeData: NodeData) => void
```

**Example:**

```typescript
graph.on('nodeCreated', (nodeId, nodeData) => {
  console.log('Created:', nodeId)
  console.log('Name:', nodeData.metadata.name)
  console.log('Layer:', nodeData.layer)
})
```

---

### `nodeRemoved`

Fired when a node is removed from the graph.

**Callback Signature:**

```typescript
(nodeId: string) => void
```

**Example:**

```typescript
graph.on('nodeRemoved', (nodeId) => {
  console.log('Removed:', nodeId)
  minimap.removeRoom(nodeId)
})
```

---

### `connectionCreated`

Fired when a connection is created between nodes.

**Callback Signature:**

```typescript
(from: string, direction: Direction, to: string) => void
```

**Example:**

```typescript
graph.on('connectionCreated', (from, direction, to) => {
  console.log(`${from} --${direction}--> ${to}`)
  minimap.addPath(from, to)
})
```

Note: For bidirectional connections, this fires twice (once for each direction).

---

### `connectionRemoved`

Fired when a connection is removed.

**Callback Signature:**

```typescript
(from: string, direction: Direction) => void
```

**Example:**

```typescript
graph.on('connectionRemoved', (from, direction) => {
  console.log(`Disconnected: ${from} ${direction}`)
})
```

---

### `gateUpdated`

Fired when a gate is added, updated, or removed.

**Callback Signature:**

```typescript
(from: string, direction: Direction, gate: Gate | null) => void
```

**Example:**

```typescript
graph.on('gateUpdated', (from, direction, gate) => {
  if (gate === null) {
    console.log('Gate removed')
    audio.play('door-open.mp3')
  } else if (gate.locked === false) {
    console.log('Gate unlocked')
    audio.play('unlock.mp3')
  } else {
    console.log('Gate set:', gate.id)
  }
})
```

---

## Types

### `SpatialGraphEvent`

Union of all event type strings.

```typescript
type SpatialGraphEvent =
  | 'nodeCreated'
  | 'nodeRemoved'
  | 'connectionCreated'
  | 'connectionRemoved'
  | 'gateUpdated'
```

### `EventCallback`

Union of all callback signatures.

```typescript
type NodeCreatedCallback = (nodeId: string, data: NodeData) => void
type NodeRemovedCallback = (nodeId: string) => void
type ConnectionCreatedCallback = (from: string, direction: Direction, to: string) => void
type ConnectionRemovedCallback = (from: string, direction: Direction) => void
type GateUpdatedCallback = (from: string, direction: Direction, gate: Gate | null) => void

type EventCallback =
  | NodeCreatedCallback
  | NodeRemovedCallback
  | ConnectionCreatedCallback
  | ConnectionRemovedCallback
  | GateUpdatedCallback
```

---

## Patterns

### Multiple Listeners

Register multiple callbacks for the same event:

```typescript
graph.on('nodeCreated', (id) => minimap.add(id))
graph.on('nodeCreated', (id) => analytics.track('room', id))
graph.on('nodeCreated', (id) => console.log('Created:', id))
```

### Cleanup on Unmount

Store unsubscribe functions for cleanup:

```typescript
// React example
useEffect(() => {
  const unsubs = [
    graph.on('nodeCreated', handleNodeCreated),
    graph.on('nodeRemoved', handleNodeRemoved),
    graph.on('gateUpdated', handleGateUpdated),
  ]

  return () => unsubs.forEach(unsub => unsub())
}, [])
```

### Conditional Handling

Filter events in the callback:

```typescript
graph.on('gateUpdated', (from, direction, gate) => {
  // Only care about treasury door
  if (from === 'hallway' && gate?.id === 'treasury-door') {
    if (!gate.locked) {
      achievements.unlock('opened-treasury')
    }
  }
})
```
