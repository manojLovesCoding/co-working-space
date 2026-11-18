import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  CreditCard,
  IndianRupee,
  Receipt,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  Building2,
} from "lucide-react";
import api from "../../api/axios";



const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

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
      return "bg-green-50 text-green-700 border-green-200";

    case "Pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "Expired":
    case "Failed":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={38}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading your Virtual Office purchases...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <Building2 size={17} />
              Customer Dashboard
            </div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              My Virtual Office Purchases
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              View your purchased plans, payment information, and validity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchPurchases(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Purchases</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {totalPurchases}
                </h2>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <BriefcaseBusiness size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Plans</p>
                <h2 className="mt-2 text-3xl font-bold text-green-600">
                  {activePurchases}
                </h2>
              </div>

              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-semibold">Unable to load purchases</p>
              <p className="mt-1 text-sm">{error}</p>

              <button
                type="button"
                onClick={() => fetchPurchases()}
                className="mt-3 text-sm font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!error && purchases.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <BriefcaseBusiness size={30} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No Virtual Office Purchases Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              You haven't purchased a Virtual Office plan yet. Explore our
              available plans to get started.
            </p>

            <a
              href="/virtual-office-prices"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Explore Virtual Office Plans
            </a>
          </div>
        )}

        {/* PURCHASE LIST */}
        {!error && purchases.length > 0 && (
          <div className="space-y-6">
            {purchases.map((purchase) => (
              <div
                key={purchase._id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                {/* PURCHASE HEADER */}
                <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <Building2 size={25} />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {purchase.plan?.planName || "Virtual Office Plan"}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Purchased on {formatDate(purchase.purchaseDate)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Purchase ID: {purchase._id}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={purchase.paymentStatus} />
                    <StatusBadge status={purchase.purchaseStatus} />
                  </div>
                </div>

                {/* PLAN DESCRIPTION */}
                {purchase.plan?.description && (
                  <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                    <p className="text-sm leading-6 text-gray-600">
                      {purchase.plan.description}
                    </p>
                  </div>
                )}

                {/* PURCHASE DETAILS */}
                <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                      <CalendarDays size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Start Date
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(purchase.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                      <Clock size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Expiry Date
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(purchase.expiryDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-green-50 p-2 text-green-600">
                      <ShieldCheck size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Plan Validity
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {purchase.validityMonths || 11} Months
                      </p>
                    </div>
                  </div>
                </div>

                {/* PRICE DETAILS */}
                <div className="border-t border-gray-100 bg-gray-50 p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* PAYMENT BREAKDOWN */}
                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <Receipt size={18} className="text-gray-500" />
                        <h3 className="font-semibold text-gray-900">
                          Payment Summary
                        </h3>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">Base Price</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(purchase.basePrice)}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">
                            GST ({purchase.gstRate}%)
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(purchase.gstAmount)}
                          </span>
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex justify-between gap-4">
                            <span className="font-semibold text-gray-900">
                              Total Amount
                            </span>
                            <span className="text-lg font-bold text-blue-700">
                              {formatCurrency(purchase.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PAYMENT INFORMATION */}
                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <CreditCard size={18} className="text-gray-500" />
                        <h3 className="font-semibold text-gray-900">
                          Payment Information
                        </h3>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">Payment ID</p>
                          <p className="mt-1 break-all font-medium text-gray-800">
                            {purchase.razorpayPaymentId || "Not available"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">Order ID</p>
                          <p className="mt-1 break-all font-medium text-gray-800">
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
        )}
      </div>
    </div>
  );
};

export default MyVirtualOfficePurchases;
