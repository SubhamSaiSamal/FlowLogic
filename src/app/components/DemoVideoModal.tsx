import { X, Play } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'motion/react';

interface DemoVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DemoVideoModal({ isOpen, onClose }: DemoVideoModalProps) {
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
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl z-50 p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title className="text-2xl font-bold text-white">
                                        FlowLogic Demo
                                    </Dialog.Title>
                                    <Dialog.Close asChild>
                                        <button className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </Dialog.Close>
                                </div>

                                <Dialog.Description className="text-slate-400 mb-6">
                                    Watch how FlowLogic helps you understand gradient descent through interactive visualization
                                </Dialog.Description>

                                {/* Video/Animation Container */}
                                <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
                                    {/* Placeholder for demo - Replace with actual video */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                                <Play className="w-10 h-10 text-blue-400" />
                                            </div>
                                            <p className="text-slate-400 mb-2">Demo Video Coming Soon</p>
                                            <p className="text-sm text-slate-600">
                                                In the meantime, click "Start Visualizing" to try the app!
                                            </p>
                                        </div>
                                    </div>

                                    {/* Uncomment and use this when you have a video file */}
                                    {/* <video 
                    controls 
                    autoPlay 
                    className="w-full h-full"
                    poster="/path-to-thumbnail.jpg"
                  >
                    <source src="/path-to-demo-video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video> */}
                                </div>

                                {/* Features Highlight */}
                                <div className="mt-6 grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 rounded-lg bg-slate-800/50">
                                        <div className="text-2xl font-bold text-blue-400 mb-1">6+</div>
                                        <div className="text-xs text-slate-400">Functions</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-slate-800/50">
                                        <div className="text-2xl font-bold text-purple-400 mb-1">Real-time</div>
                                        <div className="text-xs text-slate-400">Visualization</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-slate-800/50">
                                        <div className="text-2xl font-bold text-cyan-400 mb-1">Interactive</div>
                                        <div className="text-xs text-slate-400">Learning</div>
                                    </div>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}
