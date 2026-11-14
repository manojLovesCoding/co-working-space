import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex min-h-screen">
        {/* Left branding section */}
        <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-900" />

          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <Link to="/" className="flex items-center gap-3 text-white">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-bold text-blue-600 shadow-lg">
                R
              </div>

              <div>
                <p className="text-lg font-bold">RentalHub</p>
                <p className="text-xs text-blue-100">Rental Management</p>
              </div>
            </Link>

            <div className="max-w-lg">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-blue-50">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Your next home starts here
              </div>

              <h1 className="text-5xl font-bold leading-tight text-white xl:text-6xl">
                Find a place
                <span className="block text-blue-200">you'll love.</span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-blue-100/80">
                Join our rental community and discover properties that fit your
                lifestyle, budget, and needs.
              </p>

              <div className="mt-10 space-y-5">
                {[
                  [
                    "✓",
                    "Verified Properties",
                    "Discover quality rental listings",
                  ],
                  [
                    "🔒",
                    "Secure & Simple",
                    "Manage your rental journey with ease",
                  ],
                  [
                    "⚡",
                    "Easy Management",
                    "Everything in one convenient place",
                  ],
                ].map(([icon, title, description]) => (
                  <div key={title} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg">
                      {icon}
                    </div>

                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="text-sm text-blue-100/60">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-blue-100/50">
              © 2026 RentalHub. All rights reserved.
            </p>
          </div>
        </div>

        {/* Registration section */}
        <div className="flex w-full items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:w-1/2 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-8 text-center lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
                  R
                </div>

                <div className="text-left">
                  <p className="text-lg font-bold text-slate-900">RentalHub</p>
                  <p className="text-xs text-slate-500">Rental Management</p>
                </div>
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8 md:p-10">
              <div className="mb-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Get started
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Create your account
                </h2>

                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  Join RentalHub and start your rental journey.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>

                {/* Email and phone */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>

                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone Number
                    </label>

                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      autoComplete="tel"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className={`${inputClass} pr-16`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-slate-800"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className={`${inputClass} pr-16 ${
                        formData.confirmPassword &&
                        formData.password !== formData.confirmPassword
                          ? "border-red-300"
                          : ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-slate-800"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="mt-2 text-xs text-red-500">
                        Passwords do not match
                      </p>
                    )}
                </div>

                <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
                  Your account will be registered as a customer.
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <p className="text-xs leading-5 text-slate-500">
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating account...
                    </>
                  ) : (
                    "Create Customer Account →"
                  )}
                </button>
              </form>

              <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
              © 2026 RentalHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
