import { useState } from 'react';
import { User, Bell, Shield, Smartphone, Monitor, Moon, Volume2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const darkMode = theme === 'dark';

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Settings</h1>
                <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Manage your preferences and account settings</p>
            </div>

            {/* Profile Section */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <User className="w-5 h-5" />
                    Profile
                </h2>
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                        {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {user?.email || 'User'}
                        </div>
                        <div className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Free Plan (Student)</div>
                    </div>
                    <button className="ml-auto px-4 py-2 text-sm font-medium text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Appearance */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Monitor className="w-5 h-5" />
                    Appearance
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <div className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Dark Mode</div>
                            <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Use dark theme for low-light environments</div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-blue-500' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications - Mock */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Bell className="w-5 h-5" />
                    Notifications
                </h2>

                <div className="space-y-4">
                    {[
                        { id: 'email', label: 'Email Digests' },
                        { id: 'product', label: 'Product Updates' },
                        { id: 'learning', label: 'Learning Reminders' }
                    ].map((item) => (
                        <ToggleSetting key={item.id} label={item.label} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ToggleSetting({ label }: { label: string }) {
    const [enabled, setEnabled] = useState(true);
    const { theme } = useTheme();
    const darkMode = theme === 'dark';

    return (
        <div className="flex items-center justify-between py-2 border-b border-dashed last:border-0 border-slate-200 dark:border-slate-800">
            <div className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{label}</div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{enabled ? 'Enabled' : 'Disabled'}</span>
                <button
                    onClick={() => setEnabled(!enabled)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? 'bg-blue-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                    <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${enabled ? 'right-1 bg-blue-500' : 'left-1 bg-white dark:bg-slate-400'}`} />
                </button>
            </div>
        </div>
    );
}
