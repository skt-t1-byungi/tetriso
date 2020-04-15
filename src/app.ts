type MinoDef = {color: string; shape: number[][]}
const MINO = {
    I: {
        color: 'sky',
        shape: [
            [1],
            [1],
            [1],
            [1]
        ]
    },
    J: {
        color: 'blue',
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ]
    },
    L: {
        color: 'orange',
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ]
    },
    O:
    {
        color: 'purple',
        shape: [
            [1, 1],
            [1, 1]
        ]
    },
    T: {
        color: 'yellow',
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ]
    },
    S: {
        color: 'green',
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ]
    },
    Z: {
        color: 'red',
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ]
    }
}

type BlockPos = {x: number; y: number}
const WAITING_HIGHT = 4
type Block = {color: string}
class Board {
    #map: Array<Array<Block|null>>
    #curr: BlockPos[] = null!
    #rotates: 0|1|2|3 = 0

    constructor ({ width = 10, height = 20 } = {}) {
        this.#map = Array.from({ length: height + WAITING_HIGHT }, () => Array(width).fill(null))
    }

    add ({ color, shape }: MinoDef) {
        const { width } = this._size()
        const padW = ~~((width - shape[0].length) / 2)
        const padH = WAITING_HIGHT - shape.length
        this.#curr = shape
            .flatMap((cols, y) => cols.map((v, x) => (v && { x: x + padW, y: y + padH })))
            .filter(Boolean) as any
        this.#curr.forEach(({ x, y }) => (this.#map[y][x] = { color }))
        this.#rotates = 0
    }

    get data () {
        return this.#map.slice(WAITING_HIGHT)
    }

    private _size () {
        const { length: height, 0: { length: width } } = this.#map
        return { width, height }
    }

    private _isCollided (poses: BlockPos[]) {
        const { width, height } = this._size()
        return poses.some(({ x, y }) =>
            (x < 0 || y < 0 || x >= width || y >= height) ||
            (this.#curr.every(o => o.x !== x && o.y !== y) && this.#map[y][x]))
    }

    private _move (next: BlockPos[]) {
        const blocks = this.#curr.map(({ x, y }) => this.#map[y][x])
        this.#curr.forEach(({ x, y }) => (this.#map[y][x] = null))
        ;(this.#curr = next).forEach(({ x, y }, i) => (this.#map[y][x] = blocks[i]))
    }

    left () {
        const next = this.#curr.map(({ x, y }) => ({ x: --x, y }))
        if (!this._isCollided(next)) this._move(next)
    }

    right () {
        const next = this.#curr.map(({ x, y }) => ({ x: ++x, y }))
        if (!this._isCollided(next)) this._move(next)
    }

    down () {
        const next = this.#curr.map(({ x, y }) => ({ x, y: ++y }))
        if (!this._isCollided(next)) this._move(next)
    }

    drop () {
        const distance = this._dropDistance()
        if (!distance) return

        const next = this.#curr.map(({ x, y }) => ({ x, y: y + distance }))
        if (!this._isCollided(next)) this._move(next)
    }

    private _dropDistance () {
        const byX = this.#curr.reduce((o, { x, y }) => ((o[x] = Math.max(o[x] || -1, y)), o), {} as {[k: number]: number})
        const { height } = this._size()
        const distances = Object.entries(byX).map(([x, y]: any) => {
            const idx = this.#map.slice(++y).findIndex(cols => cols[x])
            return ~idx ? idx : height - y
        })
        return Math.min(...distances)
    }

    dropPositions () {
        const distance = this._dropDistance() - WAITING_HIGHT
        return this.#curr.map(({ x, y }) => ({ x, y: y + distance }))
    }

    rotateRight () {
        const pv = this._pivot(this.#rotates)
        const next = this.#curr.map(({ x, y }) => ({ x: -y + pv.y + pv.x, y: x - pv.x + pv.y }))
        if (!this._isCollided(next)) {
            this.#rotates = ((this.#rotates + 1) % 4)as any
            this._move(next)
        }
    }

    private _pivot (rotates: number) {
        const max = { x: -1, y: -1 }
        const min = { x: Infinity, y: Infinity }
        this.#curr.forEach(({ x, y }) => {
            max.x = Math.max(max.x, x)
            max.y = Math.max(max.y, y)
            min.x = Math.min(min.x, x)
            min.y = Math.min(min.y, y)
        })
        const diff = { x: max.x - min.x, y: max.y - min.y }
        const lg = Math.max(diff.x, diff.y)
        const sm = Math.min(diff.x, diff.y)
        const fix = (sm / lg >= 1 / 2) ? { x: lg / 2, y: lg / 2 } : { x: diff.x / 2, y: diff.y / 2 }
        if (rotates === 1) fix.x = ~~(fix.x / 2)
        if (rotates === 2) fix.y = ~~(fix.y / 2)
        return { x: min.x + fix.x, y: min.y + fix.y }
    }

    rotateLeft () {
    }
}

const b = new Board()
b.add(MINO.Z)
b.down()
b.down()
b.down()
b.down()
b.down()
// b.left()
// b.left()
console.table(b.data)
b.rotateRight()
console.table(b.data)
b.rotateRight()
console.table(b.data)
b.rotateRight()
console.table(b.data)
b.rotateRight()
console.table(b.data)
// b.down()
// b.down()
// b.rotateRight()
// b.rotateRight()
// b.rotateRight()
// b.down()
// b.down()
// b.down()
// b.down()
// b.drop()
// console.log(b.dropPos())
// console.table(b.map)
// console.table(MINO.J.shape)
