import { useState, useMemo, useEffect } from 'react';
import { DATASETS, DataPoint, Dataset } from '../../data/datasets';
import { LinearRegressionModel } from '../../lib/ml/LinearRegression';
import { DataVisualizer3D } from '../visualizations/DataVisualizer3D';
import { useMLAnimation } from '../../lib/useMLAnimation';
import { Play, Pause, RotateCcw, Database, Upload, Code } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Papa from 'papaparse';

export function DataMode() {
    const { theme } = useTheme();
    const darkMode = theme === 'dark';

    // Data State
    const [customData, setCustomData] = useState<Dataset | null>(null);
    const [selectedDatasetId, setSelectedDatasetId] = useState('study-scores');
    const activeDataset = customData || DATASETS.find(d => d.id === selectedDatasetId)!;

    // UI State
    const [showImportModal, setShowImportModal] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [importText, setImportText] = useState('1,2,10\n2,3,15\n3,4,20');

    // Model State
    // Determine # of features from data
    const numFeatures = activeDataset.data[0]?.features.length || 1;
    const is3D = numFeatures >= 2;

    const [model, setModel] = useState(() => new LinearRegressionModel(numFeatures, 0.005));
    const [weights, setWeights] = useState<number[]>(new Array(numFeatures).fill(0));
    const [bias, setBias] = useState(0);
    const [loss, setLoss] = useState(0);

    // Re-init model when dataset changes
    useEffect(() => {
        const newModel = new LinearRegressionModel(numFeatures, 0.005);
        setModel(newModel);
        setWeights(new Array(numFeatures).fill(0));
        setBias(0);
        setLoss(0);
        reset();
    }, [activeDataset, numFeatures]);

    // Animation Hook
    const { isPlaying, togglePlay, reset, step, iteration } = useMLAnimation(() => {
        const result = model.step(activeDataset.data);
        setWeights([...model.weights]);
        setBias(model.bias);
        setLoss(result.loss);
    }, 5);

    const handleImport = () => {
        const results = Papa.parse(importText, { dynamicTyping: true, skipEmptyLines: true });
        if (results.data && results.data.length > 0) {
            const parsedData: DataPoint[] = (results.data as number[][]).map((row, idx) => {
                // Assume last column is label
                const features = row.slice(0, row.length - 1);
                const label = row[row.length - 1];
                return { id: idx, features, label };
            });

            const newDataset: Dataset = {
                id: 'custom',
                name: 'Custom Dataset',
                type: 'regression',
                description: `Imported data with ${parsedData.length} points.`,
                features: new Array(parsedData[0].features.length).fill('Feature'),
                data: parsedData
            };
            setCustomData(newDataset);
            setShowImportModal(false);
        }
    };

    const generatePythonCode = () => {
        return `
import numpy as np
from sklearn.linear_model import LinearRegression

# Dataset: ${activeDataset.name}
X = np.array([${activeDataset.data.map(d => `[${d.features.join(',')}]`).join(', ')}])
y = np.array([${activeDataset.data.map(d => d.label).join(', ')}])

# Initialize Model
model = LinearRegression()
model.fit(X, y)

print("Learned Coefficients:", model.coef_)
print("Learned Intercept:", model.intercept_)
print("Score (R^2):", model.score(X, y))
    `.trim();
    };

    return (
        <div className="h-full flex flex-col relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div>
                    <div className={`flex items-center gap-2 mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        <Database className="w-5 h-5" />
                        <span className="text-sm font-medium">Learn with Data {is3D ? '(3D Mode)' : '(2D Mode)'}</span>
                    </div>
                    <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeDataset.name}</h1>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{activeDataset.description}</p>
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
                {/* 3D Visualizer */}
                <div className="flex-1 relative bg-slate-900">
                    <DataVisualizer3D
                        data={activeDataset.data}
                        weights={weights}
                        bias={bias}
                    />

                    {/* Overlay Stats */}
                    <div className="absolute top-4 right-4 p-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl text-right">
                        <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Loss (MSE)</div>
                        <div className="text-2xl font-mono font-bold text-red-400">{loss.toFixed(4)}</div>

                        <div className="text-xs text-slate-400 uppercase tracking-widest mt-4 mb-1">Iteration</div>
                        <div className="text-xl font-mono font-bold text-white">#{iteration}</div>
                    </div>
                </div>

                {/* Controls Sidebar */}
                <aside className={`w-80 border-l p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-semibold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Training Controls</h3>

                    <div className="space-y-4">
                        <button
                            onClick={togglePlay}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-all`}
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            {isPlaying ? 'Pause Training' : 'Start Training'}
                        </button>

                        <button
                            onClick={() => {
                                model.reset();
                                setWeights(new Array(numFeatures).fill(0));
                                setBias(0);
                                reset();
                            }}
                            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset Model
                        </button>

                        {is3D && (
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-300">
                                <strong>3D Mode Active:</strong> Detecting {numFeatures} features. Visualizing plane fit z = w1*x + w2*y + b.
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Import Custom Data (CSV)</h3>
                        <p className="text-sm text-slate-500 mb-4">Paste CSV numeric data. Last column is strictly the Label (Y). For 3D mode, provide 3 columns (x, z, y).</p>
                        <textarea
                            className="w-full h-40 bg-slate-950 text-green-400 font-mono text-sm p-4 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button onClick={handleImport} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">Import & Analyze</button>
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
