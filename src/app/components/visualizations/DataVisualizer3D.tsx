import { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { DataPoint } from '../../data/datasets';

interface DataVisualizer3DProps {
    data: DataPoint[];
    weights: number[]; // [w1, w2, ...]
    bias: number;
    showPlane?: boolean;
}

// Visual Space size: 0 to 10
const VISUAL_SIZE = 10;

export function DataVisualizer3D({ data, weights, bias, showPlane = true }: DataVisualizer3DProps) {
    const numFeatures = data[0]?.features.length || 1;
    const is3D = numFeatures >= 2;

    // 1. Calculate Min/Max for Normalization
    const bounds = useMemo(() => {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity; // Label
        let minZ = Infinity, maxZ = -Infinity; // Feature 2

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

            {/* Data Points */}
            <group>
                {data.map((point, i) => {
                    let x, y, z;
                    const f1 = point.features[0] || 0;
                    const label = point.label || 0;

                    x = normalize(f1, bounds.minX, bounds.maxX);
                    y = normalize(label, bounds.minY, bounds.maxY);

                    if (is3D) {
                        const f2 = point.features[1] || 0;
                        z = normalize(f2, bounds.minZ, bounds.maxZ);
                    } else {
                        z = 0; // On the "wall" or centered? Let's treat 2D as Feature1 vs Label on XY plane, Z=0 looks cleaner on a 3D grid context
                        // Actually, for better visibility, let's put it on Z = VISUAL_SIZE / 2 or 0.
                        z = VISUAL_SIZE / 2;
                    }

                    return (
                        <mesh key={i} position={[x, y, z]} castShadow>
                            <sphereGeometry args={[0.25]} />
                            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} />
                        </mesh>
                    );
                })}
            </group>

            {/* Regression Model */}
            {showPlane && (
                <group>
                    {is3D ? (
                        <RegressionPlane3D weights={weights} bias={bias} bounds={bounds} />
                    ) : (
                        <RegressionLine2D weights={weights} bias={bias} bounds={bounds} />
                    )}
                </group>
            )}
        </Canvas>
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
                <Text position={textPos} fontSize={0.35} color="#cbd5e1" anchorX="center" anchorY="top" billboard>
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
    const meshRef = useRef<THREE.Mesh>(null);
    const geometry = useMemo(() => new THREE.PlaneGeometry(VISUAL_SIZE, VISUAL_SIZE, 20, 20), []);

    useMemo(() => {
        const pos = geometry.attributes.position;
        // Plane is initially centered at 0,0. Range -5 to 5.
        // We want it to span 0..10.
        // We will manually move vertices to match our logic.

        for (let i = 0; i < pos.count; i++) {
            // Get local vertex pos (standard plane is X-Y)
            // But we will rotate it. Let's assume we map uv to our features.

            // Standard PlaneGeometry creates X from -width/2 to width/2
            // Let's redefine.

            // We want to iterate x (Feature 1) and z (Feature 2) in visual space 0..10

            // Re-read X and Y from geometry (which acts as our X and Z grid)
            // It ranges -5 to 5 if size is 10.
            const localX = pos.getX(i); // -5 to 5
            const localZ = pos.getY(i); // -5 to 5 (mapped to visual Z later)

            // Convert Local (-5..5) to Visual (0..10)
            const visX = localX + VISUAL_SIZE / 2;
            const visZ = localZ + VISUAL_SIZE / 2;

            // Normalize Reverse: Visual -> Real
            const realX = bounds.minX + (visX / VISUAL_SIZE) * (bounds.maxX - bounds.minX);
            const realZ = bounds.minZ + (visZ / VISUAL_SIZE) * (bounds.maxZ - bounds.minZ);

            // Predict Y
            const realY = weights[0] * realX + weights[1] * realZ + bias;

            // Map RealY -> Visual Y
            const visY = ((realY - bounds.minY) / (bounds.maxY - bounds.minY)) * VISUAL_SIZE;

            // Set the vertex position directly in World Space (mostly)
            // We will NOT rotate the mesh container (-PI/2), instead we do everything here perfectly.
            // Wait, if we don't rotate container, PlaneGeometry is vertical.
            // Let's stick to modifying Z attribute to be Height, and rotate container.

            // Container Rotation: [-Pi/2, 0, 0]
            // Local Coords:
            // x_local -> World X
            // y_local -> World -Z (depth)
            // z_local -> World Y (height)

            // We need world Z to match our visual Z (0..10).
            // y_local (-5..5) maps to world Z.
            // world Z = -y_local. Wait.

            // Let's just set positions absolutely to avoid confusion.
            // We will reset the mesh position to [0,0,0] and rotation to [0,0,0] in the return.
            // And manually settings X, Y, Z here.

            pos.setXYZ(i, visX, visY, visZ);
        }

        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
    }, [weights, bias, bounds, geometry]);

    return (
        <mesh geometry={geometry}>
            {/* DoubleSide so we see it from below/above. Transparent red. */}
            <meshStandardMaterial color="#ef4444" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
    );
}
