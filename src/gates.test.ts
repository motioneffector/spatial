import { describe, it, expect, beforeEach } from 'vitest'
import { createSpatialGraph } from './graph'
import { Direction } from './direction'
import { ValidationError } from './errors'
import type { SpatialGraph } from './types'

describe('Gate System', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
    graph.createNode('node1')
    graph.createNode('node2')
    graph.connect('node1', Direction.NORTH, 'node2')
  })

  describe('setGate()', () => {
    it('adds gate to existing connection', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1' })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.id).toBe('gate1')
    })

    it('creates gate with locked property', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.locked).toBe(true)
    })

    it('creates gate with keyId property', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', keyId: 'key1' })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.keyId).toBe('key1')
    })

    it('creates gate with condition property', () => {
      const condition = { check: ['flag', '==', true] }
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', condition })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.condition).toEqual(condition)
    })

    it('creates gate with hidden property', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', hidden: true })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.hidden).toBe(true)
    })

    it('creates gate with description property', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', description: 'A heavy door' })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.description).toBe('A heavy door')
    })

    it('creates gate with blockedMessage property', () => {
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        blockedMessage: 'The door is locked',
      })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.blockedMessage).toBe('The door is locked')
    })

    it('creates gate with custom metadata', () => {
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        metadata: { custom: 'value' },
      })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.metadata?.custom).toBe('value')
    })

    it('throws ValidationError if connection doesn\'t exist', () => {
      expect(() => graph.setGate('node1', Direction.EAST, { id: 'gate1' })).toThrow(
        ValidationError
      )
    })
  })

  describe('updateGate()', () => {
    beforeEach(() => {
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        locked: true,
        keyId: 'key1',
      })
    })

    it('updates locked property', () => {
      graph.updateGate('node1', Direction.NORTH, { locked: false })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.locked).toBe(false)
    })

    it('updates keyId property', () => {
      graph.updateGate('node1', Direction.NORTH, { keyId: 'key2' })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.keyId).toBe('key2')
    })

    it('preserves unmodified properties', () => {
      graph.updateGate('node1', Direction.NORTH, { locked: false })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.keyId).toBe('key1')
      expect(gate?.id).toBe('gate1')
    })

    it('throws ValidationError if gate doesn\'t exist', () => {
      expect(() => graph.updateGate('node1', Direction.EAST, { locked: false })).toThrow(
        ValidationError
      )
    })
  })

  describe('removeGate()', () => {
    it('removes gate from connection', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1' })
      graph.removeGate('node1', Direction.NORTH)
      expect(graph.getGate('node1', Direction.NORTH)).toBeNull()
    })

    it('connection remains after gate removal', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1' })
      graph.removeGate('node1', Direction.NORTH)
      expect(graph.getConnection('node1', Direction.NORTH)?.target).toBe('node2')
    })

    it('does nothing if no gate exists', () => {
      expect(() => graph.removeGate('node1', Direction.NORTH)).not.toThrow()
    })
  })

  describe('getGate()', () => {
    it('returns gate data for existing gate', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true })
      const gate = graph.getGate('node1', Direction.NORTH)
      expect(gate?.id).toBe('gate1')
      expect(gate?.locked).toBe(true)
    })

    it('returns null if no gate on connection', () => {
      expect(graph.getGate('node1', Direction.NORTH)).toBeNull()
    })

    it('returns null if connection doesn\'t exist', () => {
      expect(graph.getGate('node1', Direction.EAST)).toBeNull()
    })
  })
})

describe('Traversal', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
    graph.createNode('node1')
    graph.createNode('node2')
    graph.connect('node1', Direction.NORTH, 'node2')
  })

  describe('canTraverse()', () => {
    it('returns allowed: true for open connection', () => {
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(true)
    })

    it('returns allowed: false for locked gate', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(false)
    })

    it('includes reason "locked" for locked gate', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.reason).toBe('locked')
    })

    it('includes gateId for blocked gate', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.gateId).toBe('gate1')
    })

    it('returns allowed: true when key is in context', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true, keyId: 'key1' })
      const result = graph.canTraverse('node1', Direction.NORTH, {
        inventory: ['key1'],
      })
      expect(result.allowed).toBe(true)
    })

    it('evaluates condition against flagStore', () => {
      const flagStore = { check: () => true }
      graph = createSpatialGraph({ flagStore })
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

    it('returns allowed: false for hidden gate (undiscovered)', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', hidden: true })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(false)
    })

    it('returns allowed: true for hidden gate when discovered in context', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', hidden: true })
      const result = graph.canTraverse('node1', Direction.NORTH, {
        discovered: ['gate1'],
      })
      expect(result.allowed).toBe(true)
    })

    it('uses custom canTraverse function when provided', () => {
      const customCanTraverse = () => ({ allowed: false, reason: 'custom' })
      graph = createSpatialGraph({ canTraverse: customCanTraverse })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('custom')
    })
  })

  describe('Key-based Traversal', () => {
    it('checks context.inventory for keyId', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true, keyId: 'key1' })
      const result = graph.canTraverse('node1', Direction.NORTH, {
        inventory: ['key1', 'key2'],
      })
      expect(result.allowed).toBe(true)
    })

    it('allows traversal when key present', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true, keyId: 'key1' })
      const result = graph.canTraverse('node1', Direction.NORTH, {
        inventory: ['key1'],
      })
      expect(result.allowed).toBe(true)
    })

    it('blocks traversal when key absent', () => {
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true, keyId: 'key1' })
      const result = graph.canTraverse('node1', Direction.NORTH, {
        inventory: ['key2'],
      })
      expect(result.allowed).toBe(false)
    })
  })

  describe('Condition-based Traversal', () => {
    it('evaluates simple flag check', () => {
      const flagStore = {
        check: (cond: unknown) => {
          const c = cond as { check: [string, string, unknown] }
          return c.check[0] === 'defeated_guard' && c.check[2] === true
        },
      }
      graph = createSpatialGraph({ flagStore })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        condition: { check: ['defeated_guard', '==', true] },
      })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(true)
    })

    it('evaluates complex and/or conditions', () => {
      const flagStore = { check: () => true }
      graph = createSpatialGraph({ flagStore })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        condition: { check: ['complex', '==', true] },
      })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(true)
    })

    it('blocks when condition fails', () => {
      const flagStore = { check: () => false }
      graph = createSpatialGraph({ flagStore })
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, {
        id: 'gate1',
        condition: { check: ['flag', '==', true] },
      })
      const result = graph.canTraverse('node1', Direction.NORTH)
      expect(result.allowed).toBe(false)
    })

    it('allows when condition passes', () => {
      const flagStore = { check: () => true }
      graph = createSpatialGraph({ flagStore })
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
  })
})
