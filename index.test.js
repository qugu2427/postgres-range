'use strict'

import { test, expect, describe } from 'vitest'

const {
  Range,
  RANGE_EMPTY,
  RANGE_LB_INC,
  RANGE_UB_INC,
  RANGE_LB_INF,
  RANGE_UB_INF,

  parse,
  serialize
} = require('./index')

const t = (left, right, message) => test(message, () => expect(left).toStrictEqual(right))

describe('parse', function () {
  const string = parse

  t(string('empty'), new Range(null, null, RANGE_EMPTY), 'empty')

  t(string('(,)'), new Range(null, null, RANGE_LB_INF | RANGE_UB_INF), '(,)')
  t(string('(-infinity,infinity)'), new Range(null, null, RANGE_LB_INF | RANGE_UB_INF), '(-infinity,infinity)')

  t(string('(0,)'), new Range('0', null, RANGE_UB_INF), '(0,)')
  t(string('(0,10)'), new Range('0', '10', 0), '(0,10)')
  t(string('(,10)'), new Range(null, '10', RANGE_LB_INF), '(,10)')

  t(string('(0,1]'), new Range('0', '1', RANGE_UB_INC), '(0,1]')
  t(string('[0,1]'), new Range('0', '1', RANGE_LB_INC | RANGE_UB_INC), '[0,1]')
  t(string('[0,1)'), new Range('0', '1', RANGE_LB_INC), '[0,1)')
})

describe('parse: integer', function () {
  const integer = value => parse(value, x => parseInt(x, 10))

  t(integer('empty'), new Range(null, null, RANGE_EMPTY), 'empty')

  t(integer('(,)'), new Range(null, null, RANGE_LB_INF | RANGE_UB_INF), '(,)')

  t(integer('(0,)'), new Range(0, null, RANGE_UB_INF), '(0,)')
  t(integer('(0,10)'), new Range(0, 10, 0), '(0,10)')
  t(integer('(,10)'), new Range(null, 10, RANGE_LB_INF), '(,10)')

  t(integer('(0,1]'), new Range(0, 1, RANGE_UB_INC), '(0,1]')
  t(integer('[0,1]'), new Range(0, 1, RANGE_LB_INC | RANGE_UB_INC), '[0,1]')
  t(integer('[0,1)'), new Range(0, 1, RANGE_LB_INC), '[0,1)')
})

describe('parse: strings', function () {
  const check = (a, b) => t(parse(a), b, a)

  check('(,"")', new Range(null, '', RANGE_LB_INF))
  check('("",)', new Range('', null, RANGE_UB_INF))
  check('(A,Z)', new Range('A', 'Z', 0))
  check('("A","Z")', new Range('A', 'Z', 0))
  check('("""A""","""Z""")', new Range('"A"', '"Z"', 0))
  check('("\\"A\\"","\\"Z\\"")', new Range('"A"', '"Z"', 0))
  check('("\\(A\\)","\\(Z\\)")', new Range('(A)', '(Z)', 0))
  check('("\\[A\\]","\\[Z\\]")', new Range('[A]', '[Z]', 0))
})

describe('serialize: strings', function () {
  const check = (a, b) => t(a, serialize(b), a)

  check('(,"")', new Range(null, '', RANGE_LB_INF))
  check('("",)', new Range('', null, RANGE_UB_INF))
  check('("""A""","""Z""")', new Range('"A"', '"Z"', 0))
  check('("\\\\A\\\\","\\\\Z\\\\")', new Range('\\A\\', '\\Z\\', 0))
  check('("(A)","(Z)")', new Range('(A)', '(Z)', 0))
  check('("[A]","[Z]")', new Range('[A]', '[Z]', 0))
})

describe('serialize: numbers', function () {
  const check = (a, b) => t(a, serialize(b), a)

  check('(,0)', new Range(null, 0, RANGE_LB_INF))
  check('(0,)', new Range(0, null, RANGE_UB_INF))
  check('(1.1,9.9)', new Range(1.1, 9.9, 0))
})

describe('roundtrip', function () {
  const trip = raw => t(serialize(parse(raw)), raw, raw)

  trip('empty')
  trip('(0,)')
  trip('(0,10)')
  trip('(,10)')
  trip('(0,1]')
  trip('[0,1]')
  trip('[0,1)')
})

describe('Range', function () {
  t(parse('[1, 10)', x => parseInt(x)).containsPoint(5), true, '[1, 10).containsPoint(5) is true')
  t(parse('[1, 10)', x => parseInt(x)).containsPoint(-5), false, '[1, 10).containsPoint(-5) is false')

  t(parse('[1, 10)', x => parseInt(x)).containsRange(parse('[1, 3]', x => parseInt(x))), true, '[1, 10).containsRange(\'[1, 3]\') is true')
  t(parse('[1, 10)', x => parseInt(x)).containsRange(parse('[-1, 3]', x => parseInt(x))), false, '[1, 10).containsRange(\'[-1, 3]\') is false')

  t(parse('empty', x => parseInt(x)).strictlyLeftOf(parse('[9, 11)', x => parseInt(x))), false, 'empty.strictlyLeftOf(\'[9, 11)\') is false')
  t(parse('[5, 6)', x => parseInt(x)).strictlyLeftOf(parse('empty', x => parseInt(x))), false, '[5, 6).strictlyLeftOf(\'empty\') is false')
  t(parse('[5, 6)', x => parseInt(x)).strictlyLeftOf(parse('(, 11)', x => parseInt(x))), false, '[5,6).strictlyLeftOf(\'(, 11)\') is false')
  t(parse('[5,)', x => parseInt(x)).strictlyLeftOf(parse('[9, 11)', x => parseInt(x))), false, '[5,).strictlyLeftOf(\'[9, 11)\') is false')
  t(parse('[5, 9)', x => parseInt(x)).strictlyLeftOf(parse('[9, 11)', x => parseInt(x))), true, '[5, 9).strictlyLeftOf(\'[9, 11)\') is true')
  t(parse('[5, 9]', x => parseInt(x)).strictlyLeftOf(parse('(9, 11)', x => parseInt(x))), true, '[5, 9].strictlyLeftOf(\'[(9, 11)\') is true')
  t(parse('[5, 9]', x => parseInt(x)).strictlyLeftOf(parse('[9, 11)', x => parseInt(x))), false, '[5, 9].strictlyLeftOf(\'[9, 11)\') is false')
  t(parse('[5, 10)', x => parseInt(x)).strictlyLeftOf(parse('[9, 11)', x => parseInt(x))), false, '[5, 10).strictlyLeftOf(\'[9, 11)\') is false')

  t(parse('empty', x => parseInt(x)).strictlyRightOf(parse('[5, 10)', x => parseInt(x))), false, 'empty.strictlyRightOf(\'[5, 10)\') is false')
  t(parse('[5, 10)', x => parseInt(x)).strictlyRightOf(parse('empty', x => parseInt(x))), false, '[5, 10).strictlyRightOf(\'empty\') is false')
  t(parse('[20, 30)', x => parseInt(x)).strictlyRightOf(parse('(5,)', x => parseInt(x))), false, '[20, 30).strictlyLeftOf(\'(5,)\') is false')
  t(parse('(,30)', x => parseInt(x)).strictlyRightOf(parse('[5, 10)', x => parseInt(x))), false, '(, 30).strictlyLeftOf(\'[5, 10)\') is false')
  t(parse('[30, 40)', x => parseInt(x)).strictlyRightOf(parse('[20, 30)', x => parseInt(x))), true, '[30, 40).strictlyRightOf(\'[20, 30)\') is true')
  t(parse('(30, 40)', x => parseInt(x)).strictlyRightOf(parse('[20, 30]', x => parseInt(x))), true, '(30, 40).strictlyRightOf(\'[20, 30]\') is true')
  t(parse('[30, 40)', x => parseInt(x)).strictlyRightOf(parse('[20, 30]', x => parseInt(x))), false, '[30, 40).strictlyRightOf(\'[20, 30]\') is false')
  t(parse('[50, 60)', x => parseInt(x)).strictlyRightOf(parse('[20, 30]', x => parseInt(x))), true, '[50, 60).strictlyRightOf(\'[20, 30]\') is false')

  t(parse('[5, 10)', x => parseInt(x)).overlaps(parse('[10, 11]', x => parseInt(x))), false, '[5, 10).overlaps(\'[10, 11]\') is false')
  t(parse('[5, 10]', x => parseInt(x)).overlaps(parse('[10, 11]', x => parseInt(x))), true, '[5, 10].overlaps(\'[10, 11]\') is true')
  t(parse('[5, 10)', x => parseInt(x)).overlaps(parse('[8, 9]', x => parseInt(x))), true, '[5, 10).overlaps(\'[8, 9]\') is true')
  t(parse('[8, 9)', x => parseInt(x)).overlaps(parse('[5, 10]', x => parseInt(x))), true, '[8, 9).overlaps(\'[5, 10]\') is true')
  t(parse('[12, 20)', x => parseInt(x)).overlaps(parse('[10, 11]', x => parseInt(x))), false, '[12, 20).overlaps(\'[10, 11]\') is false')

  t(parse('(5, 10)', x => parseInt(x)).adjacentTo(parse('(10, 20)', x => parseInt(x))), true, '(5, 10).adjacentTo(\'(10, 20]\') is true')
  t(parse('(5, 10]', x => parseInt(x)).adjacentTo(parse('[10, 20)', x => parseInt(x))), false, '(5, 10].adjacentTo(\'[10, 20]\') is false')
  t(parse('(5, 5)', x => parseInt(x)).adjacentTo(parse('[10, 20)', x => parseInt(x))), false, '(5, 5].adjacentTo(\'[10, 20]\') is false')
})
