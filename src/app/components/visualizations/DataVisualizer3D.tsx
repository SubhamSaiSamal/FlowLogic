import { useRef, useMemo, useLayoutEffect, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Line, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { DataPoint } from '../../data/datasets';

interface DataVisualizer3DProps {
    data: DataPoint[];
    weights?: number[]; // [w1, w2, ...]
    bias?: number;
    showPlane?: boolean;
    centroids?: number[][];
    assignments?: number[];
}

// Visual Space size: 0 to 10
const VISUAL_SIZE = 10;
const CLUSTER_COLORS = ['#ef4444', '#22c55e', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4'];

export function DataVisualizer3D({ data, weights, bias, showPlane = true, centroids, assignments }: DataVisualizer3DProps) {
    const numFeatures = data[0]?.features.length || 1;
    const is3D = numFeatures >= 2;

    // 1. Calculate Min/Max for Normalization
    const bounds = useMemo(() => {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity; // Label
        let minZ = Infinity, maxZ = -Infinity; // Feature 2

        if (data.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1 };

        data.forEach(p => {
            const x = p.features[0] || 0;
            const y = p.label || 0;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (is3D) {
                const z = p.features[1] || 0;
                if (z < minZ) minZ = z;
                if (z > maxZ) maxZ = z;
            }
        });

        // Add padding to avoid edge-hugging
        const padding = 0.1;

        // If simple range (e.g., all 0), add buffer
        if (maxX === minX) { maxX += 1; minX -= 1; }
        if (maxY === minY) { maxY += 1; minY -= 1; }
        if (maxZ === minZ && is3D) { maxZ += 1; minZ -= 1; }

        return { minX, maxX, minY, maxY, minZ, maxZ };
    }, [data, is3D]);

    // Helper: Map Real Value -> Visual Coordinate (0..10)
    const normalize = (val: number, min: number, max: number) => {
        return ((val - min) / (max - min)) * VISUAL_SIZE;
    };

    return (
        <Canvas camera={{ position: [15, 8, 15], fov: 45 }} shadows>
            <color attach="background" args={['#0f172a']} />
            <ambientLight intensity={0.6} />
            <pointLight position={[20, 20, 20]} intensity={1} castShadow />
            <OrbitControls makeDefault target={[VISUAL_SIZE / 2, VISUAL_SIZE / 2, VISUAL_SIZE / 2]} />

            {/* Grid Floor */}
            <Grid
                args={[VISUAL_SIZE, VISUAL_SIZE]}
                position={[VISUAL_SIZE / 2, 0, VISUAL_SIZE / 2]}
                cellSize={1} // Visual unit grid
                cellThickness={0.5}
                cellColor="#334155"
                sectionColor="#475569"
                fadeDistance={50}
            />

            {/* Bounding Box Wireframe for context */}
            <BoxHelper size={VISUAL_SIZE} />

            {/* Smart Axes with Real Number Ticks */}
            <Axes3D bounds={bounds} is3D={is3D} />

            {/* Data Points (Instanced for Performance) */}
            <PointsInstanced
                data={data}
                bounds={bounds}
                is3D={is3D}
                assignments={assignments}
                normalize={normalize}
            />

            {/* Centroids */}
            {centroids && centroids.map((c, i) => {
                // Centroid usually [F1, (F2), Label] depending on clustering space
                // If simple 1D X + Label: c length 2.
                // If 2D X,Z + Label: c length 3.
                // We will try to be safe.

                let cx = 0, cy = 0, cz = 0;
                if (c.length >= 2) {
                    cx = normalize(c[0], bounds.minX, bounds.maxX);
                    cy = normalize(c[c.length - 1], bounds.minY, bounds.maxY); // Label is last
                }
                if (is3D && c.length >= 3) {
                    cz = normalize(c[1], bounds.minZ, bounds.maxZ);
                } else {
                    cz = VISUAL_SIZE / 2;
                }

                return (
                    <mesh key={`c-${i}`} position={[cx, cy, cz]}>
                        <dodecahedronGeometry args={[0.5]} />
                        <meshStandardMaterial color={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} emissive="#ffffff" emissiveIntensity={0.8} />
                        <pointLight distance={4} intensity={2} color={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} />
                    </mesh>
                )
            })}

            {/* Regression Model (Only if standard regression) */}
            {showPlane && weights && (
                <group>
                    {is3D ? (
                        <RegressionPlane3D weights={weights} bias={bias || 0} bounds={bounds} />
                    ) : (
                        <RegressionLine2D weights={weights} bias={bias || 0} bounds={bounds} />
                    )}
                </group>
            )}
        </Canvas>
    );
}

function PointsInstanced({ data, bounds, is3D, assignments, normalize }: any) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const tempObj = useMemo(() => new THREE.Object3D(), []);

    useLayoutEffect(() => {
        if (!meshRef.current) return;

        // Update Instance Matrix
        data.forEach((point: DataPoint, i: number) => {
            const f1 = point.features[0] || 0;
            const label = point.label || 0;

            const x = normalize(f1, bounds.minX, bounds.maxX);
            const y = normalize(label, bounds.minY, bounds.maxY);
            let z = VISUAL_SIZE / 2;
            if (is3D) {
                const f2 = point.features[1] || 0;
                z = normalize(f2, bounds.minZ, bounds.maxZ);
            }

            tempObj.position.set(x, y, z);
            tempObj.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObj.matrix);

            // Update Color
            const clusterIdx = assignments ? assignments[i] : 0;
            // Default blue, or cluster color
            const hex = assignments ? CLUSTER_COLORS[clusterIdx % CLUSTER_COLORS.length] : "#3b82f6";
            meshRef.current!.setColorAt(i, new THREE.Color(hex));
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    }, [data, bounds, is3D, assignments, normalize]);

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, data.length]} castShadow receiveShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial roughness={0.5} metalness={0.5} />
        </instancedMesh>
    );
}

function BoxHelper({ size }: { size: number }) {
    return (
        <group>
            {/* Simple wireframe box to delimit the visual volume 0,0,0 to 10,10,10 */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(size, size, size)]} />
                <lineBasicMaterial color="#334155" opacity={0.2} transparent />
            </lineSegments>
            {/* We need to position it at center of volume: 5,5,5 */}
            <mesh position={[size / 2, size / 2, size / 2]}>
                <boxGeometry args={[size, size, size]} />
                <meshBasicMaterial color="#334155" wireframe transparent opacity={0.1} />
            </mesh>
        </group>
    )
}

interface Bounds { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number; }

function Axes3D({ bounds, is3D }: { bounds: Bounds; is3D: boolean }) {
    const ticks = 6;

    const AxisTick = ({ axis, value, label }: { axis: 'x' | 'y' | 'z', value: number, label: string }) => {
        // ... (Keep existing AxisTick logic, just compacted for diff stability)
        const pos: [number, number, number] =
            axis === 'x' ? [value, 0, VISUAL_SIZE + 0.5] :
                axis === 'y' ? [0, value, VISUAL_SIZE + 0.5] : // Y Labels on front-left pillar
                    [VISUAL_SIZE + 0.5, 0, value];   // Z Labels on right-bottom

        // Offset text slightly
        const textPos: [number, number, number] =
            axis === 'x' ? [value, -0.5, VISUAL_SIZE + 0.5] :
                axis === 'y' ? [-1, value, VISUAL_SIZE + 0.5] :
                    [VISUAL_SIZE + 0.5, -0.5, value];

        return (
            <group>
                {/* Tick Line */}
                {axis === 'x' && <Line points={[[value, 0, VISUAL_SIZE], [value, 0, VISUAL_SIZE + 0.2]]} color="#94a3b8" />}
                {axis === 'y' && <Line points={[[0, value, VISUAL_SIZE], [-0.2, value, VISUAL_SIZE]]} color="#94a3b8" />}
                {axis === 'z' && <Line points={[[VISUAL_SIZE, 0, value], [VISUAL_SIZE + 0.2, 0, value]]} color="#94a3b8" />}

                {/* Label */}
                <Text position={textPos} fontSize={0.35} color="#cbd5e1" anchorX="center" anchorY="top">
                    {label}
                </Text>
            </group>
        )
    };

    const generateTicks = (min: number, max: number, axis: 'x' | 'y' | 'z') => {
        return Array.from({ length: ticks }).map((_, i) => {
            const t = i / (ticks - 1);
            const visualVal = t * VISUAL_SIZE;
            const realVal = min + t * (max - min);
            return <AxisTick key={`${axis}-${i}`} axis={axis} value={visualVal} label={realVal.toFixed(1)} />;
        });
    }

    return (
        <group>
            {/* Origin */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color="white" />
            </mesh>

            {/* X Axis (Feature 1) */}
            <Line points={[[0, 0, VISUAL_SIZE], [VISUAL_SIZE, 0, VISUAL_SIZE]]} color="#f87171" lineWidth={2} />
            <Text position={[VISUAL_SIZE / 2, -1.2, VISUAL_SIZE]} fontSize={0.5} color="#f87171">Feature 1 (X)</Text>
            {generateTicks(bounds.minX, bounds.maxX, 'x')}

            {/* Y Axis (Label) - Up */}
            <Line points={[[0, 0, VISUAL_SIZE], [0, VISUAL_SIZE, VISUAL_SIZE]]} color="#4ade80" lineWidth={2} />
            <Text position={[-1.5, VISUAL_SIZE / 2, VISUAL_SIZE]} rotation={[0, 0, Math.PI / 2]} fontSize={0.5} color="#4ade80">Target (Y)</Text>
            {generateTicks(bounds.minY, bounds.maxY, 'y')}

            {/* Z Axis (Feature 2) - Only if 3D */}
            {is3D && (
                <>
                    <Line points={[[VISUAL_SIZE, 0, 0], [VISUAL_SIZE, 0, VISUAL_SIZE]]} color="#60a5fa" lineWidth={2} />
                    <Text position={[VISUAL_SIZE + 1, -0.5, VISUAL_SIZE / 2]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.5} color="#60a5fa">Feature 2 (Z)</Text>
                    {generateTicks(bounds.minZ, bounds.maxZ, 'z')}
                </>
            )}
        </group>
    )
}

function RegressionLine2D({ weights, bias, bounds }: { weights: number[], bias: number, bounds: Bounds }) {
    const points = useMemo(() => {
        // We need 2 points in Visual Space that correspond to the regression line
        // Line equation: y = w*x + b

        // Point 1: At minX
        const realX1 = bounds.minX;
        const realY1 = weights[0] * realX1 + bias;

        // Point 2: At maxX
        const realX2 = bounds.maxX;
        const realY2 = weights[0] * realX2 + bias;

        // Map to Visual
        const vX1 = 0; // (min - min)/(max-min) * VS = 0
        const vY1 = ((realY1 - bounds.minY) / (bounds.maxY - bounds.minY)) * VISUAL_SIZE;

        const vX2 = VISUAL_SIZE;
        const vY2 = ((realY2 - bounds.minY) / (bounds.maxY - bounds.minY)) * VISUAL_SIZE;

        // Z is centered
        const vZ = VISUAL_SIZE / 2;

        return [new THREE.Vector3(vX1, vY1, vZ), new THREE.Vector3(vX2, vY2, vZ)];
    }, [weights, bias, bounds]);

    return (
        <group>
            <primitive object={new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 }))} />
        </group>
    );
}

function RegressionPlane3D({ weights, bias, bounds }: { weights: number[], bias: number, bounds: Bounds }) {
    const geometry = useMemo(() => new THREE.PlaneGeometry(VISUAL_SIZE, VISUAL_SIZE, 20, 20), []);

    // Explicitly use LayoutEffect to mutate geometry immediately after render
    useLayoutEffect(() => {
        const pos = geometry.attributes.position;
        // Plane is initially centered at 0,0. Range -5 to 5.
        // We want it to span 0..10.

        for (let i = 0; i < pos.count; i++) {
            // Get local vertex pos 
            // Standard PlaneGeometry creates X from -width/2 to width/2

            // X-coord of buffer -> Used for Feature 1 (X)
            // Y-coord of buffer -> Used for Feature 2 (Z)

            const localX = pos.getX(i); // -5 to 5
            const localZ = pos.getY(i); // -5 to 5

            // Convert Local (-5..5) to Visual (0..10)
            const visX = localX + VISUAL_SIZE / 2;
            const visZ = localZ + VISUAL_SIZE / 2;

            // Normalize Reverse: Visual -> Real
            const realX = bounds.minX + (visX / VISUAL_SIZE) * (bounds.maxX - bounds.minX);
            const realZ = bounds.minZ + (visZ / VISUAL_SIZE) * (bounds.maxZ - bounds.minZ);

            // Predict Y (Regression Model)
            const realY = weights[0] * realX + weights[1] * realZ + bias;

            // Map RealY -> Visual Y (0..10)
            const visY = ((realY - bounds.minY) / (bounds.maxY - bounds.minY)) * VISUAL_SIZE;

            // Set position (visX, visY, visZ)
            pos.setXYZ(i, visX, visY, visZ);
        }

        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
    }, [weights, bias, bounds, geometry]);

    return (
        <mesh geometry={geometry}>
            {/* DoubleSide so we see it from below/above. Transparent red. */}
            <meshStandardMaterial color="#ef4444" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
    );
}
