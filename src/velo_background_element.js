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
    const { gradient, depth } = this
    context.scale(devicePixelRatio, devicePixelRatio)
    for (const triangle of this.#mesh.triangles) {
      fillTriangle(context, triangle, gradient.colorAt(triangle.centroid, this.#size).lighten(triangle.shade * depth))
    }
    new Grain(new Random(this.seed)).paint(context, this.grain)
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
