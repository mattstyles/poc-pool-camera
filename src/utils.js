
// @TODO from mathutil, with additions
export class Point {
  constructor (x, y) {
    this.pos = [x, y]
  }

  static of (x, y) {
    return new Point(x, y)
  }

  static translate (from, to = Point.of(0, 0)) {
    return Point.of(
      from.x + to.x,
      from.y + to.y
    )
  }

  position () {
    return this.pos
  }

  toCartesian () {
    return {
      x: this.pos[0],
      y: this.pos[1]
    }
  }

  get x () {
    return this.pos[0]
  }

  get y () {
    return this.pos[1]
  }

  _translateByPoint (point) {
    this.pos[0] += point.x
    this.pos[1] += point.y
    return this
  }

  translate (x, y) {
    if (x instanceof Point) {
      return this._translateByPoint(x)
    }

    this.pos[0] += x
    this.pos[1] += y
    return this
  }
}

// @TODO from mathutil, with additions
export class Rect {
  static of (x1, y1, x2, y2) {
    return new Rect(x1, y1, x2, y2)
  }

  static clone (rect) {
    return Rect.of(
      rect.pos[0],
      rect.pos[1],
      rect.pos[2],
      rect.pos[3]
    )
  }

  /**
   * Calculates the area of the given rectangle
   * @returns <Float>
   */
  static area (rect) {
    if (!rect || !(rect instanceof Rect)) {
      throw new Error('Specify rect to translate')
    }

    return rect.pos[2] - rect.pos[0] * rect.pos[3] - rect.pos[1]
  }

  /**
   * Translates the entire rectangle
   * @param x <Float>
   * @param y <Float>
   * @returns <this>
   */
  static translate (rect, x = 0, y = 0) {
    if (!rect || !(rect instanceof Rect)) {
      throw new Error('Specify rect to translate')
    }

    return new Rect(
      rect.pos[0] + x,
      rect.pos[1] + y,
      rect.pos[2] + x,
      rect.pos[3] + y
    )
  }

  static scale (rect, scalar) {
    if (!rect || !(rect instanceof Rect)) {
      throw new Error('Specify rect to translate')
    }

    return new Rect(
      rect.pos[0],
      rect.pos[1],
      rect.pos[2] * scalar,
      rect.pos[3] * scalar
    )
  }

  static constrict (rect, x, y) {
    if (!rect || !(rect instanceof Rect)) {
      throw new Error('Specify rect to translate')
    }

    return new Rect(
      rect.pos[0] + x,
      rect.pos[1] + y,
      rect.pos[2] - x,
      rect.pos[3] - y
    )
  }

  /**
   * Creates new Rect instance
   * @constructs
   */
  constructor (x1, y1, x2, y2) {
    this.pos = [x1, y1, x2, y2]
  }

  get width () {
    return this.pos[2] - this.pos[0]
  }

  get height () {
    return this.pos[3] - this.pos[1]
  }

  setWidth (w) {
    this.pos[2] = this.pos[0] + w
    return this
  }

  setHeight (h) {
    this.pos[3] = this.pos[1] + h
    return this
  }

  floor () {
    this.pos = this.pos.map(Math.floor)
    return this
  }

  ceil () {
    this.pos = this.pos.map(Math.floor)
    return this
  }

  round () {
    this.pos[0] = Math.floor(this.pos[0])
    this.pos[1] = Math.floor(this.pos[1])
    this.pos[2] = Math.ceil(this.pos[2])
    this.pos[3] = Math.ceil(this.pos[3])

    return this
  }

  /**
   * Calculates the area of the rectangle
   * @returns <Float>
   */
  area () {
    return (this.pos[2] - this.pos[0]) * (this.pos[3] - this.pos[1])
  }

  /**
   * Translates the entire rectangle
   * @param x <Float>
   * @param y <Float>
   * @returns <this>
   */
  translate (x = 0, y = 0) {
    this.pos = [
      this.pos[0] + x,
      this.pos[1] + y,
      this.pos[2] + x,
      this.pos[3] + y
    ]
    return this
  }

  scale (scalar) {
    this.pos = [
      this.pos[0],
      this.pos[1],
      this.pos[2] * scalar,
      this.pos[3] * scalar
    ]

    return this
  }

  constrict (x, y) {
    this.pos = [
      this.pos[0] + x,
      this.pos[1] + y,
      this.pos[2] - x,
      this.pos[3] - y
    ]
    return this
  }
}

export const rgbToNum = (r, g, b) => {
  return (r << 16) + (g << 8) + b
}
