import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { AuthRequest } from '../types';
import { isDevMode } from '../utils/devUtils';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<AuthRequest>({
    username: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isLogin && formData.password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await authService.login(formData);
      } else {
        await authService.register({
          ...formData,
          password_confirm: confirmPassword,
        });
      }
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = () => {
    authService.login({ username: 'dev_user', password: 'dev_pass' })
      .then(() => {
        navigate('/profile');
      })
      .catch((error) => {
        console.error('Dev login error:', error);
        setError('Dev mode login failed. Check console for details.');
      });
  };

  return (
    <div className="auth-shell">
      <div className="auth-shell__content">
        <section className="auth-hero">
          <p className="auth-hero__eyebrow">Realtime collaboration</p>
          <h1 className="auth-hero__title">
            <span className="text-gradient">Collaborative</span> Editor
          </h1>
          <p className="auth-hero__tagline">
            Build, edit and ship code together without leaving the browser. Everything syncs instantly.
          </p>
          <div className="feature-group">
            <span className="feature-pill">Realtime sync</span>
            <span className="feature-pill">Shared cursors</span>
            <span className="feature-pill">Fast feedback</span>
          </div>
        </section>

        <section className="panel auth-card">
          <div className="auth-card__header">
            <h2 className="auth-card__title">
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="auth-card__subtitle">
              {isLogin ? 'Sign in to continue your journey' : 'Start collaborating today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="form-group">
              <label htmlFor="username" className="label">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                className="input"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Enter your username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="input"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>
            )}

            {error && (
              <div className="alert alert--error">
                <div>
                  <p className="font-semibold">{error}</p>
                  <p className="text-text-tertiary text-xs mt-1">
                    Please double-check your credentials and try again.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn w-full mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading mr-3"></span>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                (isLogin ? 'Sign In' : 'Create Account')
              )}
            </button>
          </form>

          <div className="auth-card__switch">
            <p>
              {isLogin
                ? "Don't have an account yet?"
                : 'Already registered?'}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ username: '', password: '' });
                setConfirmPassword('');
              }}
              className="btn btn-outline"
            >
              {isLogin ? 'Create New Account' : 'Sign In to Existing Account'}
            </button>
          </div>

          {isDevMode && (
            <div className="auth-card__dev">
              <div className="mb-4">
                <p className="text-base text-text-secondary font-medium">Development Mode</p>
              </div>
              <button
                onClick={handleDevLogin}
                className="btn btn-secondary w-full"
              >
                Skip Authentication & Explore App
              </button>
              <p className="text-xs text-text-tertiary mt-3 text-center">
                This button only appears in development mode
              </p>
            </div>
          )}
        </section>

        <p className="text-center text-text-tertiary text-sm font-light mt-10">
          Secure • Fast • Collaborative • Made for Developers
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
