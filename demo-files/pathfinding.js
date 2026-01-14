/**
 * Exhibit 3: Pathfinding Theater
 * Watch Dijkstra's algorithm find the shortest path step by step
 */

import { createSpatialGraph, Direction } from './spatial-lib.js'

// State
let pfGraph = null
let pfState = {
  start: 'A',
  end: 'F',
  distances: {},
  previous: {},
  visited: new Set(),
  queue: [],
  finalPath: [],
  running: false,
  hasKey: false,
  speed: 200
}

const pfNodePositions = {
  'A': { x: 300, y: 40 },
  'B': { x: 150, y: 120 },
  'C': { x: 450, y: 120 },
  'D': { x: 150, y: 220 },
  'E': { x: 450, y: 220 },
  'F': { x: 300, y: 300 },
}

let pfConnections = [
  { from: 'A', to: 'B', cost: 1, dir: Direction.SOUTHWEST },
  { from: 'A', to: 'C', cost: 3, dir: Direction.SOUTHEAST },
  { from: 'B', to: 'D', cost: 2, dir: Direction.SOUTH },
  { from: 'C', to: 'E', cost: 5, dir: Direction.SOUTH },
  { from: 'D', to: 'F', cost: 1, dir: Direction.SOUTHEAST },
  { from: 'D', to: 'E', cost: 1, dir: Direction.EAST, gate: { id: 'de-gate', locked: true, keyId: 'pf-key' } },
  { from: 'E', to: 'F', cost: 1, dir: Direction.SOUTHWEST },
]

function initPfGraph() {
  pfGraph = createSpatialGraph()
  Object.keys(pfNodePositions).forEach(id => pfGraph.createNode(id))
  pfConnections.forEach(c => {
    pfGraph.connect(c.from, c.dir, c.to, { cost: c.cost, ...(c.gate ? { gate: c.gate } : {}) })
  })
  resetPfState()
}

export function resetPfState() {
  pfState.distances = { [pfState.start]: 0 }
  pfState.previous = {}
  pfState.visited = new Set()
  pfState.queue = [{ node: pfState.start, cost: 0 }]
  pfState.finalPath = []
  pfState.running = false
  Object.keys(pfNodePositions).forEach(id => {
    if (id !== pfState.start) pfState.distances[id] = Infinity
  })
  renderPathfinding()
}

export function renderPathfinding() {
  const container = document.getElementById('pathfinding-graph')
  if (!container) return

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 600 350')

  // Draw connections
  pfConnections.forEach(c => {
    const from = pfNodePositions[c.from]
    const to = pfNodePositions[c.to]
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', from.x)
    line.setAttribute('y1', from.y)
    line.setAttribute('x2', to.x)
    line.setAttribute('y2', to.y)
    line.classList.add('pf-connection')

    if (c.gate) line.classList.add('locked')
    if (pfState.finalPath.includes(c.from) && pfState.finalPath.includes(c.to)) {
      const fi = pfState.finalPath.indexOf(c.from)
      const ti = pfState.finalPath.indexOf(c.to)
      if (Math.abs(fi - ti) === 1) line.classList.add('final-path')
    }

    svg.appendChild(line)

    // Cost label
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2
    const offsetX = to.y === from.y ? 0 : (to.x > from.x ? 15 : -15)
    const offsetY = to.x === from.x ? 0 : -10
    const costLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    costLabel.setAttribute('x', midX + offsetX)
    costLabel.setAttribute('y', midY + offsetY)
    costLabel.classList.add('cost-label')
    costLabel.textContent = c.cost
    svg.appendChild(costLabel)

    // Gate indicator
    if (c.gate) {
      const lock = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      lock.setAttribute('x', midX)
      lock.setAttribute('y', midY + 20)
      lock.setAttribute('text-anchor', 'middle')
      lock.setAttribute('font-size', '14')
      lock.textContent = '🔒'
      svg.appendChild(lock)
    }
  })

  // Draw nodes
  Object.entries(pfNodePositions).forEach(([id, pos]) => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.classList.add('pf-node')

    if (id === pfState.start) group.classList.add('start')
    if (id === pfState.end) group.classList.add('end')
    if (pfState.visited.has(id)) group.classList.add('explored')
    else if (pfState.queue.some(q => q.node === id)) group.classList.add('frontier')
    else group.classList.add('unexplored')

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.classList.add('node-bg')
    circle.setAttribute('cx', pos.x)
    circle.setAttribute('cy', pos.y)
    circle.setAttribute('r', 28)

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.classList.add('node-label')
    label.setAttribute('x', pos.x)
    label.setAttribute('y', pos.y + 5)
    label.textContent = id

    const dist = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    dist.classList.add('distance-label')
    dist.setAttribute('x', pos.x)
    dist.setAttribute('y', pos.y + 18)
    const d = pfState.distances[id]
    dist.textContent = d === Infinity ? '∞' : d

    group.appendChild(circle)
    group.appendChild(label)
    group.appendChild(dist)
    svg.appendChild(group)
  })

  container.innerHTML = ''
  container.appendChild(svg)
  renderPfQueue()
}

function renderPfQueue() {
  const container = document.getElementById('pf-queue-tokens')
  if (!container) return

  container.innerHTML = ''
  pfState.queue.sort((a, b) => a.cost - b.cost).forEach(item => {
    const token = document.createElement('div')
    token.className = 'queue-token'
    token.textContent = `${item.node}:${item.cost}`
    container.appendChild(token)
  })
}

export async function runPfStep() {
  if (pfState.queue.length === 0 || pfState.visited.has(pfState.end)) return false

  pfState.queue.sort((a, b) => a.cost - b.cost)
  const current = pfState.queue.shift()

  if (pfState.visited.has(current.node)) return true
  pfState.visited.add(current.node)

  if (current.node === pfState.end) {
    const path = []
    let node = pfState.end
    while (node) { path.unshift(node); node = pfState.previous[node] }
    pfState.finalPath = path
    renderPathfinding()
    return false
  }

  const context = pfState.hasKey ? { inventory: ['pf-key'] } : {}
  const exits = pfGraph.getExits(current.node)

  for (const exit of exits) {
    const result = pfGraph.canTraverse(current.node, exit.direction, context)
    if (!result.allowed) continue

    const newCost = current.cost + (exit.cost ?? 1)
    if (pfState.distances[exit.target] === undefined || newCost < pfState.distances[exit.target]) {
      pfState.distances[exit.target] = newCost
      pfState.previous[exit.target] = current.node
      if (!pfState.visited.has(exit.target)) {
        pfState.queue.push({ node: exit.target, cost: newCost })
      }
    }
  }

  renderPathfinding()
  return true
}

export async function playPf() {
  if (pfState.running) return
  pfState.running = true

  const playBtn = document.getElementById('pf-play')
  if (playBtn) playBtn.textContent = '⏸ Pause'

  while (pfState.running && await runPfStep()) {
    await new Promise(r => setTimeout(r, pfState.speed))
  }

  pfState.running = false
  if (playBtn) playBtn.textContent = '▶ Play'
}

export function stopPf() {
  pfState.running = false
}

export function setSpeed(speed) {
  pfState.speed = speed
}

export function setHasKey(hasKey) {
  pfState.hasKey = hasKey
  // Re-init graph with updated gate state access
  resetPfState()
}

export function randomizeCosts() {
  pfConnections.forEach(c => {
    c.cost = Math.floor(Math.random() * 5) + 1
  })
  // Rebuild graph
  initPfGraph()
}

export function initPathfinding() {
  initPfGraph()
  renderPathfinding()

  document.getElementById('pf-play')?.addEventListener('click', () => {
    if (pfState.running) { stopPf() }
    else playPf()
  })
  document.getElementById('pf-step')?.addEventListener('click', () => runPfStep())
  document.getElementById('pf-reset')?.addEventListener('click', () => resetPfState())
  document.getElementById('pf-speed')?.addEventListener('input', (e) => {
    pfState.speed = 550 - parseInt(e.target.value)
  })
  document.getElementById('pf-has-key')?.addEventListener('change', (e) => {
    setHasKey(e.target.checked)
  })
  document.getElementById('pf-randomize')?.addEventListener('click', randomizeCosts)
}

// Demo automation API
export const pathfindingDemo = {
  async run() {
    const delay = (ms) => new Promise(r => setTimeout(r, ms))

    // Reset
    resetPfState()
    pfState.speed = 150 // Faster for demo
    await delay(300)

    // Run the algorithm step by step
    while (await runPfStep()) {
      await delay(pfState.speed)
    }

    await delay(500)

    // Reset and run with key
    pfState.hasKey = true
    resetPfState()
    await delay(300)

    // Run again with key
    while (await runPfStep()) {
      await delay(pfState.speed)
    }

    await delay(500)

    // Randomize costs
    randomizeCosts()
    await delay(300)

    // Run with new costs
    while (await runPfStep()) {
      await delay(pfState.speed)
    }

    await delay(300)

    // Reset to initial
    pfState.hasKey = false
    pfConnections = [
      { from: 'A', to: 'B', cost: 1, dir: Direction.SOUTHWEST },
      { from: 'A', to: 'C', cost: 3, dir: Direction.SOUTHEAST },
      { from: 'B', to: 'D', cost: 2, dir: Direction.SOUTH },
      { from: 'C', to: 'E', cost: 5, dir: Direction.SOUTH },
      { from: 'D', to: 'F', cost: 1, dir: Direction.SOUTHEAST },
      { from: 'D', to: 'E', cost: 1, dir: Direction.EAST, gate: { id: 'de-gate', locked: true, keyId: 'pf-key' } },
      { from: 'E', to: 'F', cost: 1, dir: Direction.SOUTHWEST },
    ]
    initPfGraph()
  },

  getState() {
    return {
      visited: pfState.visited.size,
      queueLength: pfState.queue.length,
      pathFound: pfState.finalPath.length > 0,
      hasKey: pfState.hasKey
    }
  }
}
