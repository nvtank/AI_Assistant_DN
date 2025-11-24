'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Chrome, Facebook, Loader2, User, Mail, Lock } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle, signInWithFacebook } from '@/lib/authService';
import { motion } from 'framer-motion';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { user, error: authError } = await signUpWithEmail(
      formData.email,
      formData.password,
      formData.displayName
    );
    if (authError) {
      setError(authError);
      setLoading(false);
    } else if (user) router.push('/');
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    const { user, error: authError } = await signInWithGoogle();
    if (authError) {
      setError(authError);
      setLoading(false);
    } else if (user) router.push('/');
  };

  const handleFacebookSignUp = async () => {
    setError('');
    setLoading(true);
    const { user, error: authError } = await signInWithFacebook();
    if (authError) {
      setError(authError);
      setLoading(false);
    } else if (user) router.push('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-400 px-4 py-8"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="max-w-md w-full backdrop-blur-3xl bg-white/20 border border-white/30 shadow-2xl p-10 rounded-3xl text-white"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold drop-shadow-lg tracking-wide">FINDLY</h1>
          <p className="opacity-90 mt-1 text-sm">Smart Solutions for Da Nang</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600/70 border border-red-300 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-4 mb-6">
          <motion.div whileFocus={{ scale: 1.02 }} className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="w-full pl-10 px-4 py-3 bg-white/90 text-gray-800 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </motion.div>

          <motion.div whileFocus={{ scale: 1.02 }} className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="w-full pl-10 px-4 py-3 bg-white/90 text-gray-800 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </motion.div>

          <motion.div whileFocus={{ scale: 1.02 }} className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              minLength={6}
              required
              className="w-full pl-10 px-4 py-3 bg-white/90 text-gray-800 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </motion.div>

          <motion.div whileFocus={{ scale: 1.02 }} className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              minLength={6}
              required
              className="w-full pl-10 px-4 py-3 bg-white/90 text-gray-800 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Sign Up'}
          </motion.button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/40"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-transparent text-white/90 backdrop-blur-sm">Or sign up with</span>
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 rounded-xl font-semibold shadow-md hover:bg-gray-100 transition"
          >
            <Chrome size={20} /> Sign up with Google
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleFacebookSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-3 rounded-xl font-semibold shadow-md hover:bg-[#166FE5] transition"
          >
            <Facebook size={20} /> Sign up with Facebook
          </motion.button>
        </div>

        <div className="text-center mt-6 text-sm text-white/90">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold underline hover:text-gray-200">
            Sign In
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
