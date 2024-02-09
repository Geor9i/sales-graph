import { canvas, ctx } from "./salesGraphConfig.js";

export default class Emitter {
  constructor(canvas, ctx, particleClass) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particleClass = particleClass;
    this.particles = [];
    this.particleSpacing = 0;
    this.particleWidth = 10;
    this.particleHeight = 200;
    this.particle = {
      x: 0,
      y: this.getParticleHeight(),
      color: "blue",
      stroke: false,
    };
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

  getParticleHeight() {
    const maxHeight = Math.min(this.canvas.height, this.particleHeight);
    return this.canvas.height - (this.canvas.height - maxHeight) / 2;
  }

  saleLineProps(salesTotal, topSales) {
    const maxHeight = Math.min(this.canvas.height, this.particleHeight);
    const result = {
      ...this.particle,
      height: -(salesTotal / topSales) * maxHeight,
      width: this.particleWidth,
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
    const topSales = this.starterData(salesDataArr);
    if (this.particleSpacing === 0) {
      this.particleSpacing = this.canvas.width / salesDataArr.length;
    }
    salesDataArr.forEach(([date, { salesTotal, transactionsTotal }]) => {
      const particle = new this.particleClass('rect');
      particle.particleProps(this.saleLineProps(salesTotal, topSales))
      this.particles.push([{ date, salesTotal, transactionsTotal }, particle]);
    });
  }

  starterData(salesData) {
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
      this.particles.forEach((data, i) => {
        const [salesData, particle] = data;
        const distanceX = particle.x - this.mouseX;
        const distanceY = particle.y - this.mouseY;
        const scaledDistanceX = distanceX * zoomChange;
        const scaledDistanceY = distanceY * zoomChange;
        particle.x = this.mouseX + scaledDistanceX;
        particle.width *= zoomChange;
        // particle.y = this.mouseY + scaledDistanceY;
        // particle.height *= zoomChange;
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
    });
  }
}
