"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { signInWithEmail, signInWithGoogle, signInWithFacebook } from "@/lib/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { user, error: authError } = await signInWithEmail(email, password);
    if (authError) {
      setError(authError);
      setLoading(false);
    } else if (user) router.push("/");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { user, error: authError } = await signInWithGoogle();
    if (authError) {
      setError(authError);
      setLoading(false);
    } else if (user) router.push("/");
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    const { user, error: authError } = await signInWithFacebook();
    if (authError) {
      setError(authError);
      setLoading(false);
    } else if (user) router.push("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-400 px-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-md w-full backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl p-10 rounded-3xl text-white"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold drop-shadow-lg tracking-wide">FINDLY</h1>
          <p className="opacity-90 mt-1 text-sm">Smart Solutions for Da Nang</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600/70 border border-red-300 text-white rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <motion.div whileFocus={{ scale: 1.02 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="w-full px-4 py-3 bg-white/90 text-gray-800 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </motion.div>

          <motion.div whileFocus={{ scale: 1.02 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full px-4 py-3 bg-white/90 text-gray-800 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {loading ? "Signing in..." : "Sign In"}
          </motion.button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/40"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-transparent text-white/90 backdrop-blur-sm">Or continue with</span>
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-gray-800 flex items-center justify-center gap-3 shadow-md hover:bg-gray-100 transition"
          >
            <FcGoogle className="w-5 h-5" /> Continue with Google
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleFacebookLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#1877F2] text-white flex items-center justify-center gap-3 shadow-md hover:bg-[#166FE5] transition"
          >
            <FaFacebook className="w-5 h-5" /> Continue with Facebook
          </motion.button>
        </div>

        <div className="text-center mt-6 text-sm text-white/90">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-white underline hover:text-gray-200 transition"
          >
            Sign Up
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
