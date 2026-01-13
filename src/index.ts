/**
 * @motioneffector/spatial
 *
 * Directional graph for room-based spatial navigation
 */

// Main exports
export { createSpatialGraph } from './graph'
export { Direction } from './direction'

// Error exports
export { SpatialError, ValidationError } from './errors'

// Type exports
export type {
  Direction as DirectionType,
  DirectionUtil,
  TilePosition,
  NodeMetadata,
  CreateNodeOptions,
  NodeData,
  Condition,
  Gate,
  Connection,
  ConnectionData,
  ExitInfo,
  ConnectOptions,
  TraversalContext,
  TraversalResult,
  CanTraverseFunction,
  PathfindingOptions,
  ReachableOptions,
  RegisterDirectionOptions,
  BoundingBox,
  ValidationResult,
  SpatialGraphOptions,
  SpatialGraphEvent,
  SerializedGraph,
  SpatialGraph,
} from './types'
