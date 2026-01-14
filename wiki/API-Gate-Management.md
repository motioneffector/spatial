# Gate Management API

Methods for adding, updating, removing, and querying gates on connections.

---

## `setGate()`

Adds or replaces a gate on a connection.

**Signature:**

```typescript
setGate(from: string, direction: Direction, gate: Gate): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Source node ID |
| `direction` | `Direction` | Yes | Direction of the connection |
| `gate` | `Gate` | Yes | Gate configuration |

**Returns:** `void`

**Example:**

```typescript
// Locked door with key
graph.setGate('hallway', Direction.NORTH, {
  id: 'vault-door',
  locked: true,
  keyId: 'vault-key',
  description: 'A heavy steel door.'
})

// Hidden passage
graph.setGate('library', Direction.EAST, {
  id: 'secret-door',
  hidden: true
})

// Conditional gate
graph.setGate('bridge', Direction.EAST, {
  id: 'drawbridge',
  condition: { check: ['bridge_lowered', '==', true] },
  blockedMessage: 'The drawbridge is raised.'
})
```

**Throws:**

- `ValidationError` — When connection does not exist

---

## `updateGate()`

Updates specific properties of an existing gate.

**Signature:**

```typescript
updateGate(from: string, direction: Direction, updates: Partial<Gate>): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Source node ID |
| `direction` | `Direction` | Yes | Direction of the connection |
| `updates` | `Partial<Gate>` | Yes | Properties to update |

**Returns:** `void`

**Example:**

```typescript
// Unlock a door
graph.updateGate('hallway', Direction.NORTH, { locked: false })

// Change key requirement
graph.updateGate('hallway', Direction.NORTH, { keyId: 'master-key' })

// Multiple updates
graph.updateGate('hallway', Direction.NORTH, {
  locked: false,
  description: 'The door stands open.'
})
```

**Throws:**

- `ValidationError` — When gate does not exist on connection

---

## `removeGate()`

Removes a gate from a connection, leaving the connection open.

**Signature:**

```typescript
removeGate(from: string, direction: Direction): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Source node ID |
| `direction` | `Direction` | Yes | Direction of the connection |

**Returns:** `void`

**Example:**

```typescript
// Remove the gate entirely
graph.removeGate('hallway', Direction.NORTH)

// Connection remains, but no access control
const result = graph.canTraverse('hallway', Direction.NORTH)
console.log(result.allowed)  // true
```

---

## `getGate()`

Retrieves gate data for a connection.

**Signature:**

```typescript
getGate(from: string, direction: Direction): Gate | null
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Source node ID |
| `direction` | `Direction` | Yes | Direction of the connection |

**Returns:** `Gate | null` — Gate data, or null if no gate exists

**Example:**

```typescript
const gate = graph.getGate('hallway', Direction.NORTH)
if (gate) {
  console.log('Gate ID:', gate.id)
  console.log('Locked:', gate.locked)
  console.log('Key needed:', gate.keyId)
}
```

---

## `canTraverse()`

Checks if traversal through a connection is allowed.

**Signature:**

```typescript
canTraverse(
  from: string,
  direction: Direction,
  context?: TraversalContext
): TraversalResult
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `string` | Yes | Source node ID |
| `direction` | `Direction` | Yes | Direction to traverse |
| `context` | `TraversalContext` | No | Player context (inventory, flags, etc.) |

**Returns:** `TraversalResult` — Result indicating if traversal is allowed

**Example:**

```typescript
// Check without context
const result1 = graph.canTraverse('hallway', Direction.NORTH)
console.log(result1.allowed)  // false (locked)
console.log(result1.reason)   // 'locked'
console.log(result1.gateId)   // 'vault-door'

// Check with key
const result2 = graph.canTraverse('hallway', Direction.NORTH, {
  inventory: ['vault-key']
})
console.log(result2.allowed)  // true

// Check hidden passage
const result3 = graph.canTraverse('library', Direction.EAST, {
  discovered: ['secret-door']
})
console.log(result3.allowed)  // true
```

---

## Types

### `Gate`

Gate configuration.

```typescript
interface Gate {
  id: string
  locked?: boolean
  keyId?: string
  condition?: Condition
  hidden?: boolean
  oneWay?: boolean
  description?: string
  blockedMessage?: string
  metadata?: Record<string, unknown>
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the gate |
| `locked` | `boolean` | No | Whether the gate is locked |
| `keyId` | `string` | No | Key ID required to unlock |
| `condition` | `Condition` | No | Condition to evaluate against flag store |
| `hidden` | `boolean` | No | Whether gate is hidden until discovered |
| `oneWay` | `boolean` | No | Whether gate only allows one direction |
| `description` | `string` | No | Description of the gate |
| `blockedMessage` | `string` | No | Message shown when blocked |
| `metadata` | `Record<string, unknown>` | No | Custom metadata |

### `TraversalContext`

Context for traversal checks.

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

| Property | Type | Description |
|----------|------|-------------|
| `inventory` | `string[]` | Items the player has (for key checking) |
| `flagStore` | `object` | Flag store for condition evaluation |
| `discovered` | `string[]` | Gate IDs that have been discovered |
| `[key]` | `unknown` | Any additional custom context |

### `TraversalResult`

Result of a traversal check.

```typescript
interface TraversalResult {
  allowed: boolean
  reason?: string
  gateId?: string
}
```

| Property | Type | Description |
|----------|------|-------------|
| `allowed` | `boolean` | Whether traversal is allowed |
| `reason` | `string` | Why traversal was blocked (if blocked) |
| `gateId` | `string` | ID of the blocking gate (if blocked) |
