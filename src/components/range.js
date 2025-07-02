import _ from 'lodash'
import { Rect } from './rect'
import { s8 } from '../utils/index'
import { Point } from './point'
export class Range {
    bgColor = null
    hoverColor = null
    ext = null
    points = []
    borderRect = null
    constructor(options, spaceMaker) {
        this.id = s8()
        this.options = options
        this.spaceMaker = spaceMaker
        this.initOptions()
        this.calcPoints()
        this.calcBorderRect()
    }
    initOptions() {
        this.bgColor = _.get(this.options, 'bgColor', 'rgba(247, 159, 58, 0.6)');
        this.hoverColor = _.get(this.options, 'hoverColor', 'rgba(247, 159, 58, 0.6)')
        this.ext = _.get(this.options, 'ext');
    }
    calcPoints() {
        const _points = _.get(this.options, 'points') || []
        this.points = _points.map(item => {
            const cx = (item[0] - this.spaceMaker.mapImgRect.x) * this.spaceMaker.ratio;
            const cy = (item[1] - this.spaceMaker.mapImgRect.y) * this.spaceMaker.ratio;
            return [cx, cy]
        })
    }
    calcBorderRect() {
        const xs = this.points.map(m => m[0])
        const ys = this.points.map(m => m[1])
        const minX = _.min(xs)
        const maxX = _.max(xs)
        const minY = _.min(ys)
        const maxY = _.max(ys)

        this.borderRect = new Rect(minX, minY, maxX - minX, maxY - minY)
    }
    draw() {
        const ctx = this.spaceMaker.ctx
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(this.points[0][0], this.points[0][1])

        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i][0], this.points[i][1])
        }
        ctx.closePath();

        ctx.fillStyle = this.bgColor;
        if (this.isActive) {
            ctx.fillStyle = this.hoverColor;
            ctx.strokeStyle = Color(this.hoverColor).alpha(0.8).lighten(0.2)
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.fill();
        ctx.restore();
    }
    
    hit(pos) {
        let px = pos.x, py = pos.y, flag = false;
        let poly = this.points.map(m => new Point(m[0], m[1]))

        for (let i = 0, l = poly.length, j = l - 1; i < l; j = i, i++) {
            let sx = poly[i].x,
                sy = poly[i].y,
                tx = poly[j].x,
                ty = poly[j].y

            // 点与多边形顶点重合
            if ((sx === px && sy === py) || (tx === px && ty === py)) {
                return true
            }

            // 判断线段两端点是否在射线两侧
            if ((sy < py && ty >= py) || (sy >= py && ty < py)) {
                // 线段上与射线 Y 坐标相同的点的 X 坐标
                let x = sx + (py - sy) * (tx - sx) / (ty - sy)

                // 点在多边形的边上
                if (x === px) {
                    return true
                }

                // 射线穿过多边形的边界
                if (x > px) {
                    flag = !flag
                }
            }
        }

        // 射线穿过多边形边界的次数为奇数时点在多边形内
        return flag
    }
    setActive(isActive) {
        this.isActive = isActive;
        this.spaceMaker.drawMapImage()
    }
}