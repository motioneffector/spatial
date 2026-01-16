/**
 * Demo Initialization and Exhibit Setup
 * Imports exhibits and initializes them on page load
 */

// Import library and expose globally for tests
import * as Library from '../dist/index.js'
window.Library = Library

import { initDungeon, dungeonDemo } from './dungeon.js'
import { initWorkshop, workshopDemo } from './workshop.js'
import { initPathfinding, pathfindingDemo } from './pathfinding.js'

// Expose demo APIs for tests.js
window.dungeonDemo = dungeonDemo
window.workshopDemo = workshopDemo
window.pathfindingDemo = pathfindingDemo

// Initialize all exhibits on page load
document.addEventListener('DOMContentLoaded', () => {
  initDungeon()
  initWorkshop()
  initPathfinding()
})
