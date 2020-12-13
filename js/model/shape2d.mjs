import Vector2d from '.js/model/vector2d.mjs'

export class Shape2d {
  constructor (x, y) {
    this.position = new Vector2d(x, y)
    this.accelereation = new Vector2d(0, 0)
    this.velocity = new Vector2d(0, 0)
  }
}
