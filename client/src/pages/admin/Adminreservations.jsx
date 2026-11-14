import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios.js";

const ITEMS_PER_PAGE = 10;

// Bookings are made in India Standard Time, so always display in IST.
const TIME_ZONE = "Asia/Kolkata";

// Must match the 10 minute pending window used by the backend.
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

// endAt is exclusive, so subtract 1 ms to get the last booked day.
const getLastBookedDate = (endAt) => {
  const parsed = new Date(endAt);

  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getTime() - 1);
};

// An unpaid Pending booking older than the pending window is dead.
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

// Returns a single readable string for the schedule.
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

// One row per seat with the person it is booked for.
// Bookings made before seat assignments existed fall back to seat codes only.
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

const getPaymentStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const STATUS_FILTERS = ["All", "Confirmed", "Pending", "Expired", "Cancelled"];
const PLAN_FILTERS = ["All", "hourly", "daily", "monthly"];
const PAYMENT_FILTERS = ["All", "Paid", "Pending", "Failed"];

const selectClass =
  "border border-orange-400 rounded px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-orange-200 capitalize";

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

  /*
   * Fetch all reservations.
   */
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

  /*
   * Filter + search (includes the people the seats are booked for).
   */
  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();

    return reservations.filter((item) => {
      if (statusFilter !== "All" && getDisplayStatus(item) !== statusFilter) {
        return false;
      }

      if (planFilter !== "All" && item.plan !== planFilter) {
        return false;
      }

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
      ].some((field) => field?.toLowerCase().includes(value));
    });
  }, [reservations, search, statusFilter, planFilter, paymentFilter]);

  /*
   * Summary numbers.
   */
  const summary = useMemo(() => {
    const counts = { confirmed: 0, pending: 0, closed: 0 };
    let revenue = 0;

    reservations.forEach((item) => {
      const status = getDisplayStatus(item).toLowerCase();

      if (status === "confirmed") counts.confirmed += 1;
      else if (status === "pending") counts.pending += 1;
      else if (status === "cancelled" || status === "expired")
        counts.closed += 1;

      if (item.paymentStatus === "Paid") {
        revenue += Number(item.totalAmount) || 0;
      }
    });

    return { ...counts, revenue };
  }, [reservations]);

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
   * Filter handlers (reset to page 1).
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

  /*
   * Modal handlers.
   */
  const closeDetails = useCallback(() => setSelected(null), []);

  const selectedCustomer = selected ? getCustomer(selected) : null;
  const selectedStatus = selected ? getDisplayStatus(selected) : null;
  const selectedSeatRows = selected ? getSeatRows(selected) : [];

  return (
    <div className="p-6">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Reservations</h1>

          <p className="text-sm text-gray-500 mt-1">
            All customer workspace bookings
          </p>
        </div>

        <div className="text-sm text-gray-600">
          Total Reservations:{" "}
          <span className="font-semibold">{reservations.length}</span>
        </div>
      </div>

      {/* SUMMARY */}

      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow-sm rounded-lg p-4">
            <p className="text-sm text-gray-500">Confirmed</p>
            <p className="mt-1 text-2xl font-semibold text-green-600">
              {summary.confirmed}
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-yellow-600">
              {summary.pending}
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4">
            <p className="text-sm text-gray-500">Cancelled / Expired</p>
            <p className="mt-1 text-2xl font-semibold text-red-600">
              {summary.closed}
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4">
            <p className="text-sm text-gray-500">Revenue (Paid)</p>
            <p className="mt-1 text-2xl font-semibold text-orange-600">
              {formatCurrency(summary.revenue)}
            </p>
          </div>
        </div>
      )}

      {/* SEARCH + FILTERS */}

      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by booking ID, customer, seat holder, email, space or seat code..."
            className="flex-1 border border-orange-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
          />

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

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={fetchReservations}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading reservations...
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            {hasActiveFilters
              ? "No reservations match your search or filters."
              : "No reservations yet. Bookings will appear here once customers book a space."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-orange-50 border-b">
                  <th className="text-left p-3 text-sm font-semibold">#</th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Booking ID
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Customer
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Space &amp; Seat Holders
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">Plan</th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Schedule
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Amount
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Status
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Payment
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((item, index) => {
                  const customer = getCustomer(item);
                  const displayStatus = getDisplayStatus(item);
                  const seatRows = getSeatRows(item);

                  return (
                    <tr
                      key={item._id || item.bookingId}
                      className="border-b hover:bg-gray-50 align-top"
                    >
                      <td className="p-3 text-sm text-gray-600">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-orange-600 text-sm break-all">
                          {item.bookingId || "—"}
                        </span>

                        <div className="text-xs text-gray-400 mt-1">
                          {formatDateTime(item.createdAt)}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-sm">
                          {customer.name}
                        </div>

                        {customer.email && (
                          <div className="text-xs text-gray-400 mt-1">
                            {customer.email}
                          </div>
                        )}
                      </td>

                      <td className="p-3 min-w-48">
                        <div className="font-medium text-sm">
                          {item.spaceName || "—"}
                        </div>

                        {seatRows.length > 0 ? (
                          <div className="mt-1 space-y-0.5">
                            {seatRows.map((seat) => (
                              <div
                                key={seat.spaceCode}
                                className="text-xs text-gray-500"
                              >
                                <span className="font-semibold text-gray-700">
                                  {seat.spaceCode}
                                </span>
                                {seat.name && (
                                  <>
                                    {" "}
                                    – {seat.name}
                                    {seat.isSelf && (
                                      <span className="text-gray-400">
                                        {" "}
                                        (customer)
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 mt-1">—</div>
                        )}
                      </td>

                      <td className="p-3 text-sm capitalize">
                        {item.plan || "—"}

                        <div className="text-xs text-gray-400 mt-1 normal-case">
                          {getDurationLabel(item)}
                        </div>
                      </td>

                      <td className="p-3 text-sm min-w-48">
                        {getSchedule(item)}
                      </td>

                      <td className="p-3 text-sm font-semibold whitespace-nowrap">
                        {formatCurrency(item.totalAmount)}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            displayStatus,
                          )}`}
                        >
                          {displayStatus}
                        </span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPaymentStyle(
                            item.paymentStatus,
                          )}`}
                        >
                          {item.paymentStatus || "Unknown"}
                        </span>
                      </td>

                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="px-3 py-1.5 border border-orange-400 text-orange-500 rounded hover:bg-orange-50"
                        >
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
              </span>{" "}
              of <span className="font-medium">{filtered.length}</span>{" "}
              reservations
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`min-w-9 px-3 py-1.5 border rounded ${
                    currentPage === page
                      ? "bg-orange-500 text-white border-orange-500"
                      : "hover:bg-orange-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDetails}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-start p-5 border-b">
              <div>
                <h2 className="text-xl font-semibold">Reservation Details</h2>

                <p className="text-sm text-gray-500 mt-1 break-all">
                  <span className="font-medium text-orange-500">
                    {selected.bookingId}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                aria-label="Close"
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CUSTOMER */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Customer (booked by)
                </h3>

                <p className="font-medium">{selectedCustomer.name}</p>

                {selectedCustomer.email && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedCustomer.email}
                  </p>
                )}

                {selectedCustomer.phone && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedCustomer.phone}
                  </p>
                )}
              </div>

              {/* STATUS */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Status
                </h3>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                      selectedStatus,
                    )}`}
                  >
                    {selectedStatus}
                  </span>

                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPaymentStyle(
                      selected.paymentStatus,
                    )}`}
                  >
                    Payment: {selected.paymentStatus || "Unknown"}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-3">
                  Created: {formatDateTime(selected.createdAt)}
                </p>
              </div>

              {/* SPACE */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Space
                </h3>

                <p className="font-medium">{selected.spaceName || "—"}</p>

                <p className="text-sm text-gray-500 mt-1">
                  {selectedSeatRows.length}{" "}
                  {selectedSeatRows.length === 1 ? "seat" : "seats"}
                </p>
              </div>

              {/* SCHEDULE */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Schedule
                </h3>

                <p className="text-sm capitalize">
                  <span className="font-medium">Plan:</span>{" "}
                  {selected.plan || "—"}
                </p>

                <p className="text-sm mt-1">
                  <span className="font-medium">Duration:</span>{" "}
                  {getDurationLabel(selected)}
                </p>

                <p className="text-sm mt-1">
                  <span className="font-medium">When:</span>{" "}
                  {getSchedule(selected)}
                </p>
              </div>

              {/* SEAT HOLDERS */}

              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Seat Holders
                </h3>

                {selectedSeatRows.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-2 font-semibold">Seat</th>
                          <th className="text-left p-2 font-semibold">
                            Person
                          </th>
                          <th className="text-left p-2 font-semibold">Email</th>
                          <th className="text-left p-2 font-semibold">Phone</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedSeatRows.map((seat) => (
                          <tr
                            key={seat.spaceCode}
                            className="border-b last:border-b-0"
                          >
                            <td className="p-2 font-semibold text-orange-600">
                              {seat.spaceCode}
                            </td>

                            <td className="p-2">
                              {seat.name || "—"}
                              {seat.isSelf && (
                                <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                                  Customer
                                </span>
                              )}
                            </td>

                            <td className="p-2 text-gray-600 break-all">
                              {seat.email || "—"}
                            </td>

                            <td className="p-2 text-gray-600">
                              {seat.phone || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">—</p>
                )}
              </div>

              {/* AMOUNT */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Amount
                </h3>

                <p className="text-sm text-gray-600">
                  {formatCurrency(selected.pricePerUnit)} ×{" "}
                  {selected.duration ?? "—"} ×{" "}
                  {Array.isArray(selected.selectedSpaces)
                    ? selected.selectedSpaces.length
                    : "—"}
                </p>

                <p className="text-lg font-semibold text-orange-600 mt-1">
                  {formatCurrency(selected.totalAmount)}
                </p>
              </div>

              {/* RAZORPAY */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Razorpay
                </h3>

                <p className="text-sm break-all">
                  <span className="font-medium">Order:</span>{" "}
                  {selected.razorpayOrderId || "—"}
                </p>

                <p className="text-sm mt-1 break-all">
                  <span className="font-medium">Payment:</span>{" "}
                  {selected.razorpayPaymentId || "—"}
                </p>
              </div>
            </div>

            <div className="flex justify-end p-5 border-t bg-gray-50">
              <button
                type="button"
                onClick={closeDetails}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReservations;
