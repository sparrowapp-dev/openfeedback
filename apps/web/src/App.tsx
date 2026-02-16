import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Pages
import {
  LoginPage,
  SignupPage,
  DashboardPage,
  BoardPage,
  RoadmapPage,
  PostDetailPage,
  AdminBoardsPage,
  AdminSettingsPage,
} from './pages';

// Components
import { Layout, ProtectedRoute } from './components/shared';
import { OpenFeedbackProvider } from './hooks/useOpenFeedback';
import { useAuthStore } from './stores/authStore';

// Config
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || '';

function AppRoutes() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/board/:boardId"
        element={
          <ProtectedRoute>
            <Layout>
              <BoardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/board/:boardId/roadmap"
        element={
          <ProtectedRoute>
            <Layout>
              <RoadmapPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/post/:postId"
        element={
          <ProtectedRoute>
            <Layout>
              <PostDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/boards"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminBoardsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminSettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <OpenFeedbackProvider apiUrl={API_URL} apiKey={API_KEY}>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </OpenFeedbackProvider>
    </BrowserRouter>
  );
}

export default App;
