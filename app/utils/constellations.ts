import type { Point } from './starfield';

export interface Constellation {
  id: string;
  stars: Point[];
  paths: number[][];
  brightest: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Real star positions (J2000) of the twelve zodiac signs and the five Bronze Saints' constellations,
// projected flat as seen from Earth: north up, east to the left, the longer side scaled to 1.
export const CONSTELLATIONS: Constellation[] = [
  {
    id: 'aries',
    stars: [
      [0, 0],
      [0.747, 0.322],
      [0.976, 0.525],
      [1, 0.642],
    ],
    paths: [[0, 1, 2, 3]],
    brightest: 1,
  },
  {
    id: 'taurus',
    stars: [
      [0, 0.234],
      [0.459, 0.412],
      [0.512, 0.432],
      [0.578, 0.44],
      [0.555, 0.382],
      [0.514, 0.331],
      [0.108, 0],
      [0.72, 0.535],
      [0.98, 0.613],
      [0.705, 0.736],
      [1, 0.634],
      [0.918, 0.913],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 6],
      [3, 7, 8, 9],
      [8, 10, 11],
    ],
    brightest: 1,
  },
  {
    id: 'gemini',
    stars: [
      [1, 0.448],
      [0.907, 0.455],
      [0.666, 0.339],
      [0.372, 0.093],
      [0.128, 0],
      [0, 0.182],
      [0.099, 0.245],
      [0.264, 0.492],
      [0.444, 0.563],
      [0.753, 0.762],
      [0.668, 0.938],
      [0.28, 0.758],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      [7, 11],
    ],
    brightest: 5,
  },
  {
    id: 'cancer',
    stars: [
      [0, 0.864],
      [0.174, 0.545],
      [0.191, 0.377],
      [0.153, 0],
      [0.53, 1],
    ],
    paths: [
      [0, 1, 2, 3],
      [1, 4],
    ],
    brightest: 4,
  },
  {
    id: 'leo',
    stars: [
      [0.838, 0.479],
      [0.841, 0.317],
      [0.738, 0.217],
      [0.312, 0.185],
      [0, 0.366],
      [0.301, 0.357],
      [0.761, 0.097],
      [0.941, 0],
      [1, 0.072],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 0],
      [2, 6, 7, 8],
    ],
    brightest: 0,
  },
  {
    id: 'virgo',
    stars: [
      [1, 0.084],
      [0.97, 0.194],
      [0.801, 0.248],
      [0.682, 0.265],
      [0.532, 0.351],
      [0.452, 0.471],
      [0.178, 0.365],
      [0.02, 0.362],
      [0.573, 0],
      [0.607, 0.162],
      [0.402, 0.246],
      [0.257, 0.201],
      [0, 0.191],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 6, 7],
      [8, 9, 3],
      [4, 10, 11, 12],
    ],
    brightest: 5,
  },
  {
    id: 'libra',
    stars: [
      [0.373, 0.778],
      [0.539, 0.334],
      [0.235, 0],
      [0.016, 0.269],
      [0.015, 0.918],
      [0, 1],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5],
      [1, 3],
    ],
    brightest: 2,
  },
  {
    id: 'scorpius',
    stars: [
      [0.957, 0.282],
      [0.961, 0.129],
      [0.922, 0],
      [0.743, 0.244],
      [0.662, 0.276],
      [0.598, 0.35],
      [0.467, 0.604],
      [0.453, 0.762],
      [0.433, 0.945],
      [0.298, 0.989],
      [0.1, 1],
      [0, 0.89],
      [0.036, 0.836],
      [0.101, 0.744],
    ],
    paths: [
      [0, 1, 2],
      [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    ],
    brightest: 4,
  },
  {
    id: 'sagittarius',
    stars: [
      [1, 0.736],
      [0.81, 0.688],
      [0.76, 0.952],
      [0.29, 0.687],
      [0.23, 0.562],
      [0.378, 0.478],
      [0.501, 0.517],
      [0.731, 0.43],
      [0.933, 0.186],
      [0.246, 0.218],
      [0.176, 0.179],
      [0, 0],
    ],
    paths: [
      [0, 1, 2, 0],
      [2, 3, 4, 5, 6, 1, 7, 6, 3],
      [7, 8],
      [5, 9, 10, 11],
    ],
    brightest: 2,
  },
  {
    id: 'capricornus',
    stars: [
      [1, 0],
      [0.955, 0.104],
      [0.861, 0.24],
      [0.665, 0.576],
      [0.605, 0.651],
      [0.239, 0.448],
      [0, 0.17],
      [0.08, 0.191],
      [0.278, 0.191],
      [0.456, 0.207],
    ],
    paths: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]],
    brightest: 6,
  },
  {
    id: 'aquarius',
    stars: [
      [1, 0.267],
      [0.73, 0.161],
      [0.535, 0.039],
      [0.445, 0.063],
      [0.405, 0.032],
      [0.368, 0.034],
      [0.273, 0.203],
      [0.131, 0.242],
      [0.186, 0.517],
      [0.527, 0.344],
      [0.471, 0.207],
      [0.425, 0],
      [0.11, 0.496],
      [0, 0.452],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [1, 9],
      [2, 10],
      [4, 11],
      [12, 7, 13],
    ],
    brightest: 1,
  },
  {
    id: 'pisces',
    stars: [
      [0.311, 0.14],
      [0.325, 0],
      [0.281, 0.07],
      [0.321, 0.228],
      [0.203, 0.358],
      [0.114, 0.501],
      [0, 0.653],
      [0.056, 0.644],
      [0.134, 0.589],
      [0.203, 0.575],
      [0.301, 0.544],
      [0.364, 0.537],
      [0.446, 0.545],
      [0.732, 0.559],
      [0.85, 0.585],
      [0.925, 0.565],
      [0.976, 0.588],
      [1, 0.639],
      [0.939, 0.691],
      [0.842, 0.679],
      [0.813, 0.638],
    ],
    paths: [[0, 1, 2, 0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 14]],
    brightest: 4,
  },
  {
    id: 'pegasus',
    stars: [
      [0.79, 0],
      [0.603, 0.088],
      [0.481, 0.143],
      [0.089, 0.072],
      [0, 0.456],
      [0.464, 0.485],
      [0.579, 0.568],
      [0.613, 0.604],
      [0.827, 0.73],
      [1, 0.621],
      [0.561, 0.238],
      [0.581, 0.266],
      [0.819, 0.211],
      [0.956, 0.191],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [5, 2, 10, 11, 12, 13],
    ],
    brightest: 9,
  },
  {
    id: 'draco',
    stars: [
      [0.136, 0.768],
      [0.081, 0.912],
      [0.198, 0.913],
      [0.206, 0.832],
      [0.027, 0.393],
      [0.188, 0.366],
      [0.326, 0.557],
      [0.459, 0.671],
      [0.544, 0.742],
      [0.67, 0.701],
      [0.843, 0.449],
      [0.91, 0.154],
      [1, 0],
      [0, 0.279],
    ],
    paths: [
      [0, 1, 2, 3, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      [4, 13],
    ],
    brightest: 1,
  },
  {
    id: 'cygnus',
    stars: [
      [0, 0.885],
      [0.245, 0.764],
      [0.446, 0.535],
      [0.704, 0.344],
      [0.778, 0.077],
      [0.845, 0],
      [0.323, 0.334],
      [0.642, 0.733],
      [0.875, 1],
    ],
    paths: [
      [0, 1, 2, 3, 4, 5],
      [6, 2, 7, 8],
    ],
    brightest: 6,
  },
  {
    id: 'andromeda',
    stars: [
      [0, 0.159],
      [0.285, 0.401],
      [0.465, 0.544],
      [0.665, 0.588],
      [0.346, 0.766],
      [0.413, 0.741],
      [0.471, 0.59],
      [0.479, 0.461],
      [0.79, 0.149],
      [1, 0.126],
      [0.364, 0.321],
      [0.405, 0.247],
      [0.309, 0.061],
      [0.171, 0],
    ],
    paths: [
      [0, 1, 2, 3],
      [4, 5, 6, 2, 7, 8, 9],
      [1, 10, 11, 12, 13],
    ],
    brightest: 3,
  },
  {
    id: 'phoenix',
    stars: [
      [0.814, 0],
      [0.296, 0.297],
      [0, 0.072],
      [0.007, 0.485],
      [0.289, 0.908],
      [1, 0.272],
    ],
    paths: [[0, 1, 2, 3, 4, 1, 5, 0]],
    brightest: 0,
  },
];

const FIT_ORIENTATIONS = 18;

const boundsOf = (points: Point[]): Box => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
};

const rotated = (points: Point[], angle: number): Point[] => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
};

export const segmentsOf = ({ paths }: Constellation): [from: number, to: number][] =>
  paths.flatMap((path) => path.slice(1).map((star, index): [number, number] => [path[index]!, star]));

// Turns the figure to whichever orientation fills the box best, so a long constellation
// stands upright in a narrow page margin instead of shrinking to fit across it.
export const fitConstellation = ({ stars }: Constellation, box: Box, turn: number): Point[] => {
  const { points, bounds, scale } = Array.from({ length: FIT_ORIENTATIONS }, (_, step) => {
    const points = rotated(stars, turn + (step * Math.PI) / FIT_ORIENTATIONS);
    const bounds = boundsOf(points);
    return { points, bounds, scale: Math.min(box.width / bounds.width, box.height / bounds.height) };
  }).reduce((best, candidate) => (candidate.scale > best.scale ? candidate : best));
  const left = box.x + (box.width - bounds.width * scale) / 2 - bounds.x * scale;
  const top = box.y + (box.height - bounds.height * scale) / 2 - bounds.y * scale;
  return points.map(([x, y]) => [left + x * scale, top + y * scale]);
};
