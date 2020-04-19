type KEY = 'left'|'right'|'up'|'down'|'a'|'b'|'c'

export class Controller {
    #pressed = new Set<KEY>()
    #schedules = new Map<KEY, Set<number>>()
    #listeners = new Map<KEY, Function[]>()

    on (key: KEY, fn: Function, { throttle: throttleMS = 0, repeat = false } = {}) {
        if (repeat) fn = this._wrapToRepeat(key, fn, Math.max(throttleMS, 16))
        if (throttleMS > 0) fn = throttle(fn, throttleMS)

        const fns = this.#listeners.has(key)
            ? this.#listeners.get(key)!
            : this.#listeners.set(key, []).get(key)!
        fns.push(fn)

        return () => { fns.splice(fns.indexOf(fn), 1) }
    }

    private _wrapToRepeat (key: KEY, fn: Function, ms: number) {
        const set = this.#schedules.has(key)
            ? this.#schedules.get(key)!
            : this.#schedules.set(key, new Set()).get(key)!
        let timerId: number|null = null
        return function wrap () {
            if (timerId && set.has(timerId)) set.delete(timerId)
            set.add(timerId = setTimeout(wrap, ms))
            fn()
        }
    }

    press (key: KEY, { hold = false } = {}) {
        if (this.#pressed.has(key)) return
        this.#pressed.add(key)

        if (!this.#listeners.has(key)) return
        this.#listeners.get(key)!.forEach(fn => fn())

        if (!hold) this.release(key)
    }

    release (key: KEY) {
        if (!this.#pressed.has(key)) return
        this.#pressed.delete(key)

        if (!this.#schedules.has(key)) return
        const set = this.#schedules.get(key)!
        set.forEach(timerId => clearTimeout(timerId))
        set.clear()
    }
}

function throttle<F extends Function> (fn: F, ms: number) {
    let wait = false
    return () => {
        if (wait) return
        wait = true
        fn()
        setTimeout(() => (wait = false), ms)
    }
}
