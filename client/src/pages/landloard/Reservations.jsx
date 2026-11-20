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
      return "bg-[#EAF0E6] text-[#527C61] border-[#C9D8C4]";
    case "pending":
      return "bg-[#FFF4DF] text-[#9A6B27] border-[#EED9AD]";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    case "expired":
      return "bg-[#F8EDE6] text-[#A95643] border-[#E8C8BA]";
    default:
      return "bg-[#F3EEE8] text-[#8F8175] border-[#E9DED0]";
  }
};

const getPaymentStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-[#EAF0E6] text-[#527C61] border-[#C9D8C4]";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-[#F3EEE8] text-[#8F8175] border-[#E9DED0]";
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
      iconBg: "bg-[#F8EDE6]",
      iconColor: "text-[#A95643]",
      description: "All your bookings",
    },
    {
      label: "Confirmed",
      value: confirmedCount,
      icon: CheckCircle2,
      iconBg: "bg-[#EAF0E6]",
      iconColor: "text-[#527C61]",
      description: "Successfully booked",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock3,
      iconBg: "bg-[#FFF4DF]",
      iconColor: "text-[#B98537]",
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
    <div className="min-h-screen bg-[#FAF6EF] px-3 py-5 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#A95643]">
              <Building2 size={15} />
              <span>Oorza Customer Portal</span>
              <span className="text-[#C9826C]">/</span>
              <span className="text-[#8F8175]">Reservations</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#382B26] sm:text-3xl">
              My Reservations
            </h1>

            <p className="mt-1 text-sm text-[#8F8175]">
              Manage and track all your workspace bookings in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E9DED0] bg-white px-4 py-2.5 text-sm font-semibold text-[#71392F] shadow-sm transition hover:border-[#C9826C] hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh Reservations
          </button>
        </div>

        {/* BANNER */}
        <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] via-[#8D4939] to-[#A95643] p-5 shadow-md shadow-[#71392F]/10 sm:p-6">
          <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-1/3 h-48 w-48 rounded-full bg-[#C9826C]/20" />

          <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold text-[#F4D9CC]">
                Your workspace journey
              </p>
              <h2 className="mt-1.5 text-xl font-extrabold text-white sm:text-2xl">
                Every booking, one place.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-5 text-[#F8EDE6]">
                Track reservations, seat assignments, schedules and payment
                details with ease.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center self-start rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm sm:self-center">
              <CalendarDays size={29} />
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        {!loading && !error && (
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-xl border border-[#E9DED0] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#8F8175]">
                        {card.label}
                      </p>
                      <h3 className="mt-2 text-2xl font-extrabold text-[#382B26]">
                        {card.value}
                      </h3>
                      <p className="mt-1 text-[11px] text-[#A99B8F]">
                        {card.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-[#E9DED0] bg-white py-14 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EDE6]">
              <RefreshCw size={25} className="animate-spin text-[#A95643]" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#382B26]">
              Loading your reservations
            </h3>
            <p className="mt-1 text-xs text-[#8F8175]">
              Please wait while we retrieve your workspace bookings.
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <AlertCircle size={25} />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#382B26]">
              Could not load reservations
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#8F8175]">
              {error}
            </p>
            <button
              type="button"
              onClick={fetchReservations}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#A95643] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#71392F]"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && reservations.length === 0 && (
          <div className="rounded-2xl border border-[#E9DED0] bg-white px-5 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8EDE6] text-[#A95643]">
              <CalendarDays size={32} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-[#382B26]">
              No reservations yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-[#8F8175]">
              You haven't made any workspace reservations yet. Once you book a
              workspace, your booking details will appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#A95643] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#A95643]/15 transition hover:bg-[#71392F]"
            >
              Explore Workspaces
              <ArrowUpRight size={16} />
            </button>
          </div>
        )}

        {/* TABLE */}
        {!loading && !error && reservations.length > 0 && (
          <div>
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-extrabold text-[#382B26]">
                  Booking History
                </h2>
                <p className="mt-0.5 text-xs text-[#8F8175]">
                  View and manage your workspace reservations.
                </p>
              </div>

              <span className="w-fit rounded-full border border-[#E9DED0] bg-white px-3 py-1.5 text-xs font-bold text-[#A95643]">
                {filteredReservations.length} Bookings
              </span>
            </div>

            {/* FILTERS */}
            <div className="mb-4 rounded-xl border border-[#E9DED0] bg-white p-3.5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#A95643]" />
                <h3 className="text-sm font-bold text-[#382B26]">
                  Search & Filters
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A99B8F]"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search booking or seat..."
                    className="w-full rounded-lg border border-[#E9DED0] bg-[#FBF8F3] py-2.5 pl-9 pr-3 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8F] focus:border-[#C9826C] focus:bg-white focus:ring-2 focus:ring-[#F8EDE6]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-[#E9DED0] bg-[#FBF8F3] px-3 py-2.5 text-sm text-[#382B26] outline-none focus:border-[#C9826C] focus:ring-2 focus:ring-[#F8EDE6]"
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
                  className="rounded-lg border border-[#E9DED0] bg-[#FBF8F3] px-3 py-2.5 text-sm text-[#382B26] outline-none focus:border-[#C9826C] focus:ring-2 focus:ring-[#F8EDE6]"
                >
                  <option value="All">All Payment Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>

                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="rounded-lg border border-[#E9DED0] bg-[#FBF8F3] px-3 py-2.5 text-sm text-[#382B26] outline-none focus:border-[#C9826C] focus:ring-2 focus:ring-[#F8EDE6]"
                >
                  <option value="All">All Booking Plans</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {hasActiveFilters && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#A95643] transition hover:text-[#71392F]"
                  >
                    <X size={13} />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* RESERVATION TABLE */}
            <div className="overflow-hidden rounded-xl border border-[#E9DED0] bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-2 border-b border-[#E9DED0] px-4 py-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-sm font-bold text-[#382B26]">
                    Your Reservations
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#8F8175]">
                    Complete overview of your workspace bookings.
                  </p>
                </div>
                <span className="text-xs font-medium text-[#A99B8F]">
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
                <div className="px-4 py-12 text-center">
                  <Search size={27} className="mx-auto text-[#C7B9AC]" />
                  <h3 className="mt-3 text-sm font-bold text-[#382B26]">
                    No matching reservations
                  </h3>
                  <p className="mt-1 text-xs text-[#8F8175]">
                    Try changing your search or filter options.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 text-xs font-semibold text-[#A95643] hover:text-[#71392F]"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[1100px] border-collapse text-left">
                      <thead>
                        <tr className="bg-[#F8EDE6] text-[11px] uppercase tracking-wider text-[#8F8175]">
                          <th className="px-4 py-3 font-bold">#</th>
                          <th className="px-4 py-3 font-bold">
                            Booking Details
                          </th>
                          <th className="px-4 py-3 font-bold">Workspace</th>
                          <th className="px-4 py-3 font-bold">Plan</th>
                          <th className="px-4 py-3 font-bold">Schedule</th>
                          <th className="px-4 py-3 font-bold">Amount</th>
                          <th className="px-4 py-3 font-bold">Status</th>
                          <th className="px-4 py-3 font-bold">Payment</th>
                          <th className="px-4 py-3 text-center font-bold">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#F2E9E0]">
                        {paginatedReservations.map((reservation, index) => {
                          const displayStatus = getDisplayStatus(reservation);
                          const seatRows = getSeatRows(reservation);
                          const scheduleRows = getScheduleRows(reservation);

                          return (
                            <tr
                              key={reservation._id || reservation.bookingId}
                              className="transition hover:bg-[#FBF8F3]"
                            >
                              <td className="px-4 py-4 text-xs font-semibold text-[#A99B8F]">
                                {(safePage - 1) * ITEMS_PER_PAGE + index + 1}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-start gap-2.5">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                                    <Receipt size={16} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="max-w-[180px] break-all text-xs font-bold text-[#382B26]">
                                      {reservation.bookingId || "—"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#A99B8F]">
                                      {formatDate(reservation.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <p className="max-w-[170px] truncate text-xs font-bold text-[#382B26]">
                                  {reservation.spaceName || "Workspace"}
                                </p>
                                <div className="mt-1 flex items-center gap-1 text-[11px] text-[#8F8175]">
                                  <Armchair size={12} />
                                  {seatRows.length}{" "}
                                  {seatRows.length === 1 ? "Seat" : "Seats"}
                                </div>
                                {seatRows.length > 0 && (
                                  <p className="mt-1 max-w-[180px] truncate text-[11px] text-[#A95643]">
                                    {seatRows
                                      .map((seat) => seat.spaceCode)
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <span className="inline-flex rounded-md border border-[#E8C8BA] bg-[#F8EDE6] px-2.5 py-1 text-[11px] font-bold capitalize text-[#71392F]">
                                  {reservation.plan || "—"}
                                </span>
                                <p className="mt-1 text-[11px] text-[#8F8175]">
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

                              <td className="px-4 py-4">
                                <div className="space-y-1">
                                  {scheduleRows.map((row) => (
                                    <div
                                      key={row.label}
                                      className="text-[11px]"
                                    >
                                      <span className="text-[#A99B8F]">
                                        {row.label}:{" "}
                                      </span>
                                      <span className="font-semibold text-[#57473E]">
                                        {row.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <p className="whitespace-nowrap text-xs font-extrabold text-[#382B26]">
                                  {formatCurrency(reservation.totalAmount)}
                                </p>
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold ${getStatusStyle(displayStatus)}`}
                                >
                                  {getStatusIcon(displayStatus)}
                                  {displayStatus}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold ${getPaymentStyle(reservation.paymentStatus)}`}
                                >
                                  {reservation.paymentStatus || "Unknown"}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedReservation(reservation)
                                    }
                                    title="View booking details"
                                    aria-label="View booking details"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8C8BA] bg-[#F8EDE6] text-[#A95643] transition hover:bg-[#A95643] hover:text-white"
                                  >
                                    <Eye size={15} />
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
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#C9D8C4] bg-[#EAF0E6] text-[#527C61] transition hover:bg-[#527C61] hover:text-white"
                                      >
                                        <FileText size={15} />
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
                  <div className="flex flex-col justify-between gap-3 border-t border-[#E9DED0] bg-[#FBF8F3] px-4 py-3 sm:flex-row sm:items-center">
                    <p className="text-xs font-medium text-[#8F8175]">
                      Page {safePage} of {totalPages}
                    </p>

                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        disabled={safePage === 1}
                        onClick={() =>
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E9DED0] bg-white text-[#71392F] transition hover:border-[#C9826C] hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={16} />
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
                              <span className="px-1 text-[#A99B8F]">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={`h-8 min-w-8 rounded-lg px-2.5 text-xs font-bold transition ${
                                safePage === page
                                  ? "bg-[#A95643] text-white shadow-sm"
                                  : "border border-[#E9DED0] bg-white text-[#71392F] hover:border-[#C9826C] hover:bg-[#F8EDE6]"
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
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E9DED0] bg-white text-[#71392F] transition hover:border-[#C9826C] hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next page"
                      >
                        <ChevronRight size={16} />
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#382B26]/55 p-2.5 backdrop-blur-sm sm:p-4"
            onClick={() => setSelectedReservation(null)}
          >
            <div
              className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#71392F] to-[#A95643] px-4 py-4 text-white sm:px-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#F4D9CC]">
                    Reservation Details
                  </p>
                  <h2 className="mt-1.5 break-all text-base font-extrabold sm:text-lg">
                    {selectedReservation.bookingId || "Booking"}
                  </h2>
                  <p className="mt-1 text-[11px] text-[#F8EDE6]">
                    Created {formatDate(selectedReservation.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReservation(null)}
                  aria-label="Close booking details"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="max-h-[calc(92vh-80px)] space-y-4 overflow-y-auto p-4 sm:p-5">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyle(getDisplayStatus(selectedReservation))}`}
                  >
                    {getStatusIcon(getDisplayStatus(selectedReservation))}
                    {getDisplayStatus(selectedReservation)}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getPaymentStyle(selectedReservation.paymentStatus)}`}
                  >
                    Payment: {selectedReservation.paymentStatus || "Unknown"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#E9DED0] bg-[#FBF8F3] p-3">
                    <div className="flex items-center gap-2 text-[#A95643]">
                      <Building2 size={16} />
                      <h3 className="text-xs font-bold">Workspace</h3>
                    </div>
                    <p className="mt-2 text-sm font-extrabold text-[#382B26]">
                      {selectedReservation.spaceName || "Workspace"}
                    </p>
                    <p className="mt-1 text-[11px] text-[#8F8175]">
                      {getSeatRows(selectedReservation).length} seat(s) booked
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#E9DED0] bg-[#F8EDE6] p-3">
                    <div className="flex items-center gap-2 text-[#A95643]">
                      <CalendarDays size={16} />
                      <h3 className="text-xs font-bold">Booking Plan</h3>
                    </div>
                    <p className="mt-2 text-sm font-extrabold capitalize text-[#382B26]">
                      {selectedReservation.plan || "—"}
                    </p>
                    <p className="mt-1 text-[11px] text-[#8F8175]">
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

                <div className="rounded-xl border border-[#E9DED0] p-3">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Clock size={16} className="text-[#A95643]" />
                    <h3 className="text-xs font-bold text-[#382B26]">
                      Schedule
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {getScheduleRows(selectedReservation).map((row) => (
                      <div
                        key={row.label}
                        className="rounded-lg bg-[#FBF8F3] p-2.5"
                      >
                        <p className="text-[11px] text-[#A99B8F]">
                          {row.label}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#57473E]">
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#E9DED0] p-3">
                  <div className="mb-2.5 flex items-center gap-2">
                    <Users size={16} className="text-[#A95643]" />
                    <h3 className="text-xs font-bold text-[#382B26]">
                      Seat Assignments
                    </h3>
                  </div>

                  {getSeatRows(selectedReservation).length > 0 ? (
                    <div className="space-y-1.5">
                      {getSeatRows(selectedReservation).map((seat, index) => (
                        <div
                          key={`${seat.spaceCode || "seat"}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg bg-[#FBF8F3] px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <Armchair size={15} className="text-[#A95643]" />
                            <span className="text-xs font-bold text-[#382B26]">
                              {seat.spaceCode || "Seat"}
                            </span>
                          </div>
                          {seat.name && (
                            <span
                              className={`text-[11px] font-semibold ${seat.isSelf ? "text-[#A95643]" : "text-[#8F8175]"}`}
                            >
                              {seat.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#A99B8F]">
                      No seat details available.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-[#E8C8BA] bg-[#F8EDE6] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8F8175]">
                    Total Booking Amount
                  </p>
                  <p className="mt-1.5 text-xl font-extrabold text-[#71392F]">
                    {formatCurrency(selectedReservation.totalAmount)}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-[#E9DED0] pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-[#A99B8F]">
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
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A95643] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#71392F]"
                      >
                        <FileText size={15} />
                        View Invoice
                        <ArrowUpRight size={14} />
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-6 border-t border-[#E9DED0] pt-3 text-center">
          <p className="text-[11px] font-medium text-[#8F8175]">
            Your Space. Your People. Your Work.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reservations;
