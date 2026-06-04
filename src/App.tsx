import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TestForm } from './pages/TestForm';
import { QuestionManager } from './pages/QuestionManager';
import { TestPreview } from './pages/TestPreview';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            fontFamily: 'var(--font-sans)',
          },
        }} 
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes wrapped in Layout */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/tests/new" 
          element={
            <ProtectedRoute>
              <Layout>
                <TestForm />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tests/:id/edit" 
          element={
            <ProtectedRoute>
              <Layout>
                <TestForm />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tests/:id/questions" 
          element={
            <ProtectedRoute>
              <Layout>
                <QuestionManager />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tests/:id/preview" 
          element={
            <ProtectedRoute>
              <Layout>
                <TestPreview />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
