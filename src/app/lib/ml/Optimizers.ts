/**
 * Optimizer implementations for Machine Learning models.
 * Supports SGD, Momentum, RMSProp, and Adam.
 */

export interface OptimizerConfig {
    learningRate: number;
    momentum?: number; // For Momentum/Adam
    beta1?: number; // For Adam
    beta2?: number; // For Adam
    epsilon?: number; // For Adam/RMSProp
}

export interface GradientTypes {
    w: number[]; // Weights gradients
    b: number;   // Bias gradient
}

export abstract class Optimizer {
    protected config: OptimizerConfig;

    constructor(config: OptimizerConfig) {
        this.config = config;
    }

    /**
     * Updates weights and bias based on gradients.
     * @param weights Current weights
     * @param bias Current bias
     * @param grads Gradients { w, b }
     * @returns Updated { weights, bias }
     */
    abstract step(weights: number[], bias: number, grads: GradientTypes): { weights: number[], bias: number };

    abstract reset(): void;
}

/**
 * Stochastic Gradient Descent (Standard)
 */
export class SGD extends Optimizer {
    step(weights: number[], bias: number, grads: GradientTypes) {
        const newWeights = weights.map((w, i) => w - this.config.learningRate * grads.w[i]);
        const newBias = bias - this.config.learningRate * grads.b;
        return { weights: newWeights, bias: newBias };
    }

    reset() { }
}

/**
 * SGD with Momentum
 * v = gamma * v + lr * grad
 * w = w - v
 */
export class Momentum extends Optimizer {
    private vWeights: number[] = [];
    private vBias: number = 0;

    step(weights: number[], bias: number, grads: GradientTypes) {
        const gamma = this.config.momentum || 0.9;
        const lr = this.config.learningRate;

        // Init velocity if empty
        if (this.vWeights.length !== weights.length) {
            this.vWeights = new Array(weights.length).fill(0);
        }

        // Update velocity and weights
        const newWeights = weights.map((w, i) => {
            this.vWeights[i] = gamma * this.vWeights[i] + lr * grads.w[i];
            return w - this.vWeights[i];
        });

        this.vBias = gamma * this.vBias + lr * grads.b;
        const newBias = bias - this.vBias;

        return { weights: newWeights, bias: newBias };
    }

    reset() {
        this.vWeights = [];
        this.vBias = 0;
    }
}

/**
 * Adam (Adaptive Moment Estimation)
 * Maintains moving averages of gradients (m) and squared gradients (v).
 */
export class Adam extends Optimizer {
    private mWeights: number[] = [];
    private vWeights: number[] = [];
    private mBias: number = 0;
    private vBias: number = 0;
    private t: number = 0; // Time step

    step(weights: number[], bias: number, grads: GradientTypes) {
        const alpha = this.config.learningRate;
        const beta1 = this.config.beta1 || 0.9;
        const beta2 = this.config.beta2 || 0.999;
        const eps = this.config.epsilon || 1e-8;

        this.t++;

        // Init state if empty
        if (this.mWeights.length !== weights.length) {
            this.mWeights = new Array(weights.length).fill(0);
            this.vWeights = new Array(weights.length).fill(0);
        }

        const newWeights = weights.map((w, i) => {
            const g = grads.w[i];

            // Update moments
            this.mWeights[i] = beta1 * this.mWeights[i] + (1 - beta1) * g;
            this.vWeights[i] = beta2 * this.vWeights[i] + (1 - beta2) * g * g;

            // Correct bias
            const mHat = this.mWeights[i] / (1 - Math.pow(beta1, this.t));
            const vHat = this.vWeights[i] / (1 - Math.pow(beta2, this.t));

            return w - alpha * mHat / (Math.sqrt(vHat) + eps);
        });

        const gBias = grads.b;
        this.mBias = beta1 * this.mBias + (1 - beta1) * gBias;
        this.vBias = beta2 * this.vBias + (1 - beta2) * gBias * gBias;

        const mHatBias = this.mBias / (1 - Math.pow(beta1, this.t));
        const vHatBias = this.vBias / (1 - Math.pow(beta2, this.t));

        const newBias = bias - alpha * mHatBias / (Math.sqrt(vHatBias) + eps);

        return { weights: newWeights, bias: newBias };
    }

    reset() {
        this.mWeights = [];
        this.vWeights = [];
        this.mBias = 0;
        this.vBias = 0;
        this.t = 0;
    }
}
