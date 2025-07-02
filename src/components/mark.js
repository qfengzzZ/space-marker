import { s8 } from "../utils/index"
import _ from 'lodash'
import { Point } from "./point"
import { Rect } from "./rect"
export class Mark {
    radius = 0
    padding = 0
    icon = null
    bgColor =  'rgba(9, 140, 255, 0.8)'
    highlight = false
    highlightSize =  8
    ext = null
    center = {
        x: 0,
        y: 0
    }
    borderRect = null
    centerRect = null
    constructor(options, spaceMaker) {
        this.id = s8()
        this.options = options
        this.spaceMaker = spaceMaker

        if(_.get(this.options, 'w')) {
            this.options.center.x = (this.options.center.x * this.spaceMaker.mapImg.width) / _.get(this.options, 'w', 1)
            this.options.center.y = (this.options.center.y * this.spaceMaker.mapImg.height) / _.get(this.options,  'h', 1)
        }
        this.initOptions()
        this.parseIcon()
        
    }
    initOptions() {
        this.radius = _.get(this.options, 'radius')
        this.padding = _.get(this.options, 'padding')
        this.icon = _.get(this.options, 'icon')
        this.bgColor = _.get(this.options, 'bgColor')
        this.highlight = _.get(this.options, 'highlight')
        this.highlightSize = _.get(this.options, 'highlightSize')
        this.ext = _.get(this.options, 'ext')
    }
    parseIcon() {
        if(this.icon.startsWith('http')) {
            this.loadImg(this.icon)
        } else if (resources[`${this.icon}`]) {
            this.loadImg(resources[`${this.icon}`])
        }
    }
    loadImg(src) {
        if (!src) {
            return
        }
        this.iconImg = new Image()
        this.iconImg.crossOrigin = 'anonymous'
        this.iconImg.src = src
        this.iconImg.onload = () => {
            this.draw()
        }
    }

    draw() {
        this.calcCenter()
        // 超出屏幕范围的不画出来
        if (this.center.x < 0 || this.center.y < 0 || this.center.x > this.spaceMaker.map.width || this.center.y > this.spaceMaker.map.height) return
        let ctx = this.spaceMaker.ctx
        ctx.save()
        if(this.highlight) {
            ctx.beginPath()
            ctx.arc(this.center.x, this.center.y, this.radius + this.highlightSize, 0, 2 * Math.PI, false)
            ctx.fillStyle = Color('rgba(9, 140, 255, 0.8)').alpha(0.4).lighten(0.5)
            ctx.fill()

            ctx.strokeStyle = Color('rgba(9, 140, 255, 0.8)').alpha(0.8).lighten(0.2)
            ctx.lineWidth = 1
            ctx.stroke()
        }
        if (this.iconImg) {
            ctx.beginPath()
            ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI, false)
            ctx.fillStyle = this.bgColor
            ctx.fill()
            ctx.drawImage(this.iconImg, 0, 0, this.iconImg.width, this.iconImg.height, this.centerRect.x, this.centerRect.y, this.centerRect.width, this.centerRect.height)
        }
        // if (this.iconFont) {
        //     // 因为字体图标是镂空的，所以先画一个白底
        //     ctx.beginPath()
        //     if(this.icon.startsWith('D_')) {
        //         ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI, false)
        //         ctx.fillStyle = Color(this.bgColor).alpha(0.8)
        //         ctx.font = `${this.borderRect.width - this.padding / 2}px anticon`
        //     } else {
        //         ctx.arc(this.center.x, this.center.y, this.radius - 0.2, 0, 2 * Math.PI, false)
        //         ctx.fillStyle = 'rgba(255, 255, 255, 1)'
        //         ctx.font = `${this.borderRect.width}px anticon`
        //     }
        //     ctx.fill()
        //     ctx.textAlign = 'center'
        //     ctx.textBaseline = 'middle'
        //     ctx.fillText(this.iconFont, this.center.x, this.center.y)
        // }
        ctx.restore()
    }
    calcCenter() {
        const cx = (_.get(this.options, 'center.x') - this.spaceMaker.mapImgRect.x) * this.spaceMaker.ratio
        const cy = (_.get(this.options, 'center.y') - this.spaceMaker.mapImgRect.y) * this.spaceMaker.ratio
        this.center = new Point(cx, cy)
        const innerWidth = this.radius - this.padding
        const innerHeight = this.radius - this.padding
        this.centerRect = new Rect(this.center.x - innerWidth, this.center.y - innerHeight, innerWidth * 2, innerHeight * 2)
        this.borderRect = new Rect(this.center.x - this.radius, this.center.y - this.radius, this.radius * 2, this.radius * 2)
    }
    
}
