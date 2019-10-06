
import { clamp } from 'mathutil'

import { Pool } from './pool'
import { Rect, Point } from './utils'

const defaultSettings = {
  zoomRange: [1, 4]
}

/**
 * Notes:
 * Position can be gleaned from viewport dimensions so is unnecessary.
 * Offset, to draw to a specific place is also unnecessary, a camera is attached
 * to a container, just move the container and let the camera render into it.
 */
export class Camera {
  constructor ({
    // Current viewport being rendered
    viewport = Rect.of(0, 0, 10, 10),

    // Zoom settings
    zoom = 1,

    // Size of underlying tile map
    cellSize = Point.of(10, 10),

    // Additional settings
    settings = {}
  } = {}) {
    this.viewport = viewport
    this.zoom = zoom
    this.cellSize = cellSize
    this.settings = {
      ...defaultSettings,
      ...settings
    }

    // Need to be careful with the pool, to make sure it can handle the number
    // of elements the camera wants to render
    this.pool = Pool.of({
      dim: Point.of(viewport.width, viewport.height)
    })
  }

  static of (params = {}) {
    return new Camera(params)
  }

  attach (container) {
    this.pool.attach(container)
  }

  setViewport (rect) {

  }

  /**
   * Zoom methods
   * @TODO zooming is currently snapping, this _could_ be animated by adding
   * an update to camera which handles the easing. For pixel roguelike stuff
   * this probably isn't necessary but it's nice for other types of tiled games.
   */
  _checkZoom () {
    const [min, max] = this.settings.zoomRange
    this.zoom = clamp(this.zoom, min, max)
  }

  setZoom (zoom) {
    this.zoom = zoom || this.zoom
    this._checkZoom()
  }

  applyZoom (amount = 0) {
    this.zoom += amount
    this._checkZoom()
  }

  /**
   * Translation methods.
   * @TODO panning is currently instantaneous, add anim functions and rename
   * pan to snap and snapTo.
   */
  checkViewportBounds () {
    // @TODO only checks 0 bounds as strange things happen when viewport is
    // negative. Should probably add a max camera world boundary for the
    // other end of the scale.
    if (this.viewport.pos[0] < 0) {
      this.viewport.translate(-this.viewport.pos[0], 0)
    }

    if (this.viewport.pos[1] < 0) {
      this.viewport.translate(0, -this.viewport.pos[1])
    }
  }

  pan (x, y) {
    if (x instanceof Point) {
      this.pan(x.x, x.y)
      return
    }

    this.viewport.translate(x, y)
    this.checkViewportBounds()
  }

  panTo (x, y) {
    if (x instanceof Point) {
      this.panTo(x.x, x.y)
      return
    }

    this.viewport.translate(
      x - this.viewport.pos[0],
      y - this.viewport.pos[1]
    )
    this.checkViewportBounds()
  }

  /**
   * Renders a specific Sprite object, but requires a location in world coords
   */
  renderSprite (sprite, x, y) {
    sprite.visible = true
    sprite.position.set(
      (x - this.viewport.pos[0]) * this.cellSize.x * this.zoom,
      (y - this.viewport.pos[1]) * this.cellSize.y * this.zoom
    )
    sprite.scale.set(this.zoom)
  }

  /**
   * Camera just works out relative position and scale of objects.
   * For tiles it uses the pool of sprites and sets the position and scale, and
   * then passes those, with the cell from the supplied map, to the render
   * function to perform any more transforms on the sprites.
   */
  renderTiles (tiles, renderFunc) {
    if (!renderFunc || typeof renderFunc !== 'function') {
      throw new Error('Supply render function to Camera::renderTiles')
    }
    /**
     * This still does more than it needs to, in essence it should map a tiled
     * map on to the map of sprites. The SpritePool can remain an ndarray but,
     * we should access it linearly though ndarray.data[i] as that is faster than
     * using the strided approach (ndarray.get).
     * If zoom is disabled then we can position and size the SpritePool elements
     * up front, then Camera just handles culling the list of renderables by
     * iterating over the only relevant map section.
     */

    // @TODO if map is smaller than viewport then only iterate over the map,
    // otherwise, iterate over the viewport. This is all about iterating over
    // the minimum amount of tiles.

    // @TODO pull out only the viewport from the map
    let cell = null
    let sprite = null
    let exists = false
    for (let y = this.viewport.pos[1]; y < this.viewport.pos[3]; y++) {
      for (let x = this.viewport.pos[0]; x < this.viewport.pos[2]; x++) {
        cell = (x < tiles.shape[0] && y < tiles.shape[1])
          ? tiles.get(x, y)
          : null

        // Translate back to [0, 0] for pool access
        sprite = this.pool.get(x - this.viewport.pos[0], y - this.viewport.pos[1])

        exists = !(typeof cell === 'undefined' || cell === null)

        if (exists) {
          this.renderSprite(sprite, x, y)

          renderFunc(cell, sprite)
        }

        // Hide sprites that may have previously been rendered
        if (!exists) {
          sprite.visible = false
        }
      }
    }
  }

  renderTo (canvas) {

  }

  resize () {

  }
}
