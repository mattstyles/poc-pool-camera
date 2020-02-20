
import { Sprite } from 'pixi.js'

/**
 * NOT USED, NOW PUBLISHED AS PIXI-SPRITEPOOL
 */

/**
 * Try a generic sprite pool, with malloc and free abilities.
 * All sprites are hidden by default.
 */
export class SpritePool {
  constructor ({
    length = 10,
    container = null
  } = {}) {
    this.pool = []
    this.container = container

    // We don't need the return, this will tack the new array on to
    // this.pool and attach them if we have container, if not, then the
    // caller can use `SpritePool.attach` (as it happens, Pixi won’t
    // let us attach the same thing twice anyway).
    this.malloc(length)
  }

  static of (params) {
    return new SpritePool(params)
  }

  static attachPool (pool, container) {
    let i = pool.pool.length
    while (i--) {
      container.addChild(pool.pool[i])
    }
  }

  attach (container, pool) {
    if (!pool) {
      pool = this.pool
    }
    let i = pool.length
    while (i--) {
      container.addChild(pool[i])
    }
  }

  detach (container, pool) {
    if (!pool) {
      pool = this.pool
    }
    let i = pool.length
    while (i--) {
      container.removeChild(pool[i])
    }
  }

  get (i) {
    return this.pool[i]
  }

  get length () {
    return this.pool.length
  }

  map (cb = _ => _) {
    let i = this.pool.length
    while (i--) {
      this.pool[i] = cb(this.pool[i])
    }
  }

  // Allocates a new array and applies it to the existing pool.
  // Usually you'll want to attach this pool to a container, which will be done
  // automatically if we have a container supplied, otherwise its a good for
  // the caller (hence returning the new array).
  malloc (length) {
    const temp = Array.from({ length }, (_) => {
      const sprite = new Sprite()
      sprite.visible = false
      return sprite
    })
    this.pool = this.pool.concat(temp)
    if (this.container) {
      this.attach(this.container, temp)
    }
    return temp
  }

  /**
   * Nukes the final `length` segments from the pool, and detaches if possible
   */
  free (length) {
    const temp = this.pool.splice(this.pool.length - length, length)
    if (this.container) {
      this.detach(this.container, temp)
    }
    let i = temp.length
    while (i--) {
      temp[i].destroy()
    }
    return temp
  }
}
