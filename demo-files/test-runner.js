/**
 * Test Runner with Demo Automation
 * Runs tests and optionally demonstrates all exhibits
 */

import { createSpatialGraph, Direction, ValidationError } from './spatial-lib.js'
import { dungeonDemo, resetDungeon } from './dungeon.js'
import { workshopDemo, renderWorkshop } from './workshop.js'
import { pathfindingDemo, resetPfState } from './pathfinding.js'

// Test utilities
function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}`)
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`)
      }
    },
    toBeDefined() {
      if (actual === undefined) throw new Error('Expected value to be defined')
    },
    toBeNull() {
      if (actual !== null) throw new Error(`Expected null but got ${actual}`)
    },
    toContain(item) {
      if (!actual.includes(item)) throw new Error(`Expected array to contain ${item}`)
    },
    toHaveLength(len) {
      if (actual.length !== len) throw new Error(`Expected length ${len} but got ${actual.length}`)
    },
    toThrow() {
      let threw = false
      try { actual() } catch (e) { threw = true }
      if (!threw) throw new Error('Expected function to throw')
    }
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Test runner
export const testRunner = {
  tests: [],
  results: [],
  running: false,

  register(name, fn) {
    this.tests.push({ name, fn })
  },

  async run(options = {}) {
    if (this.running) return
    this.running = true
    this.results = []

    const { runDemo = false } = options

    const output = document.getElementById('test-output')
    const progressFill = document.getElementById('progress-fill')
    const progressText = document.getElementById('progress-text')
    const summary = document.getElementById('test-summary')
    const passedCount = document.getElementById('passed-count')
    const failedCount = document.getElementById('failed-count')
    const skippedCount = document.getElementById('skipped-count')
    const runBtn = document.getElementById('run-tests')

    runBtn.disabled = true
    output.innerHTML = ''
    summary.classList.add('hidden')
    progressFill.style.width = '0%'
    progressFill.className = 'test-progress-fill'

    // Calculate total steps (tests + optional demo phases)
    const demoPhases = runDemo ? 3 : 0
    const totalSteps = this.tests.length + demoPhases

    let passed = 0
    let failed = 0
    let currentStep = 0

    // Run demo automation if enabled
    if (runDemo) {
      await this.runDemoAutomation(progressFill, progressText, output, () => {
        currentStep++
        return (currentStep / totalSteps) * 100
      })
    }

    // Run tests
    for (let i = 0; i < this.tests.length; i++) {
      const test = this.tests[i]
      currentStep++
      const progress = (currentStep / totalSteps) * 100

      progressFill.style.width = `${progress}%`
      progressText.textContent = `Running: ${test.name}`

      try {
        await test.fn()
        passed++
        this.results.push({ name: test.name, passed: true })
        output.innerHTML += `
          <div class="test-item">
            <span class="test-icon pass">✓</span>
            <span class="test-name">${escapeHtml(test.name)}</span>
          </div>
        `
      } catch (e) {
        failed++
        this.results.push({ name: test.name, passed: false, error: e.message })
        output.innerHTML += `
          <div class="test-item">
            <span class="test-icon fail">✗</span>
            <div>
              <div class="test-name">${escapeHtml(test.name)}</div>
              <div class="test-error">${escapeHtml(e.message)}</div>
            </div>
          </div>
        `
      }

      output.scrollTop = output.scrollHeight
      await new Promise(r => setTimeout(r, 20))
    }

    progressFill.classList.add(failed === 0 ? 'success' : 'failure')
    progressText.textContent = `Complete: ${passed}/${this.tests.length} passed`

    passedCount.textContent = passed
    failedCount.textContent = failed
    skippedCount.textContent = 0
    summary.classList.remove('hidden')

    runBtn.disabled = false
    this.running = false
  },

  async runDemoAutomation(progressFill, progressText, output, getProgress) {
    const statusBanner = document.getElementById('demo-status')

    const showStatus = (text) => {
      if (statusBanner) {
        statusBanner.textContent = text
        statusBanner.classList.add('active')
      }
    }

    const hideStatus = () => {
      if (statusBanner) {
        statusBanner.classList.remove('active')
      }
    }

    const scrollToExhibit = (n) => {
      const exhibit = document.querySelector(`.exhibit:nth-child(${n})`)
      if (exhibit) {
        exhibit.scrollIntoView({ behavior: 'smooth', block: 'center' })
        exhibit.classList.add('demo-active')
        setTimeout(() => exhibit.classList.remove('demo-active'), 3000)
      }
    }

    try {
      // Demo Exhibit 1: Dungeon Explorer
      showStatus('Demo: Dungeon Explorer - Navigating rooms, unlocking doors...')
      progressText.textContent = 'Demo: Dungeon Explorer'
      progressFill.style.width = `${getProgress()}%`
      scrollToExhibit(1)

      output.innerHTML += `
        <div class="test-item">
          <span class="test-icon pass">▶</span>
          <span class="test-name">Demo: Dungeon Explorer</span>
        </div>
      `

      await dungeonDemo.run()
      await new Promise(r => setTimeout(r, 300))

      // Demo Exhibit 2: Graph Workshop
      showStatus('Demo: Graph Workshop - Analyzing graph structure...')
      progressText.textContent = 'Demo: Graph Workshop'
      progressFill.style.width = `${getProgress()}%`
      scrollToExhibit(2)

      output.innerHTML += `
        <div class="test-item">
          <span class="test-icon pass">▶</span>
          <span class="test-name">Demo: Graph Workshop</span>
        </div>
      `

      await workshopDemo.run()
      await new Promise(r => setTimeout(r, 300))

      // Demo Exhibit 3: Pathfinding Theater
      showStatus('Demo: Pathfinding Theater - Running Dijkstra\'s algorithm...')
      progressText.textContent = 'Demo: Pathfinding Theater'
      progressFill.style.width = `${getProgress()}%`
      scrollToExhibit(3)

      output.innerHTML += `
        <div class="test-item">
          <span class="test-icon pass">▶</span>
          <span class="test-name">Demo: Pathfinding Theater</span>
        </div>
      `

      await pathfindingDemo.run()
      await new Promise(r => setTimeout(r, 300))

      hideStatus()

      output.innerHTML += `
        <div class="test-item" style="background: rgba(35, 134, 54, 0.1);">
          <span class="test-icon pass">✓</span>
          <span class="test-name" style="color: var(--accent-green-bright);">All demos completed successfully</span>
        </div>
      `

    } catch (e) {
      hideStatus()
      output.innerHTML += `
        <div class="test-item">
          <span class="test-icon fail">✗</span>
          <div>
            <div class="test-name">Demo automation error</div>
            <div class="test-error">${escapeHtml(e.message)}</div>
          </div>
        </div>
      `
    }

    // Scroll back to test runner
    document.querySelector('.test-runner')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    await new Promise(r => setTimeout(r, 500))
  }
}

// Fuzz tests
export const fuzzTests = [{
  name: 'Fuzz: random operations on graph',
  fn: async () => {
    const g = createSpatialGraph()
    const nodes = []
    for (let i = 0; i < 50; i++) {
      const id = `node-${i}`
      g.createNode(id)
      nodes.push(id)
    }
    for (let i = 0; i < 100; i++) {
      const from = nodes[Math.floor(Math.random() * nodes.length)]
      const to = nodes[Math.floor(Math.random() * nodes.length)]
      if (from !== to) {
        try {
          const dirs = [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST]
          g.connect(from, dirs[Math.floor(Math.random() * 4)], to)
        } catch (e) {}
      }
    }
    const result = g.validate()
    expect(result.valid).toBe(true)
  }
}]

// Register all tests
function registerTests() {
  // Basic tests
  testRunner.register('creates empty graph', () => {
    const g = createSpatialGraph()
    expect(g).toBeDefined()
    expect(g.getAllNodes()).toEqual([])
  })

  testRunner.register('creates node with id', () => {
    const g = createSpatialGraph()
    g.createNode('test')
    expect(g.hasNode('test')).toBe(true)
  })

  testRunner.register('creates node with metadata', () => {
    const g = createSpatialGraph()
    g.createNode('test', { name: 'Test Node', custom: 123 })
    const node = g.getNode('test')
    expect(node.metadata.name).toBe('Test Node')
    expect(node.metadata.custom).toBe(123)
  })

  testRunner.register('throws on duplicate node id', () => {
    const g = createSpatialGraph()
    g.createNode('test')
    expect(() => g.createNode('test')).toThrow()
  })

  testRunner.register('throws on empty node id', () => {
    const g = createSpatialGraph()
    expect(() => g.createNode('')).toThrow()
  })

  testRunner.register('removes node', () => {
    const g = createSpatialGraph()
    g.createNode('test')
    g.removeNode('test')
    expect(g.hasNode('test')).toBe(false)
  })

  testRunner.register('connects nodes bidirectionally', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    expect(g.getConnection('a', Direction.NORTH).target).toBe('b')
    expect(g.getConnection('b', Direction.SOUTH).target).toBe('a')
  })

  testRunner.register('connects nodes one-way', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { bidirectional: false })
    expect(g.getConnection('a', Direction.NORTH).target).toBe('b')
    expect(g.getConnection('b', Direction.SOUTH)).toBeNull()
  })

  testRunner.register('disconnects nodes', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    g.disconnect('a', Direction.NORTH)
    expect(g.getConnection('a', Direction.NORTH)).toBeNull()
  })

  testRunner.register('gets exits from node', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('c')
    g.connect('a', Direction.NORTH, 'b')
    g.connect('a', Direction.EAST, 'c')
    const exits = g.getExits('a')
    expect(exits).toHaveLength(2)
  })

  testRunner.register('sets gate on connection', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    g.setGate('a', Direction.NORTH, { id: 'door', locked: true })
    const gate = g.getGate('a', Direction.NORTH)
    expect(gate.id).toBe('door')
    expect(gate.locked).toBe(true)
  })

  testRunner.register('updates gate', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    g.setGate('a', Direction.NORTH, { id: 'door', locked: true })
    g.updateGate('a', Direction.NORTH, { locked: false })
    expect(g.getGate('a', Direction.NORTH).locked).toBe(false)
  })

  testRunner.register('removes gate', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    g.setGate('a', Direction.NORTH, { id: 'door', locked: true })
    g.removeGate('a', Direction.NORTH)
    expect(g.getGate('a', Direction.NORTH)).toBeNull()
  })

  testRunner.register('canTraverse returns true for open connection', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    const result = g.canTraverse('a', Direction.NORTH)
    expect(result.allowed).toBe(true)
  })

  testRunner.register('canTraverse returns false for locked gate', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { gate: { id: 'door', locked: true, keyId: 'key' } })
    const result = g.canTraverse('a', Direction.NORTH)
    expect(result.allowed).toBe(false)
  })

  testRunner.register('canTraverse allows with key', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { gate: { id: 'door', locked: true, keyId: 'key' } })
    const result = g.canTraverse('a', Direction.NORTH, { inventory: ['key'] })
    expect(result.allowed).toBe(true)
  })

  testRunner.register('findPath returns path', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('c')
    g.connect('a', Direction.NORTH, 'b')
    g.connect('b', Direction.NORTH, 'c')
    const path = g.findPath('a', 'c')
    expect(path).toEqual(['a', 'b', 'c'])
  })

  testRunner.register('findPath returns null when blocked', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { gate: { id: 'door', locked: true } })
    const path = g.findPath('a', 'b')
    expect(path).toBeNull()
  })

  testRunner.register('findPath respects cost', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('c')
    g.connect('a', Direction.NORTH, 'b', { cost: 10 })
    g.connect('a', Direction.EAST, 'c', { cost: 1 })
    g.connect('c', Direction.NORTH, 'b', { cost: 1 })
    const path = g.findPath('a', 'b')
    expect(path).toEqual(['a', 'c', 'b'])
  })

  testRunner.register('getDistance returns cost', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { cost: 5 })
    expect(g.getDistance('a', 'b')).toBe(5)
  })

  testRunner.register('getDistance returns Infinity when unreachable', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    expect(g.getDistance('a', 'b')).toBe(Infinity)
  })

  testRunner.register('canReach returns true for connected', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    expect(g.canReach('a', 'b')).toBe(true)
  })

  testRunner.register('canReach returns false for disconnected', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    expect(g.canReach('a', 'b')).toBe(false)
  })

  testRunner.register('getReachable returns all reachable nodes', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('c')
    g.createNode('d')
    g.connect('a', Direction.NORTH, 'b')
    g.connect('b', Direction.NORTH, 'c')
    const reachable = g.getReachable('a')
    expect(reachable).toContain('a')
    expect(reachable).toContain('b')
    expect(reachable).toContain('c')
    expect(reachable).toHaveLength(3)
  })

  testRunner.register('setZone assigns zone to node', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.setZone('a', 'zone-1')
    expect(g.getZone('a')).toBe('zone-1')
  })

  testRunner.register('getNodesInZone returns zone nodes', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('c')
    g.setZone('a', 'zone-1')
    g.setZone('b', 'zone-1')
    const nodes = g.getNodesInZone('zone-1')
    expect(nodes).toContain('a')
    expect(nodes).toContain('b')
    expect(nodes).toHaveLength(2)
  })

  testRunner.register('getOrphans returns disconnected nodes', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('orphan')
    g.connect('a', Direction.NORTH, 'b')
    const orphans = g.getOrphans()
    expect(orphans).toContain('orphan')
    expect(orphans).toHaveLength(1)
  })

  testRunner.register('getDeadEnds returns single-exit nodes', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('c')
    g.connect('a', Direction.NORTH, 'b')
    g.connect('b', Direction.NORTH, 'c')
    const deadEnds = g.getDeadEnds()
    expect(deadEnds).toContain('a')
    expect(deadEnds).toContain('c')
  })

  testRunner.register('getSubgraphs returns connected groups', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('c')
    g.createNode('d')
    g.connect('a', Direction.NORTH, 'b')
    g.connect('c', Direction.NORTH, 'd')
    const subgraphs = g.getSubgraphs()
    expect(subgraphs).toHaveLength(2)
  })

  testRunner.register('validate returns valid for good graph', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    const result = g.validate()
    expect(result.valid).toBe(true)
  })

  testRunner.register('serialize and deserialize roundtrip', () => {
    const g = createSpatialGraph()
    g.createNode('a', { name: 'Node A' })
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { gate: { id: 'door', locked: true } })
    const data = g.serialize()

    const g2 = createSpatialGraph()
    g2.deserialize(data)
    expect(g2.hasNode('a')).toBe(true)
    expect(g2.hasNode('b')).toBe(true)
    expect(g2.getGate('a', Direction.NORTH).locked).toBe(true)
  })

  testRunner.register('Direction.opposite returns correct opposite', () => {
    expect(Direction.opposite('NORTH')).toBe('SOUTH')
    expect(Direction.opposite('EAST')).toBe('WEST')
    expect(Direction.opposite('UP')).toBe('DOWN')
  })

  testRunner.register('Direction.parse parses abbreviations', () => {
    expect(Direction.parse('n')).toBe('NORTH')
    expect(Direction.parse('se')).toBe('SOUTHEAST')
    expect(Direction.parse('u')).toBe('UP')
  })

  testRunner.register('on() fires events', () => {
    const g = createSpatialGraph()
    let fired = false
    g.on('nodeCreated', () => { fired = true })
    g.createNode('a')
    expect(fired).toBe(true)
  })

  testRunner.register('unsubscribe stops events', () => {
    const g = createSpatialGraph()
    let count = 0
    const unsub = g.on('nodeCreated', () => { count++ })
    g.createNode('a')
    unsub()
    g.createNode('b')
    expect(count).toBe(1)
  })
}

// Initialize
export function initTestRunner() {
  registerTests()

  document.getElementById('run-tests')?.addEventListener('click', () => {
    testRunner.run({ runDemo: true })
  })

  document.getElementById('run-fuzz')?.addEventListener('click', async () => {
    const output = document.getElementById('test-output')
    const progressFill = document.getElementById('progress-fill')
    const progressText = document.getElementById('progress-text')

    output.innerHTML = ''
    progressFill.style.width = '0%'
    progressText.textContent = 'Running fuzz tests...'

    for (const test of fuzzTests) {
      try {
        await test.fn()
        output.innerHTML += `<div class="test-item"><span class="test-icon pass">✓</span><span class="test-name">${test.name}</span></div>`
      } catch (e) {
        output.innerHTML += `<div class="test-item"><span class="test-icon fail">✗</span><div><div class="test-name">${test.name}</div><div class="test-error">${e.message}</div></div></div>`
      }
    }

    progressFill.style.width = '100%'
    progressFill.classList.add('success')
    progressText.textContent = 'Fuzz tests complete'
  })

  document.getElementById('page-reset')?.addEventListener('click', () => {
    window.location.reload()
  })
}
