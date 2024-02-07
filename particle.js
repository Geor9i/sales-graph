import { ctx } from "./salesGraphConfig.js";

export default class Particle {
    constructor({x, y, width, height, color, stroke = false, lineWidth = 1}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.stroke = stroke;
        this.lineWidth = lineWidth;
    }
    draw() {
        ctx.beginPath()
        ctx.lineWidth = this.lineWidth;
        ctx.rect(this.x, this.y, this.width, this.height);
        if (this.color) {
            ctx.fillStyle = this.color
            ctx.fill()
        }
        if (this.stroke) {
            ctx.stroke()
        }
        ctx.closePath();
    }

    update(props) {
        for (let prop in props) {
            if (this.hasOwnProperty(prop)) {
                this[prop] = props[prop]
            }
        }
    }

}