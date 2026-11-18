import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Building2,
  CheckCircle2,
  IndianRupee,
  LoaderCircle,
  RefreshCw,
  Receipt,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  LogIn,
  CreditCard,
  Clock,
} from "lucide-react";

import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/public/Navbar.jsx";
import Footer from "../components/public/Footer.jsx";

const RAZORPAY_SCRIPT_URL =
  "https://checkout.razorpay.com/v1/checkout.js";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });

      existingScript.addEventListener("error", () => resolve(false), {
        once: true,
      });

      return;
    }

    const script = document.createElement("script");

    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

const VirtualOfficePrices = () => {
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    role,
    loading: authLoading,
  } = useAuth();

  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // FETCH ACTIVE VIRTUAL OFFICE PLANS
  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/virtual-office-price/public");

      if (data.success) {
        setPrices(data.prices || []);
      } else {
        setError(data.message || "Unable to fetch virtual office plans.");
      }
    } catch (err) {
      console.error("Fetch virtual office prices error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load plans. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // HANDLE PLAN PURCHASE
  const handlePurchase = async (plan) => {
    if (authLoading) {
      toast.loading("Checking your account...");
      return;
    }

    // Customer must log in before purchasing.
    if (!isAuthenticated) {
      toast.error("Please sign in to purchase a Virtual Office plan.");

      navigate("/login", {
        state: {
          from: "/virtual-office-prices",
        },
      });

      return;
    }

    // Only customer accounts can purchase plans.
    if (role !== "customer") {
      toast.error("Only customer accounts can purchase Virtual Office plans.");
      return;
    }

    if (processingPlanId) return;

    try {
      setProcessingPlanId(plan._id);
      setPaymentSuccess(null);

      // 1. Load Razorpay Checkout script.
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Unable to load Razorpay Checkout. Please check your internet connection.",
        );
      }

      // 2. Create Razorpay order through backend.
      const { data: orderData } = await api.post(
        "/virtual-office-price/create-order",
        {
          planId: plan._id,
        },
      );

      if (!orderData.success) {
        throw new Error(
          orderData.message || "Unable to create payment order.",
        );
      }

      // 3. Configure Razorpay Checkout.
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,

        name: "Oorza",
        description: `${plan.planName} - Virtual Office (11 Months)`,

        order_id: orderData.orderId,

        prefill: {
          name: user?.name || user?.fullName || "",
          email: user?.email || "",
          contact: user?.phone || user?.mobile || "",
        },

        notes: {
          purchaseId: orderData.purchaseId,
          planName: plan.planName,
        },

        theme: {
          color: "#2563eb",
        },

        // 4. Verify payment through backend.
        handler: async function (response) {
          try {
            toast.loading("Verifying your payment...", {
              id: "virtual-office-payment",
            });

            const { data: verificationData } = await api.post(
              "/virtual-office-price/verify-payment",
              {
                purchaseId: orderData.purchaseId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            );

            if (!verificationData.success) {
              throw new Error(
                verificationData.message || "Payment verification failed.",
              );
            }

            const purchase = verificationData.purchase;

            setPaymentSuccess({
              purchaseId: purchase._id,
              planName: purchase.plan?.planName || plan.planName,
              totalAmount: purchase.totalAmount,
              startDate: purchase.startDate,
              expiryDate: purchase.expiryDate,
              paymentId: purchase.razorpayPaymentId,
            });

            toast.success("Virtual Office payment successful!", {
              id: "virtual-office-payment",
            });

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          } catch (verificationError) {
            console.error(
              "Virtual Office payment verification error:",
              verificationError,
            );

            toast.error(
              verificationError.response?.data?.message ||
                verificationError.message ||
                "Payment verification failed. Please contact support if money was deducted.",
              {
                id: "virtual-office-payment",
                duration: 6000,
              },
            );
          } finally {
            setProcessingPlanId(null);
          }
        },

        modal: {
          ondismiss: function () {
            setProcessingPlanId(null);
            toast("Payment window closed.");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      // Payment failure event.
      razorpayInstance.on("payment.failed", function (response) {
        console.error("Razorpay payment failed:", response.error);

        toast.error(
          response.error?.description || "Payment failed. Please try again.",
        );

        setProcessingPlanId(null);
      });

      // 5. Open Razorpay Checkout.
      razorpayInstance.open();
    } catch (err) {
      console.error("Virtual Office purchase error:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to initiate payment. Please try again.",
      );

      setProcessingPlanId(null);
    }
  };

  const isCustomer = isAuthenticated && role === "customer";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {/* ================= PAYMENT SUCCESS ================= */}
      {paymentSuccess && (
        <section className="mx-auto max-w-4xl px-5 pt-8 sm:px-8">
          <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
            <div className="bg-green-50 px-6 py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 size={36} className="text-green-600" />
              </div>

              <h2 className="mt-4 text-2xl font-bold text-green-800">
                Payment Successful!
              </h2>

              <p className="mt-2 text-sm text-green-700">
                Your Virtual Office plan has been activated successfully.
              </p>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Purchased Plan
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {paymentSuccess.planName}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Amount Paid
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {formatCurrency(paymentSuccess.totalAmount)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Start Date
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {formatDate(paymentSuccess.startDate)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Expiry Date
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {formatDate(paymentSuccess.expiryDate)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Payment ID
                </p>

                <p className="mt-1 break-all text-sm font-medium text-slate-700">
                  {paymentSuccess.paymentId}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-sm text-slate-600">
                  <CalendarDays
                    size={16}
                    className="mr-2 inline text-green-600"
                  />
                  Your plan is valid for 11 months.
                </p>

                <Link
                  to="/customer"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Go to Dashboard
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-slate-950 px-5 py-20 text-center text-white sm:py-28">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <Building2 size={34} />
          </div>

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
            Virtual Office Solutions
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Give Your Business a Professional Address
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Explore our virtual office plans and choose a solution that suits
            your business requirements.
          </p>

          <a
            href="#pricing"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
          >
            Explore Plans
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section
        id="pricing"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20"
      >
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Our Pricing
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Choose Your Virtual Office Plan
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-500">
            Compare our available plans with transparent pricing and GST
            breakdowns.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <Clock size={16} />
            All plans include 11 months validity
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <LoaderCircle
              size={42}
              className="animate-spin text-blue-600"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading virtual office plans...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-medium text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchPrices}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && prices.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <Building2 size={44} className="mx-auto text-slate-400" />

            <h3 className="mt-5 text-xl font-bold text-slate-800">
              No Plans Available
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Our virtual office plans will be displayed here when available.
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        {!loading && !error && prices.length > 0 && (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {prices.map((plan) => {
              const isProcessing = processingPlanId === plan._id;

              return (
                <div
                  key={plan._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
                >
                  {/* Card Header */}
                  <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-7">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <Building2 size={25} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">
                      {plan.planName}
                    </h3>

                    <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
                      {plan.description ||
                        "Virtual office solution for your business."}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col p-7">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Base Price
                      </p>

                      <div className="mt-2 flex items-center gap-1">
                        <IndianRupee
                          size={25}
                          className="text-slate-900"
                        />

                        <span className="text-3xl font-bold text-slate-900">
                          {Number(plan.basePrice).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* GST Breakdown */}
                    <div className="my-7 space-y-4 rounded-xl bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500">
                          GST ({plan.gstRate}%)
                        </span>

                        <span className="font-semibold text-slate-800">
                          {formatCurrency(plan.gstAmount)}
                        </span>
                      </div>

                      <div className="border-t border-dashed border-slate-300 pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-700">
                            Total Price
                          </span>

                          <span className="text-xl font-bold text-blue-700">
                            {formatCurrency(plan.totalPrice)}
                          </span>
                        </div>

                        <p className="mt-2 text-right text-xs text-slate-400">
                          Including GST
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2
                          size={17}
                          className="shrink-0 text-green-600"
                        />
                        Virtual office plan
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Receipt
                          size={17}
                          className="shrink-0 text-green-600"
                        />
                        Transparent GST breakdown
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays
                          size={17}
                          className="shrink-0 text-green-600"
                        />
                        11 months validity
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ShieldCheck
                          size={17}
                          className="shrink-0 text-green-600"
                        />
                        Secure Razorpay payment
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <button
                      type="button"
                      disabled={!!processingPlanId || authLoading}
                      onClick={() => handlePurchase(plan)}
                      className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <>
                          <LoaderCircle
                            size={19}
                            className="animate-spin"
                          />
                          Processing...
                        </>
                      ) : isCustomer ? (
                        <>
                          <CreditCard size={18} />
                          Buy Now
                          <ArrowRight size={17} />
                        </>
                      ) : isAuthenticated ? (
                        <>
                          Buy Now
                          <ArrowRight size={17} />
                        </>
                      ) : (
                        <>
                          <LogIn size={17} />
                          Sign In to Purchase
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= CTA ================= */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-14 text-center shadow-xl sm:px-12">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-indigo-950/20 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to Get Started?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-blue-100">
              Choose your virtual office plan and take the next step towards
              building your business presence.
            </p>

            <Link
              to={isAuthenticated ? "/virtual-office-prices" : "/register"}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              {isAuthenticated ? "Explore Plans" : "Create Account"}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VirtualOfficePrices;