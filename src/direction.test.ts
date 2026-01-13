import { describe, it, expect } from 'vitest'
import { Direction } from './direction'

describe('Direction', () => {
  describe('Constants', () => {
    it('exports NORTH constant', () => {
      expect(Direction.NORTH).toBe('NORTH')
    })

    it('exports NORTHEAST constant', () => {
      expect(Direction.NORTHEAST).toBe('NORTHEAST')
    })

    it('exports EAST constant', () => {
      expect(Direction.EAST).toBe('EAST')
    })

    it('exports SOUTHEAST constant', () => {
      expect(Direction.SOUTHEAST).toBe('SOUTHEAST')
    })

    it('exports SOUTH constant', () => {
      expect(Direction.SOUTH).toBe('SOUTH')
    })

    it('exports SOUTHWEST constant', () => {
      expect(Direction.SOUTHWEST).toBe('SOUTHWEST')
    })

    it('exports WEST constant', () => {
      expect(Direction.WEST).toBe('WEST')
    })

    it('exports NORTHWEST constant', () => {
      expect(Direction.NORTHWEST).toBe('NORTHWEST')
    })

    it('exports UP constant', () => {
      expect(Direction.UP).toBe('UP')
    })

    it('exports DOWN constant', () => {
      expect(Direction.DOWN).toBe('DOWN')
    })

    it('exports IN constant', () => {
      expect(Direction.IN).toBe('IN')
    })

    it('exports OUT constant', () => {
      expect(Direction.OUT).toBe('OUT')
    })
  })

  describe('Direction.opposite()', () => {
    it('returns SOUTH for NORTH', () => {
      expect(Direction.opposite('NORTH')).toBe('SOUTH')
    })

    it('returns NORTH for SOUTH', () => {
      expect(Direction.opposite('SOUTH')).toBe('NORTH')
    })

    it('returns WEST for EAST', () => {
      expect(Direction.opposite('EAST')).toBe('WEST')
    })

    it('returns EAST for WEST', () => {
      expect(Direction.opposite('WEST')).toBe('EAST')
    })

    it('returns SOUTHWEST for NORTHEAST', () => {
      expect(Direction.opposite('NORTHEAST')).toBe('SOUTHWEST')
    })

    it('returns NORTHEAST for SOUTHWEST', () => {
      expect(Direction.opposite('SOUTHWEST')).toBe('NORTHEAST')
    })

    it('returns NORTHWEST for SOUTHEAST', () => {
      expect(Direction.opposite('SOUTHEAST')).toBe('NORTHWEST')
    })

    it('returns SOUTHEAST for NORTHWEST', () => {
      expect(Direction.opposite('NORTHWEST')).toBe('SOUTHEAST')
    })

    it('returns DOWN for UP', () => {
      expect(Direction.opposite('UP')).toBe('DOWN')
    })

    it('returns UP for DOWN', () => {
      expect(Direction.opposite('DOWN')).toBe('UP')
    })

    it('returns OUT for IN', () => {
      expect(Direction.opposite('IN')).toBe('OUT')
    })

    it('returns IN for OUT', () => {
      expect(Direction.opposite('OUT')).toBe('IN')
    })
  })

  describe('Direction.parse()', () => {
    it('parses "north" to NORTH', () => {
      expect(Direction.parse('north')).toBe('NORTH')
    })

    it('parses "n" to NORTH', () => {
      expect(Direction.parse('n')).toBe('NORTH')
    })

    it('parses "N" to NORTH (case insensitive)', () => {
      expect(Direction.parse('N')).toBe('NORTH')
    })

    it('parses "northeast" to NORTHEAST', () => {
      expect(Direction.parse('northeast')).toBe('NORTHEAST')
    })

    it('parses "ne" to NORTHEAST', () => {
      expect(Direction.parse('ne')).toBe('NORTHEAST')
    })

    it('parses "up" to UP', () => {
      expect(Direction.parse('up')).toBe('UP')
    })

    it('parses "u" to UP', () => {
      expect(Direction.parse('u')).toBe('UP')
    })

    it('parses "down" to DOWN', () => {
      expect(Direction.parse('down')).toBe('DOWN')
    })

    it('parses "d" to DOWN', () => {
      expect(Direction.parse('d')).toBe('DOWN')
    })

    it('parses "in" to IN', () => {
      expect(Direction.parse('in')).toBe('IN')
    })

    it('parses "out" to OUT', () => {
      expect(Direction.parse('out')).toBe('OUT')
    })

    it('returns null for invalid direction string', () => {
      expect(Direction.parse('invalid')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(Direction.parse('')).toBeNull()
    })
  })
})
