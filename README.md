# @motioneffector/spatial

A directional graph system for room-based spatial navigation in games and interactive fiction.

[![npm version](https://img.shields.io/npm/v/@motioneffector/spatial.svg)](https://www.npmjs.com/package/@motioneffector/spatial)
[![license](https://img.shields.io/npm/l/@motioneffector/spatial.svg)](https://github.com/motioneffector/spatial/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**[Try the interactive demo →](https://motioneffector.github.io/spatial/)**

## Features

- **Directional Connections** - Link nodes via compass directions, vertical, and custom
- **Conditional Gates** - Lock paths with keys, flags, or custom logic
- **Weighted Pathfinding** - Find optimal routes with Dijkstra's algorithm
- **Multi-tile Nodes** - Rooms spanning multiple grid positions with layers
- **Zone Management** - Group and query nodes by zones
- **Graph Analysis** - Detect orphans, dead ends, and disconnected subgraphs
- **Event System** - React to graph changes in real-time
- **Serialization** - Save and restore entire graph state

[Read the full manual →](https://motioneffector.github.io/spatial/manual/)

## Quick Start

```typescript
import { createSpatialGraph, Direction } from '@motioneffector/spatial'

// Create a graph and add rooms
const graph = createSpatialGraph()
graph.createNode('entrance', { name: 'Entrance Hall' })
graph.createNode('library', { name: 'Library' })

// Connect rooms with directions
graph.connect('entrance', Direction.NORTH, 'library')

// Add a locked gate
graph.setGate('entrance', Direction.NORTH, {
  id: 'door-1',
  locked: true,
  keyId: 'brass-key'
})

// Check if player can traverse
const result = graph.canTraverse('entrance', Direction.NORTH, {
  inventory: ['brass-key']
})
console.log(result.allowed) // true

// Find shortest path
const path = graph.findPath('entrance', 'library')
```

## Testing & Validation

- **Comprehensive test suite** - 392 unit tests covering core functionality
- **Fuzz tested** - Randomized input testing to catch edge cases
- **Strict TypeScript** - Full type coverage with no `any` types
- **Zero dependencies** - No supply chain risk

## License

MIT © [motioneffector](https://github.com/motioneffector)
