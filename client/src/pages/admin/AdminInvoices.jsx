import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Receipt,
  Building2,
  Users,
  IndianRupee,
  Search,
  RefreshCw,
  Filter,
  X,
  Eye,
  CalendarDays,
  Hash,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Wallet,
  TrendingUp,
  Loader2,
  FileSearch,
} from "lucide-react";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios.js";

const ITEMS_PER_PAGE = 10;
const TIME_ZONE = "Asia/Kolkata";

const TYPE_FILTERS = ["All", "customer", "business"];

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const AdminInvoices = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/invoice/all");

      if (response.data?.success) {
        setInvoices(response.data.invoices || []);
      } else {
        toast.error(response.data?.message || "Failed to load invoices");
      }
    } catch (error) {
      console.error("Fetch invoices error:", error);

      toast.error(error.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();

    return invoices.filter((item) => {
      if (typeFilter !== "All" && item.invoiceType !== typeFilter) {
        return false;
      }

      if (!value) return true;

      return [
        item.invoiceNumber,
        item.bookingId,
        item.buyer?.name,
        item.buyer?.businessName,
        item.buyer?.gstin,
        item.user?.email,
      ].some((field) => field?.toLowerCase().includes(value));
    });
  }, [invoices, search, typeFilter]);

  const summary = useMemo(() => {
    let business = 0;
    let customer = 0;
    let total = 0;

    invoices.forEach((item) => {
      if (item.invoiceType === "business") business += 1;
      else customer += 1;

      total += Number(item.totalAmount) || 0;
    });

    return { business, customer, total };
  }, [invoices]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const goToPage = useCallback(
    (page) => {
      if (page < 1 || page > totalPages) return;

      setCurrentPage(page);
    },
    [totalPages],
  );

  const hasActiveFilters = search || typeFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("All");
    setCurrentPage(1);
  };

  const summaryCards = [
    {
      label: "Total Invoices",
      value: invoices.length,
      description: "All generated invoices",
      icon: Receipt,
      iconStyle: "bg-blue-100 text-blue-600",
      accent: "text-blue-600",
    },
    {
      label: "Customer Invoices",
      value: summary.customer,
      description: "Individual customer billing",
      icon: Users,
      iconStyle: "bg-indigo-100 text-indigo-600",
      accent: "text-indigo-600",
    },
    {
      label: "Business Invoices",
      value: summary.business,
      description: "Business customer billing",
      icon: Building2,
      iconStyle: "bg-violet-100 text-violet-600",
      accent: "text-violet-600",
    },
    {
      label: "Total Invoiced",
      value: formatCurrency(summary.total),
      description: "Combined invoice amount",
      icon: Wallet,
      iconStyle: "bg-emerald-100 text-emerald-600",
      accent: "text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-blue-200/60 sm:p-8">
          <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full border-[40px] border-white/10" />
          <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-50">
                <Sparkles size={14} />
                OORZA ADMINISTRATION
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Invoice Management
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Monitor customer and business invoices, track billing amounts,
                and access generated booking invoices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-xs font-medium text-blue-100">
                  Total Invoices
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {invoices.length}
                </p>
              </div>

              <button
                type="button"
                onClick={fetchInvoices}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        {!loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="group rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {card.label}
                      </p>
                      <p
                        className={`mt-3 text-2xl font-bold tracking-tight ${card.accent}`}
                      >
                        {card.value}
                      </p>
                    </div>

                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.iconStyle}`}
                    >
                      <Icon size={23} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-blue-50 pt-3">
                    <TrendingUp size={14} className="text-slate-400" />
                    <p className="text-xs text-slate-400">{card.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SEARCH AND FILTERS */}
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Filter size={19} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Search & Filters</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Find invoices using billing details
                </p>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search invoice no, booking ID, customer, business or GSTIN..."
                className="w-full rounded-xl border border-blue-100 bg-[#F8FBFF] py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by invoice type"
                className="w-full appearance-none rounded-xl border border-blue-100 bg-[#F8FBFF] px-4 py-3 pr-10 text-sm font-medium capitalize text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
              >
                {TYPE_FILTERS.map((option) => (
                  <option key={option} value={option}>
                    {option === "All"
                      ? "All invoice types"
                      : `${option} invoice`}
                  </option>
                ))}
              </select>
              <Filter
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={fetchInvoices}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-blue-50 pt-4">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {filtered.length}
              </span>{" "}
              matching invoices
            </p>

            <div className="flex items-center gap-2">
              {typeFilter !== "All" && (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold capitalize text-indigo-700">
                  {typeFilter}
                </span>
              )}
              {search && (
                <span className="max-w-[180px] truncate rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                  Search: {search}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* INVOICE TABLE */}
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-50 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText size={21} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Generated Invoices</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Invoices for confirmed and paid bookings
                </p>
              </div>
            </div>

            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              {filtered.length} Records
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading invoices...
              </p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                <FileSearch size={30} />
              </div>

              <h3 className="mt-5 font-bold text-slate-800">
                {hasActiveFilters ? "No matching invoices" : "No invoices yet"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? "No invoices match your search or selected filters. Try changing your search criteria."
                  : "Invoices will appear here once a booking is confirmed and payment is completed."}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <X size={15} />
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#F3F8FF]">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">#</th>
                      <th className="px-5 py-4">Invoice Details</th>
                      <th className="px-5 py-4">Billed To</th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4">Booking ID</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-blue-50">
                    {paginated.map((item, index) => {
                      const isBusiness = item.invoiceType === "business";

                      return (
                        <tr
                          key={item._id}
                          className="align-middle transition hover:bg-[#F8FBFF]"
                        >
                          <td className="px-5 py-4 text-sm font-medium text-slate-400">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Receipt size={19} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-blue-700">
                                  {item.invoiceNumber}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-400">
                                  Invoice Number
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[190px] truncate text-sm font-semibold text-slate-800">
                              {isBusiness
                                ? item.buyer?.businessName
                                : item.buyer?.name}
                            </p>
                            <p className="mt-1 max-w-[190px] truncate text-xs text-slate-500">
                              {isBusiness
                                ? `GSTIN: ${item.buyer?.gstin || "—"}`
                                : item.user?.email || item.buyer?.email || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                isBusiness
                                  ? "bg-violet-50 text-violet-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {isBusiness ? (
                                <Building2 size={13} />
                              ) : (
                                <Users size={13} />
                              )}
                              {isBusiness ? "Business" : "Customer"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="block max-w-[130px] truncate font-mono text-xs text-slate-500">
                              {item.bookingId || "—"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <CalendarDays
                                size={14}
                                className="text-slate-400"
                              />
                              {formatDate(item.issuedAt)}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="text-sm font-bold text-slate-800">
                              {formatCurrency(item.totalAmount)}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/invoices/${item._id}`)
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                            >
                              <Eye size={14} />
                              View
                              <ArrowUpRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE AND TABLET CARDS */}
              <div className="grid gap-3 p-4 lg:hidden sm:grid-cols-2">
                {paginated.map((item, index) => {
                  const isBusiness = item.invoiceType === "business";

                  return (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-blue-100 bg-[#F9FBFF] p-4 transition hover:border-blue-200 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <Receipt size={19} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-blue-700">
                              {item.invoiceNumber}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              #{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            isBusiness
                              ? "bg-violet-100 text-violet-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isBusiness ? "Business" : "Customer"}
                        </span>
                      </div>

                      <div className="mt-4 border-t border-blue-100 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Billed To
                        </p>
                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {isBusiness
                            ? item.buyer?.businessName
                            : item.buyer?.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {isBusiness
                            ? `GSTIN: ${item.buyer?.gstin || "—"}`
                            : item.user?.email || item.buyer?.email || "—"}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Invoice Date
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <CalendarDays size={13} className="text-blue-500" />
                            {formatDate(item.issuedAt)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total Amount
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {formatCurrency(item.totalAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-blue-100 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Booking ID
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-slate-600">
                          {item.bookingId || "—"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/admin/invoices/${item._id}`)}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                      >
                        <Eye size={15} />
                        View Invoice
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* PAGINATION */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-blue-50 bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:px-6">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-700">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-700">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-700">
                  {filtered.length}
                </span>{" "}
                invoices
              </p>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-xs font-bold transition ${
                        currentPage === page
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                          : "border-blue-100 bg-white text-slate-600 hover:bg-blue-50"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
          <IndianRupee size={13} />
          Oorza Invoice Administration
        </div>
      </div>
    </div>
  );
};

export default AdminInvoices;
