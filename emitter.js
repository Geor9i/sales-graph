import { canvas, ctx } from "./salesGraphConfig.js";
import DateUtil from "./dateUtil.js";

export default class Emitter {
  constructor(canvas, ctx, particleClass) {
    this.util = new DateUtil();
    this.canvas = canvas;
    this.ctx = ctx;
    this.particleClass = particleClass;
    this.particles = {};
    this.lineSpacing = 0;
    this.lineWidth = 10;
    this.lineHeight = 200;
    this.lineX = 0;
    this.graphColor = 'blue';
    this.mouseX = 0;
    this.oldMouseX = 0;
    this.mouseY = 0;
    this.oldMouseY = 0;
    this.mouseDown = false;
    this.scroll = {
      direction: null,
      isActive: false,
      value: 0,
    };
    this.zoomFactor = 0;
    this.maxZoom = 30;
    this.zoomSpeed = 0.05;
    this.mouseEvents();
  }

  getLineY() {
    const maxHeight = Math.min(this.canvas.height, this.lineHeight);
    return this.canvas.height - (this.canvas.height - maxHeight) / 2;
  }

  salesGraphLineProps(salesTotal, topSales) {
    const maxHeight = Math.min(this.canvas.height, this.lineHeight);
    const result = {
      x: this.lineX,
      y: this.getLineY(),
      color: this.graphColor,
      stroke: true,
      height: -(salesTotal / topSales) * maxHeight,
      width: this.lineWidth,
    };
    this.lineX += this.lineSpacing;
    return result;
  }

  salesGraphDateProps(date) {
    return {
      fontSize: 16,
      fontFamily: 'Arial',
      textMessage: `03 May`,
      x: this.lineX - this.lineWidth,
      y: this.getLineY() + 50,
      color: 'green'
    }
  }

  mouseEvents() {
    canvas.addEventListener("mousemove", (e) => {
      this.oldMouseX = this.mouseX;
      this.oldMouseY = this.mouseY;
      this.mouseX = e.offsetX;
      this.mouseY = e.offsetY;
      if (
        this.mouseX < 0 ||
        this.mouseX > canvas.width ||
        this.mouseY < 0 ||
        this.mouseY > canvas.height
      ) {
        return;
      }
      if (this.mouseDown) {
        this.dragParticles();
      }
    });

    canvas.addEventListener("wheel", (e) => {
      const scrollIncrement = e.deltaY < 0 ? 1 : -1;
      this.scroll = {
        direction: scrollIncrement,
        isActive: true,
        value: this.scroll.value + scrollIncrement,
      };
    });

    canvas.addEventListener("mousedown", (e) => {
      this.mouseDown = true;
    });

    window.addEventListener("mouseup", () => {
      this.mouseDown = false;
    });
  }

  init(salesData) {
    const salesDataArr = Array.from(salesData);
    const topSales = this.getHighestSales(salesDataArr);
    if (this.lineSpacing === 0) {
      this.lineSpacing = this.canvas.width / salesDataArr.length;
    }
    this.particles.salesLines = [];
    this.particles.dates = [];
    salesDataArr.forEach(([date, { salesTotal, transactionsTotal }]) => {
      //Graph lines particles
      const salesLineParticle = new this.particleClass('rect');
      const salesLineParticleProps = this.salesGraphLineProps(salesTotal, topSales);
      salesLineParticle.particleProps(salesLineParticleProps);
      this.particles.salesLines.push(salesLineParticle);
      const dateParticle = new this.particleClass('text');
      const dateParticleProps = this.salesGraphDateProps(date);
      dateParticle.particleProps(dateParticleProps)
      this.particles.dates.push(dateParticle);

    });
    console.log(this.particles.dates);
  }

  getHighestSales(salesData) {
    return salesData.reduce(
      (top, [date, { salesTotal, transactionsTotal }]) => {
        if (top < salesTotal) {
          top = salesTotal;
        }
        return top;
      },
      0
    );
  }

  zoom() {
    if (
      (this.scroll.direction > 0 && this.zoomFactor < this.maxZoom) ||
      (this.scroll.direction < 0 && this.zoomFactor > 0)
    ) {
      const oldZoomFactor = this.zoomFactor;
      this.zoomFactor += this.scroll.direction;
      const zoomRatio = Math.exp(this.zoomFactor * this.zoomSpeed);
      const oldZoomRatio = Math.exp(oldZoomFactor * this.zoomSpeed);
      // Calculate the change in zoom ratio
      const zoomChange = zoomRatio / oldZoomRatio;
      Object.keys(this.particles).forEach(particleGroup =>{
        this.particles[particleGroup].forEach(particle => {
          const distanceX = particle.x - this.mouseX;
        const distanceY = particle.y - this.mouseY;
        const scaledDistanceX = distanceX * zoomChange;
        const scaledDistanceY = distanceY * zoomChange;
        particle.x = this.mouseX + scaledDistanceX;
        particle.width *= zoomChange;
        // particle.y = this.mouseY + scaledDistanceY;
        // particle.height *= zoomChange;
        })
      })
    }
  }

  dragParticles() {
    const deltaX = this.mouseX - this.oldMouseX; // Calculate the change in mouse position since the click
    const deltaY = this.mouseY - this.oldMouseY; // Calculate the change in mouse position since the click
    Object.keys(this.particles).forEach(particleGroup =>{
      this.particles[particleGroup].forEach(particle => {
        particle.x += deltaX; // Update the particle's x-coordinate
      particle.y += deltaY; // Update the particle's x-coordinate
      })
    })
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    Object.keys(this.particles).forEach(particleGroup =>{
      this.particles[particleGroup].forEach(particle => {
        particle.draw();
      })
    })
    if (this.scroll.isActive) {
      this.scroll.isActive = false;
      this.zoom();
    }
  }
}
