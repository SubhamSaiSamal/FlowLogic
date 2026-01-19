import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './components/Dashboard';
import { LearnMode } from './components/LearnMode';
import { QuizMode } from './components/QuizMode';
import { SandboxMode } from './components/SandboxMode';
import { DataMode } from './components/DataMode/DataMode';
import { LandingPage } from './components/LandingPage';
import { History } from './components/History';
import { SettingsPage } from './components/SettingsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OverfittingDemo } from './components/experiments/OverfittingDemo';

// Lazy load heavy 3D components
const LossLandscape3D = React.lazy(() => import('./components/visualizations/LossLandscape3D').then(module => ({ default: module.LossLandscape3D })));
const AppDemo = React.lazy(() => import('./AppDemo').then(module => ({ default: module.AppDemo })));
const MLStudio = React.lazy(() => import('./components/MLStudio/MLStudio').then(module => ({ default: module.MLStudio })));

// Loading component
const PageLoader = () => (
    <div className="flex items-center justify-center h-screen w-full bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

// Wrapper to inject Layout
const LayoutWrapper = ({ children, page }: { children: React.ReactNode, page: any }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    return (
        <AppLayout
            currentPage={page}
            onNavigate={(p) => navigate(p === 'landing' ? '/' : `/${p}`)}
            darkMode={theme === 'dark'}
            onToggleDarkMode={toggleTheme}
        >
            {children}
        </AppLayout>
    );
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <LandingPageWrapper />,
    },
    {
        path: '/dashboard',
        element: <ProtectedRoute><LayoutWrapper page="dashboard"><DashboardWrapper /></LayoutWrapper></ProtectedRoute>,
    },
    {
        path: '/visualize',
        element: (
            <ProtectedRoute>
                <LayoutWrapper page="visualize">
                    <Suspense fallback={<PageLoader />}>
                        <VisualizationWrapper />
                    </Suspense>
                </LayoutWrapper>
            </ProtectedRoute>
        ),
    },
    {
        path: '/visualize-3d',
        element: (
            <ProtectedRoute>
                <LayoutWrapper page="visualize-3d">
                    <Suspense fallback={<PageLoader />}>
                        <MLStudio />
                    </Suspense>
                </LayoutWrapper>
            </ProtectedRoute>
        ),
    },
    {
        path: '/learn',
        element: <ProtectedRoute><LayoutWrapper page="learn"><LearnWrapper /></LayoutWrapper></ProtectedRoute>,
    },
    {
        path: '/quiz',
        element: <ProtectedRoute><LayoutWrapper page="quiz"><QuizWrapper /></LayoutWrapper></ProtectedRoute>,
    },
    {
        path: '/sandbox',
        element: <ProtectedRoute><LayoutWrapper page="sandbox"><SandboxWrapper /></LayoutWrapper></ProtectedRoute>,
    },
    {
        path: '/data',
        element: <ProtectedRoute><LayoutWrapper page="data"><DataMode /></LayoutWrapper></ProtectedRoute>,
    },
    {
        path: '/history',
        element: <ProtectedRoute><LayoutWrapper page="history"><History /></LayoutWrapper></ProtectedRoute>,
    },
    {
        path: '/settings',
        element: <ProtectedRoute><LayoutWrapper page="settings"><SettingsPage /></LayoutWrapper></ProtectedRoute>,
    },
    {
        path: '/labs/overfitting',
        element: <ProtectedRoute><LayoutWrapper page="labs"><OverfittingDemo /></LayoutWrapper></ProtectedRoute>,
    },
    {
        path: '*',
        element: <Navigate to="/" replace />,
    },
]);

// Helper components to use hooks
function LandingPageWrapper() {
    const navigate = useNavigate();
    return <LandingPage onNavigateToApp={() => navigate('/dashboard')} />;
}

function DashboardWrapper() {
    const navigate = useNavigate();
    return <Dashboard onNavigate={(p) => navigate(`/${p}`)} />;
}

function VisualizationWrapper() {
    const { theme } = useTheme();
    return <div className="h-full"><AppDemo darkMode={theme === 'dark'} /></div>;
}

function LearnWrapper() {
    return <LearnMode />;
}

function QuizWrapper() {
    return <QuizMode />;
}

function SandboxWrapper() {
    return <SandboxMode />;
}

