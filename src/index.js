
import { Sprite, Container, Graphics } from 'pixi.js'
import { Rect, Point } from 'mathutil'
import { resize, actions } from 'raid-streams/screen'
import { Camera } from 'pixi-holga'
import { SpritePool } from 'pixi-spritepool'

import { createCanvas, createApplication } from './app'
import { stats } from './fps'
import { frames } from './texture'
import { map } from './map'
// import { Camera } from './camera'
import { rgbToNum } from './utils'

/**
 * Set up rendering screen
 */
const screen = createCanvas()
const app = createApplication({
  canvas: screen
})
const container = new Container()
app.stage.addChild(container)

const viewWidth = 32
const viewHeight = 32
const viewScale = 2

container.position.set(
  (window.innerWidth * 0.5) - (viewWidth * 10),
  (window.innerHeight * 0.5) - (viewHeight * 10)
)
container.scale.set(viewScale)

const centralise = container => (w, h) => {
  container.position.set(
    (w * 0.5) - (container.width * 0.5),
    (h * 0.5) - (container.height * 0.5)
  )
}

const centraliseView = centralise(container)

// setTimeout(() => {
//   centraliseView(window.innerWidth, window.innerHeight)
// }, 100)

resize({
  debounce: 50,
  el: window
}).observe(e => centraliseView(e.payload.width, e.payload.height))

/**
 * Debug element for container size
 */
const border = new Graphics()
border.lineStyle(2, 0xF02044)
border.beginFill(0x464646)
border.drawRect(-2, -2, (viewWidth * 10) + 4, (viewHeight * 10) + 4)
border.endFill()
container.addChild(border)

/**
 * Set up camera
 */
const camera = Camera.of({
  viewport: Rect.of(0, 0, viewWidth, viewHeight),
  bounds: Rect.of(0, 0, map.shape[0], map.shape[1]),
  container
})
// camera.attach(container)

/**
 * Set up sprite pool
 */
const pool = SpritePool.of({
  length: viewWidth * viewHeight,
  container
})
// @TODO a real app would probably need to ensure the pool is big enough by
// responding to viewport changes

// Helper for rendering a cell
const getCellTemplate = [
  {
    type: 'floor',
    frame: 46,
    tint: rgbToNum(80, 82, 88)
  },
  {
    type: 'wall',
    frame: 35,
    tint: rgbToNum(154, 158, 164)
  }
]

// Manually add a character
const dude = new Sprite(frames[2])
const dudePosition = Point.of(2, 2)
dude.tint = 0xFAF089
container.addChild(dude)

// Whip this out here to stop GC thrashing by reinit in the render loop
const renderTile = (cell, sprite) => {
  const tmpl = getCellTemplate[cell]

  sprite.texture = frames[tmpl.frame]
  sprite.tint = tmpl.tint
}

const renderTiles = (camera, tiles) => {
  let cell = null
  let sprite = null
  let exists = false
  let i = 0

  for (let y = camera.viewport.pos[1]; y < camera.viewport.pos[3]; y++) {
    for (let x = camera.viewport.pos[0]; x < camera.viewport.pos[2]; x++) {
      cell = (x < tiles.shape[0] && y < tiles.shape[1])
        ? tiles.get(x, y)
        : null

      // Use i and iterate
      sprite = pool.get(i)

      exists = !(typeof cell === 'undefined' || cell === null)

      if (exists) {
        camera.translateSprite(sprite, x, y)

        renderTile(cell, sprite)
      }

      // Hide sprites that may have previously been rendered
      if (!exists) {
        sprite.visible = false
      }

      // Explicitly ensure we are looping over the sprite pool
      i = i + 1
    }
  }
}

const render = () => {
  stats.begin()

  // render map
  renderTiles(camera, map)

  // move character to screen coords for this camera
  camera.translateSprite(dude, ...dudePosition.pos)

  stats.end()
}

// Render loop
// app.ticker.add(render)
render()

// Test re-rendering everything and check FPS
// app.ticker.add((tick) => {
//   camera.panTo(
//     Math.random() * map.shape[0] | 0,
//     Math.random() * map.shape[1] | 0
//   )
// })

window.container = container
window.dude = dude
window.dudePosition = dudePosition
window.render = render
window.app = app
window.map = map
window.Point = Point
window.Rect = Rect
window.camera = camera
