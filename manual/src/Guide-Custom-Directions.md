# Custom Directions

Define game-specific movement types beyond the built-in compass directions. Portals, teleporters, climbing ropes, magic doors—any special navigation that doesn't fit NORTH/SOUTH/EAST/WEST.

## Prerequisites

Before starting, you should:

- [Understand directions](Concept-Directions)
- [Understand connections](Concept-Nodes-And-Connections)

## Overview

We'll create custom directions by:

1. Registering a new direction with its opposite
2. Using the custom direction in connections
3. Handling different opposite relationships

## Step 1: Register a Custom Direction

Use `registerDirection()` to create a new direction with its opposite mapping.

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// Register a portal direction (self-opposite)
graph.registerDirection('PORTAL', { opposite: 'PORTAL' })
```

The `opposite` parameter defines what direction the reverse connection uses. For a portal, entering from either side uses the same direction.

## Step 2: Use in Connections

Use the custom direction like any built-in direction.

```typescript
graph.createNode('shrine')
graph.createNode('mirror-shrine')

// Connect via portal (bidirectional by default)
graph.connect('shrine', 'PORTAL' as any, 'mirror-shrine')

// Check the connection
const dest = graph.getDestination('shrine', 'PORTAL' as any)
console.log(dest)  // 'mirror-shrine'

// Reverse also works (because opposite is 'PORTAL')
const reverse = graph.getDestination('mirror-shrine', 'PORTAL' as any)
console.log(reverse)  // 'shrine'
```

Note: TypeScript requires `as any` for custom directions since they're not in the built-in Direction type.

## Step 3: Handle Different Opposites

Custom directions can have three types of opposite relationships:

```typescript
// Self-opposite: same direction both ways
graph.registerDirection('PORTAL', { opposite: 'PORTAL' })

// Paired opposites: ENTER and EXIT are distinct
graph.registerDirection('ENTER', { opposite: 'EXIT' })
// This also registers EXIT → ENTER automatically

// No opposite: one-way only
graph.registerDirection('WARP', { opposite: null })
```

## Complete Example

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

const graph = createSpatialGraph()

// === REGISTER CUSTOM DIRECTIONS ===

// Portal: magical doorway, works both ways
graph.registerDirection('PORTAL', { opposite: 'PORTAL' })

// Climb/Descend: for ropes and ladders
graph.registerDirection('CLIMB', { opposite: 'DESCEND' })

// Warp: one-way teleport trap
graph.registerDirection('WARP', { opposite: null })

// === CREATE NODES ===
graph.createNode('mage-tower')
graph.createNode('shadow-realm')
graph.createNode('cliff-base')
graph.createNode('cliff-top')
graph.createNode('trap-room')
graph.createNode('dungeon-start')

// === PORTAL CONNECTION ===
// Bidirectional magical portal
graph.connect('mage-tower', 'PORTAL' as any, 'shadow-realm')

const portalDest = graph.getDestination('mage-tower', 'PORTAL' as any)
console.log('Portal leads to:', portalDest)  // 'shadow-realm'

// === CLIMB/DESCEND CONNECTION ===
// Rope climbing - bidirectional with different names
graph.connect('cliff-base', 'CLIMB' as any, 'cliff-top')

console.log(graph.getDestination('cliff-base', 'CLIMB' as any))    // 'cliff-top'
console.log(graph.getDestination('cliff-top', 'DESCEND' as any))  // 'cliff-base'

// === ONE-WAY WARP ===
// Trap that teleports player with no return
graph.connect('trap-room', 'WARP' as any, 'dungeon-start', {
  bidirectional: false
})

console.log(graph.getDestination('trap-room', 'WARP' as any))     // 'dungeon-start'
console.log(graph.getDestination('dungeon-start', 'WARP' as any)) // null (no reverse)

// === PATHFINDING WORKS ===
const path = graph.findPath('cliff-base', 'cliff-top')
console.log('Path up cliff:', path)  // ['cliff-base', 'cliff-top']
```

## Variations

### Ladder Direction

Vertical movement with custom names.

```typescript
graph.registerDirection('CLIMB_UP', { opposite: 'CLIMB_DOWN' })

graph.connect('basement', 'CLIMB_UP' as any, 'attic')
// Player types "climb up" → goes to attic
// Player types "climb down" → returns to basement
```

### Vehicle Entry

Enter/exit vehicles or mounts.

```typescript
graph.registerDirection('BOARD', { opposite: 'DISEMBARK' })

graph.createNode('dock')
graph.createNode('ship-deck')
graph.connect('dock', 'BOARD' as any, 'ship-deck')
```

### Conditional Portals

Combine custom directions with gates.

```typescript
graph.registerDirection('PORTAL', { opposite: 'PORTAL' })
graph.connect('ancient-circle', 'PORTAL' as any, 'demon-realm')

// Only works if player has the crystal
graph.setGate('ancient-circle', 'PORTAL' as any, {
  id: 'portal-seal',
  locked: true,
  keyId: 'void-crystal'
})
```

## Troubleshooting

### TypeScript errors with custom directions

**Symptom:** TypeScript complains about custom direction string.

**Cause:** Custom directions aren't in the `Direction` type.

**Solution:** Use `as any` type assertion:
```typescript
graph.connect('a', 'CUSTOM' as any, 'b')
```

Or create a typed constant:
```typescript
const PORTAL = 'PORTAL' as const
graph.registerDirection(PORTAL, { opposite: PORTAL })
graph.connect('a', PORTAL as any, 'b')
```

### Reverse connection not created

**Symptom:** Bidirectional connection only works one way.

**Cause:** Custom direction has `opposite: null`.

**Solution:** Register the direction with a valid opposite:
```typescript
// This won't create reverse connections
graph.registerDirection('TELEPORT', { opposite: null })

// This will
graph.registerDirection('TELEPORT', { opposite: 'TELEPORT' })
```

## See Also

- **[Directions Concept](Concept-Directions)** — Understanding direction mechanics
- **[Direction Utilities API](API-Direction-Utilities)** — Full method reference
