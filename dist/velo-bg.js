// src/color.js
var context = document.createElement("canvas").getContext("2d");
var Color = class _Color {
  static white = new _Color(255, 255, 255);
  static black = new _Color(0, 0, 0);
  static parse(string) {
    context.fillStyle = string;
    return new _Color(...channels(context.fillStyle));
  }
  constructor(red, green, blue) {
    this.red = red;
    this.green = green;
    this.blue = blue;
  }
  lighten(amount) {
    return this.mix(amount > 0 ? _Color.white : _Color.black, Math.min(Math.abs(amount), 1));
  }
  mix(other, amount) {
    return new _Color(
      this.red + (other.red - this.red) * amount,
      this.green + (other.green - this.green) * amount,
      this.blue + (other.blue - this.blue) * amount
    );
  }
  get css() {
    return `rgb(${Math.round(this.red)} ${Math.round(this.green)} ${Math.round(this.blue)})`;
  }
};
function channels(normalized) {
  return normalized.startsWith("#") ? hexChannels(normalized) : normalized.match(/[\d.]+/g).slice(0, 3).map(Number);
}
function hexChannels(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

// src/gradient.js
var Gradient = class _Gradient {
  #direction;
  #stops;
  static parse(definition) {
    const [angle, ...colors] = withAngle(topLevelParts(unwrap(definition)));
    return new _Gradient(Number(angle.slice(0, -3)), colors.map(stop));
  }
  constructor(degrees, stops) {
    this.#direction = [Math.sin(degrees * Math.PI / 180), -Math.cos(degrees * Math.PI / 180)];
    this.#stops = stops;
  }
  colorAt(point, size) {
    return this.#colorAtOffset(this.#offsetOf(point, size));
  }
  #colorAtOffset(offset) {
    const previous = this.#stops.findLast((stop2) => stop2.offset <= offset) ?? this.#stops[0];
    const next = this.#stops.find((stop2) => stop2.offset >= offset) ?? this.#stops.at(-1);
    const span = next.offset - previous.offset;
    return span ? previous.color.mix(next.color, (offset - previous.offset) / span) : previous.color;
  }
  #offsetOf([x, y], { width, height }) {
    const [directionX, directionY] = this.#direction;
    const projection = (x - width / 2) * directionX + (y - height / 2) * directionY;
    return clamp(projection / (Math.abs(width * directionX) + Math.abs(height * directionY)) + 0.5);
  }
};
function withAngle(parts) {
  return parts[0].endsWith("deg") ? parts : ["180deg", ...parts];
}
function topLevelParts(definition) {
  return definition.split(",").reduce(mergeUnbalanced, []).map((part) => part.trim());
}
function mergeUnbalanced(parts, part) {
  return isBalanced(parts.at(-1) ?? "") ? [...parts, part] : [...parts.slice(0, -1), `${parts.at(-1)},${part}`];
}
function isBalanced(part) {
  return part.split("(").length === part.split(")").length;
}
function unwrap(definition) {
  return definition.replaceAll(/^\s*linear-gradient\(|\)\s*$/g, "");
}
function stop(part, index, parts) {
  const position = part.split(" ").at(-1);
  return position.endsWith("%") ? { color: Color.parse(part.slice(0, -position.length)), offset: Number(position.slice(0, -1)) / 100 } : { color: Color.parse(part), offset: index / Math.max(parts.length - 1, 1) };
}
function clamp(value) {
  return Math.min(Math.max(value, 0), 1);
}

// src/grain.js
var SIZE = 128;
var Grain = class {
  #tile = Object.assign(document.createElement("canvas"), { width: SIZE, height: SIZE });
  constructor(random) {
    this.#tile.getContext("2d").putImageData(noise(random), 0, 0);
  }
  paint(context2, opacity) {
    if (opacity) {
      context2.save();
      context2.setTransform(1, 0, 0, 1, 0, 0);
      context2.globalAlpha = opacity;
      context2.globalCompositeOperation = "overlay";
      context2.fillStyle = context2.createPattern(this.#tile, "repeat");
      context2.fillRect(0, 0, context2.canvas.width, context2.canvas.height);
      context2.restore();
    }
  }
};
function noise(random) {
  return new ImageData(Uint8ClampedArray.from(pixels(random)), SIZE, SIZE);
}
function pixels(random) {
  return Array.from({ length: SIZE * SIZE }, () => random.between(0, 255)).flatMap((grey) => [grey, grey, grey, 255]);
}

// src/vector.js
var Vector = class _Vector extends Array {
  dot(other) {
    return this.reduce((sum, component, index) => sum + component * other[index], 0);
  }
  cross([x, y, z]) {
    return _Vector.of(this[1] * z - this[2] * y, this[2] * x - this[0] * z, this[0] * y - this[1] * x);
  }
  minus(other) {
    return this.map((component, index) => component - other[index]);
  }
  get normalized() {
    const { magnitude } = this;
    return this.map((component) => component / magnitude);
  }
  get magnitude() {
    return Math.hypot(...this);
  }
  get negated() {
    return this.map((component) => -component);
  }
};

// src/mesh.js
var Mesh = class {
  #width;
  #height;
  #cell;
  #jitter;
  #random;
  constructor({ width, height, cell, jitter, random }) {
    this.#width = width;
    this.#height = height;
    this.#cell = cell;
    this.#jitter = jitter;
    this.#random = random;
  }
  get triangles() {
    return this.#quads.flatMap((quad) => this.#split(quad));
  }
  get #quads() {
    const rows = this.#vertices;
    return rows.slice(0, -1).flatMap(
      (row, rowIndex) => row.slice(0, -1).map(
        (vertex, columnIndex) => [vertex, row[columnIndex + 1], rows[rowIndex + 1][columnIndex], rows[rowIndex + 1][columnIndex + 1]]
      )
    );
  }
  get #vertices() {
    const columns = Math.ceil(this.#width / this.#cell) + 3;
    const rows = Math.ceil(this.#height / this.#cell) + 3;
    return Array.from(
      { length: rows },
      (_, row) => Array.from({ length: columns }, (_2, column) => this.#vertexAt(column - 1, row - 1))
    );
  }
  #vertexAt(column, row) {
    const displacement = this.#cell * this.#jitter * 0.45;
    return Vector.of(
      column * this.#cell + this.#random.between(-displacement, displacement),
      row * this.#cell + this.#random.between(-displacement, displacement),
      this.#random.between(0, this.#cell * 0.6)
    );
  }
  #split([topLeft, topRight, bottomLeft, bottomRight]) {
    return this.#random.next() < 0.5 ? [new Triangle(topLeft, topRight, bottomLeft), new Triangle(topRight, bottomRight, bottomLeft)] : [new Triangle(topLeft, topRight, bottomRight), new Triangle(topLeft, bottomRight, bottomLeft)];
  }
};
var Triangle = class _Triangle {
  static light = Vector.of(-1, -1, 0.7).normalized;
  static flatShade = Vector.of(0, 0, 1).dot(_Triangle.light);
  constructor(...vertices) {
    this.vertices = vertices;
  }
  get centroid() {
    return [0, 1].map((axis) => average(this.vertices.map((vertex) => vertex[axis])));
  }
  get shade() {
    return this.#normal.dot(_Triangle.light) - _Triangle.flatShade;
  }
  get #normal() {
    const [first, second] = this.#edges;
    const normal = first.cross(second);
    return (normal[2] < 0 ? normal.negated : normal).normalized;
  }
  get #edges() {
    const [origin, ...others] = this.vertices;
    return others.map((vertex) => vertex.minus(origin));
  }
};
function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// src/random.js
var Random = class {
  #state;
  constructor(seed) {
    this.#state = seed >>> 0;
  }
  between(min, max) {
    return min + this.next() * (max - min);
  }
  next() {
    this.#state = this.#state + 1831565813 >>> 0;
    let value = Math.imul(this.#state ^ this.#state >>> 15, this.#state | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }
};

// src/velo_background_element.js
var defaults = { gradient: "315deg, #e84a5f, #a51c3a", cell: 170, jitter: 0.6, depth: 0.5, grain: 0.08, seed: 1 };
var template = document.createElement("template");
template.innerHTML = `
  <style>
    :host { display: block; position: relative; overflow: hidden; isolation: isolate }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1 }
  </style>
  <canvas></canvas>
  <slot></slot>
`;
var VeloBackgroundElement = class extends HTMLElement {
  static observedAttributes = Object.keys(defaults);
  #frame;
  #resizeObserver = new ResizeObserver(() => this.#scheduleDraw());
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).append(template.content.cloneNode(true));
  }
  connectedCallback() {
    this.#resizeObserver.observe(this);
  }
  disconnectedCallback() {
    this.#resizeObserver.disconnect();
  }
  attributeChangedCallback() {
    if (this.isConnected) this.#scheduleDraw();
  }
  get gradient() {
    return Gradient.parse(this.getAttribute("gradient") ?? defaults.gradient);
  }
  get cell() {
    return this.#number("cell");
  }
  get jitter() {
    return this.#number("jitter");
  }
  get depth() {
    return this.#number("depth");
  }
  get grain() {
    return this.#number("grain");
  }
  get seed() {
    return this.#number("seed");
  }
  get png() {
    return new Promise((resolve) => this.#canvasElement.toBlob(resolve, "image/png"));
  }
  get svg() {
    const { width, height } = this.#size;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${this.#polygons}${this.#film}</svg>`;
  }
  #scheduleDraw() {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#draw());
  }
  #draw() {
    const { width, height } = this.#size;
    if (width && height) this.#paint(this.#context(width, height));
  }
  get #size() {
    return { width: this.clientWidth, height: this.clientHeight };
  }
  #paint(context2) {
    context2.scale(devicePixelRatio, devicePixelRatio);
    for (const { triangle, color } of this.#facets) fillTriangle(context2, triangle, color);
    new Grain(new Random(this.seed)).paint(context2, this.grain);
  }
  get #facets() {
    const { gradient, depth } = this;
    return this.#mesh.triangles.map((triangle) => ({
      triangle,
      color: gradient.colorAt(triangle.centroid, this.#size).lighten(triangle.shade * depth)
    }));
  }
  get #mesh() {
    return new Mesh({ ...this.#size, cell: this.cell, jitter: this.jitter, random: new Random(this.seed) });
  }
  #context(width, height) {
    this.#canvasElement.width = width * devicePixelRatio;
    this.#canvasElement.height = height * devicePixelRatio;
    return this.#canvasElement.getContext("2d");
  }
  get #canvasElement() {
    return this.shadowRoot.querySelector("canvas");
  }
  #number(name) {
    return this.hasAttribute(name) ? Number(this.getAttribute(name)) : defaults[name];
  }
  get #polygons() {
    return this.#facets.map(({ triangle, color }) => polygon(triangle, color)).join("");
  }
  get #film() {
    return this.grain ? film(this.grain) : "";
  }
};
function fillTriangle(context2, triangle, color) {
  context2.fillStyle = color.css;
  context2.strokeStyle = color.css;
  context2.lineWidth = 0.75;
  context2.beginPath();
  for (const [x, y] of triangle.vertices) context2.lineTo(x, y);
  context2.closePath();
  context2.fill();
  context2.stroke();
}
function polygon(triangle, color) {
  return `<polygon points="${points(triangle)}" fill="${color.css}" stroke="${color.css}" stroke-width="0.75"/>`;
}
function points(triangle) {
  return triangle.vertices.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}
function film(opacity) {
  return `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#grain)" opacity="${opacity}" style="mix-blend-mode: overlay"/>`;
}

// index.js
customElements.define("velo-bg", VeloBackgroundElement);
