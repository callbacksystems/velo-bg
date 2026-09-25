const context = document.createElement("canvas").getContext("2d")

export default class Color {
  static white = new Color(255, 255, 255)
  static black = new Color(0, 0, 0)

  static parse(string) {
    context.fillStyle = string
    return new Color(...channels(context.fillStyle))
  }

  constructor(red, green, blue) {
    this.red = red
    this.green = green
    this.blue = blue
  }

  lighten(amount) {
    return this.mix(amount > 0 ? Color.white : Color.black, Math.min(Math.abs(amount), 1))
  }

  mix(other, amount) {
    return new Color(
      this.red + (other.red - this.red) * amount,
      this.green + (other.green - this.green) * amount,
      this.blue + (other.blue - this.blue) * amount
    )
  }

  get css() {
    return `rgb(${Math.round(this.red)} ${Math.round(this.green)} ${Math.round(this.blue)})`
  }
}

function channels(normalized) {
  return normalized.startsWith("#") ? hexChannels(normalized) : normalized.match(/[\d.]+/g).slice(0, 3).map(Number)
}

function hexChannels(hex) {
  return [ 1, 3, 5 ].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16))
}
