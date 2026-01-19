import { ArrowRight, BarChart3, Brain, Target, Clock, TrendingUp, Sparkles, Activity } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLearning } from '../contexts/LearningContext';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  onNavigate: (page: 'visualize' | 'learn' | 'quiz' | 'sandbox') => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { completedTopics, streak, currentScore, totalAttempts } = useLearning();
  const darkMode = theme === 'dark';

  // Calculate quiz accuracy
  const accuracy = totalAttempts > 0 ? Math.round((currentScore / totalAttempts) * 100) : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-10 border-blue-500/20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            <span>AI-Powered Learning Path</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 text-glow">
              {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
            </span>
          </h1>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Ready to explore the mathematical foundations of intelligence? Your next module on Gradient Descent is waiting.
          </p>

          <button
            onClick={() => onNavigate('visualize')}
            className="group px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-3 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
          >
            Continue Learning
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Stats HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HudStat icon={Target} label="Concepts Mastered" value={completedTopics.size.toString()} color="text-blue-400" />
        <HudStat icon={Activity} label="Current Streak" value={`${streak} Days`} color="text-green-400" />
        <HudStat icon={TrendingUp} label="Total Score" value={currentScore.toString()} color="text-purple-400" />
        <HudStat icon={Brain} label="Quiz Accuracy" value={`${accuracy}%`} color="text-pink-400" />
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Recommended Actions */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-6 rounded-full bg-blue-500" />
            Recommended Next Steps
          </h2>

          <div className="grid gap-4">
            <ActionCard
              title="Visualize Loss Landscapes"
              description="Interact with 3D surfaces to understand local minima."
              icon={BarChart3}
              color="bg-purple-500"
              delay="0ms"
              onClick={() => onNavigate('visualize-3d' as any)}
            />
            <ActionCard
              title="Quiz: Convergence Theory"
              description="Test your knowledge on learning rates and epochs."
              icon={Brain}
              color="bg-pink-500"
              delay="100ms"
              onClick={() => onNavigate('quiz')}
            />
            <ActionCard
              title="Sandbox Experiment"
              description="Create custom functions and run optimization."
              icon={Target}
              color="bg-amber-500"
              delay="200ms"
              onClick={() => onNavigate('sandbox')}
            />
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-6 rounded-full bg-slate-500" />
            Insights
          </h2>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain className="w-24 h-24" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Why Gradient Descent?</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              It's the engine of modern AI. By understanding how weights are updated to minimize loss, you grasp the core mechanism of everything from linear regression to LLMs.
            </p>
            <div className="text-xs text-blue-400 font-medium">Read full article →</div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4 text-slate-300">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Recent Activity</span>
            </div>
            <div className="space-y-4">
              <ActivityItem action="Completed Quiz" target="Basics" time="2h ago" />
              <ActivityItem action="Visualized" target="Quadratic Func" time="5h ago" />
              <ActivityItem action="Logged in" target="" time="1d ago" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HudStat({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:bg-white/5 transition-colors group">
      <div className={`p-2 rounded-full bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</div>
      </div>
    </div>
  );
}

function ActionCard({ title, description, icon: Icon, color, delay, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left glass-panel p-5 rounded-2xl flex items-center gap-5 hover:bg-white/10 transition-all hover:scale-[1.01] group border-l-4 border-l-transparent hover:border-l-blue-500"
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg shrink-0 group-hover:shadow-${color}/50 transition-shadow`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
}

function ActivityItem({ action, target, time }: { action: string, target: string, time: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <span className="text-slate-300">{action} <span className="text-slate-500">{target}</span></span>
      </div>
      <span className="text-slate-600 text-xs">{time}</span>
    </div>
  );
}