import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Sun, Moon, Search, Bell } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  currentPage: 'dashboard' | 'visualize' | 'learn' | 'quiz' | 'sandbox' | 'history' | 'data' | 'visualize-3d' | 'settings';
  onNavigate: (page: 'landing' | 'dashboard' | 'visualize' | 'learn' | 'quiz' | 'sandbox' | 'history' | 'data' | 'visualize-3d' | 'settings') => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function AppLayout({ children, currentPage, onNavigate, darkMode, onToggleDarkMode }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative selection:bg-blue-500/30">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 hidden md:block">
        <Sidebar activePage={currentPage} onNavigate={onNavigate} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-transparent">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 hidden lg:block">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topics, experiments, or tutorials..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Simple search implementation - could expand to be a real global search later
                    const query = e.currentTarget.value.toLowerCase();
                    if (query.includes('3d') || query.includes('loss')) onNavigate('visualize-3d' as any);
                    else if (query.includes('quiz')) onNavigate('quiz');
                    else if (query.includes('learn')) onNavigate('learn');
                    else if (query.includes('sandbox')) onNavigate('sandbox');
                  }
                }}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-slate-900" />
            </button>
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border-2 border-slate-900 shadow-lg" />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


function NavItem({ icon, label, active, onClick, collapsed, darkMode }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  darkMode: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active
        ? darkMode
          ? 'bg-blue-500/10 text-blue-400'
          : 'bg-blue-50 text-blue-600'
        : darkMode
          ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
