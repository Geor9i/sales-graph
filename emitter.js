import { canvas, ctx } from "./salesGraphConfig.js";

export default class Emitter {
  constructor(canvas, ctx, particleClass) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particleClass = particleClass;
    this.particles = [];
    this.particleSpacing = 10;
    this.particleWidth = 5;
    this.particle = {
      x: 0,
      y: this.canvas.height - 150,
      width: this.particleWidth,
      height: 150,
      color: "blue",
      stroke: false,
    };
    this.graphTopSales = 0;
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
    this.zoomSpeed = 0.1;
    this.zoomBoundary = {
      x: 0,
      y: 0,
      width: this.canvas.width / 4,
      height: this.canvas.height / 4,
    };
    this.mouseEvents();
  }

  getParticleProps(salesTotal) {
    const result = {
      ...this.particle,
      height: -(salesTotal / this.graphTopSales) * 200,
    };
    this.particle.x += this.particleSpacing;
    return result;
  }

  mouseEvents() {
    canvas.addEventListener("mousemove", (e) => {
      this.oldMouseX = this.mouseX;
      this.oldMouseY = this.mouseY;
      this.mouseX = e.offsetX;
      this.mouseY = e.offsetY;
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

    canvas.addEventListener("mouseup", () => {
      this.mouseDown = false;
    });
  }

  create(salesData) {
    const salesDataArr = Array.from(salesData);
    this.starterData(salesDataArr);
    salesDataArr.forEach(([date, { salesTotal, transactionsTotal }]) => {
      const particle = new this.particleClass(
        this.getParticleProps(salesTotal)
      );
      this.particles.push([{ date, salesTotal, transactionsTotal }, particle]);
    });
  }

  starterData(salesData) {
    this.graphTopSales = salesData.reduce(
      (top, [date, { salesTotal, transactionsTotal }]) => {
        if (top < salesTotal) {
          top = salesTotal;
        }
        return top;
      },
      0
    );
    this.elementCount = salesData.length;
    this.particleSpacing = this.canvas.width / this.elementCount;
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
      console.log(zoomChange);
      this.particles.forEach((data, i) => {
        const [salesData, particle] = data;
        const distanceX = particle.x - this.mouseX;
        const scaledDistanceX = distanceX * zoomChange;
        particle.x = this.mouseX + scaledDistanceX;
        particle.width *= zoomChange;
      });
    }
  }

  dragParticles() {
    const deltaX = this.mouseX - this.oldMouseX; // Calculate the change in mouse position since the click
    const deltaY = this.mouseY - this.oldMouseY; // Calculate the change in mouse position since the click
    this.particles.forEach((data) => {
      const [salesData, particle] = data;
      particle.x += deltaX; // Update the particle's x-coordinate
      particle.y += deltaY; // Update the particle's x-coordinate
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    this.particles.forEach(([salesData, particle]) => {
      particle.draw();
      if (this.scroll.isActive) {
        this.scroll.isActive = false;
        this.zoom();
      }
      // particle.update(this.getParticleProps())
    });
  }
}
