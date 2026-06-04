import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { LogIn, KeyRound, User, GraduationCap, ShieldCheck, Activity } from 'lucide-react';

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, isLoading, error, token, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, navigate, from]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userId: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const success = await login(values);
    if (success) {
      toast.success('Successfully logged in!');
      navigate(from, { replace: true });
    } else {
      toast.error(error || 'Invalid credentials');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Left Pane: Illustration / Brand Panel (Matches Figma split layout) */}
      <div className="login-brand-panel" style={{
        flex: 1,
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract shapes for premium vector feeling */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.03)',
          pointerEvents: 'none'
        }} />

        {/* Brand Text Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2rem'
          }}>
            <GraduationCap size={44} strokeWidth={2.5} />
            <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              Preproute
            </span>
          </div>

          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 800, 
            lineHeight: '1.15', 
            fontFamily: 'var(--font-display)', 
            color: '#ffffff', 
            marginBottom: '1.5rem' 
          }}>
            Test Management Portal
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', marginBottom: '2.5rem' }}>
            A state-of-the-art administrative environment to create custom examinations, compile comprehensive MCQ question banks, and publish mock papers.
          </p>

          {/* Interactive Feature Indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <ShieldCheck size={20} />
              </div>
              <span style={{ fontWeight: 500 }}>Secure Role-Based Access Control</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Activity size={20} />
              </div>
              <span style={{ fontWeight: 500 }}>Live Exam Analytics & Publishing Controls</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Login Form Panel */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem',
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        position: 'relative'
      }}>
        
        <div style={{ width: '100%', maxWidth: '400px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
              Sign In
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Access the administrator moderator command board.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} id="login-form">
            
            {/* User ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-userId">User ID</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  {...register('userId')}
                  type="text"
                  id="input-userId"
                  className="form-input"
                  placeholder="Enter user ID"
                  style={{ paddingLeft: '2.75rem' }}
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
              {errors.userId && (
                <span className="form-error">{errors.userId.message}</span>
              )}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" htmlFor="input-password">Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  {...register('password')}
                  type="password"
                  id="input-password"
                  className="form-input"
                  placeholder="Enter password"
                  style={{ paddingLeft: '2.75rem' }}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <span className="form-error">{errors.password.message}</span>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: 'var(--danger-glow)',
                color: 'var(--danger-hover)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '1.5rem',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                animation: 'fadeIn 0.2s ease'
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
              disabled={isLoading}
              id="btn-login-submit"
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="spinner" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Sign In</span>
                </>
              )}
            </button>

          </form>

          {/* Credentials Box */}
          <div style={{
            marginTop: '2.5rem',
            padding: '1.25rem',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Moderator Credentials:
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>User ID:</span>
              <code style={{ fontWeight: 600 }}>vedant-admin</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Password:</span>
              <code style={{ fontWeight: 600 }}>vedant123</code>
            </div>
          </div>

        </div>
      </div>

      {/* Embedded CSS for responsive hide brand on small viewports */}
      <style>{`
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .login-brand-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
