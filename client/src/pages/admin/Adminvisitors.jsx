import { useCallback, useEffect, useMemo, useState } from "react";

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
const PAYMENT_FILTERS = ["All", "Paid", "Pending", "Failed"];

const selectClass =
  "border border-orange-400 rounded px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-orange-200";

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

      toast.error(
        error.response?.data?.message || "Failed to load visitors"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Attach the display status once so filters, counts and rows agree.
  const rows = useMemo(
    () =>
      visitors.map((visitor) => ({
        ...visitor,
        displayStatus: getDisplayStatus(visitor),
      })),
    [visitors]
  );

  /*
   * Summary numbers.
   */
  const summary = useMemo(() => {
    const confirmed = rows.filter(
      (item) => item.displayStatus === "Confirmed"
    );

    return {
      confirmed: confirmed.length,
      pending: rows.filter((item) => item.displayStatus === "Pending")
        .length,
      attendees: confirmed.reduce(
        (sum, item) => sum + (Number(item.attendees) || 0),
        0
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
      ].some((field) => field?.toLowerCase().includes(value));
    });
  }, [rows, search, statusFilter, paymentFilter]);

  /*
   * Pagination.
   */
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / ITEMS_PER_PAGE)
  );

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
    [totalPages]
  );

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
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
    []
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
    <div className="p-6">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Visitors</h1>

          <p className="text-sm text-gray-500 mt-1">
            All visitor passes invited by customers
          </p>
        </div>

        <div className="text-sm text-gray-600">
          Total Visitors:{" "}
          <span className="font-semibold">{visitors.length}</span>
        </div>
      </div>

      {/* SUMMARY */}

      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow-sm rounded-lg p-4">
            <p className="text-sm text-gray-500">Confirmed Passes</p>
            <p className="mt-1 text-2xl font-semibold text-green-600">
              {summary.confirmed}
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4">
            <p className="text-sm text-gray-500">Pending Passes</p>
            <p className="mt-1 text-2xl font-semibold text-yellow-600">
              {summary.pending}
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4">
            <p className="text-sm text-gray-500">Confirmed Attendees</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {summary.attendees}
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
            placeholder="Search by visitor, contact, company, customer, visit ID or booking ID..."
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
            onClick={fetchVisitors}
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
            Loading visitors...
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            {hasActiveFilters
              ? "No visitors match your search or filters."
              : "No visitors yet. Passes will appear here once customers invite visitors."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-orange-50 border-b">
                  <th className="text-left p-3 text-sm font-semibold">#</th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Visit ID
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Visitor
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Invited By
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Booking
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">
                    Attendees
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

                  return (
                    <tr
                      key={item._id || item.visitId}
                      className="border-b hover:bg-gray-50 align-top"
                    >
                      <td className="p-3 text-sm text-gray-600">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-orange-600 text-sm break-all">
                          {item.visitId || "—"}
                        </span>

                        <div className="text-xs text-gray-400 mt-1">
                          {formatDateTime(item.createdAt)}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-sm">
                          {item.name || "—"}
                        </div>

                        <div className="text-xs text-gray-400 mt-1">
                          {item.contact || "—"}
                        </div>

                        {item.companyName && (
                          <div className="text-xs text-gray-400">
                            {item.companyName}
                          </div>
                        )}
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

                      <td className="p-3 text-sm min-w-48">
                        <div className="font-medium">
                          {item.spaceName || "—"}
                        </div>

                        <div className="text-xs text-gray-400 mt-1">
                          {Array.isArray(item.selectedSpaces) &&
                          item.selectedSpaces.length > 0
                            ? item.selectedSpaces.join(", ")
                            : "—"}
                        </div>

                        <div className="text-xs text-gray-400">
                          {formatBookingWindow(
                            item.bookingStartAt,
                            item.bookingEndAt
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-sm">{item.attendees ?? "—"}</td>

                      <td className="p-3 text-sm font-semibold whitespace-nowrap">
                        {formatCurrency(item.totalAmount)}

                        <div className="text-xs font-normal text-gray-400">
                          incl. GST
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            item.displayStatus
                          )}`}
                        >
                          {item.displayStatus}
                        </span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPaymentStyle(
                            item.paymentStatus
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
              visitors
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
                <h2 className="text-xl font-semibold">Visitor Details</h2>

                <p className="text-sm text-gray-500 mt-1 break-all">
                  <span className="font-medium text-orange-500">
                    {selected.visitId}
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
              {/* VISITOR */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Visitor
                </h3>

                <p className="font-medium">{selected.name || "—"}</p>

                <p className="text-sm text-gray-500 mt-1">
                  {selected.attendees}{" "}
                  {selected.attendees === 1 ? "attendee" : "attendees"}
                </p>

                <p className="text-sm text-gray-700 mt-2">
                  {selected.contact || "—"}
                </p>

                {selected.email && (
                  <p className="text-sm text-gray-700 mt-1 break-all">
                    {selected.email}
                  </p>
                )}

                {selected.companyName && (
                  <p className="text-sm text-gray-700 mt-1">
                    {selected.companyName}
                  </p>
                )}
              </div>

              {/* INVITED BY */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Invited By
                </h3>

                <p className="font-medium">{selectedCustomer.name}</p>

                {selectedCustomer.email && (
                  <p className="text-sm text-gray-500 mt-1 break-all">
                    {selectedCustomer.email}
                  </p>
                )}

                {selectedCustomer.phone && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedCustomer.phone}
                  </p>
                )}

                <p className="text-sm text-gray-500 mt-3">
                  Invited: {formatDateTime(selected.createdAt)}
                </p>
              </div>

              {/* BOOKING */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Workspace Booking
                </h3>

                <p className="font-medium">{selected.spaceName || "—"}</p>

                <p className="text-sm text-gray-500 mt-1">
                  Seats:{" "}
                  {Array.isArray(selected.selectedSpaces) &&
                  selected.selectedSpaces.length > 0
                    ? selected.selectedSpaces.join(", ")
                    : "—"}
                </p>

                <p className="text-sm text-gray-700 mt-2">
                  {formatBookingWindow(
                    selected.bookingStartAt,
                    selected.bookingEndAt
                  )}
                </p>

                <p className="text-xs text-gray-400 mt-1 break-all">
                  {selected.bookingId}
                </p>
              </div>

              {/* STATUS */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Status
                </h3>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                      selected.displayStatus
                    )}`}
                  >
                    {selected.displayStatus}
                  </span>

                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPaymentStyle(
                      selected.paymentStatus
                    )}`}
                  >
                    Payment: {selected.paymentStatus || "Unknown"}
                  </span>
                </div>
              </div>

              {/* FEE */}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Visitor Fee
                </h3>

                <p className="text-sm text-gray-600">
                  {formatCurrency(selected.hourlyRate)} / hr ×{" "}
                  {selected.visitHours} hr × {selected.attendees}
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  Subtotal: {formatCurrency(selected.subtotal)}
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  GST (18%): {formatCurrency(selected.gstAmount)}
                </p>

                <p className="text-lg font-semibold text-orange-600 mt-2">
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

              {/* REASON */}

              {selected.reason && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Reason for Visit
                  </h3>

                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {selected.reason}
                  </p>
                </div>
              )}
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

export default AdminVisitors;