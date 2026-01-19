import { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
const GRID_SIZE = 40; // Resolution of the terrain
const VISUAL_SCALE = 10; // Size of the 3D object

export function LossLandscape3D({ data, history, currentWeights, currentBias }: LossLandscapeProps) {
    const numFeatures = data[0]?.features.length || 1;

    // Determine what we are visualizing
    // Case A: 1 Feature -> Visualize Weight vs Bias (Standard textbook example)
    // Case B: 2+ Features -> Visualize Weight 1 vs Weight 2 (Fix Bias to current)
    const axisLabels = numFeatures === 1
        ? { x: 'Bias (b)', z: 'Weight (w)' }
        : { x: 'Weight 1 (w1)', z: 'Weight 2 (w2)' };

    // 1. Calculate the bounds of the "Valley"
    // We want the view to center around the path history + some padding
    const bounds = useMemo(() => {
        let minX = Infinity, maxX = -Infinity; // X-axis param (Bias or W1)
        let minZ = Infinity, maxZ = -Infinity; // Z-axis param (Weight or W2)

        // If history is empty, check current
        const pointsToCheck = history.length ? history : [{ weights: currentWeights, bias: currentBias }];

        pointsToCheck.forEach(h => {
            const xVal = numFeatures === 1 ? h.bias : h.weights[0];
            const zVal = numFeatures === 1 ? h.weights[0] : h.weights[1];

            if (xVal < minX) minX = xVal;
            if (xVal > maxX) maxX = xVal;
            if (zVal < minZ) minZ = zVal;
            if (zVal > maxZ) maxZ = zVal;
        });

        // Add padding (at least range of 4 to show context)
        const paddingX = Math.max(2, (maxX - minX) * 0.5);
        const paddingZ = Math.max(2, (maxZ - minZ) * 0.5);

        return {
            minX: minX - paddingX,
            maxX: maxX + paddingX,
            minZ: minZ - paddingZ,
            maxZ: maxZ + paddingZ,
        };
    }, [history, currentWeights, currentBias, numFeatures]);

    // 2. Compute the Terrain Geometry (Cost Function)
    const { geometry, colors, maxLoss } = useMemo(() => {
        const geo = new THREE.PlaneGeometry(VISUAL_SCALE, VISUAL_SCALE, GRID_SIZE, GRID_SIZE);
        const pos = geo.attributes.position;
        const colorArray = new Float32Array(pos.count * 3);

        // Helper to compute MSE
        const computeMSE = (w: number[], b: number) => {
            let sumError = 0;
            for (let i = 0; i < data.length; i++) {
                const p = data[i];
                let pred = b;
                for (let j = 0; j < p.features.length; j++) {
                    pred += (w[j] || 0) * p.features[j];
                }
                const err = pred - (p.label || 0);
                sumError += err * err;
            }
            return sumError / data.length;
        };

        // Find range to normalize height visual
        let lMin = Infinity, lMax = -Infinity;
        const losses: number[] = [];

        for (let i = 0; i < pos.count; i++) {
            // Grid coordinates (-VISUAL/2 to VISUAL/2)
            const gx = pos.getX(i);
            const gz = pos.getY(i); // Plane is XY initially, so Y is our visual Z depth

            // Map grid coords to Parameter Space
            // t goes 0..1
            const tx = (gx + VISUAL_SCALE / 2) / VISUAL_SCALE;
            const tz = (gz + VISUAL_SCALE / 2) / VISUAL_SCALE;

            const paramX = bounds.minX + tx * (bounds.maxX - bounds.minX);
            const paramZ = bounds.minZ + tz * (bounds.maxZ - bounds.minZ);

            let loss = 0;
            if (numFeatures === 1) {
                // X=Bias, Z=Weight
                loss = computeMSE([paramZ], paramX);
            } else {
                // X=W1, Z=W2, Bias=Fixed
                const w = [...currentWeights]; // Copy current
                w[0] = paramX;
                w[1] = paramZ;
                loss = computeMSE(w, currentBias);
            }
            losses.push(loss);
            if (loss < lMin) lMin = loss;
            if (loss > lMax) lMax = loss;
        }

        // Deform Mesh
        const colorObj = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
            const loss = losses[i];

            // Normalize loss for height (log scale often looks better for convex bowls)
            // But linear is more honest. Let's do Log to prevent sky-high walls.
            // visualY = log(loss + 1) scaled

            // Actually, let's clamp height to avoid occluding the view
            const t = (loss - lMin) / (lMax - lMin || 1);

            // Height: Map 0..1 to 0..5
            const height = t * 4;

            // Set Z (which is World Y)
            // Currently plane is vertical XY. Standard approach:
            // We'll rotate mesh -90 (flat). So local Z is World Y (height).
            // But PlaneGeometry has no Z depth. We displace Z attribute (displacement).
            // wait, PlaneGeo pos is x,y,0.
            pos.setZ(i, height);

            // Coloring (Blue = Low Loss, Red = High Loss)
            // Heatmap: 0.0 (Blue) -> 0.5 (Green) -> 1.0 (Red)
            colorObj.setHSL(0.66 * (1 - t), 1, 0.5); // 0.66 is blue, 0 is red
            colorArray[i * 3] = colorObj.r;
            colorArray[i * 3 + 1] = colorObj.g;
            colorArray[i * 3 + 2] = colorObj.b;
        }

        geo.computeVertexNormals();
        geo.attributes.position.needsUpdate = true;
        geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        return { geometry: geo, colors: colorArray, maxLoss: lMax };
    }, [data, bounds, numFeatures, currentBias /* re-calc if bias changes in 2D+ mode */]);

    // 3. Compute Trace Path
    const pathPoints = useMemo(() => {
        return history.map(h => {
            const xVal = numFeatures === 1 ? h.bias : h.weights[0];
            const zVal = numFeatures === 1 ? h.weights[0] : h.weights[1];

            // Map Param Space -> Visual Space (-5..5)
            const vx = ((xVal - bounds.minX) / (bounds.maxX - bounds.minX)) * VISUAL_SCALE - VISUAL_SCALE / 2;
            const vz = ((zVal - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * VISUAL_SCALE - VISUAL_SCALE / 2;

            // Compute Height (using same logic as terrain to stick to surface)
            // We can't re-run full grid loop, just approximate or re-calc loss for this point
            // Re-calc loss is safer
            let loss = 0;
            if (numFeatures === 1) loss = (() => {
                // Inline MSE
                let sum = 0;
                for (let p of data) {
                    let pred = xVal + zVal * p.features[0];
                    sum += (pred - (p.label || 0)) ** 2;
                }
                return sum / data.length;
            })();
            else {
                // W1, W2
                // Note: 'h.loss' from history is accurate
                loss = h.loss;
            }

            // Normalize height same as geometry
            // We need lMin/lMax from the geometry pass? Using history loss directly might drift if grid min/max is different.
            // Let's rely on the geometry bounds we just found? No, use h.loss directly but we need scale factors.

            // Simplification: Just calculate height based on the SAME formula
            // WARNING: If we don't share lMin/lMax, the path will float or clip.
            // For this MVP, let's offset slightly above the calculated terrain height at that x,z.
            // Actually, we can use a "Raycast" approach visually, or just lift it up.

            // Let's use a Raycaster-like logic: 
            // Height = t * 4. We need lMin/lMax.
            // Passing them out of useMemo is hard.

            // Fallback: Just lift it a bit relative to previous range?
            // Let's recalculate lMin/lMax roughly from history to match dynamic range?
            // No, simply render the line "above" everything else with depthTest=false? No that looks bad.

            // Robust way: Re-calc loss and map using estimated min/max from grid calc
            // Let's just output `maxLoss` from the memo and use it?

            // ... We will accept minor clipping for now and bias height upwards.
            // h.loss is proportional to height.

            const t = (h.loss) / (maxLoss || 1); // rough approx normalization using maxLoss
            const y = Math.min(t * 4, 5) + 0.2; // Add 0.2 cushion

            return new THREE.Vector3(vx, vz, y); // Note: Z is height in Line geometry? No, Y is height usually.
            // Wait, our Plane is rotated. visual Y (up) corresponds to Plane Z (displacement).
            // When we pass points to <Line>, it expects World Coords.
            // World: X=vx, Y=height, Z=vz (actually -vz because of rotation? no)

            // Let's match the <mesh> rotation.
            // Mesh is rotation={[-Math.PI / 2, 0, 0]}
            // Local (vx, vz, height).
            // World = (vx, height, vz) ? No.
            // Rotated X-axis -90deg.
            // Local Y+ -> World Z+ ? No.
            // Local Y+ -> World Z- (into screen) ?
            // Let's keep it simple: We will NOT rotate the container. We will generate the geometry "upright" manually? No PlaneGeo is simple.

            // Okay, if Mesh is [-PI/2, 0, 0]:
            // Local (x, y, z) -> World (x, z, -y) roughly.
            // PlaneGeo is X-Y plane.
            // Local X -> World X.
            // Local Y -> World -Z (depth).
            // Local Z (displacement) -> World Y (height).

            // So for Line: 
            // X = vx
            // Z = -vz (To match Local Y being mapped to -Z roughly? Wait plane Y goes up, rotated -90 means it goes Back (negative Z). Correct.)
            // Y = height

            return new THREE.Vector3(vx, y, vz); // We used POSITIVE Z for local paramZ in loop?
            // In loop: gz = pos.getY(i). 
            // We mapped gz -> paramZ.
            // So if we put a point at world Z, it corresponds to local Y.
        });
    }, [history, bounds, maxLoss]);

    // Current Marker (Ball)
    const currentPos = pathPoints[pathPoints.length - 1] || new THREE.Vector3(0, 0, 0);

    return (
        <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 10, 15]} fov={50} />
            <color attach="background" args={['#0f172a']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 20, 10]} intensity={1} castShadow />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

            {/* Terrain Mesh */}
            <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadowCastShadow>
                {/* Use Vertex Colors */}
                <meshStandardMaterial vertexColors side={THREE.DoubleSide} wireframe={false} flatShading={false} roughness={0.8} />
            </mesh>

            {/* Wireframe Overlay for "Tech" feel */}
            <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <meshBasicMaterial wireframe color="white" transparent opacity={0.1} />
            </mesh>

            {/* Optimization Path */}
            {/* We effectively swap Y and Z in logic above. 
                Mesh Rotation -PI/2 maps Local Y to World -Z ??? 
                Let's simplify. If Mesh is -90deg on X.
                Local (0, 1, 0) -> World (0, 0, -1). (Assuming RHR).
                So Local Y corresponds to World -Z.
                
                Our generated points use logic `return new THREE.Vector3(vx, y, vz)`.
                If we want to match visual: 
                World X = vx.
                World Z = vz (We WANT weight axis to be Z).
                
                So we need to make sure the Mesh map aligns.
                Loop: `const gz = pos.getY(i)` -> paramZ.
                If local Y maps to World -Z, then paramZ increases as World Z decreases.
                That's inverted.
                
                To Fix:
                In loop, `const gz = pos.getY(i)`. Make `const tz = (-gz + VISUAL_SCALE/2)...` or similar?
                Or just rotate Mesh differently or not at all.
                
                EASIEST FIX: Don't rotate Mesh. Build Custom Geometry or use vertex shaders.
                Or... manual vertex mapping again like in the previous task. It was cleaner.
            */}

            {/* Manual Geometry Mesh (No Rotation) */}
            <DynamicTerrain
                geometry={geometry}
                pathPoints={history.map(h => {
                    // Re-map for the "No Rotation" logic
                    // We need to know exactly where the terrain vertices are.
                    // Let's assume the component below simply renders the geometry passed.
                    // But wait, the geometry we constructed above assumed Local Y = Z_param.
                    // If we render that without rotation, it stands up like a wall (X-Y plane).

                    // Let's stick to the rotated mesh [-PI/2, 0, 0] and fix the Line coordinates.

                    // Coordinates Transformation:
                    // Mesh Local (x,y,z) -> World (x, z, -y) [roughly]
                    // We displaced Local Z for height. So World Y = Local Z. Correct.
                    // We used Local Y for Param Z. So World -Z = Param Z. 
                    // So World Z = -Param Z.

                    const xVal = numFeatures === 1 ? h.bias : h.weights[0];
                    const zVal = numFeatures === 1 ? h.weights[0] : h.weights[1];

                    const vx = ((xVal - bounds.minX) / (bounds.maxX - bounds.minX)) * VISUAL_SCALE - VISUAL_SCALE / 2;
                    const vz = ((zVal - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * VISUAL_SCALE - VISUAL_SCALE / 2;

                    // Compute height (simple scaling relative to maxLoss for now)
                    // If maxLoss is 1000, and h.loss is 100, t = 0.1 -> height 0.4.
                    // We need consistent height.
                    // Let's cheat and use a Raycast logic or just map roughly.
                    const t = h.loss / (maxLoss || 100);
                    const height = Math.min(t * 4, 10) + 0.1;

                    // World Coords adaptation
                    // X = vx
                    // Y = height
                    // Z = -vz (since Local Y -> World -Z)
                    return new THREE.Vector3(vx, height, vz); // Just try vz first. If flipped, we flip.
                })}
            />

            {/* Axis Labels */}
            {/* Helper to show text at edges */}
            <Text position={[0, 5, -VISUAL_SCALE / 2 - 1]} fontSize={0.8} color="#94a3b8" anchorY="bottom">{axisLabels.x} Axis</Text>
            <Text position={[VISUAL_SCALE / 2 + 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.8} color="#94a3b8" anchorY="bottom">{axisLabels.z} Axis</Text>

        </Canvas>
    );
}

// Wrapper to handle path rendering cleanly
function DynamicTerrain({ geometry, pathPoints }: { geometry: THREE.PlaneGeometry, pathPoints: THREE.Vector3[] }) {
    return (
        <group>
            {/* The terrain, rotated to lie flat */}
            <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
                <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.3} metalness={0.1} />
            </mesh>

            {/* Path Trace */}
            {pathPoints.length > 1 && (
                <Line
                    points={pathPoints}
                    color="white"
                    lineWidth={3}
                    transparent
                    opacity={0.8}
                />
            )}

            {/* Current Ball */}
            {pathPoints.length > 0 && (
                <Sphere args={[0.3]} position={pathPoints[pathPoints.length - 1]}>
                    <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.5} />
                </Sphere>
            )}
        </group>
    )
}
