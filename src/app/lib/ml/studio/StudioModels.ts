export class KMeansEngine {
    k: number;
    centroids: number[][] = [];
    assignments: number[] = [];

    constructor(k: number) {
        this.k = k;
    }

    initialize(data: number[][]) {
        // Random centroids initialization
        if (data.length < this.k) throw new Error("Not enough data points for K");
        const indices = new Set<number>();
        while (indices.size < this.k) {
            indices.add(Math.floor(Math.random() * data.length));
        }
        this.centroids = Array.from(indices).map(i => [...data[i]]);
        this.assignments = new Array(data.length).fill(-1);
    }

    step(data: number[][]): { moved: boolean, inertia: number } {
        if (this.centroids.length === 0) this.initialize(data);

        // 1. Assign points to nearest centroid
        let changed = false;
        let inertia = 0;

        for (let i = 0; i < data.length; i++) {
            const point = data[i];
            let minDist = Infinity;
            let label = -1;

            for (let c = 0; c < this.k; c++) {
                const dist = this.euclideanDist(point, this.centroids[c]);
                if (dist < minDist) {
                    minDist = dist;
                    label = c;
                }
            }

            if (this.assignments[i] !== label) {
                this.assignments[i] = label;
                changed = true;
            }
            inertia += minDist * minDist;
        }

        // 2. Update Centroids
        if (changed) {
            for (let c = 0; c < this.k; c++) {
                const pointsInCluster = data.filter((_, idx) => this.assignments[idx] === c);
                if (pointsInCluster.length > 0) {
                    // Average position
                    const dim = data[0].length;
                    const newCentroid = new Array(dim).fill(0);
                    for (let p of pointsInCluster) {
                        for (let d = 0; d < dim; d++) newCentroid[d] += p[d];
                    }
                    this.centroids[c] = newCentroid.map(v => v / pointsInCluster.length);
                } else {
                    // Re-init empty centroid randomly (simple recovery)
                    const randIdx = Math.floor(Math.random() * data.length);
                    this.centroids[c] = [...data[randIdx]];
                }
            }
        }

        return { moved: changed, inertia };
    }

    private euclideanDist(a: number[], b: number[]) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
        return Math.sqrt(sum);
    }
}
