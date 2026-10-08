import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogoMark, Wordmark } from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      navigate('/profiles');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-950 relative flex items-center justify-center px-5 overflow-hidden">
      {/* Aurora backdrop: two slow-drifting brand-colored glows. */}
      <motion.div
        aria-hidden="true"
        className="absolute -top-1/4 -left-1/4 w-[80vmax] h-[80vmax] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.55), transparent 60%)' }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-1/3 -right-1/4 w-[70vmax] h-[70vmax] rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(255,61,139,0.5), transparent 60%)' }}
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#030308_85%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-4 mb-9">
          <LogoMark className="w-16 h-16 drop-shadow-[0_0_24px_rgba(124,92,255,0.55)]" title="FamilyStream" />
          <Wordmark className="text-3xl" />
          <p className="text-white/50 text-sm">Your family's movies and memories, beautifully kept.</p>
        </div>

        <form onSubmit={submit} className="glass rounded-2xl p-7 md:p-8 ring-1 ring-white/10 shadow-card space-y-4">
          <h1 className="font-display text-2xl font-bold tracking-tight mb-2">{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>

          <input
            type="email"
            autoComplete="username"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/[0.06] rounded-lg px-4 py-3.5 text-[15px] outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent transition placeholder:text-white/35"
          />
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/[0.06] rounded-lg px-4 py-3.5 text-[15px] outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent transition placeholder:text-white/35"
          />

          {error && <p className="text-rose-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-accent-glow hover:brightness-110 active:scale-[0.99] transition rounded-lg py-3.5 font-semibold shadow-glow disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-white/50 text-sm text-center pt-2">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-white hover:underline"
            >
              {mode === 'login' ? 'Sign up now' : 'Sign in'}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
