import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  CalendarDays,
  Users,
  CheckCircle2,
  Clock3,
  XCircle,
  IndianRupee,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  CreditCard,
  UserRound,
  Mail,
  Phone,
  Armchair,
  CalendarClock,
  ShieldCheck,
  ClipboardList,
  RotateCcw,
} from "lucide-react";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios.js";

const ITEMS_PER_PAGE = 10;
const TIME_ZONE = "Asia/Kolkata";
const PENDING_EXPIRY_MS = 10 * 60 * 1000;

/* ---------- formatting helpers ---------- */

const formatDate = (date, timeZone = TIME_ZONE) => {
  if (!date) return "—";

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00+05:30`)
    : new Date(date);

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

/* ---------- booking helpers ---------- */

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

const getSchedule = (reservation) => {
  if (reservation.plan === "hourly") {
    const date = formatDate(reservation.bookingDate);

    return reservation.startTime
      ? `${date}, ${formatTime(reservation.startTime)} - ${formatTime(
          reservation.endTime,
        )}`
      : `${date}, Full day`;
  }

  const lastDate = getLastBookedDate(reservation.endAt);
  const zone = isLegacyMidnight(reservation.startAt) ? "UTC" : TIME_ZONE;

  return `${formatDate(reservation.startAt, zone)} to ${
    lastDate ? formatDate(lastDate, zone) : "—"
  }`;
};

const getDurationLabel = (reservation) => {
  const unit =
    reservation.plan === "hourly"
      ? "hour(s)"
      : reservation.plan === "daily"
        ? "day(s)"
        : reservation.plan === "monthly"
          ? "month(s)"
          : "";

  return `${reservation.duration ?? "—"} ${unit}`.trim();
};

const getCustomer = (reservation) => {
  const user = reservation.user;

  if (user && typeof user === "object") {
    return {
      name: user.name || "Unnamed customer",
      email: user.email || "",
      phone: user.phone || "",
    };
  }

  return { name: "Deleted user", email: "", phone: "" };
};

const getSeatRows = (reservation) => {
  const assignments = Array.isArray(reservation.seatAssignments)
    ? reservation.seatAssignments
    : [];

  if (assignments.length > 0) {
    return assignments.map((item) => ({
      spaceCode: item.spaceCode,
      name: item.name || "",
      email: item.email || "",
      phone: item.phone || "",
      isSelf: item.assigneeType === "self",
    }));
  }

  return (
    Array.isArray(reservation.selectedSpaces) ? reservation.selectedSpaces : []
  ).map((code) => ({
    spaceCode: code,
    name: "",
    email: "",
    phone: "",
    isSelf: false,
  }));
};

/* ---------- styles ---------- */

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "border border-emerald-100 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border border-amber-100 bg-amber-50 text-amber-700";
    case "cancelled":
      return "border border-red-100 bg-red-50 text-red-700";
    case "expired":
      return "border border-orange-100 bg-orange-50 text-orange-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-600";
  }
};

const getPaymentStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "border border-emerald-100 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border border-red-100 bg-red-50 text-red-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-600";
  }
};

const STATUS_FILTERS = ["All", "Confirmed", "Pending", "Expired", "Cancelled"];
const PLAN_FILTERS = ["All", "hourly", "daily", "monthly"];
const PAYMENT_FILTERS = ["All", "Paid", "Pending", "Failed"];

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

/* ---------- reusable components ---------- */

const SummaryCard = ({ title, value, subtitle, icon: Icon, iconClass }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={21} />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status, payment = false }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
      payment ? getPaymentStyle(status) : getStatusStyle(status)
    }`}
  >
    {status || "Unknown"}
  </span>
);

const DetailItem = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
    {Icon && (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
        <Icon size={17} />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  </div>
);

/* ---------- component ---------- */

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [selected, setSelected] = useState(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/booking/all_reservations");

      if (response.data?.success) {
        setReservations(response.data.reservations || []);
      } else {
        toast.error(response.data?.message || "Failed to load reservations");
      }
    } catch (error) {
      console.error("Fetch reservations error:", error);
      toast.error(
        error.response?.data?.message || "Failed to load reservations",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  /* ---------- search and filters ---------- */

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();

    return reservations.filter((item) => {
      if (statusFilter !== "All" && getDisplayStatus(item) !== statusFilter) {
        return false;
      }

      if (planFilter !== "All" && item.plan !== planFilter) return false;
      if (paymentFilter !== "All" && item.paymentStatus !== paymentFilter) {
        return false;
      }

      if (!value) return true;

      const customer = getCustomer(item);
      const seatFields = getSeatRows(item).flatMap((seat) => [
        seat.spaceCode,
        seat.name,
        seat.email,
        seat.phone,
      ]);

      return [
        item.bookingId,
        item.spaceName,
        customer.name,
        customer.email,
        customer.phone,
        ...(Array.isArray(item.selectedSpaces) ? item.selectedSpaces : []),
        ...seatFields,
      ].some((field) =>
        String(field ?? "")
          .toLowerCase()
          .includes(value),
      );
    });
  }, [reservations, search, statusFilter, planFilter, paymentFilter]);

  /* ---------- summary ---------- */

  const summary = useMemo(() => {
    const counts = { confirmed: 0, pending: 0, closed: 0 };
    let revenue = 0;

    reservations.forEach((item) => {
      const status = getDisplayStatus(item).toLowerCase();

      if (status === "confirmed") counts.confirmed += 1;
      else if (status === "pending") counts.pending += 1;
      else if (status === "cancelled" || status === "expired") {
        counts.closed += 1;
      }

      if (item.paymentStatus === "Paid") {
        revenue += Number(item.totalAmount) || 0;
      }
    });

    return { ...counts, revenue };
  }, [reservations]);

  /* ---------- pagination ---------- */

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

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

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
    search ||
    statusFilter !== "All" ||
    planFilter !== "All" ||
    paymentFilter !== "All";

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("All");
    setPlanFilter("All");
    setPaymentFilter("All");
    setCurrentPage(1);
  }, []);

  /* ---------- modal ---------- */

  const closeDetails = useCallback(() => setSelected(null), []);

  const selectedCustomer = selected ? getCustomer(selected) : null;
  const selectedStatus = selected ? getDisplayStatus(selected) : null;
  const selectedSeatRows = selected ? getSeatRows(selected) : [];

  return (
    <div className="min-h-screen bg-[#EAF4FF] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* PAGE HEADER */}
        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
              <ClipboardList size={16} />
              <span>Oorza Admin Portal</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">Reservations</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Reservation Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor customer bookings, workspace schedules and payments.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh Reservations
          </button>
        </div>

        {/* HERO BANNER */}
        <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 shadow-xl shadow-blue-900/10 sm:p-8">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-1/4 h-64 w-64 rounded-full bg-indigo-300/20" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-100">
                <ShieldCheck size={17} />
                Admin Overview
              </div>
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                Workspace Bookings
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                Keep track of reservations, customer seat assignments and
                payment activity from one place.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
                <CalendarDays size={23} />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-100">
                  Total Reservations
                </p>
                <p className="text-2xl font-extrabold text-white">
                  {reservations.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Confirmed Bookings"
            value={summary.confirmed}
            subtitle="Successfully confirmed"
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
          />
          <SummaryCard
            title="Pending Bookings"
            value={summary.pending}
            subtitle="Awaiting confirmation"
            icon={Clock3}
            iconClass="bg-amber-50 text-amber-600"
          />
          <SummaryCard
            title="Cancelled / Expired"
            value={summary.closed}
            subtitle="Closed reservations"
            icon={XCircle}
            iconClass="bg-red-50 text-red-600"
          />
          <SummaryCard
            title="Paid Revenue"
            value={formatCurrency(summary.revenue)}
            subtitle="Total successful payments"
            icon={IndianRupee}
            iconClass="bg-blue-50 text-blue-600"
          />
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Filter size={17} />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Find Reservations
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-400 sm:ml-11">
                Search bookings and narrow results using filters.
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-50 sm:self-center"
              >
                <RotateCcw size={14} />
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search booking, customer, seat..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

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

            <select
              value={paymentFilter}
              onChange={handleFilter(setPaymentFilter)}
              className={selectClass}
              aria-label="Filter by payment"
            >
              {PAYMENT_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All payments" : `Payment: ${option}`}
                </option>
              ))}
            </select>

            <select
              value={planFilter}
              onChange={handleFilter(setPlanFilter)}
              className={selectClass}
              aria-label="Filter by plan"
            >
              {PLAN_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All plans" : option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-6">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {filtered.length}
              </span>{" "}
              matching reservations
            </p>
            <p className="text-xs text-slate-400">
              All booking times displayed in Indian Standard Time
            </p>
          </div>
        </div>

        {/* RESERVATIONS TABLE */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                All Reservations
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Review booking information and customer details.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
              <ClipboardList size={15} />
              {filtered.length} Results
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center px-5 py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <RefreshCw size={25} className="animate-spin text-blue-600" />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-700">
                Loading reservations...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Please wait while we fetch booking details.
              </p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-400">
                <CalendarDays size={30} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-800">
                {hasActiveFilters
                  ? "No matching reservations"
                  : "No reservations yet"}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? "Try changing your search term or clearing some filters to see more results."
                  : "Customer workspace bookings will appear here once reservations are made."}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#F5F9FF]">
                    {[
                      "#",
                      "Booking Details",
                      "Customer",
                      "Workspace & Seats",
                      "Plan",
                      "Schedule",
                      "Amount",
                      "Status",
                      "Payment",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-4 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginated.map((item, index) => {
                    const customer = getCustomer(item);
                    const displayStatus = getDisplayStatus(item);
                    const seatRows = getSeatRows(item);

                    return (
                      <tr
                        key={item._id || item.bookingId}
                        className="align-top transition hover:bg-[#F8FBFF]"
                      >
                        <td className="px-4 py-5 text-sm font-semibold text-slate-400">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>

                        <td className="px-4 py-5">
                          <p className="max-w-[150px] break-all text-sm font-extrabold text-blue-700">
                            {item.bookingId || "—"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex items-start gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <UserRound size={15} />
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[160px] truncate text-sm font-bold text-slate-800">
                                {customer.name}
                              </p>
                              {customer.email && (
                                <p className="mt-1 max-w-[160px] break-all text-xs text-slate-400">
                                  {customer.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <p className="max-w-[170px] text-sm font-bold text-slate-800">
                            {item.spaceName || "—"}
                          </p>
                          {seatRows.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {seatRows.map((seat, seatIndex) => (
                                <div
                                  key={`${seat.spaceCode}-${seatIndex}`}
                                  className="text-xs text-slate-500"
                                >
                                  <span className="font-bold text-blue-700">
                                    {seat.spaceCode}
                                  </span>
                                  {seat.name && (
                                    <span>
                                      {" "}
                                      · {seat.name}
                                      {seat.isSelf && " (customer)"}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-slate-400">
                              No seats
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-5">
                          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold capitalize text-indigo-700">
                            {item.plan || "—"}
                          </span>
                          <p className="mt-2 text-xs text-slate-400">
                            {getDurationLabel(item)}
                          </p>
                        </td>

                        <td className="max-w-[200px] px-4 py-5 text-sm leading-6 text-slate-600">
                          {getSchedule(item)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-5 text-sm font-extrabold text-slate-800">
                          {formatCurrency(item.totalAmount)}
                        </td>

                        <td className="px-4 py-5">
                          <StatusBadge status={displayStatus} />
                        </td>

                        <td className="px-4 py-5">
                          <StatusBadge
                            status={item.paymentStatus || "Unknown"}
                            payment
                          />
                        </td>

                        <td className="px-4 py-5">
                          <button
                            type="button"
                            onClick={() => setSelected(item)}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-500 hover:bg-blue-50"
                          >
                            <Eye size={15} />
                            View
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
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-800">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-800">
                  {filtered.length}
                </span>{" "}
                reservations
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={`min-w-9 rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      currentPage === page
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-6 pb-3 text-center">
          <p className="text-xs font-medium tracking-wide text-slate-400">
            OORZA · Your Space. Your People. Your Work.
          </p>
        </div>
      </div>

      {/* RESERVATION DETAILS MODAL */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
          onClick={closeDetails}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-modal-title"
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-6 sm:px-8">
              <div className="absolute -right-10 -top-20 h-48 w-48 rounded-full bg-white/10" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-100">
                    <ClipboardList size={15} />
                    Reservation Information
                  </div>
                  <h2
                    id="reservation-modal-title"
                    className="text-xl font-extrabold text-white sm:text-2xl"
                  >
                    Reservation Details
                  </h2>
                  <p className="mt-2 break-all text-sm font-semibold text-blue-100">
                    Booking ID: {selected.bookingId || "—"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close details"
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 sm:p-7">
              {/* Status Overview */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-[#F5F9FF] p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Booking Status
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={selectedStatus} />
                    <StatusBadge
                      status={selected.paymentStatus || "Unknown"}
                      payment
                    />
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Created On
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {formatDateTime(selected.createdAt)}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Customer"
                  value={selectedCustomer.name}
                  icon={UserRound}
                />
                <DetailItem
                  label="Email Address"
                  value={selectedCustomer.email}
                  icon={Mail}
                />
                <DetailItem
                  label="Phone Number"
                  value={selectedCustomer.phone}
                  icon={Phone}
                />
                <DetailItem
                  label="Workspace"
                  value={selected.spaceName}
                  icon={Building2}
                />
                <DetailItem
                  label="Booking Plan"
                  value={selected.plan}
                  icon={CalendarDays}
                />
                <DetailItem
                  label="Duration"
                  value={getDurationLabel(selected)}
                  icon={CalendarClock}
                />
                <DetailItem
                  label="Schedule"
                  value={getSchedule(selected)}
                  icon={Clock3}
                />
                <DetailItem
                  label="Total Amount"
                  value={formatCurrency(selected.totalAmount)}
                  icon={IndianRupee}
                />
              </div>

              {/* Seat Holders */}
              <div className="mt-7">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                      <Armchair size={18} className="text-blue-600" />
                      Seat Assignments
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      People assigned to this reservation.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    {selectedSeatRows.length}{" "}
                    {selectedSeatRows.length === 1 ? "Seat" : "Seats"}
                  </span>
                </div>

                {selectedSeatRows.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-[#F5F9FF]">
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Seat
                          </th>
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Person
                          </th>
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Email
                          </th>
                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Phone
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {selectedSeatRows.map((seat, index) => (
                          <tr key={`${seat.spaceCode}-${index}`}>
                            <td className="px-4 py-3 font-extrabold text-blue-700">
                              {seat.spaceCode || "—"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-700">
                              {seat.name || "—"}
                              {seat.isSelf && (
                                <span className="ml-2 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                  Customer
                                </span>
                              )}
                            </td>
                            <td className="break-all px-4 py-3 text-slate-500">
                              {seat.email || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {seat.phone || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                    No seat assignments available.
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="mt-7">
                <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <CreditCard size={18} className="text-blue-600" />
                  Payment Information
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    label="Price Per Unit"
                    value={formatCurrency(selected.pricePerUnit)}
                    icon={IndianRupee}
                  />
                  <DetailItem
                    label="Total Paid / Amount"
                    value={formatCurrency(selected.totalAmount)}
                    icon={CheckCircle2}
                  />
                  <DetailItem
                    label="Razorpay Order ID"
                    value={selected.razorpayOrderId}
                    icon={CreditCard}
                  />
                  <DetailItem
                    label="Razorpay Payment ID"
                    value={selected.razorpayPaymentId}
                    icon={ShieldCheck}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700"
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

export default AdminReservations;
