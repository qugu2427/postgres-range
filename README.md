# postgres-range [![tests](https://github.com/martianboy/postgres-range/workflows/tests/badge.svg)](https://github.com/martianboy/postgres-range/actions?query=workflow%3Atests)

> Parse postgres range columns


## Install

```
npm install --save postgres-range
```


## Usage

```js
const range = require('postgres-range')

const rng = range.parse('[0,5)', (value) => parseInt(value, 10))
rng.isBounded()
// => true
rng.isLowerBoundClosed()
// => true
rng.isUpperBoundClosed()
// => false
rng.hasLowerBound()
// => true
rng.hasUpperBound()
// => true

rng.containsPoint(4)
// => true
rng.containsRange(range.parse('[1,2]', x => parseInt(x)))
// => true
rng.strictlyLeftOf(range.parse('[6,7]', x => parseInt(x)))
// => true
rng.strictlyRightOf(range.parse('[-10,-1]', x => parseInt(x)))
// => true
rng.overlaps(range.parse('[4,7]', x => parseInt(x)))
// => true
rng.adjacentTo(range.parse('(5,6]', x => parseInt(x)))
// => true

range.parse('empty').isEmpty()
// => true

range.serialize(new range.Range(0, 5))
// => '(0,5)'
range.serialize(new range.Range(0, 5, range.RANGE_LB_INC | RANGE_UB_INC))
// => '[0,5]'
```

## API

#### `parse(input, [transform])` -> `Range`

##### input

*Required*  
Type: `string`

A Postgres range string.

##### transform

Type: `function`  
Default: `identity`

A function that transforms non-null bounds of the range.


#### `serialize(range, [format])` -> `string`

##### range

*Required*  
Type: `Range`

A `Range` object.

##### format

Type: `function`  
Default: `identity`

A function that formats non-null bounds of the range.


## License

MIT © [Abbas Mashayekh](http://github.com/martianboy)
