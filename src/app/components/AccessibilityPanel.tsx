import { X, Type, Eye, Zap } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

interface AccessibilityPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
    const [fontSize, setFontSize] = useState<FontSize>(() => {
        return (localStorage.getItem('flowlogic-font-size') as FontSize) || 'medium';
    });

    const [highContrast, setHighContrast] = useState(() => {
        return localStorage.getItem('flowlogic-high-contrast') === 'true';
    });

    const [reducedMotion, setReducedMotion] = useState(() => {
        return localStorage.getItem('flowlogic-reduced-motion') === 'true';
    });

    // Apply font size
    useEffect(() => {
        const root = document.documentElement;
        const fontSizes = {
            'small': '14px',
            'medium': '16px',
            'large': '18px',
            'extra-large': '20px',
        };
        root.style.setProperty('--font-size', fontSizes[fontSize]);
        localStorage.setItem('flowlogic-font-size', fontSize);
    }, [fontSize]);

    // Apply high contrast
    useEffect(() => {
        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
        localStorage.setItem('flowlogic-high-contrast', String(highContrast));
    }, [highContrast]);

    // Apply reduced motion
    useEffect(() => {
        if (reducedMotion) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
        localStorage.setItem('flowlogic-reduced-motion', String(reducedMotion));
    }, [reducedMotion]);

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                            />
                        </Dialog.Overlay>

                        <Dialog.Content asChild>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                                className="fixed right-4 top-4 w-full max-w-md max-h-[90vh] overflow-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl z-50 p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-2">
                                        <Type className="w-6 h-6" />
                                        Accessibility Options
                                    </Dialog.Title>
                                    <Dialog.Close asChild>
                                        <button className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </Dialog.Close>
                                </div>

                                <Dialog.Description className="text-slate-400 mb-6">
                                    Customize your learning experience for better accessibility
                                </Dialog.Description>

                                {/* Font Size */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-white mb-3">
                                        Font Size
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['small', 'medium', 'large', 'extra-large'] as FontSize[]).map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setFontSize(size)}
                                                className={`px-4 py-3 rounded-lg border-2 transition-all capitalize ${fontSize === size
                                                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                {size.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* High Contrast */}
                                <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                                <Eye className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">High Contrast Mode</div>
                                                <div className="text-xs text-slate-500">Enhance text visibility</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setHighContrast(!highContrast)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${highContrast ? 'bg-blue-500' : 'bg-slate-700'
                                                }`}
                                        >
                                            <motion.div
                                                animate={{ x: highContrast ? 24 : 2 }}
                                                className="absolute top-1 w-4 h-4 rounded-full bg-white"
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Reduced Motion */}
                                <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                                <Zap className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">Reduce Motion</div>
                                                <div className="text-xs text-slate-500">Minimize animations</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setReducedMotion(!reducedMotion)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${reducedMotion ? 'bg-blue-500' : 'bg-slate-700'
                                                }`}
                                        >
                                            <motion.div
                                                animate={{ x: reducedMotion ? 24 : 2 }}
                                                className="absolute top-1 w-4 h-4 rounded-full bg-white"
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/30">
                                    <p className="text-sm text-blue-400">
                                        💡 Your preferences are saved automatically and will persist across sessions.
                                    </p>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}
