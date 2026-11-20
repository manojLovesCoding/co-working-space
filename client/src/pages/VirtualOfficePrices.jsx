
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

    if (!isAuthenticated) {
      toast.error("Please sign in to purchase a Virtual Office plan.");

      navigate("/login", {
        state: {
          from: "/virtual-office-prices",
        },
      });

      return;
    }

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
          color: "#A95643",
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
    <div className="min-h-screen bg-[#FAF6EF] text-[#382B26]">
      <Navbar />

      {/* ================= PAYMENT SUCCESS ================= */}
      {paymentSuccess && (
        <section className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-[#FFFDFA] shadow-sm">
            <div className="bg-emerald-50 px-5 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>

              <h2 className="mt-3 text-xl font-bold text-emerald-800 sm:text-2xl">
                Payment Successful!
              </h2>

              <p className="mt-1.5 text-sm text-emerald-700">
                Your Virtual Office plan has been activated successfully.
              </p>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8F8175]">
                  Purchased Plan
                </p>
                <p className="mt-1 font-bold text-[#382B26]">
                  {paymentSuccess.planName}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8F8175]">
                  Amount Paid
                </p>
                <p className="mt-1 font-bold text-[#382B26]">
                  {formatCurrency(paymentSuccess.totalAmount)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8F8175]">
                  Start Date
                </p>
                <p className="mt-1 font-semibold text-[#382B26]">
                  {formatDate(paymentSuccess.startDate)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8F8175]">
                  Expiry Date
                </p>
                <p className="mt-1 font-semibold text-[#382B26]">
                  {formatDate(paymentSuccess.expiryDate)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8F8175]">
                  Payment ID
                </p>
                <p className="mt-1 break-all text-sm font-medium text-[#6F6258]">
                  {paymentSuccess.paymentId}
                </p>
              </div>
            </div>

            <div className="border-t border-[#E9DED0] bg-[#FBF3ED] px-5 py-4">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-sm text-[#6F6258]">
                  <CalendarDays
                    size={16}
                    className="mr-2 inline text-emerald-600"
                  />
                  Your plan is valid for 11 months.
                </p>

                <Link
                  to="/customer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#A95643] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#71392F]"
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
      <section className="relative overflow-hidden bg-[#382B26] px-5 py-14 text-center text-white sm:py-20">
        <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#A95643]/25 blur-3xl" />
        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-[#C9826C]/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <Building2 size={30} />
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#E4AD96] sm:text-sm">
            Virtual Office Solutions
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Give Your Business a Professional Address
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#E8DCD3] sm:text-base">
            Explore our virtual office plans and choose a solution that suits
            your business requirements.
          </p>

          <a
            href="#pricing"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#A95643] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#C9826C]"
          >
            Explore Plans
            <ArrowRight size={17} />
          </a>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section
        id="pricing"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16"
      >
        <div className="mb-9 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#A95643] sm:text-sm">
            Our Pricing
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#382B26] sm:text-3xl">
            Choose Your Virtual Office Plan
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#8F8175]">
            Compare our available plans with transparent pricing and GST
            breakdowns.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#E9DED0] bg-[#F8EDE6] px-4 py-2 text-xs font-semibold text-[#71392F] sm:text-sm">
            <Clock size={15} />
            All plans include 11 months validity
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoaderCircle
              size={38}
              className="animate-spin text-[#A95643]"
            />
            <p className="mt-3 text-sm text-[#8F8175]">
              Loading virtual office plans...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchPrices}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && prices.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#D9C9B8] bg-[#FFFDFA] px-5 py-16 text-center">
            <Building2 size={40} className="mx-auto text-[#B7A394]" />

            <h3 className="mt-4 text-lg font-bold text-[#382B26]">
              No Plans Available
            </h3>

            <p className="mt-2 text-sm text-[#8F8175]">
              Our virtual office plans will be displayed here when available.
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        {!loading && !error && prices.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {prices.map((plan) => {
              const isProcessing = processingPlanId === plan._id;

              return (
                <div
                  key={plan._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#C9826C] hover:shadow-lg"
                >
                  {/* Card Header */}
                  <div className="border-b border-[#E9DED0] bg-gradient-to-br from-[#F8EDE6] to-[#FBF3ED] p-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#A95643] shadow-sm">
                      <Building2 size={23} />
                    </div>

                    <h3 className="text-lg font-bold text-[#382B26]">
                      {plan.planName}
                    </h3>

                    <p className="mt-2 min-h-10 text-sm leading-5 text-[#8F8175]">
                      {plan.description ||
                        "Virtual office solution for your business."}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <div>
                      <p className="text-xs font-medium text-[#8F8175]">
                        Base Price
                      </p>

                      <div className="mt-1.5 flex items-center gap-1">
                        <IndianRupee
                          size={23}
                          className="text-[#382B26]"
                        />
                        <span className="text-3xl font-bold text-[#382B26]">
                          {Number(plan.basePrice).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* GST Breakdown */}
                    <div className="my-5 space-y-3 rounded-xl bg-[#FBF3ED] p-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-[#8F8175]">
                          GST ({plan.gstRate}%)
                        </span>

                        <span className="font-semibold text-[#382B26]">
                          {formatCurrency(plan.gstAmount)}
                        </span>
                      </div>

                      <div className="border-t border-dashed border-[#D9C9B8] pt-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-[#382B26]">
                            Total Price
                          </span>

                          <span className="text-xl font-bold text-[#A95643]">
                            {formatCurrency(plan.totalPrice)}
                          </span>
                        </div>

                        <p className="mt-1.5 text-right text-[11px] text-[#8F8175]">
                          Including GST
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mt-auto space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-[#6F6258]">
                        <CheckCircle2
                          size={16}
                          className="shrink-0 text-emerald-600"
                        />
                        Virtual office plan
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[#6F6258]">
                        <Receipt
                          size={16}
                          className="shrink-0 text-emerald-600"
                        />
                        Transparent GST breakdown
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[#6F6258]">
                        <CalendarDays
                          size={16}
                          className="shrink-0 text-emerald-600"
                        />
                        11 months validity
                      </div>

                      <div className="flex items-center gap-2 text-sm text-[#6F6258]">
                        <ShieldCheck
                          size={16}
                          className="shrink-0 text-emerald-600"
                        />
                        Secure Razorpay payment
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <button
                      type="button"
                      disabled={!!processingPlanId || authLoading}
                      onClick={() => handlePurchase(plan)}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#A95643] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#71392F] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <>
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                          Processing...
                        </>
                      ) : isCustomer ? (
                        <>
                          <CreditCard size={17} />
                          Buy Now
                          <ArrowRight size={16} />
                        </>
                      ) : isAuthenticated ? (
                        <>
                          Buy Now
                          <ArrowRight size={16} />
                        </>
                      ) : (
                        <>
                          <LogIn size={16} />
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
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] to-[#A95643] px-6 py-10 text-center shadow-lg sm:px-10 sm:py-12">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-[#382B26]/20 blur-3xl" />

          <div className="relative">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to Get Started?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#F8EDE6]">
              Choose your virtual office plan and take the next step towards
              building your business presence.
            </p>

            <Link
              to={isAuthenticated ? "/virtual-office-prices" : "/register"}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FFFDFA] px-6 py-3 text-sm font-semibold text-[#71392F] shadow-md transition hover:-translate-y-0.5 hover:bg-[#F8EDE6]"
            >
              {isAuthenticated ? "Explore Plans" : "Create Account"}
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VirtualOfficePrices;
