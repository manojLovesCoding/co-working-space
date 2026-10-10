import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";


const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-green-100 text-green-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

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
          response.data?.message || "Failed to fetch reservations."
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
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Summary */}
        {!loading && !error && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Reservations</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {reservations.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Confirmed</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {
                  reservations.filter(
                    (item) =>
                      item.status?.toLowerCase() === "confirmed"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="mt-2 text-2xl font-bold text-yellow-600">
                {
                  reservations.filter(
                    (item) =>
                      item.status?.toLowerCase() === "pending"
                  ).length
                }
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
            <p className="mt-4 text-gray-500">
              Loading your reservations...
            </p>
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
            <CalendarDays
              size={44}
              className="mx-auto text-gray-400"
            />

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No reservations yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your workspace bookings will appear here once you make a reservation.
            </p>
          </div>
        )}

        {/* Reservation cards */}
        {!loading && !error && reservations.length > 0 && (
          <div className="space-y-5">
            {reservations.map((reservation) => (
              <div
                key={reservation._id || reservation.bookingId}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Booking ID
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {reservation.bookingId || "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        reservation.status
                      )}`}
                    >
                      {reservation.status || "Unknown"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        reservation.paymentStatus?.toLowerCase() === "paid"
                          ? "bg-green-100 text-green-700"
                          : reservation.paymentStatus?.toLowerCase() === "failed"
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
                      Selected seats:{" "}
                      {Array.isArray(reservation.selectedSpaces)
                        ? reservation.selectedSpaces.join(", ")
                        : "—"}
                    </p>
                  </div>

                  {/* Booking date and plan */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <CalendarDays size={17} />
                      <span className="text-sm">Booking Details</span>
                    </div>

                    <p className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">Date:</span>{" "}
                      {formatDate(reservation.bookingDate)}
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
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

                  {/* Time and amount */}
                  <div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock size={17} />
                      <span className="text-sm">Reservation Summary</span>
                    </div>

                    <p className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">Start:</span>{" "}
                      {formatDateTime(reservation.startAt)}
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      <span className="font-medium">End:</span>{" "}
                      {formatDateTime(reservation.endAt)}
                    </p>

                    <p className="mt-3 text-lg font-bold text-blue-700">
                      {formatCurrency(reservation.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                  <p className="text-xs text-gray-500">
                    Created: {formatDate(reservation.createdAt)}
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

export default Reservations;
