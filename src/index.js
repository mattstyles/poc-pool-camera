
import { Sprite, Container, Graphics } from 'pixi.js'
import { Rect, Point } from 'mathutil'
import { resize } from 'raid-streams/screen'
import keystream, { keydown, keyup, actions as keyActions } from 'raid-streams/keys'
import { Camera } from 'pixi-holga'
import { SpritePool } from 'pixi-spritepool'

import { createCanvas, createApplication } from './app'
import { stats } from './fps'
import { frames } from './texture'
import { map } from './map'
import { rgbToNum } from './utils'
import constants from './constants'

/**
 * Set up rendering screen
 */
const screen = createCanvas()
const app = createApplication({
  canvas: screen
})
const container = new Container()
app.stage.addChild(container)

const viewWidth = constants.viewportSize[0]
const viewHeight = constants.viewportSize[1]
const viewScale = constants.viewportScale

container.position.set(
  (window.innerWidth * 0.5) - (viewWidth * (constants.cellSize * viewScale * 0.5)),
  (window.innerHeight * 0.5) - (viewHeight * (constants.cellSize * viewScale * 0.5))
)
container.scale.set(viewScale)

const centralise = container => (w, h) => {
  container.position.set(
    (w * 0.5) - (container.width * 0.5),
    (h * 0.5) - (container.height * 0.5)
  )
}

const centraliseView = centralise(container)

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
border.drawRect(-2, -2, (viewWidth * constants.cellSize) + 4, (viewHeight * constants.cellSize) + 4)
border.endFill()
container.addChild(border)

/**
 * Set up camera
 */
const camera = Camera.of({
  viewport: Rect.of(0, 0, viewWidth, viewHeight),
  bounds: Rect.of(0, 0, map.shape[0], map.shape[1]),
  settings: {
    cellSize: Point.of(constants.cellSize, constants.cellSize)
  },
  container
})
// camera.attach(container)

/**
 * toWorld transform and interactivity test.
 * Panning on the map is enabled.
 */
let startInteractionPos = [0, 0]

container.interactive = true
container.buttonMode = true
container.on('pointerdown', event => {
  console.group('Container pointer down')
  const { x: sx, y: sy } = event.data.getLocalPosition(container)
  console.log('screen:', ...[sx, sy])
  console.log('world:', ...camera.toWorldCoords(sx, sy).pos)
  console.groupEnd()

  startInteractionPos = camera.toWorldCoords(sx, sy).pos
})
container.on('pointermove', event => {
  if (event.data.buttons < 1) {
    return
  }

  const { x: sx, y: sy } = event.data.getLocalPosition(container)
  console.group('Container move with button down')
  console.log('screen:', ...[sx, sy])
  console.log('world:', ...camera.toWorldCoords(sx, sy).pos)
  console.groupEnd()

  const worldPos = camera.toWorldCoords(sx, sy).pos

  const desiredMove = [0, 0]
  if (worldPos[0] > startInteractionPos[0]) {
    desiredMove[0] = -1
  }
  if (worldPos[0] < startInteractionPos[0]) {
    desiredMove[0] = 1
  }
  if (worldPos[1] > startInteractionPos[1]) {
    desiredMove[1] = -1
  }
  if (worldPos[1] < startInteractionPos[1]) {
    desiredMove[1] = 1
  }

  startInteractionPos = camera.toWorldCoords(sx, sy).pos
  camera.pan(...desiredMove)
})
container.on('pointerup', event => {
  console.group('Container pointer up')
  const { x: sx, y: sy } = event.data.getLocalPosition(container)
  console.log('screen:', ...[sx, sy])
  console.log('world:', ...camera.toWorldCoords(sx, sy).pos)
  console.groupEnd()

  startInteractionPos = [0, 0]

  // Click to instant pan to tile
  // const worldPos = camera.toWorldCoords(sx, sy)
  // camera.panTo(...worldPos.pos)
})

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
const dudePosition = Point.of(constants.dudeCameraOffset, constants.dudeCameraOffset)
dude.tint = 0xFAF089
container.addChild(dude)

// Add dude interaction -- using keydown and keyup limits to one single key press per event
// const keys = new Map()
// keydown(keys).observe(event => {
//   if (event.payload.key === '<up>') {
//     dudePosition.translate(0, -1)
//   }
//
//   if (event.payload.key === '<down>') {
//     dudePosition.translate(0, 1)
//   }
//
//   if (event.payload.key === '<left>') {
//     dudePosition.translate(-1, 0)
//   }
//
//   if (event.payload.key === '<right>') {
//     dudePosition.translate(1, 0)
//   }
//
//   camera.panTo(Point.translate(dudePosition, Point.of(-constants.dudeCameraOffset, -constants.dudeCameraOffset)))
// })
// // Required to unset key map
// keyup(keys).observe(() => {})

// Need to add a debounce to raid-stream/keystream to control the key repeat behaviour, currently it is hard-wired to raf
keystream({
  rate: constants.keyRepeat
})
  .observe(event => {
    if (event.type === keyActions.keypress) {
      if (event.payload.keys.has('<up>')) {
        dudePosition.translate(0, -1)
      }

      if (event.payload.keys.has('<down>')) {
        dudePosition.translate(0, 1)
      }

      if (event.payload.keys.has('<left>')) {
        dudePosition.translate(-1, 0)
      }

      if (event.payload.keys.has('<right>')) {
        dudePosition.translate(1, 0)
      }
    }

    // Camera follow
    camera.panTo(
      Point.translate(
        dudePosition,
        Point.of(
          -constants.dudeCameraOffset,
          -constants.dudeCameraOffset
        )
      )
    )
  })

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
app.ticker.add(render)
// render()

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
