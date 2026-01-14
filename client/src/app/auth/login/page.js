'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        'https://book-worm-server-tau.vercel.app/api/auth/login',
        formData
      );

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      const userRole = res.data.user.role;

      if (userRole === 'admin') {
        window.location.assign('/dashboard');
      } else {
        window.location.assign('/my-library');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FDFBF7] py-10 px-4">
      <div className="w-full max-w-md p-8 bg-white border border-[#E5DCC3] rounded-2xl shadow-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-[#4A3728]">
            Welcome Back! 📖
          </h2>
          <p className="text-gray-600 mt-2">
            Log in to access your personal library
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold text-[#4A3728]">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="example@mail.com"
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#4A3728] text-gray-800 bg-white"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-[#4A3728]">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#4A3728] text-gray-800 bg-white"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-[#4A3728] text-white py-3 rounded-lg font-bold hover:bg-[#3d2d21] transition-all shadow-lg mt-2"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-700">
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            className="text-[#4A3728] font-bold hover:underline underline-offset-4"
          >
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}
