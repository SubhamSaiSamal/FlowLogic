export type GraphCategory =
  | 'optimization'
  | 'regression'
  | 'classification'
  | 'evaluation';

export interface GraphDefinition {
  id: string;
  category: GraphCategory;
  title: string;
  description: string;
  mode: 'visualize' | 'sandbox';
  status: 'implemented' | 'planned';
}

export const graphRegistry: GraphDefinition[] = [
  {
    id: 'optimization-function-curve',
    category: 'optimization',
    title: 'Function curve f(x)',
    description: 'Shows the optimization landscape for the selected function.',
    mode: 'visualize',
    status: 'implemented',
  },
  {
    id: 'optimization-gradient-path',
    category: 'optimization',
    title: 'Gradient descent path',
    description: 'Displays the trajectory of gradient descent steps on f(x).',
    mode: 'visualize',
    status: 'implemented',
  },
  {
    id: 'optimization-loss-vs-iteration',
    category: 'optimization',
    title: 'Loss vs iteration',
    description: 'Plots loss value over iterations for a gradient descent run.',
    mode: 'visualize',
    status: 'implemented',
  },
  {
    id: 'optimization-sandbox-landscape',
    category: 'optimization',
    title: 'Sandbox landscape',
    description: 'Interactive function view for free experimentation in Sandbox.',
    mode: 'sandbox',
    status: 'implemented',
  },
  // Placeholders for future expansion (regression, classification, evaluation)
  {
    id: 'regression-scatter-line',
    category: 'regression',
    title: 'Scatter + regression line',
    description: 'Visualizes regression fit on synthetic data.',
    mode: 'visualize',
    status: 'planned',
  },
  {
    id: 'classification-boundary',
    category: 'classification',
    title: 'Decision boundary',
    description: 'Shows 2D classification regions and decision boundary.',
    mode: 'visualize',
    status: 'planned',
  },
  {
    id: 'evaluation-learning-curve',
    category: 'evaluation',
    title: 'Learning curve',
    description: 'Training vs validation performance over time.',
    mode: 'visualize',
    status: 'planned',
  },
];

