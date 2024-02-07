import { canvas, ctx } from "./salesGraphConfig.js";

export default class Emitter {
  constructor(canvas, ctx, particleClass) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particleClass = particleClass;
    this.particles = [];
    this.particleSpacing = 10;
    this.particle = {
      x: 0,
      y: this.canvas.height - 150,
      width: 5,
      height: 150,
      color: "blue",
      stroke: false,
    };
    this.graphTopSales = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.scroll = {
      direction: null,
      isActive: false,
      value: 0,
    };
    this.maxZoom = 30;
    this.zoomSpeed = 10;
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
      this.mouseX = e.offsetX;
      this.mouseY = e.offsetY;
    });

    canvas.addEventListener("wheel", (e) => {
      const scrollIncrement = e.deltaY < 0 ? 1 : -1;
        this.scroll = {
          direction: scrollIncrement,
          isActive: true,
          value: this.scroll.value + scrollIncrement
        };
    });
  }

  create(salesData) {
    const salesDataArr = Array.from(salesData);
    this.starterData(salesDataArr);
    salesDataArr.forEach((day) => {
      const { salesTotal, transactionsTotal } = day[1];
      const particle = new this.particleClass(
        this.getParticleProps(salesTotal)
      );
      this.particles.push([salesTotal, particle]);
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
    const zoomIncrement = this.scroll.direction * this.zoomSpeed;

    // Adjust the positions of particles based on zoom direction and speed
    this.particles.forEach((data, i) => {
        const [sales, particle] = data;
        const distanceX = particle.x - this.mouseX;
        const directionX = Math.sign(distanceX) * this.scroll.direction;
        const directionSpeed = Math.abs(distanceX) * 0.2; // Use absolute distance to ensure symmetrical movement
        const newX = particle.x + (directionX * directionSpeed);
        particle.x = newX;
    });
}

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    this.particles.forEach(([salesTotal, particle]) => {
      particle.draw();
      if (this.scroll.isActive) {
        this.scroll.isActive = false;
        this.zoom();
      }
      // particle.update(this.getParticleProps())
    });
  }
}
