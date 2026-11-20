import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
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

  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("register");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resendTimer, setResendTimer] = useState(0);
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(0);

  // OTP COUNTDOWN
  useEffect(() => {
    if (resendTimer <= 0 && otpExpiryTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
      setOtpExpiryTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer > 0, otpExpiryTimer > 0]);

  // INPUT CHANGE
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setError("");
    setSuccess("");
  };

  // FORMAT TIMER
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  // STEP 1: SEND REGISTRATION OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

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

      const { data } = await api.post("/auth/send-registration-otp", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      setStep("verify");
      setOtp("");
      setResendTimer(data.resendAfter || 60);
      setOtpExpiryTimer(data.expiresIn || 300);

      setSuccess(
        data.message || "Verification OTP sent successfully to your email.",
      );
    } catch (err) {
      const responseData = err.response?.data;

      setError(
        responseData?.message ||
          "Unable to send verification OTP. Please try again.",
      );

      if (responseData?.remainingSeconds) {
        setResendTimer(responseData.remainingSeconds);
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Please enter the verification OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/verify-registration-otp", {
        email: formData.email.trim().toLowerCase(),
        otp,
      });

      setSuccess(
        data.message || "Email verified and registration completed!",
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      setOtp("");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "OTP verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // RESEND OTP
  const handleResendOTP = async () => {
    setError("");
    setSuccess("");

    if (resendTimer > 0 || resending) return;

    try {
      setResending(true);

      const { data } = await api.post("/auth/send-registration-otp", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      setOtp("");
      setResendTimer(data.resendAfter || 60);
      setOtpExpiryTimer(data.expiresIn || 300);

      setSuccess("A new verification OTP has been sent to your email.");
    } catch (err) {
      const responseData = err.response?.data;

      setError(
        responseData?.message || "Unable to resend OTP. Please try again.",
      );

      if (responseData?.remainingSeconds) {
        setResendTimer(responseData.remainingSeconds);
      }
    } finally {
      setResending(false);
    }
  };

  // BACK TO REGISTRATION
  const handleBack = () => {
    setStep("register");
    setOtp("");
    setError("");
    setSuccess("");
  };

  // INPUT STYLING
  const inputClass =
    "w-full rounded-lg border border-[#E9DED0] bg-[#FAF8F4] py-2.5 pl-9 pr-3 text-xs text-[#382B26] outline-none transition placeholder:text-[#A99A8D] hover:border-[#D5A08D] focus:border-[#A95643] focus:bg-white focus:ring-2 focus:ring-[#A95643]/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-3 py-6 sm:px-5">
      <div className="w-full max-w-[420px]">
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

        {/* REGISTRATION CARD */}
        <div className="overflow-hidden rounded-xl border border-[#E9DED0] bg-white shadow-lg shadow-[#71392F]/[0.06]">
          {/* TOP ACCENT */}
          <div className="h-1 w-full bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#D58B70]" />

          <div className="p-4 sm:p-5">
            {/* HEADING */}
            <div className="mb-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643] ring-1 ring-[#EBD5C9]">
                {step === "register" ? (
                  <UserRound size={17} />
                ) : (
                  <ShieldCheck size={17} />
                )}
              </div>

              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#A95643]">
                {step === "register"
                  ? "Get started with Oorza"
                  : "Email verification"}
              </p>

              <h2 className="text-xl font-extrabold tracking-tight text-[#382B26]">
                {step === "register"
                  ? "Create your account"
                  : "Verify your email"}
              </h2>

              <p className="mt-1 text-[11px] leading-5 text-[#8F8175]">
                {step === "register"
                  ? "Join Oorza and discover a better way to work."
                  : `We've sent a 6-digit verification code to ${formData.email}`}
              </p>
            </div>

            {/* PROGRESS INDICATOR */}
            <div className="mb-4 flex items-center gap-1.5">
              <div
                className={`h-1 flex-1 rounded-full ${
                  step === "register" ? "bg-[#A95643]" : "bg-emerald-500"
                }`}
              />

              <div
                className={`h-1 flex-1 rounded-full ${
                  step === "verify" ? "bg-[#A95643]" : "bg-[#E9DED0]"
                }`}
              />
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[10px] text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p className="leading-4">{error}</p>
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-[10px] text-emerald-700">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <p className="leading-4">{success}</p>
              </div>
            )}

            {/* =====================================
                STEP 1: REGISTRATION FORM
            ===================================== */}
            {step === "register" && (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* FULL NAME */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#55443B]">
                    Full Name
                  </label>

                  <div className="group relative">
                    <UserRound
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A99A8D] transition group-focus-within:text-[#A95643]"
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

                {/* EMAIL */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#55443B]">
                    Email Address
                  </label>

                  <div className="group relative">
                    <Mail
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A99A8D] transition group-focus-within:text-[#A95643]"
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

                {/* PHONE */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#55443B]">
                    Phone Number
                  </label>

                  <div className="group relative">
                    <Phone
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A99A8D] transition group-focus-within:text-[#A95643]"
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

                {/* PASSWORD */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#55443B]">
                    Password
                  </label>

                  <div className="group relative">
                    <LockKeyhole
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A99A8D] transition group-focus-within:text-[#A95643]"
                    />

                    <input
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
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
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A99A8D] transition hover:text-[#A95643]"
                    >
                      {showPassword ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                  </div>

                  <p className="mt-1 text-[9px] text-[#A99A8D]">
                    Password must contain at least 6 characters.
                  </p>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#55443B]">
                    Confirm Password
                  </label>

                  <div className="group relative">
                    <LockKeyhole
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A99A8D] transition group-focus-within:text-[#A95643]"
                    />

                    <input
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={loading}
                      className={`${inputClass} pr-9 ${
                        formData.confirmPassword &&
                        formData.password !== formData.confirmPassword
                          ? "border-red-300"
                          : ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      disabled={loading}
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A99A8D] transition hover:text-[#A95643]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                  </div>

                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="mt-1 text-[9px] text-red-500">
                        Passwords do not match
                      </p>
                    )}
                </div>

                {/* ACCOUNT INFORMATION */}
                <div className="flex items-start gap-2 rounded-lg border border-[#EBD5C9] bg-[#FBF3ED] p-2.5">
                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-[#A95643]"
                  />

                  <p className="text-[10px] leading-4 text-[#805044]">
                    Your account will be registered as a customer. Verify your
                    email address to complete registration.
                  </p>
                </div>

                {/* TERMS */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    required
                    disabled={loading}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[#D9CABC] accent-[#A95643] focus:ring-[#A95643]"
                  />

                  <p className="text-[10px] leading-4 text-[#8F8175]">
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="font-semibold text-[#A95643] transition hover:text-[#71392F]"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="font-semibold text-[#A95643] transition hover:text-[#71392F]"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#A95643] to-[#874536] py-2.5 text-xs font-bold text-white shadow-sm shadow-[#A95643]/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-[#B96852] hover:to-[#985340] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending verification code...
                    </>
                  ) : (
                    <>
                      Continue with Email Verification
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* =====================================
                STEP 2: OTP VERIFICATION
            ===================================== */}
            {step === "verify" && (
              <form onSubmit={handleVerifyOTP} className="space-y-3">
                {/* EMAIL INFORMATION */}
                <div className="rounded-lg border border-[#EBD5C9] bg-[#FBF3ED] p-3 text-center">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#A95643] shadow-sm">
                    <Mail size={18} />
                  </div>

                  <h3 className="text-xs font-bold text-[#382B26]">
                    Check your inbox
                  </h3>

                  <p className="mt-1 text-[10px] leading-4 text-[#8F8175]">
                    Enter the verification code sent to your registered email
                    address.
                  </p>

                  <p className="mt-1.5 break-all text-[11px] font-bold text-[#A95643]">
                    {formData.email}
                  </p>
                </div>

                {/* OTP INPUT */}
                <div>
                  <label className="mb-1.5 block text-center text-[10px] font-semibold text-[#55443B]">
                    Enter 6-digit verification code
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setError("");
                      setSuccess("");
                    }}
                    placeholder="000000"
                    disabled={loading}
                    className="w-full rounded-lg border border-[#E9DED0] bg-[#FAF8F4] py-3 text-center text-xl font-extrabold tracking-[0.6em] text-[#382B26] outline-none transition placeholder:text-[#D5C7B9] focus:border-[#A95643] focus:bg-white focus:ring-2 focus:ring-[#A95643]/10 disabled:opacity-60"
                  />

                  <p className="mt-1 text-center text-[9px] text-[#A99A8D]">
                    Enter the OTP exactly as received in your email.
                  </p>
                </div>

                {/* OTP EXPIRY */}
                <div className="flex items-center justify-between rounded-lg border border-[#E9DED0] bg-[#FAF8F4] px-3 py-2">
                  <div className="flex items-center gap-2 text-[10px] text-[#8F8175]">
                    <ShieldCheck size={13} className="text-[#A95643]" />
                    OTP validity
                  </div>

                  <span
                    className={`text-[11px] font-bold tabular-nums ${
                      otpExpiryTimer === 0
                        ? "text-red-600"
                        : "text-[#55443B]"
                    }`}
                  >
                    {formatTime(otpExpiryTimer)}
                  </span>
                </div>

                {/* VERIFY BUTTON */}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#A95643] to-[#874536] py-2.5 text-xs font-bold text-white shadow-sm shadow-[#A95643]/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-[#B96852] hover:to-[#985340] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verifying OTP...
                    </>
                  ) : (
                    <>
                      Verify Email & Create Account
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                {/* RESEND OTP */}
                <div className="text-center">
                  <p className="text-[10px] text-[#8F8175]">
                    Didn't receive the verification code?
                  </p>

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || resending || loading}
                    className="mt-1 text-[10px] font-bold text-[#A95643] transition hover:text-[#71392F] disabled:cursor-not-allowed disabled:text-[#B9ADA2]"
                  >
                    {resending
                      ? "Sending new OTP..."
                      : resendTimer > 0
                        ? `Resend OTP in ${formatTime(resendTimer)}`
                        : "Resend Verification Code"}
                  </button>
                </div>

                {/* BACK BUTTON */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading || resending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E9DED0] py-2 text-[10px] font-semibold text-[#806F63] transition hover:border-[#D5A08D] hover:bg-[#FBF3ED] hover:text-[#A95643] disabled:opacity-50"
                >
                  <ArrowLeft size={13} />
                  Back to Registration
                </button>
              </form>
            )}

            {/* LOGIN SECTION */}
            <div className="my-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-[#F0E8DF]" />

              <span className="text-[9px] font-medium text-[#A99A8D]">
                Already part of Oorza?
              </span>

              <div className="h-px flex-1 bg-[#F0E8DF]" />
            </div>

            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#EBD5C9] bg-[#FBF3ED] py-2 text-[10px] font-bold text-[#A95643] transition hover:border-[#D5A08D] hover:bg-[#F8EDE6]"
            >
              Sign in to your account
              <ArrowRight size={12} />
            </Link>

            {/* SECURITY NOTE */}
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-[#A99A8D]">
              <ShieldCheck size={12} className="text-emerald-600" />
              Your account information is protected
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-4 text-center">
          <p className="text-[9px] text-[#A99A8D]">
            © 2026 Oorza. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;