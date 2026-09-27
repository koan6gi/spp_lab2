import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';
import { login, register, forgotPassword } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onSuccess, onError }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const { login: setAuthData } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (tab === 'login') {
        const data = await login(email, password);
        setAuthData(data);
        onSuccess('Welcome back! Signed in successfully.');
        onClose();
      } else if (tab === 'register') {
        const data = await register(email, password);
        setAuthData(data);
        onSuccess('Account created successfully! Welcome.');
        onClose();
      } else if (tab === 'forgot') {
        const data = await forgotPassword(email);
        setMessage(data.message || 'Check your inbox for reset instructions.');
        onSuccess('Password reset link sent! Check Mailpit (http://localhost:8025).');
      }
    } catch (err) {
      onError(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => { setTab('login'); setMessage(null); }}
              className={`text-sm font-semibold pb-1 border-b-2 transition ${
                tab === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setMessage(null); }}
              className={`text-sm font-semibold pb-1 border-b-2 transition ${
                tab === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setTab('forgot'); setMessage(null); }}
              className={`text-sm font-semibold pb-1 border-b-2 transition ${
                tab === 'forgot' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Forgot Password
            </button>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg">
              {message}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <span>
                {isSubmitting
                  ? 'Processing...'
                  : tab === 'login'
                  ? 'Sign In'
                  : tab === 'register'
                  ? 'Create Account'
                  : 'Send Reset Link'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {tab === 'login' && (
            <div className="pt-2 text-center text-xs text-gray-400 space-y-1">
              <p>Demo accounts (Password123!):</p>
              <p className="font-mono text-gray-600">admin@example.com | moderator@example.com | user@example.com</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
