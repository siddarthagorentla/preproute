import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { LogIn, KeyRound, User, GraduationCap } from 'lucide-react';

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

  // If already logged in, redirect away
  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, navigate, from]);

  // Clean errors on unmount
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
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 45%), var(--bg-primary)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background blobs for premium glassmorphism effect */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '25%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'var(--primary)',
        filter: 'blur(100px)',
        opacity: 0.1,
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '25%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'var(--success)',
        filter: 'blur(120px)',
        opacity: 0.08,
        zIndex: 0
      }} />

      <div 
        className="card card-glass" 
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '2.5rem',
          position: 'relative',
          zIndex: 1,
          animation: 'slideUp 0.5s ease-out'
        }}
      >
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--primary-glow)',
            color: 'var(--primary)',
            marginBottom: '1rem',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.1)'
          }}>
            <GraduationCap size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
            Welcome to Preproute
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Log in to manage your mock tests and question banks
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} id="login-form">
          
          {/* User ID Field */}
          <div className="form-group" style={{ position: 'relative' }}>
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
                placeholder="Enter your user ID"
                style={{ paddingLeft: '2.75rem' }}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            {errors.userId && (
              <span className="form-error">{errors.userId.message}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group" style={{ position: 'relative', marginBottom: '2rem' }}>
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
                placeholder="Enter your password"
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

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            disabled={isLoading}
            id="btn-login-submit"
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Signing in...
              </span>
            ) : (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>

        </form>

        {/* Demo Credentials Help Box */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            Evaluation Credentials:
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span>Username:</span>
            <code style={{ fontWeight: 600 }}>vedant-admin</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Password:</span>
            <code style={{ fontWeight: 600 }}>vedant123</code>
          </div>
        </div>

      </div>

      {/* Embedded CSS for Spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
