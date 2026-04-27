import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../api/axios"; // axios instance with baseURL http://127.0.0.1:8000/api/v1

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    number: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.number.trim()) {
      newErrors.number = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.number.trim())) {
      newErrors.number = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setErrors({}); // Clear previous errors

      const payload = {
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim(),
        full_name: formData.name.trim(),
        phone_number: formData.number.trim(),
        password: formData.password,
      };

      const res = await api.post("/auth/register", payload);
      
      if (res.status === 201 || res.status === 200) {
        alert("Account created successfully!");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      const errorData = err?.response?.data;
      
      if (errorData?.detail) {
        // Handle string detail (FastAPI standard)
        const detail = errorData.detail;
        if (typeof detail === 'string') {
          if (detail.toLowerCase().includes("username")) {
            setErrors({ username: detail });
          } else if (detail.toLowerCase().includes("email")) {
            setErrors({ email: detail });
          } else if (detail.toLowerCase().includes("phone")) {
            setErrors({ number: detail });
          } else {
            setErrors({ submit: detail });
          }
        } else if (Array.isArray(detail)) {
          // Handle FastAPI validation errors (list of objects)
          const newErrors = {};
          detail.forEach(errItem => {
            const field = errItem.loc[errItem.loc.length - 1];
            newErrors[field === 'phone_number' ? 'number' : field] = errItem.msg;
          });
          setErrors(newErrors);
        }
      } else {
        setErrors({ submit: "Registration failed. Please check your internet connection." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a2332] rounded-xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Create Account
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-500 text-sm text-center">{errors.submit}</p>
              </div>
            )}
            {/* Username */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                className={`w-full px-4 py-3 bg-[#0f1419] border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.username
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-700 focus:border-[#14b8a6]"
                }`}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Name */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className={`w-full px-4 py-3 bg-[#0f1419] border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.name
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-700 focus:border-[#14b8a6]"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 bg-[#0f1419] border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-700 focus:border-[#14b8a6]"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone number */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Number
              </label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className={`w-full px-4 py-3 bg-[#0f1419] border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.number
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-700 focus:border-[#14b8a6]"
                }`}
              />
              {errors.number && (
                <p className="text-red-500 text-sm mt-1">{errors.number}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 bg-[#0f1419] border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors pr-12 ${
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-700 focus:border-[#14b8a6]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3 bg-[#0f1419] border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors pr-12 ${
                    errors.confirmPassword
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-700 focus:border-[#14b8a6]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors mb-6"
            >
              {submitting ? "Creating account..." : "Sign Up"}
            </button>

            {/* Login link */}
            <div className="text-center text-gray-400 text-sm">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-[#14b8a6] hover:text-[#0d9488] font-medium transition-colors"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
