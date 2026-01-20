import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { DataPoint } from '../../data/datasets';

interface LossLandscapeProps {
    data: DataPoint[];
    history: { weights: number[], bias: number, loss: number }[];
    currentWeights: number[];
    currentBias: number;
}

// Visual constants
const GRID_SIZE = 40;
const VISUAL_SCALE = 12;

export function LossLandscape3D({ data, history, currentWeights, currentBias }: LossLandscapeProps) {
    const numFeatures = data[0]?.features.length || 1;

    // We visualize 2 Free Parameters.
    // If 1 feature: Bias vs Weight
    // If 2+ features: Weight1 vs Weight2 (Bias fixed)
    const is1D = numFeatures === 1;

    // 1. Calculate Bounds based on History + Current
    // We want the camera to focus on the area where optimization happened
    const bounds = useMemo(() => {
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        const allPoints = [...history, { weights: currentWeights, bias: currentBias, loss: 0 }];

        allPoints.forEach(p => {
            const x = is1D ? p.bias : p.weights[0];
            const z = is1D ? p.weights[0] : p.weights[1];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        });

        // Add generous padding to see the "bowl" context
        const rangeX = Math.max(maxX - minX, 1);
        const rangeZ = Math.max(maxZ - minZ, 1);

        return {
            minX: minX - rangeX,
            maxX: maxX + rangeX,
            minZ: minZ - rangeZ,
            maxZ: maxZ + rangeZ
        };
    }, [history, currentWeights, currentBias, is1D]);

    // 2. Generate Landscape Geometry
    const { geometry, maxLoss, minLoss } = useMemo(() => {
        const geo = new THREE.PlaneGeometry(VISUAL_SCALE, VISUAL_SCALE, GRID_SIZE, GRID_SIZE);
        const posAttribute = geo.attributes.position;
        const colorArray = new Float32Array(posAttribute.count * 3);

        let lMin = Infinity;
        let lMax = -Infinity;
        const computedLosses = new Float32Array(posAttribute.count);

        // First Pass: Compute all losses to find Range
        for (let i = 0; i < posAttribute.count; i++) {
            const x = posAttribute.getX(i); // -Size/2 to Size/2
            const y = posAttribute.getY(i); // -Size/2 to Size/2 (This will maps to Z in parameter space)

            // Normalized 0..1 coordinates
            const u = (x + VISUAL_SCALE / 2) / VISUAL_SCALE;
            const v = (y + VISUAL_SCALE / 2) / VISUAL_SCALE;

            // Map to Parameter Space
            const param1 = bounds.minX + u * (bounds.maxX - bounds.minX); // Bias or W1
            const param2 = bounds.minZ + v * (bounds.maxZ - bounds.minZ); // Weight or W2

            let loss = 0;
            // Compute MSE efficiently
            // MSE = (1/N) * Sum( (Pred - True)^2 )
            let sumSqErr = 0;
            const N = data.length;

            if (is1D) {
                // p1=bias, p2=weight
                for (let k = 0; k < N; k++) {
                    const d = data[k];
                    const pred = param1 + param2 * (d.features[0] || 0);
                    const err = pred - (d.label || 0);
                    sumSqErr += err * err;
                }
            } else {
                // p1=w1, p2=w2, bias=fixed
                for (let k = 0; k < N; k++) {
                    const d = data[k];
                    // Using current weights for other dimensions if > 2? For now assume 2D.
                    // If >2D, we just vary first two.
                    let pred = currentBias;
                    pred += param1 * (d.features[0] || 0);
                    pred += param2 * (d.features[1] || 0);
                    // Add other fixed weights if exists? For simplified view, ignore or assume 0.
                    const err = pred - (d.label || 0);
                    sumSqErr += err * err;
                }
            }
            loss = sumSqErr / N;

            computedLosses[i] = loss;
            if (loss < lMin) lMin = loss;
            if (loss > lMax) lMax = loss;
        }

        // Second Pass: Deform Mesh and Color
        const color = new THREE.Color();

        for (let i = 0; i < posAttribute.count; i++) {
            const loss = computedLosses[i];

            // Normalize loss for visualization height
            // Using Log scale helps visualize deep valleys better
            // But simple linear clamping is more predictable for bug fixing.
            // Let's use simple relative height.
            let t = (loss - lMin) / (lMax - lMin || 1);

            // Visual Height (Z displacement)
            // Clamp to avoid spikes
            const height = t * 6; // Max height 6 units

            // Set Z (Displacement)
            posAttribute.setZ(i, height);

            // Color (Blue=Low, Red=High)
            // t=0 -> Blue (0.66), t=1 -> Red (0.0)
            color.setHSL(0.66 * (1 - Math.min(t, 1)), 1, 0.5);

            colorArray[i * 3] = color.r;
            colorArray[i * 3 + 1] = color.g;
            colorArray[i * 3 + 2] = color.b;
        }

        geo.computeVertexNormals();
        geo.attributes.position.needsUpdate = true;
        geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        return { geometry: geo, maxLoss: lMax, minLoss: lMin };
    }, [data, bounds, currentBias, is1D /* We don't depend on currentWeights for geometry in 1D, only 2D fixed parts */]);


    // 3. Create Path Line
    const pathPoints = useMemo(() => {
        return history.map(h => {
            const p1 = is1D ? h.bias : h.weights[0];
            const p2 = is1D ? h.weights[0] : h.weights[1];

            // Map Parameter Space -> Visual Space
            const u = (p1 - bounds.minX) / (bounds.maxX - bounds.minX);
            const v = (p2 - bounds.minZ) / (bounds.maxZ - bounds.minZ);

            const x = u * VISUAL_SCALE - VISUAL_SCALE / 2; // Matches Plane X
            const y = v * VISUAL_SCALE - VISUAL_SCALE / 2; // Matches Plane Y

            // Calculate Height (Z)
            // We use the EXACT same logic as mesh generation
            let t = (h.loss - minLoss) / (maxLoss - minLoss || 1);
            const height = t * 6;

            // Lift slightly to avoid z-fighting
            return new THREE.Vector3(x, y, height + 0.1);
        });
    }, [history, bounds, maxLoss, minLoss, is1D]);

    const currentPos = pathPoints.length > 0 ? pathPoints[pathPoints.length - 1] : new THREE.Vector3(0, 0, 0);

    return (
        <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, -15, 12]} fov={50} />
            <color attach="background" args={['#0f172a']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 20]} intensity={1} />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

            {/* 
                Coordinate System Notes:
                PlaneGeometry is X-Y plane by default. We modify Z for height.
                So "Up" is +Z. 
                Camera is positioned at y=-15 (front/bottom) looking up/center.
            */}

            <mesh geometry={geometry} receiveShadow castShadow>
                <meshStandardMaterial vertexColors side={THREE.DoubleSide} flatShading={false} roughness={0.4} />
            </mesh>

            {/* Wireframe overlay */}
            <mesh geometry={geometry} position={[0, 0, 0.01]}>
                <meshBasicMaterial wireframe color="white" transparent opacity={0.1} />
            </mesh>

            {/* Path Line */}
            {pathPoints.length > 1 && (
                <Line
                    points={pathPoints}
                    color="white"
                    lineWidth={3}
                />
            )}

            {/* Current Ball */}
            <Sphere args={[0.3]} position={currentPos}>
                <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.5} />
            </Sphere>

            {/* Axes Labels */}
            <Text position={[0, -VISUAL_SCALE / 2 - 1, 0]} fontSize={0.8} color="#94a3b8">
                {is1D ? 'Bias (b)' : 'Weight 1 (w1)'}
            </Text>
            <Text position={[VISUAL_SCALE / 2 + 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} fontSize={0.8} color="#94a3b8">
                {is1D ? 'Weight (w)' : 'Weight 2 (w2)'}
            </Text>

        </Canvas>
    );
}
