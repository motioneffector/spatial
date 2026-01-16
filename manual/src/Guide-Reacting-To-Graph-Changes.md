# Reacting to Graph Changes

Subscribe to events when nodes, connections, or gates change. Use this for minimap updates, audio cues, achievement tracking, or any side effects that should happen when the graph changes.

## Prerequisites

Before starting, you should:

- Have a working graph

## Overview

We'll react to changes by:

1. Subscribing to events with `on()`
2. Handling different event types
3. Unsubscribing when done

## Step 1: Subscribe to Events

Use `on()` to register a callback for an event type.

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// Subscribe to node creation
graph.on('nodeCreated', (nodeId, nodeData) => {
  console.log(`New room: ${nodeId}`)
  console.log(`Name: ${nodeData.metadata.name}`)
})

// Now when nodes are created, callback fires
graph.createNode('library', { name: 'Library' })
// Logs: "New room: library"
// Logs: "Name: Library"
```

## Step 2: Handle Different Events

The library emits five event types:

```typescript
// Node added
graph.on('nodeCreated', (nodeId, nodeData) => {
  console.log(`Created: ${nodeId}`)
})

// Node removed
graph.on('nodeRemoved', (nodeId) => {
  console.log(`Removed: ${nodeId}`)
})

// Connection added
graph.on('connectionCreated', (from, direction, to) => {
  console.log(`Connected: ${from} --${direction}--> ${to}`)
})

// Connection removed
graph.on('connectionRemoved', (from, direction) => {
  console.log(`Disconnected: ${from} ${direction}`)
})

// Gate added, updated, or removed
graph.on('gateUpdated', (from, direction, gate) => {
  if (gate) {
    console.log(`Gate ${gate.id} on ${from} ${direction}: locked=${gate.locked}`)
  } else {
    console.log(`Gate removed from ${from} ${direction}`)
  }
})
```

## Step 3: Unsubscribe

The `on()` method returns an unsubscribe function.

```typescript
const unsubscribe = graph.on('nodeCreated', (nodeId) => {
  console.log(`New node: ${nodeId}`)
})

graph.createNode('room1')  // Logs: "New node: room1"

// Stop listening
unsubscribe()

graph.createNode('room2')  // No log - unsubscribed
```

## Complete Example

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// === MINIMAP UPDATES ===
graph.on('nodeCreated', (nodeId, data) => {
  minimap.addRoom(nodeId, {
    name: data.metadata.name,
    layer: data.layer,
    tiles: data.tiles
  })
})

graph.on('nodeRemoved', (nodeId) => {
  minimap.removeRoom(nodeId)
})

graph.on('connectionCreated', (from, direction, to) => {
  minimap.addPath(from, to, direction)
})

// === AUDIO CUES ===
graph.on('gateUpdated', (from, direction, gate) => {
  if (gate === null) {
    audio.play('door-open.mp3')
  } else if (gate.locked === false) {
    audio.play('unlock.mp3')
  }
})

// === ACHIEVEMENT TRACKING ===
let roomCount = 0
const achievementUnsub = graph.on('nodeCreated', () => {
  roomCount++
  if (roomCount >= 100) {
    achievements.unlock('cartographer')
    achievementUnsub()  // Stop checking after achievement
  }
})

// === BUILD THE GRAPH ===
graph.createNode('entrance', { name: 'Entrance' })
graph.createNode('hallway', { name: 'Hallway' })
graph.connect('entrance', Direction.NORTH, 'hallway')

// Each action triggers the appropriate callbacks
```

## Variations

### Debouncing Rapid Changes

Batch updates when many changes happen at once.

```typescript
let pendingUpdates: string[] = []
let updateTimer: NodeJS.Timeout | null = null

graph.on('nodeCreated', (nodeId) => {
  pendingUpdates.push(nodeId)

  if (!updateTimer) {
    updateTimer = setTimeout(() => {
      console.log('Batch update:', pendingUpdates)
      minimap.batchAdd(pendingUpdates)
      pendingUpdates = []
      updateTimer = null
    }, 100)  // Wait 100ms for more changes
  }
})
```

### Conditional Event Handling

Only react to certain nodes or conditions.

```typescript
graph.on('gateUpdated', (from, direction, gate) => {
  // Only care about treasure room door
  if (from === 'treasure-room' && gate?.locked === false) {
    triggerCutscene('treasure-discovered')
  }
})
```

### Tracking History

Record all changes for undo/redo.

```typescript
type HistoryEntry = {
  type: string
  data: unknown
  timestamp: number
}

const history: HistoryEntry[] = []

graph.on('nodeCreated', (nodeId, data) => {
  history.push({
    type: 'nodeCreated',
    data: { nodeId, nodeData: data },
    timestamp: Date.now()
  })
})

graph.on('nodeRemoved', (nodeId) => {
  history.push({
    type: 'nodeRemoved',
    data: { nodeId },
    timestamp: Date.now()
  })
})

// Review history
console.log('Last 10 changes:', history.slice(-10))
```

### Multiple Listeners

Register multiple callbacks for the same event.

```typescript
// Minimap update
graph.on('nodeCreated', (id) => minimap.add(id))

// Analytics tracking
graph.on('nodeCreated', (id) => analytics.track('room_created', { id }))

// Debug logging
graph.on('nodeCreated', (id) => console.debug(`[DEBUG] Node created: ${id}`))

// All three fire for each node creation
```

## Troubleshooting

### Callback not firing

**Symptom:** Event callback never executes.

**Cause:** Subscribed after the action occurred, or subscribed to wrong event type.

**Solution:** Subscribe before performing actions:
```typescript
// Wrong order
graph.createNode('test')
graph.on('nodeCreated', () => console.log('Created'))  // Won't fire for 'test'

// Right order
graph.on('nodeCreated', () => console.log('Created'))
graph.createNode('test')  // Callback fires
```

### Memory leak from unsubscribed listeners

**Symptom:** Callbacks continue running after component unmount.

**Cause:** Forgot to call the unsubscribe function.

**Solution:** Always clean up in component lifecycle:
```typescript
// React example
useEffect(() => {
  const unsub = graph.on('nodeCreated', handleNodeCreated)
  return () => unsub()  // Cleanup on unmount
}, [])
```

## See Also

- **[Saving and Loading](Guide-Saving-And-Loading-Graphs)** — Use events for incremental saves
- **[Events API](API-Events)** — Full event reference
