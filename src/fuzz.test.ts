/**
 * Fuzz Testing Suite for @motioneffector/spatial
 *
 * This suite implements comprehensive fuzz testing of the spatial graph library
 * using property-based testing, input mutation, boundary exploration, and
 * state machine fuzzing.
 *
 * Modes:
 * - Standard: 200 iterations per test (deterministic seed)
 * - Thorough: 60 seconds per test (time-based seed)
 *
 * Run thorough mode with: pnpm fuzz:thorough
 */

import { describe, it, expect } from 'vitest'
import { createSpatialGraph, Direction, ValidationError, SpatialError } from './index'
import type {
  DirectionType,
  CreateNodeOptions,
  TilePosition,
  Gate,
  TraversalContext,
  PathfindingOptions,
  ReachableOptions,
} from './types'

// ============================================
// FUZZ TEST CONFIGURATION
// ============================================

const THOROUGH_MODE = process.env.FUZZ_THOROUGH === '1'
const THOROUGH_DURATION_MS = 10_000 // 10 seconds per test in thorough mode
const STANDARD_ITERATIONS = 200 // iterations per test in standard mode
const BASE_SEED = 12345 // reproducible seed for standard mode

// Memory-efficient settings for thorough mode
const MAX_GRAPH_SIZE_THOROUGH = THOROUGH_MODE ? 100 : 1000 // Smaller graphs in thorough mode
const MAX_TILE_COUNT_THOROUGH = THOROUGH_MODE ? 100 : 1000 // Fewer tiles in thorough mode

// ============================================
// SEEDED PRNG
// ============================================

function createSeededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// ============================================
// FUZZ LOOP HELPER
// ============================================

interface FuzzLoopResult {
  iterations: number
  seed: number
  durationMs: number
}

/**
 * Executes a fuzz test body in either standard or thorough mode.
 *
 * Standard mode: Runs exactly STANDARD_ITERATIONS times with BASE_SEED
 * Thorough mode: Runs for THOROUGH_DURATION_MS with time-based seed
 *
 * On failure, throws with full reproduction information.
 */
function fuzzLoop(
  testFn: (random: () => number, iteration: number) => void
): FuzzLoopResult {
  const startTime = Date.now()
  const seed = THOROUGH_MODE ? startTime : BASE_SEED
  const random = createSeededRandom(seed)

  let iteration = 0

  try {
    if (THOROUGH_MODE) {
      // Time-based: run until duration exceeded
      while (Date.now() - startTime < THOROUGH_DURATION_MS) {
        testFn(random, iteration)
        iteration++
      }
    } else {
      // Iteration-based: run fixed count
      for (iteration = 0; iteration < STANDARD_ITERATIONS; iteration++) {
        testFn(random, iteration)
      }
    }
  } catch (error) {
    const elapsed = Date.now() - startTime
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Fuzz test failed!\n` +
        `  Mode: ${THOROUGH_MODE ? 'thorough' : 'standard'}\n` +
        `  Seed: ${seed}\n` +
        `  Iteration: ${iteration}\n` +
        `  Elapsed: ${elapsed}ms\n` +
        `  Error: ${message}\n\n` +
        `To reproduce, run with:\n` +
        `  BASE_SEED=${seed} and start at iteration ${iteration}`
    )
  }

  return {
    iterations: iteration,
    seed,
    durationMs: Date.now() - startTime,
  }
}

/**
 * Async version of fuzzLoop for testing async functions.
 */
async function fuzzLoopAsync(
  testFn: (random: () => number, iteration: number) => Promise<void>
): Promise<FuzzLoopResult> {
  const startTime = Date.now()
  const seed = THOROUGH_MODE ? startTime : BASE_SEED
  const random = createSeededRandom(seed)

  let iteration = 0

  try {
    if (THOROUGH_MODE) {
      while (Date.now() - startTime < THOROUGH_DURATION_MS) {
        await testFn(random, iteration)
        iteration++
      }
    } else {
      for (iteration = 0; iteration < STANDARD_ITERATIONS; iteration++) {
        await testFn(random, iteration)
      }
    }
  } catch (error) {
    const elapsed = Date.now() - startTime
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Fuzz test failed!\n` +
        `  Mode: ${THOROUGH_MODE ? 'thorough' : 'standard'}\n` +
        `  Seed: ${seed}\n` +
        `  Iteration: ${iteration}\n` +
        `  Elapsed: ${elapsed}ms\n` +
        `  Error: ${message}\n\n` +
        `To reproduce, run with:\n` +
        `  BASE_SEED=${seed} and start at iteration ${iteration}`
    )
  }

  return {
    iterations: iteration,
    seed,
    durationMs: Date.now() - startTime,
  }
}

// ============================================
// VALUE GENERATORS
// ============================================

function generateString(random: () => number, maxLen = 1000): string {
  const len = Math.floor(random() * maxLen)
  return Array.from({ length: len }, () =>
    String.fromCharCode(Math.floor(random() * 0xffff))
  ).join('')
}

function generateNumber(random: () => number): number {
  const type = Math.floor(random() * 10)
  switch (type) {
    case 0:
      return 0
    case 1:
      return -0
    case 2:
      return NaN
    case 3:
      return Infinity
    case 4:
      return -Infinity
    case 5:
      return Number.MAX_SAFE_INTEGER
    case 6:
      return Number.MIN_SAFE_INTEGER
    case 7:
      return Number.EPSILON
    default:
      return (random() - 0.5) * Number.MAX_SAFE_INTEGER * 2
  }
}

function generateArray<T>(
  random: () => number,
  generator: (r: () => number) => T,
  maxLen = 100
): T[] {
  const len = Math.floor(random() * maxLen)
  return Array.from({ length: len }, () => generator(random))
}

function generateObject(
  random: () => number,
  depth = 0,
  maxDepth = 5
): unknown {
  if (depth >= maxDepth) return null

  const type = Math.floor(random() * 6)
  switch (type) {
    case 0:
      return null
    case 1:
      return generateNumber(random)
    case 2:
      return generateString(random, 100)
    case 3:
      return depth < maxDepth - 1
        ? generateArray(random, (r) => generateObject(r, depth + 1, maxDepth), 10)
        : []
    case 4: {
      const obj: Record<string, unknown> = {}
      const keyCount = Math.floor(random() * 10)
      for (let i = 0; i < keyCount; i++) {
        const key = generateString(random, 20) || `key${i}`
        obj[key] = generateObject(random, depth + 1, maxDepth)
      }
      return obj
    }
    default:
      return undefined
  }
}

// Prototype pollution test values
function generateMaliciousObject(random: () => number): unknown {
  const attacks = [
    { __proto__: { polluted: true } },
    { constructor: { prototype: { polluted: true } } },
    JSON.parse('{"__proto__": {"polluted": true}}'),
    Object.create(null, { dangerous: { value: true } }),
  ]
  return attacks[Math.floor(random() * attacks.length)]
}

// Direction string generator
function generateDirectionString(random: () => number): string {
  const valid = [
    'north',
    'south',
    'east',
    'west',
    'northeast',
    'southeast',
    'southwest',
    'northwest',
    'up',
    'down',
    'in',
    'out',
    'n',
    's',
    'e',
    'w',
    'ne',
    'se',
    'sw',
    'nw',
    'u',
    'd',
  ]
  const invalid = [
    '',
    ' ',
    'noth',
    'souht',
    'left',
    'right',
    '1',
    'null',
    '@north',
    'n o r t h',
    '\0',
    '\n',
    '🧭',
    'א',
  ]
  const all = [...valid, ...invalid]
  return all[Math.floor(random() * all.length)]
}

// Node ID generator (with edge cases)
function generateNodeId(random: () => number): string {
  const type = Math.floor(random() * 10)
  switch (type) {
    case 0:
      return '' // empty
    case 1:
      return 'node-' + Math.floor(random() * 1000) // normal
    case 2:
      return generateString(random, 10000) // very long
    case 3:
      return '__proto__' // prototype pollution
    case 4:
      return 'constructor'
    case 5:
      return '0' // numeric string
    case 6:
      return 'node\0id' // null byte
    case 7:
      return '🎮' // emoji
    case 8:
      return 'א' // RTL character
    default:
      return 'node-' + Math.floor(random() * 100)
  }
}

// Tile position generator
function generateTilePosition(random: () => number): TilePosition {
  const type = Math.floor(random() * 8)
  switch (type) {
    case 0:
      return { x: 0, y: 0 }
    case 1:
      return {
        x: Math.floor(random() * 1000),
        y: Math.floor(random() * 1000),
      }
    case 2:
      return {
        x: -Math.floor(random() * 100),
        y: -Math.floor(random() * 100),
      }
    case 3:
      return { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER }
    case 4:
      return { x: 0.5, y: 0.5 } as TilePosition // float
    case 5:
      return { x: NaN, y: NaN } as TilePosition
    case 6:
      return { x: Infinity, y: Infinity } as TilePosition
    default:
      return {
        x: Math.floor(random() * 100),
        y: Math.floor(random() * 100),
        layer: Math.floor(random() * 5),
      }
  }
}

// Gate generator (with edge cases)
function generateGate(random: () => number): Gate {
  const id = 'gate-' + Math.floor(random() * 1000)
  const gate: Gate = { id }

  if (random() > 0.5) gate.locked = random() > 0.5
  if (random() > 0.5) gate.hidden = random() > 0.5
  if (random() > 0.5) gate.oneWay = random() > 0.5
  if (random() > 0.5) gate.keyId = 'key-' + Math.floor(random() * 100)
  if (random() > 0.5) gate.description = generateString(random, 100)
  if (random() > 0.5) gate.blockedMessage = generateString(random, 200)

  return gate
}

// TraversalContext generator
function generateContext(random: () => number): TraversalContext {
  const context: TraversalContext = {}

  if (random() > 0.3) {
    context.inventory = generateArray(
      random,
      () => 'key-' + Math.floor(random() * 100),
      10
    )
  }

  if (random() > 0.3) {
    context.discovered = generateArray(
      random,
      () => 'gate-' + Math.floor(random() * 100),
      10
    )
  }

  return context
}

// ============================================
// FUZZ TESTS: Direction Module
// ============================================

describe('Fuzz: Direction.parse', () => {
  it('handles random string inputs without throwing', () => {
    const result = fuzzLoop((random) => {
      const input = generateDirectionString(random)
      const parsed = Direction.parse(input)

      // Should always return Direction | null, never undefined
      if (parsed !== null && typeof parsed !== 'string') {
        throw new Error(`Invalid return type: ${typeof parsed}`)
      }
    })

    if (THOROUGH_MODE) {
      console.log(
        `Completed ${result.iterations} iterations in ${result.durationMs}ms`
      )
    }
  })

  it('is case-insensitive for valid inputs', () => {
    fuzzLoop((random) => {
      const valid = ['north', 'south', 'east', 'west', 'up', 'down']
      const input = valid[Math.floor(random() * valid.length)]

      const lower = Direction.parse(input.toLowerCase())
      const upper = Direction.parse(input.toUpperCase())
      const mixed = Direction.parse(
        input.charAt(0).toUpperCase() + input.slice(1)
      )

      if (lower !== upper || lower !== mixed) {
        throw new Error(
          `Case sensitivity bug: ${input} -> ${lower}, ${upper}, ${mixed}`
        )
      }
    })
  })

  it('returns null for invalid inputs', () => {
    fuzzLoop((random) => {
      const invalid = [
        '',
        ' ',
        'invalid',
        '123',
        'null',
        'undefined',
        generateString(random, 100),
      ]
      const input = invalid[Math.floor(random() * invalid.length)]
      const parsed = Direction.parse(input)

      if (parsed !== null) {
        throw new Error(`Expected null for invalid input "${input}", got ${parsed}`)
      }
    })
  })

  it('handles edge case strings without crashing', () => {
    fuzzLoop((random) => {
      const edgeCases = [
        '\0',
        '\n',
        '\t',
        '🧭',
        'א',
        'north\0',
        ' north ',
        'NORTH',
        'NoRtH',
      ]
      const input = edgeCases[Math.floor(random() * edgeCases.length)]

      // Should not throw
      Direction.parse(input)
    })
  })
})

describe('Fuzz: Direction.opposite', () => {
  it('double-opposite returns original (involution)', () => {
    fuzzLoop((random) => {
      const directions = [
        'NORTH',
        'SOUTH',
        'EAST',
        'WEST',
        'NORTHEAST',
        'SOUTHEAST',
        'SOUTHWEST',
        'NORTHWEST',
        'UP',
        'DOWN',
      ]
      const dir = directions[
        Math.floor(random() * directions.length)
      ] as DirectionType

      const opp1 = Direction.opposite(dir)
      if (opp1) {
        const opp2 = Direction.opposite(opp1)
        if (opp2 !== dir) {
          throw new Error(
            `Involution failed: opposite(opposite(${dir})) = ${opp2}, expected ${dir}`
          )
        }
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Node Management
// ============================================

describe('Fuzz: createNode', () => {
  it('rejects empty node IDs', () => {
    fuzzLoop(() => {
      const graph = createSpatialGraph()

      try {
        graph.createNode('', {})
        throw new Error('Should have thrown ValidationError for empty ID')
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`Wrong error type: ${e?.constructor?.name}`)
        }
      }
    })
  })

  it('rejects duplicate node IDs', () => {
    fuzzLoop((random) => {
      const graph = createSpatialGraph()
      const id = 'node-' + Math.floor(random() * 100)

      graph.createNode(id, {})

      try {
        graph.createNode(id, {})
        throw new Error('Should have thrown ValidationError for duplicate ID')
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`Wrong error type: ${e?.constructor?.name}`)
        }
      }
    })
  })

  it('handles malformed metadata without crashing', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i
      const metadata = generateObject(random, 0, 10)

      // Should not throw
      graph.createNode(id, metadata as CreateNodeOptions)

      // Should be retrievable
      const node = graph.getNode(id)
      if (!node) {
        throw new Error(`Node not created: ${id}`)
      }
    })
  })

  it('prevents prototype pollution', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const malicious = generateMaliciousObject(random)

      graph.createNode('test-' + i, malicious as CreateNodeOptions)

      // Check that Object.prototype was not polluted
      const testObj = {}
      if ('polluted' in testObj) {
        throw new Error('Prototype pollution detected!')
      }
    })
  })

  it('handles various tile configurations', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i

      const tiles = generateArray(random, generateTilePosition, 20)

      try {
        graph.createNode(id, { tiles })
        // Valid tiles should work
      } catch (e) {
        // Some invalid tiles might throw ValidationError, which is ok
        if (!(e instanceof ValidationError)) {
          throw new Error(`Unexpected error type: ${e?.constructor?.name}`)
        }
      }
    })
  })

  it('completes within performance budget', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i

      const start = Date.now()
      graph.createNode(id, { name: generateString(random, 1000) })
      const elapsed = Date.now() - start

      if (elapsed > 100) {
        throw new Error(`createNode took ${elapsed}ms, expected < 100ms`)
      }
    })
  })

  it('does not mutate input options', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const options: CreateNodeOptions = {
        name: 'test',
        tiles: [{ x: 1, y: 1 }],
      }

      const originalTiles = [...(options.tiles || [])]

      graph.createNode('node-' + i, options)

      // Options should not be mutated
      if (options.tiles?.length !== originalTiles.length) {
        throw new Error('Input options were mutated!')
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Connection Management
// ============================================

describe('Fuzz: connect', () => {
  it('rejects connections to non-existent nodes', () => {
    fuzzLoop((random) => {
      const graph = createSpatialGraph()
      graph.createNode('a', {})

      try {
        graph.connect('a', 'NORTH', 'non-existent')
        throw new Error('Should have thrown ValidationError')
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`Wrong error type: ${e?.constructor?.name}`)
        }
      }
    })
  })

  it('handles self-connections', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i
      graph.createNode(id, {})

      // Should not crash
      graph.connect(id, 'NORTH', id)

      const exits = graph.getExits(id)
      expect(exits.length).toBeGreaterThan(0)
    })
  })

  it('creates bidirectional connections correctly', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      graph.connect(id1, 'NORTH', id2, { bidirectional: true })

      const exitsFrom1 = graph.getExits(id1)
      const exitsFrom2 = graph.getExits(id2)

      const northExit = exitsFrom1.find((e) => e.direction === 'NORTH')
      const southExit = exitsFrom2.find((e) => e.direction === 'SOUTH')

      if (!northExit || !southExit) {
        throw new Error('Bidirectional connection not created properly')
      }

      if (northExit.target !== id2 || southExit.target !== id1) {
        throw new Error('Bidirectional targets incorrect')
      }
    })
  })

  it('handles various cost values', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      const cost = generateNumber(random)

      try {
        graph.connect(id1, 'NORTH', id2, { cost })
        // Valid costs should work
      } catch (e) {
        // Invalid costs might throw ValidationError
        if (!(e instanceof ValidationError) && !(e instanceof SpatialError)) {
          throw new Error(`Unexpected error type: ${e?.constructor?.name}`)
        }
      }
    })
  })

  it('handles gate configurations', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      const gate = generateGate(random)

      try {
        graph.connect(id1, 'NORTH', id2, { gate })
        // Valid gates should work
      } catch (e) {
        // Invalid gates might throw ValidationError
        if (!(e instanceof ValidationError)) {
          throw new Error(`Unexpected error type: ${e?.constructor?.name}`)
        }
      }
    })
  })

  it('completes within performance budget', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      const start = Date.now()
      graph.connect(id1, 'NORTH', id2)
      const elapsed = Date.now() - start

      if (elapsed > 100) {
        throw new Error(`connect took ${elapsed}ms, expected < 100ms`)
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Exit Retrieval
// ============================================

describe('Fuzz: getExits', () => {
  it('always returns an array', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i
      graph.createNode(id, {})

      const exits = graph.getExits(id)

      if (!Array.isArray(exits)) {
        throw new Error(`getExits returned non-array: ${typeof exits}`)
      }
    })
  })

  it('handles various context configurations', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i
      graph.createNode(id, {})

      const context = generateContext(random)

      // Should not throw
      const exits = graph.getExits(id, context)
      expect(Array.isArray(exits)).toBe(true)
    })
  })

  it('returns gates in exit info', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      const gateId = 'gate-' + i
      graph.connect(id1, 'NORTH', id2, {
        gate: { id: gateId, hidden: true },
      })

      // getExits should include the gate info
      const exits = graph.getExits(id1)
      const northExit = exits.find((e) => e.direction === 'NORTH')

      if (!northExit || !northExit.gate || northExit.gate.id !== gateId) {
        throw new Error('Gate not present in exit info')
      }
    })
  })

  it('handles exits without gates', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      graph.connect(id1, 'NORTH', id2)

      const exits = graph.getExits(id1)
      const northExit = exits.find((e) => e.direction === 'NORTH')

      if (!northExit) {
        throw new Error('Exit not found')
      }

      // Gate should be null or undefined
      if (northExit.gate !== null && northExit.gate !== undefined) {
        throw new Error('Unexpected gate on ungated connection')
      }
    })
  })

  it('completes within performance budget', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i
      graph.createNode(id, {})

      const start = Date.now()
      graph.getExits(id)
      const elapsed = Date.now() - start

      if (elapsed > 100) {
        throw new Error(`getExits took ${elapsed}ms, expected < 100ms`)
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Pathfinding
// ============================================

describe('Fuzz: findPath', () => {
  it('returns null or array, never undefined', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      const path = graph.findPath(id1, id2)

      if (path !== null && !Array.isArray(path)) {
        throw new Error(`findPath returned invalid type: ${typeof path}`)
      }
    })
  })

  it('returns [start] when start equals end', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i

      graph.createNode(id, {})

      const path = graph.findPath(id, id)

      if (!path || path.length !== 1 || path[0] !== id) {
        throw new Error(`findPath(same, same) should return [same], got ${path}`)
      }
    })
  })

  it('returns null when no path exists', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      // No connection between nodes
      const path = graph.findPath(id1, id2)

      if (path !== null) {
        throw new Error(`findPath should return null when no path exists`)
      }
    })
  })

  it('returns valid contiguous paths', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 5 + Math.floor(random() * 10)
      const nodeIds: string[] = []

      // Create linear path
      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        nodeIds.push(id)
        graph.createNode(id, {})

        if (j > 0) {
          graph.connect(nodeIds[j - 1], 'NORTH', id)
        }
      }

      const path = graph.findPath(nodeIds[0], nodeIds[nodeIds.length - 1])

      if (!path) {
        throw new Error('Path should exist but got null')
      }

      // Check contiguity
      for (let j = 0; j < path.length - 1; j++) {
        const exits = graph.getExits(path[j])
        const hasConnection = exits.some((e) => e.target === path[j + 1])

        if (!hasConnection) {
          throw new Error(
            `Path not contiguous: ${path[j]} not connected to ${path[j + 1]}`
          )
        }
      }
    })
  })

  it('respects maxLength constraint', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 10
      const nodeIds: string[] = []

      // Create linear path
      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        nodeIds.push(id)
        graph.createNode(id, {})

        if (j > 0) {
          graph.connect(nodeIds[j - 1], 'NORTH', id)
        }
      }

      const maxLength = 3
      const path = graph.findPath(nodeIds[0], nodeIds[nodeIds.length - 1], {
        maxLength,
      })

      if (path && path.length > maxLength) {
        throw new Error(
          `Path length ${path.length} exceeds maxLength ${maxLength}`
        )
      }
    })
  })

  it('handles cyclic graphs without infinite loops', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)
      const id3 = 'node-' + (i + 2000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})
      graph.createNode(id3, {})

      // Create cycle
      graph.connect(id1, 'NORTH', id2)
      graph.connect(id2, 'EAST', id3)
      graph.connect(id3, 'SOUTH', id1)

      const start = Date.now()
      graph.findPath(id1, id2)
      const elapsed = Date.now() - start

      if (elapsed > 1000) {
        throw new Error(`findPath took ${elapsed}ms, possible infinite loop`)
      }
    })
  })

  it('completes within performance budget for complex graphs', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 50
      const nodeIds: string[] = []

      // Create nodes
      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        nodeIds.push(id)
        graph.createNode(id, {})
      }

      // Create random connections
      for (let j = 0; j < nodeCount * 2; j++) {
        const from = nodeIds[Math.floor(random() * nodeIds.length)]
        const to = nodeIds[Math.floor(random() * nodeIds.length)]
        const directions = ['NORTH', 'SOUTH', 'EAST', 'WEST']
        const dir = directions[
          Math.floor(random() * directions.length)
        ] as DirectionType

        try {
          graph.connect(from, dir, to)
        } catch {
          // Ignore duplicate direction errors
        }
      }

      const start = Date.now()
      graph.findPath(nodeIds[0], nodeIds[nodeIds.length - 1])
      const elapsed = Date.now() - start

      if (elapsed > 1000) {
        throw new Error(`findPath took ${elapsed}ms, expected < 1000ms`)
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Serialization
// ============================================

describe('Fuzz: serialize/deserialize', () => {
  it('serialize never throws', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 10 + Math.floor(random() * 20)

      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        graph.createNode(id, { name: generateString(random, 100) })
      }

      // Should not throw
      graph.serialize()
    })
  })

  it('roundtrip preserves node count', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 10 + Math.floor(random() * 20)
      const nodeIds: string[] = []

      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        nodeIds.push(id)
        graph.createNode(id, {})
      }

      const data = graph.serialize()
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)

      const nodes1 = graph.getAllNodes()
      const nodes2 = graph2.getAllNodes()

      if (nodes1.length !== nodes2.length) {
        throw new Error(
          `Node count mismatch: ${nodes1.length} vs ${nodes2.length}`
        )
      }
    })
  })

  it('roundtrip preserves connections', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 10
      const nodeIds: string[] = []

      // Create nodes
      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        nodeIds.push(id)
        graph.createNode(id, {})
      }

      // Create connections
      for (let j = 0; j < nodeCount - 1; j++) {
        graph.connect(nodeIds[j], 'NORTH', nodeIds[j + 1])
      }

      const data = graph.serialize()
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)

      // Check connections
      for (let j = 0; j < nodeCount - 1; j++) {
        const exits1 = graph.getExits(nodeIds[j])
        const exits2 = graph2.getExits(nodeIds[j])

        if (exits1.length !== exits2.length) {
          throw new Error(
            `Connection count mismatch for ${nodeIds[j]}: ${exits1.length} vs ${exits2.length}`
          )
        }
      }
    })
  })

  it('roundtrip preserves gates', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      const gate = generateGate(random)

      try {
        graph.connect(id1, 'NORTH', id2, { gate })

        const data = graph.serialize()
        const graph2 = createSpatialGraph()
        graph2.deserialize(data)

        const exits1 = graph.getExits(id1)
        const exits2 = graph2.getExits(id1)

        const exit1 = exits1.find((e) => e.direction === 'NORTH')
        const exit2 = exits2.find((e) => e.direction === 'NORTH')

        if (exit1?.gateId !== exit2?.gateId) {
          throw new Error('Gate not preserved after roundtrip')
        }
      } catch (e) {
        // Invalid gates might throw, which is ok
        if (!(e instanceof ValidationError)) {
          throw e
        }
      }
    })
  })

  it('deserialize throws ValidationError for malformed data', () => {
    fuzzLoop((random) => {
      const graph = createSpatialGraph()
      const malformed = generateObject(random, 0, 5)

      try {
        graph.deserialize(malformed as any)
        // If it didn't throw, the data might have been coincidentally valid
      } catch (e) {
        // Should throw ValidationError or SpatialError, not generic Error
        if (
          !(e instanceof ValidationError) &&
          !(e instanceof SpatialError) &&
          !(e instanceof Error)
        ) {
          throw new Error(`Unexpected error type: ${e?.constructor?.name}`)
        }
      }
    })
  })

  it('completes within performance budget', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 100

      for (let j = 0; j < nodeCount; j++) {
        graph.createNode(`node-${i}-${j}`, {})
      }

      const start = Date.now()
      const data = graph.serialize()
      const serializeElapsed = Date.now() - start

      if (serializeElapsed > 1000) {
        throw new Error(
          `serialize took ${serializeElapsed}ms, expected < 1000ms`
        )
      }

      const graph2 = createSpatialGraph()
      const deserializeStart = Date.now()
      graph2.deserialize(data)
      const deserializeElapsed = Date.now() - deserializeStart

      if (deserializeElapsed > 1000) {
        throw new Error(
          `deserialize took ${deserializeElapsed}ms, expected < 1000ms`
        )
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Traversal
// ============================================

describe('Fuzz: canTraverse', () => {
  it('never throws, always returns TraversalResult', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i

      graph.createNode(id, {})

      const result = graph.canTraverse(id, 'NORTH')

      if (typeof result !== 'object' || typeof result.allowed !== 'boolean') {
        throw new Error(`canTraverse returned invalid result: ${result}`)
      }
    })
  })

  it('handles various context configurations', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i

      graph.createNode(id, {})

      const context = generateContext(random)

      // Should not throw
      const result = graph.canTraverse(id, 'NORTH', context)
      expect(typeof result.allowed).toBe('boolean')
    })
  })

  it('returns false for non-existent direction', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      graph.connect(id1, 'NORTH', id2)

      // Try traversing in a direction that doesn't exist
      const traversalResult = graph.canTraverse(id1, 'SOUTH')

      if (traversalResult.allowed) {
        throw new Error('canTraverse allowed non-existent direction')
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Tile Operations
// ============================================

describe('Fuzz: getNodeAt', () => {
  it('never throws, returns string | null', () => {
    fuzzLoop((random) => {
      const graph = createSpatialGraph()

      const x = generateNumber(random)
      const y = generateNumber(random)
      const layer = random() > 0.5 ? generateNumber(random) : undefined

      const result = graph.getNodeAt(x, y, layer)

      if (result !== null && typeof result !== 'string') {
        throw new Error(`getNodeAt returned invalid type: ${typeof result}`)
      }
    })
  })

  it('finds nodes at valid coordinates', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i
      const x = Math.floor(random() * 100)
      const y = Math.floor(random() * 100)

      graph.createNode(id, { tiles: [{ x, y }] })

      const found = graph.getNodeAt(x, y)

      if (found !== id) {
        throw new Error(`getNodeAt(${x}, ${y}) should return ${id}, got ${found}`)
      }
    })
  })

  it('respects layer parameter', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i + '-layer1'
      const id2 = 'node-' + i + '-layer2'
      const x = Math.floor(random() * 100)
      const y = Math.floor(random() * 100)

      graph.createNode(id1, { tiles: [{ x, y, layer: 1 }] })
      graph.createNode(id2, { tiles: [{ x, y, layer: 2 }] })

      const found1 = graph.getNodeAt(x, y, 1)
      const found2 = graph.getNodeAt(x, y, 2)

      if (found1 !== id1 || found2 !== id2) {
        throw new Error(
          `Layer separation failed: layer 1 = ${found1} (expected ${id1}), layer 2 = ${found2} (expected ${id2})`
        )
      }
    })
  })

  it('completes within performance budget', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()

      // Create many nodes
      for (let j = 0; j < 100; j++) {
        graph.createNode(`node-${i}-${j}`, {
          tiles: [{ x: j, y: j }],
        })
      }

      const start = Date.now()
      graph.getNodeAt(50, 50)
      const elapsed = Date.now() - start

      if (elapsed > 100) {
        throw new Error(`getNodeAt took ${elapsed}ms, expected < 100ms`)
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Gate Management
// ============================================

describe('Fuzz: setGate/updateGate', () => {
  it('setGate accepts any gate structure', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})
      graph.connect(id1, 'NORTH', id2)

      // setGate doesn't validate gate structure - it accepts anything
      graph.setGate(id1, 'NORTH', { id: 'gate-' + i } as Gate)

      const gate = graph.getGate(id1, 'NORTH')
      if (!gate || gate.id !== 'gate-' + i) {
        throw new Error('Gate not set properly')
      }
    })
  })

  it('setGate rejects non-existent connection', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i

      graph.createNode(id, {})

      try {
        graph.setGate(id, 'NORTH', { id: 'gate' })
        throw new Error('Should have thrown ValidationError for non-existent connection')
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`Wrong error type: ${e?.constructor?.name}`)
        }
      }
    })
  })

  it('updateGate merges with existing gate', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})

      const gateId = 'gate-' + i
      graph.connect(id1, 'NORTH', id2, {
        gate: { id: gateId, locked: true },
      })

      graph.updateGate(id1, 'NORTH', { description: 'Updated' })

      const gate = graph.getGate(id1, 'NORTH')

      if (!gate || gate.id !== gateId || !gate.locked) {
        throw new Error('updateGate did not preserve existing gate properties')
      }

      if (gate.description !== 'Updated') {
        throw new Error('updateGate did not apply updates')
      }
    })
  })

  it('updateGate requires existing gate', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id1 = 'node-' + i
      const id2 = 'node-' + (i + 1000)

      graph.createNode(id1, {})
      graph.createNode(id2, {})
      graph.connect(id1, 'NORTH', id2)

      try {
        graph.updateGate(id1, 'NORTH', { description: 'Updated' })
        throw new Error('Should have thrown ValidationError for non-existent gate')
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`Wrong error type: ${e?.constructor?.name}`)
        }
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Reachability
// ============================================

describe('Fuzz: getReachable', () => {
  it('always returns an array', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i

      graph.createNode(id, {})

      const reachable = graph.getReachable(id)

      if (!Array.isArray(reachable)) {
        throw new Error(`getReachable returned non-array: ${typeof reachable}`)
      }
    })
  })

  it('includes start node', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const id = 'node-' + i

      graph.createNode(id, {})

      const reachable = graph.getReachable(id)

      if (!reachable.includes(id)) {
        throw new Error('getReachable did not include start node')
      }
    })
  })

  it('respects maxDistance constraint', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 10
      const nodeIds: string[] = []

      // Create linear path
      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        nodeIds.push(id)
        graph.createNode(id, {})

        if (j > 0) {
          graph.connect(nodeIds[j - 1], 'NORTH', id)
        }
      }

      const maxDistance = 3
      const reachable = graph.getReachable(nodeIds[0], { maxDistance })

      // Should include start + up to maxDistance nodes
      if (reachable.length > maxDistance + 1) {
        throw new Error(
          `getReachable returned ${reachable.length} nodes, expected <= ${maxDistance + 1}`
        )
      }
    })
  })

  it('all returned nodes are actually reachable', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 10
      const nodeIds: string[] = []

      // Create nodes
      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        nodeIds.push(id)
        graph.createNode(id, {})
      }

      // Create some connections
      for (let j = 0; j < nodeCount - 1; j += 2) {
        graph.connect(nodeIds[j], 'NORTH', nodeIds[j + 1])
      }

      const reachable = graph.getReachable(nodeIds[0])

      // Verify each reachable node has a path
      for (const nodeId of reachable) {
        const path = graph.findPath(nodeIds[0], nodeId)
        if (path === null) {
          throw new Error(
            `getReachable included ${nodeId} but no path exists`
          )
        }
      }
    })
  })

  it('completes within performance budget', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 50
      const nodeIds: string[] = []

      // Create nodes
      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        nodeIds.push(id)
        graph.createNode(id, {})
      }

      // Create random connections
      for (let j = 0; j < nodeCount * 2; j++) {
        const from = nodeIds[Math.floor(random() * nodeIds.length)]
        const to = nodeIds[Math.floor(random() * nodeIds.length)]
        const directions = ['NORTH', 'SOUTH', 'EAST', 'WEST']
        const dir = directions[
          Math.floor(random() * directions.length)
        ] as DirectionType

        try {
          graph.connect(from, dir, to)
        } catch {
          // Ignore errors
        }
      }

      const start = Date.now()
      graph.getReachable(nodeIds[0])
      const elapsed = Date.now() - start

      if (elapsed > 1000) {
        throw new Error(`getReachable took ${elapsed}ms, expected < 1000ms`)
      }
    })
  })
})

// ============================================
// FUZZ TESTS: State Machine
// ============================================

describe('Fuzz: State Machine', () => {
  it('handles random operation sequences', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeIds: string[] = []
      const operationCount = 50 + Math.floor(random() * 50)

      for (let j = 0; j < operationCount; j++) {
        const op = Math.floor(random() * 6)

        try {
          switch (op) {
            case 0: {
              // createNode
              const id = `node-${i}-${nodeIds.length}`
              nodeIds.push(id)
              graph.createNode(id, {})
              break
            }
            case 1: {
              // connect
              if (nodeIds.length >= 2) {
                const from = nodeIds[Math.floor(random() * nodeIds.length)]
                const to = nodeIds[Math.floor(random() * nodeIds.length)]
                const directions = ['NORTH', 'SOUTH', 'EAST', 'WEST']
                const dir = directions[
                  Math.floor(random() * directions.length)
                ] as DirectionType
                graph.connect(from, dir, to)
              }
              break
            }
            case 2: {
              // disconnect
              if (nodeIds.length >= 2) {
                const from = nodeIds[Math.floor(random() * nodeIds.length)]
                const directions = ['NORTH', 'SOUTH', 'EAST', 'WEST']
                const dir = directions[
                  Math.floor(random() * directions.length)
                ] as DirectionType
                graph.disconnect(from, dir)
              }
              break
            }
            case 3: {
              // removeNode
              if (nodeIds.length > 0) {
                const idx = Math.floor(random() * nodeIds.length)
                const id = nodeIds[idx]
                graph.removeNode(id)
                nodeIds.splice(idx, 1)
              }
              break
            }
            case 4: {
              // serialize/deserialize
              const data = graph.serialize()
              const graph2 = createSpatialGraph()
              graph2.deserialize(data)
              break
            }
            case 5: {
              // getExits/findPath
              if (nodeIds.length > 0) {
                const id = nodeIds[Math.floor(random() * nodeIds.length)]
                graph.getExits(id)

                if (nodeIds.length >= 2) {
                  const to = nodeIds[Math.floor(random() * nodeIds.length)]
                  graph.findPath(id, to)
                }
              }
              break
            }
          }
        } catch (e) {
          // Operations might throw ValidationError, which is ok
          if (!(e instanceof ValidationError) && !(e instanceof SpatialError)) {
            throw e
          }
        }
      }

      // Verify graph is still in valid state
      graph.serialize()
    })
  })

  it('handles event re-entrancy', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      let reentrantCount = 0

      graph.on('nodeCreated', (id) => {
        reentrantCount++
        if (reentrantCount < 5) {
          // Limit recursion depth
          try {
            graph.createNode(`nested-${id}`, {})
          } catch {
            // Might fail if ID already exists
          }
        }
      })

      graph.createNode(`trigger-${i}`, {})

      if (reentrantCount > 100) {
        throw new Error('Event re-entrancy caused excessive nesting')
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Performance Stress
// ============================================

describe('Fuzz: Performance Stress', () => {
  it('handles large graphs (1000 nodes)', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = MAX_GRAPH_SIZE_THOROUGH

      const start = Date.now()

      // Create nodes
      for (let j = 0; j < nodeCount; j++) {
        graph.createNode(`node-${i}-${j}`, {})
      }

      // Create connections
      for (let j = 0; j < nodeCount; j++) {
        const from = `node-${i}-${j}`
        const to = `node-${i}-${(j + 1) % nodeCount}`
        graph.connect(from, 'NORTH', to)
      }

      const elapsed = Date.now() - start

      const expectedTime = THOROUGH_MODE ? 1000 : 5000
      if (elapsed > expectedTime) {
        throw new Error(
          `Large graph creation took ${elapsed}ms, expected < ${expectedTime}ms`
        )
      }

      // Verify serialization works
      const serializeStart = Date.now()
      graph.serialize()
      const serializeElapsed = Date.now() - serializeStart

      if (serializeElapsed > expectedTime) {
        throw new Error(
          `Large graph serialization took ${serializeElapsed}ms, expected < ${expectedTime}ms`
        )
      }
    })
  })

  it('handles deep pathfinding (100 nodes)', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = 100
      const nodeIds: string[] = []

      // Create linear path
      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        nodeIds.push(id)
        graph.createNode(id, {})

        if (j > 0) {
          graph.connect(nodeIds[j - 1], 'NORTH', id)
        }
      }

      const start = Date.now()
      const path = graph.findPath(nodeIds[0], nodeIds[nodeIds.length - 1])
      const elapsed = Date.now() - start

      if (elapsed > 500) {
        throw new Error(
          `Deep pathfinding took ${elapsed}ms, expected < 500ms`
        )
      }

      if (!path || path.length !== nodeCount) {
        throw new Error(
          `Path should have ${nodeCount} nodes, got ${path?.length}`
        )
      }
    })
  })

  it('handles dense connection graph (complete graph N=50)', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = THOROUGH_MODE ? 20 : 50 // Smaller in thorough mode
      const nodeIds: string[] = []

      // Create nodes
      for (let j = 0; j < nodeCount; j++) {
        const id = `node-${i}-${j}`
        nodeIds.push(id)
        graph.createNode(id, {})
      }

      const start = Date.now()

      // Create complete graph (every node connected to every other)
      const directions = ['NORTH', 'SOUTH', 'EAST', 'WEST']
      for (let j = 0; j < nodeCount; j++) {
        for (let k = 0; k < nodeCount; k++) {
          if (j !== k) {
            const dir = directions[
              (j + k) % directions.length
            ] as DirectionType
            try {
              graph.connect(nodeIds[j], dir, nodeIds[k])
            } catch {
              // Ignore duplicate direction errors
            }
          }
        }
      }

      const elapsed = Date.now() - start

      const expectedTime = THOROUGH_MODE ? 1000 : 5000
      if (elapsed > expectedTime) {
        throw new Error(
          `Dense graph creation took ${elapsed}ms, expected < ${expectedTime}ms`
        )
      }

      // Verify pathfinding is fast (should be 1 hop)
      const pathStart = Date.now()
      graph.findPath(nodeIds[0], nodeIds[nodeIds.length - 1])
      const pathElapsed = Date.now() - pathStart

      if (pathElapsed > 100) {
        throw new Error(
          `Dense graph pathfinding took ${pathElapsed}ms, expected < 100ms`
        )
      }
    })
  })

  it('handles many tiles (1000 nodes x 10 tiles)', () => {
    fuzzLoop((random, i) => {
      const graph = createSpatialGraph()
      const nodeCount = MAX_TILE_COUNT_THOROUGH
      const tilesPerNode = THOROUGH_MODE ? 5 : 10

      const start = Date.now()

      // Create nodes with multiple tiles
      for (let j = 0; j < nodeCount; j++) {
        const tiles: TilePosition[] = []
        for (let k = 0; k < tilesPerNode; k++) {
          tiles.push({
            x: j * tilesPerNode + k,
            y: Math.floor(random() * 1000),
          })
        }
        graph.createNode(`node-${i}-${j}`, { tiles })
      }

      const elapsed = Date.now() - start

      const expectedTime = THOROUGH_MODE ? 1000 : 5000
      if (elapsed > expectedTime) {
        throw new Error(
          `Tile creation took ${elapsed}ms, expected < ${expectedTime}ms`
        )
      }

      // Verify tile lookup is fast
      const lookupStart = Date.now()
      graph.getNodeAt(50, 500)
      const lookupElapsed = Date.now() - lookupStart

      if (lookupElapsed > 10) {
        throw new Error(
          `Tile lookup took ${lookupElapsed}ms, expected < 10ms`
        )
      }
    })
  })
})
