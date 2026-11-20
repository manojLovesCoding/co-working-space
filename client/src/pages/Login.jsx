import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "customer",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Auto redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  // Input change
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setError("");
  };

  // Role change
  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
    }));

    setError("");
  };

  // Forgot password
  const handleForgotPassword = () => {
    toast("Please contact admin to reset your password.", {
      duration: 3500,
      icon: "🔒",
    });
  };

  // Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password) {
      const message = "Please enter your email and password.";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      });

      login(data);

      toast.success(data.message || "Login successful!");

      navigate(`/${data.user.role}`);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#E9DED0] bg-[#FAF8F4] py-2.5 pl-9 pr-3 text-xs text-[#382B26] outline-none transition placeholder:text-[#A99A8D] hover:border-[#D5A08D] focus:border-[#A95643] focus:bg-white focus:ring-2 focus:ring-[#A95643]/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-3 py-5 sm:px-5">
      <div className="w-full max-w-[400px]">
        {/* Brand Logo */}
        {/* Brand Logo */}
<div className=" flex justify-center">
  <Link to="/" className="inline-flex items-center justify-center">
    <img
      src="/oorza-logo.png"
      alt="Oorza"
      className="h-28 w-auto max-w-[300px] object-contain sm:h-32 sm:max-w-[340px]"
    />
  </Link>
</div>

        {/* Login Card */}
        <div className="overflow-hidden rounded-xl border border-[#E9DED0] bg-white shadow-lg shadow-[#71392F]/[0.06]">
          {/* Top Accent */}
          <div className="h-1 w-full bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#D58B70]" />

          <div className="p-4 sm:p-5">
            {/* Heading */}
            <div className="mb-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643] ring-1 ring-[#EBD5C9]">
                <LockKeyhole size={17} />
              </div>

              <p className="mb-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-[#A95643]">
                Welcome back
              </p>

              <h2 className="text-xl font-extrabold tracking-tight text-[#382B26]">
                Sign in to Oorza
              </h2>

              <p className="mt-1 text-[10px] leading-4 text-[#8F8175]">
                Enter your credentials to access your account.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[10px] text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p className="leading-4">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-[10px] font-semibold text-[#55443B]"
                >
                  Email address
                </label>

                <div className="group relative">
                  <Mail
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A99A8D] transition group-focus-within:text-[#A95643]"
                  />

                  <input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-[10px] font-semibold text-[#55443B]"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-[9px] font-semibold text-[#A95643] transition hover:text-[#71392F] disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="group relative">
                  <LockKeyhole
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A99A8D] transition group-focus-within:text-[#A95643]"
                  />

                  <input
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={loading}
                    className={`${inputClass} pr-9`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A99A8D] transition hover:text-[#A95643] disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff size={14} />
                    ) : (
                      <Eye size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold text-[#55443B]">
                  Continue as
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {/* Customer */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleRoleChange("customer")}
                    className={`group relative flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
                      formData.role === "customer"
                        ? "border-[#A95643] bg-[#FBF3ED] ring-1 ring-[#A95643]/10"
                        : "border-[#E9DED0] bg-white hover:border-[#D5A08D] hover:bg-[#FBF3ED]/50"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
                        formData.role === "customer"
                          ? "bg-[#A95643] text-white"
                          : "bg-[#F5EDE5] text-[#8F8175] group-hover:bg-[#F8E5D9] group-hover:text-[#A95643]"
                      }`}
                    >
                      <Building2 size={16} />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-[#382B26]">
                        Customer
                      </p>
                      <p className="mt-0.5 text-[8px] text-[#8F8175]">
                        Customer access
                      </p>
                    </div>

                    {formData.role === "customer" && (
                      <CheckCircle2
                        size={12}
                        className="absolute right-1.5 top-1.5 text-[#A95643]"
                      />
                    )}
                  </button>

                  {/* Admin */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleRoleChange("admin")}
                    className={`group relative flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
                      formData.role === "admin"
                        ? "border-[#A95643] bg-[#FBF3ED] ring-1 ring-[#A95643]/10"
                        : "border-[#E9DED0] bg-white hover:border-[#D5A08D] hover:bg-[#FBF3ED]/50"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
                        formData.role === "admin"
                          ? "bg-[#A95643] text-white"
                          : "bg-[#F5EDE5] text-[#8F8175] group-hover:bg-[#F8E5D9] group-hover:text-[#A95643]"
                      }`}
                    >
                      <ShieldCheck size={16} />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-[#382B26]">
                        Admin
                      </p>
                      <p className="mt-0.5 text-[8px] text-[#8F8175]">
                        Admin access
                      </p>
                    </div>

                    {formData.role === "admin" && (
                      <CheckCircle2
                        size={12}
                        className="absolute right-1.5 top-1.5 text-[#A95643]"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-[#D9CABC] accent-[#A95643] focus:ring-[#A95643]"
                  />

                  <span className="text-[10px] text-[#8F8175]">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#A95643] to-[#874536] py-2.5 text-[11px] font-bold text-white shadow-sm shadow-[#A95643]/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-[#B96852] hover:to-[#985340] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to your account
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Register Section */}
            <div className="my-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-[#F0E8DF]" />

              <span className="text-[8px] font-medium text-[#A99A8D]">
                New to Oorza?
              </span>

              <div className="h-px flex-1 bg-[#F0E8DF]" />
            </div>

            <Link
              to="/register"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#EBD5C9] bg-[#FBF3ED] py-2 text-[10px] font-bold text-[#A95643] transition hover:border-[#D5A08D] hover:bg-[#F8EDE6]"
            >
              Create a new account
              <ArrowRight size={12} />
            </Link>

            {/* Security Note */}
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[8px] text-[#A99A8D]">
              <ShieldCheck size={11} className="text-emerald-600" />
              Your account information is protected
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 text-center">
          <p className="text-[8px] text-[#A99A8D]">
            © 2026 Oorza. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;