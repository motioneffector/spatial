/**
 * Exhibit 1: Dungeon Explorer
 * Navigate through a connected graph with locked doors, keys, and pathfinding
 */

import { createSpatialGraph, Direction } from './spatial-lib.js'

// State
let dungeonGraph = null
let currentRoom = 'guard-room'
let heldKeys = ['brass']
let discoveredPassages = []
let findPathMode = false

// Room positions for visualization
const roomPositions = {
  'guard-room': { x: 120, y: 80 },
  'hall': { x: 300, y: 80 },
  'treasury': { x: 480, y: 80 },
  'library': { x: 300, y: 200 },
  'secret-room': { x: 480, y: 200 },
  'basement': { x: 300, y: 320 },
  'armory': { x: 120, y: 200 },
  'dungeon': { x: 120, y: 320 },
}

const dungeonConnections = [
  { from: 'guard-room', dir: Direction.EAST, to: 'hall' },
  { from: 'hall', dir: Direction.EAST, to: 'treasury', gate: { id: 'treasury-door', locked: true, keyId: 'brass' } },
  { from: 'hall', dir: Direction.SOUTH, to: 'library' },
  { from: 'library', dir: Direction.EAST, to: 'secret-room', gate: { id: 'secret-passage', hidden: true } },
  { from: 'library', dir: Direction.SOUTH, to: 'basement', gate: { id: 'basement-door', locked: true, keyId: 'basement' } },
  { from: 'guard-room', dir: Direction.SOUTH, to: 'armory' },
  { from: 'armory', dir: Direction.SOUTH, to: 'dungeon', gate: { id: 'dungeon-door', locked: true, keyId: 'vault' } },
]

const allKeys = [
  { id: 'brass', name: 'Brass', color: '#d4a574' },
  { id: 'vault', name: 'Vault', color: '#8b8b8b' },
  { id: 'basement', name: 'Basement', color: '#6b4423' },
]

function initDungeonGraph() {
  dungeonGraph = createSpatialGraph()
  Object.keys(roomPositions).forEach(id => {
    dungeonGraph.createNode(id, { name: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })
  })
  dungeonConnections.forEach(({ from, dir, to, gate }) => {
    dungeonGraph.connect(from, dir, to, gate ? { gate } : {})
  })
}

function renderDungeon() {
  const container = document.getElementById('dungeon-map')
  if (!container) return

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 600 400')

  // Gradient for player orb
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient')
  gradient.id = 'orbGradient'
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
  stop1.setAttribute('offset', '0%')
  stop1.setAttribute('stop-color', '#58a6ff')
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
  stop2.setAttribute('offset', '100%')
  stop2.setAttribute('stop-color', '#1f6feb')
  gradient.appendChild(stop1)
  gradient.appendChild(stop2)
  defs.appendChild(gradient)
  svg.appendChild(defs)

  // Draw connections
  dungeonConnections.forEach(({ from, dir, to, gate }) => {
    const fromPos = roomPositions[from]
    const toPos = roomPositions[to]
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', fromPos.x)
    line.setAttribute('y1', fromPos.y)
    line.setAttribute('x2', toPos.x)
    line.setAttribute('y2', toPos.y)
    line.classList.add('connection-line')
    line.dataset.from = from
    line.dataset.to = to
    if (gate?.hidden && !discoveredPassages.includes(gate.id)) {
      line.classList.add('hidden')
    }
    svg.appendChild(line)

    // Draw padlock if locked
    if (gate?.locked) {
      const currentGate = dungeonGraph.getGate(from, dir)
      if (currentGate?.locked) {
        const midX = (fromPos.x + toPos.x) / 2
        const midY = (fromPos.y + toPos.y) / 2
        const padlock = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        padlock.setAttribute('x', midX)
        padlock.setAttribute('y', midY + 5)
        padlock.setAttribute('text-anchor', 'middle')
        padlock.setAttribute('font-size', '16')
        padlock.textContent = '🔒'
        padlock.classList.add('padlock')
        padlock.dataset.gateId = gate.id
        padlock.dataset.keyId = gate.keyId
        padlock.dataset.from = from
        padlock.dataset.dir = dir
        padlock.onclick = (e) => handlePadlockClick(e, gate, from, dir)
        svg.appendChild(padlock)
      }
    }
  })

  // Draw rooms
  Object.entries(roomPositions).forEach(([id, pos]) => {
    const gate = dungeonConnections.find(c => c.to === id && c.gate?.hidden)?.gate
    const isHidden = gate && !discoveredPassages.includes(gate.id)

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.classList.add('room')
    if (isHidden) group.classList.add('room-hidden')
    group.dataset.roomId = id
    group.onclick = () => handleRoomClick(id)

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', pos.x - 50)
    rect.setAttribute('y', pos.y - 25)
    rect.setAttribute('width', 100)
    rect.setAttribute('height', 50)
    rect.classList.add('room-rect')
    if (id === currentRoom) rect.classList.add('current')

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.setAttribute('x', pos.x)
    label.setAttribute('y', pos.y + 5)
    label.classList.add('room-label')
    label.textContent = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    group.appendChild(rect)
    group.appendChild(label)
    svg.appendChild(group)
  })

  // Draw player orb
  const orbPos = roomPositions[currentRoom]
  const orb = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  orb.setAttribute('cx', orbPos.x)
  orb.setAttribute('cy', orbPos.y)
  orb.setAttribute('r', 12)
  orb.classList.add('player-orb')
  orb.id = 'player-orb'
  svg.appendChild(orb)

  container.innerHTML = ''
  container.appendChild(svg)
  renderCompass()
  renderKeyring()
}

function handleRoomClick(targetRoom) {
  if (targetRoom === currentRoom) {
    const orb = document.getElementById('player-orb')
    if (orb) {
      orb.style.transform = 'scale(1.2)'
      setTimeout(() => orb.style.transform = '', 150)
    }
    return
  }

  const context = { inventory: heldKeys, discovered: discoveredPassages }

  if (findPathMode) {
    const path = dungeonGraph.findPath(currentRoom, targetRoom, { context })
    if (path) {
      highlightPath(path)
    }
    return
  }

  const path = dungeonGraph.findPath(currentRoom, targetRoom, { context })
  if (path && path.length > 1) {
    animateMovement(path)
  } else {
    const exits = dungeonGraph.getExits(currentRoom)
    const blockedExit = exits.find(e => {
      const dest = dungeonGraph.getDestination(currentRoom, e.direction)
      return dest === targetRoom || dungeonGraph.findPath(dest, targetRoom, { context })
    })
    if (blockedExit?.gate) {
      showBlockedFeedback(blockedExit.gate)
    }
  }
}

function animateMovement(path) {
  let i = 1
  const moveNext = () => {
    if (i >= path.length) return
    currentRoom = path[i]
    const pos = roomPositions[currentRoom]
    const orb = document.getElementById('player-orb')
    if (orb) {
      orb.setAttribute('cx', pos.x)
      orb.setAttribute('cy', pos.y)
    }

    document.querySelectorAll('.room-rect').forEach(r => r.classList.remove('current'))
    document.querySelector(`[data-room-id="${currentRoom}"] .room-rect`)?.classList.add('current')

    i++
    if (i < path.length) setTimeout(moveNext, 200)
    else renderCompass()
  }
  moveNext()
}

function highlightPath(path) {
  document.querySelectorAll('.connection-line').forEach(l => l.classList.remove('path-preview'))

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]
    const to = path[i + 1]
    const line = document.querySelector(`.connection-line[data-from="${from}"][data-to="${to}"], .connection-line[data-from="${to}"][data-to="${from}"]`)
    if (line) line.classList.add('path-preview')
  }
}

function handlePadlockClick(e, gate, from, dir) {
  e.stopPropagation()
  const padlock = e.target

  if (gate.keyId && heldKeys.includes(gate.keyId)) {
    padlock.classList.add('unlocking')
    dungeonGraph.updateGate(from, dir, { locked: false })
    setTimeout(() => {
      renderDungeon()
    }, 300)
  } else {
    padlock.classList.add('shake')
    setTimeout(() => padlock.classList.remove('shake'), 300)
  }
}

function showBlockedFeedback(gate) {
  const padlock = document.querySelector(`.padlock[data-gate-id="${gate.id}"]`)
  if (padlock) {
    padlock.classList.add('shake')
    setTimeout(() => padlock.classList.remove('shake'), 300)
  }
}

function renderCompass() {
  const container = document.getElementById('compass-rose')
  if (!container) return

  const exits = dungeonGraph.getExits(currentRoom)
  const exitDirs = new Set(exits.map(e => e.direction))
  const context = { inventory: heldKeys, discovered: discoveredPassages }

  const layout = [
    [null, 'NORTH', null],
    ['WEST', 'center', 'EAST'],
    [null, 'SOUTH', null],
    ['UP', null, 'DOWN'],
  ]

  container.innerHTML = ''
  layout.flat().forEach(dir => {
    const btn = document.createElement('button')
    btn.className = 'compass-btn'

    if (dir === 'center') {
      btn.classList.add('compass-center')
      btn.textContent = '◆'
      btn.disabled = true
    } else if (dir === null) {
      btn.style.visibility = 'hidden'
    } else {
      btn.textContent = dir.charAt(0)
      const hasExit = exitDirs.has(dir)
      btn.disabled = !hasExit

      if (hasExit) {
        const exit = exits.find(e => e.direction === dir)
        const result = dungeonGraph.canTraverse(currentRoom, dir, context)
        if (!result.allowed && exit?.gate?.locked) {
          btn.classList.add('locked')
        }
        btn.onclick = () => {
          if (result.allowed) {
            const dest = dungeonGraph.getDestination(currentRoom, dir)
            if (dest) handleRoomClick(dest)
          } else if (exit?.gate) {
            showBlockedFeedback(exit.gate)
          }
        }
      }
    }
    container.appendChild(btn)
  })
}

function renderKeyring() {
  const container = document.getElementById('keyring')
  if (!container) return

  container.innerHTML = ''

  allKeys.forEach(key => {
    const item = document.createElement('div')
    item.className = 'key-item'
    item.onclick = () => toggleKey(key.id)

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    icon.setAttribute('viewBox', '0 0 24 24')
    icon.classList.add('key-icon')
    icon.classList.add(heldKeys.includes(key.id) ? 'held' : 'not-held')
    icon.innerHTML = `<path fill="${key.color}" d="M7 14a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2 2 2 0 01-2 2m5.65-4A6 6 0 007 6a6 6 0 00-6 6 6 6 0 006 6 6 6 0 004.65-2.2L14 18l2-2 2 2 2-2 2-2-2-2-4.35-4z"/>`

    const label = document.createElement('span')
    label.className = 'key-label'
    label.textContent = key.name

    item.appendChild(icon)
    item.appendChild(label)
    container.appendChild(item)
  })
}

function toggleKey(keyId) {
  if (heldKeys.includes(keyId)) {
    heldKeys = heldKeys.filter(k => k !== keyId)
  } else {
    heldKeys.push(keyId)
  }
  renderKeyring()
  renderCompass()
}

export function resetDungeon() {
  currentRoom = 'guard-room'
  heldKeys = ['brass']
  discoveredPassages = []
  initDungeonGraph()
  renderDungeon()
}

export function revealSecret() {
  if (!discoveredPassages.includes('secret-passage')) {
    discoveredPassages.push('secret-passage')
    renderDungeon()
  }
}

export function setFindPathMode(enabled) {
  findPathMode = enabled
  document.querySelectorAll('.connection-line').forEach(l => l.classList.remove('path-preview'))
}

export function initDungeon() {
  initDungeonGraph()
  renderDungeon()

  document.getElementById('dungeon-reset')?.addEventListener('click', resetDungeon)
  document.getElementById('find-path-toggle')?.addEventListener('change', (e) => setFindPathMode(e.target.checked))
  document.getElementById('reveal-secret')?.addEventListener('click', revealSecret)
}

// Demo automation API
export const dungeonDemo = {
  async run() {
    const delay = (ms) => new Promise(r => setTimeout(r, ms))

    // Reset to initial state
    resetDungeon()
    await delay(300)

    // Move to hall
    handleRoomClick('hall')
    await delay(500)

    // Try to enter treasury (blocked - but we have brass key!)
    handleRoomClick('treasury')
    await delay(800)

    // Move to library
    handleRoomClick('library')
    await delay(500)

    // Reveal secret passage
    revealSecret()
    await delay(500)

    // Enter secret room
    handleRoomClick('secret-room')
    await delay(500)

    // Go back to hall
    handleRoomClick('hall')
    await delay(500)

    // Pick up vault key
    if (!heldKeys.includes('vault')) {
      toggleKey('vault')
      await delay(300)
    }

    // Try armory path
    handleRoomClick('armory')
    await delay(500)

    // Enter dungeon (now with vault key)
    handleRoomClick('dungeon')
    await delay(500)
  },

  getState() {
    return { currentRoom, heldKeys: [...heldKeys], discoveredPassages: [...discoveredPassages] }
  }
}
