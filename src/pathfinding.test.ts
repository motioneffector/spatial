import { describe, it, expect, beforeEach } from 'vitest'
import { createSpatialGraph } from './graph'
import { Direction } from './direction'
import type { SpatialGraph } from './types'

describe('Pathfinding', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('findPath()', () => {
    it('returns direct path for adjacent nodes', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      const path = graph.findPath('node1', 'node2')
      expect(path).toEqual(['node1', 'node2'])
    })

    it('returns multi-step path', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.createNode('node3')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.connect('node2', Direction.NORTH, 'node3')
      const path = graph.findPath('node1', 'node3')
      expect(path).toEqual(['node1', 'node2', 'node3'])
    })

    it('returns shortest path when multiple routes exist', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.createNode('d')
      // Short path: a -> d
      graph.connect('a', Direction.NORTH, 'd')
      // Long path: a -> b -> c -> d
      graph.connect('a', Direction.EAST, 'b')
      graph.connect('b', Direction.NORTH, 'c')
      graph.connect('c', Direction.NORTH, 'd')
      const path = graph.findPath('a', 'd')
      expect(path).toEqual(['a', 'd'])
    })

    it('returns null when no path exists', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      // No connection
      const path = graph.findPath('node1', 'node2')
      expect(path).toBeNull()
    })

    it('returns null when blocked by locked gate', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: true })
      const path = graph.findPath('node1', 'node2')
      expect(path).toBeNull()
    })

    it('respects avoidLocked option', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      // Locked path: a -> c
      graph.connect('a', Direction.NORTH, 'c')
      graph.setGate('a', Direction.NORTH, { id: 'gate1', locked: true })
      // Open path: a -> b -> c
      graph.connect('a', Direction.EAST, 'b')
      graph.connect('b', Direction.NORTH, 'c')
      const path = graph.findPath('a', 'c', { avoidLocked: true })
      expect(path).toEqual(['a', 'b', 'c'])
    })

    it('respects maxLength option', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.connect('a', Direction.NORTH, 'b')
      graph.connect('b', Direction.NORTH, 'c')
      const path = graph.findPath('a', 'c', { maxLength: 2 })
      expect(path).toBeNull()
    })

    it('returns path through unlocked gates', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      graph.setGate('node1', Direction.NORTH, { id: 'gate1', locked: false })
      const path = graph.findPath('node1', 'node2')
      expect(path).toEqual(['node1', 'node2'])
    })

    it('handles cycles without infinite loop', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.connect('a', Direction.NORTH, 'b')
      graph.connect('b', Direction.NORTH, 'c')
      graph.connect('c', Direction.SOUTH, 'a') // Cycle
      const path = graph.findPath('a', 'c')
      expect(path).toEqual(['a', 'b', 'c'])
    })
  })

  describe('getDistance()', () => {
    it('returns 0 for same node', () => {
      graph.createNode('node1')
      expect(graph.getDistance('node1', 'node1')).toBe(0)
    })

    it('returns 1 for adjacent nodes', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      expect(graph.getDistance('node1', 'node2')).toBe(1)
    })

    it('returns correct hop count for longer paths', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.createNode('d')
      graph.connect('a', Direction.NORTH, 'b')
      graph.connect('b', Direction.NORTH, 'c')
      graph.connect('c', Direction.NORTH, 'd')
      expect(graph.getDistance('a', 'd')).toBe(3)
    })

    it('returns Infinity when no path exists', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      expect(graph.getDistance('node1', 'node2')).toBe(Infinity)
    })
  })

  describe('canReach()', () => {
    it('returns true for reachable node', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      graph.connect('node1', Direction.NORTH, 'node2')
      expect(graph.canReach('node1', 'node2')).toBe(true)
    })

    it('returns false for unreachable node', () => {
      graph.createNode('node1')
      graph.createNode('node2')
      expect(graph.canReach('node1', 'node2')).toBe(false)
    })

    it('returns true for same node', () => {
      graph.createNode('node1')
      expect(graph.canReach('node1', 'node1')).toBe(true)
    })
  })

  describe('getReachable()', () => {
    it('returns all reachable nodes from start', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.connect('a', Direction.NORTH, 'b')
      graph.connect('b', Direction.EAST, 'c')
      const reachable = graph.getReachable('a')
      expect(reachable).toHaveLength(3)
      expect(reachable).toContain('a')
      expect(reachable).toContain('b')
      expect(reachable).toContain('c')
    })

    it('respects maxDistance option', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.connect('a', Direction.NORTH, 'b')
      graph.connect('b', Direction.EAST, 'c')
      const reachable = graph.getReachable('a', { maxDistance: 1 })
      expect(reachable).toContain('a')
      expect(reachable).toContain('b')
      expect(reachable).not.toContain('c')
    })

    it('includes start node', () => {
      graph.createNode('node1')
      const reachable = graph.getReachable('node1')
      expect(reachable).toContain('node1')
    })

    it('excludes nodes beyond locked gates', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.connect('a', Direction.NORTH, 'b')
      graph.connect('b', Direction.NORTH, 'c')
      graph.setGate('b', Direction.NORTH, { id: 'gate1', locked: true })
      const reachable = graph.getReachable('a')
      expect(reachable).toContain('a')
      expect(reachable).toContain('b')
      expect(reachable).not.toContain('c')
    })
  })
})

describe('Weighted Pathfinding', () => {
  let graph: SpatialGraph

  beforeEach(() => {
    graph = createSpatialGraph()
  })

  describe('Connection Costs', () => {
    it('defaults to cost of 1', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.connect('a', Direction.NORTH, 'b')
      const conn = graph.getConnection('a', Direction.NORTH)
      expect(conn?.cost).toBe(1)
    })

    it('respects custom cost on connection', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.connect('a', Direction.NORTH, 'b', { cost: 5 })
      const conn = graph.getConnection('a', Direction.NORTH)
      expect(conn?.cost).toBe(5)
    })

    it('finds lowest-cost path not shortest hop path', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      // Short hop but high cost: a -> c (cost 10)
      graph.connect('a', Direction.NORTH, 'c', { cost: 10 })
      // More hops but lower cost: a -> b -> c (cost 1 + 1 = 2)
      graph.connect('a', Direction.EAST, 'b', { cost: 1 })
      graph.connect('b', Direction.NORTH, 'c', { cost: 1 })
      const path = graph.findPath('a', 'c')
      expect(path).toEqual(['a', 'b', 'c'])
    })

    it('accumulates costs correctly', () => {
      graph.createNode('a')
      graph.createNode('b')
      graph.createNode('c')
      graph.connect('a', Direction.NORTH, 'b', { cost: 3 })
      graph.connect('b', Direction.NORTH, 'c', { cost: 4 })
      const distance = graph.getDistance('a', 'c')
      expect(distance).toBe(7)
    })
  })
})
