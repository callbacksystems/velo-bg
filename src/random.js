export default class Random {
  #state

  constructor(seed) {
    this.#state = seed >>> 0
  }

  between(min, max) {
    return min + this.next() * (max - min)
  }

  next() {
    this.#state = (this.#state + 0x6D2B79F5) >>> 0
    let value = Math.imul(this.#state ^ (this.#state >>> 15), this.#state | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
