import { ctx } from "./salesGraphConfig.js";

export default class Particle {
  constructor(shape) {
    this.typeRange = ["arc", "rect"];
    if (
      typeof shape !== "string" ||
      !this.typeRange.includes(shape.toLowerCase())
    ) {
      throw new Error("Unknown Particle Type!");
    }
    this.shape = shape;
    this.particleBaseProps = {};
    this.particleSideProps = {};
    this.propOrder = {
      arc: ["x", "y", "radius", "startAngle", "endAngle"],
      rect: ["x", "y", "width", "height"],
      sideValues: ["stroke", "color", "lineWidth"],
    };
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
    };
    this.particleBaseProps = this.fillProps(props, baseProps, this.shape);
    this.particleSideProps = this.fillProps(props, baseProps, "sideValues");
  }

  fillProps(userProps, baseProps, propOrderKey) {
    const resultProps = {};
    this.propOrder[propOrderKey].forEach((propName) => {
      const selectedProp = userProps.hasOwnProperty(propName)
        ? userProps[propName]
        : baseProps[propName];
      resultProps[propName] = selectedProp;
    });
    return resultProps;
  }

  _getShapeProps() {
    return [...this.propOrder[this.shape]].map(propName => this.particleBaseProps[propName]);
  }

  /**
 * 
 * @param {*} props An Object containing the particle props for selected shape:
 * arc: x, y, radius, startAngle, endAngle;
 * rect: x, y, width, height;
    include also side props:
    stroke,
    lineWidth,
    color
 */
  draw() {
    ctx.beginPath();
    ctx.lineWidth = this.particleSideProps.lineWidth;
    ctx[this.shape](...this._getShapeProps());
    if (this.particleSideProps.color) {
      ctx.fillStyle = this.particleSideProps.color;
      ctx.fill();
    }
    if (this.particleSideProps.stroke) {
      ctx.stroke();
    }
    ctx.closePath();
  }

  update(props) {
    for (let prop in props) {
      if (this.particleBaseProps.hasOwnProperty(prop)) {
        this.particleBaseProps[prop] = props[prop];
      } else if (this.particleSideProps.hasOwnProperty(prop)) {
        this.particleSideProps[prop] = props[prop];
      }
    }
  }
}
