// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"yuPX":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

class Board {
  constructor({
    width,
    height
  }) {
    this.#size = {
      width,
      height
    };
    this.#map = matrix(width, height);
  }

  #map;
  #size;

  get size() {
    return this.#size;
  }

  get data() {
    return this.#map;
  }

  clearAll() {
    const {
      width,
      height
    } = this.#size;
    this.#map = matrix(width, height);
  }

  clearFilledLines() {
    const {
      width,
      height
    } = this.#size;
    const rows = this.#map.filter(cols => cols.some(v => !v));
    const len = height - rows.length;
    if (len > 0) this.#map = [...matrix(width, len), ...rows];
    return len;
  }

  isCollided(poses) {
    const {
      width,
      height
    } = this.#size;
    return poses.some(({
      x,
      y
    }) => x < 0 || x >= width || y >= height || this.#map[y]?.[x]);
  }

  dropDistance(poses) {
    const byX = poses.reduce((o, {
      x,
      y
    }) => (o[x] = Math.max(o[x] || -Infinity, y), o), {});
    const {
      height
    } = this.#size;
    const dists = Object.entries(byX).map(([x, y]) => {
      const n = Math.max(y + 1, 0);
      const idx = this.#map.slice(n).findIndex(cols => cols[x]);
      return ~idx ? idx : height - n;
    });
    return Math.min(...dists);
  }

  add({
    color,
    positions
  }) {
    const {
      width,
      height
    } = this.#size;
    positions.filter(({
      x,
      y
    }) => x >= 0 && x < width && y >= 0 && y < height).forEach(({
      x,
      y
    }) => {
      this.#map[y][x] = {
        color
      };
    });
  }

}

exports.Board = Board;

function matrix(width, height, val = null) {
  return Array.from({
    length: height
  }, () => Array(width).fill(val));
}
},{}],"FEf8":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

class Controller {
  constructor() {
    this.#pressed = new Set();
    this.#schedules = new Map();
    this.#listeners = new Map();
  }

  #pressed;
  #schedules;
  #listeners;

  on(key, fn, {
    throttle: throttleMS = 0,
    repeat = false
  } = {}) {
    if (repeat) fn = this._wrapToRepeat(key, fn, Math.max(throttleMS, 16));
    if (throttleMS > 0) fn = throttle(fn, throttleMS);
    const fns = this.#listeners.has(key) ? this.#listeners.get(key) : this.#listeners.set(key, []).get(key);
    fns.push(fn);
    return () => {
      fns.splice(fns.indexOf(fn), 1);
    };
  }

  _wrapToRepeat(key, fn, ms) {
    const set = this.#schedules.has(key) ? this.#schedules.get(key) : this.#schedules.set(key, new Set()).get(key);
    let timerId = null;
    return function wrap() {
      if (timerId && set.has(timerId)) set.delete(timerId);
      set.add(timerId = setTimeout(wrap, ms));
      fn();
    };
  }

  press(key, {
    hold = false
  } = {}) {
    if (this.#pressed.has(key)) return;
    this.#pressed.add(key);
    if (!this.#listeners.has(key)) return;
    this.#listeners.get(key).forEach(fn => fn());
    if (!hold) this.release(key);
  }

  release(key) {
    if (!this.#pressed.has(key)) return;
    this.#pressed.delete(key);
    if (!this.#schedules.has(key)) return;
    const set = this.#schedules.get(key);
    set.forEach(timerId => clearTimeout(timerId));
    set.clear();
  }

}

exports.Controller = Controller;

function throttle(fn, ms) {
  let wait = false;
  return () => {
    if (wait) return;
    wait = true;
    fn();
    setTimeout(() => wait = false, ms);
  };
}
},{}],"pMQl":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

class Mino {
  constructor({
    board,
    color,
    shape
  }) {
    this.#isCommitted = false;
    this.#board = board;
    this.#color = color;
    this.#shape = shape.map(cols => cols.slice());
    this.#pos = {
      x: Math.ceil((board.size.width - shape[0].length) / 2),
      y: -shape.filter(cols => cols.some(Boolean)).length
    };
  }

  #isCommitted;
  #board;
  #color;
  #shape;
  #pos;

  get isCommitted() {
    return this.#isCommitted;
  }

  get isOutside() {
    return this._poses().every(({
      y
    }) => y < 0);
  }

  get data() {
    return {
      color: this.#color,
      positions: this._poses(),
      dropPositions: this._dropPoses()
    };
  }

  left() {
    return this._move(-1, 0);
  }

  right() {
    return this._move(1, 0);
  }

  down() {
    return this._move(0, 1);
  }

  drop() {
    const dist = this.#board.dropDistance(this._poses());
    return dist > 0 && this._move(0, dist);
  }

  _move(x = 0, y = 0) {
    const next = {
      x: this.#pos.x + x,
      y: this.#pos.y + y
    };
    if (this.#board.isCollided(this._poses(next))) return false;
    this.#pos = next;
    return true;
  }

  _poses(base = this.#pos) {
    return shapeToPoses(this.#shape, base);
  }

  _dropPoses() {
    const dist = this.#board.dropDistance(this._poses());
    return this._poses({
      x: this.#pos.x,
      y: this.#pos.y + dist
    });
  }

  rotateRight() {
    return this._rotate();
  }

  rotateLeft() {
    return this._rotate(true);
  }

  _rotate(isLeft = false) {
    const nextShape = this._rotateShape(isLeft);

    if (this.#board.isCollided(shapeToPoses(nextShape, this.#pos))) return false;
    this.#shape = nextShape;
    return true;
  }

  _rotateShape(isLeft = false) {
    const sh = this.#shape;
    return sh[0].map((_, x) => sh.map((_, y, {
      length: l
    }) => isLeft ? sh[y][l - 1 - x] : sh[l - 1 - y][x]));
  }

  commit() {
    if (this.#isCommitted) return;
    this.#isCommitted = true;
    this.#board.add({
      color: this.#color,
      positions: this._poses()
    });
  }

}

exports.Mino = Mino;

function shapeToPoses(shape, base) {
  return shape.flatMap((cols, y) => cols.map((bit, x) => bit && {
    x: x + base.x,
    y: y + base.y
  })).filter(Boolean);
}
},{}],"B0ZW":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.I = {
  name: 'I',
  color: 'skyblue',
  shape: [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]]
};
exports.J = {
  name: 'J',
  color: 'blue',
  shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
};
exports.L = {
  name: 'L',
  color: 'orange',
  shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]]
};
exports.O = {
  name: 'O',
  color: 'purple',
  shape: [[1, 1], [1, 1]]
};
exports.T = {
  name: 'T',
  color: 'yellow',
  shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]]
};
exports.S = {
  name: 'S',
  color: 'green',
  shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]]
};
exports.Z = {
  name: 'Z',
  color: 'red',
  shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]]
};
},{}],"P5pz":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

class Stopwatch {
  constructor() {
    this.#timerId = null;
    this.#endAt = null;
    this.#pausedAt = null;
    this.#resolve = null;
  }

  #timerId;
  #endAt;
  #pausedAt;
  #resolve;

  start(ms) {
    this._clearTimer();

    this.#endAt = performance.now() + ms;
    this.#pausedAt = null;
    const p = new Promise(resolve => {
      this.#resolve = () => {
        this.#timerId = this.#endAt = this.#pausedAt = this.#resolve = null;
        resolve();
      };
    });
    this.#timerId = setTimeout(this.#resolve, ms);
    return p;
  }

  _clearTimer() {
    if (this.#timerId) {
      clearTimeout(this.#timerId);
      this.#timerId = null;
    }
  }

  pause() {
    this._clearTimer();

    this.#pausedAt = performance.now();
  }

  resume() {
    if (this.#timerId) return;
    const pausedAt = this.#pausedAt;
    this.#timerId = setTimeout(this.#resolve, this.#endAt - pausedAt);
    this.#endAt += performance.now() - pausedAt;
    this.#pausedAt = null;
  }

  stop() {
    if (!this.#resolve) return;
    if (this.#timerId) clearTimeout(this.#timerId);
    this.#resolve();
  }

}

exports.Stopwatch = Stopwatch;
},{}],"lfAg":[function(require,module,exports) {
"use strict";

var __importStar = this && this.__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  result["default"] = mod;
  return result;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const Board_1 = require("./Board");

const Controller_1 = require("./Controller");

const Mino_1 = require("./Mino");

const minos = __importStar(require("./minos"));

const Stopwatch_1 = require("./Stopwatch");

const MINO_DEFS = Object.values(minos);
var STATUS;

(function (STATUS) {
  STATUS["BEFORE"] = "BEFORE";
  STATUS["PAUSE"] = "PAUSE";
  STATUS["PLAYING"] = "PLAYING";
  STATUS["END"] = "END";
})(STATUS = exports.STATUS || (exports.STATUS = {}));

class Game {
  constructor({
    width = 10,
    height = 20
  } = {}) {
    this.#status = STATUS.BEFORE;
    this.#mino = null;
    this.#lv = -1;
    this.#score = -1;
    this.#ctrl = new Controller_1.Controller();
    this.#stopwatch = new Stopwatch_1.Stopwatch();
    this.#q = Array.from({
      length: 4
    }, () => rand(MINO_DEFS.length));
    this.#board = new Board_1.Board({
      width,
      height
    });
  }

  #board;
  #status;
  #mino;
  #lv;
  #score;
  #ctrl;
  #stopwatch;
  #q;

  get controller() {
    return this.#ctrl;
  }

  get isPlaying() {
    return this.#status === STATUS.PLAYING;
  }

  get isPaused() {
    return this.#status === STATUS.PAUSE;
  }

  get isEnded() {
    return this.#status === STATUS.END;
  }

  get data() {
    const status = this.#status;

    switch (status) {
      case STATUS.BEFORE:
        return {
          status
        };

      case STATUS.END:
        return {
          status,
          score: this.#score
        };

      default:
        return {
          status,
          level: this.#lv,
          score: this.#score,
          board: this.#board.data,
          mino: this.#mino.data,
          queue: this.#q.map(i => MINO_DEFS[i])
        };
    }
  }

  async start() {
    if (this.isPlaying) return;
    const sw = this.#stopwatch;

    if (this.isPaused) {
      this.#status = STATUS.PLAYING;
      return sw.resume();
    }

    this.#status = STATUS.PLAYING;
    this.#board.clearAll();
    this.#lv = 1;
    this.#score = 0;
    let mino = null;
    const ctrl = this.#ctrl;
    const offs = [ctrl.on('down', () => {
      if (!this.isPlaying || !mino) return;

      if (!mino.down()) {
        mino.commit();
        sw.stop();
      }
    }, {
      throttle: 64,
      repeat: true
    }), ctrl.on('left', () => this.isPlaying && mino?.left(), {
      throttle: 64,
      repeat: true
    }), ctrl.on('right', () => this.isPlaying && mino?.right(), {
      throttle: 64,
      repeat: true
    }), ctrl.on('up', () => this.isPlaying && mino?.rotateRight(), {
      throttle: 144,
      repeat: true
    }), ctrl.on('a', () => this.isPlaying && mino?.rotateLeft(), {
      throttle: 144,
      repeat: true
    }), ctrl.on('b', () => {
      if (!this.isPlaying || !mino) return;
      mino.drop();
      mino.commit();
      sw.stop();
    })];

    loop: while (true) {
      mino = this._newMino();

      while (true) {
        await sw.start(500);
        if (mino.isCommitted && mino.isOutside) break loop;

        if (!mino.isCommitted) {
          if (!mino.down()) mino.commit();
          if (!mino.isCommitted) continue;
          if (mino.isOutside) break loop;
        }

        const len = this.#board.clearFilledLines();
        this.#score += len * this.#lv * 100;
        break;
      }
    }

    this.#status = STATUS.END;
    offs.forEach(off => off());
  }

  pause() {
    if (!this.isPlaying) return;
    this.#status = STATUS.PAUSE;
    this.#stopwatch.pause();
  }

  _newMino() {
    const [i, ...newQ] = [...this.#q, rand(MINO_DEFS.length)];
    this.#q = newQ;
    return this.#mino = new Mino_1.Mino({
      board: this.#board,
      ...MINO_DEFS[i]
    });
  }

}

exports.Game = Game;

function rand(n) {
  return ~~(n * Math.random());
}
},{"./Board":"yuPX","./Controller":"FEf8","./Mino":"pMQl","./minos":"B0ZW","./Stopwatch":"P5pz"}],"EVxB":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const Game_1 = require("./core/Game");

const $ = document.querySelector.bind(document);
const $startBtn = $('.js-start');
const $stopBtn = $('.js-stop');
const $status = $('.js-status');
const $board = $('.js-board');
const $q = $('.js-q');
const game = new Game_1.Game();
const ctrl = game.controller;
let timerId = null;
addEventListener('keydown', e => {
  switch (e.keyCode) {
    case 37:
      return ctrl.press('left', {
        hold: true
      });

    case 88:
    case 38:
      return ctrl.press('up', {
        hold: true
      });

    case 39:
      return ctrl.press('right', {
        hold: true
      });

    case 40:
      return ctrl.press('down', {
        hold: true
      });

    case 90:
      return ctrl.press('a', {
        hold: true
      });

    case 32:
      return ctrl.press('b', {
        hold: true
      });

    case 27:
      if (game.isPlaying) $stopBtn.click();else if (game.isPaused) $startBtn.click();
  }
});
addEventListener('keyup', e => {
  switch (e.keyCode) {
    case 37:
      return ctrl.release('left');

    case 88:
    case 38:
      return ctrl.release('up');

    case 39:
      return ctrl.release('right');

    case 40:
      return ctrl.release('down');

    case 90:
      return ctrl.release('a');

    case 32:
      return ctrl.release('b');
  }
});
$startBtn.addEventListener('click', () => {
  $stopBtn.disabled = false;
  $startBtn.disabled = true;

  if (game.isPaused) {
    game.start();
    renderLoop();
    return;
  }

  let cnt = 3;

  const renderTxt = () => $status.innerHTML = `Ready... ${cnt}`;

  renderTxt();
  timerId = setInterval(() => {
    if (! --cnt) {
      clearInterval(timerId);
      timerId = setTimeout(() => {
        $board.style.opacity = '1';
        game.start();
        renderLoop();
      }, 400);
    }

    renderTxt();
  }, 400);
});
$stopBtn.addEventListener('click', () => {
  $stopBtn.disabled = true;
  $startBtn.disabled = false;

  if (game.isPlaying) {
    $status.innerHTML = 'paused...';
    game.pause();
    return;
  }

  $status.innerHTML = 'Stopped...';
  if (timerId) clearInterval(timerId);
});

function renderLoop() {
  requestAnimationFrame(() => {
    const {
      data
    } = game;

    if (data.status !== Game_1.STATUS.PLAYING) {
      if (data.status === Game_1.STATUS.END) {
        $stopBtn.disabled = true;
        $startBtn.disabled = false;
        $status.innerHTML = `<b>GameOver!!</b> <br/> score:${data.score}`;
        $board.style.opacity = '0.3';
      }

      return;
    }

    $board.innerHTML = data.board.flatMap(cols => cols.map(b => `<div style="background: ${b ? b.color : 'black'}"></div>`)).join('');
    const {
      color,
      positions,
      dropPositions
    } = data.mino;
    dropPositions.filter(pos => pos.y >= 0).forEach(pos => {
      const el = $board.children[pos.y * 10 + pos.x];
      el.style.background = '#333';
    });
    positions.filter(pos => pos.y >= 0).forEach(pos => {
      const el = $board.children[pos.y * 10 + pos.x];
      el.style.background = color;
    });
    $status.innerHTML = `score: ${data.score} <br/> level: ${data.level}`;
    $q.innerHTML = data.queue.map(b => `<span style="color:${b.color}">${b.name}</span>`).join('');
    requestAnimationFrame(renderLoop);
  });
}
},{"./core/Game":"lfAg"}]},{},["EVxB"], null)