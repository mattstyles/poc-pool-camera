
import { Texture, Rectangle, settings, SCALE_MODES } from 'pixi.js'
import constants from './constants'

// @TODO use 1x for window.devicePixelRatio === 1
// In our case using the 1x is actually fine as we're nearest neighbour
// blending anyways
import spritesheet from '../cp437@2x.png' // set constants.cellsize to 10
// import spritesheet from '../zx_evolution_8x8@2x.png' // set constants.cellsize to 8

// Pixel scaling, no antialiasing
settings.SCALE_MODE = SCALE_MODES.NEAREST

// Texture size is the size of the atlas, in this case 16 by 16 items
const TEX_SIZE = [16, 16]

// Cell size refers to the size of each cell in the atlas
const TEX_CELL_SIZE = [constants.cellSize, constants.cellSize]

export const baseTexture = Texture.from(spritesheet)
export const frames = []

for (let v = 0; v < TEX_SIZE[1]; v++) {
  for (let u = 0; u < TEX_SIZE[0]; u++) {
    frames.push(new Texture(
      baseTexture,
      new Rectangle(
        (u * TEX_CELL_SIZE[0]),
        (v * TEX_CELL_SIZE[1]),
        TEX_CELL_SIZE[0],
        TEX_CELL_SIZE[1]
      )
    ))
  }
}
