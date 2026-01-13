/**
 * Type definitions for @motioneffector/spatial
 */

/**
 * Standard compass and special directions for spatial navigation
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

export type Direction = (typeof Direction)[keyof typeof Direction]

/**
 * Direction utilities
 */
export interface DirectionUtil {
  /**
   * Get the opposite direction
   */
  opposite: (direction: Direction) => Direction | null

  /**
   * Parse a direction string to a Direction constant
   */
  parse: (input: string) => Direction | null
}

/**
 * Grid coordinates for a tile
 */
export interface TilePosition {
  x: number
  y: number
  layer?: number
}

/**
 * Node metadata - any additional properties
 */
export type NodeMetadata = Record<string, unknown>

/**
 * Options for creating a node
 */
export interface CreateNodeOptions {
  name?: string
  description?: string
  tiles?: TilePosition[]
  layer?: number
  [key: string]: unknown
}

/**
 * Node data structure
 */
export interface NodeData {
  id: string
  metadata: NodeMetadata
  tiles?: TilePosition[]
  layer: number
  zone?: string
}

/**
 * Condition for conditional gates (integrates with @motioneffector/flags)
 */
export type Condition = {
  check: [string, string, unknown] | unknown
}

/**
 * Gate/door/barrier on a connection
 */
export interface Gate {
  id: string
  locked?: boolean
  keyId?: string
  condition?: Condition
  hidden?: boolean
  oneWay?: boolean
  description?: string
  blockedMessage?: string
  metadata?: Record<string, unknown>
}

/**
 * Connection between two nodes
 */
export interface Connection {
  target: string
  direction: Direction
  gate?: Gate
  cost?: number
  fromTile?: TilePosition
  toTile?: TilePosition
  bidirectional?: boolean
}

/**
 * Connection data returned by getConnection
 */
export interface ConnectionData {
  target: string
  direction: Direction
  gate?: Gate | null
  cost?: number
  fromTile?: TilePosition
  toTile?: TilePosition
}

/**
 * Exit information
 */
export interface ExitInfo {
  direction: Direction
  target: string
  gate?: Gate | null
  cost?: number
}

/**
 * Options for connecting nodes
 */
export interface ConnectOptions {
  bidirectional?: boolean
  cost?: number
  fromTile?: TilePosition
  toTile?: TilePosition
  gate?: Gate
}

/**
 * Traversal context for gate checks
 */
export interface TraversalContext {
  inventory?: string[]
  flagStore?: {
    check: (condition: Condition) => boolean
  }
  discovered?: string[]
  [key: string]: unknown
}

/**
 * Result of traversal check
 */
export interface TraversalResult {
  allowed: boolean
  reason?: string
  gateId?: string
}

/**
 * Custom traversal check function
 */
export type CanTraverseFunction = (
  connection: ConnectionData,
  gate: Gate | null,
  context: TraversalContext
) => TraversalResult

/**
 * Options for pathfinding
 */
export interface PathfindingOptions {
  avoidLocked?: boolean
  maxLength?: number
  context?: TraversalContext
}

/**
 * Options for getReachable
 */
export interface ReachableOptions {
  maxDistance?: number
  context?: TraversalContext
}

/**
 * Options for creating a custom direction
 */
export interface RegisterDirectionOptions {
  opposite?: Direction | null
}

/**
 * Bounding box for multi-tile nodes
 */
export interface BoundingBox {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Options for creating a spatial graph
 */
export interface SpatialGraphOptions {
  flagStore?: {
    check: (condition: Condition) => boolean
  }
  canTraverse?: CanTraverseFunction
}

/**
 * Event types
 */
export type SpatialGraphEvent =
  | 'nodeCreated'
  | 'nodeRemoved'
  | 'connectionCreated'
  | 'connectionRemoved'
  | 'gateUpdated'

/**
 * Event callback types
 */
export type NodeCreatedCallback = (nodeId: string, data: NodeData) => void
export type NodeRemovedCallback = (nodeId: string) => void
export type ConnectionCreatedCallback = (
  from: string,
  direction: Direction,
  to: string
) => void
export type ConnectionRemovedCallback = (from: string, direction: Direction) => void
export type GateUpdatedCallback = (
  from: string,
  direction: Direction,
  gate: Gate | null
) => void

export type EventCallback =
  | NodeCreatedCallback
  | NodeRemovedCallback
  | ConnectionCreatedCallback
  | ConnectionRemovedCallback
  | GateUpdatedCallback

/**
 * Serialized graph data
 */
export interface SerializedGraph {
  nodes: Record<string, NodeData>
  connections: Record<string, Record<Direction, ConnectionData>>
  customDirections?: Record<string, Direction | null>
}

/**
 * Spatial graph instance
 */
export interface SpatialGraph {
  // Node management
  createNode: (id: string, options?: CreateNodeOptions) => void
  getNode: (id: string) => NodeData | null
  hasNode: (id: string) => boolean
  removeNode: (id: string) => NodeData
  getAllNodes: () => string[]

  // Connection management
  connect: (from: string, direction: Direction, to: string, options?: ConnectOptions) => void
  disconnect: (from: string, direction: Direction, options?: { bidirectional?: boolean }) => void
  getConnection: (from: string, direction: Direction) => ConnectionData | null
  getExits: (nodeId: string) => ExitInfo[]
  getDestination: (from: string, direction: Direction) => string | null

  // Gate system
  setGate: (from: string, direction: Direction, gate: Gate) => void
  updateGate: (from: string, direction: Direction, updates: Partial<Gate>) => void
  removeGate: (from: string, direction: Direction) => void
  getGate: (from: string, direction: Direction) => Gate | null

  // Traversal
  canTraverse: (
    from: string,
    direction: Direction,
    context?: TraversalContext
  ) => TraversalResult

  // Pathfinding
  findPath: (
    from: string,
    to: string,
    options?: PathfindingOptions
  ) => string[] | null
  getDistance: (from: string, to: string, options?: PathfindingOptions) => number
  canReach: (from: string, to: string, options?: PathfindingOptions) => boolean
  getReachable: (from: string, options?: ReachableOptions) => string[]

  // Multi-tile nodes
  getNodeAt: (x: number, y: number, layer?: number) => string | null
  getTiles: (nodeId: string) => TilePosition[]
  getBounds: (nodeId: string) => BoundingBox | null

  // Layers
  getNodesInLayer: (layer: number) => string[]

  // Zones
  setZone: (nodeId: string, zoneId: string) => void
  getZone: (nodeId: string) => string | null
  getNodesInZone: (zoneId: string) => string[]
  removeZone: (nodeId: string) => void

  // Custom directions
  registerDirection: (direction: string, options: RegisterDirectionOptions) => void

  // Graph analysis
  getOrphans: () => string[]
  getDeadEnds: () => string[]
  getSubgraphs: () => string[][]
  validate: () => ValidationResult

  // Events
  on: (event: SpatialGraphEvent, callback: EventCallback) => () => void

  // Serialization
  serialize: () => SerializedGraph
  deserialize: (data: SerializedGraph) => void
}
