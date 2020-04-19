export class Stopwatch {
    #timerId: number|null = null
    #endAt: number|null = null
    #pausedAt: number|null = null
    #resolve: Function|null = null

    start (ms: number) {
        this._clearTimer()
        this.#endAt = performance.now() + ms
        this.#pausedAt = null
        const p = new Promise(resolve => {
            this.#resolve = () => {
                this.#timerId = this.#endAt = this.#pausedAt = this.#resolve = null
                resolve()
            }
        })
        this.#timerId = setTimeout(this.#resolve!, ms)
        return p
    }

    private _clearTimer () {
        if (this.#timerId) {
            clearTimeout(this.#timerId)
            this.#timerId = null
        }
    }

    pause () {
        this._clearTimer()
        this.#pausedAt = performance.now()
    }

    resume () {
        if (this.#timerId) return
        const pausedAt = this.#pausedAt!
        this.#timerId = setTimeout(this.#resolve!, this.#endAt! - pausedAt)
        this.#endAt! += performance.now() - pausedAt
        this.#pausedAt = null
    }

    stop () {
        if (!this.#resolve) return
        if (this.#timerId) clearTimeout(this.#timerId)
        this.#resolve()
    }
}
