import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Users,
  IndianRupee,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Eye,
  AlertCircle,
  LoaderCircle,
  Filter,
  X,
  Building2,
  CreditCard,
  Receipt,
  Clock3,
  ArrowUpRight,
  PackageCheck,
  UserRound,
  Mail,
  Phone,
  Hash,
  CalendarCheck,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import api from "../../api/axios.js";

const formatCurrency = (amount, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status) => {
  const styles = {
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    Failed: "bg-red-50 text-red-700 ring-red-600/20",
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Expired: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  return styles[status] || "bg-slate-100 text-slate-600 ring-slate-500/20";
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ring-inset ${getStatusStyle(
      status,
    )}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status || "Unknown"}
  </span>
);

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-blue-100/80 bg-white p-5 shadow-[0_3px_15px_rgba(30,64,175,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(30,64,175,0.09)]">
    <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-blue-50/80 transition-transform duration-300 group-hover:scale-125" />

    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-3 break-words text-2xl font-extrabold tracking-tight text-slate-900">
          {value}
        </h3>
        {subtitle && (
          <p className="mt-2 text-xs font-medium text-slate-400">{subtitle}</p>
        )}
      </div>

      <div className={`shrink-0 rounded-2xl p-3.5 ${color}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
    </div>
  </div>
);

const DetailItem = ({ label, value, icon: Icon }) => (
  <div className="min-w-0 rounded-xl border border-blue-100/70 bg-white p-3.5">
    <div className="flex items-center gap-2 text-slate-400">
      {Icon && <Icon size={14} />}
      <p className="text-[11px] font-semibold uppercase tracking-wider">
        {label}
      </p>
    </div>
    <p className="mt-2 break-all text-sm font-semibold text-slate-800">
      {value || "—"}
    </p>
  </div>
);

const PriceRow = ({ label, value, currency, bold }) => (
  <div className="flex items-center justify-between gap-3">
    <span
      className={`text-sm ${
        bold ? "font-bold text-slate-900" : "font-medium text-slate-500"
      }`}
    >
      {label}
    </span>
    <span
      className={`text-sm ${
        bold
          ? "text-lg font-extrabold text-blue-700"
          : "font-semibold text-slate-800"
      }`}
    >
      {formatCurrency(value, currency)}
    </span>
  </div>
);

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-4 flex items-center gap-3">
    <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
      <Icon size={18} />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
    </div>
  </div>
);

const VirtualOfficePurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [purchaseFilter, setPurchaseFilter] = useState("All");

  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const fetchPurchases = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        "/virtual-office-price/admin/all-purchases",
      );

      if (response.data?.success) {
        setPurchases(response.data.purchases || []);
      } else {
        setError(response.data?.message || "Unable to fetch purchase records.");
      }
    } catch (err) {
      console.error("Fetch Virtual Office purchases error:", err);

      setError(
        err.response?.data?.message ||
          "Something went wrong while fetching purchases.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const customerName = purchase.customer?.name || "";
      const customerEmail = purchase.customer?.email || "";
      const customerPhone = purchase.customer?.phone || "";
      const planName = purchase.plan?.planName || "";
      const purchaseId = purchase._id || "";
      const paymentId = purchase.razorpayPaymentId || "";

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        customerName.toLowerCase().includes(searchText) ||
        customerEmail.toLowerCase().includes(searchText) ||
        customerPhone.toLowerCase().includes(searchText) ||
        planName.toLowerCase().includes(searchText) ||
        purchaseId.toLowerCase().includes(searchText) ||
        paymentId.toLowerCase().includes(searchText);

      const matchesPayment =
        paymentFilter === "All" || purchase.paymentStatus === paymentFilter;

      const matchesPurchase =
        purchaseFilter === "All" || purchase.purchaseStatus === purchaseFilter;

      return matchesSearch && matchesPayment && matchesPurchase;
    });
  }, [purchases, search, paymentFilter, purchaseFilter]);

  const statistics = useMemo(() => {
    const paidPurchases = purchases.filter(
      (item) => item.paymentStatus === "Paid",
    );

    const activePurchases = purchases.filter(
      (item) => item.purchaseStatus === "Active",
    );

    const totalRevenue = paidPurchases.reduce(
      (total, item) => total + Number(item.totalAmount || 0),
      0,
    );

    const uniqueCustomers = new Set(
      purchases.map((item) => item.customer?._id).filter(Boolean),
    );

    return {
      totalPurchases: purchases.length,
      totalCustomers: uniqueCustomers.size,
      activePurchases: activePurchases.length,
      totalRevenue,
    };
  }, [purchases]);

  const clearFilters = () => {
    setSearch("");
    setPaymentFilter("All");
    setPurchaseFilter("All");
  };

  const hasActiveFilters =
    search.trim() !== "" || paymentFilter !== "All" || purchaseFilter !== "All";

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 p-6 shadow-lg shadow-blue-900/10 sm:p-8">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />
          <div className="absolute -bottom-28 right-44 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50">
                <Building2 size={14} />
                Oorza Administration
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Virtual Office Purchases
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
                Track customer subscriptions, monitor transactions and manage
                all Virtual Office purchase records from one place.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-blue-100">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={15} />
                  Purchase Management
                </span>
                <span className="h-1 w-1 rounded-full bg-blue-300" />
                <span className="flex items-center gap-1.5">
                  <Receipt size={15} />
                  Payment Overview
                </span>
              </div>
            </div>

            <button
              onClick={() => fetchPurchases(true)}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh Records"}
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Purchases"
            value={statistics.totalPurchases}
            icon={ShoppingBag}
            color="bg-indigo-100 text-indigo-700"
            subtitle="All purchase records"
          />

          <StatCard
            title="Total Customers"
            value={statistics.totalCustomers}
            icon={Users}
            color="bg-sky-100 text-sky-700"
            subtitle="Unique purchasing customers"
          />

          <StatCard
            title="Active Plans"
            value={statistics.activePurchases}
            icon={CheckCircle2}
            color="bg-emerald-100 text-emerald-700"
            subtitle="Currently active purchases"
          />

          <StatCard
            title="Total Revenue"
            value={formatCurrency(statistics.totalRevenue)}
            icon={IndianRupee}
            color="bg-blue-100 text-blue-700"
            subtitle="From paid purchases"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-100 p-2 text-red-600">
                <AlertCircle size={19} />
              </div>
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>

            <button
              onClick={() => fetchPurchases()}
              className="rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_3px_15px_rgba(30,64,175,0.04)] sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                <Filter size={19} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Search & Filters</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Find purchases using customer or transaction details
                </p>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 transition hover:text-indigo-800"
              >
                <X size={14} />
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, email, plan or purchase ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Payment Status
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                <option value="All">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Purchase Status
              </label>
              <select
                value={purchaseFilter}
                onChange={(e) => setPurchaseFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                <option value="All">All Purchase Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredPurchases.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">
                {purchases.length}
              </span>{" "}
              purchases
            </p>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <ShoppingBag size={13} />
              {filteredPurchases.length} Records Found
            </div>
          </div>
        </div>

        {/* Purchase Records */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_3px_15px_rgba(30,64,175,0.04)]">
          <div className="flex flex-col justify-between gap-3 border-b border-blue-50 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
                <PackageCheck size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  All Purchase Records
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Customer-wise Virtual Office subscription details
                </p>
              </div>
            </div>

            <span className="w-fit rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
              {filteredPurchases.length} Total Records
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4">
              <div className="rounded-2xl bg-blue-50 p-4">
                <LoaderCircle
                  size={32}
                  className="animate-spin text-blue-600"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">
                  Loading purchase records
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Please wait while we fetch the latest data...
                </p>
              </div>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
              <div className="rounded-2xl bg-blue-50 p-5">
                <ShoppingBag size={32} className="text-blue-400" />
              </div>

              <h3 className="mt-5 font-bold text-slate-800">
                No purchases found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {purchases.length === 0
                  ? "No Virtual Office purchases are available yet."
                  : "No records match your search. Try changing your search or filters."}
              </p>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left">
                <thead>
                  <tr className="border-b border-blue-100 bg-[#F4F8FF]">
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Plan Details
                    </th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Payment
                    </th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Purchase Status
                    </th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Purchase Date
                    </th>
                    <th className="px-5 py-4 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-blue-50">
                  {filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase._id}
                      className="group transition duration-200 hover:bg-[#F5F9FF]"
                    >
                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-extrabold text-blue-700">
                            {(purchase.customer?.name || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-48 truncate text-sm font-bold text-slate-800">
                              {purchase.customer?.name || "Unknown Customer"}
                            </p>
                            <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                              {purchase.customer?.email || "No email"}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {purchase.customer?.phone || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                            <Building2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-48 truncate text-sm font-bold text-slate-800">
                              {purchase.plan?.planName || "Virtual Office Plan"}
                            </p>
                            <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                              {purchase.plan?.description || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-extrabold text-slate-900">
                          {formatCurrency(
                            purchase.totalAmount,
                            purchase.currency,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          GST:{" "}
                          {formatCurrency(
                            purchase.gstAmount,
                            purchase.currency,
                          )}
                        </p>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4">
                        <StatusBadge status={purchase.paymentStatus} />
                      </td>

                      {/* Purchase Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={purchase.purchaseStatus} />
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                            <CalendarDays size={15} />
                          </div>
                          {formatDate(purchase.purchaseDate)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedPurchase(purchase)}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                        >
                          <Eye size={15} />
                          View Details
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredPurchases.length > 0 && (
            <div className="flex flex-col justify-between gap-2 border-t border-blue-50 bg-[#F8FBFF] px-5 py-3 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-500">
                Displaying{" "}
                <span className="font-bold text-slate-700">
                  {filteredPurchases.length}
                </span>{" "}
                purchase records
              </p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <ShieldCheck size={13} />
                Secure purchase overview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setSelectedPurchase(null)}
        >
          <div
            className="max-h-[94vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 px-5 py-6 sm:px-7">
              <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border-[25px] border-white/5" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    <Receipt size={12} />
                    Purchase Overview
                  </div>

                  <h2 className="text-xl font-extrabold text-white sm:text-2xl">
                    Purchase Details
                  </h2>
                  <p className="mt-1 text-xs text-blue-100 sm:text-sm">
                    Complete Virtual Office purchase information
                  </p>
                </div>

                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="relative rounded-xl border border-white/20 bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                  aria-label="Close purchase details"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative mt-5 flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedPurchase.paymentStatus} />
                <StatusBadge status={selectedPurchase.purchaseStatus} />
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[calc(94vh-190px)] space-y-6 overflow-y-auto bg-[#F5F9FF] p-5 sm:p-7">
              {/* Customer Information */}
              <section>
                <SectionHeading
                  icon={UserRound}
                  title="Customer Information"
                  subtitle="Personal and contact details"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    label="Customer Name"
                    value={selectedPurchase.customer?.name}
                    icon={UserRound}
                  />
                  <DetailItem
                    label="Email Address"
                    value={selectedPurchase.customer?.email}
                    icon={Mail}
                  />
                  <DetailItem
                    label="Phone Number"
                    value={selectedPurchase.customer?.phone}
                    icon={Phone}
                  />
                  <DetailItem
                    label="Customer ID"
                    value={selectedPurchase.customer?._id}
                    icon={Hash}
                  />
                </div>
              </section>

              {/* Plan Information */}
              <section>
                <SectionHeading
                  icon={Building2}
                  title="Plan Information"
                  subtitle="Purchased Virtual Office subscription"
                />

                <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-3.5 text-blue-700">
                      <Building2 size={24} />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-base font-extrabold text-slate-900">
                        {selectedPurchase.plan?.planName ||
                          "Virtual Office Plan"}
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        {selectedPurchase.plan?.description ||
                          "No description available"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Breakdown */}
              <section>
                <SectionHeading
                  icon={CreditCard}
                  title="Payment Breakdown"
                  subtitle="Complete pricing and tax details"
                />

                <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="space-y-4">
                    <PriceRow
                      label="Base Price"
                      value={selectedPurchase.basePrice}
                      currency={selectedPurchase.currency}
                    />

                    <PriceRow
                      label={`GST (${selectedPurchase.gstRate || 0}%)`}
                      value={selectedPurchase.gstAmount}
                      currency={selectedPurchase.currency}
                    />

                    <div className="border-t border-dashed border-blue-200 pt-4">
                      <PriceRow
                        label="Total Amount Paid"
                        value={selectedPurchase.totalAmount}
                        currency={selectedPurchase.currency}
                        bold
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Status Information */}
              <section>
                <SectionHeading
                  icon={ShieldCheck}
                  title="Purchase Status"
                  subtitle="Current payment and subscription status"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-white p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Payment Status
                    </p>
                    <StatusBadge status={selectedPurchase.paymentStatus} />
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-white p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Purchase Status
                    </p>
                    <StatusBadge status={selectedPurchase.purchaseStatus} />
                  </div>
                </div>
              </section>

              {/* Validity */}
              <section>
                <SectionHeading
                  icon={CalendarCheck}
                  title="Purchase Validity"
                  subtitle="Subscription dates and duration"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    label="Purchase Date"
                    value={formatDate(selectedPurchase.purchaseDate)}
                    icon={CalendarDays}
                  />
                  <DetailItem
                    label="Validity"
                    value={
                      selectedPurchase.validityMonths
                        ? `${selectedPurchase.validityMonths} Months`
                        : "11 Months"
                    }
                    icon={Clock3}
                  />
                  <DetailItem
                    label="Start Date"
                    value={formatDate(selectedPurchase.startDate)}
                    icon={CalendarCheck}
                  />
                  <DetailItem
                    label="Expiry Date"
                    value={formatDate(selectedPurchase.expiryDate)}
                    icon={CalendarDays}
                  />
                </div>
              </section>

              {/* Transaction Information */}
              <section>
                <SectionHeading
                  icon={CreditCard}
                  title="Transaction Information"
                  subtitle="Payment gateway and purchase references"
                />

                <div className="space-y-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <DetailItem
                    label="Razorpay Order ID"
                    value={selectedPurchase.razorpayOrderId}
                    icon={Hash}
                  />
                  <DetailItem
                    label="Razorpay Payment ID"
                    value={selectedPurchase.razorpayPaymentId}
                    icon={CreditCard}
                  />
                  <DetailItem
                    label="Purchase ID"
                    value={selectedPurchase._id}
                    icon={Receipt}
                  />
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-blue-100 bg-white p-4 sm:px-7 sm:py-5">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-900/10 transition hover:from-blue-800 hover:to-indigo-800"
              >
                <X size={17} />
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualOfficePurchases;
