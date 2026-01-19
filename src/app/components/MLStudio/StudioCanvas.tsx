import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface StudioCanvasProps {
    data: any[];
    axes: { x: string; y: string; z: string };
    configs: {
        xRange: [number, number];
        yRange: [number, number];
        zRange: [number, number];
    };
    modelState?: {
        type: 'regression' | 'kmeans' | 'logistic';
        params: any; // weights, centroids, etc.
    };
    pointLabels?: (number | string)[]; // Use for color coding (clusters/classes)
}

function ScatterPlot({ data, axes, configs, pointLabels }: Pick<StudioCanvasProps, 'data' | 'axes' | 'configs' | 'pointLabels'>) {
    // InstancedMesh for performance with thousands of points
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const colorObj = new THREE.Color();
    const tempObj = new THREE.Object3D();

    const { xRange, yRange, zRange } = configs;
    const normalize = (val: number, range: [number, number]) => {
        const d = range[1] - range[0] || 1;
        return ((val - range[0]) / d) * 10 - 5; // Map to -5..+5
    };

    useFrame(() => {
        if (!meshRef.current) return;

        data.forEach((row, i) => {
            const x = normalize(row[axes.x] || 0, xRange);
            const z = normalize(row[axes.y] || 0, yRange); // Map Data Y to World Z (flat plane logic)
            const y = normalize(row[axes.z] || 0, zRange); // Map Data Z to World Y (Height)

            tempObj.position.set(x, y, z);
            tempObj.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObj.matrix);

            // Color Coding
            if (pointLabels) {
                const label = pointLabels[i];
                // Simple Hash to color or Index if number
                if (typeof label === 'number') {
                    // 0 = Blue, 1 = Red, 2 = Green
                    if (label === 0) colorObj.setHex(0x3b82f6);
                    else if (label === 1) colorObj.setHex(0xef4444);
                    else if (label === 2) colorObj.setHex(0x22c55e);
                    else colorObj.setHSL((label * 0.2) % 1, 0.7, 0.5);
                } else {
                    colorObj.setHex(0xffffff);
                }
            } else {
                colorObj.setHex(0x60a5fa); // Default Blue
            }
            meshRef.current!.setColorAt(i, colorObj);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, data.length]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
}

function RegressionPlane({ axes, configs, modelState }: StudioCanvasProps) {
    if (modelState?.type !== 'regression' || !modelState.params) return null;

    // params: { weights: [w1, w2], bias: b }
    // plane equation: y = w1*x + w2*z + b (in normalized space? No, usually model trains on normalized data)
    // We assume model trained on Normalized[-5..5] coords for visualization simplicity in this MVP
    // OR we map the plane equation.

    // For this prototype, we'll assuming the ModelEngine handled the scaling or we pass raw.
    // Let's assume params are for the *Normalized* space (-5..5).

    const { weights, bias } = modelState.params; // w1, w2, b

    const planeGeo = useMemo(() => {
        const geo = new THREE.PlaneGeometry(10, 10, 20, 20); // 10x10 is our -5..5 world
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getY(i); // Plane is XY, so Y is Z here

            // y = w1*x + w2*z + b
            const h = (weights[0] * x) + (weights[1] * z) + bias;
            pos.setZ(i, h); // Displace Z (which is World Y if rotated)
        }
        geo.computeVertexNormals();
        return geo;
    }, [weights, bias]);

    return (
        <mesh geometry={planeGeo} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="white" opacity={0.3} transparent side={THREE.DoubleSide} wireframe={false} />
        </mesh>
    );
}

function Centroids({ configs, modelState }: StudioCanvasProps) {
    if (modelState?.type !== 'kmeans' || !modelState.params) return null;
    const { centroids } = modelState.params; // Array of [n_features]

    // Need to map centroid data coords to Visual (-5..5) coords
    // We only care about the 3 chosen axes
    // But centroids are array in same order as 'features'.
    // We'll pass them down fully normalized? 
    // Optimization: Assume centroids are already [x, y, z] triples for the view?
    // No, Model works on raw data.

    // NOTE: For this MVP, we assume the parent components passes visual-ready coordinates
    // OR we reuse the normalization logic.
    // Let's reuse configs.

    const normalize = (val: number, range: [number, number]) => {
        const d = range[1] - range[0] || 1;
        return ((val - range[0]) / d) * 10 - 5;
    };

    // We assume centroids are [xVal, yVal, zVal] corresponding to our axes
    // This requires 'modelState' to be aware of the axes mapping.

    return (
        <group>
            {centroids.map((c: any, i: number) => {
                // Check if c is object {feature: val} or array. Kmeans usually array.
                // We will need a mapping helper.
                // TEMP: Assume c is [x, z, y] values for the current view.
                const x = normalize(c[0], configs.xRange);
                const z = normalize(c[1], configs.yRange);
                const y = normalize(c[2], configs.zRange);

                return (
                    <mesh position={[x, y, z]} key={i}>
                        <sphereGeometry args={[0.4]} />
                        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.5} />
                    </mesh>
                )
            })}
        </group>
    )

}

export function StudioCanvas(props: StudioCanvasProps) {
    return (
        <Canvas shadows camera={{ position: [8, 8, 8], fov: 50 }}>
            <color attach="background" args={['#0f172a']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
            <OrbitControls makeDefault />

            <gridHelper args={[20, 20, '#1e293b', '#1e293b']} position={[0, -5, 0]} />
            <axesHelper args={[5]} position={[-5, -5, -5]} />

            <ScatterPlot {...props} />
            <RegressionPlane {...props} />
            <Centroids {...props} />

            {/* Axis Labels */}
            <Text position={[0, -5.5, 5]} fontSize={0.5} color="white" anchorX="center">{props.axes.x}</Text>
            <Text position={[6, -5.5, 0]} fontSize={0.5} color="white" anchorX="center">{props.axes.y}</Text>
            <Text position={[-5.5, 0, -5.5]} rotation={[0, 0, Math.PI / 2]} fontSize={0.5} color="white" anchorX="center">{props.axes.z}</Text>
        </Canvas>
    );
}
