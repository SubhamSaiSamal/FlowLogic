export const SURFACES = {
  bowl: {
    id: 'bowl',
    name: 'Convex Bowl',
    equation: 'z = x² + y²',
    domain: [-2, 2],
    zScale: 0.5,
    evaluate: (x, y) => x * x + y * y,
    gradient: (x, y) => [2 * x, 2 * y],
    startPos: [1.8, 1.8],
    defaultLr: 0.1
  },
  saddle: {
    id: 'saddle',
    name: 'Saddle Point',
    equation: 'z = x² - y²',
    domain: [-2, 2],
    zScale: 0.5,
    evaluate: (x, y) => x * x - y * y,
    gradient: (x, y) => [2 * x, -2 * y],
    startPos: [1.5, 0.1],
    defaultLr: 0.1
  },
  rosenbrock: {
    id: 'rosenbrock',
    name: 'Rosenbrock Valley',
    equation: 'z = (1-x)² + 100(y-x²)²',
    domain: [-2, 2],
    zScale: 0.005,
    evaluate: (x, y) => Math.pow(1 - x, 2) + 100 * Math.pow(y - x * x, 2),
    gradient: (x, y) => [
      -2 * (1 - x) - 400 * x * (y - x * x),
      200 * (y - x * x)
    ],
    startPos: [-1.2, 1.0],
    defaultLr: 0.001
  }
};
