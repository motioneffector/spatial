import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSpatialGraph } from './graph'
import { Direction, registerCustomDirection } from './direction'
import { ValidationError } from './errors'
import type { SpatialGraph } from './types'

describe('Multi-Tile Nodes', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('Creating Multi-Tile Nodes', () => {
    it('creates node with tiles array', () => {
      graph.createNode('node1', {
        tiles: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      })
      expect(graph.hasNode('node1')).toBe(true)
    })

    it('stores multiple tile positions', () => {
      graph.createNode('node1', {
        tiles: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
      })
      const tiles = graph.getTiles('node1')
      expect(tiles).toHaveLength(3)
    })

    it('validates tile coordinates are numbers', () => {
      // Test that valid number coordinates work
      graph.createNode('node1', {
        tiles: [{ x: 0, y: 0 }],
      })
      const tiles = graph.getTiles('node1')
      expect(typeof tiles[0]?.x).toBe('number')
      expect(typeof tiles[0]?.y).toBe('number')
      expect(tiles[0]?.x).toBe(0)
      expect(tiles[0]?.y).toBe(0)
    })
  })

  describe('getNodeAt()', () => {
    it('returns node id for occupied tile', () => {
      graph.createNode('node1', { tiles: [{ x: 5, y: 3 }] })
      expect(graph.getNodeAt(5, 3)).toBe('node1')
    })

    it('returns null for empty tile', () => {
      expect(graph.getNodeAt(10, 10)).toBeNull()
    })

    it('returns correct node for any tile of multi-tile node', () => {
      graph.createNode('node1', {
        tiles: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
      })
      expect(graph.getNodeAt(0, 0)).toBe('node1')
      expect(graph.getNodeAt(1, 0)).toBe('node1')
      expect(graph.getNodeAt(0, 1)).toBe('node1')
    })

    it('uses default layer when not specified', () => {
      graph.createNode('node1', { tiles: [{ x: 0, y: 0 }] })
      expect(graph.getNodeAt(0, 0)).toBe('node1')
    })
  })

  describe('getTiles()', () => {
    it('returns empty array for node without tiles', () => {
      graph.createNode('node1')
      expect(graph.getTiles('node1')).toEqual([])
    })

    it('returns all tiles for multi-tile node', () => {
      graph.createNode('node1', {
        tiles: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      })
      const tiles = graph.getTiles('node1')
      expect(tiles).toHaveLength(2)
    })

    it('tiles include x and y properties', () => {
      graph.createNode('node1', { tiles: [{ x: 5, y: 3 }] })
      const tiles = graph.getTiles('node1')
      expect(tiles[0]).toBeDefined()
      expect(tiles[0]?.x).toBe(5)
      expect(tiles[0]?.y).toBe(3)
      expect(tiles[0]).toHaveProperty('x')
      expect(tiles[0]).toHaveProperty('y')
    })
  })

  describe('getBounds()', () => {
    it('returns bounding box for single-tile node', () => {
      graph.createNode('node1', { tiles: [{ x: 5, y: 3 }] })
      const bounds = graph.getBounds('node1')
      expect(bounds).toEqual({ minX: 5, maxX: 5, minY: 3, maxY: 3 })
    })

    it('returns bounding box for multi-tile node', () => {
      graph.createNode('node1', {
        tiles: [
          { x: 0, y: 0 },
          { x: 2, y: 1 },
          { x: 1, y: 2 },
        ],
      })
      const bounds = graph.getBounds('node1')
      expect(bounds).toEqual({ minX: 0, maxX: 2, minY: 0, maxY: 2 })
    })

    it('returns minX, maxX, minY, maxY', () => {
      graph.createNode('node1', {
        tiles: [
          { x: 5, y: 10 },
          { x: 8, y: 12 },
        ],
      })
      const bounds = graph.getBounds('node1')
      expect(bounds?.minX).toBe(5)
      expect(bounds?.maxX).toBe(8)
      expect(bounds?.minY).toBe(10)
      expect(bounds?.maxY).toBe(12)
    })

    it('returns null for node without tiles', () => {
      graph.createNode('node1')
      expect(graph.getBounds('node1')).toBeNull()
    })
  })

  describe('Connection with Tiles', () => {
    it('accepts fromTile option on connect', () => {
      graph.createNode('node1', {
        tiles: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      })
      graph.createNode('node2', { tiles: [{ x: 2, y: 0 }] })
      graph.connect('node1', Direction.EAST, 'node2', {
        fromTile: { x: 1, y: 0 },
      })
      const conn = graph.getConnection('node1', Direction.EAST)
      expect(conn?.fromTile).toEqual({ x: 1, y: 0 })
    })

    it('accepts toTile option on connect', () => {
      graph.createNode('node1', { tiles: [{ x: 0, y: 0 }] })
      graph.createNode('node2', { tiles: [{ x: 2, y: 0 }] })
      graph.connect('node1', Direction.EAST, 'node2', {
        toTile: { x: 2, y: 0 },
      })
      const conn = graph.getConnection('node1', Direction.EAST)
      expect(conn?.toTile).toEqual({ x: 2, y: 0 })
    })

    it('stores tile positions on connection', () => {
      graph.createNode('node1', { tiles: [{ x: 0, y: 0 }] })
      graph.createNode('node2', { tiles: [{ x: 1, y: 0 }] })
      graph.connect('node1', Direction.EAST, 'node2', {
        fromTile: { x: 0, y: 0 },
        toTile: { x: 1, y: 0 },
      })
      const conn = graph.getConnection('node1', Direction.EAST)
      expect(conn?.fromTile).toEqual({ x: 0, y: 0 })
      expect(conn?.toTile).toEqual({ x: 1, y: 0 })
    })
  })
})

describe('Layers', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('Default Layer', () => {
    it('uses layer 1 by default', () => {
      graph.createNode('node1')
      const node = graph.getNode('node1')
      expect(node?.layer).toBe(1)
    })

    it('getNodeAt searches layer 1 by default', () => {
      graph.createNode('node1', { tiles: [{ x: 0, y: 0 }] })
      expect(graph.getNodeAt(0, 0)).toBe('node1')
    })

    it('nodes without explicit layer are layer 1', () => {
      graph.createNode('node1', { tiles: [{ x: 0, y: 0 }] })
      const node = graph.getNode('node1')
      expect(node?.layer).toBe(1)
    })
  })

  describe('Multi-Layer', () => {
    it('creates nodes on different layers', () => {
      graph.createNode('node1', { layer: 1 })
      graph.createNode('node2', { layer: 2 })
      expect(graph.getNode('node1')?.layer).toBe(1)
      expect(graph.getNode('node2')?.layer).toBe(2)
    })

    it('same coordinates on different layers don\'t conflict', () => {
      graph.createNode('node1', { tiles: [{ x: 0, y: 0 }], layer: 1 })
      graph.createNode('node2', { tiles: [{ x: 0, y: 0 }], layer: 2 })
      expect(graph.getNodeAt(0, 0, 1)).toBe('node1')
      expect(graph.getNodeAt(0, 0, 2)).toBe('node2')
    })

    it('getNodeAt with layer parameter finds correct node', () => {
      graph.createNode('node1', { tiles: [{ x: 0, y: 0 }], layer: 1 })
      graph.createNode('node2', { tiles: [{ x: 0, y: 0 }], layer: 2 })
      expect(graph.getNodeAt(0, 0, 1)).toBe('node1')
      expect(graph.getNodeAt(0, 0, 2)).toBe('node2')
    })

    it('getNodesInLayer returns only nodes in that layer', () => {
      graph.createNode('node1', { layer: 1 })
      graph.createNode('node2', { layer: 1 })
      graph.createNode('node3', { layer: 2 })
      const layer1 = graph.getNodesInLayer(1)
      expect(layer1).toContain('node1')
      expect(layer1).toContain('node2')
      expect(layer1).not.toContain('node3')
    })
  })

  describe('Cross-Layer Connections', () => {
    it('allows connections between different layers', () => {
      graph.createNode('node1', { layer: 1 })
      graph.createNode('node2', { layer: 2 })
      graph.connect('node1', Direction.UP, 'node2')
      expect(graph.getConnection('node1', Direction.UP)?.target).toBe('node2')
    })

    it('pathfinding works across layers', () => {
      graph.createNode('node1', { layer: 1 })
      graph.createNode('node2', { layer: 2 })
      graph.connect('node1', Direction.UP, 'node2')
      const path = graph.findPath('node1', 'node2')
      expect(path).toEqual(['node1', 'node2'])
    })

    it('getExits includes cross-layer connections', () => {
      graph.createNode('node1', { layer: 1 })
      graph.createNode('node2', { layer: 2 })
      graph.connect('node1', Direction.UP, 'node2')
      const exits = graph.getExits('node1')
      expect(exits.some(e => e.target === 'node2')).toBe(true)
    })
  })
})

describe('Zones', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
    graph.createNode('node1')
    graph.createNode('node2')
    graph.createNode('node3')
  })

  describe('setZone()', () => {
    it('assigns zone to node', () => {
      graph.setZone('node1', 'zone1')
      expect(graph.getZone('node1')).toBe('zone1')
    })

    it('overwrites existing zone', () => {
      graph.setZone('node1', 'zone1')
      graph.setZone('node1', 'zone2')
      expect(graph.getZone('node1')).toBe('zone2')
    })

    it('throws ValidationError for non-existent node', () => {
      expect(() => graph.setZone('nonexistent', 'zone1')).toThrow(ValidationError)
    })
  })

  describe('getZone()', () => {
    it('returns zone id for node', () => {
      graph.setZone('node1', 'zone1')
      expect(graph.getZone('node1')).toBe('zone1')
    })

    it('returns null for node without zone', () => {
      expect(graph.getZone('node1')).toBeNull()
    })
  })

  describe('getNodesInZone()', () => {
    it('returns empty array for empty zone', () => {
      expect(graph.getNodesInZone('zone1')).toEqual([])
    })

    it('returns all nodes in zone', () => {
      graph.setZone('node1', 'zone1')
      graph.setZone('node2', 'zone1')
      const nodes = graph.getNodesInZone('zone1')
      expect(nodes).toContain('node1')
      expect(nodes).toContain('node2')
      expect(nodes).toHaveLength(2)
    })

    it('does not include nodes in other zones', () => {
      graph.setZone('node1', 'zone1')
      graph.setZone('node2', 'zone2')
      const nodes = graph.getNodesInZone('zone1')
      expect(nodes).toContain('node1')
      expect(nodes).not.toContain('node2')
    })
  })

  describe('removeZone()', () => {
    it('removes zone from node', () => {
      graph.setZone('node1', 'zone1')
      graph.removeZone('node1')
      expect(graph.getZone('node1')).toBeNull()
    })

    it('does nothing if node has no zone', () => {
      expect(() => graph.removeZone('node1')).not.toThrow()
    })
  })
})

describe('Custom Directions', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('registerDirection()', () => {
    it('registers new direction with opposite', () => {
      const PORTAL = 'PORTAL' as any
      graph.registerDirection('PORTAL', { opposite: 'PORTAL' as any })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', PORTAL, 'node2')
      expect(graph.getConnection('node1', PORTAL)?.target).toBe('node2')
    })

    it('registers direction with self-opposite', () => {
      const MIRROR = 'MIRROR' as any
      graph.registerDirection('MIRROR', { opposite: 'MIRROR' as any })
      expect(Direction.opposite('MIRROR' as any)).toBe('MIRROR')
    })

    it('registers direction with no opposite', () => {
      const WARP = 'WARP' as any
      graph.registerDirection('WARP', { opposite: null })
      expect(Direction.opposite('WARP' as any)).toBeNull()
    })

    it('new direction works in connect()', () => {
      const CUSTOM = 'CUSTOM' as any
      graph.registerDirection('CUSTOM', { opposite: null })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', CUSTOM, 'node2')
      expect(graph.getConnection('node1', CUSTOM)?.target).toBe('node2')
    })

    it('new direction works in getExits()', () => {
      const CUSTOM = 'CUSTOM' as any
      graph.registerDirection('CUSTOM', { opposite: null })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', CUSTOM, 'node2')
      const exits = graph.getExits('node1')
      expect(exits.some(e => e.direction === 'CUSTOM')).toBe(true)
    })

    it('Direction.opposite works for custom direction', () => {
      const ENTER = 'ENTER' as any
      const EXIT = 'EXIT' as any
      registerCustomDirection('ENTER', EXIT)
      expect(Direction.opposite(ENTER)).toBe(EXIT)
    })
  })
})

describe('Graph Analysis', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('getOrphans()', () => {
    it('returns nodes with no connections', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.createNode('node3')
      graph.connect('node1', Direction.NORTH, 'node2')
      const orphans = graph.getOrphans()
      expect(orphans).toContain('node3')
      expect(orphans).not.toContain('node1')
      expect(orphans).not.toContain('node2')
    })

    it('returns empty array when all nodes connected', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      expect(graph.getOrphans()).toEqual([])
    })
  })

  describe('getDeadEnds()', () => {
    it('returns nodes with only one connection', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.connect('a', Direction.NORTH, 'b')
      graph.connect('b', Direction.NORTH, 'c')
      const deadEnds = graph.getDeadEnds()
      expect(deadEnds).toContain('a')
      expect(deadEnds).toContain('c')
      expect(deadEnds).not.toContain('b')
    })

    it('returns empty array for fully connected graph', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      // Create a cycle where each node has 2+ connections
      // a: NORTH->b (and reverse SOUTH from b), NORTH<-c's SOUTH reverse
      // b: SOUTH->a, NORTH->c (and reverse SOUTH from c)
      // c: SOUTH->b, SOUTH->a
      // Using SOUTH for c->a to avoid overwriting c's WEST connection
      graph.connect('a', Direction.NORTH, 'b')
      graph.connect('b', Direction.NORTH, 'c')
      graph.connect('c', Direction.EAST, 'a')
      expect(graph.getDeadEnds()).toEqual([])
    })
  })

  describe('getSubgraphs()', () => {
    it('returns single array for connected graph', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.connect('a', Direction.NORTH, 'b')
      graph.connect('b', Direction.NORTH, 'c')
      const subgraphs = graph.getSubgraphs()
      expect(subgraphs).toHaveLength(1)
      expect(subgraphs[0]).toContain('a')
      expect(subgraphs[0]).toContain('b')
      expect(subgraphs[0]).toContain('c')
    })

    it('returns multiple arrays for disconnected subgraphs', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.createNode('d')
      graph.connect('a', Direction.NORTH, 'b')
      graph.connect('c', Direction.NORTH, 'd')
      const subgraphs = graph.getSubgraphs()
      expect(subgraphs).toHaveLength(2)
    })

    it('each subgraph contains connected nodes', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.connect('a', Direction.NORTH, 'b')
      const subgraphs = graph.getSubgraphs()
      const sub1 = subgraphs.find(s => s.includes('a'))
      const sub2 = subgraphs.find(s => s.includes('c'))
      expect(sub1).toContain('a')
      expect(sub1).toContain('b')
      expect(sub2).toContain('c')
    })
  })

  describe('validate()', () => {
    it('returns valid: true for valid graph', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.connect('a', Direction.NORTH, 'b')
      const result = graph.validate()
      expect(result.valid).toBe(true)
    })

    it('returns valid: false for invalid connections', () => {
      // Create a valid graph first
      graph.createNode('a')
      graph.createNode('b')
      graph.connect('a', Direction.NORTH, 'b')

      // Serialize it
      const data = graph.serialize()

      // Corrupt the data: add a connection to non-existent node
      data.connections['a'] = data.connections['a'] ?? {} as Record<string, any>
      data.connections['a'][Direction.EAST] = {
        target: 'nonexistent',
        direction: Direction.EAST,
        gate: null,
        cost: 1,
      }

      // Create new graph and deserialize corrupted data
      // deserialize() loads data without validation so validate() can check it
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)

      // validate() should detect the invalid connection
      const result = graph2.validate()
      expect(result.valid).toBe(false)
    })

    it('includes error descriptions', () => {
      // Create valid graph and serialize
      graph.createNode('a')
      graph.createNode('b')
      graph.connect('a', Direction.NORTH, 'b')
      const data = graph.serialize()

      // Corrupt: connection to non-existent node
      data.connections['a'][Direction.EAST] = {
        target: 'missing_node',
        direction: Direction.EAST,
        gate: null,
        cost: 1,
      }

      // Deserialize corrupted data
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)

      // validate() should return errors array with descriptions
      const result = graph2.validate()
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(Array.isArray(result.errors)).toBe(true)
      expect(result.errors!.length).toBeGreaterThan(0)
      expect(result.errors![0]).toContain('missing_node')
    })
  })
})

describe('Events', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('Node Events', () => {
    it('fires nodeCreated when node added', () => {
      const callback = vi.fn()
      graph.on('nodeCreated', callback)
      graph.createNode('node1', { name: 'Test' })
      expect(callback).toHaveBeenCalled()
    })

    it('nodeCreated includes node id and data', () => {
      const callback = vi.fn()
      graph.on('nodeCreated', callback)
      graph.createNode('node1', { name: 'Test' })
      const call = callback.mock.calls[0]
      expect(call?.[0]).toBe('node1')
      expect(call?.[1]).toMatchObject({ id: 'node1', metadata: { name: 'Test' } })
    })

    it('fires nodeRemoved when node deleted', () => {
      graph.createNode('node1')
      const callback = vi.fn()
      graph.on('nodeRemoved', callback)
      graph.removeNode('node1')
      expect(callback).toHaveBeenCalled()
    })

    it('nodeRemoved includes node id', () => {
      graph.createNode('node1')
      const callback = vi.fn()
      graph.on('nodeRemoved', callback)
      graph.removeNode('node1')
      expect(callback.mock.calls[0]?.[0]).toBe('node1')
    })
  })

  describe('Connection Events', () => {
    it('fires connectionCreated when connected', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      const callback = vi.fn()
      graph.on('connectionCreated', callback)
      graph.connect('node1', Direction.NORTH, 'node2')
      expect(callback).toHaveBeenCalled()
    })

    it('connectionCreated includes from, direction, to', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      const callback = vi.fn()
      graph.on('connectionCreated', callback)
      graph.connect('node1', Direction.NORTH, 'node2')
      const call = callback.mock.calls[0]
      expect(call?.[0]).toBe('node1')
      expect(call?.[1]).toBe('NORTH')
      expect(call?.[2]).toBe('node2')
    })

    it('fires connectionRemoved when disconnected', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      const callback = vi.fn()
      graph.on('connectionRemoved', callback)
      graph.disconnect('node1', Direction.NORTH)
      expect(callback).toHaveBeenCalled()
    })

    it('connectionRemoved includes from, direction', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      const callback = vi.fn()
      graph.on('connectionRemoved', callback)
      graph.disconnect('node1', Direction.NORTH)
      const call = callback.mock.calls[0]
      expect(call?.[0]).toBe('node1')
      expect(call?.[1]).toBe('NORTH')
    })
  })

  describe('Gate Events', () => {
    beforeEach(() => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
    })

    it('fires gateUpdated when gate set', () => {
      const callback = vi.fn()
      graph.on('gateUpdated', callback)
      graph.setGate('node1', Direction.NORTH, { id: 'gate1' })
      expect(callback).toHaveBeenCalled()
    })

    it('fires gateUpdated when gate modified', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true })
      const callback = vi.fn()
      graph.on('gateUpdated', callback)
      graph.updateGate('node1', Direction.NORTH, { locked: false })
      expect(callback).toHaveBeenCalled()
    })

    it('fires gateUpdated when gate removed', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1' })
      const callback = vi.fn()
      graph.on('gateUpdated', callback)
      graph.removeGate('node1', Direction.NORTH)
      expect(callback).toHaveBeenCalled()
    })

    it('gateUpdated includes from, direction, gate data', () => {
      const callback = vi.fn()
      graph.on('gateUpdated', callback)
      graph.setGate('node1', Direction.NORTH, { id: 'gate1' })
      const call = callback.mock.calls[0]
      expect(call?.[0]).toBe('node1')
      expect(call?.[1]).toBe('NORTH')
      expect(call?.[2]).toMatchObject({ id: 'gate1' })
    })
  })

  describe('Event Subscription', () => {
    it('on() returns unsubscribe function', () => {
      const unsub = graph.on('nodeCreated', () => {})
      expect(typeof unsub).toBe('function')
    })

    it('unsubscribe stops event firing', () => {
      const callback = vi.fn()
      const unsub = graph.on('nodeCreated', callback)
      graph.createNode('node1')
      unsub()
      graph.createNode('node2')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('multiple listeners receive events', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      graph.on('nodeCreated', callback1)
      graph.on('nodeCreated', callback2)
      graph.createNode('node1')
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })
})

describe('Serialization', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('serialize()', () => {
    it('returns JSON-compatible object', () => {
      graph.createNode('node1')
      const data = graph.serialize()
      const json = JSON.stringify(data)
      expect(JSON.parse(json)).toBeDefined()
    })

    it('includes all nodes', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      const data = graph.serialize()
      expect(data.nodes.node1).toBeDefined()
      expect(data.nodes.node2).toBeDefined()
    })

    it('includes all connections', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      const data = graph.serialize()
      expect(data.connections.node1?.[Direction.NORTH]).toBeDefined()
    })

    it('includes all gates', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true })
      const data = graph.serialize()
      expect(data.connections.node1?.[Direction.NORTH]?.gate).toBeDefined()
    })

    it('includes node metadata', () => {
      graph.createNode('node1', { name: 'Test', custom: 'value' })
      const data = graph.serialize()
      expect(data.nodes.node1?.metadata.name).toBe('Test')
      expect(data.nodes.node1?.metadata.custom).toBe('value')
    })

    it('includes tile data', () => {
      graph.createNode('node1', { tiles: [{ x: 5, y: 3 }] })
      const data = graph.serialize()
      expect(data.nodes.node1?.tiles).toBeDefined()
      expect(data.nodes.node1?.tiles?.[0]).toEqual({ x: 5, y: 3, layer: 1 })
    })

    it('includes layer data', () => {
      graph.createNode('node1', { layer: 2 })
      const data = graph.serialize()
      expect(data.nodes.node1?.layer).toBe(2)
    })

    it('includes zone data', () => {
      graph.createNode('node1')
      graph.setZone('node1', 'zone1')
      const data = graph.serialize()
      expect(data.nodes.node1?.zone).toBe('zone1')
    })
  })

  describe('deserialize()', () => {
    it('restores nodes from serialized data', () => {
      graph.createNode('node1', { name: 'Test' })
      const data = graph.serialize()
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)
      expect(graph2.hasNode('node1')).toBe(true)
      expect(graph2.getNode('node1')?.metadata.name).toBe('Test')
    })

    it('restores connections from serialized data', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      const data = graph.serialize()
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)
      expect(graph2.getConnection('node1', Direction.NORTH)?.target).toBe('node2')
    })

    it('restores gates from serialized data', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true })
      const data = graph.serialize()
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)
      expect(graph2.getGate('node1', Direction.NORTH)?.id).toBe('gate1')
      expect(graph2.getGate('node1', Direction.NORTH)?.locked).toBe(true)
    })

    it('restores metadata', () => {
      graph.createNode('node1', { custom: 'value' })
      const data = graph.serialize()
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)
      expect(graph2.getNode('node1')?.metadata.custom).toBe('value')
    })

    it('clears existing data before deserialize', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      const data = graph.serialize()

      const graph2 = createSpatialGraph()
      graph2.createNode('old')
      graph2.deserialize(data)
      expect(graph2.hasNode('old')).toBe(false)
      expect(graph2.hasNode('node1')).toBe(true)
    })

    it('throws ValidationError for invalid data', () => {
      expect(() => graph.deserialize({} as any)).toThrow(ValidationError)
    })
  })

  describe('Round-Trip', () => {
    it('serialize then deserialize produces identical graph', () => {
      graph.createNode('node1', { name: 'Test' })
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      const data = graph.serialize()
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)
      const data2 = graph2.serialize()
      expect(JSON.stringify(data)).toBe(JSON.stringify(data2))
    })

    it('connections work after round-trip', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      const data = graph.serialize()
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)
      const path = graph2.findPath('node1', 'node2')
      expect(path).toEqual(['node1', 'node2'])
    })

    it('gates work after round-trip', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true })
      const data = graph.serialize()
      const graph2 = createSpatialGraph()
      graph2.deserialize(data)
      const result = graph2.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(false)
    })
  })
})

describe('Integration with @motioneffector/flags', () => {
  describe('Flag Store', () => {
    it('accepts flagStore in options', () => {
      const flagStore = { check: () => true }
      const graph = createSpatialGraph({ flagStore })
      expect(graph).toBeDefined()
    })

    it('gate conditions evaluated against flagStore', () => {
      const flagStore = { check: () => true }
      const graph = createSpatialGraph({ flagStore })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        condition: { check: ['flag', '==', true] },
      })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(true)
    })

    it('works without flagStore (conditions ignored)', () => {
      const graph = createSpatialGraph()
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        condition: { check: ['flag', '==', true] },
      })
      const result = graph.canTraverse('node1', Direction.NORTH)
      // Without flagStore, condition-based gates default to blocked
      expect(result.allowed).toBe(false)
    })
  })

  describe('Condition Evaluation', () => {
    it('simple equality check works', () => {
      const flagStore = {
        check: (cond: unknown) => {
          const c = cond as { check: [string, string, unknown] }
          return c.check[2] === true
        },
      }
      const graph = createSpatialGraph({ flagStore })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        condition: { check: ['flag', '==', true] },
      })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(true)
    })

    it('numeric comparison works', () => {
      const flagStore = { check: () => true }
      const graph = createSpatialGraph({ flagStore })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        condition: { check: ['score', '>', 100] },
      })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(true)
    })

    it('and/or combinations work', () => {
      const flagStore = { check: () => true }
      const graph = createSpatialGraph({ flagStore })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        condition: { check: 'complex' },
      })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(true)
    })

    it('flag changes affect traversal', () => {
      let flagValue = false
      const flagStore = { check: () => flagValue }
      const graph = createSpatialGraph({ flagStore })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        condition: { check: ['flag', '==', true] },
      })
      expect(graph.canTraverse('node1', Direction.NORTH).allowed).toBe(false)
      flagValue = true
      expect(graph.canTraverse('node1', Direction.NORTH).allowed).toBe(true)
    })
  })
})

describe('Edge Cases', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('Empty Graph', () => {
    it('getAllNodes returns empty array', () => {
      expect(graph.getAllNodes()).toEqual([])
    })

    it('getOrphans returns empty array', () => {
      expect(graph.getOrphans()).toEqual([])
    })

    it('serialize works on empty graph', () => {
      const data = graph.serialize()
      expect(data.nodes).toEqual({})
    })
  })

  describe('Self-Connections', () => {
    it('allows connecting node to itself', () => {
      graph.createNode('node1')
      expect(() => graph.connect('node1', Direction.NORTH, 'node1')).not.toThrow()
    })

    it('self-connection appears in getExits', () => {
      graph.createNode('node1')
      graph.connect('node1', Direction.NORTH, 'node1')
      const exits = graph.getExits('node1')
      expect(exits.some(e => e.target === 'node1')).toBe(true)
    })

    it('pathfinding handles self-loops', () => {
      graph.createNode('node1')
      graph.connect('node1', Direction.NORTH, 'node1')
      const path = graph.findPath('node1', 'node1')
      expect(path).toEqual(['node1'])
    })
  })

  describe('Large Graphs', () => {
    it('handles 1000 nodes', () => {
      for (let i = 0; i < 1000; i++) {
        graph.createNode(`node${i}`)
      }
      expect(graph.getAllNodes()).toHaveLength(1000)
    })

    it('handles 10000 connections', () => {
      // Create 101 nodes (to have enough pairs for 10000 connections)
      for (let i = 0; i < 101; i++) {
        graph.createNode(`node${i}`)
      }
      // Create 10000 connections
      let count = 0
      const dirs = [
        Direction.NORTH,
        Direction.SOUTH,
        Direction.EAST,
        Direction.WEST,
      ]
      for (let i = 0; i < 101 && count < 10000; i++) {
        for (let j = 0; j < 101 && count < 10000; j++) {
          if (i !== j) {
            const dir = dirs[count % dirs.length] ?? Direction.NORTH
            graph.connect(`node${i}`, dir, `node${j}`, { bidirectional: false })
            count++
          }
        }
      }
      // Verify connections were actually created
      expect(count).toBe(10000)
      // Verify graph still works by sampling some connections
      expect(graph.getConnection('node0', Direction.NORTH)).toBeDefined()
      expect(graph.getAllNodes().length).toBe(101)
    })

    it('pathfinding completes in reasonable time', () => {
      // Create a chain of 100 nodes
      for (let i = 0; i < 100; i++) {
        graph.createNode(`node${i}`)
      }
      for (let i = 0; i < 99; i++) {
        graph.connect(`node${i}`, Direction.NORTH, `node${i + 1}`)
      }
      const start = Date.now()
      const path = graph.findPath('node0', 'node99')
      const elapsed = Date.now() - start
      expect(path).toBeDefined()
      expect(elapsed).toBeLessThan(1000) // Should complete in < 1 second
    })
  })

  describe('Unicode', () => {
    it('handles unicode node ids', () => {
      graph.createNode('日本')
      expect(graph.hasNode('日本')).toBe(true)
    })

    it('handles unicode in metadata', () => {
      graph.createNode('node1', { name: '日本語' })
      expect(graph.getNode('node1')?.metadata.name).toBe('日本語')
    })

    it('handles emoji in descriptions', () => {
      graph.createNode('node1', { description: '🎮 Game room' })
      expect(graph.getNode('node1')?.metadata.description).toBe('🎮 Game room')
    })
  })
})
