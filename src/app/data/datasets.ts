export interface DataPoint {
    id: number;
    features: number[]; // [x, y, z?]
    label?: number;     // for classification
}

export interface Dataset {
    id: string;
    name: string;
    type: 'regression' | 'clustering' | 'classification';
    description: string;
    features: string[];
    data: DataPoint[];
}

// 1. Study Hours vs Scores (Linear Regression - 2D)
const studyData: DataPoint[] = [];
for (let i = 0; i < 50; i++) {
    const hours = Math.random() * 10; // 0-10 features
    const noise = (Math.random() - 0.5) * 10;
    const score = 20 + 7 * hours + noise; // y = mx + c + noise
    studyData.push({ id: i, features: [hours], label: score });
}

// 2. Iris Projection (Clustering - 3D)
const irisData: DataPoint[] = [];
const centers = [[2, 2, 2], [6, 6, 6], [2, 8, 4]];
for (let i = 0; i < 90; i++) {
    const clusterIdx = Math.floor(i / 30);
    const center = centers[clusterIdx];
    const x = center[0] + (Math.random() - 0.5) * 2;
    const y = center[1] + (Math.random() - 0.5) * 2;
    const z = center[2] + (Math.random() - 0.5) * 2;
    irisData.push({ id: i, features: [x, y, z], label: clusterIdx });
}

export const DATASETS: Dataset[] = [
    {
        id: 'study-scores',
        name: 'Study Hours vs Scores',
        type: 'regression',
        description: 'Predict student scores based on study hours (2D).',
        features: ['Hours', 'Score'],
        data: studyData
    },
    {
        id: '3d-clusters',
        name: 'Customer Segments (3D)',
        type: 'clustering',
        description: 'Unsupervised grouping of customers based on 3 metrics.',
        features: ['Age', 'Spend', 'Activity'],
        data: irisData
    }
];
