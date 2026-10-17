import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";

// Change this to the route where InviteVisitor is mounted in your app.
const INVITE_ROUTE = "/customer/invite-visitor";

// Bookings and visits are in IST, so always display in IST.
const TIME_ZONE = "Asia/Kolkata";

// Must match the 10 minute pending window used by the backend.
const PENDING_EXPIRY_MS = 10 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_FILTERS = [
  { id: "all", label: "All" },
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

// Bookings saved before the IST update were stored at UTC midnight
// (00:00Z) instead of IST midnight. Read those in UTC so the calendar
// day is not pushed forward by the +05:30 offset.
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

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-green-100 text-green-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "expired":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-gray-100 text-gray-700";
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

  // GET /api/visitor/my_visitors
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

  // Attach the display status once so filters, counts and cards agree.
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              My Visitors
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Visitors you have invited to your workspace bookings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchVisitors}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <UserPlus size={16} />
              Invite Visitor
            </button>
          </div>
        </div>

        {/* Summary */}
        {!loading && !error && (
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Passes</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {summary.total}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Confirmed</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {summary.confirmed}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Confirmed Attendees</p>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {summary.attendees}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(summary.paid)}
              </p>
            </div>
          </div>
        )}

        {/* Search and filters */}
        {!loading && !error && rows.length > 0 && (
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, contact, email or booking"
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <RefreshCw
              size={32}
              className="mx-auto animate-spin text-blue-600"
            />
            <p className="mt-4 text-gray-500">Loading your visitors...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p className="font-medium text-red-600">
              Could not load visitors.
            </p>
            <p className="mt-2 text-sm text-gray-500">{error}</p>

            <button
              type="button"
              onClick={fetchVisitors}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state: no visitors at all */}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
            <Users size={44} className="mx-auto text-gray-400" />

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No visitors yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Visitors you invite will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate(INVITE_ROUTE)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <UserPlus size={16} />
              Invite a Visitor
            </button>
          </div>
        )}

        {/* Empty state: filters match nothing */}
        {!loading &&
          !error &&
          rows.length > 0 &&
          filteredRows.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
              <p className="font-medium text-gray-700">
                No visitors match your search.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* Visitor cards */}
        {!loading && !error && filteredRows.length > 0 && (
          <div className="space-y-5">
            {filteredRows.map((visitor) => (
              <div
                key={visitor._id || visitor.visitId}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Visit ID
                    </p>

                    <p className="mt-1 break-all font-semibold text-gray-900">
                      {visitor.visitId || "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        visitor.displayStatus
                      )}`}
                    >
                      {visitor.displayStatus}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        visitor.paymentStatus?.toLowerCase() === "paid"
                          ? "bg-green-100 text-green-700"
                          : visitor.paymentStatus?.toLowerCase() === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      Payment: {visitor.paymentStatus || "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2 lg:grid-cols-3">
                  {/* Visitor */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users size={17} />
                      <span className="text-sm">Visitor</span>
                    </div>

                    <p className="mt-2 font-semibold text-gray-900">
                      {visitor.name || "—"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {visitor.attendees}{" "}
                      {visitor.attendees === 1 ? "attendee" : "attendees"}
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                      <Phone size={14} className="text-gray-400" />
                      {visitor.contact || "—"}
                    </p>

                    {visitor.email && (
                      <p className="mt-1 flex items-center gap-2 break-all text-sm text-gray-700">
                        <Mail size={14} className="shrink-0 text-gray-400" />
                        {visitor.email}
                      </p>
                    )}

                    {visitor.companyName && (
                      <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                        <Building2
                          size={14}
                          className="shrink-0 text-gray-400"
                        />
                        {visitor.companyName}
                      </p>
                    )}
                  </div>

                  {/* Booking */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin size={17} />
                      <span className="text-sm">Workspace Booking</span>
                    </div>

                    <p className="mt-2 font-semibold text-gray-900">
                      {visitor.spaceName || "Workspace"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Seats:{" "}
                      {Array.isArray(visitor.selectedSpaces) &&
                      visitor.selectedSpaces.length > 0
                        ? visitor.selectedSpaces.join(", ")
                        : "—"}
                    </p>

                    <p className="mt-2 flex items-start gap-2 text-sm text-gray-700">
                      <CalendarDays
                        size={14}
                        className="mt-0.5 shrink-0 text-gray-400"
                      />
                      {formatBookingWindow(
                        visitor.bookingStartAt,
                        visitor.bookingEndAt
                      )}
                    </p>

                    <p className="mt-1 break-all text-xs text-gray-400">
                      {visitor.bookingId}
                    </p>
                  </div>

                  {/* Fee */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <CalendarDays size={17} />
                      <span className="text-sm">Visitor Fee</span>
                    </div>

                    <p className="mt-2 text-sm text-gray-700">
                      {formatCurrency(visitor.hourlyRate)} / hr ×{" "}
                      {visitor.visitHours} hr × {visitor.attendees}
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      GST (18%): {formatCurrency(visitor.gstAmount)}
                    </p>

                    <p className="mt-3 text-lg font-bold text-blue-700">
                      {formatCurrency(visitor.totalAmount)}
                    </p>

                    <p className="text-xs text-gray-500">incl. GST</p>
                  </div>
                </div>

                {visitor.reason && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Reason
                    </p>

                    <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                      {visitor.reason}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                  <p className="text-xs text-gray-500">
                    Invited on: {formatDate(visitor.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Visitors;