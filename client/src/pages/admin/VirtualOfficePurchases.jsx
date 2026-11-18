import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Users,
  IndianRupee,
  CheckCircle2,
  Clock3,
  XCircle,
  CalendarDays,
  CreditCard,
  Eye,
  AlertCircle,
  LoaderCircle,
  Filter,
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
    Paid: "bg-green-100 text-green-700",
    Pending: "bg-amber-100 text-amber-700",
    Failed: "bg-red-100 text-red-700",
    Active: "bg-green-100 text-green-700",
    Expired: "bg-slate-200 text-slate-700",
  };

  return styles[status] || "bg-slate-100 text-slate-600";
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
      status,
    )}`}
  >
    {status || "Unknown"}
  </span>
);

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={23} />
      </div>
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
                <ShoppingBag size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Virtual Office Purchases
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage and monitor purchases from all customers.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchPurchases(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Purchases"
            value={statistics.totalPurchases}
            icon={ShoppingBag}
            color="bg-indigo-100 text-indigo-600"
            subtitle="All purchase records"
          />

          <StatCard
            title="Total Customers"
            value={statistics.totalCustomers}
            icon={Users}
            color="bg-blue-100 text-blue-600"
            subtitle="Unique purchasing customers"
          />

          <StatCard
            title="Active Plans"
            value={statistics.activePurchases}
            icon={CheckCircle2}
            color="bg-green-100 text-green-600"
            subtitle="Currently active purchases"
          />

          <StatCard
            title="Total Revenue"
            value={formatCurrency(statistics.totalRevenue)}
            icon={IndianRupee}
            color="bg-emerald-100 text-emerald-600"
            subtitle="From paid purchases"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={19} />
              <p className="text-sm font-medium">{error}</p>
            </div>

            <button
              onClick={() => fetchPurchases()}
              className="text-sm font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-slate-800">Search & Filters</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, email, plan or purchase ID..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>

            <select
              value={purchaseFilter}
              onChange={(e) => setPurchaseFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
            >
              <option value="All">All Purchase Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Showing {filteredPurchases.length} of {purchases.length} purchases
            </p>

            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">All Purchase Records</h2>
              <p className="mt-1 text-xs text-slate-500">
                Customer-wise Virtual Office subscription details
              </p>
            </div>

            <span className="w-fit rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              {filteredPurchases.length} Records
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <LoaderCircle
                size={35}
                className="animate-spin text-indigo-600"
              />
              <p className="text-sm text-slate-500">
                Loading purchase records...
              </p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <ShoppingBag size={30} className="text-slate-400" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No purchases found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {purchases.length === 0
                  ? "No Virtual Office purchases are available yet."
                  : "Try changing your search or filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Plan Details</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Purchase Status</th>
                    <th className="px-5 py-4">Purchase Date</th>
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase._id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {purchase.customer?.name || "Unknown Customer"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {purchase.customer?.email || "No email"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {purchase.customer?.phone || ""}
                        </p>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {purchase.plan?.planName || "Virtual Office Plan"}
                        </p>

                        <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                          {purchase.plan?.description || "—"}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
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
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CalendarDays size={15} className="text-slate-400" />
                          {formatDate(purchase.purchaseDate)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedPurchase(purchase)}
                          className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Purchase Details Modal */}
        {selectedPurchase && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            onClick={() => setSelectedPurchase(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Purchase Details
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Complete Virtual Office purchase information
                  </p>
                </div>

                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <XCircle size={22} />
                </button>
              </div>

              <div className="space-y-5 p-5">
                {/* Customer */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    Customer Information
                  </h3>

                  <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                    <DetailItem
                      label="Customer Name"
                      value={selectedPurchase.customer?.name}
                    />
                    <DetailItem
                      label="Email Address"
                      value={selectedPurchase.customer?.email}
                    />
                    <DetailItem
                      label="Phone Number"
                      value={selectedPurchase.customer?.phone}
                    />
                    <DetailItem
                      label="Customer ID"
                      value={selectedPurchase.customer?._id}
                    />
                  </div>
                </div>

                {/* Plan */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    Plan Information
                  </h3>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="font-bold text-indigo-700">
                      {selectedPurchase.plan?.planName}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {selectedPurchase.plan?.description || "No description"}
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    Payment Breakdown
                  </h3>

                  <div className="space-y-3 rounded-xl bg-slate-50 p-4">
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

                    <div className="border-t border-slate-200 pt-3">
                      <PriceRow
                        label="Total Amount"
                        value={selectedPurchase.totalAmount}
                        currency={selectedPurchase.currency}
                        bold
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    Purchase Status
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    <div>
                      <p className="mb-2 text-xs text-slate-500">
                        Payment Status
                      </p>
                      <StatusBadge status={selectedPurchase.paymentStatus} />
                    </div>

                    <div>
                      <p className="mb-2 text-xs text-slate-500">
                        Purchase Status
                      </p>
                      <StatusBadge status={selectedPurchase.purchaseStatus} />
                    </div>
                  </div>
                </div>

                {/* Validity */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    Purchase Validity
                  </h3>

                  <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                    <DetailItem
                      label="Purchase Date"
                      value={formatDate(selectedPurchase.purchaseDate)}
                    />
                    <DetailItem
                      label="Validity"
                      value={
                        selectedPurchase.validityMonths
                          ? `${selectedPurchase.validityMonths} Months`
                          : "11 Months"
                      }
                    />
                    <DetailItem
                      label="Start Date"
                      value={formatDate(selectedPurchase.startDate)}
                    />
                    <DetailItem
                      label="Expiry Date"
                      value={formatDate(selectedPurchase.expiryDate)}
                    />
                  </div>
                </div>

                {/* Razorpay */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    Transaction Information
                  </h3>

                  <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                    <DetailItem
                      label="Razorpay Order ID"
                      value={selectedPurchase.razorpayOrderId}
                    />
                    <DetailItem
                      label="Razorpay Payment ID"
                      value={selectedPurchase.razorpayPaymentId}
                    />
                    <DetailItem
                      label="Purchase ID"
                      value={selectedPurchase._id}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 p-5">
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 break-all text-sm font-medium text-slate-800">
      {value || "—"}
    </p>
  </div>
);

const PriceRow = ({ label, value, currency, bold }) => (
  <div className="flex items-center justify-between gap-3">
    <span
      className={`text-sm ${bold ? "font-bold text-slate-900" : "text-slate-600"}`}
    >
      {label}
    </span>
    <span
      className={`text-sm ${bold ? "font-bold text-indigo-700" : "font-medium text-slate-800"}`}
    >
      {formatCurrency(value, currency)}
    </span>
  </div>
);

export default VirtualOfficePurchases;
