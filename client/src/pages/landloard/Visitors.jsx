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
  Eye,
  X,
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
// HELPERS
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
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    case "expired":
      return "border-orange-200 bg-orange-50 text-orange-700";
    default:
      return "border-[#E9DED0] bg-[#F7F2EB] text-[#8F8175]";
  }
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return <CheckCircle2 size={12} />;
    case "pending":
      return <Clock3 size={12} />;
    case "cancelled":
      return <XCircle size={12} />;
    default:
      return <AlertCircle size={12} />;
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
      return "bg-[#F7F2EB] text-[#8F8175]";
  }
};

// ---------------------------------------------
// SUMMARY CARD
// ---------------------------------------------

const SummaryCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const colors = {
    terracotta: "bg-[#F8EDE6] text-[#A95643] ring-[#E9CFC3]",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    sage: "bg-[#EDF2EA] text-[#527C61] ring-[#DCE7D8]",
    gold: "bg-[#FBF3E5] text-[#B1843F] ring-[#F0E2C7]",
  };

  return (
    <div className="rounded-lg border border-[#E9DED0] bg-[#FFFDFA] p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#8F8175]">
            {title}
          </p>
          <p className="mt-1 text-lg font-extrabold tracking-tight text-[#382B26]">
            {value}
          </p>
          <p className="mt-0.5 text-[10px] text-[#A3978B]">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${colors[color]}`}
        >
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// VISITOR DETAILS MODAL
// ---------------------------------------------

const VisitorDetailsModal = ({ visitor, onClose }) => {
  if (!visitor) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#382B26]/50 p-3 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E9DED0] bg-[#FFFDFA] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[#382B26]">
              Visitor Details
            </h2>
            <p className="mt-0.5 text-[10px] text-[#8F8175]">
              Pass ID: {visitor.visitId || "—"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8F8175] transition hover:bg-[#F8EDE6] hover:text-[#71392F]"
            aria-label="Close details"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-3 p-3 sm:p-4">
          {/* STATUS */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(
                visitor.displayStatus
              )}`}
            >
              {getStatusIcon(visitor.displayStatus)}
              {visitor.displayStatus}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getPaymentStyle(
                visitor.paymentStatus
              )}`}
            >
              Payment: {visitor.paymentStatus || "Unknown"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* VISITOR */}
            <div className="rounded-lg border border-[#E9DED0] bg-[#FBF8F3] p-3">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-[#382B26]">
                <Users size={14} className="text-[#A95643]" />
                Visitor Information
              </h3>

              <p className="text-sm font-bold text-[#382B26]">
                {visitor.name || "—"}
              </p>

              <p className="mt-1 text-[11px] text-[#A95643]">
                {visitor.attendees || 0} Attendees
              </p>

              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2 text-xs text-[#716359]">
                  <Phone size={13} className="mt-0.5 shrink-0 text-[#A3978B]" />
                  <span className="break-all">{visitor.contact || "—"}</span>
                </div>

                <div className="flex items-start gap-2 text-xs text-[#716359]">
                  <Mail size={13} className="mt-0.5 shrink-0 text-[#A3978B]" />
                  <span className="break-all">{visitor.email || "—"}</span>
                </div>

                {visitor.companyName && (
                  <div className="flex items-start gap-2 text-xs text-[#716359]">
                    <Building2 size={13} className="mt-0.5 shrink-0 text-[#A3978B]" />
                    <span>{visitor.companyName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* WORKSPACE */}
            <div className="rounded-lg border border-[#E9DED0] bg-[#FBF8F3] p-3">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-[#382B26]">
                <Building2 size={14} className="text-[#A95643]" />
                Workspace Booking
              </h3>

              <p className="text-sm font-bold text-[#382B26]">
                {visitor.spaceName || "Workspace"}
              </p>

              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-[#A3978B]" />
                  <div>
                    <p className="text-[9px] font-bold uppercase text-[#A3978B]">
                      Seats
                    </p>
                    <p className="text-xs text-[#716359]">
                      {Array.isArray(visitor.selectedSpaces) &&
                      visitor.selectedSpaces.length
                        ? visitor.selectedSpaces.join(", ")
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CalendarDays size={13} className="mt-0.5 shrink-0 text-[#A3978B]" />
                  <div>
                    <p className="text-[9px] font-bold uppercase text-[#A3978B]">
                      Booking Period
                    </p>
                    <p className="text-xs text-[#716359]">
                      {formatBookingWindow(
                        visitor.bookingStartAt,
                        visitor.bookingEndAt
                      )}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#E9DED0] pt-2">
                  <p className="text-[9px] font-bold uppercase text-[#A3978B]">
                    Booking ID
                  </p>
                  <p className="mt-0.5 break-all text-[11px] text-[#716359]">
                    {visitor.bookingId || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT TABLE */}
          <div className="overflow-hidden rounded-lg border border-[#E9CFC3]">
            <div className="flex items-center gap-2 bg-[#FBF3ED] px-3 py-2">
              <CreditCard size={14} className="text-[#A95643]" />
              <h3 className="text-xs font-bold text-[#382B26]">
                Fee Breakdown
              </h3>
            </div>

            <table className="w-full text-xs">
              <tbody className="divide-y divide-[#F0E8DF]">
                <tr>
                  <td className="px-3 py-2 text-[#8F8175]">Hourly Rate</td>
                  <td className="px-3 py-2 text-right font-semibold text-[#382B26]">
                    {formatCurrency(visitor.hourlyRate)}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-[#8F8175]">Duration</td>
                  <td className="px-3 py-2 text-right font-semibold text-[#382B26]">
                    {visitor.visitHours || 0} hr
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-[#8F8175]">Attendees</td>
                  <td className="px-3 py-2 text-right font-semibold text-[#382B26]">
                    {visitor.attendees || 0}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-[#8F8175]">GST (18%)</td>
                  <td className="px-3 py-2 text-right font-semibold text-[#382B26]">
                    {formatCurrency(visitor.gstAmount)}
                  </td>
                </tr>
                <tr className="bg-[#FBF3ED]">
                  <td className="px-3 py-2 font-bold text-[#382B26]">
                    Total Amount
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-extrabold text-[#A95643]">
                    {formatCurrency(visitor.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* REASON AND DATE */}
          {visitor.reason && (
            <div className="rounded-lg border border-[#E9DED0] bg-[#FBF8F3] p-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#A3978B]">
                Reason for Visit
              </p>
              <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#716359]">
                {visitor.reason}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-[#8F8175]">
            <Clock3 size={12} />
            Invited on: {formatDate(visitor.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------

const Visitors = () => {
  const navigate = useNavigate();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVisitor, setSelectedVisitor] = useState(null);

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
    <div className="min-h-screen bg-[#FAF6EF] p-3 sm:p-4">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-r from-[#71392F] via-[#914B3B] to-[#A95643] p-4 text-white shadow-sm">
          <div className="absolute -right-10 -top-20 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-[#FAE9E1]">
                <Users size={11} />
                CUSTOMER PORTAL
              </div>

              <h1 className="text-xl font-extrabold tracking-tight">
                My Visitors
              </h1>

              <p className="mt-1 max-w-xl text-[11px] leading-4 text-[#F5DED4] sm:text-xs">
                Manage your visitor invitations, booking details and payment
                information.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fetchVisitors}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw
                  size={13}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => navigate(INVITE_ROUTE)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF6EF] px-3 py-2 text-[11px] font-bold text-[#71392F] transition hover:bg-white"
              >
                <UserPlus size={14} />
                Invite Visitor
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        {!loading && !error && (
          <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Visitor Passes"
              value={summary.total}
              subtitle="All invitations"
              icon={Users}
              color="terracotta"
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
              color="sage"
            />

            <SummaryCard
              title="Total Paid"
              value={formatCurrency(summary.paid)}
              subtitle="From confirmed passes"
              icon={Wallet}
              color="gold"
            />
          </div>
        )}

        {/* SEARCH AND FILTERS */}
        {!loading && !error && rows.length > 0 && (
          <div className="mb-3 rounded-lg border border-[#E9DED0] bg-[#FFFDFA] p-3 shadow-sm">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3978B]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search visitor, contact, email or booking..."
                  className="w-full rounded-lg border border-[#E9DED0] bg-[#FAF6EF] py-2 pl-9 pr-3 text-xs text-[#382B26] outline-none transition placeholder:text-[#A3978B] focus:border-[#C9826C] focus:bg-white focus:ring-2 focus:ring-[#F8EDE6]"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map((filter) => {
                  const isActive = statusFilter === filter.id;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setStatusFilter(filter.id)}
                      aria-pressed={isActive}
                      className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
                        isActive
                          ? "bg-[#A95643] text-white"
                          : "border border-[#E9DED0] bg-white text-[#716359] hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-[#F0E8DF] pt-2">
              <p className="text-[10px] text-[#8F8175]">
                Showing{" "}
                <span className="font-bold text-[#382B26]">
                  {filteredRows.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#382B26]">
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
                  className="text-[10px] font-semibold text-[#A95643] hover:text-[#71392F]"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-lg border border-[#E9DED0] bg-[#FFFDFA] py-12 text-center shadow-sm">
            <RefreshCw
              size={22}
              className="mx-auto animate-spin text-[#A95643]"
            />
            <p className="mt-2 text-xs font-semibold text-[#382B26]">
              Loading your visitors...
            </p>
            <p className="mt-1 text-[10px] text-[#A3978B]">
              Please wait while we fetch your visitor records.
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-[#FFFDFA] p-5 text-center shadow-sm">
            <AlertCircle size={23} className="mx-auto text-red-500" />

            <h2 className="mt-2 text-sm font-bold text-[#382B26]">
              Could not load visitors
            </h2>

            <p className="mt-1 text-xs text-[#8F8175]">{error}</p>

            <button
              type="button"
              onClick={fetchVisitors}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#A95643] px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-[#71392F]"
            >
              <RefreshCw size={13} />
              Try Again
            </button>
          </div>
        )}

        {/* NO VISITORS */}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-lg border border-[#E9DED0] bg-[#FFFDFA] px-5 py-10 text-center shadow-sm">
            <Users size={30} className="mx-auto text-[#A95643]" />

            <h2 className="mt-3 text-base font-bold text-[#382B26]">
              No visitors yet
            </h2>

            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#8F8175]">
              You have not invited anyone yet. Invite visitors to your
              workspace and their passes will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate(INVITE_ROUTE)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#A95643] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#71392F]"
            >
              <UserPlus size={14} />
              Invite a Visitor
            </button>
          </div>
        )}

        {/* FILTER EMPTY STATE */}
        {!loading &&
          !error &&
          rows.length > 0 &&
          filteredRows.length === 0 && (
            <div className="rounded-lg border border-[#E9DED0] bg-[#FFFDFA] px-5 py-9 text-center shadow-sm">
              <Search size={22} className="mx-auto text-[#A3978B]" />

              <h2 className="mt-2 text-sm font-bold text-[#382B26]">
                No matching visitors
              </h2>

              <p className="mt-1 text-xs text-[#8F8175]">
                Try changing your search term or status filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="mt-3 text-xs font-bold text-[#A95643] hover:text-[#71392F]"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* VISITORS TABLE */}
        {!loading && !error && filteredRows.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E9DED0] bg-[#FBF3ED] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-[#A95643]" />
                <h2 className="text-xs font-bold text-[#382B26]">
                  Visitor Records
                </h2>
              </div>

              <span className="text-[10px] font-medium text-[#8F8175]">
                {filteredRows.length} records
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#E9DED0] bg-[#FAF6EF]">
                    <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                      Visitor
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                      Contact
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                      Workspace
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                      Booking Period
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                      Attendees
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                      Amount
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                      Payment
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0E8DF]">
                  {filteredRows.map((visitor) => (
                    <tr
                      key={visitor._id || visitor.visitId}
                      className="transition hover:bg-[#FBF8F3]"
                    >
                      {/* VISITOR */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                            <Users size={15} />
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[150px] truncate text-xs font-bold text-[#382B26]">
                              {visitor.name || "—"}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#A95643]">
                              {visitor.visitId || "—"}
                            </p>
                            <p className="mt-0.5 text-[9px] text-[#A3978B]">
                              {formatDate(visitor.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td className="px-3 py-2.5">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-[11px] text-[#716359]">
                            <Phone size={11} className="shrink-0 text-[#A3978B]" />
                            {visitor.contact || "—"}
                          </p>

                          {visitor.email && (
                            <p className="flex max-w-[175px] items-center gap-1.5 truncate text-[10px] text-[#8F8175]">
                              <Mail size={11} className="shrink-0 text-[#A3978B]" />
                              <span className="truncate">{visitor.email}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* WORKSPACE */}
                      <td className="px-3 py-2.5">
                        <div className="max-w-[160px]">
                          <p className="truncate text-xs font-semibold text-[#382B26]">
                            {visitor.spaceName || "Workspace"}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-[#8F8175]">
                            {Array.isArray(visitor.selectedSpaces) &&
                            visitor.selectedSpaces.length
                              ? visitor.selectedSpaces.join(", ")
                              : "Seats: —"}
                          </p>
                          {visitor.companyName && (
                            <p className="mt-0.5 truncate text-[9px] text-[#A3978B]">
                              {visitor.companyName}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* BOOKING PERIOD */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-start gap-1.5">
                          <CalendarDays
                            size={12}
                            className="mt-0.5 shrink-0 text-[#A95643]"
                          />
                          <div>
                            <p className="max-w-[150px] text-[11px] leading-4 text-[#716359]">
                              {formatBookingWindow(
                                visitor.bookingStartAt,
                                visitor.bookingEndAt
                              )}
                            </p>
                            <p className="mt-0.5 max-w-[130px] truncate text-[9px] text-[#A3978B]">
                              ID: {visitor.bookingId || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ATTENDEES */}
                      <td className="px-3 py-2.5">
                        <span className="inline-flex min-w-7 items-center justify-center rounded-md bg-[#F8EDE6] px-2 py-1 text-[11px] font-bold text-[#A95643]">
                          {visitor.attendees || 0}
                        </span>
                      </td>

                      {/* AMOUNT */}
                      <td className="px-3 py-2.5">
                        <p className="whitespace-nowrap text-xs font-bold text-[#382B26]">
                          {formatCurrency(visitor.totalAmount)}
                        </p>
                        <p className="mt-0.5 text-[9px] text-[#A3978B]">
                          GST: {formatCurrency(visitor.gstAmount)}
                        </p>
                      </td>

                      {/* PAYMENT */}
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-bold ${getPaymentStyle(
                            visitor.paymentStatus
                          )}`}
                        >
                          {visitor.paymentStatus || "Unknown"}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-bold ${getStatusStyle(
                            visitor.displayStatus
                          )}`}
                        >
                          {getStatusIcon(visitor.displayStatus)}
                          {visitor.displayStatus}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedVisitor(visitor)}
                          title="View visitor details"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E9DED0] bg-white text-[#A95643] transition hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER */}
            <div className="flex flex-col gap-1 border-t border-[#E9DED0] bg-[#FBF8F3] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] text-[#8F8175]">
                Showing{" "}
                <span className="font-bold text-[#382B26]">
                  {filteredRows.length}
                </span>{" "}
                visitor records
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#A3978B]">
                Oorza Visitor Management
              </p>
            </div>
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}
      <VisitorDetailsModal
        visitor={selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
      />
    </div>
  );
};

export default Visitors;