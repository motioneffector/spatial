/**
 * Direction constants and utilities for spatial navigation
 */

import type { Direction as DirectionType, DirectionUtil } from './types'

/**
 * Standard compass and special directions
 */
export const Direction = {
  // Compass directions
  NORTH: 'NORTH',
  NORTHEAST: 'NORTHEAST',
  EAST: 'EAST',
  SOUTHEAST: 'SOUTHEAST',
  SOUTH: 'SOUTH',
  SOUTHWEST: 'SOUTHWEST',
  WEST: 'WEST',
  NORTHWEST: 'NORTHWEST',

  // Vertical
  UP: 'UP',
  DOWN: 'DOWN',

  // Special
  IN: 'IN',
  OUT: 'OUT',
} as const

// Direction opposites map
const opposites = new Map<DirectionType, DirectionType | null>([
  ['NORTH', 'SOUTH'],
  ['SOUTH', 'NORTH'],
  ['EAST', 'WEST'],
  ['WEST', 'EAST'],
  ['NORTHEAST', 'SOUTHWEST'],
  ['SOUTHWEST', 'NORTHEAST'],
  ['NORTHWEST', 'SOUTHEAST'],
  ['SOUTHEAST', 'NORTHWEST'],
  ['UP', 'DOWN'],
  ['DOWN', 'UP'],
  ['IN', 'OUT'],
  ['OUT', 'IN'],
])

// Direction parsing map
const parseMap = new Map<string, DirectionType>([
  ['north', 'NORTH'],
  ['n', 'NORTH'],
  ['northeast', 'NORTHEAST'],
  ['ne', 'NORTHEAST'],
  ['east', 'EAST'],
  ['e', 'EAST'],
  ['southeast', 'SOUTHEAST'],
  ['se', 'SOUTHEAST'],
  ['south', 'SOUTH'],
  ['s', 'SOUTH'],
  ['southwest', 'SOUTHWEST'],
  ['sw', 'SOUTHWEST'],
  ['west', 'WEST'],
  ['w', 'WEST'],
  ['northwest', 'NORTHWEST'],
  ['nw', 'NORTHWEST'],
  ['up', 'UP'],
  ['u', 'UP'],
  ['down', 'DOWN'],
  ['d', 'DOWN'],
  ['in', 'IN'],
  ['out', 'OUT'],
])

/**
 * Get the opposite direction
 *
 * @param direction - The direction to find the opposite of
 * @returns The opposite direction, or null if no opposite exists
 *
 * @example
 * ```typescript
 * Direction.opposite('NORTH') // 'SOUTH'
 * Direction.opposite('UP')    // 'DOWN'
 * ```
 */
function opposite(direction: DirectionType): DirectionType | null {
  return opposites.get(direction) ?? null
}

/**
 * Parse a direction string to a Direction constant
 *
 * @param input - The string to parse (case-insensitive)
 * @returns The parsed direction, or null if invalid
 *
 * @example
 * ```typescript
 * Direction.parse('n')        // 'NORTH'
 * Direction.parse('northeast') // 'NORTHEAST'
 * Direction.parse('invalid')  // null
 * ```
 */
function parse(input: string): DirectionType | null {
  return parseMap.get(input.toLowerCase()) ?? null
}

// Attach utility methods to Direction object
;(Direction as typeof Direction & DirectionUtil).opposite = opposite
;(Direction as typeof Direction & DirectionUtil).parse = parse

/**
 * Register a custom direction
 *
 * @param direction - The direction name
 * @param oppositeDir - The opposite direction, or null if none
 */
export function registerCustomDirection(
  direction: string,
  oppositeDir: DirectionType | null
): void {
  const dir = direction as DirectionType
  opposites.set(dir, oppositeDir)
  if (oppositeDir) {
    // Also register the reverse mapping
    opposites.set(oppositeDir, dir)
  }
}
