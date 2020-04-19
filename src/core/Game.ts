import { Board } from './Board'
import { Controller } from './Controller'
import { Mino } from './Mino'
import * as minos from './minos'
import { Stopwatch } from './Stopwatch'

const MINO_DEFS = Object.values(minos)

export enum STATUS {
    BEFORE = 'BEFORE',
    PAUSE = 'PAUSE',
    PLAYING = 'PLAYING',
    END = 'END'
}

export class Game {
    #board: Board
    #status = STATUS.BEFORE
    #mino: Mino|null = null
    #lv = -1
    #score = -1
    #ctrl = new Controller()
    #stopwatch = new Stopwatch()
    #q: number[] = Array.from({ length: 4 }, () => rand(MINO_DEFS.length))

    constructor ({ width = 10, height = 20 } = {}) {
        this.#board = new Board({ width, height })
    }

    get controller () {
        return this.#ctrl
    }

    get isPlaying () {
        return this.#status === STATUS.PLAYING
    }

    get isPaused () {
        return this.#status === STATUS.PAUSE
    }

    get isEnded () {
        return this.#status === STATUS.END
    }

    get data () {
        const status = this.#status
        switch (status) {
        case STATUS.BEFORE:
            return { status }
        case STATUS.END:
            return { status, score: this.#score }
        default:
            return {
                status,
                level: this.#lv,
                score: this.#score,
                board: this.#board.data,
                mino: this.#mino!.data,
                queue: this.#q.map(i => MINO_DEFS[i])
            }
        }
    }

    async start () {
        if (this.isPlaying) return

        const sw = this.#stopwatch
        if (this.isPaused) {
            this.#status = STATUS.PLAYING
            return sw.resume()
        }

        this.#status = STATUS.PLAYING
        this.#board.clearAll()
        this.#lv = 1
        this.#score = 0

        let mino: Mino|null = null
        const commit = () => {
            if (!mino) return
            mino.commitToBoard()
            const len = this.#board.clearFilledLines()
            this.#score += len * this.#lv * 100
            mino = null
        }

        const ctrl = this.#ctrl
        const offs = [
            ctrl.on('up', () => {
                if (!mino) return
                mino.drop()
                commit()
                sw.stop()
            }),
            ctrl.on('down', () => {
                if (!mino) return
                if (!mino.down()) {
                    commit()
                    sw.stop()
                }
            }, { throttle: 64, repeat: true }),
            ctrl.on('left', () => mino?.left(), { throttle: 80, repeat: true }),
            ctrl.on('right', () => mino?.right(), { throttle: 80, repeat: true }),
            ctrl.on('a', () => mino?.rotateLeft(), { throttle: 144, repeat: true }),
            ctrl.on('b', () => mino?.rotateRight(), { throttle: 144, repeat: true })
        ]

        while (true) {
            mino = this._newMino()
            await sw.start(500)
            if (!mino) continue
            if (!mino.down()) break // = > game over!

            while (true) {
                await sw.start(500)
                if (!mino) break
                if (mino.down()) continue
                commit()
                break
            }
        }

        this.#status = STATUS.END
        offs.forEach(off => off())
    }

    pause () {
        if (!this.isPlaying) return
        this.#status = STATUS.PAUSE
        this.#stopwatch.pause()
    }

    private _newMino () {
        const [i, ...newQ] = [...this.#q, rand(MINO_DEFS.length)]
        this.#q = newQ
        return (this.#mino = new Mino({ board: this.#board, ...MINO_DEFS[i] }))
    }
}

function rand (n: number) {
    return ~~(n * Math.random())
}
