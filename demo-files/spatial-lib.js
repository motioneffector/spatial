/**
 * @motioneffector/spatial - Inline library for demo
 * Directional graph for room-based spatial navigation
 */

export const Direction = {
  NORTH: 'NORTH',
  NORTHEAST: 'NORTHEAST',
  EAST: 'EAST',
  SOUTHEAST: 'SOUTHEAST',
  SOUTH: 'SOUTH',
  SOUTHWEST: 'SOUTHWEST',
  WEST: 'WEST',
  NORTHWEST: 'NORTHWEST',
  UP: 'UP',
  DOWN: 'DOWN',
  IN: 'IN',
  OUT: 'OUT',
}

const opposites = new Map([
  ['NORTH', 'SOUTH'], ['SOUTH', 'NORTH'],
  ['EAST', 'WEST'], ['WEST', 'EAST'],
  ['NORTHEAST', 'SOUTHWEST'], ['SOUTHWEST', 'NORTHEAST'],
  ['NORTHWEST', 'SOUTHEAST'], ['SOUTHEAST', 'NORTHWEST'],
  ['UP', 'DOWN'], ['DOWN', 'UP'],
  ['IN', 'OUT'], ['OUT', 'IN'],
])

Direction.opposite = (dir) => opposites.get(dir) ?? null

Direction.parse = (input) => {
  const map = {
    'north': 'NORTH', 'n': 'NORTH',
    'south': 'SOUTH', 's': 'SOUTH',
    'east': 'EAST', 'e': 'EAST',
    'west': 'WEST', 'w': 'WEST',
    'northeast': 'NORTHEAST', 'ne': 'NORTHEAST',
    'northwest': 'NORTHWEST', 'nw': 'NORTHWEST',
    'southeast': 'SOUTHEAST', 'se': 'SOUTHEAST',
    'southwest': 'SOUTHWEST', 'sw': 'SOUTHWEST',
    'up': 'UP', 'u': 'UP',
    'down': 'DOWN', 'd': 'DOWN',
    'in': 'IN', 'out': 'OUT',
  }
  return map[input.toLowerCase()] ?? null
}

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function createSpatialGraph(options = {}) {
  const nodes = new Map()
  const connections = new Map()
  const listeners = new Map()
  const { flagStore, canTraverse: customCanTraverse } = options

  const emit = (event, ...args) => {
    const callbacks = listeners.get(event)
    if (callbacks) callbacks.forEach(cb => cb(...args))
  }

  const defaultCanTraverse = (connection, gate, context) => {
    if (!gate) return { allowed: true }
    if (gate.hidden && !context.discovered?.includes(gate.id)) {
      return { allowed: false, reason: 'hidden', gateId: gate.id }
    }
    if (gate.locked) {
      if (gate.keyId && context.inventory?.includes(gate.keyId)) {
        return { allowed: true }
      }
      return { allowed: false, reason: 'locked', gateId: gate.id }
    }
    return { allowed: true }
  }

  const createNode = (id, opts = {}) => {
    if (!id) throw new ValidationError('Node id cannot be empty')
    if (nodes.has(id)) throw new ValidationError(`Node "${id}" already exists`)
    const { tiles, layer = 1, ...metadata } = opts
    const nodeData = { id, metadata, layer, ...(tiles ? { tiles } : {}) }
    nodes.set(id, nodeData)
    emit('nodeCreated', id, nodeData)
  }

  const getNode = (id) => nodes.get(id) ?? null
  const hasNode = (id) => nodes.has(id)
  const getAllNodes = () => Array.from(nodes.keys())

  const removeNode = (id) => {
    const node = nodes.get(id)
    if (!node) throw new ValidationError(`Node "${id}" does not exist`)
    connections.delete(id)
    connections.forEach(nodeConns => {
      for (const [dir, conn] of nodeConns) {
        if (conn.target === id) nodeConns.delete(dir)
      }
    })
    nodes.delete(id)
    emit('nodeRemoved', id)
    return node
  }

  const connect = (from, direction, to, opts = {}) => {
    if (!nodes.has(from)) throw new ValidationError(`Source node "${from}" does not exist`)
    if (!nodes.has(to)) throw new ValidationError(`Target node "${to}" does not exist`)
    const { bidirectional = true, cost = 1, gate } = opts
    const conn = { target: to, direction, cost, bidirectional, ...(gate ? { gate } : {}) }
    if (!connections.has(from)) connections.set(from, new Map())
    connections.get(from).set(direction, conn)
    emit('connectionCreated', from, direction, to)
    if (bidirectional) {
      const opp = Direction.opposite(direction)
      if (opp && !connections.get(to)?.has(opp)) {
        if (!connections.has(to)) connections.set(to, new Map())
        connections.get(to).set(opp, { target: from, direction: opp, cost, bidirectional: false, ...(gate ? { gate } : {}) })
        emit('connectionCreated', to, opp, from)
      }
    }
  }

  const disconnect = (from, direction, opts = {}) => {
    const nodeConns = connections.get(from)
    const conn = nodeConns?.get(direction)
    if (conn) {
      nodeConns.delete(direction)
      emit('connectionRemoved', from, direction)
      if (opts.bidirectional ?? conn.bidirectional) {
        const opp = Direction.opposite(direction)
        if (opp) {
          connections.get(conn.target)?.delete(opp)
          emit('connectionRemoved', conn.target, opp)
        }
      }
    }
  }

  const getConnection = (from, direction) => {
    const conn = connections.get(from)?.get(direction)
    if (!conn) return null
    return { target: conn.target, direction, gate: conn.gate ?? null, cost: conn.cost }
  }

  const getExits = (nodeId) => {
    if (!nodes.has(nodeId)) throw new ValidationError(`Node "${nodeId}" does not exist`)
    const nodeConns = connections.get(nodeId)
    if (!nodeConns) return []
    return Array.from(nodeConns.entries()).map(([dir, conn]) => ({
      direction: dir, target: conn.target, gate: conn.gate ?? null, cost: conn.cost
    }))
  }

  const getDestination = (from, direction) => {
    return connections.get(from)?.get(direction)?.target ?? null
  }

  const setGate = (from, direction, gate) => {
    const conn = connections.get(from)?.get(direction)
    if (!conn) throw new ValidationError(`Connection does not exist`)
    conn.gate = gate
    emit('gateUpdated', from, direction, gate)
  }

  const updateGate = (from, direction, updates) => {
    const conn = connections.get(from)?.get(direction)
    if (!conn?.gate) throw new ValidationError(`Gate does not exist`)
    Object.assign(conn.gate, updates)
    emit('gateUpdated', from, direction, conn.gate)
  }

  const removeGate = (from, direction) => {
    const conn = connections.get(from)?.get(direction)
    if (conn?.gate) {
      delete conn.gate
      emit('gateUpdated', from, direction, null)
    }
  }

  const getGate = (from, direction) => connections.get(from)?.get(direction)?.gate ?? null

  const canTraverse = (from, direction, context = {}) => {
    const conn = getConnection(from, direction)
    if (!conn) return { allowed: false, reason: 'no connection' }
    const fn = customCanTraverse ?? defaultCanTraverse
    return fn(conn, conn.gate, context)
  }

  const findPath = (from, to, opts = {}) => {
    if (from === to) return [from]
    const { maxLength = Infinity, context = {} } = opts
    const distances = new Map([[from, 0]])
    const previous = new Map()
    const visited = new Set()
    const queue = [{ node: from, cost: 0 }]

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost)
      const current = queue.shift()
      if (visited.has(current.node)) continue
      visited.add(current.node)
      if (current.node === to) {
        const path = []
        let node = to
        while (node) { path.unshift(node); node = previous.get(node) }
        return path
      }
      for (const exit of getExits(current.node)) {
        const result = canTraverse(current.node, exit.direction, context)
        if (!result.allowed) continue
        const newCost = current.cost + (exit.cost ?? 1)
        if (!distances.has(exit.target) || newCost < distances.get(exit.target)) {
          distances.set(exit.target, newCost)
          previous.set(exit.target, current.node)
          if (!visited.has(exit.target)) queue.push({ node: exit.target, cost: newCost })
        }
      }
    }
    return null
  }

  const getDistance = (from, to, opts = {}) => {
    if (from === to) return 0
    const { context = {} } = opts
    const distances = new Map([[from, 0]])
    const visited = new Set()
    const queue = [{ node: from, cost: 0 }]

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost)
      const current = queue.shift()
      if (visited.has(current.node)) continue
      visited.add(current.node)
      if (current.node === to) return current.cost
      for (const exit of getExits(current.node)) {
        const result = canTraverse(current.node, exit.direction, context)
        if (!result.allowed) continue
        const newCost = current.cost + (exit.cost ?? 1)
        if (!distances.has(exit.target) || newCost < distances.get(exit.target)) {
          distances.set(exit.target, newCost)
          if (!visited.has(exit.target)) queue.push({ node: exit.target, cost: newCost })
        }
      }
    }
    return Infinity
  }

  const canReach = (from, to, opts) => getDistance(from, to, opts) !== Infinity

  const getReachable = (from, opts = {}) => {
    const visited = new Set([from])
    const queue = [{ node: from, distance: 0 }]
    const { maxDistance = Infinity, context = {} } = opts
    while (queue.length > 0) {
      const current = queue.shift()
      if (current.distance >= maxDistance) continue
      for (const exit of getExits(current.node)) {
        const result = canTraverse(current.node, exit.direction, context)
        if (!result.allowed) continue
        if (!visited.has(exit.target)) {
          visited.add(exit.target)
          queue.push({ node: exit.target, distance: current.distance + 1 })
        }
      }
    }
    return Array.from(visited)
  }

  const setZone = (nodeId, zoneId) => {
    const node = nodes.get(nodeId)
    if (!node) throw new ValidationError(`Node "${nodeId}" does not exist`)
    node.zone = zoneId
  }

  const getZone = (nodeId) => nodes.get(nodeId)?.zone ?? null

  const getNodesInZone = (zoneId) => {
    const result = []
    nodes.forEach((node, id) => { if (node.zone === zoneId) result.push(id) })
    return result
  }

  const removeZone = (nodeId) => {
    const node = nodes.get(nodeId)
    if (node) delete node.zone
  }

  const getOrphans = () => {
    const result = []
    nodes.forEach((_, id) => {
      const exits = getExits(id)
      if (exits.length > 0) return
      let hasIncoming = false
      connections.forEach(nodeConns => {
        nodeConns.forEach(conn => { if (conn.target === id) hasIncoming = true })
      })
      if (!hasIncoming) result.push(id)
    })
    return result
  }

  const getDeadEnds = () => {
    const result = []
    nodes.forEach((_, id) => {
      if (getExits(id).length === 1) result.push(id)
    })
    return result
  }

  const getSubgraphs = () => {
    const visited = new Set()
    const subgraphs = []
    nodes.forEach((_, startNode) => {
      if (visited.has(startNode)) return
      const subgraph = []
      const queue = [startNode]
      while (queue.length > 0) {
        const node = queue.shift()
        if (visited.has(node)) continue
        visited.add(node)
        subgraph.push(node)
        getExits(node).forEach(exit => { if (!visited.has(exit.target)) queue.push(exit.target) })
        connections.forEach((nodeConns, fromNode) => {
          nodeConns.forEach(conn => {
            if (conn.target === node && !visited.has(fromNode)) queue.push(fromNode)
          })
        })
      }
      subgraphs.push(subgraph)
    })
    return subgraphs
  }

  const validate = () => {
    const errors = []
    connections.forEach((nodeConns, from) => {
      if (!nodes.has(from)) errors.push(`Connection from non-existent node "${from}"`)
      nodeConns.forEach((conn, dir) => {
        if (!nodes.has(conn.target)) errors.push(`Connection to non-existent node "${conn.target}"`)
      })
    })
    return errors.length === 0 ? { valid: true } : { valid: false, errors }
  }

  const on = (event, callback) => {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event).add(callback)
    return () => listeners.get(event)?.delete(callback)
  }

  const serialize = () => {
    const nodesData = {}
    nodes.forEach((node, id) => { nodesData[id] = { ...node } })
    const connectionsData = {}
    connections.forEach((nodeConns, from) => {
      connectionsData[from] = {}
      nodeConns.forEach((conn, dir) => {
        connectionsData[from][dir] = { target: conn.target, direction: dir, gate: conn.gate ?? null, cost: conn.cost }
      })
    })
    return { nodes: nodesData, connections: connectionsData }
  }

  const deserialize = (data) => {
    nodes.clear()
    connections.clear()
    if (!data.nodes) throw new ValidationError('Invalid serialized data: missing nodes')
    Object.entries(data.nodes).forEach(([id, nodeData]) => {
      createNode(id, { ...nodeData.metadata, layer: nodeData.layer, tiles: nodeData.tiles })
      if (nodeData.zone) setZone(id, nodeData.zone)
    })
    Object.entries(data.connections).forEach(([from, nodeConns]) => {
      Object.entries(nodeConns).forEach(([dir, conn]) => {
        if (!connections.has(from)) connections.set(from, new Map())
        connections.get(from).set(dir, { target: conn.target, direction: dir, gate: conn.gate, cost: conn.cost ?? 1, bidirectional: false })
      })
    })
  }

  const getNodesInLayer = (layer) => {
    const result = []
    nodes.forEach((node, id) => { if (node.layer === layer) result.push(id) })
    return result
  }

  const registerDirection = (direction, opts) => {
    opposites.set(direction, opts.opposite ?? null)
    if (opts.opposite) opposites.set(opts.opposite, direction)
  }

  return {
    createNode, getNode, hasNode, removeNode, getAllNodes,
    connect, disconnect, getConnection, getExits, getDestination,
    setGate, updateGate, removeGate, getGate,
    canTraverse, findPath, getDistance, canReach, getReachable,
    setZone, getZone, getNodesInZone, removeZone,
    getOrphans, getDeadEnds, getSubgraphs, validate,
    on, serialize, deserialize, getNodesInLayer, registerDirection
  }
}
