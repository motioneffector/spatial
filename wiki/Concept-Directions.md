# Directions

Directions are the language of navigation. They define how nodes connect and how players describe movement—"go north," "climb up," "enter the portal." The library provides built-in directions for common cases and lets you register custom ones for game-specific movement.

## How It Works

Every direction has an opposite. NORTH's opposite is SOUTH. UP's opposite is DOWN. When you create a bidirectional connection, the library uses the opposite to create the reverse link automatically.

Built-in directions cover:
- **Compass:** NORTH, SOUTH, EAST, WEST, NORTHEAST, SOUTHEAST, SOUTHWEST, NORTHWEST
- **Vertical:** UP, DOWN
- **Special:** IN, OUT

Custom directions extend this vocabulary. Define PORTAL with a self-opposite (portal goes both ways), or WARP with no opposite (one-way teleport).

## Basic Usage

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()
graph.createNode('room1')
graph.createNode('room2')

// Use built-in direction constants
graph.connect('room1', Direction.NORTH, 'room2')
graph.connect('room1', Direction.UP, 'room2')

// Get the opposite of a direction
const opposite = Direction.opposite('NORTH')
console.log(opposite) // 'SOUTH'

// Parse player input to direction constants
const parsed = Direction.parse('n')     // 'NORTH'
const parsed2 = Direction.parse('ne')   // 'NORTHEAST'
const parsed3 = Direction.parse('up')   // 'UP'
```

Use `Direction.parse()` to convert player input ("n", "north", "NORTH") into consistent direction constants.

## Key Points

- **Every built-in direction has an opposite** — This enables automatic bidirectional connections. NORTH↔SOUTH, EAST↔WEST, UP↔DOWN, IN↔OUT.
- **Parsing is case-insensitive** — "N", "n", "north", "NORTH" all parse to `'NORTH'`.
- **Abbreviations are supported** — "n", "ne", "u", "d" work as expected for compass and vertical directions.
- **Invalid input returns null** — `Direction.parse('invalid')` returns `null`, not an error.

## Examples

### Parsing Player Commands

Handle text input from players.

```typescript
function handleMove(playerInput: string, currentRoom: string) {
  const direction = Direction.parse(playerInput)

  if (!direction) {
    return "I don't understand that direction."
  }

  const destination = graph.getDestination(currentRoom, direction)

  if (!destination) {
    return "You can't go that way."
  }

  return destination
}

handleMove('n', 'entrance')    // Returns destination or message
handleMove('north', 'entrance')  // Same result
handleMove('xyzzy', 'entrance')  // "I don't understand that direction."
```

### Custom Directions

Register game-specific movement types.

```typescript
// Self-opposite: entering a portal exits from the same portal
graph.registerDirection('PORTAL', { opposite: 'PORTAL' })

// No opposite: warp is one-way
graph.registerDirection('WARP', { opposite: null })

// Paired opposites: enter and exit are distinct
graph.registerDirection('ENTER', { opposite: 'EXIT' })

// Now use them like built-in directions
graph.connect('shrine', 'PORTAL' as any, 'mirror-shrine')
graph.connect('dungeon', 'WARP' as any, 'surface', { bidirectional: false })
```

### All Built-in Directions

```typescript
// Compass (8 directions)
Direction.NORTH      Direction.SOUTH
Direction.EAST       Direction.WEST
Direction.NORTHEAST  Direction.SOUTHWEST
Direction.NORTHWEST  Direction.SOUTHEAST

// Vertical (2 directions)
Direction.UP         Direction.DOWN

// Special (2 directions)
Direction.IN         Direction.OUT
```

## Related

- **[Nodes and Connections](Concept-Nodes-And-Connections)** — How directions link nodes together
- **[Custom Directions Guide](Guide-Custom-Directions)** — Detailed guide on creating custom directions
- **[Direction Utilities API](API-Direction-Utilities)** — Full reference for Direction methods
