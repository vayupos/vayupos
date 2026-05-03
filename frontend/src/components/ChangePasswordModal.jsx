import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.current_password) newErrors.current_password = 'Current password is required';
    
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
      await api.post('/auth/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password
      });

      toast.success('Password changed successfully');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      onClose();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to change password';
      setErrors({ server: message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (errors.server) {
      setErrors(prev => ({ ...prev, server: null }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!isOpen) return null;

  const passwordRules = validatePassword(formData.new_password);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Change Password</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Secure your account with a new password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errors.server && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-1">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">{errors.server}</p>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <label htmlFor="modal_current_password" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock size={14} className="text-muted-foreground" />
              Current Password
            </label>
            <div className="relative group">
              <input
                id="modal_current_password"
                type={showPasswords.current ? 'text' : 'password'}
                name="current_password"
                autoComplete="current-password"
                value={formData.current_password}
                onChange={handleInputChange}
                className={`w-full pl-4 pr-10 py-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none ${
                  errors.current_password ? 'border-destructive' : 'border-border group-hover:border-primary/50'
                }`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.current_password && (
              <p className="text-xs text-destructive font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.current_password}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label htmlFor="modal_new_password" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck size={14} className="text-muted-foreground" />
              New Password
            </label>
            <div className="relative group">
              <input
                id="modal_new_password"
                type={showPasswords.new ? 'text' : 'password'}
                name="new_password"
                autoComplete="new-password"
                value={formData.new_password}
                onChange={handleInputChange}
                className={`w-full pl-4 pr-10 py-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none ${
                  errors.new_password ? 'border-destructive' : 'border-border group-hover:border-primary/50'
                }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 p-3 bg-muted/30 rounded-lg border border-border">
              {passwordRules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  {rule.met ? (
                    <CheckCircle2 size={12} className="text-green-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  )}
                  <span className={`text-[10px] font-medium leading-none ${rule.met ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="modal_confirm_password" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock size={14} className="text-muted-foreground" />
              Confirm New Password
            </label>
            <div className="relative group">
              <input
                id="modal_confirm_password"
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirm_password"
                autoComplete="new-password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                className={`w-full pl-4 pr-10 py-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none ${
                  errors.confirm_password ? 'border-destructive' : 'border-border group-hover:border-primary/50'
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-destructive font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.confirm_password}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
