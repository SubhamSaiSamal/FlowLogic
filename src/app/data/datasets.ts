export interface DataPoint {
    id: number;
    features: number[]; // [x, z...] Note: In UI x=Feature1, z=Feature2 (depth)
    label?: number;     // Target Y (height)
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
// y = 7x + 20
const studyData: DataPoint[] = [];
for (let i = 0; i < 50; i++) {
    const hours = Number((Math.random() * 10).toFixed(1));
    const noise = (Math.random() - 0.5) * 8;
    const score = Number((20 + 7 * hours + noise).toFixed(1));
    studyData.push({ id: i, features: [hours], label: score });
}

// 2. Housing Prices (3D Regression)
// Price = 100 * Size + 200 * Rooms + 50
// Visualizing x=Size, z=Rooms, y=Price
const housingData: DataPoint[] = [];
for (let i = 0; i < 60; i++) {
    const size = Number((1 + Math.random() * 4).toFixed(1)); // 1k to 5k sqft (scaled down)
    const rooms = Math.floor(1 + Math.random() * 5); // 1-6 rooms

    // y = 50 * size + 30 * rooms + noise
    const noise = (Math.random() - 0.5) * 20;
    const price = Number((50 + 50 * size + 30 * rooms + noise).toFixed(1));

    housingData.push({ id: i, features: [size, rooms], label: price });
}

// 3. Perfect Plane (Demo Material)
// y = 2x + 3z
const perfectPlaneData: DataPoint[] = [];
for (let x = 0; x <= 5; x += 1) {
    for (let z = 0; z <= 5; z += 1) {
        perfectPlaneData.push({
            id: x * 10 + z,
            features: [x, z],
            label: 2 * x + 3 * z
        })
    }
}

export const DATASETS: Dataset[] = [
    {
        id: 'study-scores',
        name: 'Study Hours vs Scores (2D)',
        type: 'regression',
        description: 'Simple 2D linear regression. Predict score based on hours.',
        features: ['Hours (X)', 'Score (Y)'],
        data: studyData
    },
    {
        id: 'housing-prices',
        name: 'Housing Prices (3D)',
        type: 'regression',
        description: '3D Regression. Predict Price (Y) from Size (X) and Rooms (Z).',
        features: ['Size (X)', 'Rooms (Z)', 'Price (Y)'],
        data: housingData
    },
    {
        id: 'perfect-plane',
        name: 'Expo Demo: Perfect Plane',
        type: 'regression',
        description: 'Ideal data with no noise to demonstrate perfect 3D fitting.',
        features: ['Input A', 'Input B', 'Output'],
        data: perfectPlaneData
    }
];
