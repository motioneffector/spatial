# Gates

Gates control access on connections. They answer "Can the player go this way right now?" A gate might be a locked door, a hidden passage, a drawbridge controlled by game state, or a one-way drop. Gates attach to existing connections and evaluate against a traversal context you provide.

## How It Works

When you call `canTraverse()`, the library checks if a gate exists on that connection. If it does, the gate's properties determine whether passage is allowed:

- **Locked gates** check for a key in `context.inventory`
- **Conditional gates** evaluate against a flag store (like @motioneffector/flags)
- **Hidden gates** block until the gate ID appears in `context.discovered`

No gate means open passage. Gates don't block the connection from existing—they just control traversal at runtime.

```
[Hall] --EAST--> [Treasury]
          |
        Gate: { locked: true, keyId: 'gold-key' }
          |
        Without key: blocked
        With key: allowed
```

## Basic Usage

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()
graph.createNode('hall')
graph.createNode('treasury')
graph.connect('hall', Direction.EAST, 'treasury')

// Add a locked gate
graph.setGate('hall', Direction.EAST, {
  id: 'treasury-door',
  locked: true,
  keyId: 'gold-key'
})

// Check traversal without key
const blocked = graph.canTraverse('hall', Direction.EAST, { inventory: [] })
console.log(blocked.allowed) // false
console.log(blocked.reason)  // 'locked'
console.log(blocked.gateId)  // 'treasury-door'

// Check traversal with key
const allowed = graph.canTraverse('hall', Direction.EAST, {
  inventory: ['gold-key']
})
console.log(allowed.allowed) // true
```

The gate blocks traversal until the player has the required key in their inventory.

## Key Points

- **Gates attach to connections, not nodes** — A gate goes on the path from A to B in direction D. The reverse path (B to A) can have a different gate or none at all.
- **Multiple properties combine** — A gate can be both locked and hidden. The player must discover it AND have the key.
- **Gates are mutable** — Use `updateGate()` to change properties (unlock a door, reveal a passage) without replacing the entire gate.
- **Removing a gate opens the path** — `removeGate()` removes access control; the connection remains.

## Examples

### Hidden Passages

Secret doors that must be discovered before they can be used.

```typescript
graph.setGate('study', Direction.NORTH, {
  id: 'secret-bookcase',
  hidden: true,
  description: 'A bookcase that swings open'
})

// Player hasn't found it yet
const hidden = graph.canTraverse('study', Direction.NORTH, { discovered: [] })
console.log(hidden.allowed) // false
console.log(hidden.reason)  // 'hidden'

// Player discovered the passage
const found = graph.canTraverse('study', Direction.NORTH, {
  discovered: ['secret-bookcase']
})
console.log(found.allowed) // true
```

### Conditional Gates

Gates that check game state via a flag store.

```typescript
const flagStore = {
  check: (condition) => {
    // Your game's flag evaluation logic
    if (condition.check[0] === 'bridge_lowered') {
      return gameState.bridgeLowered === true
    }
    return false
  }
}

const graph = createSpatialGraph({ flagStore })

graph.createNode('cliff')
graph.createNode('fortress')
graph.connect('cliff', Direction.EAST, 'fortress')

graph.setGate('cliff', Direction.EAST, {
  id: 'drawbridge',
  condition: { check: ['bridge_lowered', '==', true] },
  blockedMessage: 'The drawbridge is raised.'
})
```

### Unlocking Doors Dynamically

Change gate state during gameplay.

```typescript
// Player uses key on door
graph.updateGate('hall', Direction.EAST, { locked: false })

// Now traversal is allowed without the key
const result = graph.canTraverse('hall', Direction.EAST, { inventory: [] })
console.log(result.allowed) // true
```

### Custom Blocked Messages

Provide feedback when traversal fails.

```typescript
graph.setGate('entrance', Direction.NORTH, {
  id: 'guard-post',
  locked: true,
  keyId: 'guard-badge',
  blockedMessage: 'The guard blocks your path. "Badge, please."'
})

const result = graph.canTraverse('entrance', Direction.NORTH, { inventory: [] })
// Use result.gateId to look up the gate and get blockedMessage
const gate = graph.getGate('entrance', Direction.NORTH)
console.log(gate?.blockedMessage) // 'The guard blocks your path. "Badge, please."'
```

## Related

- **[Traversal and Pathfinding](Concept-Traversal-And-Pathfinding)** — How gates affect pathfinding
- **[Adding Gates and Locked Doors](Guide-Adding-Gates-And-Locked-Doors)** — Step-by-step guide
- **[Gate Management API](API-Gate-Management)** — Full method reference
