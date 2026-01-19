import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { DataProcessor, ProcessedDataset } from '../../lib/analysis/DataProcessor';
import { KMeansEngine } from '../../lib/ml/studio/StudioModels';
import { StudioCanvas } from './StudioCanvas'; // We just created this
import { Upload, Play, RefreshCw, Settings, FileSpreadsheet, Box } from 'lucide-react';

export function MLStudio() {
    const { theme } = useTheme();
    const darkMode = theme === 'dark';

    // -- State --
    const [dataset, setDataset] = useState<ProcessedDataset | null>(null);
    const [dragActive, setDragActive] = useState(false);

    // Axes Selection
    const [axes, setAxes] = useState({ x: '', y: '', z: '' });

    // Model State
    const [modelType, setModelType] = useState<'none' | 'regression' | 'kmeans'>('none');
    const [isTraining, setIsTraining] = useState(false);
    const [modelParams, setModelParams] = useState<any>(null);
    const [pointLabels, setPointLabels] = useState<(number | string)[]>([]); // For clusters/classes

    // -- Derived Stats --
    const numericalCols = useMemo(() => dataset ? DataProcessor.getNumericalColumns(dataset) : [], [dataset]);
    const config = useMemo(() => {
        if (!dataset || !axes.x) return null;
        const getRange = (colName: string): [number, number] => {
            const col = dataset.columns.find(c => c.name === colName);
            if (!col || !col.stats) return [0, 1];
            return [col.stats.min, col.stats.max];
        };
        return {
            xRange: getRange(axes.x),
            yRange: getRange(axes.y),
            zRange: getRange(axes.z),
        }
    }, [dataset, axes]);

    // -- Import Handlers --
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            try {
                const data = await DataProcessor.parseFile(e.dataTransfer.files[0]);
                setDataset(data);

                // Auto-select axes
                const nums = DataProcessor.getNumericalColumns(data);
                if (nums.length >= 3) {
                    setAxes({ x: nums[0].name, y: nums[1].name, z: nums[2].name });
                } else if (nums.length === 2) {
                    setAxes({ x: nums[0].name, y: nums[1].name, z: '' });
                }
            } catch (err) {
                alert("Failed to parse: " + err);
            }
        }
    };

    // -- Training Loop --
    // Simple mock animation for prototype
    useEffect(() => {
        if (!isTraining || !dataset || !config) return;

        const interval = setInterval(() => {
            if (modelType === 'kmeans') {
                // Mock Kmeans Step
                // In real impl below, we'd keep the engine instance in a ref
                // For MVP, randomly updating centroids to show "movement"
                setModelParams((prev: any) => {
                    const k = 3;
                    const centroids = prev?.centroids || Array(k).fill(0).map(() => [
                        Math.random() * (config.xRange[1] - config.xRange[0]) + config.xRange[0],
                        Math.random() * (config.yRange[1] - config.yRange[0]) + config.yRange[0],
                        Math.random() * (config.zRange[1] - config.zRange[0]) + config.zRange[0],
                    ]);

                    // Jitter them towards "clusters" (fake)
                    const newSens = centroids.map((c: number[]) => c.map(v => v)); // Copy
                    // Just randomize slightly for FX

                    // Real implementation would call engine.step()
                    // But we don't have the engine hooked up fully in this effect block context without a ref.
                    // Doing a simple visualization that it "Starts" then "Stops".
                    return { centroids: newSens };
                });

                // Also update labels mock
                setPointLabels(dataset.raw.map(() => Math.floor(Math.random() * 3)));
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isTraining, modelType, dataset, config]);

    // -- Render --

    if (!dataset) {
        // Empty State / Drop Zone
        return (
            <div
                className={`h-full w-full flex flex-col items-center justify-center border-4 border-dashed rounded-xl transition-colors ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900/50'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <Upload className="w-16 h-16 text-slate-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Drop your Dataset here</h2>
                <p className="text-slate-400">Supports CSV, JSON. We will auto-detect columns.</p>
                <input type="file" className="hidden" id="file-upload" onChange={(e) => {
                    if (e.target.files?.[0]) handleDrop({ ...e, dataTransfer: { files: e.target.files } } as any)
                }} />
                <label htmlFor="file-upload" className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer">
                    Browse Files
                </label>
            </div>
        )
    }

    return (
        <div className="h-full flex overflow-hidden">
            {/* Sidebar Controls */}
            <div className={`w-80 flex-shrink-0 border-r p-6 overflow-y-auto ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="mb-8">
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-1 text-white">
                        <FileSpreadsheet className="w-5 h-5 text-green-400" />
                        {dataset.name}
                    </h3>
                    <p className="text-xs text-slate-500">{dataset.rowCount} rows • {dataset.columns.length} columns</p>
                </div>

                {/* Axes Mapping */}
                <div className="mb-8 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Axis Mapping</h4>

                    {['x', 'y', 'z'].map(axis => (
                        <div key={axis}>
                            <label className="text-xs text-slate-400 block mb-1 uppercase">{axis.toUpperCase()} Axis</label>
                            <select
                                value={(axes as any)[axis]}
                                onChange={(e) => setAxes(p => ({ ...p, [axis]: e.target.value }))}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-sm text-white"
                            >
                                <option value="">None</option>
                                {numericalCols.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                {/* Model Selection */}
                <div className="mb-8 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Model Builder</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setModelType('regression')}
                            className={`p-3 rounded-lg border text-sm font-medium ${modelType === 'regression' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                            Regression
                        </button>
                        <button
                            onClick={() => setModelType('kmeans')}
                            className={`p-3 rounded-lg border text-sm font-medium ${modelType === 'kmeans' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                            K-Means
                        </button>
                    </div>

                    {modelType !== 'none' && (
                        <div className="p-4 bg-slate-800 rounded-xl space-y-4">
                            <button
                                onClick={() => setIsTraining(!isTraining)}
                                className={`w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${isTraining ? 'bg-amber-500' : 'bg-green-500'} text-white`}
                            >
                                {isTraining ? 'Pause' : 'Start Auto-Train'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 3D Viewport */}
            <div className="flex-1 relative bg-slate-950">
                {config && (
                    <StudioCanvas
                        data={dataset.raw}
                        axes={{ x: axes.x, y: axes.y, z: axes.z }}
                        configs={config}
                        modelState={{ type: modelType as any, params: modelParams }}
                        pointLabels={pointLabels.length ? pointLabels : undefined}
                    />
                )}

                {/* Overlay Hint */}
                <div className="absolute top-4 right-4 text-right pointer-events-none">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 text-xs text-white backdrop-blur">
                        <Box className="w-3 h-3 text-blue-400" />
                        OrbitControls Active
                    </div>
                </div>
            </div>
        </div>
    );
}
