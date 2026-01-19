import { DataPoint } from '../../data/datasets';
import { Optimizer, SGD, OptimizerConfig } from './Optimizers';

export class LinearRegressionModel {
    weights: number[];
    bias: number;
    optimizer: Optimizer;

    // Track history for visualization
    history: { weights: number[], bias: number, loss: number }[] = [];

    constructor(featureCount: number = 1, optimizer: Optimizer | null = null, config: OptimizerConfig = { learningRate: 0.01 }) {
        this.weights = new Array(featureCount).fill(0);
        this.bias = 0;
        // Default to SGD if no optimizer provided
        this.optimizer = optimizer || new SGD(config);
    }

    setOptimizer(optimizer: Optimizer) {
        this.optimizer = optimizer;
    }

    predict(features: number[]): number {
        return features.reduce((sum, val, idx) => sum + val * this.weights[idx], this.bias);
    }

    /**
     * Computes loss and gradients for a batch
     */
    computeGradients(data: DataPoint[]): { loss: number, gradients: { w: number[], b: number } } {
        let dw = new Array(this.weights.length).fill(0);
        let db = 0;
        let totalLoss = 0;
        const n = data.length;

        for (const point of data) {
            if (point.label === undefined) continue;
            const prediction = this.predict(point.features);
            const error = prediction - point.label; // (pred - y)

            totalLoss += error * error; // MSE (without 1/n yet)

            for (let i = 0; i < this.weights.length; i++) {
                dw[i] += (2 / n) * error * point.features[i];
            }
            db += (2 / n) * error;
        }

        return { loss: totalLoss / n, gradients: { w: dw, b: db } };
    }

    // One step of Gradient Descent (Batch) using the active Optimizer
    step(data: DataPoint[]): { loss: number, weights: number[], bias: number } {
        const { loss, gradients } = this.computeGradients(data);

        // Delegate update to optimizer
        const update = this.optimizer.step(this.weights, this.bias, gradients);

        this.weights = update.weights;
        this.bias = update.bias;

        // Log history
        this.history.push({
            weights: [...this.weights],
            bias: this.bias,
            loss
        });

        // Limit history size to avoid memory explosion on long runs
        if (this.history.length > 5000) {
            this.history.shift();
        }

        return { loss, weights: this.weights, bias: this.bias };
    }

    reset() {
        this.weights.fill(0);
        this.bias = 0;
        this.optimizer.reset();
        this.history = [];
    }
}
