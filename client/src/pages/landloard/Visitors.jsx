
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  Wallet,
  XCircle,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";

const INVITE_ROUTE = "/customer/invite-visitor";
const TIME_ZONE = "Asia/Kolkata";
const PENDING_EXPIRY_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_FILTERS = [
  { id: "all", label: "All Visitors" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Pending" },
  { id: "inactive", label: "Cancelled / Expired" },
];

// ---------------------------------------------
// Helpers
// ---------------------------------------------

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

const formatClock = (date) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed
    .toLocaleTimeString("en-IN", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

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

const formatBookingWindow = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return "—";
  }

  const legacy = isLegacyMidnight(startDate);

  if (!legacy && endDate.getTime() - startDate.getTime() < DAY_MS) {
    return `${formatDate(startDate)}, ${formatClock(
      startDate
    )} - ${formatClock(endDate)}`;
  }

  const zone = legacy ? "UTC" : TIME_ZONE;
  const first = formatDate(startDate, zone);
  const last = formatDate(new Date(endDate.getTime() - 1), zone);

  return first === last ? first : `${first} - ${last}`;
};

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

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    case "expired":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return <CheckCircle2 size={13} />;
    case "pending":
      return <Clock3 size={13} />;
    case "cancelled":
      return <XCircle size={13} />;
    case "expired":
      return <AlertCircle size={13} />;
    default:
      return <AlertCircle size={13} />;
  }
};

const matchesFilter = (displayStatus, filterId) => {
  const status = displayStatus.toLowerCase();

  if (filterId === "all") return true;

  if (filterId === "inactive") {
    return status === "cancelled" || status === "expired";
  }

  return status === filterId;
};

const getPaymentStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-emerald-50 text-emerald-700";
    case "failed":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

// ---------------------------------------------
// Summary Card
// ---------------------------------------------

const SummaryCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
  };

  return (
    <div className="rounded-2xl border border-blue-100/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${colors[color]}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// Component
// ---------------------------------------------

const Visitors = () => {
  const navigate = useNavigate();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/visitor/my_visitors");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to fetch visitors."
        );
      }

      setVisitors(response.data.visitors || []);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to load your visitors.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const rows = useMemo(
    () =>
      visitors.map((visitor) => ({
        ...visitor,
        displayStatus: getDisplayStatus(visitor),
      })),
    [visitors]
  );

  const summary = useMemo(() => {
    const confirmed = rows.filter(
      (item) => item.displayStatus === "Confirmed"
    );

    return {
      total: rows.length,
      confirmed: confirmed.length,
      attendees: confirmed.reduce(
        (sum, item) => sum + (Number(item.attendees) || 0),
        0
      ),
      paid: confirmed.reduce(
        (sum, item) => sum + (Number(item.totalAmount) || 0),
        0
      ),
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((item) => {
      if (!matchesFilter(item.displayStatus, statusFilter)) return false;
      if (!query) return true;

      return [
        item.name,
        item.contact,
        item.email,
        item.visitId,
        item.bookingId,
        item.spaceName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [rows, search, statusFilter]);

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* PAGE HEADER */}
        <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-900/10 sm:p-8">
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-indigo-300/20 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50">
                <Users size={14} />
                CUSTOMER PORTAL
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                My Visitors
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                Keep track of the people you have invited to your workspace.
                View visitor details, booking information and payment status.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fetchVisitors}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => navigate(INVITE_ROUTE)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-md transition hover:bg-blue-50 active:scale-[0.98]"
              >
                <UserPlus size={17} />
                Invite Visitor
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        {!loading && !error && (
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total Visitor Passes"
              value={summary.total}
              subtitle="All invitations"
              icon={Users}
              color="blue"
            />

            <SummaryCard
              title="Confirmed Passes"
              value={summary.confirmed}
              subtitle="Successfully confirmed"
              icon={CheckCircle2}
              color="green"
            />

            <SummaryCard
              title="Confirmed Attendees"
              value={summary.attendees}
              subtitle="Total visitor count"
              icon={UserPlus}
              color="indigo"
            />

            <SummaryCard
              title="Total Paid"
              value={formatCurrency(summary.paid)}
              subtitle="From confirmed passes"
              icon={Wallet}
              color="violet"
            />
          </div>
        )}

        {/* SEARCH AND FILTERS */}
        {!loading && !error && rows.length > 0 && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search visitor, contact, email or booking..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((filter) => {
                  const isActive = statusFilter === filter.id;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setStatusFilter(filter.id)}
                      aria-pressed={isActive}
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-800">
                  {filteredRows.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-800">
                  {rows.length}
                </span>{" "}
                visitor passes
              </p>

              {(search || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-blue-100 bg-white py-20 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <RefreshCw size={27} className="animate-spin text-blue-600" />
            </div>
            <p className="mt-4 font-semibold text-slate-700">
              Loading your visitors...
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Please wait while we fetch your visitor records.
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={27} />
            </div>

            <h2 className="mt-4 font-bold text-slate-900">
              Could not load visitors
            </h2>

            <p className="mt-2 text-sm text-slate-500">{error}</p>

            <button
              type="button"
              onClick={fetchVisitors}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        )}

        {/* NO VISITORS */}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-2xl border border-blue-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Users size={32} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No visitors yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You have not invited anyone yet. Invite visitors to your
              workspace and their passes will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate(INVITE_ROUTE)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <UserPlus size={17} />
              Invite a Visitor
            </button>
          </div>
        )}

        {/* FILTER EMPTY STATE */}
        {!loading &&
          !error &&
          rows.length > 0 &&
          filteredRows.length === 0 && (
            <div className="rounded-2xl border border-blue-100 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={25} />
              </div>

              <h2 className="mt-4 font-bold text-slate-800">
                No matching visitors
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search term or status filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* VISITOR RECORDS */}
        {!loading && !error && filteredRows.length > 0 && (
          <div className="space-y-5">
            {filteredRows.map((visitor) => (
              <article
                key={visitor._id || visitor.visitId}
                className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* CARD HEADER */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white to-blue-50/60 p-5 sm:flex-row sm:items-center sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Users size={22} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Visitor Pass
                      </p>
                      <h2 className="mt-1 break-all text-sm font-extrabold text-slate-900 sm:text-base">
                        {visitor.visitId || "—"}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusStyle(visitor.displayStatus)}`}>
                      {getStatusIcon(visitor.displayStatus)}
                      {visitor.displayStatus}
                    </span>

                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${getPaymentStyle(visitor.paymentStatus)}`}>
                      Payment: {visitor.paymentStatus || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* CARD CONTENT */}
                <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-3">

                  {/* VISITOR DETAILS */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <Users size={16} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Visitor Details
                      </h3>
                    </div>

                    <p className="break-words text-base font-bold text-slate-900">
                      {visitor.name || "—"}
                    </p>

                    <p className="mt-1 text-xs font-medium text-blue-600">
                      {visitor.attendees || 0}{" "}
                      {visitor.attendees === 1 ? "Attendee" : "Attendees"}
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <Phone size={15} className="mt-0.5 shrink-0 text-slate-400" />
                        <span className="break-all text-sm text-slate-600">
                          {visitor.contact || "—"}
                        </span>
                      </div>

                      {visitor.email && (
                        <div className="flex items-start gap-2.5">
                          <Mail size={15} className="mt-0.5 shrink-0 text-slate-400" />
                          <span className="break-all text-sm text-slate-600">
                            {visitor.email}
                          </span>
                        </div>
                      )}

                      {visitor.companyName && (
                        <div className="flex items-start gap-2.5">
                          <Building2 size={15} className="mt-0.5 shrink-0 text-slate-400" />
                          <span className="break-words text-sm text-slate-600">
                            {visitor.companyName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WORKSPACE DETAILS */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                        <Building2 size={16} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Workspace Booking
                      </h3>
                    </div>

                    <p className="break-words text-base font-bold text-slate-900">
                      {visitor.spaceName || "Workspace"}
                    </p>

                    <div className="mt-3 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Seats
                          </p>
                          <p className="mt-0.5 break-words text-sm text-slate-700">
                            {Array.isArray(visitor.selectedSpaces) &&
                            visitor.selectedSpaces.length > 0
                              ? visitor.selectedSpaces.join(", ")
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CalendarDays size={15} className="mt-0.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Booking Period
                          </p>
                          <p className="mt-0.5 text-sm leading-5 text-slate-700">
                            {formatBookingWindow(
                              visitor.bookingStartAt,
                              visitor.bookingEndAt
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Booking ID
                        </p>
                        <p className="mt-1 break-all text-xs font-medium text-slate-600">
                          {visitor.bookingId || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT DETAILS */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <CreditCard size={16} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Fee Breakdown
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-slate-500">Hourly rate</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(visitor.hourlyRate)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-slate-500">Duration</span>
                        <span className="font-semibold text-slate-800">
                          {visitor.visitHours || 0} hr
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-slate-500">Attendees</span>
                        <span className="font-semibold text-slate-800">
                          {visitor.attendees || 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-blue-100 pt-3 text-sm">
                        <span className="text-slate-500">GST (18%)</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(visitor.gstAmount)}
                        </span>
                      </div>

                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <p className="text-xs font-medium text-slate-500">
                          Total Amount
                        </p>
                        <p className="mt-1 text-2xl font-extrabold tracking-tight text-blue-700">
                          {formatCurrency(visitor.totalAmount)}
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-slate-400">
                          Inclusive of GST
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* REASON */}
                {visitor.reason && (
                  <div className="mx-5 mb-5 rounded-xl border border-slate-100 bg-white p-4 sm:mx-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Reason for Visit
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                      {visitor.reason}
                    </p>
                  </div>
                )}

                {/* CARD FOOTER */}
                <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock3 size={14} className="text-slate-400" />
                    Invited on:{" "}
                    <span className="font-semibold text-slate-700">
                      {formatDate(visitor.createdAt)}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Oorza Visitor Management
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Visitors;
