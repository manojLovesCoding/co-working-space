import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
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
  Users,
  BriefcaseBusiness,
} from "lucide-react";
import api from "../api/axios.js";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { name, email, phone, password, confirmPassword } = formData;

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      alert(data.message || "Registration successful.");

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50/80 py-3 pl-10 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="min-h-screen bg-[#EAF4FF]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* LEFT BRANDING SECTION */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#123C78] via-[#174EA6] to-[#4338A8] lg:flex lg:w-[46%] xl:w-1/2">
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
            <div className="my-auto max-w-xl py-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-blue-50 backdrop-blur-lg">
                <Sparkles size={13} className="text-yellow-300" />
                Your workspace journey starts here
              </div>

              <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-4xl">
                Work better.
                <span className="mt-1.5 block text-blue-200">
                  Connect smarter.
                </span>
              </h1>

              <p className="mt-4 max-w-md text-xs leading-6 text-blue-100/80 xl:text-sm">
                Discover a smarter way to work. Create your Oorza account to
                explore flexible workspaces, manage your bookings, and connect
                with a community built for productivity.
              </p>

              {/* Feature cards */}
              <div className="mt-7 grid max-w-lg grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.09] p-3.5 backdrop-blur-xl">
                  <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-blue-100">
                    <Building2 size={17} />
                  </div>

                  <h3 className="text-xs font-bold text-white">
                    Flexible Workspaces
                  </h3>

                  <p className="mt-1 text-[10px] leading-4 text-blue-100/65">
                    Find the right space for your work and business.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.09] p-3.5 backdrop-blur-xl">
                  <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-blue-100">
                    <LayoutDashboard size={17} />
                  </div>

                  <h3 className="text-xs font-bold text-white">
                    Easy Management
                  </h3>

                  <p className="mt-1 text-[10px] leading-4 text-blue-100/65">
                    Manage your bookings and services effortlessly.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.09] p-3.5 backdrop-blur-xl">
                  <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-blue-100">
                    <Users size={17} />
                  </div>

                  <h3 className="text-xs font-bold text-white">
                    Professional Community
                  </h3>

                  <p className="mt-1 text-[10px] leading-4 text-blue-100/65">
                    Connect, collaborate, and grow together.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.09] p-3.5 backdrop-blur-xl">
                  <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-blue-100">
                    <BriefcaseBusiness size={17} />
                  </div>

                  <h3 className="text-xs font-bold text-white">
                    Built for Productivity
                  </h3>

                  <p className="mt-1 text-[10px] leading-4 text-blue-100/65">
                    Everything you need in one convenient place.
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

        {/* RIGHT REGISTRATION SECTION */}
        <section className="flex min-h-screen flex-1 items-center justify-center px-4 py-6 sm:px-7 lg:px-8 lg:py-8 xl:px-10">
          <div className="w-full max-w-[440px]">
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

            {/* Registration card */}
            <div className="overflow-hidden rounded-2xl border border-blue-100/80 bg-white shadow-xl shadow-blue-900/[0.07]">
              {/* Top accent */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

              <div className="p-4 sm:p-6">
                {/* Heading */}
                <div className="mb-4">
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <UserRound size={18} />
                  </div>

                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">
                    Get started with Oorza
                  </p>

                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                    Create your account
                  </h2>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Join Oorza and discover a better way to work.
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
                  {/* Full name */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      Full Name
                    </label>

                    <div className="group relative">
                      <UserRound
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                      />

                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        disabled={loading}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Email and phone */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        Email Address
                      </label>

                      <div className="group relative">
                        <Mail
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                        />

                        <input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled={loading}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                        Phone Number
                      </label>

                      <div className="group relative">
                        <Phone
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                        />

                        <input
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Phone number"
                          autoComplete="tel"
                          disabled={loading}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      Password
                    </label>

                    <div className="group relative">
                      <LockKeyhole
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                      />

                      <input
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={loading}
                        className={`${inputClass} pr-10`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={loading}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                      >
                        {showPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>

                    <p className="mt-1 text-[9px] text-slate-400">
                      Password must contain at least 6 characters.
                    </p>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                      Confirm Password
                    </label>

                    <div className="group relative">
                      <LockKeyhole
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                      />

                      <input
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={loading}
                        className={`${inputClass} pr-10 ${
                          formData.confirmPassword &&
                          formData.password !== formData.confirmPassword
                            ? "border-red-300"
                            : ""
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        disabled={loading}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>

                    {formData.confirmPassword &&
                      formData.password !== formData.confirmPassword && (
                        <p className="mt-1 text-[10px] text-red-500">
                          Passwords do not match
                        </p>
                      )}
                  </div>

                  {/* Account information */}
                  <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/70 p-2.5">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <p className="text-[10px] leading-4 text-blue-700">
                      Your account will be registered as a customer. You can use
                      your account to explore workspaces and manage your
                      bookings.
                    </p>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      required
                      disabled={loading}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                    />

                    <p className="text-[10px] leading-4 text-slate-500">
                      I agree to the{" "}
                      <Link
                        to="/terms"
                        className="font-semibold text-blue-600 hover:text-indigo-700"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/privacy"
                        className="font-semibold text-blue-600 hover:text-indigo-700"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
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
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create your Oorza account
                        <ArrowRight
                          size={15}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* Login section */}
                <div className="my-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[9px] font-medium text-slate-400">
                    Already part of Oorza?
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <Link
                  to="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 py-2 text-[11px] font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Sign in to your account
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

export default Register;
