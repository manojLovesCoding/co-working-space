import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  FileText,
  RefreshCw,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  Building2,
  ArrowUpRight,
  Receipt,
  Armchair,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios.js";

// Bookings are made in India Standard Time.
const TIME_ZONE = "Asia/Kolkata";
const PENDING_EXPIRY_MS = 10 * 60 * 1000;
const ITEMS_PER_PAGE = 10;

const formatDate = (date, timeZone = TIME_ZONE) => {
  if (!date) return "—";

  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00+05:30`)
    : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";

  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
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

const getLastBookedDate = (endAt) => {
  const parsed = new Date(endAt);

  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getTime() - 1);
};

const getDisplayStatus = (reservation) => {
  const status = reservation.status || "Unknown";

  if (
    status === "Pending" &&
    reservation.paymentStatus !== "Paid" &&
    reservation.createdAt
  ) {
    const age = Date.now() - new Date(reservation.createdAt).getTime();

    if (age > PENDING_EXPIRY_MS) return "Expired";
  }

  return status;
};

const getSeatRows = (reservation) => {
  const assignments = Array.isArray(reservation.seatAssignments)
    ? reservation.seatAssignments
    : [];

  if (assignments.length > 0) {
    return assignments.map((item) => ({
      spaceCode: item.spaceCode,
      name: item.assigneeType === "self" ? "You" : item.name || "Team member",
      isSelf: item.assigneeType === "self",
    }));
  }

  return (
    Array.isArray(reservation.selectedSpaces) ? reservation.selectedSpaces : []
  ).map((code) => ({
    spaceCode: code,
    name: "",
    isSelf: false,
  }));
};

const getScheduleRows = (reservation) => {
  if (reservation.plan === "hourly") {
    return [
      {
        label: "Date",
        value: formatDate(reservation.bookingDate),
      },
      {
        label: "Time",
        value: reservation.startTime
          ? `${formatTime(reservation.startTime)} - ${formatTime(
              reservation.endTime,
            )}`
          : "Full day",
      },
    ];
  }

  const lastDate = getLastBookedDate(reservation.endAt);
  const zone = isLegacyMidnight(reservation.startAt) ? "UTC" : TIME_ZONE;

  return [
    {
      label: "From",
      value: formatDate(reservation.startAt, zone),
    },
    {
      label: "To",
      value: lastDate ? formatDate(lastDate, zone) : "—",
    },
  ];
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

const getPaymentStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
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
      return null;
  }
};

const Reservations = () => {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/booking/my_reservations");

      if (response.data?.success) {
        setReservations(response.data.reservations || []);
      } else {
        throw new Error(
          response.data?.message || "Failed to fetch reservations.",
        );
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to load your reservations.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const countByStatus = (...statuses) =>
    reservations.filter((item) =>
      statuses.includes(getDisplayStatus(item).toLowerCase()),
    ).length;

  const confirmedCount = countByStatus("confirmed");
  const pendingCount = countByStatus("pending");
  const cancelledCount = countByStatus("cancelled", "expired");

  const summaryCards = [
    {
      label: "Total Reservations",
      value: reservations.length,
      icon: CalendarDays,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      description: "All your bookings",
    },
    {
      label: "Confirmed",
      value: confirmedCount,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      description: "Successfully booked",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock3,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      description: "Awaiting confirmation",
    },
    {
      label: "Cancelled / Expired",
      value: cancelledCount,
      icon: XCircle,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      description: "Inactive bookings",
    },
  ];

  const filteredReservations = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const displayStatus = getDisplayStatus(reservation);
      const seatRows = getSeatRows(reservation);

      const matchesSearch =
        !searchValue ||
        [
          reservation.bookingId,
          reservation.spaceName,
          reservation.plan,
          reservation.paymentStatus,
          displayStatus,
          ...seatRows.map((seat) => seat.spaceCode),
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(searchValue),
        );

      const matchesStatus =
        statusFilter === "All" ||
        displayStatus.toLowerCase() === statusFilter.toLowerCase();

      const matchesPayment =
        paymentFilter === "All" ||
        String(reservation.paymentStatus || "").toLowerCase() ===
          paymentFilter.toLowerCase();

      const matchesPlan =
        planFilter === "All" ||
        String(reservation.plan || "").toLowerCase() ===
          planFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPayment && matchesPlan;
    });
  }, [reservations, search, statusFilter, paymentFilter, planFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReservations.length / ITEMS_PER_PAGE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedReservations = filteredReservations.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, paymentFilter, planFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setPaymentFilter("All");
    setPlanFilter("All");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search ||
    statusFilter !== "All" ||
    paymentFilter !== "All" ||
    planFilter !== "All";

  return (
    <div className="min-h-screen bg-[#EAF4FF] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Building2 size={17} />
              <span>Oorza Customer Portal</span>
              <span className="text-blue-300">/</span>
              <span className="text-slate-500">Reservations</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              My Reservations
            </h1>

            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Manage and track all your workspace bookings in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh Reservations
          </button>
        </div>

        {/* BANNER */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 shadow-xl shadow-blue-900/15 sm:p-8">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-indigo-400/20" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-blue-100">
                Your workspace journey
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                Every booking, one place.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
                Track reservations, seat assignments, schedules and payment
                details with ease.
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center self-start rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-sm sm:self-center">
              <CalendarDays size={34} />
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        {!loading && !error && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {card.label}
                      </p>
                      <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
                        {card.value}
                      </h3>
                      <p className="mt-2 text-xs text-slate-400">
                        {card.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
                    >
                      <Icon size={23} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-3xl border border-blue-100 bg-white py-20 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <RefreshCw size={30} className="animate-spin text-blue-600" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-800">
              Loading your reservations
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Please wait while we retrieve your workspace bookings.
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={30} />
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">
              Could not load reservations
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              {error}
            </p>
            <button
              type="button"
              onClick={fetchReservations}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && reservations.length === 0 && (
          <div className="rounded-3xl border border-blue-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <CalendarDays size={38} />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-slate-900">
              No reservations yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You haven't made any workspace reservations yet. Once you book a
              workspace, your booking details will appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Explore Workspaces
              <ArrowUpRight size={17} />
            </button>
          </div>
        )}

        {/* TABLE */}
        {!loading && !error && reservations.length > 0 && (
          <div>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Booking History
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View and manage your workspace reservations.
                </p>
              </div>

              <span className="w-fit rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-700">
                {filteredReservations.length} Bookings
              </span>
            </div>

            {/* FILTERS */}
            <div className="mb-5 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Search & Filters
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search booking or seat..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="All">All Booking Status</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="All">All Payment Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>

                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="All">All Booking Plans</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                  >
                    <X size={14} />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* RESERVATION TABLE */}
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-2 border-b border-blue-100 px-5 py-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-bold text-slate-800">
                    Your Reservations
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Complete overview of your workspace bookings.
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  Showing{" "}
                  {filteredReservations.length === 0
                    ? 0
                    : (safePage - 1) * ITEMS_PER_PAGE + 1}
                  –
                  {Math.min(
                    safePage * ITEMS_PER_PAGE,
                    filteredReservations.length,
                  )}{" "}
                  of {filteredReservations.length}
                </span>
              </div>

              {filteredReservations.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <Search size={30} className="mx-auto text-slate-300" />
                  <h3 className="mt-3 font-bold text-slate-800">
                    No matching reservations
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try changing your search or filter options.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[1150px] border-collapse text-left">
                      <thead>
                        <tr className="bg-blue-50/80 text-xs uppercase tracking-wider text-slate-500">
                          <th className="px-5 py-4 font-bold">#</th>
                          <th className="px-5 py-4 font-bold">
                            Booking Details
                          </th>
                          <th className="px-5 py-4 font-bold">Workspace</th>
                          <th className="px-5 py-4 font-bold">Plan</th>
                          <th className="px-5 py-4 font-bold">Schedule</th>
                          <th className="px-5 py-4 font-bold">Amount</th>
                          <th className="px-5 py-4 font-bold">Status</th>
                          <th className="px-5 py-4 font-bold">Payment</th>
                          <th className="px-5 py-4 text-center font-bold">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-blue-50">
                        {paginatedReservations.map((reservation, index) => {
                          const displayStatus = getDisplayStatus(reservation);
                          const seatRows = getSeatRows(reservation);
                          const scheduleRows = getScheduleRows(reservation);

                          return (
                            <tr
                              key={reservation._id || reservation.bookingId}
                              className="transition hover:bg-blue-50/50"
                            >
                              <td className="px-5 py-5 text-sm font-semibold text-slate-400">
                                {(safePage - 1) * ITEMS_PER_PAGE + index + 1}
                              </td>

                              <td className="px-5 py-5">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Receipt size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="max-w-[180px] break-all text-sm font-bold text-slate-800">
                                      {reservation.bookingId || "—"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                      {formatDate(reservation.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-5">
                                <p className="max-w-[170px] truncate text-sm font-bold text-slate-800">
                                  {reservation.spaceName || "Workspace"}
                                </p>
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                  <Armchair size={13} />
                                  {seatRows.length}{" "}
                                  {seatRows.length === 1 ? "Seat" : "Seats"}
                                </div>
                                {seatRows.length > 0 && (
                                  <p className="mt-1 max-w-[180px] truncate text-xs text-blue-600">
                                    {seatRows
                                      .map((seat) => seat.spaceCode)
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                )}
                              </td>

                              <td className="px-5 py-5">
                                <span className="inline-flex rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold capitalize text-indigo-700">
                                  {reservation.plan || "—"}
                                </span>
                                <p className="mt-1.5 text-xs text-slate-500">
                                  {reservation.duration ?? "—"}{" "}
                                  {reservation.plan === "hourly"
                                    ? "hour(s)"
                                    : reservation.plan === "daily"
                                      ? "day(s)"
                                      : reservation.plan === "monthly"
                                        ? "month(s)"
                                        : ""}
                                </p>
                              </td>

                              <td className="px-5 py-5">
                                <div className="space-y-1.5">
                                  {scheduleRows.map((row) => (
                                    <div key={row.label} className="text-xs">
                                      <span className="text-slate-400">
                                        {row.label}:{" "}
                                      </span>
                                      <span className="font-semibold text-slate-700">
                                        {row.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              <td className="px-5 py-5">
                                <p className="whitespace-nowrap text-sm font-extrabold text-slate-900">
                                  {formatCurrency(reservation.totalAmount)}
                                </p>
                              </td>

                              <td className="px-5 py-5">
                                <span
                                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-bold ${getStatusStyle(displayStatus)}`}
                                >
                                  {getStatusIcon(displayStatus)}
                                  {displayStatus}
                                </span>
                              </td>

                              <td className="px-5 py-5">
                                <span
                                  className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-bold ${getPaymentStyle(reservation.paymentStatus)}`}
                                >
                                  {reservation.paymentStatus || "Unknown"}
                                </span>
                              </td>

                              <td className="px-5 py-5">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedReservation(reservation)
                                    }
                                    title="View booking details"
                                    aria-label="View booking details"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                                  >
                                    <Eye size={16} />
                                  </button>

                                  {reservation.status === "Confirmed" &&
                                    reservation.paymentStatus === "Paid" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          navigate(
                                            `/customer/invoice/${reservation.bookingId}`,
                                          )
                                        }
                                        title="View invoice"
                                        aria-label="View invoice"
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
                                      >
                                        <FileText size={16} />
                                      </button>
                                    )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION */}
                  <div className="flex flex-col justify-between gap-4 border-t border-blue-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center">
                    <p className="text-xs font-medium text-slate-500">
                      Page {safePage} of {totalPages}
                    </p>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={safePage === 1}
                        onClick={() =>
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={17} />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            totalPages <= 5 ||
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - safePage) <= 1,
                        )
                        .map((page, index, pages) => (
                          <span key={page} className="contents">
                            {index > 0 && page - pages[index - 1] > 1 && (
                              <span className="px-1 text-slate-400">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={`h-9 min-w-9 rounded-lg px-3 text-sm font-bold transition ${
                                safePage === page
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                              }`}
                            >
                              {page}
                            </button>
                          </span>
                        ))}

                      <button
                        type="button"
                        disabled={safePage === totalPages}
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(totalPages, page + 1),
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next page"
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* BOOKING DETAILS MODAL */}
        {selectedReservation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
            onClick={() => setSelectedReservation(null)}
          >
            <div
              className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-5 text-white sm:px-7">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                    Reservation Details
                  </p>
                  <h2 className="mt-2 break-all text-lg font-extrabold sm:text-xl">
                    {selectedReservation.bookingId || "Booking"}
                  </h2>
                  <p className="mt-1 text-xs text-blue-100">
                    Created {formatDate(selectedReservation.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReservation(null)}
                  aria-label="Close booking details"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="max-h-[calc(92vh-90px)] space-y-5 overflow-y-auto p-5 sm:p-7">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusStyle(getDisplayStatus(selectedReservation))}`}
                  >
                    {getStatusIcon(getDisplayStatus(selectedReservation))}
                    {getDisplayStatus(selectedReservation)}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold ${getPaymentStyle(selectedReservation.paymentStatus)}`}
                  >
                    Payment: {selectedReservation.paymentStatus || "Unknown"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Building2 size={17} />
                      <h3 className="text-sm font-bold">Workspace</h3>
                    </div>
                    <p className="mt-3 text-base font-extrabold text-slate-900">
                      {selectedReservation.spaceName || "Workspace"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {getSeatRows(selectedReservation).length} seat(s) booked
                    </p>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <CalendarDays size={17} />
                      <h3 className="text-sm font-bold">Booking Plan</h3>
                    </div>
                    <p className="mt-3 text-base font-extrabold capitalize text-slate-900">
                      {selectedReservation.plan || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedReservation.duration ?? "—"}{" "}
                      {selectedReservation.plan === "hourly"
                        ? "hour(s)"
                        : selectedReservation.plan === "daily"
                          ? "day(s)"
                          : selectedReservation.plan === "monthly"
                            ? "month(s)"
                            : ""}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock size={17} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Schedule
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {getScheduleRows(selectedReservation).map((row) => (
                      <div
                        key={row.label}
                        className="rounded-xl bg-slate-50 p-3"
                      >
                        <p className="text-xs text-slate-400">{row.label}</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Users size={17} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Seat Assignments
                    </h3>
                  </div>

                  {getSeatRows(selectedReservation).length > 0 ? (
                    <div className="space-y-2">
                      {getSeatRows(selectedReservation).map((seat, index) => (
                        <div
                          key={`${seat.spaceCode || "seat"}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl bg-blue-50/60 px-3 py-3"
                        >
                          <div className="flex items-center gap-2">
                            <Armchair size={16} className="text-blue-600" />
                            <span className="text-sm font-bold text-slate-800">
                              {seat.spaceCode || "Seat"}
                            </span>
                          </div>
                          {seat.name && (
                            <span
                              className={`text-xs font-semibold ${seat.isSelf ? "text-blue-600" : "text-slate-500"}`}
                            >
                              {seat.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No seat details available.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Booking Amount
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-blue-700">
                    {formatCurrency(selectedReservation.totalAmount)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-400">
                    Booking created: {formatDate(selectedReservation.createdAt)}
                  </p>

                  {selectedReservation.status === "Confirmed" &&
                    selectedReservation.paymentStatus === "Paid" && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/customer/invoice/${selectedReservation.bookingId}`,
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        <FileText size={16} />
                        View Invoice
                        <ArrowUpRight size={15} />
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-10 border-t border-blue-200 pt-5 text-center">
          <p className="text-xs font-medium text-slate-500">
            Your Space. Your People. Your Work.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reservations;
