import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Users,
  IndianRupee,
  CheckCircle2,
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
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }
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
    Expired: "bg-stone-100 text-stone-600 ring-stone-500/20",
  };

  return styles[status] || "bg-stone-100 text-stone-600 ring-stone-500/20";
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getStatusStyle(
      status,
    )}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status || "Unknown"}
  </span>
);

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="group relative overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#F8EDE6]/80 transition-transform duration-300 group-hover:scale-125" />

    <div className="relative flex items-start justify-between gap-2.5">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#8F8175]">{title}</p>
        <h3 className="mt-2 break-words text-xl font-extrabold tracking-tight text-[#382B26]">
          {value}
        </h3>
        {subtitle && (
          <p className="mt-1.5 text-[11px] font-medium text-[#A3978B]">
            {subtitle}
          </p>
        )}
      </div>

      <div className={`shrink-0 rounded-xl p-2.5 ${color}`}>
        <Icon size={19} strokeWidth={2} />
      </div>
    </div>
  </div>
);

const DetailItem = ({ label, value, icon: Icon }) => (
  <div className="min-w-0 rounded-lg border border-[#E9DED0] bg-[#FFFDFA] p-3">
    <div className="flex items-center gap-2 text-[#A3978B]">
      {Icon && <Icon size={13} />}
      <p className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </p>
    </div>
    <p className="mt-1.5 break-all text-xs font-semibold text-[#382B26]">
      {value || "—"}
    </p>
  </div>
);

const PriceRow = ({ label, value, currency, bold }) => (
  <div className="flex items-center justify-between gap-3">
    <span
      className={`text-xs ${
        bold ? "font-bold text-[#382B26]" : "font-medium text-[#8F8175]"
      }`}
    >
      {label}
    </span>
    <span
      className={`text-xs ${
        bold
          ? "text-base font-extrabold text-[#A95643]"
          : "font-semibold text-[#382B26]"
      }`}
    >
      {formatCurrency(value, currency)}
    </span>
  </div>
);

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-3 flex items-center gap-2.5">
    <div className="rounded-lg bg-[#F8EDE6] p-2 text-[#A95643]">
      <Icon size={16} />
    </div>
    <div>
      <h3 className="text-sm font-bold text-[#382B26]">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-[11px] text-[#8F8175]">{subtitle}</p>
      )}
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
    <div className="min-h-screen bg-[#FAF6EF] p-3 sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1500px] space-y-4">
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#8F4939] p-4 shadow-md shadow-[#71392F]/10 sm:p-5">
          <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[30px] border-white/5" />
          <div className="absolute -bottom-28 right-44 h-56 w-56 rounded-full bg-white/5" />

          <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-[#F8EDE6]">
                <Building2 size={13} />
                Oorza Administration
              </div>

              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Virtual Office Purchases
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-[#F8EDE6] sm:text-sm">
                Track customer subscriptions, monitor transactions and manage
                all Virtual Office purchase records from one place.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[10px] font-medium text-[#F8EDE6]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  Purchase Management
                </span>
                <span className="h-1 w-1 rounded-full bg-[#E9B7A6]" />
                <span className="flex items-center gap-1.5">
                  <Receipt size={13} />
                  Payment Overview
                </span>
              </div>
            </div>

            <button
              onClick={() => fetchPurchases(true)}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/20 bg-[#FFFDFA] px-4 py-2.5 text-xs font-bold text-[#71392F] shadow-sm transition hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh Records"}
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Purchases"
            value={statistics.totalPurchases}
            icon={ShoppingBag}
            color="bg-[#F8EDE6] text-[#A95643]"
            subtitle="All purchase records"
          />

          <StatCard
            title="Total Customers"
            value={statistics.totalCustomers}
            icon={Users}
            color="bg-[#F3EBDD] text-[#98713E]"
            subtitle="Unique purchasing customers"
          />

          <StatCard
            title="Active Plans"
            value={statistics.activePurchases}
            icon={CheckCircle2}
            color="bg-emerald-50 text-emerald-700"
            subtitle="Currently active purchases"
          />

          <StatCard
            title="Total Revenue"
            value={formatCurrency(statistics.totalRevenue)}
            icon={IndianRupee}
            color="bg-[#F8EDE6] text-[#71392F]"
            subtitle="From paid purchases"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-red-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <AlertCircle size={17} />
              </div>
              <p className="text-xs font-semibold text-red-700">{error}</p>
            </div>

            <button
              onClick={() => fetchPurchases()}
              className="rounded-lg bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-[#F8EDE6] p-2 text-[#A95643]">
                <Filter size={17} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#382B26]">
                  Search & Filters
                </h2>
                <p className="mt-0.5 text-[11px] text-[#8F8175]">
                  Find purchases using customer or transaction details
                </p>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#A95643] transition hover:text-[#71392F]"
              >
                <X size={13} />
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3978B]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, email, plan or purchase ID..."
                className="w-full rounded-lg border border-[#E9DED0] bg-[#FBF7F1] py-2.5 pl-10 pr-9 text-xs text-[#382B26] outline-none transition placeholder:text-[#A3978B] focus:border-[#C9826C] focus:bg-white focus:ring-2 focus:ring-[#C9826C]/15"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#A3978B] hover:bg-[#F8EDE6] hover:text-[#71392F]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8F8175]">
                Payment Status
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full rounded-lg border border-[#E9DED0] bg-[#FBF7F1] px-3 py-2.5 text-xs font-medium text-[#382B26] outline-none transition focus:border-[#C9826C] focus:bg-white focus:ring-2 focus:ring-[#C9826C]/15"
              >
                <option value="All">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8F8175]">
                Purchase Status
              </label>
              <select
                value={purchaseFilter}
                onChange={(e) => setPurchaseFilter(e.target.value)}
                className="w-full rounded-lg border border-[#E9DED0] bg-[#FBF7F1] px-3 py-2.5 text-xs font-medium text-[#382B26] outline-none transition focus:border-[#C9826C] focus:bg-white focus:ring-2 focus:ring-[#C9826C]/15"
              >
                <option value="All">All Purchase Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EFE6DC] pt-3">
            <p className="text-[11px] font-medium text-[#8F8175]">
              Showing{" "}
              <span className="font-bold text-[#382B26]">
                {filteredPurchases.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#382B26]">
                {purchases.length}
              </span>{" "}
              purchases
            </p>

            <div className="flex items-center gap-1.5 rounded-lg bg-[#F8EDE6] px-2.5 py-1.5 text-[10px] font-semibold text-[#A95643]">
              <ShoppingBag size={12} />
              {filteredPurchases.length} Records Found
            </div>
          </div>
        </div>

        {/* Purchase Records */}
        <div className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
          <div className="flex flex-col justify-between gap-2.5 border-b border-[#EFE6DC] p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-[#F8EDE6] p-2 text-[#A95643]">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#382B26]">
                  All Purchase Records
                </h2>
                <p className="mt-0.5 text-[11px] text-[#8F8175]">
                  Customer-wise Virtual Office subscription details
                </p>
              </div>
            </div>

            <span className="w-fit rounded-lg border border-[#E9DED0] bg-[#FBF3ED] px-2.5 py-1.5 text-[10px] font-bold text-[#A95643]">
              {filteredPurchases.length} Total Records
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3">
              <div className="rounded-xl bg-[#F8EDE6] p-3">
                <LoaderCircle
                  size={27}
                  className="animate-spin text-[#A95643]"
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#382B26]">
                  Loading purchase records
                </p>
                <p className="mt-1 text-[11px] text-[#A3978B]">
                  Please wait while we fetch the latest data...
                </p>
              </div>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center px-4 text-center">
              <div className="rounded-xl bg-[#F8EDE6] p-4">
                <ShoppingBag size={28} className="text-[#C9826C]" />
              </div>

              <h3 className="mt-3 text-sm font-bold text-[#382B26]">
                No purchases found
              </h3>

              <p className="mt-1 max-w-sm text-xs text-[#8F8175]">
                {purchases.length === 0
                  ? "No Virtual Office purchases are available yet."
                  : "No records match your search. Try changing your search or filters."}
              </p>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 rounded-lg bg-[#A95643] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#71392F]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b border-[#E9DED0] bg-[#FBF3ED]">
                    {[
                      "Customer",
                      "Plan Details",
                      "Amount",
                      "Payment",
                      "Purchase Status",
                      "Purchase Date",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-[#8F8175]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0E7DD]">
                  {filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase._id}
                      className="group transition duration-200 hover:bg-[#FBF7F1]"
                    >
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F8EDE6] to-[#EFD8CC] text-xs font-extrabold text-[#71392F]">
                            {(purchase.customer?.name || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-48 truncate text-xs font-bold text-[#382B26]">
                              {purchase.customer?.name || "Unknown Customer"}
                            </p>
                            <p className="mt-0.5 max-w-48 truncate text-[11px] text-[#8F8175]">
                              {purchase.customer?.email || "No email"}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#A3978B]">
                              {purchase.customer?.phone || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <div className="rounded-lg bg-[#F8EDE6] p-1.5 text-[#A95643]">
                            <Building2 size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-48 truncate text-xs font-bold text-[#382B26]">
                              {purchase.plan?.planName || "Virtual Office Plan"}
                            </p>
                            <p className="mt-0.5 max-w-48 truncate text-[11px] text-[#8F8175]">
                              {purchase.plan?.description || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-extrabold text-[#382B26]">
                          {formatCurrency(
                            purchase.totalAmount,
                            purchase.currency,
                          )}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#8F8175]">
                          GST:{" "}
                          {formatCurrency(
                            purchase.gstAmount,
                            purchase.currency,
                          )}
                        </p>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <StatusBadge status={purchase.paymentStatus} />
                      </td>

                      {/* Purchase Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={purchase.purchaseStatus} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-[#6F6258]">
                          <div className="rounded-lg bg-[#F8EDE6] p-1.5 text-[#A95643]">
                            <CalendarDays size={13} />
                          </div>
                          {formatDate(purchase.purchaseDate)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedPurchase(purchase)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9CFC3] bg-[#F8EDE6] px-2.5 py-2 text-[10px] font-bold text-[#A95643] transition hover:border-[#A95643] hover:bg-[#A95643] hover:text-white"
                        >
                          <Eye size={13} />
                          View Details
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredPurchases.length > 0 && (
            <div className="flex flex-col justify-between gap-2 border-t border-[#EFE6DC] bg-[#FBF7F1] px-4 py-2.5 sm:flex-row sm:items-center">
              <p className="text-[10px] text-[#8F8175]">
                Displaying{" "}
                <span className="font-bold text-[#382B26]">
                  {filteredPurchases.length}
                </span>{" "}
                purchase records
              </p>
              <p className="flex items-center gap-1.5 text-[10px] font-medium text-[#A3978B]">
                <ShieldCheck size={12} />
                Secure purchase overview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#382B26]/65 p-2.5 backdrop-blur-sm sm:p-4"
          onClick={() => setSelectedPurchase(null)}
        >
          <div
            className="max-h-[94vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-[#FFFDFA] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#8F4939] px-4 py-4 sm:px-5">
              <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full border-[22px] border-white/5" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#F8EDE6]">
                    <Receipt size={11} />
                    Purchase Overview
                  </div>

                  <h2 className="text-lg font-extrabold text-white sm:text-xl">
                    Purchase Details
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[#F8EDE6] sm:text-xs">
                    Complete Virtual Office purchase information
                  </p>
                </div>

                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="relative rounded-lg border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
                  aria-label="Close purchase details"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedPurchase.paymentStatus} />
                <StatusBadge status={selectedPurchase.purchaseStatus} />
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[calc(94vh-160px)] space-y-5 overflow-y-auto bg-[#FAF6EF] p-4 sm:p-5">
              {/* Customer Information */}
              <section>
                <SectionHeading
                  icon={UserRound}
                  title="Customer Information"
                  subtitle="Personal and contact details"
                />

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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

                <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-3.5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#F8EDE6] p-3 text-[#A95643]">
                      <Building2 size={21} />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-[#382B26]">
                        {selectedPurchase.plan?.planName ||
                          "Virtual Office Plan"}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#8F8175]">
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

                <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm">
                  <div className="space-y-3">
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

                    <div className="border-t border-dashed border-[#E9DED0] pt-3">
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

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#A3978B]">
                      Payment Status
                    </p>
                    <StatusBadge status={selectedPurchase.paymentStatus} />
                  </div>

                  <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#A3978B]">
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

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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

                <div className="space-y-2 rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-3 shadow-sm">
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
            <div className="border-t border-[#E9DED0] bg-[#FFFDFA] p-3.5 sm:px-5">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#A95643] to-[#71392F] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-[#71392F] hover:to-[#5D2D25]"
              >
                <X size={15} />
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