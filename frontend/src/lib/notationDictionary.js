export const notationDictionary = {
  gradient: {
    symbol: '∇',
    name: 'Gradient',
    desc: 'The vector of partial derivatives. Points in the direction of steepest ascent.',
    code: 'loss.backward()'
  },
  partial: {
    symbol: '∂',
    name: 'Partial Derivative',
    desc: 'How much the output changes if you tweak just ONE variable, keeping others constant.',
    code: 'torch.autograd.grad(y, x)'
  },
  summation: {
    symbol: 'Σ',
    name: 'Summation',
    desc: 'Add up all the values in a sequence.',
    code: 'np.sum(x)'
  },
  learning_rate: {
    symbol: 'α',
    name: 'Learning Rate',
    desc: 'The step size taken during gradient descent. Too high = chaos, too low = slow.',
    code: 'optimizer.step(lr=0.01)'
  },
  jacobian: {
    symbol: 'J',
    name: 'Jacobian',
    desc: 'A matrix of all first-order partial derivatives of a vector-valued function.',
    code: 'torch.autograd.functional.jacobian(func, inputs)'
  },
  hessian: {
    symbol: 'H',
    name: 'Hessian',
    desc: 'A square matrix of second-order partial derivatives describing the local curvature of a function.',
    code: 'torch.autograd.functional.hessian(func, inputs)'
  },
  matrix_multiplication: {
    symbol: '×',
    name: 'Matrix Multiplication',
    desc: 'An operation that produces a matrix from two matrices. Essential for neural network layers.',
    code: 'torch.matmul(A, B)'
  },
  dot_product: {
    symbol: '·',
    name: 'Dot Product',
    desc: 'An algebraic operation that takes two equal-length sequences of numbers and returns a single number.',
    code: 'torch.dot(a, b)'
  },
  l1_regularization: {
    symbol: 'L1',
    name: 'L1 Regularization',
    desc: 'Adds the absolute value of magnitude of coefficient as penalty term to the loss function (Lasso).',
    code: 'torch.norm(weights, p=1)'
  },
  l2_regularization: {
    symbol: 'L2',
    name: 'L2 Regularization',
    desc: 'Adds the squared magnitude of coefficient as penalty term to the loss function (Ridge).',
    code: 'torch.norm(weights, p=2)'
  },
  sigmoid: {
    symbol: 'σ',
    name: 'Sigmoid',
    desc: 'An activation function that maps any input value to a value between 0 and 1.',
    code: 'torch.sigmoid(x)'
  },
  relu: {
    symbol: 'R',
    name: 'ReLU',
    desc: 'Rectified Linear Unit. An activation function that outputs the input directly if positive, otherwise zero.',
    code: 'torch.relu(x)'
  },
  softmax: {
    symbol: 'S',
    name: 'Softmax',
    desc: 'Converts a vector of numbers into a vector of probabilities that sum to 1.',
    code: 'torch.softmax(x, dim=-1)'
  },
  epoch: {
    symbol: 'E',
    name: 'Epoch',
    desc: 'One complete pass through the entire training dataset.',
    code: 'for epoch in range(num_epochs):'
  },
  batch_size: {
    symbol: 'B',
    name: 'Batch Size',
    desc: 'The number of training examples utilized in one iteration.',
    code: 'DataLoader(dataset, batch_size=32)'
  }
};
