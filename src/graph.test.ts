import { describe, it, expect, beforeEach } from 'vitest'
import { createSpatialGraph } from './graph'
import { Direction } from './direction'
import { ValidationError } from './errors'
import type { SpatialGraph } from './types'

describe('createSpatialGraph()', () => {
  describe('Basic Functionality', () => {
    it('creates an empty graph with no options', () => {
      const graph = createSpatialGraph()
      graph.createNode('test')
      expect(graph.hasNode('test')).toBe(true)
      expect(graph.getAllNodes()).toEqual(['test'])
    })

    it('creates a graph with flagStore option', () => {
      const flagStore = { check: () => true }
      const graph = createSpatialGraph({ flagStore })
      graph.createNode('test')
      expect(graph.hasNode('test')).toBe(true)
    })

    it('creates a graph with custom canTraverse function', () => {
      const canTraverse = () => ({ allowed: true })
      const graph = createSpatialGraph({ canTraverse })
      graph.createNode('test')
      expect(graph.hasNode('test')).toBe(true)
    })

    it('returns object with all expected methods', () => {
      const graph = createSpatialGraph()
      graph.createNode('a')
      expect(graph.getNode('a')?.id).toBe('a')
      graph.createNode('b')
      graph.connect('a', Direction.NORTH, 'b')
      expect(graph.findPath('a', 'b')).toEqual(['a', 'b'])
    })
  })
})

describe('Node Management', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('createNode()', () => {
    it('creates a node with string id', () => {
      graph.createNode('node1')
      expect(graph.hasNode('node1')).toBe(true)
    })

    it('creates a node with metadata', () => {
      graph.createNode('node1', { custom: 'data' })
      const node = graph.getNode('node1')
      expect(node?.metadata.custom).toBe('data')
    })

    it('stores name in metadata', () => {
      graph.createNode('node1', { name: 'Test Node' })
      const node = graph.getNode('node1')
      expect(node?.metadata.name).toBe('Test Node')
    })

    it('stores description in metadata', () => {
      graph.createNode('node1', { description: 'A test node' })
      const node = graph.getNode('node1')
      expect(node?.metadata.description).toBe('A test node')
    })

    it('stores custom properties in metadata', () => {
      graph.createNode('node1', { foo: 'bar', baz: 123 })
      const node = graph.getNode('node1')
      expect(node?.metadata.foo).toBe('bar')
      expect(node?.metadata.baz).toBe(123)
    })

    it('throws ValidationError for duplicate node id', () => {
      graph.createNode('node1')
      expect(() => graph.createNode('node1')).toThrow(/already exists/)
    })

    it('throws ValidationError for empty string id', () => {
      expect(() => graph.createNode('')).toThrow(/cannot be empty/)
    })
  })

  describe('getNode()', () => {
    it('returns node data for existing node', () => {
      graph.createNode('node1', { name: 'Test' })
      const node = graph.getNode('node1')
      expect(node).toBeDefined()
      expect(node?.id).toBe('node1')
    })

    it('returns null for non-existent node', () => {
      graph.createNode('existing')
      expect(graph.getNode('existing')?.id).toBe('existing')
      const node = graph.getNode('nonexistent')
      expect(node).toBe(null)
    })

    it('includes metadata in returned data', () => {
      graph.createNode('node1', { name: 'Test', custom: 'value' })
      const node = graph.getNode('node1')
      expect(node?.metadata.name).toBe('Test')
      expect(node?.metadata.custom).toBe('value')
    })
  })

  describe('hasNode()', () => {
    it('returns true for existing node', () => {
      graph.createNode('node1')
      expect(graph.hasNode('node1')).toBe(true)
    })

    it('returns false for non-existent node', () => {
      expect(graph.hasNode('nonexistent')).toBe(false)
    })
  })

  describe('removeNode()', () => {
    it('removes existing node', () => {
      graph.createNode('node1')
      graph.removeNode('node1')
      expect(graph.hasNode('node1')).toBe(false)
    })

    it('removes all connections to/from removed node', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.createNode('node3')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.connect('node3', Direction.SOUTH, 'node1')

      // Verify connections exist before removal
      expect(graph.getConnection('node2', Direction.SOUTH)?.target).toBe('node1')
      expect(graph.getConnection('node3', Direction.SOUTH)?.target).toBe('node1')

      graph.removeNode('node1')

      expect(graph.getConnection('node2', Direction.SOUTH)).toBeNull()
      expect(graph.getConnection('node3', Direction.SOUTH)).toBeNull()
    })

    it('throws ValidationError for non-existent node', () => {
      expect(() => graph.removeNode('nonexistent')).toThrow(/does not exist/)
    })

    it('returns removed node data', () => {
      graph.createNode('node1', { name: 'Test' })
      const removed = graph.removeNode('node1')
      expect(removed.id).toBe('node1')
      expect(removed.metadata.name).toBe('Test')
    })
  })

  describe('getAllNodes()', () => {
    it('returns empty array for empty graph and non-empty after adding node', () => {
      expect(graph.getAllNodes()).toStrictEqual([])
      graph.createNode('a')
      expect(graph.getAllNodes()).toEqual(['a'])
    })

    it('returns all node ids', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.createNode('node3')
      const nodes = graph.getAllNodes()
      expect(nodes).toHaveLength(3)
      expect(nodes).toEqual(expect.arrayContaining(['node1', 'node2', 'node3']))
      // Verify no extra nodes
      expect(nodes.every(id => ['node1', 'node2', 'node3'].includes(id))).toBe(true)
    })

    it('does not include removed nodes', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.removeNode('node1')
      const nodes = graph.getAllNodes()
      expect(nodes).not.toContain('node1')
      expect(nodes).toContain('node2')
    })
  })
})

describe('Connection Management', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
    graph.createNode('node1')
    graph.createNode('node2')
    graph.createNode('node3')
  })

  describe('connect()', () => {
    it('creates connection from source to target', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      const conn = graph.getConnection('node1', Direction.NORTH)
      expect(conn?.target).toBe('node2')
    })

    it('creates bidirectional connection by default', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      expect(graph.getConnection('node1', Direction.NORTH)?.target).toBe('node2')
      expect(graph.getConnection('node2', Direction.SOUTH)?.target).toBe('node1')
    })

    it('creates one-way connection when bidirectional: false', () => {
      graph.connect('node1', Direction.NORTH, 'node2', { bidirectional: false })
      expect(graph.getConnection('node1', Direction.NORTH)?.target).toBe('node2')
      // Bidirectional true creates reverse; bidirectional false does not
      graph.connect('node2', Direction.EAST, 'node3')
      expect(graph.getConnection('node3', Direction.WEST)?.target).toBe('node2')
      expect(graph.getConnection('node2', Direction.SOUTH)).toBe(null)
    })

    it('stores direction on connection', () => {
      graph.connect('node1', Direction.EAST, 'node2')
      const conn = graph.getConnection('node1', Direction.EAST)
      expect(conn?.direction).toBe('EAST')
    })

    it('overwrites existing connection in same direction', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.connect('node1', Direction.NORTH, 'node3')
      const conn = graph.getConnection('node1', Direction.NORTH)
      expect(conn?.target).toBe('node3')
    })

    it('throws ValidationError for non-existent source node', () => {
      expect(() => graph.connect('nonexistent', Direction.NORTH, 'node2')).toThrow(
        /does not exist/
      )
    })

    it('throws ValidationError for non-existent target node', () => {
      expect(() => graph.connect('node1', Direction.NORTH, 'nonexistent')).toThrow(
        /does not exist/
      )
    })
  })

  describe('disconnect()', () => {
    it('removes connection in specified direction', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      expect(graph.getConnection('node1', Direction.NORTH)?.target).toBe('node2')
      graph.disconnect('node1', Direction.NORTH)
      expect(graph.getConnection('node1', Direction.NORTH)).toBe(null)
    })

    it('removes reverse connection for bidirectional', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      expect(graph.getConnection('node2', Direction.SOUTH)?.target).toBe('node1')
      graph.disconnect('node1', Direction.NORTH)
      expect(graph.getConnection('node2', Direction.SOUTH)).toBe(null)
    })

    it('only removes one direction when bidirectional: false', () => {
      graph.connect('node1', Direction.NORTH, 'node2', { bidirectional: false })
      expect(graph.getConnection('node1', Direction.NORTH)?.target).toBe('node2')
      graph.disconnect('node1', Direction.NORTH, { bidirectional: false })
      expect(graph.getConnection('node1', Direction.NORTH)).toBe(null)
      // No reverse connection existed anyway
    })

    it('does nothing if connection doesn\'t exist', () => {
      expect(() => graph.disconnect('node1', Direction.NORTH)).not.toThrow()
    })

    it('throws ValidationError for non-existent node', () => {
      expect(() => graph.disconnect('nonexistent', Direction.NORTH)).toThrow(/does not exist/)
    })
  })

  describe('getConnection()', () => {
    it('returns connection data for existing connection', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      const conn = graph.getConnection('node1', Direction.NORTH)
      expect(conn).not.toBeNull()
      expect(conn?.target).toBe('node2')
      expect(conn?.direction).toBe('NORTH')
    })

    it('returns null for non-existent connection', () => {
      graph.connect('node1', Direction.EAST, 'node2')
      expect(graph.getConnection('node1', Direction.EAST)?.target).toBe('node2')
      const conn = graph.getConnection('node1', Direction.NORTH)
      expect(conn).toBe(null)
    })

    it('includes target node id', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      const conn = graph.getConnection('node1', Direction.NORTH)
      expect(conn?.target).toBe('node2')
    })

    it('includes direction', () => {
      graph.connect('node1', Direction.EAST, 'node2')
      const conn = graph.getConnection('node1', Direction.EAST)
      expect(conn?.direction).toBe('EAST')
    })

    it('includes gate if present', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, { id: 'gate1' })
      const conn = graph.getConnection('node1', Direction.NORTH)
      expect(conn?.gate?.id).toBe('gate1')
    })
  })

  describe('getExits()', () => {
    it('returns empty array for node with no connections', () => {
      graph.connect('node2', Direction.NORTH, 'node3')
      const node2Exits = graph.getExits('node2')
      expect(node2Exits).toHaveLength(1)
      expect(node2Exits[0]?.target).toBe('node3')
      const exits = graph.getExits('node1')
      expect(exits).toStrictEqual([])
    })

    it('returns all exit directions', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.connect('node1', Direction.EAST, 'node3')
      const exits = graph.getExits('node1')
      expect(exits).toHaveLength(2)
      expect(exits.some(e => e.direction === 'NORTH')).toBe(true)
      expect(exits.some(e => e.direction === 'EAST')).toBe(true)
    })

    it('includes target for each exit', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      const exits = graph.getExits('node1')
      expect(exits[0]?.target).toBe('node2')
    })

    it('includes gate info for each exit', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, { id: 'gate1' })
      const exits = graph.getExits('node1')
      expect(exits[0]?.gate?.id).toBe('gate1')
    })

    it('throws ValidationError for non-existent node', () => {
      expect(() => graph.getExits('nonexistent')).toThrow(/does not exist/)
    })
  })

  describe('getDestination()', () => {
    it('returns target node id for valid direction', () => {
      graph.connect('node1', Direction.NORTH, 'node2')
      expect(graph.getDestination('node1', Direction.NORTH)).toBe('node2')
    })

    it('returns null for direction with no connection', () => {
      graph.connect('node1', Direction.EAST, 'node2')
      expect(graph.getDestination('node1', Direction.EAST)).toBe('node2')
      expect(graph.getDestination('node1', Direction.NORTH)).toBe(null)
    })

    it('throws ValidationError for non-existent source node', () => {
      expect(() => graph.getDestination('nonexistent', Direction.NORTH)).toThrow(
        /does not exist/
      )
    })
  })
})

describe('Security: Prototype Pollution Prevention', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('createNode() - prototype pollution prevention', () => {
    it('rejects __proto__ in metadata', () => {
      const malicious = { __proto__: { polluted: true } } as Record<string, unknown>
      graph.createNode('node1', malicious)
      expect(graph.hasNode('node1')).toBe(true)
      expect((({} as Record<string, unknown>).polluted as boolean | undefined)).toBe(undefined)
    })

    it('rejects constructor in metadata', () => {
      const malicious = { constructor: { prototype: { polluted: true } } } as Record<
        string,
        unknown
      >
      graph.createNode('node1', malicious)
      expect(graph.hasNode('node1')).toBe(true)
      expect((({} as Record<string, unknown>).polluted as boolean | undefined)).toBe(undefined)
    })

    it('rejects prototype key in metadata', () => {
      const malicious = { prototype: { polluted: true } } as Record<string, unknown>
      graph.createNode('node1', malicious)
      expect(graph.hasNode('node1')).toBe(true)
      expect((({} as Record<string, unknown>).polluted as boolean | undefined)).toBe(undefined)
    })

    it('still accepts normal metadata', () => {
      graph.createNode('node1', { name: 'Test', custom: 'value' })
      const node = graph.getNode('node1')
      expect(node?.metadata.name).toBe('Test')
      expect(node?.metadata.custom).toBe('value')
    })

    it('handles JSON-parsed malicious input', () => {
      const malicious = JSON.parse('{"__proto__": {"polluted": true}}')
      graph.createNode('node1', malicious)
      expect(graph.hasNode('node1')).toBe(true)
      expect((({} as Record<string, unknown>).polluted as boolean | undefined)).toBe(undefined)
    })
  })

  describe('updateGate() - prototype pollution prevention', () => {
    beforeEach(() => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2', {
        gate: { id: 'gate1', locked: false },
      })
    })

    it('rejects __proto__ in gate updates', () => {
      const malicious = { __proto__: { polluted: true } } as Record<string, unknown>
      graph.updateGate('node1', Direction.NORTH, malicious)
      expect(graph.getGate('node1', Direction.NORTH)?.id).toBe('gate1')
      expect((({} as Record<string, unknown>).polluted as boolean | undefined)).toBe(undefined)
    })

    it('rejects constructor in gate updates', () => {
      const malicious = { constructor: { prototype: { polluted: true } } } as Record<
        string,
        unknown
      >
      graph.updateGate('node1', Direction.NORTH, malicious)
      expect(graph.getGate('node1', Direction.NORTH)?.id).toBe('gate1')
      expect((({} as Record<string, unknown>).polluted as boolean | undefined)).toBe(undefined)
    })

    it('rejects prototype key in gate updates', () => {
      const malicious = { prototype: { polluted: true } } as Record<string, unknown>
      graph.updateGate('node1', Direction.NORTH, malicious)
      expect(graph.getGate('node1', Direction.NORTH)?.id).toBe('gate1')
      expect((({} as Record<string, unknown>).polluted as boolean | undefined)).toBe(undefined)
    })

    it('still accepts normal gate updates', () => {
      graph.updateGate('node1', Direction.NORTH, { locked: true, keyId: 'key1' })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.locked).toBe(true)
      expect(gate?.keyId).toBe('key1')
    })
  })

  describe('deserialize() - prototype pollution prevention', () => {
    it('rejects __proto__ in deserialized node metadata', () => {
      const maliciousData = {
        nodes: {
          node1: {
            id: 'node1',
            layer: 1,
            metadata: {
              __proto__: { polluted: true },
              name: 'Test',
            },
          },
        },
        connections: {},
      }
      graph.deserialize(maliciousData)
      expect(graph.hasNode('node1')).toBe(true)
      expect((({} as Record<string, unknown>).polluted as boolean | undefined)).toBe(undefined)
      // Verify normal metadata still works
      const node = graph.getNode('node1')
      expect(node?.metadata.name).toBe('Test')
    })

    it('rejects constructor in deserialized metadata', () => {
      const maliciousData = {
        nodes: {
          node1: {
            id: 'node1',
            layer: 1,
            metadata: {
              constructor: { prototype: { polluted: true } },
            },
          },
        },
        connections: {},
      }
      graph.deserialize(maliciousData)
      expect(graph.hasNode('node1')).toBe(true)
      expect((({} as Record<string, unknown>).polluted as boolean | undefined)).toBe(undefined)
    })

    it('handles JSON.parse of malicious serialized data', () => {
      const maliciousJSON = `{
        "nodes": {
          "node1": {
            "id": "node1",
            "layer": 1,
            "metadata": {
              "__proto__": {"polluted": true}
            }
          }
        },
        "connections": {}
      }`
      const maliciousData = JSON.parse(maliciousJSON)
      graph.deserialize(maliciousData)
      expect(graph.hasNode('node1')).toBe(true)
      expect((({} as Record<string, unknown>).polluted as boolean | undefined)).toBe(undefined)
    })

    it('successfully deserializes safe data', () => {
      graph.createNode('node1', { name: 'Test' })
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      const serialized = graph.serialize()

      const graph2 = createSpatialGraph()
      graph2.deserialize(serialized)
      expect(graph2.hasNode('node1')).toBe(true)
      expect(graph2.hasNode('node2')).toBe(true)
      expect(graph2.getNode('node1')?.metadata.name).toBe('Test')
    })
  })
})
