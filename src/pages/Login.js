// Login Page - Email/Password authentication with role-based redirect and registration
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, initializeDemoData } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin' // Default role for registration
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;
      if (isRegistering) {
        user = await registerUser(formData.email, formData.password, formData.name, formData.role);
      } else {
        user = await loginUser(formData.email, formData.password);
      }
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'driver') {
        navigate('/driver/dashboard');
      } else {
        setError('Invalid user role');
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Simplify firebase error messages
      let msg = err.message;
      if (msg.includes('auth/email-already-in-use')) msg = 'Email already in use';
      else if (msg.includes('auth/invalid-credential')) msg = 'Invalid email or password';
      else if (msg.includes('auth/operation-not-allowed')) msg = 'Email/Password login is not enabled in Firebase Console.';
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    if (role === 'admin') {
      setFormData({ ...formData, email: 'admin@gmail.com', password: 'Admin123' });
    } else {
      setFormData({ ...formData, email: 'driver@gmail.com', password: 'Driver123' });
    }
    setIsRegistering(false);
  };

  const handleInitialize = async () => {
    setInitializing(true);
    try {
      await initializeDemoData();
      alert('Demo accounts created! You can now login.');
    } catch (err) {
      console.error(err);
      alert('Failed to initialize demo data');
    } finally {
      setInitializing(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    // Reset form mostly but keep email if typed
    setFormData(prev => ({ ...prev, password: '', name: '', role: 'admin' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-4 rounded-full">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Management</h1>
          <p className="text-gray-600">
            {isRegistering ? 'Create a new account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Registration Fields */}
            {isRegistering && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={isRegistering}
                    className="input-field"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="admin">Admin</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter your password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">{isRegistering ? 'Creating Account...' : 'Signing in...'}</span>
                </>
              ) : (
                isRegistering ? 'Register' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              {isRegistering 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Register"}
            </button>
          </div>

          {/* Demo Section (Only in Login Mode) */}
          {!isRegistering && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 text-center">
                Quick Demo Access
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  className="flex items-center justify-center px-4 py-2 border border-primary-200 rounded-lg text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  Admin Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('driver')}
                  className="flex items-center justify-center px-4 py-2 border border-secondary-200 rounded-lg text-sm font-medium text-secondary-700 bg-secondary-50 hover:bg-secondary-100 transition-colors"
                >
                  Driver Demo
                </button>
              </div>
              
              <button
                onClick={handleInitialize}
                disabled={initializing}
                className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600 underline"
              >
                {initializing ? 'Setting up accounts...' : 'First Time? Setup Demo Accounts'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2026 Travel Management System
        </p>
      </div>
    </div>
  );
};

export default Login;
