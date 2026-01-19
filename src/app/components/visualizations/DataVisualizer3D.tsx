import { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Line, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { DataPoint } from '../../data/datasets';

interface DataVisualizer3DProps {
    data: DataPoint[];
    weights: number[]; // [w1, w2, ...]
    bias: number;
    showPlane?: boolean;
}

export function DataVisualizer3D({ data, weights, bias, showPlane = true }: DataVisualizer3DProps) {
    // Determine if 2D or 3D regression
    // 1 feature -> 2D (y = mx + c) -> Line
    // 2 features -> 3D (z = ax + by + c) -> Plane
    const numFeatures = data[0]?.features.length || 1;
    const is3D = numFeatures >= 2;

    return (
        <Canvas camera={{ position: [8, 8, 8], fov: 50 }} shadows>
            <color attach="background" args={['#0f172a']} />
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
            <OrbitControls makeDefault />

            {/* Grid Floor y=0 */}
            <Grid
                args={[20, 20]}
                position={[0, -5, 0]}
                cellSize={1}
                cellThickness={1}
                cellColor="#334155"
                sectionColor="#475569"
                fadeDistance={30}
            />

            {/* Axes */}
            <Axes3D />

            {/* Data Points */}
            <group>
                {data.map((point, i) => {
                    let x, y, z;

                    if (is3D) {
                        // 3D: x=f1, z=f2, y=label (height)
                        // Scaling: map 0..10 to -5..5
                        x = (point.features[0] || 0) - 5;
                        z = (point.features[1] || 0) - 5;
                        y = ((point.label || 0) - 50) / 10; // Assuming label 0-100 -> -5..5
                    } else {
                        // 2D: x=f1, y=label, z=0
                        x = (point.features[0] || 0) - 5;
                        y = ((point.label || 0) - 20) / 8 - 5;
                        z = 0;
                    }

                    return (
                        <mesh key={i} position={[x, y, z]} castShadow>
                            <sphereGeometry args={[0.2]} />
                            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.2} />
                        </mesh>
                    );
                })}
            </group>

            {/* Regression Model Visualization */}
            {showPlane && (
                <group>
                    {is3D ? (
                        <RegressionPlane3D weights={weights} bias={bias} />
                    ) : (
                        <RegressionLine2D weights={weights} bias={bias} />
                    )}
                </group>
            )}
        </Canvas>
    );
}

function Axes3D() {
    return (
        <group>
            {/* X Axis (Red) */}
            <Line points={[[-6, -5, -6], [6, -5, -6]]} color="#ef4444" lineWidth={2} />
            <Text position={[7, -5, -6]} fontSize={0.5} color="#ef4444">Feature 1 (X)</Text>

            {/* Z Axis (Blue) - Depth */}
            <Line points={[[-6, -5, -6], [-6, -5, 6]]} color="#3b82f6" lineWidth={2} />
            <Text position={[-6, -5, 7]} fontSize={0.5} color="#3b82f6">Feature 2 (Z)</Text>

            {/* Y Axis (Green) - Label/Height */}
            <Line points={[[-6, -5, -6], [-6, 5, -6]]} color="#22c55e" lineWidth={2} />
            <Text position={[-6, 6, -6]} fontSize={0.5} color="#22c55e">Label (Y)</Text>
        </group>
    )
}

function RegressionLine2D({ weights, bias }: { weights: number[], bias: number }) {
    const points = useMemo(() => {
        // x range 0..10 mapped to -5..5
        // label range 20..100 mapped to -5..5
        const p1RealX = 0;
        const p1RealY = weights[0] * p1RealX + bias;
        const p1VisX = p1RealX - 5;
        const p1VisY = (p1RealY - 20) / 8 - 5;

        const p2RealX = 10;
        const p2RealY = weights[0] * p2RealX + bias;
        const p2VisX = p2RealX - 5;
        const p2VisY = (p2RealY - 20) / 8 - 5;

        return [new THREE.Vector3(p1VisX, p1VisY, 0), new THREE.Vector3(p2VisX, p2VisY, 0)];
    }, [weights, bias]);

    return <primitive object={new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 4 }))} />;
}

function RegressionPlane3D({ weights, bias }: { weights: number[], bias: number }) {
    // z_height = w1*x + w2*z_depth + b
    // We render a plane geometry and deform vertices

    const meshRef = useRef<THREE.Mesh>(null);
    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(10, 10, 10, 10);
        return geo;
    }, []);

    // Update vertex heights every render is expensive, but for 10x10 it's fine
    // Or utilize shaders. For MVP, we'll just rotate/position a flat plane if linear.
    // Actually, for w1*x + w2*y + b, it IS a flat plane. We just need to find normal & position.

    // Easier approach: Deform vertices in a loop since we have discrete grid
    useMemo(() => {
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i); // This is local plane X (-5 to 5)
            const z = pos.getY(i); // This is local plane Y (-5 to 5) -> acts as our Z depth

            // Map back to real coordinates
            // VisX = x -> RealX = x + 5
            // VisZ = z -> RealZ = z + 5

            const realX = x + 5;
            const realZ = z + 5;

            const realY_pred = (weights[0] || 0) * realX + (weights[1] || 0) * realZ + bias;

            // Map Prediction back to Visual Y
            // VisY = (Pred - 50) / 10
            const visY = (realY_pred - 50) / 10;

            // Plane geometry is usually upright X,Y. We'll rotate it flat later.
            // But here we set Z attribute to be the Height.
            pos.setZ(i, visY); // We will rotate x-axis -90 deg, so local Z becomes World Y
        }
        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
    }, [weights, bias, geometry]);

    return (
        <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
            <meshStandardMaterial color="#f87171" transparent opacity={0.4} side={THREE.DoubleSide} wireframe={false} />
        </mesh>
    );
}
