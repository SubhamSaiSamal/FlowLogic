import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { LearningProvider } from './contexts/LearningContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <LearningProvider>
            <RouterProvider router={router} />
          </LearningProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
