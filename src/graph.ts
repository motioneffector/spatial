/**
 * Spatial graph implementation
 */

import type {
  SpatialGraph,
  SpatialGraphOptions,
  NodeData,
  CreateNodeOptions,
  Direction as DirectionType,
  ConnectOptions,
  ConnectionData,
  ExitInfo,
  Gate,
  TraversalContext,
  TraversalResult,
  PathfindingOptions,
  ReachableOptions,
  RegisterDirectionOptions,
  BoundingBox,
  ValidationResult,
  TilePosition,
  SerializedGraph,
  EventCallback,
  SpatialGraphEvent,
} from './types'
import { ValidationError } from './errors'
import { Direction, registerCustomDirection } from './direction'

interface InternalConnection {
  target: string
  direction: DirectionType
  gate?: Gate | undefined
  cost: number
  fromTile?: TilePosition | undefined
  toTile?: TilePosition | undefined
  bidirectional: boolean
}

/**
 * Creates a new spatial graph instance
 *
 * @param options - Configuration options
 * @returns A new SpatialGraph instance
 */
export function createSpatialGraph(options?: SpatialGraphOptions): SpatialGraph {
  // Internal state
  const nodes = new Map<string, NodeData>()
  const connections = new Map<string, Map<DirectionType, InternalConnection>>()
  const tileIndex = new Map<string, string>() // "layer:x:y" -> nodeId
  const listeners = new Map<SpatialGraphEvent, Set<EventCallback>>()

  const flagStore = options?.flagStore
  const customCanTraverse = options?.canTraverse

  // Helper to create tile key
  const tileKey = (x: number, y: number, layer: number): string => `${String(layer)}:${String(x)}:${String(y)}`

  // Helper to emit events
  const emit = (event: SpatialGraphEvent, ...args: unknown[]): void => {
    const callbacks = listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        ;(callback as (...args: unknown[]) => void)(...args)
      })
    }
  }

  // Default traversal logic
  const defaultCanTraverse = (
    connection: ConnectionData,
    gate: Gate | null,
    context: TraversalContext
  ): TraversalResult => {
    if (!gate) {
      return { allowed: true }
    }

    // Check if hidden and not discovered
    if (gate.hidden && !context.discovered?.includes(gate.id)) {
      return { allowed: false, reason: 'hidden', gateId: gate.id }
    }

    // Check if locked
    if (gate.locked) {
      // Check for key in inventory
      if (gate.keyId && context.inventory?.includes(gate.keyId)) {
        return { allowed: true }
      }
      return { allowed: false, reason: 'locked', gateId: gate.id }
    }

    // Check condition against flag store
    if (gate.condition) {
      const store = context.flagStore ?? flagStore
      if (!store) {
        // Without flagStore, condition-based gates default to blocked
        return { allowed: false, reason: gate.blockedMessage ?? 'blocked', gateId: gate.id }
      }
      if (!store.check(gate.condition)) {
        return { allowed: false, reason: gate.blockedMessage ?? 'blocked', gateId: gate.id }
      }
    }

    return { allowed: true }
  }

  // Forbidden keys for prototype pollution prevention
  const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

  // Helper to safely copy object properties
  const safeCopy = (source: Record<string, unknown>): Record<string, unknown> => {
    const target: Record<string, unknown> = {}
    for (const key of Object.keys(source)) {
      if (FORBIDDEN_KEYS.has(key)) continue
      if (!Object.hasOwn(source, key)) continue
      target[key] = source[key]
    }
    return target
  }

  // Node management
  const createNode = (id: string, opts?: CreateNodeOptions): void => {
    if (!id || id.length === 0) {
      throw new ValidationError('Node id cannot be empty')
    }
    if (nodes.has(id)) {
      throw new ValidationError(`Node with id "${id}" already exists`)
    }

    const layer = opts?.layer ?? 1
    const metadata: Record<string, unknown> = safeCopy({ ...opts })
    delete metadata.tiles
    delete metadata.layer

    // Normalize tiles to include layer
    const tiles = opts?.tiles?.map(tile => ({
      x: tile.x,
      y: tile.y,
      layer: tile.layer ?? layer,
    }))

    const nodeData: NodeData = {
      id,
      metadata,
      layer,
      ...(tiles ? { tiles } : {}),
    }

    nodes.set(id, nodeData)

    // Index tiles
    if (tiles) {
      tiles.forEach(tile => {
        const key = tileKey(tile.x, tile.y, tile.layer)
        tileIndex.set(key, id)
      })
    }

    emit('nodeCreated', id, nodeData)
  }

  const getNode = (id: string): NodeData | null => {
    return nodes.get(id) ?? null
  }

  const hasNode = (id: string): boolean => {
    return nodes.has(id)
  }

  const removeNode = (id: string): NodeData => {
    const node = nodes.get(id)
    if (!node) {
      throw new ValidationError(`Node "${id}" does not exist`)
    }

    // Remove tile index entries
    if (node.tiles) {
      node.tiles.forEach(tile => {
        const key = tileKey(tile.x, tile.y, tile.layer ?? node.layer)
        tileIndex.delete(key)
      })
    }

    // Remove all connections to/from this node
    connections.delete(id)
    connections.forEach(nodeConnections => {
      const toRemove: DirectionType[] = []
      nodeConnections.forEach((conn, dir) => {
        if (conn.target === id) {
          toRemove.push(dir)
        }
      })
      toRemove.forEach(dir => nodeConnections.delete(dir))
    })

    nodes.delete(id)
    emit('nodeRemoved', id)

    return node
  }

  const getAllNodes = (): string[] => {
    return Array.from(nodes.keys())
  }

  // Connection management
  const connect = (
    from: string,
    direction: DirectionType,
    to: string,
    opts?: ConnectOptions
  ): void => {
    if (!nodes.has(from)) {
      throw new ValidationError(`Source node "${from}" does not exist`)
    }
    if (!nodes.has(to)) {
      throw new ValidationError(`Target node "${to}" does not exist`)
    }

    const bidirectional = opts?.bidirectional ?? true
    const cost = opts?.cost ?? 1

    const connection: InternalConnection = {
      target: to,
      direction,
      ...(opts?.gate ? { gate: opts.gate } : {}),
      cost,
      ...(opts?.fromTile ? { fromTile: opts.fromTile } : {}),
      ...(opts?.toTile ? { toTile: opts.toTile } : {}),
      bidirectional,
    }

    if (!connections.has(from)) {
      connections.set(from, new Map())
    }
    connections.get(from)?.set(direction, connection)

    emit('connectionCreated', from, direction, to)

    // Create reverse connection if bidirectional
    if (bidirectional) {
      const opposite = getOppositeDirection(direction)
      if (opposite) {
        // Only create reverse if it doesn't already exist
        const existingReverse = connections.get(to)?.get(opposite)
        if (!existingReverse) {
          const reverseConnection: InternalConnection = {
            target: from,
            direction: opposite,
            ...(opts?.gate ? { gate: opts.gate } : {}),
            cost,
            ...(opts?.toTile ? { fromTile: opts.toTile } : {}),
            ...(opts?.fromTile ? { toTile: opts.fromTile } : {}),
            bidirectional: false, // Don't create infinite loop
          }

          if (!connections.has(to)) {
            connections.set(to, new Map())
          }
          connections.get(to)?.set(opposite, reverseConnection)
          emit('connectionCreated', to, opposite, from)
        }
      }
    }
  }

  const disconnect = (
    from: string,
    direction: DirectionType,
    opts?: { bidirectional?: boolean }
  ): void => {
    if (!nodes.has(from)) {
      throw new ValidationError(`Node "${from}" does not exist`)
    }

    const nodeConnections = connections.get(from)
    const connection = nodeConnections?.get(direction)

    if (connection) {
      nodeConnections?.delete(direction)
      emit('connectionRemoved', from, direction)

      // Remove reverse if bidirectional
      const bidirectional = opts?.bidirectional ?? connection.bidirectional
      if (bidirectional && connection.target) {
        const opposite = getOppositeDirection(direction)
        if (opposite) {
          const targetConnections = connections.get(connection.target)
          if (targetConnections?.has(opposite)) {
            targetConnections.delete(opposite)
            emit('connectionRemoved', connection.target, opposite)
          }
        }
      }
    }
  }

  const getConnection = (from: string, direction: DirectionType): ConnectionData | null => {
    const nodeConnections = connections.get(from)
    const connection = nodeConnections?.get(direction)

    if (!connection) {
      return null
    }

    const result: ConnectionData = {
      target: connection.target,
      direction,
      gate: connection.gate ?? null,
      cost: connection.cost,
    }
    if (connection.fromTile !== undefined) result.fromTile = connection.fromTile
    if (connection.toTile !== undefined) result.toTile = connection.toTile
    return result
  }

  const getExits = (nodeId: string): ExitInfo[] => {
    if (!nodes.has(nodeId)) {
      throw new ValidationError(`Node "${nodeId}" does not exist`)
    }

    const nodeConnections = connections.get(nodeId)
    if (!nodeConnections) {
      return []
    }

    const exits: ExitInfo[] = []
    nodeConnections.forEach((connection, direction) => {
      exits.push({
        direction,
        target: connection.target,
        gate: connection.gate ?? null,
        cost: connection.cost,
      })
    })

    return exits
  }

  const getDestination = (from: string, direction: DirectionType): string | null => {
    if (!nodes.has(from)) {
      throw new ValidationError(`Node "${from}" does not exist`)
    }

    const connection = connections.get(from)?.get(direction)
    return connection?.target ?? null
  }

  // Gate system
  const setGate = (from: string, direction: DirectionType, gate: Gate): void => {
    const nodeConnections = connections.get(from)
    const connection = nodeConnections?.get(direction)

    if (!connection) {
      throw new ValidationError(`Connection from "${from}" in direction "${direction}" does not exist`)
    }

    connection.gate = gate
    emit('gateUpdated', from, direction, gate)
  }

  const updateGate = (from: string, direction: DirectionType, updates: Partial<Gate>): void => {
    const nodeConnections = connections.get(from)
    const connection = nodeConnections?.get(direction)

    if (!connection?.gate) {
      throw new ValidationError(`Gate on connection from "${from}" in direction "${direction}" does not exist`)
    }

    // Safely merge updates, filtering forbidden keys
    for (const key of Object.keys(updates)) {
      if (FORBIDDEN_KEYS.has(key)) continue
      if (!Object.hasOwn(updates, key)) continue
      ;(connection.gate as unknown as Record<string, unknown>)[key] = (updates as Record<string, unknown>)[key]
    }
    emit('gateUpdated', from, direction, connection.gate)
  }

  const removeGate = (from: string, direction: DirectionType): void => {
    const nodeConnections = connections.get(from)
    const connection = nodeConnections?.get(direction)

    if (connection?.gate) {
      delete connection.gate
      emit('gateUpdated', from, direction, null)
    }
  }

  const getGate = (from: string, direction: DirectionType): Gate | null => {
    const connection = connections.get(from)?.get(direction)
    return connection?.gate ?? null
  }

  // Traversal
  const canTraverse = (
    from: string,
    direction: DirectionType,
    context?: TraversalContext
  ): TraversalResult => {
    const connection = getConnection(from, direction)
    if (!connection) {
      return { allowed: false, reason: 'no connection' }
    }

    const ctx = context ?? {}
    const traverseFn = customCanTraverse ?? defaultCanTraverse

    return traverseFn(connection, connection.gate ?? null, ctx)
  }

  // Pathfinding
  const findPath = (
    from: string,
    to: string,
    opts?: PathfindingOptions
  ): string[] | null => {
    if (from === to) {
      return [from]
    }

    const maxLength = opts?.maxLength ?? Infinity
    const context = opts?.context ?? {}

    // Use Dijkstra's algorithm for weighted pathfinding
    const distances = new Map<string, number>([[from, 0]])
    const previous = new Map<string, string>()
    const visited = new Set<string>()
    const queue: Array<{ node: string; cost: number }> = [{ node: from, cost: 0 }]

    while (queue.length > 0) {
      // Sort by cost to get lowest cost node (min-heap behavior)
      queue.sort((a, b) => a.cost - b.cost)
      const current = queue.shift()
      if (!current) continue

      if (visited.has(current.node)) {
        continue
      }
      visited.add(current.node)

      if (current.node === to) {
        // Reconstruct path
        const path: string[] = []
        let node: string | undefined = to
        while (node) {
          path.unshift(node)
          node = previous.get(node)
        }
        return path
      }

      const exits = getExits(current.node)

      for (const exit of exits) {
        // Check traversal
        const result = canTraverse(current.node, exit.direction, context)
        if (!result.allowed && !opts?.avoidLocked) {
          // Blocked and not trying to avoid - can't traverse
          continue
        }
        if (!result.allowed && opts?.avoidLocked) {
          // Blocked but we're avoiding - skip this path
          continue
        }

        const newCost = current.cost + (exit.cost ?? 1)
        const currentDist = distances.get(exit.target)

        // Check path length (number of nodes) for maxLength
        const pathLength = getPathLength(previous, current.node) + 2 // +1 for current node, +1 for target
        if (pathLength > maxLength) {
          continue
        }

        if (currentDist === undefined || newCost < currentDist) {
          distances.set(exit.target, newCost)
          previous.set(exit.target, current.node)

          if (!visited.has(exit.target)) {
            queue.push({
              node: exit.target,
              cost: newCost,
            })
          }
        }
      }
    }

    return null
  }

  // Helper to get path length (number of hops)
  const getPathLength = (previous: Map<string, string>, node: string): number => {
    let count = 0
    let current: string | undefined = node
    while (current && previous.has(current)) {
      count++
      current = previous.get(current)
    }
    return count
  }

  const getDistance = (from: string, to: string, opts?: PathfindingOptions): number => {
    if (from === to) {
      return 0
    }

    const maxLength = opts?.maxLength ?? Infinity
    const context = opts?.context ?? {}

    // Use Dijkstra's algorithm for weighted distance
    const distances = new Map<string, number>([[from, 0]])
    const visited = new Set<string>()
    const queue: Array<{ node: string; cost: number }> = [{ node: from, cost: 0 }]
    const previous = new Map<string, string>()

    while (queue.length > 0) {
      // Sort by cost to get lowest cost node
      queue.sort((a, b) => a.cost - b.cost)
      const current = queue.shift()
      if (!current) continue

      if (visited.has(current.node)) {
        continue
      }
      visited.add(current.node)

      if (current.node === to) {
        return current.cost
      }

      const exits = getExits(current.node)

      for (const exit of exits) {
        // Check traversal
        const result = canTraverse(current.node, exit.direction, context)
        if (!result.allowed && !opts?.avoidLocked) {
          continue
        }
        if (!result.allowed && opts?.avoidLocked) {
          continue
        }

        const newCost = current.cost + (exit.cost ?? 1)
        const currentDist = distances.get(exit.target)

        // Check path length (number of nodes) for maxLength
        const pathLength = getPathLength(previous, current.node) + 2 // +1 for current node, +1 for target
        if (pathLength > maxLength) {
          continue
        }

        if (currentDist === undefined || newCost < currentDist) {
          distances.set(exit.target, newCost)
          previous.set(exit.target, current.node)

          if (!visited.has(exit.target)) {
            queue.push({
              node: exit.target,
              cost: newCost,
            })
          }
        }
      }
    }

    return Infinity
  }

  const canReach = (from: string, to: string, opts?: PathfindingOptions): boolean => {
    return getDistance(from, to, opts) !== Infinity
  }

  const getReachable = (from: string, opts?: ReachableOptions): string[] => {
    const visited = new Set<string>([from])
    const queue: Array<{ node: string; distance: number }> = [{ node: from, distance: 0 }]
    const maxDistance = opts?.maxDistance ?? Infinity
    const context = opts?.context ?? {}

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) continue

      if (current.distance >= maxDistance) {
        continue
      }

      const exits = getExits(current.node)

      for (const exit of exits) {
        const result = canTraverse(current.node, exit.direction, context)
        if (!result.allowed) {
          continue
        }

        if (!visited.has(exit.target)) {
          visited.add(exit.target)
          queue.push({
            node: exit.target,
            distance: current.distance + 1,
          })
        }
      }
    }

    return Array.from(visited)
  }

  // Multi-tile nodes
  const getNodeAt = (x: number, y: number, layer?: number): string | null => {
    const key = tileKey(x, y, layer ?? 1)
    return tileIndex.get(key) ?? null
  }

  const getTiles = (nodeId: string): TilePosition[] => {
    const node = nodes.get(nodeId)
    return node?.tiles ?? []
  }

  const getBounds = (nodeId: string): BoundingBox | null => {
    const tiles = getTiles(nodeId)
    if (tiles.length === 0) {
      return null
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    tiles.forEach(tile => {
      minX = Math.min(minX, tile.x)
      maxX = Math.max(maxX, tile.x)
      minY = Math.min(minY, tile.y)
      maxY = Math.max(maxY, tile.y)
    })

    return { minX, maxX, minY, maxY }
  }

  // Layers
  const getNodesInLayer = (layer: number): string[] => {
    const result: string[] = []
    nodes.forEach((node, id) => {
      if (node.layer === layer) {
        result.push(id)
      }
    })
    return result
  }

  // Zones
  const setZone = (nodeId: string, zoneId: string): void => {
    const node = nodes.get(nodeId)
    if (!node) {
      throw new ValidationError(`Node "${nodeId}" does not exist`)
    }
    node.zone = zoneId
  }

  const getZone = (nodeId: string): string | null => {
    const node = nodes.get(nodeId)
    return node?.zone ?? null
  }

  const getNodesInZone = (zoneId: string): string[] => {
    const result: string[] = []
    nodes.forEach((node, id) => {
      if (node.zone === zoneId) {
        result.push(id)
      }
    })
    return result
  }

  const removeZone = (nodeId: string): void => {
    const node = nodes.get(nodeId)
    if (node) {
      delete node.zone
    }
  }

  // Custom directions
  const registerDirection = (direction: string, opts: RegisterDirectionOptions): void => {
    registerCustomDirection(direction, opts.opposite ?? null)
  }

  // Graph analysis
  const getOrphans = (): string[] => {
    const result: string[] = []
    nodes.forEach((_, id) => {
      const exits = getExits(id)
      if (exits.length > 0) {
        return // Has outgoing connections, not an orphan
      }
      // Check if any node connects to this one
      let hasIncoming = false
      connections.forEach(nodeConns => {
        nodeConns.forEach(conn => {
          if (conn.target === id) {
            hasIncoming = true
          }
        })
      })
      // Only add if truly orphaned (no connections at all)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!hasIncoming) {
        result.push(id)
      }
    })
    return result
  }

  const getDeadEnds = (): string[] => {
    const result: string[] = []
    nodes.forEach((_, id) => {
      const exits = getExits(id)
      if (exits.length === 1) {
        result.push(id)
      }
    })
    return result
  }

  const getSubgraphs = (): string[][] => {
    const visited = new Set<string>()
    const subgraphs: string[][] = []

    nodes.forEach((_, startNode) => {
      if (visited.has(startNode)) {
        return
      }

      const subgraph: string[] = []
      const queue = [startNode]

      while (queue.length > 0) {
        const node = queue.shift()
        if (!node) continue
        if (visited.has(node)) {
          continue
        }

        visited.add(node)
        subgraph.push(node)

        const exits = getExits(node)
        exits.forEach(exit => {
          if (!visited.has(exit.target)) {
            queue.push(exit.target)
          }
        })

        // Check incoming connections
        connections.forEach((nodeConns, fromNode) => {
          nodeConns.forEach(conn => {
            if (conn.target === node && !visited.has(fromNode)) {
              queue.push(fromNode)
            }
          })
        })
      }

      subgraphs.push(subgraph)
    })

    return subgraphs
  }

  const validate = (): ValidationResult => {
    const errors: string[] = []

    // Check for connections to non-existent nodes
    connections.forEach((nodeConns, from) => {
      if (!nodes.has(from)) {
        errors.push(`Connection from non-existent node "${from}"`)
      }
      nodeConns.forEach((conn, dir) => {
        if (!nodes.has(conn.target)) {
          errors.push(`Connection from "${from}" direction "${dir}" to non-existent node "${conn.target}"`)
        }
      })
    })

    if (errors.length === 0) {
      return { valid: true }
    }
    return { valid: false, errors }
  }

  // Events
  const on = (event: SpatialGraphEvent, callback: EventCallback): (() => void) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    const eventListeners = listeners.get(event)
    if (eventListeners) {
      eventListeners.add(callback)
    }

    return () => {
      listeners.get(event)?.delete(callback)
    }
  }

  // Serialization
  const serialize = (): SerializedGraph => {
    const nodesData: Record<string, NodeData> = {}
    nodes.forEach((node, id) => {
      nodesData[id] = { ...node }
    })

    const connectionsData: Record<string, Record<DirectionType, ConnectionData>> = {}
    connections.forEach((nodeConns, from) => {
      connectionsData[from] = {} as Record<DirectionType, ConnectionData>
      nodeConns.forEach((conn, dir) => {
        const connData: ConnectionData = {
          target: conn.target,
          direction: dir,
          gate: conn.gate ?? null,
          cost: conn.cost,
        }
        if (conn.fromTile !== undefined) connData.fromTile = conn.fromTile
        if (conn.toTile !== undefined) connData.toTile = conn.toTile
        if (connectionsData[from]) {
          connectionsData[from][dir] = connData
        }
      })
    })

    return {
      nodes: nodesData,
      connections: connectionsData,
    }
  }

  const deserialize = (data: SerializedGraph): void => {
    // Clear existing data
    nodes.clear()
    connections.clear()
    tileIndex.clear()

    // Validate and restore nodes (runtime check for untrusted data)
    const rawData = data as unknown as Partial<SerializedGraph>
    if (!rawData.nodes || typeof rawData.nodes !== 'object') {
      throw new ValidationError('Invalid serialized data: missing nodes')
    }

    Object.entries(data.nodes).forEach(([id, nodeData]) => {
      const opts: CreateNodeOptions = { ...safeCopy(nodeData.metadata), layer: nodeData.layer }
      if (nodeData.tiles) opts.tiles = nodeData.tiles
      createNode(id, opts)
      if (nodeData.zone) {
        setZone(id, nodeData.zone)
      }
    })

    // Restore connections (without validation - use validate() after deserialize to check)
    Object.entries(data.connections).forEach(([from, nodeConns]) => {
        Object.entries(nodeConns).forEach(([dir, conn]) => {
          const connection: InternalConnection = {
            target: conn.target,
            direction: dir as DirectionType,
            ...(conn.gate ? { gate: conn.gate } : {}),
            cost: conn.cost ?? 1,
            ...(conn.fromTile ? { fromTile: conn.fromTile } : {}),
            ...(conn.toTile ? { toTile: conn.toTile } : {}),
            bidirectional: false,
          }

          if (!connections.has(from)) {
            connections.set(from, new Map())
          }
          connections.get(from)?.set(dir as DirectionType, connection)
        })
      })
  }

  // Helper to get opposite direction
  const getOppositeDirection = (dir: DirectionType): DirectionType | null => {
    return (Direction as typeof Direction & { opposite: (d: DirectionType) => DirectionType | null }).opposite(dir)
  }

  return {
    createNode,
    getNode,
    hasNode,
    removeNode,
    getAllNodes,
    connect,
    disconnect,
    getConnection,
    getExits,
    getDestination,
    setGate,
    updateGate,
    removeGate,
    getGate,
    canTraverse,
    findPath,
    getDistance,
    canReach,
    getReachable,
    getNodeAt,
    getTiles,
    getBounds,
    getNodesInLayer,
    setZone,
    getZone,
    getNodesInZone,
    removeZone,
    registerDirection,
    getOrphans,
    getDeadEnds,
    getSubgraphs,
    validate,
    on,
    serialize,
    deserialize,
  }
}
