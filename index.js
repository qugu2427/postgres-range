'use strict'

const RANGE_EMPTY = 1 << 1
const RANGE_LB_INC = 1 << 2
const RANGE_UB_INC = 1 << 3
const RANGE_LB_INF = (1 << 4)
const RANGE_UB_INF = (1 << 5)

const EMPTY = 'empty'
const INFINITY = 'infinity'

class RangeError extends Error {}

class Range {
  constructor (lower, upper, mask = 0) {
    this.lower = lower
    this.upper = upper
    this.mask = mask
  }

  /**
   * @param {number} flag
   */
  hasMask (flag) {
    return (this.mask & flag) === flag
  }

  isEmpty () {
    return this.hasMask(RANGE_EMPTY)
  }

  isBounded () {
    return !this.hasMask(RANGE_LB_INF) && !this.hasMask(RANGE_UB_INF)
  }

  isLowerBoundClosed () {
    return this.hasLowerBound() && this.hasMask(RANGE_LB_INC)
  }

  isUpperBoundClosed () {
    return this.hasUpperBound() && this.hasMask(RANGE_UB_INC)
  }

  hasLowerBound () {
    return !this.hasMask(RANGE_LB_INF)
  }

  hasUpperBound () {
    return !this.hasMask(RANGE_UB_INF)
  }

  containsPoint (point) {
    const l = this.hasLowerBound()
    const u = this.hasUpperBound()

    if (l && u) {
      const inLower = this.hasMask(RANGE_LB_INC)
        ? this.lower <= point
        : this.lower < point
      const inUpper = this.hasMask(RANGE_UB_INC)
        ? this.upper >= point
        : this.upper > point

      return inLower && inUpper
    } else if (l) {
      return this.hasMask(RANGE_LB_INC)
        ? this.lower <= point
        : this.lower < point
    } else if (u) {
      return this.hasMask(RANGE_UB_INC)
        ? this.upper >= point
        : this.upper > point
    }

    // INFINITY
    return true
  }

  /**
   * @param {Range} range
   */
  containsRange (range) {
    return (
      (!range.hasLowerBound() || this.containsPoint(range.lower)) &&
      (!range.hasUpperBound() || this.containsPoint(range.upper))
    )
  }

  /**
   * @param {Range} range
   */
  strictlyRightOf (range) {
    if (
      range.isEmpty()
      || this.isEmpty()
      || !range.hasUpperBound()
      || !this.hasLowerBound()
    ) {
      return false
    } else if (range.isUpperBoundClosed() && this.isLowerBoundClosed()) {
      return this.lower > range.upper 
    }
    return this.lower >= range.upper 
  }

  /**
   * @param {Range} range
   */
  strictlyLeftOf (range) {
    if (
      range.isEmpty()
      || this.isEmpty()
      || !range.hasLowerBound()
      || !this.hasUpperBound()) {
      return false
    } else if (range.isLowerBoundClosed() && this.isUpperBoundClosed()) {
      return this.upper < range.lower 
    }
    return this.upper <= range.lower 
  }

  /**
   * @param {Range} range
   */
  extendsRightOf (range) {
    return !range.isEmpty()
      && !this.isEmpty()
      && range.hasUpperBound()
      && (!this.hasUpperBound() || this.upper > range.upper || (this.upper == range.upper && this.isUpperBoundClosed()))
  }

  /**
   * @param {Range} range
   */
  extendsLeftOf (range) {
    return !range.isEmpty()
      && !this.isEmpty()
      && range.hasLowerBound()
      && (!this.hasLowerBound() || this.lower < range.lower || (this.lower == range.lower && this.isLowerBoundClosed()))
  }

  /**
   * @param {Range} range
   */
  overlaps (range) {
    return !(this.strictlyRightOf(range) || this.strictlyLeftOf(range) || this.isEmpty() || range.isEmpty())
  }

  /**
   * @param {Range} range
   */
  adjacentTo (range) {
    return (
      !(this.isEmpty() || range.isEmpty()) && (
        (this.upper === range.lower && this.isUpperBoundClosed() != range.isLowerBoundClosed()) ||
        (this.lower === range.upper && this.isLowerBoundClosed() != range.isUpperBoundClosed())
      )
    )
  }

  /**
   * @param {Range} range
   * @returns {Range}
   */
  union (range) {
    let lb = null;
    let ub = null;
    let mask = 0;

    if (this.isEmpty() && range.isEmpty()) {
      return new Range(null, null, RANGE_EMPTY);
    } else if (range.isEmpty()) {
      return new Range(this.lower, this.upper, this.mask);
    } else if (this.isEmpty()) {
      return new Range(range.lower, range.upper, range.mask);
    }

    if (!this.overlaps(range) && !range.adjacentTo(this)) {
      throw new RangeError("Cannot union non-overlapping or non-adjacent ranges");
    }

    if (this.hasMask(RANGE_LB_INF) || range.hasMask(RANGE_LB_INF)) {
      mask |= RANGE_LB_INF;
    } else if (this.lower < range.lower) {
      lb = this.lower;
      mask |= RANGE_LB_INC & this.mask;
    } else if (this.lower > range.lower) {
      lb = range.lower;
      mask |= RANGE_LB_INC & range.mask;
    } else {
      lb = this.lower;
      mask |= RANGE_LB_INC & (this.mask | range.mask);
    }

    if (this.hasMask(RANGE_UB_INF) || range.hasMask(RANGE_UB_INF)) {
      mask |= RANGE_UB_INF;
    } else if (this.upper > range.upper) {
      ub = this.upper;
      mask |= RANGE_UB_INC & this.mask;
    } else if (this.upper < range.upper) {
      ub = range.upper;
      mask |= RANGE_UB_INC & range.mask;
    } else {
      ub = this.upper;
      mask |= RANGE_UB_INC & (range.mask | this.mask);
    }

    return new Range(lb, ub, mask);
  }

  /**
   * @param {Range} range
   * @returns {Range}
   */
  intersection (range) {
    let lb = null;
    let ub = null;
    let mask = 0;

    if (!this.overlaps(range)) {
      return new Range(null, null, RANGE_EMPTY);
    }

    if (this.hasMask(RANGE_LB_INF) && range.hasMask(RANGE_LB_INF)) {
      mask |= RANGE_LB_INF;
    } else if (this.lower < range.lower) {
      lb = range.lower;
      mask |= RANGE_LB_INC & range.mask;
    } else if (this.lower > range.lower) {
      lb = this.lower;
      mask |= RANGE_LB_INC & range.mask;
    } else {
      lb = this.lower;
      mask |= RANGE_LB_INC & (range.mask & this.mask);
    }

    if (this.hasMask(RANGE_UB_INF) && range.hasMask(RANGE_UB_INF)) {
      mask |= RANGE_UB_INF
    } else if (this.upper > range.upper) {
      ub = range.upper;
      mask |= RANGE_UB_INC & range.mask;
    } else if (this.upper < range.upper) {
      ub = this.upper;
      mask |= RANGE_UB_INC & range.mask;
    } else {
      ub = this.upper;
      mask |= RANGE_UB_INC & range.mask;
    }

    return new Range(lb, ub, mask);
  }

  /**
   * @param {Range} range
   * @returns {Range}
   */
  difference (range) {
    let lb = this.lower;
    let ub = this.upper;
    let mask = 0;

    if (!this.overlaps(range) || this.isEmpty() || range.isEmpty()) {
      return new Range(lb, ub, this.mask);
    }

    if (
      range.hasLowerBound()
      && this.lower <= range.lower
      && this.upper <= range.upper
    ) {
      ub = range.lower;
      mask |= range.hasMask(RANGE_LB_INC) ? 0 : RANGE_UB_INC;
    } else if (
      range.hasUpperBound()
      && range.lower <= this.lower
      && range.upper <= this.upper) {
      lb = range.upper;
      mask |= range.hasMask(RANGE_UB_INC) ? 0 : RANGE_LB_INC;
    } else if (
      !this.hasLowerBound()
      && this.hasUpperBound()
      && !range.hasUpperBound()
      && range.hasLowerBound()
      && this.upper >= range.lower
    ) {
      ub = range.lower
      mask |= range.hasMask(RANGE_LB_INC) ? 0 : RANGE_UB_INC;
      mask |= RANGE_LB_INF
    } else if (
      this.hasLowerBound()
      && !this.hasUpperBound()
      && range.hasUpperBound()
      && !range.hasLowerBound()
      && this.lower <= range.upper
    ) {
      lb = range.upper
      mask |= range.hasMask(RANGE_UB_INC) ? 0 : RANGE_LB_INC;
      mask |= RANGE_UB_INF
    } else if (
      !this.hasLowerBound()
      && !this.hasUpperBound()
      && !range.hasUpperBound()
      && !range.hasLowerBound()
    ) {
      return new Range(null, null, RANGE_EMPTY);
    } else {
      throw new RangeError("Cannot difference to multiple disjoint ranges");
    }

    return new Range(lb, ub, mask);
  }

  toPostgres (prepareValue) {
    return serialize(this, prepareValue)
  }
}

/**
 * @param {string} input
 * @returns {Range}
 */
function parse (input, transform = x => x) {
  input = input.trim()

  if (input === EMPTY) {
    return new Range(null, null, RANGE_EMPTY)
  }

  let ptr = 0
  let mask = 0

  if (input[ptr] === '[') {
    mask |= RANGE_LB_INC
    ptr += 1
  } else if (input[ptr] === '(') {
    ptr += 1
  } else {
    throw new RangeError(
      `Unexpected character '${input[ptr]}'. Position: ${ptr}`
    )
  }

  const lb = parseBound(input, ptr)
  if (lb.infinite) {
    mask |= RANGE_LB_INF
  }
  ptr = lb.ptr

  if (input[ptr] === ',') {
    ptr += 1
  } else {
    throw new RangeError(
      `Expected comma as the delimiter, got '${input[ptr]}'. Position: ${ptr}`
    )
  }

  const ub = parseBound(input, ptr)
  if (ub.infinite) {
    mask |= RANGE_UB_INF
  }
  ptr = ub.ptr

  if (input[ptr] === ']') {
    mask |= RANGE_UB_INC
    ptr += 1
  } else if (input[ptr] === ')') {
    ptr += 1
  } else {
    throw new RangeError(
      `Unexpected character '${input[ptr]}'. Position: ${ptr}`
    )
  }

  let lower = null
  let upper = null

  if ((mask & RANGE_LB_INF) !== RANGE_LB_INF) {
    lower = transform(lb.value)
  }

  if ((mask & RANGE_UB_INF) !== RANGE_UB_INF) {
    upper = transform(ub.value)
  }

  return new Range(lower, upper, mask)
}

/**
 * @param {string} input
 * @param {number} ptr
 * @returns {{ value: string | null; infinite: boolean; ptr: number }}
 */
function parseBound (input, ptr) {
  if (input[ptr] === ',' || input[ptr] === ')' || input[ptr] === ']') {
    return {
      infinite: true,
      value: null,
      ptr
    }
  } else {
    let inQuote = false
    let value = ''
    let pos = ptr

    while (
      inQuote ||
      !(input[ptr] === ',' || input[ptr] === ')' || input[ptr] === ']')
    ) {
      const ch = input[ptr++]

      if (ch === undefined) {
        throw new RangeError(`Unexpected end of input. Position: ${ptr}`)
      }
      if (ch === '\\') {
        if (input[ptr] === undefined) {
          throw new RangeError(`Unexpected end of input. Position: ${ptr}`)
        }

        value += input.slice(pos, ptr - 1) + input[ptr]
        ptr += 1
        pos = ptr
      } else if (ch === '"') {
        if (!inQuote) {
          inQuote = true
          pos += 1
        } else if (input[ptr] === '"') {
          value += input.slice(pos, ptr - 1) + input[ptr]
          ptr += 1
          pos = ptr
        } else {
          inQuote = false
          value += input.slice(pos, ptr - 1)
          pos = ptr + 1
        }
      }
    }

    if (ptr > pos) {
      value += input.slice(pos, ptr)
    }

    if (value.endsWith(INFINITY)) {
      return {
        infinite: true,
        value: null,
        ptr
      }
    }

    return {
      infinite: false,
      value,
      ptr
    }
  }
}

/**
 * @param {Range} range
 */
function serialize (range, format = x => x) {
  if (range.hasMask(RANGE_EMPTY)) {
    return EMPTY
  }

  let s = ''

  s += range.isLowerBoundClosed() ? '[' : '('
  s += range.hasLowerBound() ? serializeBound(format(range.lower)) : ''
  s += ','
  s += range.hasUpperBound() ? serializeBound(format(range.upper)) : ''
  s += range.isUpperBoundClosed() ? ']' : ')'

  return s
}

/**
 * @param {any} bnd
 */
function serializeBound (bnd) {
  let needsQuotes = false
  let pos = 0
  let value = ''

  if (typeof bnd !== 'string') {
    if (typeof bnd === 'number' || typeof bnd === 'bigint') return bnd.toString()

    bnd = String(bnd)
  }

  if (bnd === null || bnd.length === 0) {
    return '""'
  }

  bnd = bnd.trim()

  for (let i = 0; i < bnd.length; i++) {
    const ch = bnd[i]

    if (
      ch === '"' ||
      ch === '\\' ||
      ch === '(' ||
      ch === ')' ||
      ch === '[' ||
      ch === ']' ||
      ch === ',' ||
      ch === ' '
    ) {
      needsQuotes = true
      break
    }
  }

  if (needsQuotes) {
    value += '"'
  }

  let ptr = 0
  for (; ptr < bnd.length; ptr++) {
    const ch = bnd[ptr]

    if (ch === '"' || ch === '\\') {
      value += bnd.slice(pos, ptr + 1) + ch
      pos = ptr + 1
    }
  }

  if (ptr > pos) {
    value += bnd.slice(pos, ptr)
  }

  if (needsQuotes) {
    value += '"'
  }

  return value
}

module.exports = {
  Range,
  RangeError,
  RANGE_EMPTY,
  RANGE_LB_INC,
  RANGE_UB_INC,
  RANGE_LB_INF,
  RANGE_UB_INF,

  parse,
  serialize
}
