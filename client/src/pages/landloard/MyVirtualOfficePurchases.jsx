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
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "Expired":
    case "Failed":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-[#E9DED0] bg-[#F8F3EC] text-[#8F8175]";
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
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${getStatusStyle(
        status,
      )}`}
    >
      <Icon size={12} />
      {status || "Unknown"}
    </span>
  );
};

const TableLabel = ({ children }) => (
  <span className="text-[10px] font-bold uppercase tracking-wide text-[#A99B8E]">
    {children}
  </span>
);

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
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-7 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EDE6]">
            <LoaderCircle
              size={27}
              className="animate-spin text-[#A95643]"
            />
          </div>

          <h2 className="mt-4 text-base font-bold text-[#382B26]">
            Loading your purchases
          </h2>

          <p className="mt-1.5 text-sm text-[#8F8175]">
            Please wait while we retrieve your Virtual Office plans.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] px-3 py-5 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#A95643]">
              <Building2 size={15} />
              <span>Oorza Customer Portal</span>
              <span className="text-[#C9826C]">/</span>
              <span className="text-[#8F8175]">Virtual Office</span>
            </div>

            <h1 className="text-xl font-extrabold tracking-tight text-[#382B26] sm:text-2xl">
              My Virtual Office Purchases
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm leading-5 text-[#8F8175]">
              Manage your virtual office plans, check validity, and review
              your payment details — all in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchPurchases(true)}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E9DED0] bg-[#FFFDFA] px-4 py-2.5 text-sm font-semibold text-[#71392F] shadow-sm transition hover:border-[#C9826C] hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh Purchases
          </button>
        </div>

        {/* WELCOME BANNER */}
        <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#C9826C] p-5 shadow-sm sm:p-6">
          <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-[#F8EDE6]/10" />
          <div className="absolute right-16 top-8 h-16 w-16 rounded-full border border-white/15" />

          <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold text-[#F8EDE6]">
                Your business presence, simplified
              </p>

              <h2 className="mt-1.5 text-xl font-extrabold text-white sm:text-2xl">
                Your office. Your identity.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-5 text-white/80">
                Keep track of your virtual office subscriptions, payment
                history, and plan validity from your Oorza dashboard.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center self-start rounded-xl border border-white/20 bg-white/10 text-white sm:self-center">
              <BriefcaseBusiness size={27} />
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#8F8175]">
                  Total Purchases
                </p>

                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#382B26]">
                  {totalPurchases}
                </h2>

                <p className="mt-1 text-xs text-[#A99B8E]">
                  All purchased plans
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                <BriefcaseBusiness size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#8F8175]">
                  Active Plans
                </p>

                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-emerald-700">
                  {activePurchases}
                </h2>

                <p className="mt-1 text-xs text-[#A99B8E]">
                  Currently valid plans
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ShieldCheck size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-[#FFFDFA] p-4 text-red-700 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <AlertCircle size={19} />
            </div>

            <div>
              <p className="text-sm font-bold">
                Unable to load purchases
              </p>

              <p className="mt-1 text-sm text-[#8F8175]">{error}</p>

              <button
                type="button"
                onClick={() => fetchPurchases()}
                className="mt-2 text-xs font-bold text-[#A95643] underline underline-offset-4 transition hover:text-[#71392F]"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!error && purchases.length === 0 && (
          <div className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] px-5 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8EDE6] text-[#A95643]">
              <BriefcaseBusiness size={30} />
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-[#382B26]">
              No Virtual Office Purchases Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-[#8F8175]">
              You haven't purchased a Virtual Office plan yet. Explore our
              available plans and choose the right option for your business.
            </p>

            <a
              href="/virtual-office-prices"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#A95643] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#71392F]"
            >
              Explore Virtual Office Plans
              <ArrowUpRight size={16} />
            </a>
          </div>
        )}

        {/* PURCHASE HISTORY TABLE */}
        {!error && purchases.length > 0 && (
          <div>
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-extrabold text-[#382B26]">
                  Purchase History
                </h2>

                <p className="mt-1 text-xs text-[#8F8175]">
                  Review your plans, validity, and payment information.
                </p>
              </div>

              <span className="w-fit rounded-full border border-[#E9DED0] bg-[#FFFDFA] px-3 py-1.5 text-xs font-bold text-[#A95643]">
                {totalPurchases}{" "}
                {totalPurchases === 1 ? "Purchase" : "Purchases"}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E9DED0] bg-[#FBF3ED]">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        #
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Plan Details
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Purchase Date
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Validity
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Payment Status
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Plan Status
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Base Price
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        GST
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Total Amount
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Payment Details
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {purchases.map((purchase, index) => (
                      <tr
                        key={purchase._id}
                        className="border-b border-[#E9DED0] transition last:border-b-0 hover:bg-[#FBF8F3]"
                      >
                        <td className="px-4 py-3 text-xs font-semibold text-[#A99B8E]">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                              <Building2 size={17} />
                            </div>

                            <div className="min-w-0 max-w-[190px]">
                              <p className="text-sm font-bold text-[#382B26]">
                                {purchase.plan?.planName ||
                                  "Virtual Office Plan"}
                              </p>

                              {purchase.plan?.description && (
                                <p
                                  className="mt-1 truncate text-[11px] text-[#8F8175]"
                                  title={purchase.plan.description}
                                >
                                  {purchase.plan.description}
                                </p>
                              )}

                              <p
                                className="mt-1 flex items-center gap-1 text-[10px] text-[#A99B8E]"
                                title={purchase._id}
                              >
                                <Hash size={10} />
                                {purchase._id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <CalendarDays
                              size={14}
                              className="text-[#A95643]"
                            />
                            <span className="text-xs font-medium text-[#382B26]">
                              {formatDate(purchase.purchaseDate)}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <CalendarDays
                                size={12}
                                className="text-[#A95643]"
                              />
                              <span className="text-xs text-[#382B26]">
                                {formatDate(purchase.startDate)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <Clock
                                size={12}
                                className="text-[#A95643]"
                              />
                              <span className="text-xs text-[#382B26]">
                                {formatDate(purchase.expiryDate)}
                              </span>
                            </div>

                            <p className="text-[10px] font-semibold text-[#8F8175]">
                              {purchase.validityMonths || 11} Months
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={purchase.paymentStatus} />
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={purchase.purchaseStatus} />
                        </td>

                        <td className="px-4 py-3 text-right">
                          <span className="whitespace-nowrap text-xs font-semibold text-[#382B26]">
                            {formatCurrency(purchase.basePrice)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="whitespace-nowrap">
                            <p className="text-xs font-semibold text-[#382B26]">
                              {formatCurrency(purchase.gstAmount)}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#A99B8E]">
                              {purchase.gstRate}%
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <span className="whitespace-nowrap text-sm font-extrabold text-[#A95643]">
                            {formatCurrency(purchase.totalAmount)}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="max-w-[190px] space-y-2">
                            <div>
                              <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#A99B8E]">
                                <CreditCard size={10} />
                                Payment ID
                              </div>
                              <p
                                className="truncate text-[11px] font-medium text-[#382B26]"
                                title={purchase.razorpayPaymentId || "Not available"}
                              >
                                {purchase.razorpayPaymentId || "Not available"}
                              </p>
                            </div>

                            <div>
                              <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#A99B8E]">
                                <Receipt size={10} />
                                Order ID
                              </div>
                              <p
                                className="truncate text-[11px] font-medium text-[#382B26]"
                                title={purchase.razorpayOrderId || "Not available"}
                              >
                                {purchase.razorpayOrderId || "Not available"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col justify-between gap-2 border-t border-[#E9DED0] bg-[#FBF3ED] px-4 py-2.5 sm:flex-row sm:items-center">
                <p className="text-[11px] text-[#8F8175]">
                  Showing {totalPurchases}{" "}
                  {totalPurchases === 1 ? "purchase" : "purchases"}
                </p>

                <p className="text-[11px] font-semibold text-[#A95643]">
                  Your Space. Your People. Your Work.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-6 border-t border-[#E9DED0] pt-4 text-center">
          <p className="text-xs font-medium text-[#8F8175]">
            Your Space. Your People. Your Work.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyVirtualOfficePurchases;