import { ArrowRight, PlayCircle, BarChart3, Brain, Target, Zap, BookOpen, CheckCircle, Sun, Moon, Type, Sparkles, Users, LogIn, UserPlus, LogOut, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { DemoVideoModal } from './DemoVideoModal';
import { AccessibilityPanel } from './AccessibilityPanel';
import { AuthModal } from './auth/AuthModal';

interface LandingPageProps {
  onNavigateToApp: () => void;
}

export function LandingPage({ onNavigateToApp }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const darkMode = theme === 'dark';
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Calculate rotation for 3D effect on hero screenshot
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const rotX = (e.clientY - centerY) / 100;
      const rotY = (e.clientX - centerX) / 100;
      setRotateX(rotX);
      setRotateY(rotY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} transition-colors relative overflow-hidden`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`,
          transition: 'background-image 0.3s ease'
        }} />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Top Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`border-b ${darkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white/80'} sticky top-0 z-50 backdrop-blur-xl`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FlowLogic Logo" className="w-9 h-9 rounded-lg" />
            <div>
              <div className="font-semibold text-lg">FlowLogic</div>
              <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Visualize how algorithms learn.</div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Auth Buttons - Show if not logged in */}
            {!user ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25`}
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </motion.button>
              </>
            ) : (
              <>
                {/* User Info */}
                <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user.email?.split('@')[0] || 'User'}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={signOut}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </motion.button>
              </>
            )}

            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowAccessibilityPanel(true)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'}`}
              title="Accessibility Options"
            >
              <Type className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.nav >

      {/* Hero Section - Linear Style */}
      <section className="relative min-h-[85vh] flex items-center justify-start overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 backdrop-blur-sm mb-6"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className={`text-xs font-medium ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>STEM Expo 2026</span>
              </motion.div>

              <h1 className={`text-5xl lg:text-6xl font-bold mb-6 leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                FlowLogic is a purpose-built tool for{' '}
                <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  visualizing algorithms
                </span>
              </h1>

              <p className={`text-lg lg:text-xl mb-6 leading-relaxed max-w-xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Meet the system for modern ML education. Visualize how Machine Learning and optimization algorithms work mathematically in real-time.
              </p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-8 mb-8"
              >
                <div>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>25+</div>
                  <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Topics</div>
                </div>
                <div>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>100+</div>
                  <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Questions</div>
                </div>
                <div>
                  <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>4</div>
                  <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Modes</div>
                </div>
              </motion.div>

              <div className="flex items-center gap-4">
                <motion.button
                  onClick={onNavigateToApp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-base flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={() => setShowDemoModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-6 py-3 rounded-lg font-medium text-base transition-all ${darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  Watch Demo
                </motion.button>
              </div>
            </motion.div>

            {/* Right: 3D Tilted Screenshot */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="relative perspective-1000 hidden lg:block"
            >
              <motion.div
                animate={{
                  rotateX: -rotateX * 0.5,
                  rotateY: rotateY * 0.5,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'rotateX(-12deg) rotateY(15deg)',
                }}
                className="relative"
              >
                {/* Glow effect behind screenshot */}
                <div className="absolute -inset-8 bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-blue-600/30 rounded-3xl blur-3xl opacity-50" />

                {/* Screenshot Container */}
                <motion.div
                  whileHover={{
                    scale: 1.02,
                    rotateX: -15,
                    rotateY: 18,
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`relative rounded-2xl overflow-hidden border-2 shadow-2xl ${darkMode ? 'border-slate-700/50 bg-slate-900' : 'border-slate-300/50 bg-white'}`}
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Browser Chrome */}
                  <div className={`px-4 py-3 border-b flex items-center gap-3 ${darkMode ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-slate-100/95'}`}>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/90" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/90" />
                      <div className="w-3 h-3 rounded-full bg-green-500/90" />
                    </div>
                    <div className={`text-xs font-mono flex-1 text-center ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      FlowLogic – Gradient Descent Visualizer
                    </div>
                  </div>

                  {/* Placeholder for Graph Screenshot - Replace with actual screenshot */}
                  <div className={`relative ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    {/* This is where you'll add your actual screenshot */}
                    {/* For now, creating a mockup visualization */}
                    <div className="p-8">
                      <svg width="100%" height="400" viewBox="0 0 600 400" className="w-full">
                        <defs>
                          <linearGradient id="graphGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Grid */}
                        {[...Array(10)].map((_, i) => (
                          <line
                            key={`h-${i}`}
                            x1="0"
                            y1={i * 40}
                            x2="600"
                            y2={i * 40}
                            stroke={darkMode ? '#1e293b' : '#e2e8f0'}
                            strokeWidth="1"
                            opacity="0.5"
                          />
                        ))}
                        {[...Array(15)].map((_, i) => (
                          <line
                            key={`v-${i}`}
                            x1={i * 40}
                            y1="0"
                            x2={i * 40}
                            y2="400"
                            stroke={darkMode ? '#1e293b' : '#e2e8f0'}
                            strokeWidth="1"
                            opacity="0.5"
                          />
                        ))}

                        {/* Axes */}
                        <line x1="0" y1="200" x2="600" y2="200" stroke={darkMode ? '#475569' : '#94a3b8'} strokeWidth="2" />
                        <line x1="300" y1="0" x2="300" y2="400" stroke={darkMode ? '#475569' : '#94a3b8'} strokeWidth="2" />

                        {/* Cost Function Curve */}
                        <motion.path
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 2, ease: "easeInOut" }}
                          d="M 50 350 Q 150 50, 300 200 T 550 350"
                          fill="none"
                          stroke="url(#graphGradient)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          filter="url(#glow)"
                        />

                        {/* Gradient Descent Points */}
                        <motion.circle
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.5, type: "spring" }}
                          cx="450" cy="280" r="6" fill="#3b82f6" opacity="0.4"
                        />
                        <motion.circle
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.7, type: "spring" }}
                          cx="370" cy="230" r="6" fill="#3b82f6" opacity="0.6"
                        />
                        <motion.circle
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.9, type: "spring" }}
                          cx="320" cy="205" r="8" fill="#3b82f6"
                        />

                        {/* Current Point Highlight */}
                        <motion.circle
                          initial={{ scale: 1, opacity: 1 }}
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          cx="320" cy="205" r="12" fill="none" stroke="#3b82f6" strokeWidth="2"
                        />
                      </svg>
                    </div>

                    {/* Stats Overlay */}
                    <div className="absolute top-4 left-4 right-4 flex gap-3">
                      <div className={`px-3 py-2 rounded-lg backdrop-blur-xl border ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Learning Rate</div>
                        <div className="text-sm font-semibold text-blue-500">0.01</div>
                      </div>
                      <div className={`px-3 py-2 rounded-lg backdrop-blur-xl border ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Iteration</div>
                        <div className="text-sm font-semibold text-purple-500">247</div>
                      </div>
                      <div className={`px-3 py-2 rounded-lg backdrop-blur-xl border ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                        <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Cost</div>
                        <div className="text-sm font-semibold text-green-500">0.0043</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating particles around screenshot */}
                <motion.div
                  initial={{ y: 0, opacity: 0.5 }}
                  animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-4 -right-4 w-2 h-2 bg-blue-400 rounded-full blur-sm"
                />
                <motion.div
                  initial={{ y: 0, opacity: 0.5 }}
                  animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -bottom-4 -left-4 w-2 h-2 bg-purple-400 rounded-full blur-sm"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}
          >
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-blue-500 rounded-full"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className={`py-20 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Powerful Features
            </h2>
            <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Everything you need to understand machine learning algorithms
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <BarChart3 className="w-6 h-6" />, title: 'Visualize Algorithms', description: 'See optimization, learning, and convergence step-by-step.' },
              { icon: <Brain className="w-6 h-6" />, title: 'Learn with Intuition', description: 'Live explanations alongside every graph.' },
              { icon: <Target className="w-6 h-6" />, title: 'Experiment Freely', description: 'Change parameters and observe behavior.' },
              { icon: <CheckCircle className="w-6 h-6" />, title: 'Test Understanding', description: 'Conceptual quizzes tied directly to visuals.' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  darkMode={darkMode}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>How It Works</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <StepCard
              number="1"
              title="Choose a concept"
              description="Select from optimization, learning, clustering, and more."
              darkMode={darkMode}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <StepCard
              number="2"
              title="Interact with visualizations"
              description="Adjust parameters and watch algorithms work in real-time."
              darkMode={darkMode}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <StepCard
              number="3"
              title="Learn and test"
              description="Read explanations, experiment freely, and quiz yourself."
              darkMode={darkMode}
            />
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`py-20 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Meet the Team
            </h2>
            <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Built with passion for STEM education
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Subham Sai Samal', role: 'Lead Developer' },
              { name: 'Harikrishnan', role: 'Developer' },
              { name: 'Thapasya', role: 'Developer' },
              { name: 'Tholkappiyan', role: 'Developer' },
            ].map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} transition-all cursor-pointer`}
              >
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  {member.name.charAt(0)}
                </div>
                <h3 className={`text-center font-semibold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {member.name}
                </h3>
                <p className={`text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {member.role}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-12 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="FlowLogic Logo" className="w-8 h-8 rounded-lg" />
              <div>
                <div className="font-semibold">FlowLogic</div>
                <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>STEM Expo 2026</div>
              </div>
            </div>
            <div className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Built for learners. Designed for understanding.
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DemoVideoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
      <AccessibilityPanel isOpen={showAccessibilityPanel} onClose={() => setShowAccessibilityPanel(false)} />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div >
  );
}

function FeatureCard({ icon, title, description, darkMode }: { icon: React.ReactNode; title: string; description: string; darkMode: boolean }) {
  return (
    <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
        {icon}
      </div>
      <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, darkMode }: { number: string; title: string; description: string; darkMode: boolean }) {
  return (
    <div className="text-center">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
        <span className="text-xl font-bold">{number}</span>
      </div>
      <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
    </div>
  );
}