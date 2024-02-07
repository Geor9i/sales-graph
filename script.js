import Emitter from "./emitter.js";
import Particle from "./particle.js";
import { canvas, ctx } from "./salesGraphConfig.js";
import { salesData } from "./salesData.js";

const emitter = new Emitter(canvas, ctx, Particle);

emitter.create(salesData);
emitter.animate();
