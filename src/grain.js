const SIZE = 128

export default class Grain {
  #tile = Object.assign(document.createElement("canvas"), { width: SIZE, height: SIZE })

  constructor(random) {
    this.#tile.getContext("2d").putImageData(noise(random), 0, 0)
  }

  paint(context, opacity) {
    if (opacity) {
      context.save()
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.globalAlpha = opacity
      context.globalCompositeOperation = "overlay"
      context.fillStyle = context.createPattern(this.#tile, "repeat")
      context.fillRect(0, 0, context.canvas.width, context.canvas.height)
      context.restore()
    }
  }
}

function noise(random) {
  return new ImageData(Uint8ClampedArray.from(pixels(random)), SIZE, SIZE)
}

function pixels(random) {
  return Array.from({ length: SIZE * SIZE }, () => random.between(0, 255)).flatMap(grey => [ grey, grey, grey, 255 ])
}
