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
      return "bg-[#F4EDE5] text-[#8F8175] border-[#E9DED0]";
  }
};

const getPaymentStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "failed":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-[#F4EDE5] text-[#8F8175] border-[#E9DED0]";
  }
};

const STATUS_FILTERS = ["All", "Confirmed", "Pending", "Expired", "Cancelled"];

const PAYMENT_FILTERS = ["All", "Paid", "Pending", "Failed"];

const selectClass =
  "w-full rounded-xl border border-[#E9DED0] bg-[#FBF3ED] px-3.5 py-2.5 text-sm text-[#382B26] outline-none transition focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8F8175]";

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
                : "bg-[#A99A8D]"
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
  <div className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#8F8175]">{title}</p>
        <h3
          className={`mt-2 break-words text-2xl font-bold ${
            valueClass || "text-[#382B26]"
          }`}
        >
          {value}
        </h3>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={22} />
      </div>
    </div>

    <p className="mt-3 text-xs text-[#A99A8D]">{description}</p>
  </div>
);

const DetailItem = ({ icon: Icon, label, children }) => (
  <div className="flex gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
      <Icon size={17} />
    </div>

    <div className="min-w-0 flex-1">
      <p className={labelClass}>{label}</p>
      <div className="break-words text-sm font-medium text-[#382B26]">
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

  useEffect(() => {
    if (!selected) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDetails();
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected, closeDetails]);

  const selectedCustomer = selected ? getCustomer(selected) : null;

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-4 sm:p-5 lg:p-6">
      {/* PAGE HEADER */}

      <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#C9826C] p-5 text-white shadow-lg shadow-[#71392F]/15 sm:p-6">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
              <Users size={17} />
              <span>Oorza Administration</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Visitor Management
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
              Monitor visitor passes, customer invitations, booking information
              and payments from one central dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Ticket size={24} />
            </div>

            <div>
              <p className="text-sm text-white/80">Total visitor passes</p>
              <p className="text-2xl font-bold tabular-nums">
                {loading ? "..." : visitors.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      {!loading && (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            iconClass="bg-[#F8EDE6] text-[#A95643]"
          />

          <SummaryCard
            title="Paid Revenue"
            value={formatCurrency(summary.revenue)}
            description="Total amount received from paid passes"
            icon={Wallet}
            iconClass="bg-[#F8EDE6] text-[#71392F]"
            valueClass="text-[#71392F]"
          />
        </div>
      )}

      {/* FILTERS */}

      <div className="mb-5 overflow-hidden rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
        <div className="border-b border-[#E9DED0] px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
              <Search size={18} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#382B26]">
                Search & Filters
              </h2>
              <p className="text-xs text-[#8F8175]">
                Find visitors using their details or booking status
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="relative lg:col-span-6">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A99A8D]"
              />

              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search visitor, contact, company, customer, visit ID..."
                className="w-full rounded-xl border border-[#E9DED0] bg-[#FBF3ED] py-2.5 pl-10 pr-4 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99A8D] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10"
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E9DED0] px-3 py-2.5 text-sm font-semibold text-[#6F5D52] transition hover:bg-[#FBF3ED]"
                >
                  <X size={15} />
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={fetchVisitors}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#A95643] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#71392F] disabled:cursor-not-allowed disabled:opacity-60"
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
              <span className="text-xs font-medium text-[#8F8175]">
                Active filters:
              </span>

              {search && (
                <span className="rounded-full bg-[#F8EDE6] px-3 py-1 text-xs font-medium text-[#71392F]">
                  Search: {search}
                </span>
              )}

              {statusFilter !== "All" && (
                <span className="rounded-full bg-[#F8EDE6] px-3 py-1 text-xs font-medium text-[#71392F]">
                  Status: {statusFilter}
                </span>
              )}

              {paymentFilter !== "All" && (
                <span className="rounded-full bg-[#F4EDE5] px-3 py-1 text-xs font-medium text-[#6F5D52]">
                  Payment: {paymentFilter}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VISITOR TABLE */}

      <div className="overflow-hidden rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
        {/* TABLE HEADER */}

        <div className="flex flex-col gap-2 border-b border-[#E9DED0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-lg font-bold text-[#382B26]">
              Visitor Records
            </h2>
            <p className="mt-1 text-sm text-[#8F8175]">
              Review visitor passes and invitation details.
            </p>
          </div>

          {!loading && (
            <span className="w-fit rounded-full bg-[#F8EDE6] px-3 py-1.5 text-xs font-semibold text-[#71392F]">
              {filtered.length} Records Found
            </span>
          )}
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoaderCircle size={35} className="animate-spin text-[#A95643]" />
            <p className="mt-4 text-sm font-medium text-[#8F8175]">
              Loading visitor records...
            </p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8EDE6] text-[#A95643]">
              <Users size={30} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-[#382B26]">
              {hasActiveFilters ? "No matching visitors" : "No visitors yet"}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-[#8F8175]">
              {hasActiveFilters
                ? "Try changing your search or filters to find visitor records."
                : "Visitor passes will appear here when customers invite visitors."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-[#F8EDE6] px-4 py-2 text-sm font-semibold text-[#71392F] transition hover:bg-[#F1DED3]"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="bg-[#FBF3ED] text-left">
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
                      className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#8F8175]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E9DED0]">
                {paginated.map((item, index) => {
                  const customer = getCustomer(item);

                  return (
                    <tr
                      key={item._id || item.visitId}
                      className="align-top transition hover:bg-[#FAF6EF]"
                    >
                      {/* NUMBER */}

                      <td className="px-4 py-4 text-sm text-[#A99A8D]">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      {/* VISITOR */}

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                            <UserRound size={19} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-[#382B26]">
                              {item.name || "—"}
                            </p>

                            <p className="mt-1 text-xs text-[#8F8175]">
                              {item.contact || "—"}
                            </p>

                            {item.companyName && (
                              <p className="mt-1 text-xs text-[#A99A8D]">
                                {item.companyName}
                              </p>
                            )}

                            <p className="mt-2 break-all text-xs font-semibold text-[#A95643]">
                              {item.visitId || "—"}
                            </p>

                            <p className="mt-1 text-[11px] text-[#A99A8D]">
                              {formatDateTime(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CUSTOMER */}

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                            <Users size={15} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#382B26]">
                              {customer.name}
                            </p>

                            {customer.email && (
                              <p className="mt-1 max-w-[180px] break-all text-xs text-[#A99A8D]">
                                {customer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* BOOKING */}

                      <td className="min-w-[200px] px-4 py-4">
                        <p className="text-sm font-semibold text-[#382B26]">
                          {item.spaceName || "—"}
                        </p>

                        <p className="mt-1 text-xs text-[#8F8175]">
                          {Array.isArray(item.selectedSpaces) &&
                          item.selectedSpaces.length > 0
                            ? item.selectedSpaces.join(", ")
                            : "No seats listed"}
                        </p>

                        <div className="mt-2 flex items-start gap-1.5 text-xs text-[#A99A8D]">
                          <CalendarDays size={13} className="mt-0.5 shrink-0" />
                          <span>
                            {formatBookingWindow(
                              item.bookingStartAt,
                              item.bookingEndAt,
                            )}
                          </span>
                        </div>

                        {item.bookingId && (
                          <p className="mt-2 break-all text-[11px] text-[#A99A8D]">
                            Booking: {item.bookingId}
                          </p>
                        )}
                      </td>

                      {/* ATTENDEES */}

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8EDE6] px-2.5 py-1.5 text-sm font-semibold text-[#71392F]">
                          <Users size={14} />
                          {item.attendees ?? "—"}
                        </span>
                      </td>

                      {/* AMOUNT */}

                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap text-sm font-bold text-[#382B26]">
                          {formatCurrency(item.totalAmount)}
                        </p>

                        <p className="mt-1 text-xs text-[#A99A8D]">Incl. GST</p>
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
                          className="inline-flex items-center gap-2 rounded-xl border border-[#E9DED0] bg-white px-3.5 py-2 text-xs font-semibold text-[#71392F] transition hover:border-[#A95643] hover:bg-[#A95643] hover:text-white"
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
          <div className="flex flex-col gap-4 border-t border-[#E9DED0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-[#8F8175]">
              Showing{" "}
              <span className="font-semibold text-[#382B26]">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#382B26]">
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#382B26]">
                {filtered.length}
              </span>{" "}
              visitors
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-[#E9DED0] px-3 py-2 text-xs font-semibold text-[#6F5D52] transition hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-40"
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
                      ? "bg-[#A95643] text-white shadow-sm shadow-[#A95643]/20"
                      : "border border-[#E9DED0] text-[#6F5D52] hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-[#E9DED0] px-3 py-2 text-xs font-semibold text-[#6F5D52] transition hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-40"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#382B26]/65 p-2 backdrop-blur-sm sm:p-4"
          onClick={closeDetails}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="visitor-modal-title"
            className="flex max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#FFFDFA] shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#71392F] to-[#A95643] px-4 py-4 text-white sm:px-6 sm:py-5">
              <div className="absolute -right-8 -top-20 h-52 w-52 rounded-full bg-white/10" />
              <div className="absolute -bottom-20 right-40 h-36 w-36 rounded-full bg-white/5" />

              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Users size={22} />
                  </div>

                  <div className="min-w-0">
                    <h2
                      id="visitor-modal-title"
                      className="text-lg font-bold sm:text-xl"
                    >
                      Visitor Details
                    </h2>

                    <p className="mt-1 break-all text-xs text-white/80">
                      Visit ID: {selected.visitId || "—"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close visitor details"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* MODAL CONTENT */}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[#FAF6EF] p-3 sm:p-5">
              {/* STATUS OVERVIEW */}

              <div className="flex flex-col gap-3 rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8F8175]">
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

                <div className="border-t border-[#E9DED0] pt-3 sm:border-0 sm:pt-0 sm:text-right">
                  <p className="text-xs font-medium text-[#8F8175]">
                    Total Amount
                  </p>

                  <p className="mt-1 text-2xl font-bold tabular-nums text-[#71392F]">
                    {formatCurrency(selected.totalAmount)}
                  </p>
                </div>
              </div>

              {/* DETAILS GRID */}

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {/* VISITOR INFORMATION */}

                <section className="min-w-0 rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4">
                  <div className="mb-4 flex items-center gap-3 border-b border-[#E9DED0] pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                      <UserRound size={19} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-[#382B26]">
                        Visitor Information
                      </h3>
                      <p className="text-xs text-[#8F8175]">
                        Personal and contact details
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
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

                <section className="min-w-0 rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4">
                  <div className="mb-4 flex items-center gap-3 border-b border-[#E9DED0] pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                      <UserCheck size={19} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-[#382B26]">
                        Invitation Details
                      </h3>
                      <p className="text-xs text-[#8F8175]">
                        Customer who invited this visitor
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
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

                <section className="min-w-0 rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4">
                  <div className="mb-4 flex items-center gap-3 border-b border-[#E9DED0] pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                      <CalendarDays size={19} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-[#382B26]">
                        Workspace Booking
                      </h3>
                      <p className="text-xs text-[#8F8175]">
                        Space and booking information
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
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

                <section className="min-w-0 rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4">
                  <div className="mb-4 flex items-center gap-3 border-b border-[#E9DED0] pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                      <Receipt size={19} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-[#382B26]">
                        Visitor Fee Breakdown
                      </h3>
                      <p className="text-xs text-[#8F8175]">
                        Payment and tax details
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-[#8F8175]">Hourly Rate</span>
                      <span className="font-semibold text-[#382B26]">
                        {formatCurrency(selected.hourlyRate)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-[#8F8175]">Visit Hours</span>
                      <span className="font-semibold text-[#382B26]">
                        {selected.visitHours ?? "—"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-[#8F8175]">Attendees</span>
                      <span className="font-semibold text-[#382B26]">
                        {selected.attendees ?? "—"}
                      </span>
                    </div>

                    <div className="my-3 border-t border-dashed border-[#E9DED0]" />

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-[#8F8175]">Subtotal</span>
                      <span className="font-semibold text-[#382B26]">
                        {formatCurrency(selected.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-[#8F8175]">GST (18%)</span>
                      <span className="font-semibold text-[#382B26]">
                        {formatCurrency(selected.gstAmount)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#F8EDE6] p-3">
                      <span className="text-sm font-bold text-[#71392F]">
                        Total Amount
                      </span>

                      <span className="text-lg font-bold tabular-nums text-[#A95643]">
                        {formatCurrency(selected.totalAmount)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* RAZORPAY */}

                <section className="min-w-0 rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4">
                  <div className="mb-4 flex items-center gap-3 border-b border-[#E9DED0] pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                      <CreditCard size={19} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-[#382B26]">
                        Payment Gateway
                      </h3>
                      <p className="text-xs text-[#8F8175]">
                        Razorpay transaction references
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
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
                  <section className="min-w-0 rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4 lg:col-span-2">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <AlertCircle size={19} />
                      </div>

                      <div>
                        <h3 className="font-bold text-[#382B26]">
                          Reason for Visit
                        </h3>
                        <p className="text-xs text-[#8F8175]">
                          Visitor's stated purpose
                        </p>
                      </div>
                    </div>

                    <p className="whitespace-pre-line break-words rounded-xl bg-[#FBF3ED] p-3 text-sm leading-6 text-[#6F5D52]">
                      {selected.reason}
                    </p>
                  </section>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#E9DED0] bg-[#FFFDFA] px-4 py-3 sm:px-6 sm:py-4">
              <p className="hidden text-xs text-[#8F8175] sm:block">
                Visitor information · Displayed in IST
              </p>

              <button
                type="button"
                onClick={closeDetails}
                className="ml-auto rounded-xl bg-[#A95643] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#71392F] focus:outline-none focus:ring-4 focus:ring-[#A95643]/20"
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
