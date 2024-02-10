import { ctx } from "./salesGraphConfig.js";

export default class Particle {
  constructor(shape) {
    this.typeRange = ["arc", "rect", 'text'];
    if (
      typeof shape !== "string" ||
      !this.typeRange.includes(shape.toLowerCase())
    ) {
      throw new Error("Unknown Particle Type!");
    }
    this.shape = shape;
  }

  particleProps(props) {
    const baseProps = {
      x: 0,
      y: 0,
      radius: 0,
      width: 0,
      height: 0,
      startAngle: 0,
      endAngle: Math.PI * 2,
      stroke: false,
      color: false,
      lineWidth: 1,
      fontSize: 16,
      fontFamily: 'Arial',
      textMessage: '',
      strokeText: false
    };
    const requiredProps = [
      ...this._getPropOrder(this.shape),
      ...this._getPropOrder("sideValues"),
    ];
    Object.keys(baseProps).forEach((propName) => {
      const selectedProp = props.hasOwnProperty(propName)
        ? props[propName]
        : baseProps[propName];
      if (requiredProps.includes(propName)) {
        this[propName] = selectedProp;
      }
    });
  }

  _getPropOrder(shape) {
    const propOrder = {
      arc: ["x", "y", "radius", "startAngle", "endAngle"],
      rect: ["x", "y", "width", "height"],
      text: ['fontSize', 'fontFamily', 'textMessage', 'x', 'y'],
      sideValues: ["stroke", "color", "lineWidth", "strokeText"],
    };
    return propOrder[shape];
  }

  _getPropArr() {
    return [...this._getPropOrder(this.shape)].map(
      (propName) => this[propName]
    );
  }

  /**
 * 
 * @param {*} props An Object containing the particle props for selected shape:
 * arc: x, y, radius, startAngle, endAngle;
 * rect: x, y, width, height;
    - include also side props:
      stroke,
      lineWidth,  
      color
 */
  draw() {
    ctx.beginPath();
    ctx.lineWidth = this.lineWidth;
    if (this.shape === 'text') {
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx[this.strokeText ? 'strokeText' : 'fillText'](this.textMessage, this.x, this.y)
    }else {
      ctx[this.shape](...this._getPropArr());
    }
    if (this.color) {
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    if (this.stroke) {
      ctx.stroke();
    }
    ctx.closePath();
  }

  update(props) {
    for (let prop in props) {
      if (this.hasOwnProperty(prop)) {
        this[prop] = props[prop];
      }
    }
  }
}
