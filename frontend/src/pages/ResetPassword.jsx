import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../api/axios';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Extract token from URL query params
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (!tokenParam) {
      setErrors({ server: 'Invalid or missing reset token. Please request a new link.' });
    } else {
      setToken(tokenParam);
    }
  }, [location]);

  const validatePassword = (password) => {
    const rules = [
      { label: 'Minimum 8 characters', test: (p) => p.length >= 8 },
      { label: 'At least 1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
      { label: 'At least 1 lowercase letter', test: (p) => /[a-z]/.test(p) },
      { label: 'At least 1 number', test: (p) => /\d/.test(p) },
      { label: 'At least 1 special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];
    
    return rules.map(rule => ({
      ...rule,
      met: rule.test(password)
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    const newErrors = {};
    const passwordRules = validatePassword(formData.new_password);
    const unmetRules = passwordRules.filter(r => !r.met);
    
    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (unmetRules.length > 0) {
      newErrors.new_password = 'Password does not meet requirements';
    }

    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await api.post('/auth/reset-password', {
        token: token,
        new_password: formData.new_password
      });

      setIsSuccess(true);
      // Auto redirect after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      setErrors({ server: err.response?.data?.detail || 'Failed to reset password. The link may have expired.' });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRules = validatePassword(formData.new_password);

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#17232C] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vayu POS</h1>
        </div>

        <div className="bg-[#1a2332] rounded-2xl p-8 shadow-2xl border border-gray-800">
          {!isSuccess ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-gray-400 text-sm">Please choose a strong new password to secure your account.</p>
              </div>

              {errors.server && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 mb-6 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 font-medium">{errors.server}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password */}
                <div className="space-y-2">
                  <label htmlFor="new_password" className="text-sm font-semibold text-gray-300 ml-1">New Password</label>
                  <div className="relative group">
                    <input
                      id="new_password"
                      type={showPasswords.new ? 'text' : 'password'}
                      name="new_password"
                      autoComplete="new-password"
                      value={formData.new_password}
                      onChange={handleInputChange}
                      disabled={isLoading || !token}
                      className={`w-full pl-4 pr-10 py-3 bg-[#0f1419] border rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all ${
                        errors.new_password ? 'border-red-500/50' : 'border-gray-700 focus:border-[#14b8a6]'
                      }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password Rules Help */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 p-4 bg-[#0f1419]/50 rounded-xl border border-gray-800">
                    {passwordRules.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {rule.met ? (
                          <CheckCircle2 size={12} className="text-[#14b8a6]" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                        )}
                        <span className={`text-[10px] font-medium leading-none ${rule.met ? 'text-[#14b8a6]' : 'text-gray-500'}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirm_password" className="text-sm font-semibold text-gray-300 ml-1">Confirm New Password</label>
                  <div className="relative group">
                    <input
                      id="confirm_password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirm_password"
                      autoComplete="new-password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      disabled={isLoading || !token}
                      className={`w-full pl-4 pr-10 py-3 bg-[#0f1419] border rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all ${
                        errors.confirm_password ? 'border-red-500/50' : 'border-gray-700 focus:border-[#14b8a6]'
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.confirm_password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !token}
                  className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-[#14b8a6]/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6 animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle2 className="text-green-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Password Updated!</h2>
              <p className="text-gray-400 mb-8 text-sm leading-relaxed px-4">
                Your password has been reset successfully. You can now use your new password to sign in.
              </p>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-white text-black font-bold py-4 rounded-xl transition-all hover:bg-gray-100 flex items-center justify-center gap-2"
              >
                Go to Login
                <ArrowRight size={18} />
              </button>
              
              <p className="text-gray-500 text-[10px] mt-6">
                Redirecting you to login page automatically in 5 seconds...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
