
import fill from 'ndarray-fill'
import zeros from 'zeros'
import { Sprite } from 'pixi.js'
import { Point } from './utils'

/**
 * ndarray style pool, which is more useful for tiles sprite pools
 */
export class Pool {
  constructor ({
    dim = Point.of(5, 5)
  } = {}) {
    this.pool = fill(zeros([dim.pos[0], dim.pos[1]], 'array'), (_) => {
      return new Sprite()
    })
  }

  static of (params) {
    return new Pool(params)
  }

  static attachPool (pool, container) {
    let i = pool.pool.data.length
    while (i--) {
      container.addChild(pool.pool.data[i])
    }
  }

  attach (container) {
    let i = this.pool.data.length
    while (i--) {
      container.addChild(this.pool.data[i])
    }
  }

  get (x, y) {
    if (typeof y === 'undefined') {
      if (x > this.pool.data.length) {
        throw new Error('Data out of bounds')
      }

      return this.pool.data[x]
    }

    return this.pool.get(x, y)
  }
}
