export class KMeans {
    k: number;
    centroids: number[][] = [];
    assignments: number[] = [];
    history: { centroids: number[][]; assignments: number[] }[] = [];

    constructor(k: number = 3) {
        this.k = k;
    }

    initialize(data: number[][]) {
        // Randomly choose k data points as initial centroids
        const indices = new Set<number>();
        while (indices.size < this.k) {
            indices.add(Math.floor(Math.random() * data.length));
        }
        this.centroids = Array.from(indices).map(i => [...data[i]]);
        this.history = [];
    }

    step(data: number[][]) {
        if (this.centroids.length === 0) this.initialize(data);

        // Assign points to nearest centroid
        this.assignments = data.map(point => {
            let minDist = Infinity;
            let clusterIdx = 0;
            for (let i = 0; i < this.k; i++) {
                const dist = this.euclideanDistance(point, this.centroids[i]);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIdx = i;
                }
            }
            return clusterIdx;
        });

        // Update centroids
        const newCentroids = Array.from({ length: this.k }, () => new Array(data[0].length).fill(0));
        const counts = new Array(this.k).fill(0);

        data.forEach((point, idx) => {
            const cluster = this.assignments[idx];
            for (let i = 0; i < point.length; i++) {
                newCentroids[cluster][i] += point[i];
            }
            counts[cluster]++;
        });

        for (let i = 0; i < this.k; i++) {
            if (counts[i] > 0) {
                for (let j = 0; j < newCentroids[i].length; j++) {
                    newCentroids[i][j] /= counts[i];
                }
            } else {
                // Re-initialize empty cluster to random point
                const randomIdx = Math.floor(Math.random() * data.length);
                newCentroids[i] = [...data[randomIdx]];
            }
        }

        this.centroids = newCentroids;
        this.history.push({
            centroids: JSON.parse(JSON.stringify(this.centroids)),
            assignments: [...this.assignments]
        });

        return { loss: 0 }; // KMeans uses inertia, ignoring for now or calculate sum sq dist
    }

    euclideanDistance(a: number[], b: number[]) {
        return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
    }

    reset() {
        this.centroids = [];
        this.assignments = [];
        this.history = [];
    }
}
