import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html, Grid, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

import { SURFACES } from '../constants/surfaces';
import { useSharedOptimizerStore } from '../store/optimizerStore';

function MathSurface({ surface }) {
  const meshRef = useRef();
  
  const geometry = useMemo(() => {
    const segments = 60;
    const size = surface.domain[1] - surface.domain[0];
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i); // In PlaneGeometry, Y is typically the up vector in 2D before rotation. 
      // Actually, standard plane is in XY, we rotate it to XZ in the mesh, so here x and y are the 2D grid.
      const z = surface.evaluate(x, y) * surface.zScale;
      pos.setZ(i, z);
    }
    
    geom.computeVertexNormals();
    return geom;
  }, [surface]);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <meshStandardMaterial 
        color="#00c4d4" 
        wireframe={true} 
        transparent 
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function OptimizerMarker({ path, surface }) {
  // Convert 2D path points to 3D line points
  const points = useMemo(() => {
    if (!path || path.length === 0) return [];
    return path.map(([x, y]) => new THREE.Vector3(x, surface.evaluate(x, y) * surface.zScale, -y));
  }, [path, surface]);

  const currentPos = points[points.length - 1];

  return (
    <group>
      {/* Path Trace */}
      {points.length > 1 && (
        <Line 
          points={points} 
          color="#00f0ff" 
          lineWidth={3} 
          dashed={false} 
        />
      )}
      
      {/* Current State Marker */}
      {currentPos && (
        <mesh position={currentPos}>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
          {/* Glow effect */}
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} />
          </mesh>
          <Sparkles count={20} scale={0.5} size={2} speed={0.4} color="#00f0ff" />
        </mesh>
      )}
    </group>
  );
}

export default function GradientLaboratory() {
  const activeSurfaceId = useSharedOptimizerStore(state => state.currentSurface);
  const learningRate = useSharedOptimizerStore(state => state.learningRate);
  const epoch = useSharedOptimizerStore(state => state.epoch);
  const path = useSharedOptimizerStore(state => state.pathHistory);
  
  const setSurface = useSharedOptimizerStore(state => state.setSurface);
  const setLearningRate = useSharedOptimizerStore(state => state.setLearningRate);
  const takeGradientStepState = useSharedOptimizerStore(state => state.takeGradientStep);
  const resetState = useSharedOptimizerStore(state => state.reset);

  const surface = SURFACES[activeSurfaceId];
  const [isPlaying, setIsPlaying] = useState(false);

  // If store is somehow out of sync on mount, currentPos might be derived from path
  const currentPos = path[path.length - 1] || surface.startPos;
  const currentLoss = surface.evaluate(currentPos[0], currentPos[1]);

  const takeGradientStep = useCallback(() => {
    takeGradientStepState(surface);
  }, [surface, takeGradientStepState]);

  // Animation Loop
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        takeGradientStep();
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, takeGradientStep]);

  const handleReset = () => {
    resetState(surface.startPos);
    setIsPlaying(false);
  };

  return (
    <div className="flex h-full w-full relative bg-slate-950 overflow-hidden">
      
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [3, 2, 4], fov: 45 }}>
          <color attach="background" args={['#020617']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <Grid infiniteGrid fadeDistance={20} sectionColor="#1e293b" cellColor="#0f172a" />
          <MathSurface surface={surface} />
          <OptimizerMarker path={path} surface={surface} />
          <OrbitControls 
            makeDefault 
            maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going below ground
          />
        </Canvas>
      </div>

      {/* Telemetry HUD (Glassmorphic DOM Overlay) */}
      <div className="absolute top-6 left-6 w-80 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 shadow-xl p-5 text-slate-200 font-mono flex flex-col gap-5 z-10 rounded-sm">
        
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-widest border-b border-slate-700 pb-2 mb-2">
            Optimizer HUD
          </h2>
          <p className="text-xs text-slate-400">Interactive Gradient Descent</p>
        </div>

        {/* Surface Selection */}
        <div className="flex flex-col gap-2 text-sm">
          <label className="text-slate-500 uppercase text-[10px] tracking-widest">Loss Landscape</label>
          <select 
            value={activeSurfaceId} 
            onChange={e => {
              const newId = e.target.value;
              setSurface(newId, SURFACES[newId].startPos);
              setLearningRate(SURFACES[newId].defaultLr);
              setIsPlaying(false);
            }}
            className="bg-slate-950/80 border border-slate-700 p-2 text-slate-200 outline-none hover:border-slate-500 transition-colors"
          >
            {Object.values(SURFACES).map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.equation})</option>
            ))}
          </select>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/50 border border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">Epoch</span>
            <span className="text-emerald-400">{epoch}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">Loss (Z)</span>
            <span className="text-emerald-400">{currentLoss.toFixed(4)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">X Coord</span>
            <span className="text-slate-300">{currentPos[0].toFixed(4)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">Y Coord</span>
            <span className="text-slate-300">{currentPos[1].toFixed(4)}</span>
          </div>
        </div>

        {/* Hyperparameters */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-slate-500 uppercase text-[10px] tracking-widest">Learning Rate (α)</label>
            <span className="text-xs">{learningRate}</span>
          </div>
          <input 
            type="range" 
            min="0.001" 
            max="0.5" 
            step="0.001" 
            value={learningRate} 
            onChange={e => setLearningRate(parseFloat(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button 
            onClick={takeGradientStep}
            disabled={isPlaying}
            className="col-span-1 bg-slate-800 border border-slate-700 py-2 text-xs hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Step
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`col-span-1 border py-2 text-xs transition-colors ${isPlaying ? 'bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50' : 'bg-emerald-900/30 border-emerald-800 text-emerald-400 hover:bg-emerald-900/50'}`}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>
          <button 
            onClick={handleReset}
            className="col-span-1 bg-slate-800 border border-slate-700 py-2 text-xs hover:bg-slate-700 transition-colors text-slate-400"
          >
            Reset
          </button>
        </div>

      </div>
    </div>
  );
}
