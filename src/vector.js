export default class Vector extends Array {
  dot(other) {
    return this.reduce((sum, component, index) => sum + component * other[index], 0)
  }

  cross([ x, y, z ]) {
    return Vector.of(this[1] * z - this[2] * y, this[2] * x - this[0] * z, this[0] * y - this[1] * x)
  }

  minus(other) {
    return this.map((component, index) => component - other[index])
  }

  get normalized() {
    const { magnitude } = this
    return this.map(component => component / magnitude)
  }

  get magnitude() {
    return Math.hypot(...this)
  }

  get negated() {
    return this.map(component => -component)
  }
}
