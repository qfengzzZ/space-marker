import _ from 'lodash'
import { createMap } from './utils/index'
import { Range } from './components/range'
import { Mark } from './components/mark'

const MOVE_DISTANCE = 5
export class SpaceMaker {
    map = null
    dpiRatio = 1
    radio = 1
    width = 0
    height = 0
    ctx = null
    mapImg = null
    mapImgUrl = null
    translateImgTo = 1000
    marks = []
    ranges = []
    mapImgRect = null

    isDragStart = false
    startDragPos = null
    mouseMoveType = null

    timer = null
    constructor(parentElem, options) {
        this.parentElem = parentElem

        this.resizeDpiRatio()
        this.initialize(options)
        this.winResize()

    }
    // 动态调整dpi
    resizeDpiRatio() {
        if (window.devicePixelRatio < 2) {
            this.dpiRatio = 2
        } else {
            this.dpiRatio = window.devicePixelRatio
        }
    }

    // 初始化配置
    initialize(options) {
        if (!this.parentElem) {
            throw new Error('A DOM element is required for SpaceMaker to initialize')
        }
        this.options = options

        this.width = this.parentElem.clientWidth
        this.height = this.parentElem.clientHeight

        if (this.map) this.map.remove()
        
        this.map = createMap(this.width, this.height, this.dpiRatio)
        
        this.ctx = this.map.getContext('2d', { willReadFrequently: true })
        
        this.ctx.scale(this.dpiRatio, this.dpiRatio)

        this.parentElem.append(this.map)

        this.scaleX = _.get(this.options, 'scaleX')
        this.scaleY = _.get(this.options, 'scaleY')
        this.translateImgTo = _.get(this.options, 'translateImgTo')

        this.parseOptions(options)

        // 事件
        this.map.onmousemove = this.onMouseMove
        this.map.onmousedown = this.onMouseDown
        this.map.onmouseup = this.onMouseUp
        this.map.onmouseleave = this.onMouseLeave
        this.map.onwheel = this.onWheel

    }

    parseOptions(options) {
        this.ctx.clearRect(0, 0, this.width, this.height)
        this.marks = []
        this.ranges = []
        this.mapImgRect = {
            x: 0,
            y: 0,
            width: _.get(options, 'mapWidth') || 0,
            height: _.get(options, 'mapHeight') || 0
        }
        this.loadMapImg(_.get(options, 'mapImgUrl'), () => {
            this.onComponentsLoad(options)
        })
    }

    loadMapImg(src, cb = null) {
        if (!src) {
            throw new Error('src of picture is not found')
        }
        this.mapImg = new Image()
        this.mapImg.crossOrigin = 'anonymous'
        this.mapImg.src = src

        this.mapImg.onload = () => {
            this.mapImgRect = this.coverCenter(this.width, this.height, this.mapImg.width, this.mapImg.height)
            if (cb) {
                cb()
            }
        }
    }

    onComponentsLoad(options) {
        const _markers = _.get(options, 'marks') || []
        if (!_.isEmpty(_markers)) {
            this.marks = _markers.map(_m => {
                return new Mark(_m, this)
            })
        }
        const _ranges = _.get(options, 'ranges') || []
        if (!_.isEmpty(_ranges)) {
            this.ranges = _ranges.map(_r => {
                return new Range(_r, this)
            })
        }
        this.drawMapImage()
    
        this.dispatch('loaded', this)

    }

    drawMapImage() {
        if (!this.mapImg || !this.mapImgRect || !this.ctx) return
        this.ctx.clearRect(0, 0, this.width, this.height)

        this.ctx.drawImage(this.mapImg, this.mapImgRect.x, this.mapImgRect.y, this.mapImgRect.width,
            this.mapImgRect.height, 0, 0, this.width, this.height)

        this.marks.forEach(m => {
            m.draw()
        })

        this.ranges.forEach(r => {
            r.draw()
        })

        this.dispatch('rendered', this)
    }

    dispatch(event, data) {
        if (this.options.on) {
            this.options.on(event, data)
        }
    }

    
    // 适自应
    _resize() {
        const _w = this.parentElem.clientWidth
        const _h = this.parentElem.clientHeight

        if (_w !== this.width || _h !== this.height) {
            requestAnimationFrame(() => {
                this.width = _w
                this.height = _h
                this.map.width = this.width * this.dpiRatio
                this.map.height = this.height * this.dpiRatio
                this.map.style.width = this.width + 'px'
                this.map.style.height = this.height + 'px'
                this.ctx.scale(this.dpiRatio, this.dpiRatio)

                this.mapImgRect = this.coverCenter(this.width, this.height, this.mapImg.width, this.mapImg.height)

                this.drawMapImage()
            })
        }
    }
    winResize = () => {
        this.timer = setTimeout(() => {
            this._resize();
            this.timer = setTimeout(this.winResize, 500)
        }, 500)
    }

    coverRect(canvasWidth, canvasHeight, imgWidth, imgHeight ) {
        let x = 0
        let y = 0
        let width = imgWidth
        let height = imgHeight
        if ((imgWidth / imgHeight) > (canvasWidth / canvasHeight)) {
            width = (canvasWidth / canvasHeight) * imgHeight
            x = (imgWidth - width) / 2
        } else {
            height = (canvasHeight / canvasWidth) * imgWidth
            y = (imgHeight - height) / 2
        }

        this.ratio = (canvasWidth / width)
        return {
            x: x,
            y: y,
            width: width,
            height: height
        }
    }
    coverCenter(canvasWidth, canvasHeight, imgWidth, imgHeight) {
        let x = 0;
        let y = 0;
        let width = imgWidth;
        let height = imgHeight;
        // let centerScreenRatio = 3 / 4

        if ((imgWidth / imgHeight) > (canvasWidth / canvasHeight)) {
            this.ratio = (canvasWidth / width);
            y = -(canvasHeight / this.ratio - imgHeight) / 2;
            height = canvasHeight / this.ratio
            x = -(canvasWidth / this.ratio - imgWidth) / 2
        } else {
            this.ratio = (canvasHeight / height);
            x = -(canvasWidth / this.ratio - imgWidth) / 2
            width = canvasWidth / this.ratio
            y = -(canvasHeight / this.ratio - imgHeight) / 2
        }

        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }

onMouseMove = e => {
        e.preventDefault()
        e.stopPropagation()
        const ePos = {
            x: e.x - this.map.getBoundingClientRect().x,
            y: e.y - this.map.getBoundingClientRect().y
        }
        this.mapHover(ePos)
        if (this.isDragStart) {
            this.mapMove(ePos)
        }
}
 mapHover(pos) {
        let markHit = false
        let hitMark = null

        for (let i = this.marks.length - 1; i >= 0; i--) {
            if (this.marks[i].hit({
                x: pos.x / this.scaleX,
                y: pos.y / this.scaleY
            }) && !markHit) {
                markHit = true
                hitMark = this.marks[i]
            }
        }

        if (markHit && hitMark) {
            if (this.hoverMark && this.hoverMark.id !== hitMark.id) {
                this.dispatch('mark_leave', this.hoverMark)
                this.hoverMark = null
            }

            if (!this.hoverMark || (this.hoverMark && this.hoverMark.id !== hitMark.id)) {
                this.dispatch('mark_enter', hitMark)
                this.hoverMark = hitMark
            }
        } else {
            if (this.hoverMark) {
                this.dispatch('mark_leave', this.hoverMark)
                this.hoverMark = null
            }
        }

        let rangeHit = false
        let hitRange = null
        for (let i = this.ranges.length - 1; i >= 0; i--) {
            if (this.ranges[i].hit({
                x: pos.x / this.scaleX,
                y: pos.y / this.scaleY
            }) && !rangeHit) {
                rangeHit = true
                hitRange = this.ranges[i]
            } else {
                this.ranges[i].isActive = false;
            }
        }

        if (rangeHit && hitRange && !markHit) {
            if (this.hoverRange && this.hoverRange.id !== hitRange.id) {
                hitRange.setActive(false);
                this.dispatch('range_leave', { ...this.hoverRange, pos })
                this.hoverRange = null
            }

            if (!this.hoverRange || (this.hoverRange && this.hoverRange.id !== hitRange.id)) {
                hitRange.setActive(true);
                this.dispatch('range_enter', {...hitRange, pos})
                this.hoverRange = hitRange
            }
        } else {
            if (this.hoverRange) {
                this.hoverRange.setActive(false);
                this.dispatch('range_leave', this.hoverRange)
                this.hoverRange = null
            }
        }
    }

    mapMove(pos) {
        const dx = (pos.x - this.startDragPos.x) / this.scaleX;
        const dy = (pos.y - this.startDragPos.y) / this.scaleY;
        

        if (Math.abs(dx) < MOVE_DISTANCE && Math.abs(dy) < MOVE_DISTANCE) {
            return;
        }

        this.mouseMoveType = 'drag'

        this.startDragPos = pos;

        this.mapImgRect.x -= (dx / this.ratio);
        this.mapImgRect.y -= (dy / this.ratio);

        requestAnimationFrame(() => {
            this.drawMapImage();
        })
    }
    onMouseDown = e => {
        e.preventDefault()
        e.stopPropagation()
        this.isDragStart = true
        this.startDragPos = {
            x: e.x - this.map.getBoundingClientRect().x,
            y: e.y - this.map.getBoundingClientRect().y
        }
    }
    onMouseUp = e => {
        e.preventDefault()
        e.stopPropagation()
        this.isDragStart = false
        const ePos = {
            x: e.x - this.map.getBoundingClientRect().x,
            y: e.y - this.map.getBoundingClientRect().y
        }
        if (this.mouseMoveType === 'click') {
            this.mapClick(ePos)
        }
        this.mouseMoveType = 'click'
    }

    mapClick(pos) {
        const dx = (pos.x - this.startDragPos.x) / this.scaleX;
        const dy = (pos.y - this.startDragPos.y) / this.scaleY;

        if (Math.abs(dx) > MOVE_DISTANCE || Math.abs(dy) > MOVE_DISTANCE) {
            return
        }
        let markHit = false
        let hitMark = null
        for (let i = this.marks.length - 1; i >= 0; i--) {
            if (this.marks[i].hit({
                x: pos.x / this.scaleX,
                y: pos.y / this.scaleY
            }) && !markHit) {
                markHit = true
                hitMark = this.marks[i]
            } else {
                this.marks[i].highlight = false
            }
        }
        if (markHit && hitMark) {
            hitMark.setHighlight(true)
            this.dispatch('mark_click', hitMark)
        } else {
            this.drawMapImage()
        }

        let rangeHit = false
        let hitRange = null
        for (let i = this.ranges.length - 1; i >= 0; i--) {
            if (this.ranges[i].hit({
                x: pos.x / this.scaleX,
                y: pos.y / this.scaleY
            }) && !rangeHit) {
                rangeHit = true
                hitRange = this.ranges[i]
            } else {
                this.ranges[i].isActive = false
            }
        }

        if (rangeHit && hitRange && !markHit) {
            hitRange.setActive(true)
            this.dispatch('range_click', hitRange)
        } else {
            this.drawMapImage()
        }
    }

    onMouseLeave = e => {
        e.preventDefault()
        e.stopPropagation()
        this.isDragStart = false
    }

    onWheel = e => {
        e.preventDefault()
        e.stopPropagation()
        if (e.deltaY > 0) {
            this.mapTranslate({
                x: e.x - this.map.getBoundingClientRect().x,
                y: e.y - this.map.getBoundingClientRect().y
            }, 0.9)
        } else {
            this.mapTranslate({
                x: e.x - this.map.getBoundingClientRect().x,
                y: e.y - this.map.getBoundingClientRect().y
            }, 1.1)
        }
    }

    mapTranslate(pos, ratio) {
        pos = {
            x: pos.x / this.scaleX, 
            y: pos.y / this.scaleY
        }
        let x0 = pos.x / this.ratio + this.mapImgRect.x
        let y0 = pos.y / this.ratio + this.mapImgRect.y

        this.ratio = this.ratio * ratio

        this.mapImgRect.width = this.width / this.ratio
        this.mapImgRect.height = this.height / this.ratio
        this.mapImgRect.x = x0 - pos.x / this.ratio
        this.mapImgRect.y = y0 - pos.y / this.ratio

        requestAnimationFrame(() => {
            this.drawMapImage()
        })
    }
}