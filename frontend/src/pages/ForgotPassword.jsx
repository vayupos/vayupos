import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#14b8a6] transition-colors mb-6 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Login</span>
        </button>

        <div className="bg-[#1a2332] rounded-2xl p-8 shadow-2xl border border-gray-800">
          {!isSuccess ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#14b8a6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#14b8a6]/20">
                  <Mail className="text-[#14b8a6]" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Forgot Password?
                </h1>
                <p className="text-gray-400 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-gray-200 text-sm font-semibold ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#14b8a6] transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={handleInputChange}
                      placeholder="name@example.com"
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-3 bg-[#0f1419] border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                        error 
                          ? 'border-red-500/50 focus:ring-red-500/20' 
                          : 'border-gray-700 focus:border-[#14b8a6] focus:ring-[#14b8a6]/20'
                      }`}
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs font-medium mt-2 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-[#14b8a6]/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle2 className="text-green-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Check Your Email
              </h2>
              <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                If an account exists for <span className="text-white font-semibold">{email}</span>, you will receive a password reset link shortly.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Return to Login
                </button>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-[#14b8a6] hover:text-[#0d9488] text-sm font-medium transition-colors"
                >
                  Didn't receive email? Try again
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-8 p-4 bg-[#1a2332]/50 rounded-xl border border-gray-800/50">
          <p className="text-gray-500 text-xs">
            <span className="text-[#14b8a6] font-semibold">Security Tip:</span> Reset links are valid for 30 minutes. If you don't see the email, check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;