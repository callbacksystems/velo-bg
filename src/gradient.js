import Color from "./color.js"

export default class Gradient {
  #direction
  #stops

  static parse(definition) {
    const [ angle, ...colors ] = withAngle(topLevelParts(unwrap(definition)))
    return new Gradient(Number(angle.slice(0, -3)), colors.map(stop))
  }

  constructor(degrees, stops) {
    this.#direction = [ Math.sin(degrees * Math.PI / 180), -Math.cos(degrees * Math.PI / 180) ]
    this.#stops = stops
  }

  colorAt(point, size) {
    return this.#colorAtOffset(this.#offsetOf(point, size))
  }

  #colorAtOffset(offset) {
    const previous = this.#stops.findLast(stop => stop.offset <= offset) ?? this.#stops[0]
    const next = this.#stops.find(stop => stop.offset >= offset) ?? this.#stops.at(-1)
    const span = next.offset - previous.offset
    return span ? previous.color.mix(next.color, (offset - previous.offset) / span) : previous.color
  }

  #offsetOf([ x, y ], { width, height }) {
    const [ directionX, directionY ] = this.#direction
    const projection = (x - width / 2) * directionX + (y - height / 2) * directionY
    return clamp(projection / (Math.abs(width * directionX) + Math.abs(height * directionY)) + 0.5)
  }
}

function withAngle(parts) {
  return parts[0].endsWith("deg") ? parts : [ "180deg", ...parts ]
}

function topLevelParts(definition) {
  return definition.split(",").reduce(mergeUnbalanced, []).map(part => part.trim())
}

function mergeUnbalanced(parts, part) {
  return isBalanced(parts.at(-1) ?? "") ? [ ...parts, part ] : [ ...parts.slice(0, -1), `${parts.at(-1)},${part}` ]
}

function isBalanced(part) {
  return part.split("(").length === part.split(")").length
}

function unwrap(definition) {
  return definition.replaceAll(/^\s*linear-gradient\(|\)\s*$/g, "")
}

function stop(part, index, parts) {
  const position = part.split(" ").at(-1)
  return position.endsWith("%")
    ? { color: Color.parse(part.slice(0, -position.length)), offset: Number(position.slice(0, -1)) / 100 }
    : { color: Color.parse(part), offset: index / Math.max(parts.length - 1, 1) }
}

function clamp(value) {
  return Math.min(Math.max(value, 0), 1)
}
