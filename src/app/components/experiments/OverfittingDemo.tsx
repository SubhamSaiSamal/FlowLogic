import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext'; // Corrected Path
import { LinearRegressionModel } from '../../lib/ml/LinearRegression';
import { Adam } from '../../lib/ml/Optimizers';
import { Play, RotateCcw, TrendingUp, Info } from 'lucide-react';
import { useMLAnimation } from '../../lib/useMLAnimation';

// --- Types ---
interface Point { x: number; y: number; }

// --- Polynomial Helper ---
function polynomialFeatures(x: number, degree: number): number[] {
    const features = [];
    for (let d = 1; d <= degree; d++) {
        features.push(Math.pow(x, d));
    }
    return features;
}

export function OverfittingDemo() {
    const { theme } = useTheme();
    const darkMode = theme === 'dark';

    // 1. Data Generation (Noisy Sine Wave)
    const [points, setPoints] = useState<Point[]>([]);

    // Generate data on mount
    useEffect(() => {
        const newPoints: Point[] = [];
        for (let i = 0; i < 30; i++) {
            const x = (i / 29) * Math.PI * 2; // 0 to 2pi
            const y = Math.sin(x) + (Math.random() - 0.5) * 0.8; // Sine + Noise
            newPoints.push({ x, y });
        }
        setPoints(newPoints);
    }, []);

    // Split 80/20
    const { trainSet, valSet } = useMemo(() => {
        // Simple first 80% split
        const splitIdx = Math.floor(points.length * 0.8);
        return {
            trainSet: points.slice(0, splitIdx),
            valSet: points.slice(splitIdx)
        };
    }, [points]);

    // 2. State
    const [degree, setDegree] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);

    // 3. Model Setup
    // We need to scale features because x^15 is huge
    const scaler = useMemo(() => {
        // Find min/max for each power up to max degree 15
        // Just storing max x is enough since min is 0
        const maxX = Math.PI * 2;
        return { scale: (x: number) => x / maxX };
    }, []);

    const [model, setModel] = useState(() => new LinearRegressionModel(1, new Adam({ learningRate: 0.1 })));
    const [epoch, setEpoch] = useState(0);
    const [trainLoss, setTrainLoss] = useState(0);
    const [valLoss, setValLoss] = useState(0);

    // Re-init model when degree changes
    useEffect(() => {
        const optim = new Adam({ learningRate: 0.05 }); // High LR for fast demo convergence
        setModel(new LinearRegressionModel(degree, optim));
        setEpoch(0);
        setTrainLoss(0);
        setValLoss(0);
    }, [degree]); // Reset on degree change

    // 4. Training Loop
    useEffect(() => {
        if (!isPlaying) return;

        let animationFrame: number;

        const loop = () => {
            // Train Step
            // Prepare Batch
            const batch = trainSet.map((p, i) => ({
                id: i,
                // Feature Engineering: x -> [x, x^2...], Scaled
                features: polynomialFeatures(scaler.scale(p.x), degree),
                label: p.y
            }));

            const result = model.step(batch);

            // Validation
            let vLoss = 0;
            valSet.forEach(p => {
                const feats = polynomialFeatures(scaler.scale(p.x), degree);
                const pred = model.predict(feats);
                vLoss += (pred - p.y) ** 2;
            });
            vLoss /= valSet.length;

            setTrainLoss(result.loss);
            setValLoss(vLoss);
            setEpoch(e => e + 1);

            animationFrame = requestAnimationFrame(loop);
        };
        loop();

        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, trainSet, valSet, degree, model, scaler]);

    // 5. Visualization Points
    const curvePoints = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * Math.PI * 2;
            const feats = polynomialFeatures(scaler.scale(x), degree);
            const y = model.predict(feats);
            pts.push({ x, y });
        }
        return pts;
    }, [epoch, degree, model, scaler]); // Re-calc when epoch updates

    // SVG scaling
    const width = 600;
    const height = 400;
    const padding = 40;
    const mapX = (x: number) => padding + (x / (Math.PI * 2)) * (width - 2 * padding);
    const mapY = (y: number) => height - (padding + ((y + 1.5) / 3) * (height - 2 * padding)); // y range approx -1.5 to 1.5

    return (
        <div className={`h-full flex flex-col ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <div className={`p-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'} flex justify-between items-center`}>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                    Overfitting Simulator
                </h2>
                <div className="flex gap-4">
                    <div className={`opacity-80 text-sm flex gap-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        <span>
                            Status: <strong className={degree < 3 ? 'text-amber-500' : degree > 8 ? 'text-red-500' : 'text-green-500'}>
                                {degree < 3 ? 'UNDERFITTING' : degree > 8 ? 'OVERFITTING' : 'GOOD FIT'}
                            </strong>
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Viz */}
                <div className="flex-1 relative flex items-center justify-center p-8">
                    <div className="relative shadow-2xl rounded-xl overflow-hidden bg-white/5 border border-slate-500/20">
                        <svg width={width} height={height}>
                            {/* Grid */}
                            <line x1={padding} y1={mapY(0)} x2={width - padding} y2={mapY(0)} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                            <line x1={mapX(0)} y1={padding} x2={mapX(0)} y2={height - padding} stroke={darkMode ? "#334155" : "#e2e8f0"} />

                            {/* Train Points (Blue) */}
                            {trainSet.map((p, i) => (
                                <circle key={`tr-${i}`} cx={mapX(p.x)} cy={mapY(p.y)} r={4} fill="#3b82f6" opacity={0.7} />
                            ))}

                            {/* Val Points (Red Holo) */}
                            {valSet.map((p, i) => (
                                <circle key={`val-${i}`} cx={mapX(p.x)} cy={mapY(p.y)} r={4} stroke="#ef4444" strokeWidth={2} fill="transparent" />
                            ))}

                            {/* Prediction Curve */}
                            <path
                                d={`M ${curvePoints.map(p => `${mapX(p.x)},${mapY(p.y)}`).join(' L ')}`}
                                fill="none"
                                stroke={degree > 8 ? '#f43f5e' : '#10b981'}
                                strokeWidth={3}
                            />
                        </svg>

                        {/* Legend */}
                        <div className="absolute top-4 right-4 text-xs space-y-1 bg-black/50 p-2 rounded backdrop-blur text-white">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Training Data</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-red-500"></div> Validation Data</div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className={`w-80 border-l p-6 ${darkMode ? 'border-slate-800 bg-slate-900' : 'bg-white border-slate-200'}`}>
                    <h3 className="font-bold mb-6">Experiment Controls</h3>

                    <div className="mb-8">
                        <label className="text-xs uppercase font-bold tracking-wider opacity-50 block mb-2">Model Complexity (Polynomial Degree)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="15"
                                step="1"
                                value={degree}
                                onChange={(e) => { setIsPlaying(false); setDegree(parseInt(e.target.value)); }}
                                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-2xl font-mono font-bold w-8 text-center">{degree}</span>
                        </div>
                        <p className="text-xs mt-2 opacity-60">
                            {degree === 1 && "Linear (Line). Too simple."}
                            {degree >= 3 && degree <= 6 && "Cubic/Poly. Just right."}
                            {degree > 10 && "High Degree. Fits noise."}
                        </p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${isPlaying ? 'bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white transition-all`}
                        >
                            {isPlaying ? 'Pause Fitting' : <><Play className="w-4 h-4" /> Start Fitting</>}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="space-y-4 pt-6 border-t border-slate-700">
                        <div className="flex justify-between items-center">
                            <span className="text-xs uppercase tracking-wider opacity-50">Training Loss (MSE)</span>
                            <span className="font-mono text-blue-400 font-bold">{trainLoss.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs uppercase tracking-wider opacity-50">Validation Loss (MSE)</span>
                            <span className={`font-mono font-bold ${valLoss > trainLoss * 1.5 ? 'text-red-500' : 'text-green-500'}`}>
                                {valLoss.toFixed(4)}
                            </span>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div className="mt-8 p-4 bg-slate-800 rounded-lg text-xs leading-relaxed opacity-80">
                        <Info className="w-4 h-4 mb-2 text-blue-400" />
                        <p className="mb-2"><strong>Underfitting (Deg 1-2):</strong> Model is too simple to capture the sine wave pattern. High Train & Val loss.</p>
                        <p><strong>Overfitting (Deg 10+):</strong> Model wiggles to hit every single blue dot, but misses the red dots. Low Train loss, High Val loss.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
