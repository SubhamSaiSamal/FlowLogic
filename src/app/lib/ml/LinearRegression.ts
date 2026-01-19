import { DataPoint } from '../../data/datasets';

export class LinearRegressionModel {
    weights: number[];
    bias: number;
    learningRate: number;

    constructor(featureCount: number = 1, learningRate: number = 0.01) {
        this.weights = new Array(featureCount).fill(0);
        this.bias = 0;
        this.learningRate = learningRate;
    }

    predict(features: number[]): number {
        return features.reduce((sum, val, idx) => sum + val * this.weights[idx], this.bias);
    }

    // One step of Gradient Descent (Batch)
    step(data: DataPoint[]): { loss: number, gradients: { w: number[], b: number } } {
        let dw = new Array(this.weights.length).fill(0);
        let db = 0;
        let totalLoss = 0;
        const n = data.length;

        for (const point of data) {
            if (point.label === undefined) continue;
            const prediction = this.predict(point.features);
            const error = prediction - point.label;

            totalLoss += error * error;

            for (let i = 0; i < this.weights.length; i++) {
                dw[i] += (2 / n) * error * point.features[i];
            }
            db += (2 / n) * error;
        }

        // Update parameters
        for (let i = 0; i < this.weights.length; i++) {
            this.weights[i] -= this.learningRate * dw[i];
        }
        this.bias -= this.learningRate * db;

        return { loss: totalLoss / n, gradients: { w: dw, b: db } };
    }

    reset() {
        this.weights.fill(0);
        this.bias = 0;
    }
}
