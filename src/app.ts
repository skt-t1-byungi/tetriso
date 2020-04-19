import { Game, STATUS } from './core/Game'

const $ = document.querySelector.bind(document)

const $startBtn = $('.js-start') as HTMLButtonElement
const $stopBtn = $('.js-stop') as HTMLButtonElement
const $status = $('.js-status') as HTMLDivElement
const $board = $('.js-board') as HTMLDivElement
const $q = $('.js-q') as HTMLDivElement

const game = new Game()
const ctrl = game.controller
let timerId: number|null = null

addEventListener('keydown', e => {
    switch (e.keyCode) {
    case 37:
        return ctrl.press('left', { hold: true })
    case 88:
    case 38:
        return ctrl.press('up', { hold: true })
    case 39:
        return ctrl.press('right', { hold: true })
    case 40:
        return ctrl.press('down', { hold: true })
    case 90:
        return ctrl.press('a', { hold: true })
    case 32:
        return ctrl.press('b', { hold: true })
    case 27:
        if (game.isPlaying) $stopBtn.click()
        else if (game.isPaused) $startBtn.click()
    }
})

addEventListener('keyup', e => {
    switch (e.keyCode) {
    case 37:
        return ctrl.release('left')
    case 88:
    case 38:
        return ctrl.release('up')
    case 39:
        return ctrl.release('right')
    case 40:
        return ctrl.release('down')
    case 90:
        return ctrl.release('a')
    case 32:
        return ctrl.release('b')
    }
})

$startBtn.addEventListener('click', () => {
    $stopBtn.disabled = false
    $startBtn.disabled = true

    if (game.isPaused) {
        game.start()
        renderLoop()
        return
    }

    let cnt = 3
    const renderTxt = () => ($status.innerHTML = `Ready... ${cnt}`)
    renderTxt()
    timerId = setInterval(() => {
        if (!--cnt) {
            clearInterval(timerId!)
            timerId = setTimeout(() => {
                $board.style.opacity = '1'
                game.start()
                renderLoop()
            }, 400)
        }
        renderTxt()
    }, 400)
})

$stopBtn.addEventListener('click', () => {
    $stopBtn.disabled = true
    $startBtn.disabled = false

    if (game.isPlaying) {
        $status.innerHTML = 'paused...'
        game.pause()
        return
    }

    $status.innerHTML = 'Stopped...'
    if (timerId) clearInterval(timerId)
})

function renderLoop () {
    requestAnimationFrame(() => {
        const { data } = game
        if (data.status !== STATUS.PLAYING) {
            if (data.status === STATUS.END) {
                $stopBtn.disabled = true
                $startBtn.disabled = false
                $status.innerHTML = `<b>GameOver!!</b> <br/> score:${data.score}`
                $board.style.opacity = '0.3'
            }
            return
        }
        $board.innerHTML = data.board
            .flatMap(cols => cols.map(b => `<div style="background: ${b ? b!.color : 'black'}"></div>`))
            .join('')
        const { color, positions, dropPositions } = data.mino
        dropPositions
            .filter(pos => pos.y >= 0)
            .forEach(pos => {
                const el = $board.children[pos.y * 10 + pos.x] as HTMLDivElement
                el.style.background = '#333'
            })
        positions
            .filter(pos => pos.y >= 0)
            .forEach(pos => {
                const el = $board.children[pos.y * 10 + pos.x] as HTMLDivElement
                el.style.background = color
            })
        $status.innerHTML = `score: ${data.score} <br/> level: ${data.level}`
        $q.innerHTML = data.queue
            .map(b => `<span style="color:${b.color}">${b.name}</span>`)
            .join('')
        requestAnimationFrame(renderLoop)
    })
}
