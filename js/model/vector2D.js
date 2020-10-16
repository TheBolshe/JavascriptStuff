class Vector2d {
    constructor (x, y) {
      this.x = x
      this.y = y
    }
  
    get x () {
      return this.x
    }
  
    get y () {
      return this.y
    }
  
    magnitude () {
      return Math.sqrt(this.x * this.x + this.y * this.y)
    }
  
    add (v2) {
      this.x += v2.x
      this.y += v2.y
    }
  
    static dot (v1, v2) {
      return v1.x * v2.x + v1.y * v2.y
    }
  
    rotate (angle) {
      this.x = Math.cos(angle) * this.x - Math.sin(angle) * this.y
      this.y = Math.sin(angle) * this.x + Math.cos(angle) * this.y
    }
  }
  