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
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setError("");
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
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

      alert(data.message);

      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen min-h-[580px] overflow-y-auto bg-[#EAF4FF] lg:min-h-0 lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-screen lg:min-h-0 lg:flex-row">
        {/* LEFT BRANDING SECTION */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#123C78] via-[#174EA6] to-[#4338A8] lg:flex lg:h-full lg:w-[46%] xl:w-1/2">
          {/* Background decoration */}
          <div className="absolute -left-32 -top-32 h-[380px] w-[380px] rounded-full bg-blue-400/20 blur-[90px]" />
          <div className="absolute -bottom-40 -right-32 h-[380px] w-[380px] rounded-full bg-indigo-300/20 blur-[90px]" />

          <div className="absolute right-12 top-20 h-36 w-36 rounded-full border border-white/10 bg-white/[0.04]" />
          <div className="absolute bottom-24 left-10 h-20 w-20 rounded-full border border-white/10 bg-white/[0.04]" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-7 xl:p-10">
            {/* Brand */}
            <Link to="/" className="inline-flex w-fit items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-extrabold text-blue-700 shadow-xl">
                O
              </div>

              <div>
                <p className="text-lg font-extrabold tracking-tight text-white">
                  Oorza
                </p>
                <p className="text-[9px] font-medium tracking-wide text-blue-100/75">
                  YOUR SPACE. YOUR PEOPLE. YOUR WORK.
                </p>
              </div>
            </Link>

            {/* Main content */}
            <div className="my-auto max-w-xl py-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-blue-50 backdrop-blur-lg">
                <Sparkles size={13} className="text-yellow-300" />A smarter way
                to manage your space
              </div>

              <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-4xl">
                Everything you need.
                <span className="mt-1.5 block text-blue-200">
                  All in one place.
                </span>
              </h1>

              <p className="mt-4 max-w-md text-xs leading-6 text-blue-100/80 xl:text-sm">
                Welcome to a simpler way of managing your workspace. Access your
                account, manage your services, and stay connected with
                everything that matters.
              </p>

              {/* Feature cards */}
              <div className="mt-6 grid max-w-lg grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.09] p-3.5 backdrop-blur-xl">
                  <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-blue-100">
                    <Building2 size={17} />
                  </div>

                  <h3 className="text-xs font-bold text-white">
                    Manage Spaces
                  </h3>

                  <p className="mt-1 text-[10px] leading-4 text-blue-100/65">
                    Manage your workspace and services effortlessly.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.09] p-3.5 backdrop-blur-xl">
                  <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-blue-100">
                    <LayoutDashboard size={17} />
                  </div>

                  <h3 className="text-xs font-bold text-white">
                    Stay Organized
                  </h3>

                  <p className="mt-1 text-[10px] leading-4 text-blue-100/65">
                    Keep your bookings and activities in one place.
                  </p>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-medium text-blue-100/75">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-300" />
                  Easy to use
                </span>

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-300" />
                  Secure access
                </span>

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-300" />
                  All in one place
                </span>
              </div>
            </div>

            {/* Footer */}
            <p className="text-[10px] text-blue-100/50">
              © 2026 Oorza. All rights reserved.
            </p>
          </div>
        </section>

        {/* RIGHT LOGIN SECTION */}
        <section className="flex min-h-screen flex-1 items-center justify-center px-4 py-6 sm:px-7 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-3 xl:px-10">
          <div className="w-full max-w-[410px]">
            {/* Mobile brand */}
            <div className="mb-5 text-center lg:hidden">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-base font-extrabold text-white shadow-lg">
                  O
                </div>

                <div className="text-left">
                  <p className="text-base font-extrabold tracking-tight text-slate-900">
                    Oorza
                  </p>
                  <p className="text-[8px] font-semibold tracking-wide text-slate-500">
                    YOUR SPACE. YOUR PEOPLE. YOUR WORK.
                  </p>
                </div>
              </Link>
            </div>

            {/* Login card */}
            <div className="overflow-hidden rounded-2xl border border-blue-100/80 bg-white shadow-xl shadow-blue-900/[0.07]">
              {/* Top accent */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

              <div className="p-4 sm:p-6">
                {/* Heading */}
                <div className="mb-4">
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <LockKeyhole size={18} />
                  </div>

                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">
                    Welcome back
                  </p>

                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                    Sign in to Oorza
                  </h2>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Enter your credentials to access your account.
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-700">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <p className="leading-4">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-[11px] font-semibold text-slate-700"
                    >
                      Email address
                    </label>

                    <div className="group relative">
                      <Mail
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
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
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-[11px] font-semibold text-slate-700"
                      >
                        Password
                      </label>

                      <Link
                        to="/forgot-password"
                        className="text-[10px] font-semibold text-blue-600 transition hover:text-indigo-700"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="group relative">
                      <LockKeyhole
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
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
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-10 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600 disabled:cursor-not-allowed"
                      >
                        {showPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Role selector */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                      Continue as
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Customer */}
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleRoleChange("customer")}
                        className={`group relative flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                          formData.role === "customer"
                            ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/10"
                            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                            formData.role === "customer"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                          }`}
                        >
                          <Building2 size={16} />
                        </div>

                        <div>
                          <p className="text-[11px] font-bold text-slate-800">
                            Customer
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate-500">
                            Customer access
                          </p>
                        </div>

                        {formData.role === "customer" && (
                          <CheckCircle2
                            size={12}
                            className="absolute right-1.5 top-1.5 text-blue-600"
                          />
                        )}
                      </button>

                      {/* Admin */}
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleRoleChange("admin")}
                        className={`group relative flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                          formData.role === "admin"
                            ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/10"
                            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                            formData.role === "admin"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                          }`}
                        >
                          <ShieldCheck size={16} />
                        </div>

                        <div>
                          <p className="text-[11px] font-bold text-slate-800">
                            Admin
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate-500">
                            Admin access
                          </p>
                        </div>

                        {formData.role === "admin" && (
                          <CheckCircle2
                            size={12}
                            className="absolute right-1.5 top-1.5 text-blue-600"
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember me */}
                  <div className="flex items-center">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3 w-3 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                      />

                      <span className="text-[11px] text-slate-500">
                        Remember me
                      </span>
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in to your account
                        <ArrowRight
                          size={15}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* Register section */}
                <div className="my-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[9px] font-medium text-slate-400">
                    New to Oorza?
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <Link
                  to="/register"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 py-2 text-[11px] font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Create a new account
                  <ArrowRight size={13} />
                </Link>

                {/* Security note */}
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-slate-400">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Your account information is protected
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-center text-center">
              <p className="text-[9px] text-slate-400">
                © 2026 Oorza. All rights reserved.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
