import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  IndianRupee,
  LoaderCircle,
  RefreshCw,
  Receipt,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import api from "../api/axios.js";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

const VirtualOfficePrices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ================= HEADER ================= */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Building2 size={23} />
            </div>

            <span className="text-xl font-bold tracking-tight text-slate-900">
              Vayuhu
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600 sm:flex"
            >
              <ArrowLeft size={16} />
              Home
            </Link>

            <Link
              to="/login"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

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
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <LoaderCircle size={42} className="animate-spin text-blue-600" />

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
            {prices.map((plan) => (
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
                      <IndianRupee size={25} className="text-slate-900" />

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
                      <Receipt size={17} className="shrink-0 text-green-600" />
                      Transparent GST breakdown
                    </div>
                  </div>

                  <Link
                    to="/register"
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                    Get Started
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            ))}
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
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Create Account
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:px-8">
          <p>© 2026 Vayuhu - Rental Management System</p>

          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/" className="transition hover:text-blue-600">
              Home
            </Link>

            <Link
              to="/virtual-office-prices"
              className="transition hover:text-blue-600"
            >
              Virtual Office Plans
            </Link>

            <Link to="/login" className="transition hover:text-blue-600">
              Login
            </Link>

            <Link to="/register" className="transition hover:text-blue-600">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VirtualOfficePrices;
