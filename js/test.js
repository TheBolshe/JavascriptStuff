// canvas variables
var canvas = document.getElementById('game')
var ctx = canvas.getContext('2d')
var size = canvas.height
var margin = (size * 15) / 100
// init timestamp
var lastRender = 0

// to know wich keys are pressed
var state = {
  score: 0,
  pressedKeys: {
    left: false,
    right: false,
    up: false,
    down: false
  }
}

// keycodes to strings
var keyMap = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down'
}

// pressed keys event handlers
function keyDown (event) {
  var key = keyMap[event.keyCode]
  state.pressedKeys[key] = true
}
function keyUp (event) {
  var key = keyMap[event.keyCode]
  state.pressedKeys[key] = false
}

window.addEventListener('keydown', keyDown, false)
window.addEventListener('keyup', keyUp, false)

// Ennemy class
class Ennemy {
  constructor () {
    // the ennemy position is chosen randomly inside the margins
    var x = 0
    var y = 0
    while (Ennemy.isOutsideMargin(x, y)) {
      x = Math.random() * (size + 1)
      y = Math.random() * (size + 1)
    }
    this.x = x
    this.y = y
    this.size = Math.floor(
      Math.random() * ((size * 8) / 100) + (size * 3) / 100
    )
    this.halfsize = this.size / 2
    this.preparing = true
    this.speed = (size * 80) / 100
    this.time = 3000
    this.target = {
      x: player.x,
      y: player.y
    }
    this.push = {
      x: 0,
      y: 0
    }
  }

  // checks if some coordinates are ouside the margin
  static isOutsideMargin (x, y) {
    var a = (margin * 30) / 100
    return (
      // spawn zone interior
      (x > margin - a &&
        y > margin - a &&
        x < size - margin + a &&
        y < size - margin + a) ||
      // spawn zone exterior
      x < a ||
      y < a ||
      x > size - a ||
      y > size - a
    )
  }

  // aims the ennemy towards the player
  updateDirection () {
    var diffX = this.x - player.x
    var diffY = this.y - player.y
    var norm = Math.sqrt(diffX * diffX + diffY * diffY)
    this.target.x = diffX / norm
    this.target.y = diffY / norm
  }

  getPoints () {
    var angle = Math.atan2(this.target.y, this.target.x)
    var tl = 0 - this.halfsize
    var rb = 0 + this.halfsize
    var p1 = {
      x: Math.cos(angle) * tl - Math.sin(angle) * tl + this.x,
      y: Math.sin(angle) * tl + Math.cos(angle) * tl + this.y
    }
    var p2 = {
      x: Math.cos(angle) * rb - Math.sin(angle) * tl + this.x,
      y: Math.sin(angle) * rb + Math.cos(angle) * tl + this.y
    }
    var p3 = {
      x: Math.cos(angle) * rb - Math.sin(angle) * rb + this.x,
      y: Math.sin(angle) * rb + Math.cos(angle) * rb + this.y
    }
    var p4 = {
      x: Math.cos(angle) * tl - Math.sin(angle) * rb + this.x,
      y: Math.sin(angle) * tl + Math.cos(angle) * rb + this.y
    }
    return [p1, p2, p3, p4]
  }

  getShapeAxes () {
    var points = this.getPoints()
    var axes = []
    for (let index = 0, length = points.length; index < length; index++) {
      const nextIndex = index < points.length - 1 ? index + 1 : 0
      const dx = points[index].x - points[nextIndex].x
      const dy = points[index].y - points[nextIndex].y
      const axis = { x: dy, y: -dx, side: index + 1, origin: 'ennemy' }
      const norm = Math.sqrt(axis.x * axis.x + axis.y * axis.y)
      axis.x /= norm
      axis.y /= norm
      if (axis.side < 3) axes.push(axis)
    }
    return axes
  }

  isNotColliding () {
    var testAxes = [...player.getShapeAxes(), ...this.getShapeAxes()]
    var playerVertices = player.getPoints()
    var ennemyVertices = this.getPoints()
    var overlap = Number.MAX_SAFE_INTEGER
    // for each test axis
    for (var axis of testAxes) {
      const x = this.x - player.x
      const y = this.y - player.y
      const axisDirection = x * axis.x + y * axis.y
      if (axisDirection > 0) {
        axis.x *= -1
        axis.y *= -1
      }
      let playerMin = Number.MAX_SAFE_INTEGER
      let playerMax = Number.MIN_SAFE_INTEGER
      let ennemyMin = Number.MAX_SAFE_INTEGER
      let ennemyMax = Number.MIN_SAFE_INTEGER
      // projet player shape onto the axis
      for (const vertex of playerVertices) {
        const dot = vertex.x * axis.x + vertex.y * axis.y
        if (dot < playerMin) playerMin = dot
        if (dot > playerMax) playerMax = dot
      }
      // project ennemy shape onto the axis
      for (const vertex of ennemyVertices) {
        const dot = axis.x * vertex.x + axis.y * vertex.y
        if (dot < ennemyMin) ennemyMin = dot
        if (dot > ennemyMax) ennemyMax = dot
      }
      // test if it's the shortest overlap
      var strength = Math.abs(
        Math.min(playerMax, ennemyMax) - Math.max(playerMin, ennemyMin)
      )
      if (strength < overlap) {
        overlap = strength
        // sets the direction to push the player
        this.push = axis
        this.push.x *= overlap
        this.push.y *= overlap
      }
      // test if shapes are not overlapping on this axis
      if (
        !(
          (ennemyMin < playerMax && ennemyMax > playerMin) ||
          (ennemyMin < playerMax && ennemyMax > playerMin)
        )
      ) {
        this.push = {}
        return true
      }
    }
    return false
  }
}

// Player class
class Player {
  constructor () {
    this.x = size / 2
    this.y = size / 2
    this.size = size / 15
    this.halfsize = this.size / 2
    this.speed = (size * 60) / 100
    this.direction = {
      x: 0,
      y: 0
    }
  }

  normDirection () {
    var norm = Math.sqrt(
      this.direction.x * this.direction.x + this.direction.y * this.direction.y
    )
    if (norm > 0) this.direction.x /= norm
    if (norm > 0) this.direction.y /= norm
  }

  getPoints () {
    var angle = Math.atan2(this.direction.y, this.direction.x)
    var tl = 0 - this.halfsize
    var rb = 0 + this.halfsize
    var p1 = {
      x: Math.cos(angle) * tl - Math.sin(angle) * tl + this.x,
      y: Math.sin(angle) * tl + Math.cos(angle) * tl + this.y
    }
    var p2 = {
      x: Math.cos(angle) * rb - Math.sin(angle) * tl + this.x,
      y: Math.sin(angle) * rb + Math.cos(angle) * tl + this.y
    }
    var p3 = {
      x: Math.cos(angle) * rb - Math.sin(angle) * rb + this.x,
      y: Math.sin(angle) * rb + Math.cos(angle) * rb + this.y
    }
    var p4 = {
      x: Math.cos(angle) * tl - Math.sin(angle) * rb + this.x,
      y: Math.sin(angle) * tl + Math.cos(angle) * rb + this.y
    }
    return [p1, p2, p3, p4]
  }

  getShapeAxes () {
    var points = this.getPoints()
    var axes = []
    for (let index = 0, length = points.length; index < length; index++) {
      const nextIndex = index < points.length - 1 ? index + 1 : 0
      const dx = points[index].x - points[nextIndex].x
      const dy = points[index].y - points[nextIndex].y
      const axis = { x: dy, y: -dx, side: index + 1, origin: 'player' }
      const norm = Math.sqrt(axis.x * axis.x + axis.y * axis.y)
      axis.x /= norm
      axis.y /= norm
      if (axis.side < 3) axes.push(axis)
    }
    return axes
  }
}

function updatePlayer (progress) {
  // compute the displacement based on the object speed
  var move = (player.speed / 1000) * progress
  // update player position
  player.direction.y = 0
  player.direction.x = 0
  if (state.pressedKeys.up) player.direction.y = -1
  if (state.pressedKeys.down) player.direction.y = 1
  if (state.pressedKeys.left) player.direction.x = -1
  if (state.pressedKeys.right) player.direction.x = 1
  player.normDirection()
  player.y += player.direction.y * move
  player.x += player.direction.x * move
  // prevent the player from going outside the area
  if (
    player.x < margin ||
    player.x > size - margin ||
    player.y < margin ||
    player.y > size - margin
  ) {
    player = {}
  }
}

function updateEnnemies (progress) {
  // for each existing ennemy
  for (var ennemy of ennemies) {
    // if the ennemy is preparing to attack
    if (ennemy.preparing) {
      // substract elapsed time from the ennemy time total
      ennemy.time -= progress
      // aim at the player
      ennemy.updateDirection()
      // if there is no time left
      if (ennemy.time < 0) {
        // set the ennemy to attacking
        ennemy.preparing = false
        // compute the direction the ennemy is aiming and normalise it
        ennemy.updateDirection()
      }
      // if the ennemy is attacking
    } else {
      // move the ennemy into the aimed direction
      var move = (ennemy.speed / 1000) * progress
      ennemy.x -= ennemy.target.x * move
      ennemy.y -= ennemy.target.y * move
      var outside = size * 0.1
      if (
        ennemy.x < -outside ||
        ennemy.y < -outside ||
        ennemy.x > size + outside ||
        ennemy.y > size + outside
      ) {
        var ennmyToDelete = ennemy
        ennemies = ennemies.filter(ennemy => ennemy !== ennmyToDelete)
        state.score += 1
      }
      var vPlayerx = ennemy.x - player.x
      var vPlayery = ennemy.y - player.y
      var distToPlayer = Math.sqrt(vPlayerx * vPlayerx + vPlayery * vPlayery)
      if (distToPlayer < (size / 100) * 10) {
        if (!ennemy.isNotColliding()) {
          player.x += ennemy.push.x * 1.05
          player.y += ennemy.push.y * 1.05
        }
      }
    }
  }
}

function update (progress) {
  updatePlayer(progress)

  updateEnnemies(progress)
  // spawn a new ennemy
  if (Math.random() < 0.03) ennemies.push(new Ennemy())
}

function drawPlayer () {
  ctx.fillStyle = 'green'
  ctx.save()
  ctx.translate(player.x, player.y)
  ctx.rotate(Math.atan2(player.direction.y, player.direction.x))
  ctx.fillRect(
    0 - player.halfsize,
    0 - player.halfsize,
    player.size,
    player.size
  )
  ctx.restore()
}

function drawEnnemy (ennemy) {
  ctx.fillStyle = 'blue'
  ctx.save()
  ctx.translate(ennemy.x, ennemy.y)
  ctx.rotate(Math.atan2(ennemy.target.y, ennemy.target.x))
  ctx.fillRect(
    0 - ennemy.halfsize,
    0 - ennemy.halfsize,
    ennemy.size,
    ennemy.size
  )
  ctx.restore()
}

function draw () {
  // wipe the canvas for redraw
  ctx.clearRect(0, 0, size, size)
  // draw background
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = 'white'
  ctx.fillRect(margin, margin, size - margin * 2, size - margin * 2)
  // draw each ennemy then the player
  for (const ennemy of ennemies) drawEnnemy(ennemy)
  drawPlayer()
  ctx.fillStyle = 'white'
  ctx.font = '70px Arial'
  ctx.fillText(state.score, 470, 70)
}

function loop (timeStamp) {
  var progress = timeStamp - lastRender

  update(progress)
  draw()

  lastRender = timeStamp
  if (player !== {}) window.requestAnimationFrame(loop)
}

var player = new Player()
var ennemies = []

/*
ennemies.push(new Ennemy())
ennemies[0].x = 200
ennemies[0].y = 400
ennemies[0].preparing = false
*/

window.requestAnimationFrame(loop)
