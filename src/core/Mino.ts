import { Board } from './Board'
import { BlockPosition, MinoDef } from './types'

export class Mino {
    #isCommitted = false
    #board: Board
    #color: string
    #shape: number[][]
    #pos: BlockPosition

    constructor ({ board, color, shape }: { board: Board } & MinoDef) {
        this.#board = board
        this.#color = color
        this.#shape = shape.map(cols => cols.slice())
        this.#pos = {
            x: Math.ceil((board.size.width - shape[0].length) / 2),
            y: -shape.filter(cols => cols.some(Boolean)).length
        }
    }

    get isCommitted () {
        return this.#isCommitted
    }

    get isOutside () {
        return this._poses().every(({ y }) => y < 0)
    }

    get data () {
        return { color: this.#color, positions: this._poses(), dropPositions: this._dropPoses() }
    }

    left () {
        return this._move(-1, 0)
    }

    right () {
        return this._move(1, 0)
    }

    down () {
        return this._move(0, 1)
    }

    drop () {
        const dist = this.#board.dropDistance(this._poses())

        return dist > 0 && this._move(0, dist)
    }

    private _move (x = 0, y = 0) {
        const next = { x: this.#pos.x + x, y: this.#pos.y + y }
        if (this.#board.isCollided(this._poses(next))) return false
        this.#pos = next
        return true
    }

    private _poses (base: BlockPosition = this.#pos) {
        return shapeToPoses(this.#shape, base)
    }

    private _dropPoses () {
        const dist = this.#board.dropDistance(this._poses())
        return this._poses({ x: this.#pos.x, y: this.#pos.y + dist })
    }

    rotateRight () {
        return this._rotate()
    }

    rotateLeft () {
        return this._rotate(true)
    }

    private _rotate (isLeft = false) {
        const nextShape = this._rotateShape(isLeft)
        if (this.#board.isCollided(shapeToPoses(nextShape, this.#pos))) return false
        this.#shape = nextShape
        return true
    }

    private _rotateShape (isLeft = false) {
        const sh = this.#shape
        return sh[0].map((_, x) => sh.map((_, y, { length: l }) => isLeft ? sh[y][l - 1 - x] : sh[l - 1 - y][x]))
    }

    commit () {
        if (this.#isCommitted) return
        this.#isCommitted = true
        this.#board.add({ color: this.#color, positions: this._poses() })
    }
}

function shapeToPoses (shape: number[][], base: BlockPosition) {
    return shape
        .flatMap((cols, y) => cols.map((bit, x) => bit && { x: x + base.x, y: y + base.y }))
        .filter(Boolean) as BlockPosition[]
}
