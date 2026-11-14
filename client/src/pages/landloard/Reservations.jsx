import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin, RefreshCw, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";

// Bookings are made in India Standard Time, so always display in IST
// no matter where the browser is.
const TIME_ZONE = "Asia/Kolkata";

// Must match the 10 minute pending window used by the backend.
const PENDING_EXPIRY_MS = 10 * 60 * 1000;

const formatDate = (date, timeZone = TIME_ZONE) => {
  if (!date) return "—";

  // bookingDate is a plain "YYYY-MM-DD" string: treat it as an IST date.
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

// endAt is exclusive (midnight after the last booked day),
// so subtract 1 ms to get the last day the customer can use the space.
const getLastBookedDate = (endAt) => {
  const parsed = new Date(endAt);

  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getTime() - 1);
};

// An unpaid Pending booking older than the pending window is dead:
// the backend no longer holds the seats for it.
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

// One row per seat with the person it is booked for.
// Bookings made before seat assignments existed fall back to seat codes only.
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
  ).map((code) => ({ spaceCode: code, name: "", isSelf: false }));
};

const getScheduleRows = (reservation) => {
  if (reservation.plan === "hourly") {
    return [
      { label: "Date", value: formatDate(reservation.bookingDate) },
      {
        label: "Time",
        // Older hourly bookings were saved without a time (full day).
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
    { label: "From", value: formatDate(reservation.startAt, zone) },
    { label: "To", value: lastDate ? formatDate(lastDate, zone) : "—" },
  ];
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

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              My Reservations
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              View and track your workspace bookings.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Summary */}
        {!loading && !error && (
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Reservations</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {reservations.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Confirmed</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {countByStatus("confirmed")}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="mt-2 text-2xl font-bold text-yellow-600">
                {countByStatus("pending")}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Cancelled / Expired</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {countByStatus("cancelled", "expired")}
              </p>
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
            <p className="mt-4 text-gray-500">Loading your reservations...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p className="font-medium text-red-600">
              Could not load reservations.
            </p>
            <p className="mt-2 text-sm text-gray-500">{error}</p>

            <button
              type="button"
              onClick={fetchReservations}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && reservations.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
            <CalendarDays size={44} className="mx-auto text-gray-400" />

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No reservations yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your workspace bookings will appear here once you make a
              reservation.
            </p>
          </div>
        )}

        {/* Reservation cards */}
        {!loading && !error && reservations.length > 0 && (
          <div className="space-y-5">
            {reservations.map((reservation) => {
              const displayStatus = getDisplayStatus(reservation);
              const seatRows = getSeatRows(reservation);

              return (
                <div
                  key={reservation._id || reservation.bookingId}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Booking ID
                      </p>

                      <p className="mt-1 break-all font-semibold text-gray-900">
                        {reservation.bookingId || "—"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          displayStatus,
                        )}`}
                      >
                        {displayStatus}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          reservation.paymentStatus?.toLowerCase() === "paid"
                            ? "bg-green-100 text-green-700"
                            : reservation.paymentStatus?.toLowerCase() ===
                                "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Payment: {reservation.paymentStatus || "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2 lg:grid-cols-3">
                    {/* Workspace */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin size={17} />
                        <span className="text-sm">Workspace</span>
                      </div>

                      <p className="mt-2 font-semibold text-gray-900">
                        {reservation.spaceName || "Workspace"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {seatRows.length}{" "}
                        {seatRows.length === 1 ? "seat" : "seats"}
                      </p>
                    </div>

                    {/* Plan and duration */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <CalendarDays size={17} />
                        <span className="text-sm">Booking Details</span>
                      </div>

                      <p className="mt-2 text-sm capitalize text-gray-700">
                        <span className="font-medium">Plan:</span>{" "}
                        {reservation.plan || "—"}
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        <span className="font-medium">Duration:</span>{" "}
                        {reservation.duration ?? "—"}{" "}
                        {reservation.plan === "hourly"
                          ? "hour(s)"
                          : reservation.plan === "daily"
                            ? "day(s)"
                            : reservation.plan === "monthly"
                              ? "month(s)"
                              : ""}
                      </p>
                    </div>

                    {/* Schedule and amount */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={17} />
                        <span className="text-sm">Reservation Summary</span>
                      </div>

                      {getScheduleRows(reservation).map((row) => (
                        <p
                          key={row.label}
                          className="mt-2 text-sm text-gray-700 first:mt-2 [&:not(:first-of-type)]:mt-1"
                        >
                          <span className="font-medium">{row.label}:</span>{" "}
                          {row.value}
                        </p>
                      ))}

                      <p className="mt-3 text-lg font-bold text-blue-700">
                        {formatCurrency(reservation.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Seats and who they are booked for */}
                  <div className="border-t border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users size={17} />
                      <span className="text-sm">Seats</span>
                    </div>

                    {seatRows.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {seatRows.map((seat) => (
                          <div
                            key={seat.spaceCode}
                            className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                          >
                            <span className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                              {seat.spaceCode}
                            </span>

                            {seat.name && (
                              <span
                                className={`text-sm ${
                                  seat.isSelf
                                    ? "font-semibold text-blue-700"
                                    : "text-gray-700"
                                }`}
                              >
                                {seat.name}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">—</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                    <p className="text-xs text-gray-500">
                      Created: {formatDate(reservation.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservations;
