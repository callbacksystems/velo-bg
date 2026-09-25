import Gradient from "./gradient.js"
import Grain from "./grain.js"
import Mesh from "./mesh.js"
import Random from "./random.js"

const defaults = { gradient: "315deg, #e84a5f, #a51c3a", cell: 170, jitter: 0.6, depth: 0.5, grain: 0.08, seed: 1 }
const template = document.createElement("template")
template.innerHTML = `
  <style>
    :host { display: block; position: relative; overflow: hidden; isolation: isolate }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1 }
  </style>
  <canvas></canvas>
  <slot></slot>
`

export default class VeloBackgroundElement extends HTMLElement {
  static observedAttributes = Object.keys(defaults)

  #frame
  #resizeObserver = new ResizeObserver(() => this.#scheduleDraw())

  constructor() {
    super()
    this.attachShadow({ mode: "open" }).append(template.content.cloneNode(true))
  }

  connectedCallback() {
    this.#resizeObserver.observe(this)
  }

  disconnectedCallback() {
    this.#resizeObserver.disconnect()
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#scheduleDraw()
  }

  get gradient() {
    return Gradient.parse(this.getAttribute("gradient") ?? defaults.gradient)
  }

  get cell() {
    return this.#number("cell")
  }

  get jitter() {
    return this.#number("jitter")
  }

  get depth() {
    return this.#number("depth")
  }

  get grain() {
    return this.#number("grain")
  }

  get seed() {
    return this.#number("seed")
  }

  get png() {
    return new Promise(resolve => this.#canvasElement.toBlob(resolve, "image/png"))
  }

  get svg() {
    const { width, height } = this.#size
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
      + `${this.#polygons}${this.#film}</svg>`
  }

  #scheduleDraw() {
    cancelAnimationFrame(this.#frame)
    this.#frame = requestAnimationFrame(() => this.#draw())
  }

  #draw() {
    const { width, height } = this.#size
    if (width && height) this.#paint(this.#context(width, height))
  }

  get #size() {
    return { width: this.clientWidth, height: this.clientHeight }
  }

  #paint(context) {
    context.scale(devicePixelRatio, devicePixelRatio)
    for (const { triangle, color } of this.#facets) fillTriangle(context, triangle, color)
    new Grain(new Random(this.seed)).paint(context, this.grain)
  }

  get #facets() {
    const { gradient, depth } = this
    return this.#mesh.triangles.map(triangle => ({
      triangle,
      color: gradient.colorAt(triangle.centroid, this.#size).lighten(triangle.shade * depth)
    }))
  }

  get #mesh() {
    return new Mesh({ ...this.#size, cell: this.cell, jitter: this.jitter, random: new Random(this.seed) })
  }

  #context(width, height) {
    this.#canvasElement.width = width * devicePixelRatio
    this.#canvasElement.height = height * devicePixelRatio
    return this.#canvasElement.getContext("2d")
  }

  get #canvasElement() {
    return this.shadowRoot.querySelector("canvas")
  }

  #number(name) {
    return this.hasAttribute(name) ? Number(this.getAttribute(name)) : defaults[name]
  }

  get #polygons() {
    return this.#facets.map(({ triangle, color }) => polygon(triangle, color)).join("")
  }

  get #film() {
    return this.grain ? film(this.grain) : ""
  }
}

function fillTriangle(context, triangle, color) {
  context.fillStyle = color.css
  context.strokeStyle = color.css
  context.lineWidth = 0.75
  context.beginPath()
  for (const [ x, y ] of triangle.vertices) context.lineTo(x, y)
  context.closePath()
  context.fill()
  context.stroke()
}

function polygon(triangle, color) {
  return `<polygon points="${points(triangle)}" fill="${color.css}" stroke="${color.css}" stroke-width="0.75"/>`
}

function points(triangle) {
  return triangle.vertices.map(([ x, y ]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
}

function film(opacity) {
  return "<filter id=\"grain\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" stitchTiles=\"stitch\"/>"
    + "<feColorMatrix type=\"saturate\" values=\"0\"/></filter>"
    + `<rect width="100%" height="100%" filter="url(#grain)" opacity="${opacity}" style="mix-blend-mode: overlay"/>`
}
