import Vector from "./vector.js"

export default class Mesh {
  #width
  #height
  #cell
  #jitter
  #random

  constructor({ width, height, cell, jitter, random }) {
    this.#width = width
    this.#height = height
    this.#cell = cell
    this.#jitter = jitter
    this.#random = random
  }

  get triangles() {
    return this.#quads.flatMap(quad => this.#split(quad))
  }

  get #quads() {
    const rows = this.#vertices
    return rows.slice(0, -1).flatMap((row, rowIndex) =>
      row.slice(0, -1).map((vertex, columnIndex) =>
        [ vertex, row[columnIndex + 1], rows[rowIndex + 1][columnIndex], rows[rowIndex + 1][columnIndex + 1] ]
      )
    )
  }

  get #vertices() {
    const columns = Math.ceil(this.#width / this.#cell) + 3
    const rows = Math.ceil(this.#height / this.#cell) + 3
    return Array.from({ length: rows }, (_, row) =>
      Array.from({ length: columns }, (_, column) => this.#vertexAt(column - 1, row - 1))
    )
  }

  #vertexAt(column, row) {
    const displacement = this.#cell * this.#jitter * 0.45
    return Vector.of(
      column * this.#cell + this.#random.between(-displacement, displacement),
      row * this.#cell + this.#random.between(-displacement, displacement),
      this.#random.between(0, this.#cell * 0.6)
    )
  }

  #split([ topLeft, topRight, bottomLeft, bottomRight ]) {
    return this.#random.next() < 0.5
      ? [ new Triangle(topLeft, topRight, bottomLeft), new Triangle(topRight, bottomRight, bottomLeft) ]
      : [ new Triangle(topLeft, topRight, bottomRight), new Triangle(topLeft, bottomRight, bottomLeft) ]
  }
}

class Triangle {
  static light = Vector.of(-1, -1, 0.7).normalized
  static flatShade = Vector.of(0, 0, 1).dot(Triangle.light)

  constructor(...vertices) {
    this.vertices = vertices
  }

  get centroid() {
    return [ 0, 1 ].map(axis => average(this.vertices.map(vertex => vertex[axis])))
  }

  get shade() {
    return this.#normal.dot(Triangle.light) - Triangle.flatShade
  }

  get #normal() {
    const [ first, second ] = this.#edges
    const normal = first.cross(second)
    return (normal[2] < 0 ? normal.negated : normal).normalized
  }

  get #edges() {
    const [ origin, ...others ] = this.vertices
    return others.map(vertex => vertex.minus(origin))
  }
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
