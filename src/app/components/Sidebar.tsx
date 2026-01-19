import {
  LayoutDashboard,
  LineChart,
  GraduationCap,
  BrainCircuit,
  Beaker,
  History,
  Settings,
  LogOut,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';

type Page = 'landing' | 'dashboard' | 'visualize' | 'learn' | 'quiz' | 'sandbox' | 'history' | 'data' | 'visualize-3d' | 'settings';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'visualize-3d', label: '3D Visualization', icon: BrainCircuit },
    { id: 'learn', label: 'Learn Mode', icon: GraduationCap },
    { id: 'data', label: 'Learn with Data', icon: Database },
    { id: 'quiz', label: 'Quiz', icon: LineChart },
    { id: 'sandbox', label: 'Sandbox', icon: Beaker },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="w-64 h-full bg-slate-950/50 backdrop-blur-xl border-r border-white/10 flex flex-col pt-8 pb-4 px-4 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10 px-2 cursor-pointer" onClick={() => onNavigate('landing')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" strokeWidth="2.5" stroke="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          FlowLogic
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                ? 'text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/10 border border-blue-500/20 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-blue-400' : 'group-hover:scale-110'}`} />
              <span className="font-medium relative z-10">{item.label}</span>
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
        <button
          onClick={() => onNavigate('settings' as Page)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activePage === 'settings' ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
            US
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-white">User</div>
            <div className="text-xs text-slate-500">Free Plan</div>
          </div>
          <LogOut className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>
    </div>
  );
}
