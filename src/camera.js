
import { clamp, Rect, Point } from 'mathutil'

import { SpritePool } from './pool'

const defaultSettings = {
  zoomRange: [1, 4],
  cellSize: Point.of(10, 10)
}

/**
 * NOT USED, NOW PUBLISHED AS PIXI-HOLGA
 */

/**
 * Notes:
 * Position can be gleaned from viewport dimensions so is unnecessary.
 * Offset, to draw to a specific place is also unnecessary, a camera is attached
 * to a container, just move the container and let the camera render into it.
 *
 * Tried to scale linearly, but, it didn’t work so well, so zooming will be
 * exponential for now which works with ^2 viewports nicely. Non ^2 viewports
 * sometimes work, depends on whether applied scaling results in the same size
 * of viewport (floats won't work for viewport currently, only ints)
 */
export class Camera {
  constructor ({
    // Container to attach to
    container = null,

    // Current viewport being rendered
    viewport = Rect.of(0, 0, 16, 16),

    // Current bounds of camera movement in world
    bounds = Rect.of(0, 0, 16, 16),

    // sprite pool to use for tiles
    pool = null,

    // Zoom settings -- disable for now as it mucks with max viewport calcs.
    // If you want to start zoomed, then setZoom after instantiation
    // zoom = 1,

    // Additional settings
    settings = {}
  } = {}) {
    this.container = container
    this.viewport = viewport
    this.bounds = bounds
    // this.zoom = zoom
    this.zoom = 1
    this.settings = {
      ...defaultSettings,
      ...settings
    }

    // Scale is applied at render to sprites, we calculate eagerly as don’t
    // really want an unnecessary power application during render loop
    this._scale = Math.pow(2, this.zoom - 1)

    // With maxViewport we're really after dimensions, this will give it to us
    // but x1, y1 will not necessarily be 0, which is probably unexpected.
    this.maxViewport = Rect.scale(this.viewport, this._scale)

    /**
     * Pool maybe should not be a part of standard Camera kit, the `renderTiles`
     * method isn’t really a Camera method, instead, it could be performed by
     * something else that leans on Camera::translateSprite to convert from
     * world to screen coords.
     * The only place this is useful here is for automatically allocating more
     * resources to the pool when the zoom level means there is more to render,
     * but that logic could be abstracted elsewhere and doesn’t necessarily fit
     * with Camera logic either.
     */
    this.pool = pool || SpritePool.of({
      length: this.maxViewport.width * this.maxViewport.height,
      container: this.container
    })
  }

  static of (params = {}) {
    return new Camera(params)
  }

  /**
   * Attaches the camera to a container. This is already done if passed
   * as a constructor argument.
   */
  attach (container) {
    this.container = container
    this.pool.attach(this.container)
  }

  /**
   * Returns the current screen bounding dimensions
   */
  getScreenBounds () {
    return Point.of(
      (this.viewport.width * this._scale) * this.settings.cellSize.x,
      (this.viewport.height * this._scale) * this.settings.cellSize.y
    )
  }

  /**
   * Resizes the viewport.
   * If the camera is zoomed then it unzooms, resizes, and rezooms. Some funkiness
   * _might_ occur.
   */
  resize (rect) {
    if (this._scale === 1) {
      this._setViewport(rect)
      this.maxViewport = Rect.of(this.viewport)
      return
    }

    console.warn('Camera::resize strange things can happen resizing whilst zoomed')

    const cached = this.zoom

    this.setZoom(1)

    this._setViewport(rect)
    this.maxViewport = Rect.scale(this.viewport, this._scale)

    this.setZoom(cached)
  }

  /**
   * Sets the viewport to a new Rect, and allocates more pool items if necessary.
   */
  _setViewport (rect) {
    this.viewport = rect
    this.checkViewportBounds()

    // Check that we have enough in the pool
    if (this.viewport.area() > this.pool.length) {
      const num = this.viewport.area() - this.pool.length
      this.pool.malloc(num)
    }

    // @TODO do the inverse to the above and free any spares

    // Reset sprites in case we are getting smaller
    this.pool.map(sprite => {
      sprite.visible = false
      return sprite
    })
  }

  /**
   *
   */
  isCulled (point) {
    return (
      point.x < this.viewport.pos[0] ||
      point.y < this.viewport.pos[1] ||
      point.x >= this.viewport.pos[2] ||
      point.y >= this.viewport.pos[3]
    )
  }

  /**
   * Set the scale based on the zoom level.
   * Zoom level is a linear range, but, it scales exponentially.
   */
  _setScale (zoom) {
    this._scale = Math.pow(2, zoom - 1)
  }

  /**
   * Zoom methods
   * @TODO due to the way culling works, zoom levels should be integers, or the
   * viewport will get in to an odd state, which should be handled by padding
   * floats and rendering with clipping (can an exterior container do an
   * overflow: hidden type of thing?). For now keep viewports ^2.
   */

  /**
   * Clamps zoom to the specified zoom range
   */
  _checkZoom () {
    const [min, max] = this.settings.zoomRange
    this.zoom = clamp(this.zoom, min, max)
  }

  /**
   * Sets the zoom level, which also sets the scale under the hood.
   * This ends up resetting the viewport also.
   */
  setZoom (zoom) {
    if (zoom === this.zoom) {
      return
    }

    this.zoom = zoom || this.zoom
    this._checkZoom()

    this._setScale(this.zoom)

    // Calculate new viewport based on new zoom level (which is exponential)
    const desired = Rect.scale(this.maxViewport, 1 / this._scale)
    const diffX = this.viewport.width - desired.width
    const diffY = this.viewport.height - desired.height
    const newView = Rect.constrict(this.viewport, diffX * 0.5, diffY * 0.5)

    this._setViewport(newView)
  }

  applyZoom (amount = 0) {
    this.setZoom(this.zoom + amount)
  }

  /**
   * Translation methods.
   * @TODO panning is currently instantaneous, add anim functions and rename
   * pan to snap and snapTo.
   */
  /**
   * @TODO This assumes the map fits in the viewport, which is not always correct,
   * we need to supply a max world boundary to clamp the camera to.
   */
  checkViewportBounds () {
    // @TODO this could all be more efficient
    if (this.viewport.pos[0] < 0) {
      this.viewport.translate(-this.viewport.pos[0], 0)
    }

    if (this.viewport.pos[1] < 0) {
      this.viewport.translate(0, -this.viewport.pos[1])
    }

    if (this.viewport.pos[2] > this.bounds.pos[2]) {
      this.viewport.translate(-(this.viewport.pos[2] - this.bounds.pos[2]), 0)
    }

    if (this.viewport.pos[3] > this.bounds.pos[3]) {
      this.viewport.translate(0, -(this.viewport.pos[3] - this.bounds.pos[3]))
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
   * Translates a single sprite from world coords to screen/camera coords.
   */
  translateSprite (sprite, x, y) {
    if (this.isCulled({ x, y })) {
      sprite.visible = false
      return
    }

    sprite.visible = true
    sprite.position.set(
      (x - this.viewport.pos[0]) * this.settings.cellSize.x * this._scale,
      (y - this.viewport.pos[1]) * this.settings.cellSize.y * this._scale
    )
    sprite.scale.set(this._scale)
  }

  /**
   * Camera just works out relative position and scale of objects.
   * For tiles it uses the pool of sprites and sets the position and scale, and
   * then passes those, with the cell from the supplied map, to the render
   * function to perform any more transforms on the sprites.
   * Not convinced this should be part of the camera API.
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
     *
     * I'm far from convinced this should be a part of camera at all. Maybe the
     * public API should *only* translate sprites it is given? Meaning that a
     * camera is really just a way to translate from world to screen coords
     * (whilst culling items from being rendered if they are not in the viewport,
     * there is no behind-object culling here)
     */

    // @TODO <optimisation> if map is smaller than viewport then only iterate
    // over the map, otherwise, iterate over the viewport. This is all about
    // iterating over the minimum amount of tiles.

    // Render the viewport
    let cell = null
    let sprite = null
    let exists = false
    let i = 0

    for (let y = this.viewport.pos[1]; y < this.viewport.pos[3]; y++) {
      for (let x = this.viewport.pos[0]; x < this.viewport.pos[2]; x++) {
        cell = (x < tiles.shape[0] && y < tiles.shape[1])
          ? tiles.get(x, y)
          : null

        // Use i and iterate
        sprite = this.pool.get(i)

        exists = !(typeof cell === 'undefined' || cell === null)

        if (exists) {
          this.translateSprite(sprite, x, y)

          renderFunc(cell, sprite)
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
}
