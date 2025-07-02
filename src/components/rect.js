import { Point } from './point'
export class Rect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.ex = new Point(x + width,y + height)
        this.center = new Point(x + width / 2, y + height / 2)
        this.topCenter = new Point(x + width / 2, y);
    }
}
