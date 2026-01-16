# Direction Utilities API

Direction constants and utility methods for parsing and manipulation.

---

## Direction Constants

Built-in direction constants for spatial navigation.

```typescript
import { Direction } from '@motioneffector/spatial'

// Compass directions
Direction.NORTH      // 'NORTH'
Direction.NORTHEAST  // 'NORTHEAST'
Direction.EAST       // 'EAST'
Direction.SOUTHEAST  // 'SOUTHEAST'
Direction.SOUTH      // 'SOUTH'
Direction.SOUTHWEST  // 'SOUTHWEST'
Direction.WEST       // 'WEST'
Direction.NORTHWEST  // 'NORTHWEST'

// Vertical directions
Direction.UP         // 'UP'
Direction.DOWN       // 'DOWN'

// Special directions
Direction.IN         // 'IN'
Direction.OUT        // 'OUT'
```

---

## `Direction.opposite()`

Returns the opposite direction.

**Signature:**

```typescript
Direction.opposite(direction: Direction): Direction | null
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `direction` | `Direction` | Yes | Direction to get opposite of |

**Returns:** `Direction | null` — Opposite direction, or null for custom directions without opposite

**Example:**

```typescript
Direction.opposite('NORTH')      // 'SOUTH'
Direction.opposite('SOUTH')      // 'NORTH'
Direction.opposite('EAST')       // 'WEST'
Direction.opposite('WEST')       // 'EAST'
Direction.opposite('NORTHEAST')  // 'SOUTHWEST'
Direction.opposite('UP')         // 'DOWN'
Direction.opposite('IN')         // 'OUT'

// Custom direction without opposite
Direction.opposite('WARP')       // null
```

---

## `Direction.parse()`

Parses a string into a Direction constant.

**Signature:**

```typescript
Direction.parse(input: string): Direction | null
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `string` | Yes | String to parse (case-insensitive) |

**Returns:** `Direction | null` — Parsed direction, or null if invalid

**Example:**

```typescript
// Full names
Direction.parse('north')      // 'NORTH'
Direction.parse('NORTH')      // 'NORTH'
Direction.parse('North')      // 'NORTH'

// Abbreviations
Direction.parse('n')          // 'NORTH'
Direction.parse('ne')         // 'NORTHEAST'
Direction.parse('e')          // 'EAST'
Direction.parse('se')         // 'SOUTHEAST'
Direction.parse('s')          // 'SOUTH'
Direction.parse('sw')         // 'SOUTHWEST'
Direction.parse('w')          // 'WEST'
Direction.parse('nw')         // 'NORTHWEST'
Direction.parse('u')          // 'UP'
Direction.parse('d')          // 'DOWN'

// Special
Direction.parse('in')         // 'IN'
Direction.parse('out')        // 'OUT'

// Invalid
Direction.parse('invalid')    // null
Direction.parse('')           // null
```

---

## `registerDirection()`

Registers a custom direction with its opposite mapping.

**Signature:**

```typescript
graph.registerDirection(direction: string, options: RegisterDirectionOptions): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `direction` | `string` | Yes | Custom direction name |
| `options` | `RegisterDirectionOptions` | Yes | Registration options |

**Returns:** `void`

**Example:**

```typescript
// Self-opposite (portal)
graph.registerDirection('PORTAL', { opposite: 'PORTAL' })

// Paired opposites
graph.registerDirection('CLIMB', { opposite: 'DESCEND' })
// Also registers DESCEND → CLIMB

// No opposite (one-way)
graph.registerDirection('WARP', { opposite: null })

// Use in connections
graph.connect('a', 'PORTAL' as any, 'b')
```

---

## Types

### `Direction`

Union type of all direction string literals.

```typescript
type Direction =
  | 'NORTH' | 'NORTHEAST' | 'EAST' | 'SOUTHEAST'
  | 'SOUTH' | 'SOUTHWEST' | 'WEST' | 'NORTHWEST'
  | 'UP' | 'DOWN'
  | 'IN' | 'OUT'
```

### `RegisterDirectionOptions`

Options for registering custom directions.

```typescript
interface RegisterDirectionOptions {
  opposite?: Direction | null
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `opposite` | `Direction \| null` | No | Opposite direction, or null for no opposite |

---

## Opposite Mappings

Built-in direction opposite pairs:

| Direction | Opposite |
|-----------|----------|
| `NORTH` | `SOUTH` |
| `SOUTH` | `NORTH` |
| `EAST` | `WEST` |
| `WEST` | `EAST` |
| `NORTHEAST` | `SOUTHWEST` |
| `SOUTHWEST` | `NORTHEAST` |
| `NORTHWEST` | `SOUTHEAST` |
| `SOUTHEAST` | `NORTHWEST` |
| `UP` | `DOWN` |
| `DOWN` | `UP` |
| `IN` | `OUT` |
| `OUT` | `IN` |

---

## Parse Mappings

Supported input strings for parsing:

| Input | Result |
|-------|--------|
| `n`, `north` | `NORTH` |
| `ne`, `northeast` | `NORTHEAST` |
| `e`, `east` | `EAST` |
| `se`, `southeast` | `SOUTHEAST` |
| `s`, `south` | `SOUTH` |
| `sw`, `southwest` | `SOUTHWEST` |
| `w`, `west` | `WEST` |
| `nw`, `northwest` | `NORTHWEST` |
| `u`, `up` | `UP` |
| `d`, `down` | `DOWN` |
| `in` | `IN` |
| `out` | `OUT` |

All parsing is case-insensitive.
