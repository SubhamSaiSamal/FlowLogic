import { useState, useMemo, useEffect } from 'react';
import { DATASETS, DataPoint, Dataset } from '../../data/datasets';
import { LinearRegressionModel } from '../../lib/ml/LinearRegression';
import { Optimizer, SGD, Momentum, Adam } from '../../lib/ml/Optimizers';
import { KMeans } from '../../lib/ml/KMeans';
import { DataVisualizer3D } from '../visualizations/DataVisualizer3D';
import { LossLandscape3D } from '../visualizations/LossLandscape3D';
import { useMLAnimation } from '../../lib/useMLAnimation';
import { Play, Pause, RotateCcw, Database, Upload, Code, Check, Settings2, BarChart2, Mountain } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Papa from 'papaparse';

interface DataModeProps {
    initialView?: 'regression' | 'loss';
}
export function DataMode({ initialView = 'regression' }: DataModeProps) {
    const { theme } = useTheme();
    const darkMode = theme === 'dark';

    // ... existing sync effect

    // Data State
    const [customData, setCustomData] = useState<Dataset | null>(null);
    const [selectedDatasetId, setSelectedDatasetId] = useState('study-scores');

    // Derived active dataset
    const activeDataset = useMemo(() => {
        if (selectedDatasetId === 'custom' && customData) return customData;
        return DATASETS.find(d => d.id === selectedDatasetId) || DATASETS[0];
    }, [selectedDatasetId, customData]);

    // UI State
    const [showImportModal, setShowImportModal] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [importText, setImportText] = useState('1,2,10\n2,3,15\n3,4,20');
    const [viewMode, setViewMode] = useState<'regression' | 'loss'>(initialView);

    // Model Selection
    const [modelType, setModelType] = useState<'regression' | 'kmeans'>('regression');

    // Regression Settings
    const [optimizerType, setOptimizerType] = useState<'sgd' | 'momentum' | 'adam'>('sgd');
    const [learningRate, setLearningRate] = useState(0.01);

    // KMeans Settings
    const [kClusters, setKClusters] = useState(3);

    // Model State
    const numFeatures = activeDataset.data[0]?.features.length || 1;
    const is3D = numFeatures >= 2;

    // Regression Model
    const [model, setModel] = useState(() => new LinearRegressionModel(numFeatures, null, { learningRate }));
    const [weights, setWeights] = useState<number[]>(new Array(numFeatures).fill(0));
    const [bias, setBias] = useState(0);
    const [loss, setLoss] = useState(0);

    // KMeans Model
    const [kmeans, setKmeans] = useState(() => new KMeans(kClusters));
    const [centroids, setCentroids] = useState<number[][]>([]);
    const [assignments, setAssignments] = useState<number[]>([]);

    // Re-init models
    useEffect(() => {
        // Regression Init
        let optim: Optimizer;
        const config = { learningRate };
        if (optimizerType === 'momentum') optim = new Momentum({ ...config, momentum: 0.9 });
        else if (optimizerType === 'adam') optim = new Adam({ ...config });
        else optim = new SGD(config);

        const newModel = new LinearRegressionModel(numFeatures, optim, config);
        setModel(newModel);
        setWeights(new Array(numFeatures).fill(0));
        setBias(0);

        // KMeans Init
        const newKMeans = new KMeans(kClusters);
        setKmeans(newKMeans);
        setCentroids([]);
        setAssignments([]);

        setLoss(0);
        reset();
    }, [activeDataset.id, numFeatures, optimizerType, learningRate, modelType, kClusters]);

    // Animation Hook
    const { isPlaying, togglePlay, reset, step, iteration } = useMLAnimation(() => {
        if (modelType === 'regression') {
            const result = model.step(activeDataset.data);
            setWeights([...model.weights]);
            setBias(model.bias);
            setLoss(result.loss);
        } else {
            // KMeans Step
            // Transform data for KMeans: needs number[][]
            // For simple viz, we use features + label? Or just features?
            // Usually unsupervised on features.
            // Let's use [features..., label] so we visualize in same space?
            // OR just features.
            // If we use just features, visualization won't match "Y" axis if Label is Y.
            // Let's use ALL coords: [...features, label]
            const rawData = activeDataset.data.map(d => [...(d.features || []), d.label || 0]);
            kmeans.step(rawData);
            setCentroids([...kmeans.centroids]);
            setAssignments([...kmeans.assignments]);
            setLoss(0); // Inertia?
        }
    }, 10); // Slower/Faster?

    const handleImport = () => {
        const results = Papa.parse(importText, { dynamicTyping: true, skipEmptyLines: true });
        if (results.data && results.data.length > 0) {
            const parsedData: DataPoint[] = (results.data as number[][]).map((row, idx) => {
                const features = row.slice(0, row.length - 1);
                const label = row[row.length - 1];
                return { id: idx, features, label };
            });

            const newDataset: Dataset = {
                id: 'custom',
                name: 'Custom Dataset',
                type: 'regression', // or generic
                description: `Imported data with ${parsedData.length} points.`,
                features: new Array(parsedData[0].features.length).fill('Feature'),
                data: parsedData
            };
            setCustomData(newDataset);
            setSelectedDatasetId('custom');
            setShowImportModal(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            setImportText(text); // Populate text area too
            // Auto parse?
            const results = Papa.parse(text, { dynamicTyping: true, skipEmptyLines: true });
            if (results.data && results.data.length > 0) {
                const parsedData: DataPoint[] = (results.data as number[][]).map((row, idx) => {
                    const features = row.slice(0, row.length - 1);
                    const label = row[row.length - 1];
                    return { id: idx, features, label };
                });
                const newDataset: Dataset = {
                    id: 'custom',
                    name: file.name,
                    type: 'regression',
                    description: `File: ${file.name} (${parsedData.length} points)`,
                    features: new Array(parsedData[0].features.length).fill('Feature'),
                    data: parsedData
                };
                setCustomData(newDataset);
                setSelectedDatasetId('custom');
                setShowImportModal(false);
            }
        };
        reader.readAsText(file);
    };

    const generatePythonCode = () => {
        if (modelType === 'regression') {
            return `import numpy as np
from sklearn.linear_model import SGDRegressor

# Dataset: ${activeDataset.name}
X = np.array([${activeDataset.data.map(d => `[${d.features.join(',')}]`).join(', ')}])
y = np.array([${activeDataset.data.map(d => d.label).join(', ')}])

# Optimizer: ${optimizerType.toUpperCase()}
model = SGDRegressor(learning_rate='constant', eta0=${learningRate})
model.fit(X, y)

print("Learned Coefficients:", model.coef_)
print("Learned Intercept:", model.intercept_)`;
        } else {
            return `import numpy as np
from sklearn.cluster import KMeans

# Dataset: ${activeDataset.name}
# Using Features + Label for clustering as visualized
data = np.array([${activeDataset.data.map(d => `[${[...d.features, d.label].join(',')}]`).join(', ')}])

model = KMeans(n_clusters=${kClusters})
model.fit(data)

print("Centroids:", model.cluster_centers_)
print("Labels:", model.labels_)`;
        }
    };

    return (
        <div className="h-full flex flex-col relative">
            {/* Header */}
            <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <div>
                    {viewMode === 'loss' ? (
                        /* Loss Mode Clean Header */
                        <div>
                            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Loss Landscape Explorer
                            </h2>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Visualizing the 3D Cost Function (MSE) surface. Watch how the optimizer descends the valley.
                            </p>
                        </div>
                    ) : (
                        /* Standard Dataset Selector */
                        <>
                            <div className="relative group">
                                <button className={`text-2xl font-bold flex items-center gap-2 hover:opacity-80 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {activeDataset.name}
                                    <span className="text-xs align-middle opacity-50">▼</span>
                                </button>
                                <div className="absolute top-full left-0 pt-2 w-64 z-50 group-hover:block hidden">
                                    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                                        {DATASETS.map(ds => (
                                            <button
                                                key={ds.id}
                                                onClick={() => setSelectedDatasetId(ds.id)}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700 flex justify-between items-center ${selectedDatasetId === ds.id ? 'bg-slate-700 text-white' : 'text-slate-300'}`}
                                            >
                                                {ds.name}
                                                {selectedDatasetId === ds.id && <Check className="w-4 h-4 text-green-400" />}
                                            </button>
                                        ))}
                                        {customData && (
                                            <button
                                                onClick={() => setSelectedDatasetId('custom')}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700 flex justify-between items-center border-t border-slate-700 ${selectedDatasetId === 'custom' ? 'bg-slate-700 text-white' : 'text-slate-300'}`}
                                            >
                                                Custom Dataset
                                                {selectedDatasetId === 'custom' && <Check className="w-4 h-4 text-green-400" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{activeDataset.description}</p>
                        </>
                    )}
                </div>

                {/* View Mode Tabs */}
                <div className={`flex p-1 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <button
                        onClick={() => setViewMode('regression')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'regression' ? (darkMode ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow') : 'text-slate-500 hover:text-slate-400'}`}
                    >
                        <BarChart2 className="w-4 h-4" /> Regression View
                    </button>
                    <button
                        onClick={() => setViewMode('loss')}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'loss' ? (darkMode ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow') : 'text-slate-500 hover:text-slate-400'}`}
                    >
                        <Mountain className="w-4 h-4" /> Loss Landscape
                    </button>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setShowCodeModal(true)} className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}>
                        <Code className="w-4 h-4" /> Export Code
                    </button>
                    <button onClick={() => setShowImportModal(true)} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Import Data
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Visualizer Area */}
                <div className="flex-1 relative bg-slate-900">
                    {viewMode === 'regression' ? (
                        <DataVisualizer3D
                            data={activeDataset.data}
                            weights={modelType === 'regression' ? weights : undefined}
                            bias={modelType === 'regression' ? bias : undefined}
                            centroids={modelType === 'kmeans' ? centroids : undefined}
                            assignments={modelType === 'kmeans' ? assignments : undefined}
                            showPlane={modelType === 'regression'}
                        />
                    ) : (
                        <LossLandscape3D
                            data={activeDataset.data}
                            history={model.history}
                            currentWeights={weights}
                            currentBias={bias}
                        />
                    )}

                    {/* Overlay Stats */}
                    <div className="absolute top-4 right-4 p-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl text-right z-10">
                        {modelType === 'regression' ? (
                            <>
                                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Loss (MSE)</div>
                                <div className="text-2xl font-mono font-bold text-red-400">{loss.toFixed(4)}</div>
                            </>
                        ) : (
                            <>
                                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Clusters</div>
                                <div className="text-2xl font-mono font-bold text-blue-400">{kClusters}</div>
                            </>
                        )}
                        <div className="text-xs text-slate-400 uppercase tracking-widest mt-4 mb-1">Iteration</div>
                        <div className="text-xl font-mono font-bold text-white">#{iteration}</div>
                    </div>
                </div>

                {/* Controls Sidebar */}
                <aside className={`w-80 border-l p-6 overflow-y-auto ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-semibold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        <Settings2 className="w-5 h-5" />
                        Training Controls
                    </h3>

                    {/* Model Type Selector */}
                    <div className="mb-6 space-y-3">
                        <label className={`text-xs uppercase font-bold tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Model Type</label>
                        <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                            {(['regression', 'kmeans'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => !isPlaying && setModelType(m)}
                                    className={`flex-1 py-1 text-xs font-bold uppercase rounded ${modelType === m ? 'bg-white dark:bg-slate-700 shadow text-blue-500' : 'text-slate-500'}`}
                                >
                                    {m === 'regression' ? 'Regression' : 'Clustering'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {modelType === 'regression' ? (
                        <>
                            {/* Optimizer Selector */}
                            <div className="mb-6 space-y-3">
                                <label className={`text-xs uppercase font-bold tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Optimizer</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['sgd', 'momentum', 'adam'] as const).map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => !isPlaying && setOptimizerType(opt)}
                                            disabled={isPlaying}
                                            className={`px-2 py-2 rounded-lg text-xs font-bold uppercase ${optimizerType === opt
                                                ? 'bg-blue-500 text-white'
                                                : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-xs text-slate-500 italic mt-1">
                                    {optimizerType === 'sgd' && "Standard Gradient Descent. Simple but can get stuck."}
                                    {optimizerType === 'momentum' && "Accelerates in relevant directions (like a heavy ball)."}
                                    {optimizerType === 'adam' && "Adaptive learning rates. Fast convergence."}
                                </div>
                            </div>

                            {/* Learning Rate */}
                            <div className="mb-6 space-y-3">
                                <div className="flex justify-between">
                                    <label className={`text-xs uppercase font-bold tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Learning Rate</label>
                                    <span className="text-xs font-mono text-blue-400">{learningRate}</span>
                                </div>
                                <input
                                    type="range"
                                    min="-4"
                                    max="-1"
                                    step="0.1"
                                    value={Math.log10(learningRate)}
                                    onChange={(e) => !isPlaying && setLearningRate(Math.pow(10, parseFloat(e.target.value)))}
                                    disabled={isPlaying}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mb-2"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                    <span>0.0001</span>
                                    <span>Default (0.01)</span>
                                    <span>0.1</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* KMeans Settings */
                        <div className="mb-6 space-y-3">
                            <div className="flex justify-between">
                                <label className={`text-xs uppercase font-bold tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>K (Clusters)</label>
                                <span className="text-xs font-mono text-blue-400">{kClusters}</span>
                            </div>
                            <input
                                type="range"
                                min="2"
                                max="10"
                                step="1"
                                value={kClusters}
                                onChange={(e) => !isPlaying && setKClusters(parseInt(e.target.value))}
                                disabled={isPlaying}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mb-2"
                            />
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={togglePlay}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-all`}
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            {isPlaying ? 'Pause' : 'Start Training'}
                        </button>

                        <button
                            onClick={() => {
                                if (modelType === 'regression') {
                                    model.reset();
                                    setWeights(new Array(numFeatures).fill(0));
                                    setBias(0);
                                } else {
                                    kmeans.reset();
                                    setCentroids([]);
                                    setAssignments([]);
                                }
                                reset();
                            }}
                            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset Model
                        </button>

                        <div className="mt-8 pt-4 border-t border-slate-700">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Model Parameters</h4>
                            {modelType === 'regression' ? (
                                <>
                                    {weights.map((w, i) => (
                                        <div key={i} className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-400">Weight {i + 1} (w{i + 1})</span>
                                            <span className="font-mono text-blue-400">{w.toFixed(4)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Bias (b)</span>
                                        <span className="font-mono text-green-400">{bias.toFixed(4)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-slate-400">
                                    {centroids.length} centroids active.
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Import Custom Data</h3>

                        <div className="mb-6 p-8 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50 flex flex-col items-center justify-center text-center">
                            <Upload className="w-10 h-10 text-slate-500 mb-4" />
                            <p className="text-sm text-slate-400 mb-2">Drag and drop your CSV file here</p>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleFileUpload}
                                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                            />
                        </div>

                        <p className="text-sm text-slate-500 mb-2">Or paste CSV data below:</p>
                        <textarea
                            className="w-full h-32 bg-slate-950 text-green-400 font-mono text-sm p-4 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="1.2, 3.4, 10.0&#10;..."
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button onClick={handleImport} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">Import Text</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Code Export Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className={`w-full max-w-2xl p-6 rounded-2xl shadow-2xl ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Generated Python Code</h3>
                        <pre className="w-full h-64 bg-slate-950 text-blue-300 font-mono text-xs p-4 rounded-lg mb-4 overflow-auto">
                            {generatePythonCode()}
                        </pre>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCodeModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Close</button>
                            <button onClick={() => navigator.clipboard.writeText(generatePythonCode())} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg">Copy to Clipboard</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
