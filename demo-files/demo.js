/**
 * Demo Initialization and Exhibit Setup
 * Imports exhibits and initializes them on page load
 */

import { initDungeon, dungeonDemo } from './dungeon.js'
import { initWorkshop, workshopDemo } from './workshop.js'
import { initPathfinding, pathfindingDemo } from './pathfinding.js'

// Verify library is loaded
if (typeof window.Library === 'undefined') {
  throw new Error(
    'Library not loaded. Run `pnpm build` first, then serve this directory.'
  )
}

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
