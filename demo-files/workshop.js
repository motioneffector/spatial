/**
 * Exhibit 2: Graph Workshop
 * Modify, analyze, and build spatial graphs interactively
 */

import { createSpatialGraph, Direction } from './spatial-lib.js'

// State
let workshopGraph = null
let workshopNodes = {}
let nextNodeLetter = 65 // 'A'
let selectedNode = null
let analysisActive = false
let deleteMode = false
let miniPlayerNode = null

const workshopInitialGraph = {
  nodes: [
    { id: 'A', x: 100, y: 100 },
    { id: 'B', x: 100, y: 250 },
    { id: 'C', x: 280, y: 100 },
    { id: 'D', x: 280, y: 250 },
    { id: 'E', x: 450, y: 175 }, // Orphan
    { id: 'F', x: 100, y: 350 }, // Dead end off B
  ],
  connections: [
    { from: 'A', dir: Direction.SOUTH, to: 'B' },
    { from: 'A', dir: Direction.EAST, to: 'C' },
    { from: 'B', dir: Direction.EAST, to: 'D', gate: { id: 'gate-1', locked: true, keyId: 'key-1' } },
    { from: 'C', dir: Direction.SOUTH, to: 'D' },
    { from: 'B', dir: Direction.SOUTH, to: 'F' },
  ],
  zones: { 'A': 'zone-1', 'B': 'zone-1' }
}

function initWorkshopGraph() {
  workshopGraph = createSpatialGraph()
  workshopNodes = {}
  nextNodeLetter = 65

  workshopInitialGraph.nodes.forEach(n => {
    workshopGraph.createNode(n.id)
    workshopNodes[n.id] = { x: n.x, y: n.y }
  })
  workshopInitialGraph.connections.forEach(c => {
    workshopGraph.connect(c.from, c.dir, c.to, c.gate ? { gate: c.gate } : {})
  })
  Object.entries(workshopInitialGraph.zones).forEach(([nodeId, zone]) => {
    workshopGraph.setZone(nodeId, zone)
  })
  nextNodeLetter = 71 // 'G'
  miniPlayerNode = 'A'
}

export function renderWorkshop() {
  const container = document.getElementById('workshop-canvas')
  if (!container) return

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 600 400')

  // Arrowhead marker
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
  marker.id = 'arrowhead'
  marker.setAttribute('markerWidth', '10')
  marker.setAttribute('markerHeight', '7')
  marker.setAttribute('refX', '9')
  marker.setAttribute('refY', '3.5')
  marker.setAttribute('orient', 'auto')
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  polygon.setAttribute('points', '0 0, 10 3.5, 0 7')
  polygon.setAttribute('fill', '#30363d')
  marker.appendChild(polygon)
  defs.appendChild(marker)
  svg.appendChild(defs)

  const orphans = analysisActive ? workshopGraph.getOrphans() : []
  const deadEnds = analysisActive ? workshopGraph.getDeadEnds() : []
  const reachable = miniPlayerNode ? workshopGraph.getReachable(miniPlayerNode) : []

  // Draw connections
  workshopGraph.getAllNodes().forEach(nodeId => {
    const exits = workshopGraph.getExits(nodeId)
    exits.forEach(exit => {
      const fromPos = workshopNodes[nodeId]
      const toPos = workshopNodes[exit.target]
      if (!fromPos || !toPos) return

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', fromPos.x)
      line.setAttribute('y1', fromPos.y)
      line.setAttribute('x2', toPos.x)
      line.setAttribute('y2', toPos.y)
      line.classList.add('workshop-connection')
      if (exit.gate) line.classList.add('has-gate')
      svg.appendChild(line)

      // Gate indicator
      if (exit.gate) {
        const midX = (fromPos.x + toPos.x) / 2
        const midY = (fromPos.y + toPos.y) / 2
        const lock = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        lock.setAttribute('x', midX)
        lock.setAttribute('y', midY + 5)
        lock.setAttribute('text-anchor', 'middle')
        lock.setAttribute('font-size', '12')
        lock.textContent = '🔒'
        svg.appendChild(lock)
      }
    })
  })

  // Draw nodes
  workshopGraph.getAllNodes().forEach(nodeId => {
    const pos = workshopNodes[nodeId]
    if (!pos) return

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.classList.add('workshop-node')
    group.dataset.nodeId = nodeId

    if (orphans.includes(nodeId)) group.classList.add('orphan')
    if (deadEnds.includes(nodeId)) group.classList.add('dead-end')
    if (selectedNode === nodeId) group.classList.add('selected')
    if (miniPlayerNode && reachable.includes(nodeId)) group.classList.add('reachable')
    if (miniPlayerNode && !reachable.includes(nodeId)) group.classList.add('unreachable')

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', pos.x)
    circle.setAttribute('cy', pos.y)
    circle.setAttribute('r', 25)

    // Zone coloring
    const zone = workshopGraph.getZone(nodeId)
    if (zone) {
      circle.style.stroke = zone === 'zone-1' ? '#1f6feb' : '#238636'
      circle.style.strokeWidth = '3'
    }

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.setAttribute('x', pos.x)
    label.setAttribute('y', pos.y + 5)
    label.textContent = nodeId

    group.appendChild(circle)
    group.appendChild(label)

    group.onclick = (e) => {
      e.stopPropagation()
      if (deleteMode) {
        workshopGraph.removeNode(nodeId)
        delete workshopNodes[nodeId]
        if (miniPlayerNode === nodeId) miniPlayerNode = workshopGraph.getAllNodes()[0] || null
        renderWorkshop()
      } else {
        selectedNode = selectedNode === nodeId ? null : nodeId
        renderWorkshop()
      }
    }

    svg.appendChild(group)
  })

  // Mini player
  if (miniPlayerNode && workshopNodes[miniPlayerNode]) {
    const pos = workshopNodes[miniPlayerNode]
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.classList.add('mini-player')
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', pos.x)
    circle.setAttribute('cy', pos.y - 35)
    circle.setAttribute('r', 8)
    group.appendChild(circle)

    let dragging = false
    group.onmousedown = (e) => {
      e.stopPropagation()
      dragging = true
    }
    svg.onmousemove = (e) => {
      if (!dragging) return
      const rect = svg.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (600 / rect.width)
      const y = (e.clientY - rect.top) * (400 / rect.height)
      let nearest = null
      let minDist = Infinity
      Object.entries(workshopNodes).forEach(([id, pos]) => {
        const dist = Math.hypot(pos.x - x, pos.y - y)
        if (dist < minDist) { minDist = dist; nearest = id }
      })
      if (nearest && minDist < 50) {
        miniPlayerNode = nearest
        renderWorkshop()
      }
    }
    svg.onmouseup = () => { dragging = false }

    svg.appendChild(group)
  }

  // Click canvas to add node
  svg.onclick = (e) => {
    if (deleteMode) return
    const rect = svg.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (600 / rect.width)
    const y = (e.clientY - rect.top) * (400 / rect.height)
    addWorkshopNode(x, y)
  }

  container.innerHTML = ''
  container.appendChild(svg)
}

function addWorkshopNode(x, y) {
  const id = String.fromCharCode(nextNodeLetter++)
  workshopGraph.createNode(id)
  workshopNodes[id] = { x, y }
  if (!miniPlayerNode) miniPlayerNode = id
  renderWorkshop()
}

export function loadWorkshopExample(name) {
  workshopGraph.getAllNodes().forEach(id => workshopGraph.removeNode(id))
  workshopNodes = {}
  nextNodeLetter = 65
  selectedNode = null
  miniPlayerNode = null

  const examples = {
    minimal: {
      nodes: [{ id: 'A', x: 150, y: 200 }, { id: 'B', x: 300, y: 200 }, { id: 'C', x: 450, y: 200 }],
      connections: [{ from: 'A', dir: Direction.EAST, to: 'B' }, { from: 'B', dir: Direction.EAST, to: 'C' }]
    },
    disconnected: {
      nodes: [
        { id: 'A', x: 100, y: 150 }, { id: 'B', x: 200, y: 150 },
        { id: 'C', x: 400, y: 150 }, { id: 'D', x: 500, y: 150 }
      ],
      connections: [{ from: 'A', dir: Direction.EAST, to: 'B' }, { from: 'C', dir: Direction.EAST, to: 'D' }]
    },
    multifloor: {
      nodes: [
        { id: 'A', x: 150, y: 100 }, { id: 'B', x: 300, y: 100 }, { id: 'C', x: 450, y: 100 },
        { id: 'D', x: 150, y: 250 }, { id: 'E', x: 300, y: 250 }, { id: 'F', x: 450, y: 250 },
      ],
      connections: [
        { from: 'A', dir: Direction.EAST, to: 'B' }, { from: 'B', dir: Direction.EAST, to: 'C' },
        { from: 'D', dir: Direction.EAST, to: 'E' }, { from: 'E', dir: Direction.EAST, to: 'F' },
        { from: 'A', dir: Direction.DOWN, to: 'D' }, { from: 'C', dir: Direction.DOWN, to: 'F' },
      ]
    },
    empty: { nodes: [], connections: [] }
  }

  const ex = examples[name] || workshopInitialGraph
  workshopGraph = createSpatialGraph()
  ex.nodes.forEach(n => {
    workshopGraph.createNode(n.id)
    workshopNodes[n.id] = { x: n.x, y: n.y }
  })
  ex.connections.forEach(c => {
    workshopGraph.connect(c.from, c.dir, c.to, c.gate ? { gate: c.gate } : {})
  })
  nextNodeLetter = 65 + ex.nodes.length
  miniPlayerNode = ex.nodes[0]?.id || null
  renderWorkshop()
}

export function setAnalysisActive(active) {
  analysisActive = active
  renderWorkshop()
}

export function setDeleteMode(active) {
  deleteMode = active
}

export function initWorkshop() {
  initWorkshopGraph()
  renderWorkshop()

  document.getElementById('workshop-add-node')?.addEventListener('click', () => addWorkshopNode(300, 200))
  document.getElementById('workshop-analyze')?.addEventListener('click', () => setAnalysisActive(true))
  document.getElementById('workshop-clear-analysis')?.addEventListener('click', () => setAnalysisActive(false))
  document.getElementById('workshop-examples')?.addEventListener('change', (e) => {
    if (e.target.value) { loadWorkshopExample(e.target.value); e.target.value = '' }
  })
  document.getElementById('workshop-delete-mode')?.addEventListener('click', (e) => {
    deleteMode = !deleteMode
    e.target.classList.toggle('btn-danger', deleteMode)
    e.target.classList.toggle('btn-secondary', !deleteMode)
  })
}

// Demo automation API
export const workshopDemo = {
  async run() {
    const delay = (ms) => new Promise(r => setTimeout(r, ms))

    // Reset to initial state
    initWorkshopGraph()
    analysisActive = false
    deleteMode = false
    renderWorkshop()
    await delay(300)

    // Trigger analysis
    setAnalysisActive(true)
    await delay(1000)

    // Clear analysis
    setAnalysisActive(false)
    await delay(300)

    // Add a new node
    addWorkshopNode(450, 320)
    await delay(400)

    // Add another node
    addWorkshopNode(350, 320)
    await delay(400)

    // Select node E (orphan)
    selectedNode = 'E'
    renderWorkshop()
    await delay(400)

    // Move mini-player to different nodes
    miniPlayerNode = 'C'
    renderWorkshop()
    await delay(400)

    miniPlayerNode = 'E'
    renderWorkshop()
    await delay(400)

    // Load disconnected example
    loadWorkshopExample('disconnected')
    await delay(500)

    // Show analysis on disconnected
    setAnalysisActive(true)
    await delay(800)

    // Reset to initial
    initWorkshopGraph()
    analysisActive = false
    renderWorkshop()
  },

  getState() {
    return {
      nodeCount: workshopGraph?.getAllNodes().length ?? 0,
      analysisActive,
      miniPlayerNode,
      selectedNode
    }
  }
}
