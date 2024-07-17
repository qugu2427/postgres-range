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

describe('Range: boolean methods', function () {
  t(parse('[1, 10)', x => parseInt(x)).containsPoint(5), true, '[1, 10).containsPoint(5) is true')
  t(parse('[1, 10)', x => parseInt(x)).containsPoint(-5), false, '[1, 10).containsPoint(-5) is false')

  t(parse('[1, 10)', x => parseInt(x)).containsRange(parse('[1, 3]', x => parseInt(x))), true, '[1, 10).containsRange(\'[1, 3]\') is true')
  t(parse('[1, 10)', x => parseInt(x)).containsRange(parse('[-1, 3]', x => parseInt(x))), false, '[1, 10).containsRange(\'[-1, 3]\') is false')

  t(parse('[1, 10)', x => parseInt(x)).equals(parse('[1, 10)', x => parseInt(x))), true, '[1, 10).equals(\'[1, 10)\') is true')
  t(parse('[1, 10]', x => parseInt(x)).equals(parse('[1, 10)', x => parseInt(x))), false, '[1, 10].equals(\'[1, 10)\') is false')

  t(parse('empty', x => parseInt(x)).strictlyLeftOf(parse('[9, 11)', x => parseInt(x))), false, 'empty.strictlyLeftOf(\'[9, 11)\') is false')
  t(parse('[5, 6)', x => parseInt(x)).strictlyLeftOf(parse('empty', x => parseInt(x))), false, '[5, 6).strictlyLeftOf(\'empty\') is false')
  t(parse('[5, 6)', x => parseInt(x)).strictlyLeftOf(parse('(, 11)', x => parseInt(x))), false, '[5,6).strictlyLeftOf(\'(, 11)\') is false')
  t(parse('[5,)', x => parseInt(x)).strictlyLeftOf(parse('[9, 11)', x => parseInt(x))), false, '[5,).strictlyLeftOf(\'[9, 11)\') is false')
  t(parse('[5, 9)', x => parseInt(x)).strictlyLeftOf(parse('[9, 11)', x => parseInt(x))), true, '[5, 9).strictlyLeftOf(\'[9, 11)\') is true')
  t(parse('[5, 9]', x => parseInt(x)).strictlyLeftOf(parse('(9, 11)', x => parseInt(x))), true, '[5, 9].strictlyLeftOf(\'[(9, 11)\') is true')
  t(parse('[5, 9]', x => parseInt(x)).strictlyLeftOf(parse('[9, 11)', x => parseInt(x))), false, '[5, 9].strictlyLeftOf(\'[9, 11)\') is false')
  t(parse('[5, 10)', x => parseInt(x)).strictlyLeftOf(parse('[9, 11)', x => parseInt(x))), false, '[5, 10).strictlyLeftOf(\'[9, 11)\') is false')
  t(parse('(-infinity,infinity)', x => parseInt(x)).strictlyLeftOf(parse('(-infinity,infinity)', x => parseInt(x))), false, '(-infinity,infinity).strictlyLeftOf(\'(-infinity,infinity)\') is false')

  t(parse('empty', x => parseInt(x)).strictlyRightOf(parse('[5, 10)', x => parseInt(x))), false, 'empty.strictlyRightOf(\'[5, 10)\') is false')
  t(parse('[5, 10)', x => parseInt(x)).strictlyRightOf(parse('empty', x => parseInt(x))), false, '[5, 10).strictlyRightOf(\'empty\') is false')
  t(parse('[20, 30)', x => parseInt(x)).strictlyRightOf(parse('(5,)', x => parseInt(x))), false, '[20, 30).strictlyRightOf(\'(5,)\') is false')
  t(parse('(,30)', x => parseInt(x)).strictlyRightOf(parse('[5, 10)', x => parseInt(x))), false, '(, 30).strictlyRightOf(\'[5, 10)\') is false')
  t(parse('[30, 40)', x => parseInt(x)).strictlyRightOf(parse('[20, 30)', x => parseInt(x))), true, '[30, 40).strictlyRightOf(\'[20, 30)\') is true')
  t(parse('(30, 40)', x => parseInt(x)).strictlyRightOf(parse('[20, 30]', x => parseInt(x))), true, '(30, 40).strictlyRightOf(\'[20, 30]\') is true')
  t(parse('[30, 40)', x => parseInt(x)).strictlyRightOf(parse('[20, 30]', x => parseInt(x))), false, '[30, 40).strictlyRightOf(\'[20, 30]\') is false')
  t(parse('[50, 60)', x => parseInt(x)).strictlyRightOf(parse('[20, 30]', x => parseInt(x))), true, '[50, 60).strictlyRightOf(\'[20, 30]\') is false')
  t(parse('(-infinity,infinity)', x => parseInt(x)).strictlyRightOf(parse('(-infinity,infinity)', x => parseInt(x))), false, '(-infinity,infinity).strictlyLeftOf(\'(-infinity,infinity)\') is false')

  t(parse('empty', x => parseInt(x)).extendsLeftOf(parse('empty', x => parseInt(x))), false, 'emtpy.extendsLeftOf(\'empty\') is false')
  t(parse('(10, 20)', x => parseInt(x)).extendsLeftOf(parse('empty', x => parseInt(x))), false, '(10, 20).extendsLeftOf(\'empty\') is false')
  t(parse('(10, 20)', x => parseInt(x)).extendsLeftOf(parse('(15, 30)', x => parseInt(x))), true, '(10, 20).extendsLeftOf(\'(15, 30)\') is true')
  t(parse('(10, 20)', x => parseInt(x)).extendsLeftOf(parse('(10, 20)', x => parseInt(x))), false, '(10, 20).extendsLeftOf(\'(10, 20)\') is false')
  t(parse('[10, 20)', x => parseInt(x)).extendsLeftOf(parse('(10, 20)', x => parseInt(x))), true, '[10, 20).extendsLeftOf(\'(10, 20)\') is true')
  t(parse('(,20)', x => parseInt(x)).extendsLeftOf(parse('(10, 20)', x => parseInt(x))), true, '(, 20).extendsLeftOf(\'(10, 20)\') is true')
  t(parse('(,20)', x => parseInt(x)).extendsLeftOf(parse('(, 20)', x => parseInt(x))), false, '(, 20).extendsLeftOf(\'(, 20)\') is false')
  t(parse('(-infinity,infinity)', x => parseInt(x)).extendsLeftOf(parse('(-infinity,infinity)', x => parseInt(x))), false, '(-infinity,infinity).extendsLeftOf(\'(-infinity,infinity)\') is false')

  t(parse('empty', x => parseInt(x)).extendsRightOf(parse('empty', x => parseInt(x))), false, 'emtpy.extendsRightOf(\'empty\') is false')
  t(parse('(10, 20)', x => parseInt(x)).extendsRightOf(parse('empty', x => parseInt(x))), false, '(10, 20).extendsRightOf(\'empty\') is false')
  t(parse('(10, 20)', x => parseInt(x)).extendsRightOf(parse('(10, 15)', x => parseInt(x))), true, '(10, 20).extendsRightOf(\'(10, 15)\') is true')
  t(parse('(10, 20)', x => parseInt(x)).extendsRightOf(parse('(10, 20)', x => parseInt(x))), false, '(10, 20).extendsRightOf(\'(10, 20)\') is false')
  t(parse('(10, 20]', x => parseInt(x)).extendsRightOf(parse('(10, 20)', x => parseInt(x))), true, '(10, 20].extendsRightOf(\'(10, 20)\') is true')
  t(parse('(20,)', x => parseInt(x)).extendsRightOf(parse('(10, 20)', x => parseInt(x))), true, '(20, ).extendsRightOf(\'(10, 20)\') is true')
  t(parse('(20,)', x => parseInt(x)).extendsRightOf(parse('(20,)', x => parseInt(x))), false, '(20,).extendsRightOf(\'(20,)\') is false')
  t(parse('(-infinity,infinity)', x => parseInt(x)).extendsRightOf(parse('(-infinity,infinity)', x => parseInt(x))), false, '(-infinity,infinity).extendsRightOf(\'(-infinity,infinity)\') is false')

  t(parse('[5, 10)', x => parseInt(x)).overlaps(parse('empty', x => parseInt(x))), false, '[5, 10).overlaps(\'emtpy\') is false')
  t(parse('empty', x => parseInt(x)).overlaps(parse('[10, 11]', x => parseInt(x))), false, 'empty.overlaps(\'[10, 11]\') is false')
  t(parse('[5, 10)', x => parseInt(x)).overlaps(parse('[10, 11]', x => parseInt(x))), false, '[5, 10).overlaps(\'[10, 11]\') is false')
  t(parse('[5, 10]', x => parseInt(x)).overlaps(parse('[10, 11]', x => parseInt(x))), true, '[5, 10].overlaps(\'[10, 11]\') is true')
  t(parse('[5, 10)', x => parseInt(x)).overlaps(parse('[8, 9]', x => parseInt(x))), true, '[5, 10).overlaps(\'[8, 9]\') is true')
  t(parse('[8, 9)', x => parseInt(x)).overlaps(parse('[5, 10]', x => parseInt(x))), true, '[8, 9).overlaps(\'[5, 10]\') is true')
  t(parse('[12, 20)', x => parseInt(x)).overlaps(parse('[10, 11]', x => parseInt(x))), false, '[12, 20).overlaps(\'[10, 11]\') is false')
  t(parse('(0, 3)', x => parseInt(x)).overlaps(parse('(3, 4)', x => parseInt(x))), false, '(0, 3).overlaps(\'(3, 4)\') is false')
  t(parse('(0,)', x => parseInt(x)).overlaps(parse('(100, 200)', x => parseInt(x))), true, '(0,).overlaps(\'(100, 200)\') is true')
  t(parse('(,100)', x => parseInt(x)).overlaps(parse('(1, 2)', x => parseInt(x))), true, '(,100).overlaps(\'(1, 2)\') is true')
  t(parse('(-infinity,infinity)', x => parseInt(x)).overlaps(parse('(-infinity,infinity)', x => parseInt(x))), true, '(-infinity,infinity).overlaps(\'(-infinity,infinity)\') is true')

  t(parse('empty', x => parseInt(x)).adjacentTo(parse('empty', x => parseInt(x))), false, 'empty.adjacentTo(\'empty\') is false')
  t(parse('(5, 10)', x => parseInt(x)).adjacentTo(parse('(10, 20)', x => parseInt(x))), false, '(5, 10).adjacentTo(\'(10, 20)\') is false')
  t(parse('(5, 10]', x => parseInt(x)).adjacentTo(parse('[10, 20)', x => parseInt(x))), false, '(5, 10].adjacentTo(\'[10, 20)\') is false')
  t(parse('(5, 10)', x => parseInt(x)).adjacentTo(parse('[10, 20)', x => parseInt(x))), true, '(5, 10).adjacentTo(\'[10, 20)\') is true')
  t(parse('(5, 9)', x => parseInt(x)).adjacentTo(parse('[10, 20)', x => parseInt(x))), false, '(5, 9).adjacentTo(\'[10, 20)\') is false')
  t(parse('(,10)', x => parseInt(x)).adjacentTo(parse('[10, 20)', x => parseInt(x))), true, '(, 10).adjacentTo(\'[10, 20)\') is true')
  t(parse('(20,)', x => parseInt(x)).adjacentTo(parse('(10, 20]', x => parseInt(x))), true, '(20,).adjacentTo(\'(10, 20]\') is true')
})

describe('Range: range methods', function () {
  t(parse('empty', x => parseInt(x)).union(parse('empty', x => parseInt(x))), new Range(null, null, RANGE_EMPTY), 'empty.union(\'empty\') is empty')
  t(parse('(0, 3)', x => parseInt(x)).union(parse('empty', x => parseInt(x))), new Range(0, 3, 0), '(0, 3).union(\'empty\') is (0, 3)')
  t(parse('empty', x => parseInt(x)).union(parse('(0, 3)', x => parseInt(x))), new Range(0, 3, 0), 'emtpy.union(\'(0, 3)\') is (0, 3)')
  t(parse('(0, 3)', x => parseInt(x)).union(parse('[3, 4)', x => parseInt(x))), new Range(0, 4, 0), '(0, 3).union(\'[3, 4)\') is (0, 4)')
  t(parse('[0, 10)', x => parseInt(x)).union(parse('[10, 20)', x => parseInt(x))), new Range(0, 20, RANGE_LB_INC), '[0, 10).union(\'[10, 20)\') is [0, 20)')
  t(parse('(0, 10)', x => parseInt(x)).union(parse('[0, 20]', x => parseInt(x))), new Range(0, 20, 0 | RANGE_LB_INC | RANGE_UB_INC), '(0, 10).union(\'[0, 20]\') is [0, 20]')
  t(parse('(,20]', x => parseInt(x)).union(parse('(0, 20]', x => parseInt(x))), new Range(null, 20, 0 | RANGE_UB_INC | RANGE_LB_INF), '(,20].union(\'(0, 20]\') is (,20]')
  t(parse('(0,)', x => parseInt(x)).union(parse('(5, 20)', x => parseInt(x))), new Range(0, null, RANGE_UB_INF), '(0,).union(\'(5, 20)\') is (0,)')
  t(parse('(-infinity,infinity)', x => parseInt(x)).union(parse('(-infinity,infinity)', x => parseInt(x))), new Range(null, null, RANGE_LB_INF | RANGE_UB_INF), '(-infinity,infinity).union(\'(-infinity,infinity)\') is (-infinity,infinity)')

  t(parse('empty', x => parseInt(x)).intersection(parse('empty', x => parseInt(x))), new Range(null, null, RANGE_EMPTY), 'empty.intersection(\'empty\') is empty')
  t(parse('(0, 3)', x => parseInt(x)).intersection(parse('empty', x => parseInt(x))), new Range(null, null, RANGE_EMPTY), '(0, 3).intersection(\'empty\') is (0, 3)')
  t(parse('empty', x => parseInt(x)).intersection(parse('(0, 3)', x => parseInt(x))), new Range(null, null, RANGE_EMPTY), 'empty.intersection(\'(0, 3)\') is empty')
  t(parse('(0,)', x => parseInt(x)).intersection(parse('(3,)', x => parseInt(x))), new Range(3, null, RANGE_UB_INF), '(0,).intersection(\'(3,)\') is (3,)')
  t(parse('(,3)', x => parseInt(x)).intersection(parse('(,6)', x => parseInt(x))), new Range(null, 3, RANGE_LB_INF), '(,3).intersection(\'(,6)\') is (,3)')
  t(parse('(0, 20]', x => parseInt(x)).intersection(parse('(10, 20]', x => parseInt(x))), new Range(10, 20, RANGE_UB_INC), '(0, 20].intersection(\'(10, 20]\') is (10, 20]')
  t(parse('(-infinity,infinity)', x => parseInt(x)).intersection(parse('(-infinity,infinity)', x => parseInt(x))), new Range(null, null, RANGE_LB_INF | RANGE_UB_INF), '(-infinity,infinity).intersection(\'(-infinity,infinity)\') is (-infinity,infinity)')

  t(parse('empty', x => parseInt(x)).difference(parse('empty', x => parseInt(x))), new Range(null, null, RANGE_EMPTY), 'empty.difference(\'empty\') is empty')
  t(parse('(0, 4)', x => parseInt(x)).difference(parse('(2, 6)', x => parseInt(x))), new Range(0, 2, RANGE_UB_INC), '(0, 4).difference(\'(2, 6)\') is (0, 2]')
  t(parse('(0, 4]', x => parseInt(x)).difference(parse('[2, 6)', x => parseInt(x))), new Range(0, 2, 0), '(0, 4).difference(\'[2, 6)\') is (0, 2)')
  t(parse('(2, 6)', x => parseInt(x)).difference(parse('(0, 4)', x => parseInt(x))), new Range(4, 6, RANGE_LB_INC), '(2, 6).difference(\'(0, 4)\') is [4, 6)')
  t(parse('(2, 6)', x => parseInt(x)).difference(parse('(0, 4]', x => parseInt(x))), new Range(4, 6, 0), '(2, 6).difference(\'(0, 4)\') is (4, 6)')
  t(parse('(0, 3)', x => parseInt(x)).difference(parse('(3, 4)', x => parseInt(x))), new Range(0, 3, 0), '(0, 3).difference(\'(3, 4)\') is (0, 3)')
  t(parse('(0,)', x => parseInt(x)).difference(parse('[3,)', x => parseInt(x))), new Range(0, 3, 0), '(0,).difference(\'(3,)\') is (0, 3)')
  t(parse('(,100)', x => parseInt(x)).difference(parse('(,50]', x => parseInt(x))), new Range(50, 100, 0), '(,100).difference(\'(,50]\') is (50, 100)')
  t(parse('(,100)', x => parseInt(x)).difference(parse('(50,)', x => parseInt(x))), new Range(null, 50, RANGE_LB_INF | RANGE_UB_INC), '(, 100).difference(\'(50, )\') is (, 50')
  t(parse('(100,)', x => parseInt(x)).difference(parse('(,150)', x => parseInt(x))), new Range(150, null, RANGE_UB_INF | RANGE_LB_INC), '(100,).difference(\'(,150)\') is [150,)')
  t(parse('(-infinity,infinity)', x => parseInt(x)).difference(parse('(-infinity,infinity)', x => parseInt(x))), new Range(null, null, RANGE_EMPTY), '(-infinity,infinity).difference(\'(-infinity,infinity)\') is empty')
})
