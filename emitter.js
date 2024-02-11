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
    this.graphColor = "blue";
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
      fontSize: 8,
      fontFamily: "Arial",
      textMessage: this.util.getDayAndMonth(date, { short: true }),
      x: this.lineX - this.lineWidth,
      y: this.getLineY() + 20,
      color: "green",
    };
  }

  dateLines(salesDataArr) {
    const months = {};
    const years = {};
    const initialDate = salesDataArr.shift()[0];
    const [initialYear, initialMonth, initialDay] = initialDate.split("/");
    //Counters for month and year
    months[initialMonth] = { counter: 1, startDate: initialDate, endDate: "" };
    years[initialYear] = { counter: 1, startDate: initialDate, endDate: "" };
    let tempDate = initialMonth;
    let tempMonth = initialMonth;
    let tempYear = initialYear;
    salesDataArr.forEach(([date, { salesTotal, transactionsTotal }], i) => {
      const [year, month, day] = date.split("/");
      if (months.hasOwnProperty(month)) {
        months[month].counter += 1;
      } else {
        months[tempMonth].endDate = tempDate;
        tempMonth = month;
        months[month] = { counter: 1, startDate: date, endDate: "" };
      }
      if (years.hasOwnProperty(year)) {
        years[year].counter += 1;
      } else {
        years[tempYear].endDate = tempDate;
        tempYear = year;
        years[year] = { counter: 1, startDate: date, endDate: "" };
      }
      tempDate = date;
      if (i === salesDataArr.length - 1) {
        if (months[month].endDate === "") {
          months[month].endDate = date;
        }
        if (years[year].endDate === "") {
          years[year].endDate = date;
        }
      }
    });
    let monthX = this.lineX;
    let yearX = this.lineX;
    for (let month in months) {
      const middle = Math.floor(months[month].counter / 2);
      const remainder = monthX - middle;
      const startLineStart = monthX;
      monthX = (monthX + this.lineSpacing) * middle;
      const startLineEnd = monthX - 1;
      monthX += remainder / 2;
      const endLineStart = monthX;
      monthX = (monthX + this.lineSpacing) * middle;
      const endLineEnd = monthX;
      monthX += remainder / 2;
      months[month] = {
        ...months[month],
        startLineStart,
        startLineEnd,
        endLineStart,
        endLineEnd,
      };
    }
    for (let year in years) {
      const middle = Math.floor(years[year].counter / 2);
      const remainder = yearX - middle;
      const startLineStart = yearX;
      yearX = (yearX + this.lineSpacing) * middle;
      const startLineEnd = yearX - 1;
      yearX += remainder / 2;
      const endLineStart = yearX;
      yearX = (yearX + this.lineSpacing) * middle;
      const endLineEnd = yearX;
      yearX += remainder / 2;
      years[year] = {
        ...years[year],
        startLineStart,
        startLineEnd,
        endLineStart,
        endLineEnd,
      };
    }
    this.particles.monthLines = [];
    for (let month in months) {
      const { startLineStart, startLineEnd, endLineStart, endLineEnd } =
        months[month];
      const particle = new this.particleClass("line");
      const Y = this.getLineY();
      const lineHeight = 60;
      let instruction1 = { prompt: "moveTo", x: startLineStart, y: Y };
      let instruction2 = { prompt: "lineTo", x: startLineStart, y: Y + lineHeight };
      let instruction3 = { prompt: "lineTo", x: startLineEnd, y: Y + lineHeight };
      let instruction4 = { prompt: "lineTo", x: startLineEnd, y: Y };
      let instruction5 = { prompt: "moveTo", x: endLineStart, y: Y };
      let instruction6 = { prompt: "lineTo", x: endLineStart, y: Y + lineHeight };
      let instruction7 = { prompt: "lineTo", x: endLineEnd, y: Y + lineHeight };
      let instruction8 = { prompt: "lineTo", x: endLineEnd, y: Y };
      const instructions = [
        instruction1,
        instruction2,
        instruction3,
        instruction4,
        instruction5,
        instruction6,
        instruction7,
        instruction8,
      ];
      particle.particleProps({lineData: instructions, stroke: true});
      this.particles.monthLines.push(particle);
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
    this.dateLines(salesDataArr);
    salesDataArr.forEach(([date, { salesTotal, transactionsTotal }]) => {
      //Graph lines particles
      const salesLineParticle = new this.particleClass("rect");
      const salesLineParticleProps = this.salesGraphLineProps(
        salesTotal,
        topSales
      );
      salesLineParticle.particleProps(salesLineParticleProps);
      this.particles.salesLines.push(salesLineParticle);
      const dateParticle = new this.particleClass("text");
      const dateParticleProps = this.salesGraphDateProps(date);
      dateParticle.particleProps(dateParticleProps);
      this.particles.dates.push(dateParticle);
    });
    console.log(this.particles);
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
      Object.keys(this.particles).forEach((particleGroup) => {
        this.particles[particleGroup].forEach((particle) => {
          const distanceX = particle.x - this.mouseX;
          const distanceY = particle.y - this.mouseY;
          const scaledDistanceX = distanceX * zoomChange;
          const scaledDistanceY = distanceY * zoomChange;
          particle.x = this.mouseX + scaledDistanceX;
          particle.width *= zoomChange;
          // particle.y = this.mouseY + scaledDistanceY;
          // particle.height *= zoomChange;
        });
      });
    }
  }

  dragParticles() {
    const deltaX = this.mouseX - this.oldMouseX; // Calculate the change in mouse position since the click
    const deltaY = this.mouseY - this.oldMouseY; // Calculate the change in mouse position since the click
    Object.keys(this.particles).forEach((particleGroup) => {
      this.particles[particleGroup].forEach((particle) => {
        particle.x += deltaX; // Update the particle's x-coordinate
        particle.y += deltaY; // Update the particle's x-coordinate
      });
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    Object.keys(this.particles).forEach((particleGroup) => {
      this.particles[particleGroup].forEach((particle) => {
        particle.draw();
      });
    });
    if (this.scroll.isActive) {
      this.scroll.isActive = false;
      this.zoom();
    }
  }
}
