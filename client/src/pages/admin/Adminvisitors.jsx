import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Users,
  UserCheck,
  Clock3,
  IndianRupee,
  Search,
  RefreshCw,
  X,
  Eye,
  CalendarDays,
  Building2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Hash,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CalendarClock,
  Receipt,
  ShieldCheck,
  LoaderCircle,
  UserRound,
  Ticket,
  Wallet,
} from "lucide-react";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/axios.js";

const ITEMS_PER_PAGE = 10;

// Bookings and visits are in IST, so always display in IST.
const TIME_ZONE = "Asia/Kolkata";

// Must match the 10 minute pending window used by the backend.
const PENDING_EXPIRY_MS = 10 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

/* ---------- formatting helpers ---------- */

const formatDate = (date, timeZone = TIME_ZONE) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-IN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatClock = (date) =>
  new Date(date)
    .toLocaleTimeString("en-IN", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

/* ---------- visit helpers ---------- */

// Bookings saved before the IST update were stored at UTC midnight.
const isLegacyMidnight = (date) => {
  const parsed = new Date(date);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCHours() === 0 &&
    parsed.getUTCMinutes() === 0 &&
    parsed.getUTCSeconds() === 0 &&
    parsed.getUTCMilliseconds() === 0
  );
};

// Hourly bookings span less than a day: show date and time range.
// Daily/monthly bookings end at the midnight after the last booked day,
// so subtract 1 ms to show the last day the visitor can come.
const formatBookingWindow = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "—";
  }

  const legacy = isLegacyMidnight(startDate);

  if (!legacy && endDate.getTime() - startDate.getTime() < DAY_MS) {
    return `${formatDate(startDate)}, ${formatClock(
      startDate,
    )} - ${formatClock(endDate)}`;
  }

  const zone = legacy ? "UTC" : TIME_ZONE;
  const first = formatDate(startDate, zone);
  const last = formatDate(new Date(endDate.getTime() - 1), zone);

  return first === last ? first : `${first} - ${last}`;
};

// An unpaid Pending pass older than the pending window is dead.
const getDisplayStatus = (visitor) => {
  const status = visitor.status || "Unknown";

  if (
    status === "Pending" &&
    visitor.paymentStatus !== "Paid" &&
    visitor.createdAt
  ) {
    const age = Date.now() - new Date(visitor.createdAt).getTime();

    if (age > PENDING_EXPIRY_MS) return "Expired";
  }

  return status;
};

// The customer who invited the visitor.
const getCustomer = (visitor) => {
  const user = visitor.user;

  if (user && typeof user === "object") {
    return {
      name: user.name || "Unnamed customer",
      email: user.email || "",
      phone: user.phone || "",
    };
  }

  return { name: "Deleted user", email: "", phone: "" };
};

/* ---------- status styles ---------- */

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "cancelled":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "expired":
      return "bg-orange-50 text-orange-700 border-orange-100";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const getPaymentStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "failed":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const STATUS_FILTERS = ["All", "Confirmed", "Pending", "Expired", "Cancelled"];

const PAYMENT_FILTERS = ["All", "Paid", "Pending", "Failed"];

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500";

/* ---------- reusable components ---------- */

const StatusBadge = ({ status, payment = false }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
      payment ? getPaymentStyle(status) : getStatusStyle(status)
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        status?.toLowerCase() === "confirmed" ||
        status?.toLowerCase() === "paid"
          ? "bg-emerald-500"
          : status?.toLowerCase() === "pending"
            ? "bg-amber-500"
            : status?.toLowerCase() === "expired" ||
                status?.toLowerCase() === "failed"
              ? "bg-orange-500"
              : status?.toLowerCase() === "cancelled"
                ? "bg-rose-500"
                : "bg-slate-400"
      }`}
    />
    {status || "Unknown"}
  </span>
);

const SummaryCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  valueClass,
}) => (
  <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3
          className={`mt-2 text-2xl font-bold ${valueClass || "text-slate-800"}`}
        >
          {value}
        </h3>
      </div>

      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={23} />
      </div>
    </div>

    <p className="mt-3 text-xs text-slate-400">{description}</p>
  </div>
);

const DetailItem = ({ icon: Icon, label, children }) => (
  <div className="flex gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      <Icon size={17} />
    </div>

    <div className="min-w-0 flex-1">
      <p className={labelClass}>{label}</p>
      <div className="break-words text-sm font-medium text-slate-700">
        {children || "—"}
      </div>
    </div>
  </div>
);

/* ---------- component ---------- */

const AdminVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [selected, setSelected] = useState(null);

  /*
   * Fetch all visitors.
   */
  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/visitor/all_visitors");

      if (response.data?.success) {
        setVisitors(response.data.visitors || []);
      } else {
        toast.error(response.data?.message || "Failed to load visitors");
      }
    } catch (error) {
      console.error("Fetch visitors error:", error);

      toast.error(error.response?.data?.message || "Failed to load visitors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Attach display status once so filters, counts and rows agree.
  const rows = useMemo(
    () =>
      visitors.map((visitor) => ({
        ...visitor,
        displayStatus: getDisplayStatus(visitor),
      })),
    [visitors],
  );

  /*
   * Summary numbers.
   */
  const summary = useMemo(() => {
    const confirmed = rows.filter((item) => item.displayStatus === "Confirmed");

    return {
      confirmed: confirmed.length,
      pending: rows.filter((item) => item.displayStatus === "Pending").length,
      attendees: confirmed.reduce(
        (sum, item) => sum + (Number(item.attendees) || 0),
        0,
      ),
      revenue: rows
        .filter((item) => item.paymentStatus === "Paid")
        .reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0),
    };
  }, [rows]);

  /*
   * Filter + search.
   */
  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();

    return rows.filter((item) => {
      if (statusFilter !== "All" && item.displayStatus !== statusFilter) {
        return false;
      }

      if (paymentFilter !== "All" && item.paymentStatus !== paymentFilter) {
        return false;
      }

      if (!value) return true;

      const customer = getCustomer(item);

      return [
        item.visitId,
        item.bookingId,
        item.name,
        item.contact,
        item.email,
        item.companyName,
        item.spaceName,
        customer.name,
        customer.email,
        customer.phone,
      ].some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(value),
      );
    });
  }, [rows, search, statusFilter, paymentFilter]);

  /*
   * Pagination.
   */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
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

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  /*
   * Filter handlers.
   */
  const handleSearch = useCallback((event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback(
    (setter) => (event) => {
      setter(event.target.value);
      setCurrentPage(1);
    },
    [],
  );

  const hasActiveFilters =
    search || statusFilter !== "All" || paymentFilter !== "All";

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("All");
    setPaymentFilter("All");
    setCurrentPage(1);
  }, []);

  /*
   * Modal.
   */
  const closeDetails = useCallback(() => setSelected(null), []);

  const selectedCustomer = selected ? getCustomer(selected) : null;

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      {/* PAGE HEADER */}

      <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-200 sm:p-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-100">
              <Users size={17} />
              <span>Oorza Administration</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Visitor Management
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Monitor visitor passes, customer invitations, booking information
              and payments from one central dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Ticket size={25} />
            </div>

            <div>
              <p className="text-sm text-blue-100">Total visitor passes</p>
              <p className="text-2xl font-bold tabular-nums">
                {loading ? "..." : visitors.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      {!loading && (
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Confirmed Passes"
            value={summary.confirmed}
            description="Successfully confirmed visitor passes"
            icon={UserCheck}
            iconClass="bg-emerald-50 text-emerald-600"
            valueClass="text-emerald-600"
          />

          <SummaryCard
            title="Pending Passes"
            value={summary.pending}
            description="Awaiting payment or confirmation"
            icon={Clock3}
            iconClass="bg-amber-50 text-amber-600"
            valueClass="text-amber-600"
          />

          <SummaryCard
            title="Confirmed Attendees"
            value={summary.attendees}
            description="Total attendees across confirmed passes"
            icon={Users}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Paid Revenue"
            value={formatCurrency(summary.revenue)}
            description="Total amount received from paid passes"
            icon={Wallet}
            iconClass="bg-indigo-50 text-indigo-600"
            valueClass="text-indigo-600"
          />
        </div>
      )}

      {/* FILTERS */}

      <div className="mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Search size={19} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800">
                Search & Filters
              </h2>
              <p className="text-xs text-slate-400">
                Find visitors using their details or booking status
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="relative lg:col-span-6">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search visitor, contact, company, customer, visit ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="lg:col-span-2">
              <select
                value={statusFilter}
                onChange={handleFilter(setStatusFilter)}
                className={selectClass}
                aria-label="Filter by status"
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "All statuses" : option}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={paymentFilter}
                onChange={handleFilter(setPaymentFilter)}
                className={selectClass}
                aria-label="Filter by payment"
              >
                {PAYMENT_FILTERS.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "All payments" : option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 lg:col-span-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <X size={15} />
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={fetchVisitors}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400">
                Active filters:
              </span>

              {search && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Search: {search}
                </span>
              )}

              {statusFilter !== "All" && (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  Status: {statusFilter}
                </span>
              )}

              {paymentFilter !== "All" && (
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                  Payment: {paymentFilter}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VISITOR TABLE */}

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        {/* TABLE HEADER */}

        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Visitor Records
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review visitor passes and invitation details.
            </p>
          </div>

          {!loading && (
            <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {filtered.length} Records Found
            </span>
          )}
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoaderCircle size={35} className="animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading visitor records...
            </p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
              <Users size={30} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              {hasActiveFilters ? "No matching visitors" : "No visitors yet"}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasActiveFilters
                ? "Try changing your search or filters to find visitor records."
                : "Visitor passes will appear here when customers invite visitors."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="bg-[#F4F8FF] text-left">
                  {[
                    "#",
                    "Visitor Details",
                    "Invited By",
                    "Booking Details",
                    "Attendees",
                    "Amount",
                    "Visit Status",
                    "Payment",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginated.map((item, index) => {
                  const customer = getCustomer(item);

                  return (
                    <tr
                      key={item._id || item.visitId}
                      className="align-top transition hover:bg-blue-50/40"
                    >
                      {/* NUMBER */}

                      <td className="px-4 py-4 text-sm text-slate-400">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      {/* VISITOR */}

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <UserRound size={19} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {item.name || "—"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.contact || "—"}
                            </p>

                            {item.companyName && (
                              <p className="mt-1 text-xs text-slate-400">
                                {item.companyName}
                              </p>
                            )}

                            <p className="mt-2 break-all text-xs font-semibold text-blue-600">
                              {item.visitId || "—"}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              {formatDateTime(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CUSTOMER */}

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <Users size={15} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700">
                              {customer.name}
                            </p>

                            {customer.email && (
                              <p className="mt-1 max-w-[180px] break-all text-xs text-slate-400">
                                {customer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* BOOKING */}

                      <td className="min-w-[200px] px-4 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {item.spaceName || "—"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {Array.isArray(item.selectedSpaces) &&
                          item.selectedSpaces.length > 0
                            ? item.selectedSpaces.join(", ")
                            : "No seats listed"}
                        </p>

                        <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
                          <CalendarDays size={13} className="mt-0.5 shrink-0" />
                          <span>
                            {formatBookingWindow(
                              item.bookingStartAt,
                              item.bookingEndAt,
                            )}
                          </span>
                        </div>

                        {item.bookingId && (
                          <p className="mt-2 break-all text-[11px] text-slate-400">
                            Booking: {item.bookingId}
                          </p>
                        )}
                      </td>

                      {/* ATTENDEES */}

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-sm font-semibold text-blue-700">
                          <Users size={14} />
                          {item.attendees ?? "—"}
                        </span>
                      </td>

                      {/* AMOUNT */}

                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap text-sm font-bold text-slate-800">
                          {formatCurrency(item.totalAmount)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">Incl. GST</p>
                      </td>

                      {/* VISIT STATUS */}

                      <td className="px-4 py-4">
                        <StatusBadge status={item.displayStatus} />
                      </td>

                      {/* PAYMENT */}

                      <td className="px-4 py-4">
                        <StatusBadge
                          status={item.paymentStatus || "Unknown"}
                          payment
                        />
                      </td>

                      {/* ACTION */}

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                        >
                          <Eye size={15} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {filtered.length}
              </span>{" "}
              visitors
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`h-9 min-w-9 rounded-lg px-3 text-xs font-semibold transition ${
                    currentPage === page
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VISITOR DETAILS MODAL */}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onClick={closeDetails}
        >
          <div
            className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-5 text-white sm:px-7">
              <div className="absolute -right-8 -top-20 h-52 w-52 rounded-full bg-white/10" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Users size={23} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold sm:text-xl">
                      Visitor Details
                    </h2>

                    <p className="mt-1 break-all text-xs text-blue-100">
                      Visit ID: {selected.visitId || "—"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* MODAL CONTENT */}

            <div className="flex-1 space-y-5 overflow-y-auto bg-[#F7FAFF] p-4 sm:p-6">
              {/* STATUS OVERVIEW */}

              <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Visitor Pass Status
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={selected.displayStatus} />
                    <StatusBadge
                      status={selected.paymentStatus || "Unknown"}
                      payment
                    />
                  </div>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs font-medium text-slate-400">
                    Total Amount
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-700">
                    {formatCurrency(selected.totalAmount)}
                  </p>
                </div>
              </div>

              {/* DETAILS GRID */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* VISITOR INFORMATION */}

                <section className="rounded-2xl border border-blue-100 bg-white p-5">
                  <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <UserRound size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        Visitor Information
                      </h3>
                      <p className="text-xs text-slate-400">
                        Personal and contact details
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <DetailItem icon={UserRound} label="Visitor Name">
                      {selected.name || "—"}
                    </DetailItem>

                    <DetailItem icon={Phone} label="Contact Number">
                      {selected.contact || "—"}
                    </DetailItem>

                    <DetailItem icon={Mail} label="Email Address">
                      {selected.email || "—"}
                    </DetailItem>

                    <DetailItem icon={Building2} label="Company">
                      {selected.companyName || "—"}
                    </DetailItem>

                    <DetailItem icon={Users} label="Attendees">
                      {selected.attendees ?? "—"}
                    </DetailItem>
                  </div>
                </section>

                {/* INVITATION INFORMATION */}

                <section className="rounded-2xl border border-blue-100 bg-white p-5">
                  <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <UserCheck size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        Invitation Details
                      </h3>
                      <p className="text-xs text-slate-400">
                        Customer who invited this visitor
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <DetailItem icon={UserRound} label="Invited By">
                      {selectedCustomer.name}
                    </DetailItem>

                    <DetailItem icon={Mail} label="Customer Email">
                      {selectedCustomer.email || "—"}
                    </DetailItem>

                    <DetailItem icon={Phone} label="Customer Phone">
                      {selectedCustomer.phone || "—"}
                    </DetailItem>

                    <DetailItem icon={CalendarClock} label="Invitation Date">
                      {formatDateTime(selected.createdAt)}
                    </DetailItem>
                  </div>
                </section>

                {/* BOOKING INFORMATION */}

                <section className="rounded-2xl border border-blue-100 bg-white p-5">
                  <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                      <CalendarDays size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        Workspace Booking
                      </h3>
                      <p className="text-xs text-slate-400">
                        Space and booking information
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <DetailItem icon={Building2} label="Workspace">
                      {selected.spaceName || "—"}
                    </DetailItem>

                    <DetailItem icon={MapPin} label="Selected Seats">
                      {Array.isArray(selected.selectedSpaces) &&
                      selected.selectedSpaces.length > 0
                        ? selected.selectedSpaces.join(", ")
                        : "—"}
                    </DetailItem>

                    <DetailItem icon={CalendarClock} label="Booking Period">
                      {formatBookingWindow(
                        selected.bookingStartAt,
                        selected.bookingEndAt,
                      )}
                    </DetailItem>

                    <DetailItem icon={Hash} label="Booking ID">
                      {selected.bookingId || "—"}
                    </DetailItem>
                  </div>
                </section>

                {/* VISITOR FEE */}

                <section className="rounded-2xl border border-blue-100 bg-white p-5">
                  <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Receipt size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        Visitor Fee Breakdown
                      </h3>
                      <p className="text-xs text-slate-400">
                        Payment and tax details
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-500">Hourly Rate</span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(selected.hourlyRate)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-500">Visit Hours</span>
                      <span className="font-semibold text-slate-700">
                        {selected.visitHours ?? "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-500">Attendees</span>
                      <span className="font-semibold text-slate-700">
                        {selected.attendees ?? "—"}
                      </span>
                    </div>

                    <div className="my-3 border-t border-dashed border-slate-200" />

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(selected.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-slate-500">GST (18%)</span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(selected.gstAmount)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 p-3">
                      <span className="text-sm font-bold text-blue-800">
                        Total Amount
                      </span>
                      <span className="text-lg font-bold text-blue-700">
                        {formatCurrency(selected.totalAmount)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* RAZORPAY */}

                <section className="rounded-2xl border border-blue-100 bg-white p-5">
                  <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <CreditCard size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        Payment Gateway
                      </h3>
                      <p className="text-xs text-slate-400">
                        Razorpay transaction references
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <DetailItem icon={Hash} label="Razorpay Order ID">
                      {selected.razorpayOrderId || "—"}
                    </DetailItem>

                    <DetailItem icon={CreditCard} label="Razorpay Payment ID">
                      {selected.razorpayPaymentId || "—"}
                    </DetailItem>

                    <DetailItem icon={ShieldCheck} label="Payment Status">
                      <StatusBadge
                        status={selected.paymentStatus || "Unknown"}
                        payment
                      />
                    </DetailItem>
                  </div>
                </section>

                {/* REASON */}

                {selected.reason && (
                  <section className="rounded-2xl border border-blue-100 bg-white p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <AlertCircle size={19} />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          Reason for Visit
                        </h3>
                        <p className="text-xs text-slate-400">
                          Visitor's stated purpose
                        </p>
                      </div>
                    </div>

                    <p className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      {selected.reason}
                    </p>
                  </section>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
              <p className="hidden text-xs text-slate-400 sm:block">
                Visitor information · Displayed in IST
              </p>

              <button
                type="button"
                onClick={closeDetails}
                className="ml-auto rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVisitors;
