# Adding Gates and Locked Doors

Control which connections players can traverse by adding gates. Gates can require keys, check game conditions, hide passages, or provide custom blocked messages. This guide covers all gate types and how to use them.

## Prerequisites

Before starting, you should:

- [Understand nodes and connections](Concept-Nodes-And-Connections)
- Have a graph with connected nodes

## Overview

We'll add access control to connections by:

1. Creating a basic locked gate with a key requirement
2. Testing traversal with and without the key
3. Exploring other gate types (hidden, conditional, one-way)
4. Dynamically updating gates during gameplay

## Step 1: Create a Locked Gate

Gates attach to existing connections. First, create nodes and connect them, then add the gate.

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// Create rooms
graph.createNode('hallway')
graph.createNode('vault')

// Connect them
graph.connect('hallway', Direction.NORTH, 'vault')

// Add a locked gate
graph.setGate('hallway', Direction.NORTH, {
  id: 'vault-door',
  locked: true,
  keyId: 'vault-key',
  description: 'A massive steel door with a complex lock.'
})
```

The gate is now on the connection from hallway to vault going NORTH. Note that the reverse connection (vault to hallway going SOUTH) does not automatically get the same gate—gates are directional.

## Step 2: Test Traversal

Check if a player can pass through the gate.

```typescript
// Without the key
const blocked = graph.canTraverse('hallway', Direction.NORTH, {
  inventory: []
})
console.log(blocked.allowed)  // false
console.log(blocked.reason)   // 'locked'
console.log(blocked.gateId)   // 'vault-door'

// With the key
const allowed = graph.canTraverse('hallway', Direction.NORTH, {
  inventory: ['vault-key']
})
console.log(allowed.allowed)  // true
```

The traversal context includes the player's inventory. If the key matches `keyId`, passage is allowed.

## Step 3: Add Gate to Both Directions

If you want the gate to block travel in both directions, add it to both connections.

```typescript
const gateConfig = {
  id: 'vault-door',
  locked: true,
  keyId: 'vault-key'
}

graph.setGate('hallway', Direction.NORTH, gateConfig)
graph.setGate('vault', Direction.SOUTH, gateConfig)
```

Now the door blocks entry AND exit until the player has the key.

## Step 4: Update Gates Dynamically

Change gate state during gameplay—unlock doors, reveal passages.

```typescript
// Player uses the key to unlock the door permanently
graph.updateGate('hallway', Direction.NORTH, { locked: false })

// Now traversal works without the key
const result = graph.canTraverse('hallway', Direction.NORTH, {
  inventory: []
})
console.log(result.allowed)  // true
```

Use `updateGate()` to modify specific properties without replacing the entire gate.

## Complete Example

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// Set up rooms
graph.createNode('entrance')
graph.createNode('hallway')
graph.createNode('vault')
graph.createNode('secret-room')

graph.connect('entrance', Direction.NORTH, 'hallway')
graph.connect('hallway', Direction.NORTH, 'vault')
graph.connect('hallway', Direction.EAST, 'secret-room')

// Locked vault door
graph.setGate('hallway', Direction.NORTH, {
  id: 'vault-door',
  locked: true,
  keyId: 'vault-key',
  blockedMessage: 'The vault door is locked tight.'
})

// Hidden passage
graph.setGate('hallway', Direction.EAST, {
  id: 'hidden-passage',
  hidden: true,
  description: 'A section of wall that slides open.'
})

// Test traversal
const vaultResult = graph.canTraverse('hallway', Direction.NORTH, {
  inventory: ['vault-key']
})
console.log('Can enter vault:', vaultResult.allowed)  // true

const secretResult = graph.canTraverse('hallway', Direction.EAST, {
  discovered: ['hidden-passage']
})
console.log('Can use secret passage:', secretResult.allowed)  // true
```

## Variations

### Hidden Passages

Passages that must be discovered before use.

```typescript
graph.setGate('library', Direction.SOUTH, {
  id: 'bookcase-door',
  hidden: true
})

// Blocked until discovered
graph.canTraverse('library', Direction.SOUTH, { discovered: [] })
// { allowed: false, reason: 'hidden' }

// After player finds it
graph.canTraverse('library', Direction.SOUTH, { discovered: ['bookcase-door'] })
// { allowed: true }
```

### Conditional Gates

Gates that check game flags (requires a flag store).

```typescript
const flagStore = {
  check: (condition) => {
    // Your game's condition evaluation
    return gameState.flags[condition.check[0]] === condition.check[2]
  }
}

const graph = createSpatialGraph({ flagStore })

graph.createNode('bridge-start')
graph.createNode('bridge-end')
graph.connect('bridge-start', Direction.EAST, 'bridge-end')

graph.setGate('bridge-start', Direction.EAST, {
  id: 'drawbridge',
  condition: { check: ['bridge_lowered', '==', true] },
  blockedMessage: 'The drawbridge is raised. Find a way to lower it.'
})
```

### Custom Blocked Messages

Provide context-specific feedback.

```typescript
graph.setGate('throne-room', Direction.NORTH, {
  id: 'royal-guard',
  locked: true,
  keyId: 'royal-seal',
  blockedMessage: 'The guard crosses their spear. "None may pass without the Royal Seal."'
})

// When blocked, retrieve the message
const result = graph.canTraverse('throne-room', Direction.NORTH, { inventory: [] })
if (!result.allowed) {
  const gate = graph.getGate('throne-room', Direction.NORTH)
  console.log(gate?.blockedMessage)
}
```

### Removing Gates

Open a previously gated connection.

```typescript
// Remove the gate entirely
graph.removeGate('hallway', Direction.NORTH)

// Connection remains, but no access control
const result = graph.canTraverse('hallway', Direction.NORTH, { inventory: [] })
console.log(result.allowed)  // true
```

## Troubleshooting

### Gate not blocking traversal

**Symptom:** `canTraverse()` returns `allowed: true` even though you added a gate.

**Cause:** You might have added the gate to the wrong direction or node.

**Solution:** Verify the gate exists with `getGate()`:
```typescript
const gate = graph.getGate('hallway', Direction.NORTH)
console.log(gate)  // Should show your gate, not null
```

### Key not working

**Symptom:** Player has the key but gate still blocks.

**Cause:** The key ID in inventory doesn't match the gate's `keyId` exactly (case-sensitive).

**Solution:** Check both values:
```typescript
const gate = graph.getGate('hallway', Direction.NORTH)
console.log('Gate keyId:', gate?.keyId)  // e.g., 'vault-key'
console.log('Player has:', context.inventory)  // Should include exact match
```

### Condition-based gate always blocks

**Symptom:** Conditional gate blocks even when condition should be true.

**Cause:** No `flagStore` provided to the graph, or flag store's `check()` not returning true.

**Solution:** Ensure you pass a flagStore when creating the graph:
```typescript
const graph = createSpatialGraph({ flagStore: myFlagStore })
```

## See Also

- **[Gates Concept](Concept-Gates)** — Understanding gate types
- **[Traversal and Pathfinding](Concept-Traversal-And-Pathfinding)** — How gates affect routes
- **[Gate Management API](API-Gate-Management)** — Full method reference
