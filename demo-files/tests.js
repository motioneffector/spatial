/**
 * Test Definitions and Exhibit Registrations
 * Includes integrity tests and library-specific tests
 */

// Import library to ensure it's available (also set by demo.js)
import * as Library from '../dist/index.js'
if (!window.Library) window.Library = Library

// ============================================
// DEMO INTEGRITY TESTS
// These tests verify the demo itself is correctly structured.
// They are IDENTICAL across all @motioneffector demos.
// Do not modify, skip, or weaken these tests.
// ============================================

function registerIntegrityTests() {
  // ─────────────────────────────────────────────
  // STRUCTURAL INTEGRITY
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Library is loaded', () => {
    if (typeof window.Library === 'undefined') {
      throw new Error('window.Library is undefined - library not loaded')
    }
  })

  testRunner.registerTest('[Integrity] Library has exports', () => {
    const exports = Object.keys(window.Library)
    if (exports.length === 0) {
      throw new Error('window.Library has no exports')
    }
  })

  testRunner.registerTest('[Integrity] Test runner exists', () => {
    const runner = document.getElementById('test-runner')
    if (!runner) {
      throw new Error('No element with id="test-runner"')
    }
  })

  testRunner.registerTest('[Integrity] Test runner is first section after header', () => {
    const main = document.querySelector('main')
    if (!main) {
      throw new Error('No <main> element found')
    }
    const firstSection = main.querySelector('section')
    if (!firstSection || firstSection.id !== 'test-runner') {
      throw new Error('Test runner must be the first <section> inside <main>')
    }
  })

  testRunner.registerTest('[Integrity] Run All Tests button exists with correct format', () => {
    const btn = document.getElementById('run-all-tests')
    if (!btn) {
      throw new Error('No button with id="run-all-tests"')
    }
    const text = btn.textContent.trim()
    if (!text.includes('Run All Tests')) {
      throw new Error(`Button text must include "Run All Tests", got: "${text}"`)
    }
    const icon = btn.querySelector('.btn-icon')
    if (!icon || !icon.textContent.includes('▶')) {
      throw new Error('Button must have play icon (▶) in .btn-icon element')
    }
  })

  testRunner.registerTest('[Integrity] At least one exhibit exists', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    if (exhibits.length === 0) {
      throw new Error('No elements with class="exhibit"')
    }
  })

  testRunner.registerTest('[Integrity] All exhibits have unique IDs', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    const ids = new Set()
    exhibits.forEach(ex => {
      if (!ex.id) {
        throw new Error('Exhibit missing id attribute')
      }
      if (ids.has(ex.id)) {
        throw new Error(`Duplicate exhibit id: ${ex.id}`)
      }
      ids.add(ex.id)
    })
  })

  testRunner.registerTest('[Integrity] All exhibits registered for walkthrough', () => {
    const exhibitElements = document.querySelectorAll('.exhibit')
    const registeredCount = testRunner.exhibits.length
    if (registeredCount < exhibitElements.length) {
      throw new Error(
        `Only ${registeredCount} exhibits registered for walkthrough, ` +
        `but ${exhibitElements.length} .exhibit elements exist`
      )
    }
  })

  testRunner.registerTest('[Integrity] CSS loaded from demo-files/', () => {
    const links = document.querySelectorAll('link[rel="stylesheet"]')
    const hasExternal = Array.from(links).some(link =>
      link.href.includes('demo-files/')
    )
    if (!hasExternal) {
      throw new Error('No stylesheet loaded from demo-files/ directory')
    }
  })

  testRunner.registerTest('[Integrity] No inline style tags', () => {
    const styles = document.querySelectorAll('style')
    if (styles.length > 0) {
      throw new Error(`Found ${styles.length} inline <style> tags - extract to demo-files/demo.css`)
    }
  })

  testRunner.registerTest('[Integrity] No inline onclick handlers', () => {
    const withOnclick = document.querySelectorAll('[onclick]')
    if (withOnclick.length > 0) {
      throw new Error(`Found ${withOnclick.length} elements with onclick - use addEventListener`)
    }
  })

  // ─────────────────────────────────────────────
  // NO AUTO-PLAY VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Output areas are empty on load', () => {
    const outputs = document.querySelectorAll('.exhibit-output, .output, [data-output]')
    outputs.forEach(output => {
      // Allow placeholder text but not actual content
      const hasPlaceholder = output.dataset.placeholder ||
        output.classList.contains('placeholder') ||
        output.querySelector('.placeholder')

      const text = output.textContent.trim()
      const children = output.children.length

      // If it has content that isn't a placeholder, that's a violation
      if ((text.length > 50 || children > 1) && !hasPlaceholder) {
        throw new Error(
          `Output area appears pre-populated: "${text.substring(0, 50)}..." - ` +
          `outputs must be empty until user interaction`
        )
      }
    })
  })

  testRunner.registerTest('[Integrity] No setTimeout calls on module load', () => {
    if (window.__suspiciousTimersDetected) {
      throw new Error(
        'Detected setTimeout/setInterval during page load - ' +
        'demos must not auto-run'
      )
    }
  })

  // ─────────────────────────────────────────────
  // REAL LIBRARY VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Library functions are callable', () => {
    const lib = window.Library
    const exports = Object.keys(lib)

    // At least one export must be a function
    const hasFunctions = exports.some(key => typeof lib[key] === 'function')
    if (!hasFunctions) {
      throw new Error('Library exports no callable functions')
    }
  })

  testRunner.registerTest('[Integrity] No mock implementations detected', () => {
    // Check for common mock patterns in window
    const suspicious = [
      'mockParse', 'mockValidate', 'fakeParse', 'fakeValidate',
      'stubParse', 'stubValidate', 'testParse', 'testValidate'
    ]
    suspicious.forEach(name => {
      if (typeof window[name] === 'function') {
        throw new Error(`Detected mock function: window.${name} - use real library`)
      }
    })
  })

  // ─────────────────────────────────────────────
  // VISUAL FEEDBACK VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] CSS includes animation definitions', () => {
    const sheets = document.styleSheets
    let hasAnimations = false

    try {
      for (const sheet of sheets) {
        // Skip cross-origin stylesheets
        if (!sheet.href || sheet.href.includes('demo-files/')) {
          const rules = sheet.cssRules || sheet.rules
          for (const rule of rules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE ||
                (rule.style && (
                  rule.style.animation ||
                  rule.style.transition ||
                  rule.style.animationName
                ))) {
              hasAnimations = true
              break
            }
          }
        }
        if (hasAnimations) break
      }
    } catch (e) {
      // CORS error - assume external sheet has animations
      hasAnimations = true
    }

    if (!hasAnimations) {
      throw new Error('No CSS animations or transitions found - visual feedback required')
    }
  })

  testRunner.registerTest('[Integrity] Interactive elements have hover states', () => {
    const buttons = document.querySelectorAll('button, .btn')
    if (buttons.length === 0) return // No buttons to check

    // Check that enabled buttons have pointer cursor (disabled buttons should have not-allowed)
    const enabledBtn = Array.from(buttons).find(btn => !btn.disabled)
    if (!enabledBtn) return // All buttons are disabled, skip check

    const styles = window.getComputedStyle(enabledBtn)
    if (styles.cursor !== 'pointer') {
      throw new Error('Buttons should have cursor: pointer')
    }
  })

  // ─────────────────────────────────────────────
  // WALKTHROUGH REGISTRATION VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Walkthrough demonstrations are async functions', () => {
    testRunner.exhibits.forEach(exhibit => {
      if (typeof exhibit.demonstrate !== 'function') {
        throw new Error(`Exhibit "${exhibit.name}" has no demonstrate function`)
      }
      // Check if it's async by seeing if it returns a thenable
      const result = exhibit.demonstrate.toString()
      if (!result.includes('async') && !result.includes('Promise')) {
        console.warn(`Exhibit "${exhibit.name}" demonstrate() may not be async`)
      }
    })
  })

  testRunner.registerTest('[Integrity] Each exhibit has required elements', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    exhibits.forEach(exhibit => {
      // Must have a title
      const title = exhibit.querySelector('.exhibit-title, h2, h3')
      if (!title) {
        throw new Error(`Exhibit ${exhibit.id} missing title element`)
      }

      // Must have an interactive area
      const interactive = exhibit.querySelector(
        '.exhibit-interactive, .exhibit-content, [data-interactive]'
      )
      if (!interactive) {
        throw new Error(`Exhibit ${exhibit.id} missing interactive area`)
      }
    })
  })
}

// ============================================
// LIBRARY-SPECIFIC TESTS
// ============================================

function registerLibraryTests() {
  const { createSpatialGraph, Direction, ValidationError } = window.Library

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

  // Basic graph tests
  testRunner.registerTest('creates empty graph', () => {
    const g = createSpatialGraph()
    expect(g).toBeDefined()
    expect(g.getAllNodes()).toEqual([])
  })

  testRunner.registerTest('creates node with id', () => {
    const g = createSpatialGraph()
    g.createNode('test')
    expect(g.hasNode('test')).toBe(true)
  })

  testRunner.registerTest('creates node with metadata', () => {
    const g = createSpatialGraph()
    g.createNode('test', { name: 'Test Node', custom: 123 })
    const node = g.getNode('test')
    expect(node.metadata.name).toBe('Test Node')
    expect(node.metadata.custom).toBe(123)
  })

  testRunner.registerTest('throws on duplicate node id', () => {
    const g = createSpatialGraph()
    g.createNode('test')
    expect(() => g.createNode('test')).toThrow()
  })

  testRunner.registerTest('throws on empty node id', () => {
    const g = createSpatialGraph()
    expect(() => g.createNode('')).toThrow()
  })

  testRunner.registerTest('removes node', () => {
    const g = createSpatialGraph()
    g.createNode('test')
    g.removeNode('test')
    expect(g.hasNode('test')).toBe(false)
  })

  testRunner.registerTest('connects nodes bidirectionally', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    expect(g.getConnection('a', Direction.NORTH).target).toBe('b')
    expect(g.getConnection('b', Direction.SOUTH).target).toBe('a')
  })

  testRunner.registerTest('connects nodes one-way', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { bidirectional: false })
    expect(g.getConnection('a', Direction.NORTH).target).toBe('b')
    expect(g.getConnection('b', Direction.SOUTH)).toBeNull()
  })

  testRunner.registerTest('disconnects nodes', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    g.disconnect('a', Direction.NORTH)
    expect(g.getConnection('a', Direction.NORTH)).toBeNull()
  })

  testRunner.registerTest('gets exits from node', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('c')
    g.connect('a', Direction.NORTH, 'b')
    g.connect('a', Direction.EAST, 'c')
    const exits = g.getExits('a')
    expect(exits).toHaveLength(2)
  })

  testRunner.registerTest('sets gate on connection', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    g.setGate('a', Direction.NORTH, { id: 'door', locked: true })
    const gate = g.getGate('a', Direction.NORTH)
    expect(gate.id).toBe('door')
    expect(gate.locked).toBe(true)
  })

  testRunner.registerTest('updates gate', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    g.setGate('a', Direction.NORTH, { id: 'door', locked: true })
    g.updateGate('a', Direction.NORTH, { locked: false })
    expect(g.getGate('a', Direction.NORTH).locked).toBe(false)
  })

  testRunner.registerTest('removes gate', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    g.setGate('a', Direction.NORTH, { id: 'door', locked: true })
    g.removeGate('a', Direction.NORTH)
    expect(g.getGate('a', Direction.NORTH)).toBeNull()
  })

  testRunner.registerTest('canTraverse returns true for open connection', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    const result = g.canTraverse('a', Direction.NORTH)
    expect(result.allowed).toBe(true)
  })

  testRunner.registerTest('canTraverse returns false for locked gate', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { gate: { id: 'door', locked: true, keyId: 'key' } })
    const result = g.canTraverse('a', Direction.NORTH)
    expect(result.allowed).toBe(false)
  })

  testRunner.registerTest('canTraverse allows with key', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { gate: { id: 'door', locked: true, keyId: 'key' } })
    const result = g.canTraverse('a', Direction.NORTH, { inventory: ['key'] })
    expect(result.allowed).toBe(true)
  })

  testRunner.registerTest('findPath returns path', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('c')
    g.connect('a', Direction.NORTH, 'b')
    g.connect('b', Direction.NORTH, 'c')
    const path = g.findPath('a', 'c')
    expect(path).toEqual(['a', 'b', 'c'])
  })

  testRunner.registerTest('findPath returns null when blocked', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { gate: { id: 'door', locked: true } })
    const path = g.findPath('a', 'b')
    expect(path).toBeNull()
  })

  testRunner.registerTest('findPath respects cost', () => {
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

  testRunner.registerTest('getDistance returns cost', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b', { cost: 5 })
    expect(g.getDistance('a', 'b')).toBe(5)
  })

  testRunner.registerTest('getDistance returns Infinity when unreachable', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    expect(g.getDistance('a', 'b')).toBe(Infinity)
  })

  testRunner.registerTest('canReach returns true for connected', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    expect(g.canReach('a', 'b')).toBe(true)
  })

  testRunner.registerTest('canReach returns false for disconnected', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    expect(g.canReach('a', 'b')).toBe(false)
  })

  testRunner.registerTest('getReachable returns all reachable nodes', () => {
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

  testRunner.registerTest('setZone assigns zone to node', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.setZone('a', 'zone-1')
    expect(g.getZone('a')).toBe('zone-1')
  })

  testRunner.registerTest('getNodesInZone returns zone nodes', () => {
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

  testRunner.registerTest('getOrphans returns disconnected nodes', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.createNode('orphan')
    g.connect('a', Direction.NORTH, 'b')
    const orphans = g.getOrphans()
    expect(orphans).toContain('orphan')
    expect(orphans).toHaveLength(1)
  })

  testRunner.registerTest('getDeadEnds returns single-exit nodes', () => {
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

  testRunner.registerTest('getSubgraphs returns connected groups', () => {
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

  testRunner.registerTest('validate returns valid for good graph', () => {
    const g = createSpatialGraph()
    g.createNode('a')
    g.createNode('b')
    g.connect('a', Direction.NORTH, 'b')
    const result = g.validate()
    expect(result.valid).toBe(true)
  })

  testRunner.registerTest('serialize and deserialize roundtrip', () => {
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

  testRunner.registerTest('Direction.opposite returns correct opposite', () => {
    expect(Direction.opposite('NORTH')).toBe('SOUTH')
    expect(Direction.opposite('EAST')).toBe('WEST')
    expect(Direction.opposite('UP')).toBe('DOWN')
  })

  testRunner.registerTest('Direction.parse parses abbreviations', () => {
    expect(Direction.parse('n')).toBe('NORTH')
    expect(Direction.parse('se')).toBe('SOUTHEAST')
    expect(Direction.parse('u')).toBe('UP')
  })

  testRunner.registerTest('on() fires events', () => {
    const g = createSpatialGraph()
    let fired = false
    g.on('nodeCreated', () => { fired = true })
    g.createNode('a')
    expect(fired).toBe(true)
  })

  testRunner.registerTest('unsubscribe stops events', () => {
    const g = createSpatialGraph()
    let count = 0
    const unsub = g.on('nodeCreated', () => { count++ })
    g.createNode('a')
    unsub()
    g.createNode('b')
    expect(count).toBe(1)
  })
}

// ============================================
// EXHIBIT REGISTRATIONS FOR WALKTHROUGH
// ============================================

function registerExhibits() {
  // Import exhibit demos from their modules
  const { dungeonDemo } = window
  const { workshopDemo } = window
  const { pathfindingDemo } = window

  // Register Exhibit 1: Dungeon Explorer
  testRunner.registerExhibit(
    'Dungeon Explorer',
    document.getElementById('exhibit-dungeon'),
    async () => {
      if (dungeonDemo && typeof dungeonDemo.run === 'function') {
        await dungeonDemo.run()
      } else {
        console.warn('dungeonDemo.run not available')
      }
    }
  )

  // Register Exhibit 2: Graph Workshop
  testRunner.registerExhibit(
    'Graph Workshop',
    document.getElementById('exhibit-workshop'),
    async () => {
      if (workshopDemo && typeof workshopDemo.run === 'function') {
        await workshopDemo.run()
      } else {
        console.warn('workshopDemo.run not available')
      }
    }
  )

  // Register Exhibit 3: Pathfinding Theater
  testRunner.registerExhibit(
    'Pathfinding Theater',
    document.getElementById('exhibit-pathfinding'),
    async () => {
      if (pathfindingDemo && typeof pathfindingDemo.run === 'function') {
        await pathfindingDemo.run()
      } else {
        console.warn('pathfindingDemo.run not available')
      }
    }
  )
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Register tests in order: integrity first, then library tests
  registerIntegrityTests()
  registerLibraryTests()

  // Register exhibits for walkthrough
  registerExhibits()
})
