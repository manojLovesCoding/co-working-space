import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  CreditCard,
  Receipt,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  Building2,
  ArrowUpRight,
  Wallet,
  Hash,
} from "lucide-react";
import api from "../../api/axios";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status) => {
  switch (status) {
    case "Active":
    case "Paid":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Expired":
    case "Failed":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
};

const StatusBadge = ({ status }) => {
  const Icon =
    status === "Active" || status === "Paid"
      ? CheckCircle2
      : status === "Expired" || status === "Failed"
        ? XCircle
        : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
        status,
      )}`}
    >
      <Icon size={13} />
      {status || "Unknown"}
    </span>
  );
};

const MyVirtualOfficePurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchPurchases = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data } = await api.get("/virtual-office-price/my-purchases");

      if (data.success) {
        setPurchases(data.purchases || []);
      } else {
        setError(data.message || "Unable to fetch your purchases.");
      }
    } catch (err) {
      console.error("Fetch Virtual Office purchases error:", err);

      setError(
        err.response?.data?.message ||
          "Something went wrong while fetching your purchases.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const activePurchases = purchases.filter(
    (purchase) => purchase.purchaseStatus === "Active",
  ).length;

  const totalPurchases = purchases.length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF4FF] px-4">
        <div className="rounded-3xl border border-blue-100 bg-white p-10 text-center shadow-xl shadow-blue-900/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <LoaderCircle size={34} className="animate-spin text-blue-600" />
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-800">
            Loading your purchases
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Please wait while we retrieve your Virtual Office plans.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAF4FF] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Building2 size={17} />
              <span>Oorza Customer Portal</span>
              <span className="text-blue-300">/</span>
              <span className="text-slate-500">Virtual Office</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              My Virtual Office Purchases
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Manage your virtual office plans, check validity, and review your
              payment details — all in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchPurchases(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh Purchases
          </button>
        </div>

        {/* WELCOME BANNER */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 shadow-xl shadow-blue-900/15 sm:p-8">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-indigo-400/20" />
          <div className="absolute right-20 top-10 h-20 w-20 rounded-full border border-white/10" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-blue-100">
                Your business presence, simplified
              </p>

              <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                Your office. Your identity.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
                Keep track of your virtual office subscriptions, payment
                history, and plan validity from your Oorza dashboard.
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center self-start rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-sm sm:self-center">
              <BriefcaseBusiness size={32} />
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Purchases
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  {totalPurchases}
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                  All purchased plans
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <BriefcaseBusiness size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Plans
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-emerald-600">
                  {activePurchases}
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                  Currently valid plans
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-white p-5 text-red-700 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <AlertCircle size={20} />
            </div>

            <div>
              <p className="font-bold">Unable to load purchases</p>
              <p className="mt-1 text-sm text-slate-600">{error}</p>

              <button
                type="button"
                onClick={() => fetchPurchases()}
                className="mt-3 text-sm font-bold text-red-600 underline underline-offset-4 hover:text-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!error && purchases.length === 0 && (
          <div className="rounded-3xl border border-blue-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <BriefcaseBusiness size={36} />
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-slate-900">
              No Virtual Office Purchases Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You haven't purchased a Virtual Office plan yet. Explore our
              available plans and choose the right option for your business.
            </p>

            <a
              href="/virtual-office-prices"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Explore Virtual Office Plans
              <ArrowUpRight size={17} />
            </a>
          </div>
        )}

        {/* PURCHASE LIST */}
        {!error && purchases.length > 0 && (
          <div>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Purchase History
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review your plans, validity, and payment information.
                </p>
              </div>

              <span className="w-fit rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700">
                {totalPurchases}{" "}
                {totalPurchases === 1 ? "Purchase" : "Purchases"}
              </span>
            </div>

            <div className="space-y-6">
              {purchases.map((purchase) => (
                <div
                  key={purchase._id}
                  className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition duration-200 hover:shadow-lg hover:shadow-blue-900/5"
                >
                  {/* PURCHASE HEADER */}
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white p-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                        <Building2 size={25} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                          {purchase.plan?.planName || "Virtual Office Plan"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Purchased on {formatDate(purchase.purchaseDate)}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 break-all text-xs text-slate-400">
                          <Hash size={12} className="shrink-0" />
                          {purchase._id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <StatusBadge status={purchase.paymentStatus} />
                      <StatusBadge status={purchase.purchaseStatus} />
                    </div>
                  </div>

                  {/* PLAN DESCRIPTION */}
                  {purchase.plan?.description && (
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-7">
                      <p className="text-sm leading-6 text-slate-600">
                        {purchase.plan.description}
                      </p>
                    </div>
                  )}

                  {/* PLAN DETAILS */}
                  <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3 sm:p-7">
                    <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                        <CalendarDays size={19} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Start Date
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900">
                          {formatDate(purchase.startDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                        <Clock size={19} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Expiry Date
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900">
                          {formatDate(purchase.expiryDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                        <ShieldCheck size={19} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Plan Validity
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-900">
                          {purchase.validityMonths || 11} Months
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PRICE DETAILS */}
                  <div className="border-t border-slate-100 bg-slate-50/80 p-5 sm:p-7">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      {/* PAYMENT SUMMARY */}
                      <div>
                        <div className="mb-5 flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                            <Receipt size={18} />
                          </div>
                          <h3 className="font-bold text-slate-900">
                            Payment Summary
                          </h3>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Base Price</span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(purchase.basePrice)}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">
                              GST ({purchase.gstRate}%)
                            </span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(purchase.gstAmount)}
                            </span>
                          </div>

                          <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Total Amount
                                </p>
                                <p className="mt-1 text-2xl font-extrabold tracking-tight text-blue-700">
                                  {formatCurrency(purchase.totalAmount)}
                                </p>
                              </div>
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Wallet size={22} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PAYMENT INFORMATION */}
                      <div>
                        <div className="mb-5 flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                            <CreditCard size={18} />
                          </div>
                          <h3 className="font-bold text-slate-900">
                            Payment Information
                          </h3>
                        </div>

                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Payment ID
                            </p>
                            <p className="mt-1.5 break-all text-sm font-semibold text-slate-800">
                              {purchase.razorpayPaymentId || "Not available"}
                            </p>
                          </div>

                          <div className="border-t border-slate-100 pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Order ID
                            </p>
                            <p className="mt-1.5 break-all text-sm font-semibold text-slate-800">
                              {purchase.razorpayOrderId || "Not available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-10 border-t border-blue-200 pt-5 text-center">
          <p className="text-xs font-medium text-slate-500">
            Your Space. Your People. Your Work.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyVirtualOfficePurchases;
