export const canvas = document.getElementById('sales-graph')
const main = document.querySelector('main');
const mainD = main.getBoundingClientRect();
canvas.width = mainD.width / 1.8;
canvas.height = mainD.height / 2;
export const ctx = canvas.getContext('2d');

