import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Stars, Float, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, Play, RefreshCw, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type LandscapeType = 'bowl' | 'valley' | 'multi' | 'saddle';

export function LossLandscape3D() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const darkMode = theme === 'dark';
    const [learningRate, setLearningRate] = useState(0.01);
    const [ballPosition, setBallPosition] = useState<[number, number, number]>([3, 5, 3]);
    const [isRunning, setIsRunning] = useState(false);
    const [landscapeType, setLandscapeType] = useState<LandscapeType>('bowl');
    const [trail, setTrail] = useState<THREE.Vector3[]>([]);

    // Reset ball to start
    const handleReset = () => {
        // Set start position based on landscape type for best demo
        if (landscapeType === 'bowl') setBallPosition([3, 5, 3]);
        else if (landscapeType === 'valley') setBallPosition([0, 5, 4]);
        else if (landscapeType === 'multi') setBallPosition([4, 5, 4]);
        else setBallPosition([2, 5, 0]);

        setIsRunning(false);
        setTrail([]);
    };

    useEffect(() => {
        handleReset();
    }, [landscapeType]);

    return (
        <div className={`w-full h-screen relative ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={`p-2 rounded-full mb-4 transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-900'} shadow-lg`}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className={`p-6 rounded-2xl border backdrop-blur-xl ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'} shadow-2xl`}>
                        <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>3D Loss Landscape</h1>
                        <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Visualize Gradient Descent finding the local minimum.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className={`block text-xs font-semibold mb-2 uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Landscape Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setLandscapeType('bowl')} className={`px-3 py-2 rounded text-xs border ${landscapeType === 'bowl' ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-600'}`}>Simple Bowl</button>
                                    <button onClick={() => setLandscapeType('valley')} className={`px-3 py-2 rounded text-xs border ${landscapeType === 'valley' ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-600'}`}>Deep Valley</button>
                                    <button onClick={() => setLandscapeType('multi')} className={`px-3 py-2 rounded text-xs border ${landscapeType === 'multi' ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-600'}`}>Multi-Minima</button>
                                    <button onClick={() => setLandscapeType('saddle')} className={`px-3 py-2 rounded text-xs border ${landscapeType === 'saddle' ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-600'}`}>Saddle Point</button>
                                </div>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-2 uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Learning Rate: {learningRate}
                                </label>
                                <input
                                    type="range"
                                    min="0.001"
                                    max="0.1"
                                    step="0.001"
                                    value={learningRate}
                                    onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                                    className="w-full accent-blue-500"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsRunning(!isRunning)}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${isRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                                >
                                    <Play className="w-4 h-4" />
                                    {isRunning ? 'Pause' : 'Start Descent'}
                                </button>
                                <button
                                    onClick={handleReset}
                                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'} shadow-2xl mr-4`}>
                    <div className="text-right">
                        <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Current Loss</div>
                        <div className={`text-3xl font-mono font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {(ballPosition[1]).toFixed(4)}
                        </div>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            pos: [{ballPosition[0].toFixed(2)}, {ballPosition[2].toFixed(2)}]
                        </div>
                    </div>
                </div>
            </div>

            {/* 3D Scene */}
            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={50} />
                <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={20} />

                {/* Environment */}
                <color attach="background" args={[darkMode ? '#020617' : '#f8fafc']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} castShadow />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                {/* Components */}
                <Landscape type={landscapeType} />
                <Ball
                    position={ballPosition}
                    updatePosition={(pos) => {
                        setBallPosition(pos);
                        setTrail(prev => [...prev, new THREE.Vector3(...pos)]);
                    }}
                    learningRate={learningRate}
                    isRunning={isRunning}
                    landscapeType={landscapeType}
                />
                {trail.length > 1 && (
                    <Line points={trail} color={darkMode ? "#fbbf24" : "#d97706"} lineWidth={3} />
                )}
                <GridHelper darkMode={darkMode} />

                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                    <Text
                        position={[0, 5, 0]}
                        fontSize={0.4}
                        color={darkMode ? "#ffffff" : "#1e293b"}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {landscapeType === 'bowl' ? 'Global Minimum' : 'Loss Landscape'}
                    </Text>
                </Float>
            </Canvas>
        </div>
    );
}

// Math functions
const getHeight = (x: number, z: number, type: LandscapeType) => {
    if (type === 'bowl') {
        return (x * x + z * z) / 5;
    } else if (type === 'valley') {
        return (x * x + 10 * Math.sin(z / 2)) / 5 + 2;
    } else if (type === 'multi') {
        // Ackley-ish function
        return -2 * Math.exp(-0.2 * Math.sqrt(0.5 * (x * x + z * z))) - Math.exp(0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * z))) + Math.E + 2 + 1;
    } else if (type === 'saddle') {
        return (x * x - z * z) / 5 + 2;
    }
    return 0;
};

// Gradients
const getGradients = (x: number, z: number, type: LandscapeType) => {
    const h = 0.001;
    const f = (x: number, z: number) => getHeight(x, z, type);
    const dfdx = (f(x + h, z) - f(x - h, z)) / (2 * h);
    const dfdz = (f(x, z + h) - f(x, z - h)) / (2 * h);
    return [dfdx, dfdz];
};

// The terrain mesh
function Landscape({ type }: { type: LandscapeType }) {
    const meshRef = useRef<THREE.Mesh>(null);

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(12, 12, 128, 128); // Higher res for complex
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i); // This is actually Z in our math
            const z = getHeight(x, y, type);
            pos.setZ(i, z);
        }
        geo.computeVertexNormals();
        return geo;
    }, [type]);

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            rotation={[-Math.PI / 2, 0, 0]} // Rotate to lie flat
            receiveShadow
        >
            <meshStandardMaterial
                vertexColors={false}
                color="#3b82f6"
                wireframe={true}
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// The gradient descent ball
function Ball({ position, updatePosition, learningRate, isRunning, landscapeType }: {
    position: [number, number, number],
    updatePosition: (pos: [number, number, number]) => void,
    learningRate: number,
    isRunning: boolean,
    landscapeType: LandscapeType
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (isRunning && meshRef.current) {
            const [x, y, z] = position;

            const [gradX, gradZ] = getGradients(x, z, landscapeType);

            // Update position
            const newX = x - gradX * learningRate * 5; // *5 to speed it up visually
            const newZ = z - gradZ * learningRate * 5;
            const newY = getHeight(newX, newZ, landscapeType);

            // Stop if converged (simple check)
            if (Math.abs(gradX) < 0.001 && Math.abs(gradZ) < 0.001) {
                // Converged
            } else {
                updatePosition([newX, newY, newZ]);
            }
        }
    });

    return (
        <mesh position={new THREE.Vector3(...position)} castShadow ref={meshRef}>
            <sphereGeometry args={[0.2, 32, 32]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
    );
}

function GridHelper({ darkMode }: { darkMode: boolean }) {
    return (
        <gridHelper
            args={[20, 20, darkMode ? 0x1e293b : 0xe2e8f0, darkMode ? 0x0f172a : 0xf1f5f9]}
            position={[0, -0.01, 0]}
        />
    );
}
