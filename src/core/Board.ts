import { BlockPosition } from './types'

export class Board {
    #map: Array<Array<{color: string}|null>>
    #size: Readonly<{width: number; height: number}>

    constructor ({ width, height }: {width: number; height: number}) {
        this.#size = { width, height }
        this.#map = matrix(width, height)
    }

    get size () {
        return this.#size
    }

    get data () {
        return this.#map
    }

    clearAll () {
        const { width, height } = this.#size
        this.#map = matrix(width, height)
    }

    clearFilledLines () {
        const { width, height } = this.#size
        const rows = this.#map.filter(cols => cols.some(v => !v))
        const len = height - rows.length
        if (len > 0) this.#map = [...matrix(width, len), ...rows]
        return len
    }

    isCollided (poses: BlockPosition[]) {
        const { width, height } = this.#size
        return poses.some(({ x, y }) => x < 0 || x >= width || y >= height || this.#map[y]?.[x])
    }

    dropDistance (poses: BlockPosition[]) {
        const byX = poses.reduce((o, { x, y }) => ((o[x] = Math.max(o[x] || -Infinity, y)), o), {} as {[k: number]: number})
        const { height } = this.#size
        const dists = Object.entries(byX).map(([x, y]: any) => {
            const n = Math.max(y + 1, 0)
            const idx = this.#map.slice(n).findIndex(cols => cols[x])
            return ~idx ? idx : height - n
        })
        return Math.min(...dists)
    }

    add ({ color, positions }: {color: string; positions: BlockPosition[]}) {
        const { width, height } = this.#size
        positions
            .filter(({ x, y }) => x >= 0 && x < width && y >= 0 && y < height)
            .forEach(({ x, y }) => { this.#map[y][x] = { color } })
    }
}

function matrix <T> (width: number, height: number, val: T|null = null) {
    return Array.from({ length: height }, () => Array(width).fill(val))
}
