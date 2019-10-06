
import { Application } from 'pixi.js'
import fit from 'canvas-fit'

/**
 * Creates a raw canvas element
 */
export const createCanvas = ({
  id = 'js-canvas'
} = {}) => {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('id', id)
  document.body.appendChild(canvas)
  return canvas
}

/**
 * Turns a canvas element into a pixi application.
 * Additionally keeps it full screen.
 */
export const createApplication = ({
  canvas,
  willResize = true,
  appProps = {}
} = {}) => {
  const resolution = window.devicePixelRatio || 1

  // Not passing resolution here keeps the canvas fitting at 1x, but, passing
  // the resolution correctly to the app scales things as expected.
  // We pass it to the application so that scaling and translations can happen
  // without us having to handle the 1x, 2x or 3x
  const resize = fit(canvas)

  const app = new Application({
    width: canvas.width,
    height: canvas.height,
    backgroundColor: 0x333333,
    resolution: resolution,
    view: canvas,
    ...appProps
  })

  if (willResize) {
    window.addEventListener('resize', () => {
      resize()
      app.renderer.resize(canvas.width, canvas.height)
    }, false)
  }

  return app
}
