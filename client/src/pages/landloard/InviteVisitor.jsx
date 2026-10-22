import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  LoaderCircle,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";

// ---------------------------------------------
// Constants
// ---------------------------------------------

const GST_RATE = 0.18;
const MAX_ATTENDEES = 20;
const MAX_HOURS = 12;
const MAX_REASON_LENGTH = 300;

const TIME_ZONE = "Asia/Kolkata";

const EMPTY_FORM = {
  bookingId: "",
  attendees: "1",
  visitHours: "1",
  name: "",
  contact: "",
  email: "",
  reason: "",
};

// ---------------------------------------------
// Helpers
// ---------------------------------------------

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const formatMoney = (amount) =>
  `₹${round2(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date, timeZone = TIME_ZONE) => {
  if (!date) return "";

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00+05:30`)
    : new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
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

const getBookingLabel = (booking) => {
  const seats = Array.isArray(booking.selectedSpaces)
    ? booking.selectedSpaces.join(", ")
    : "";

  let when;

  if (booking.plan === "hourly" && booking.startTime) {
    when = `${formatDate(booking.bookingDate)}, ${formatTime(
      booking.startTime,
    )} - ${formatTime(booking.endTime)}`;
  } else if (booking.plan === "hourly") {
    when = formatDate(booking.bookingDate);
  } else {
    const lastDate = getLastBookedDate(booking.endAt);
    const zone = isLegacyMidnight(booking.startAt) ? "UTC" : TIME_ZONE;
    const first = formatDate(booking.startAt, zone);
    const last = lastDate ? formatDate(lastDate, zone) : "";

    when = !last || first === last ? first : `${first} to ${last}`;
  }

  const planBadge = booking.plan ? ` [${booking.plan.toUpperCase()}]` : "";
  return `${booking.spaceName || "Workspace"}${seats ? ` (${seats})` : ""}${planBadge} — ${when}`;
};

const validateForm = (form) => {
  const errors = {};

  if (!form.bookingId) {
    errors.bookingId = "Please select a booking.";
  }

  const attendees = Number(form.attendees);
  if (
    !Number.isInteger(attendees) ||
    attendees < 1 ||
    attendees > MAX_ATTENDEES
  ) {
    errors.attendees = `Enter between 1 and ${MAX_ATTENDEES} attendees.`;
  }

  const hours = Number(form.visitHours);
  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_HOURS) {
    errors.visitHours = `Enter between 1 and ${MAX_HOURS} hours.`;
  }

  if (form.name.trim().length < 2) {
    errors.name = "Please enter the visitor's name.";
  }

  if (!/^[6-9]\d{9}$/.test(form.contact)) {
    errors.contact = "Enter a valid 10-digit mobile number.";
  }

  if (
    form.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  ) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
};

const inputClass = (hasError) =>
  `w-full rounded-lg border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
  }`;

// ---------------------------------------------
// Component
// ---------------------------------------------

export default function InviteVisitor() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmedVisit, setConfirmedVisit] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      setLoadError("");

      const response = await api.get("/visitor/upcoming_bookings");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to load your bookings.",
        );
      }

      const now = Date.now();
      const upcoming = (response.data.bookings || []).filter(
        (booking) => new Date(booking.endAt).getTime() > now,
      );

      setBookings(upcoming);
      setCompanyName(response.data.companyName || "");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to load your bookings.";

      setLoadError(message);
      toast.error(message);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const selectedBooking = useMemo(
    () => bookings.find((item) => item.bookingId === form.bookingId),
    [bookings, form.bookingId],
  );

  // Pricing based strictly on workspace hourly rate
  const pricing = useMemo(() => {
    const attendees = Number.parseInt(form.attendees, 10) || 0;
    const hours = Number.parseInt(form.visitHours, 10) || 0;
    const rate = Number(selectedBooking?.hourlyRate) || 0;

    const subtotal = round2(rate * hours * attendees);
    const gst = round2(subtotal * GST_RATE);
    const total = round2(subtotal + gst);

    return { attendees, rate, hours, subtotal, gst, total };
  }, [selectedBooking, form.attendees, form.visitHours]);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));

    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setConfirmedVisit(null);
    fetchBookings();
  };

  const handlePay = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    if (!selectedBooking) {
      toast.error("Please select a booking.");
      return;
    }

    setSubmitting(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout. Please try again.");
      }

      const orderResponse = await api.post("/visitor/create_razorpay_order", {
        bookingId: form.bookingId,
        attendees: Number(form.attendees),
        visitHours: Number(form.visitHours),
        name: form.name.trim(),
        contact: form.contact,
        email: form.email.trim(),
        reason: form.reason.trim(),
      });

      const order = orderResponse.data;

      if (
        !order?.success ||
        !order.orderId ||
        !order.keyId ||
        !order.visitId ||
        !Number.isFinite(Number(order.amount))
      ) {
        throw new Error(
          order?.message || "Could not create the payment order.",
        );
      }

      const options = {
        key: order.keyId,
        amount: Number(order.amount),
        currency: order.currency || "INR",
        name: "Visitor Pass",
        description: `${pricing.attendees} visitor(s) for ${pricing.hours} hr(s) - ${
          selectedBooking.spaceName || "Workspace"
        }`,
        order_id: order.orderId,
        prefill: {
          name: form.name.trim(),
          email: form.email.trim(),
          contact: form.contact,
        },

        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await api.post("/visitor/confirm_payment", {
              visitId: order.visitId,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            });

            if (!verifyResponse.data?.success) {
              throw new Error(
                verifyResponse.data?.message || "Payment verification failed.",
              );
            }

            setConfirmedVisit({
              visitId: verifyResponse.data.visit?.visitId || order.visitId,
              name: form.name.trim(),
              attendees: pricing.attendees,
              visitHours: pricing.hours,
              total: pricing.total,
              bookingLabel: getBookingLabel(selectedBooking),
            });

            toast.success("Payment verified and visitor invited!");
          } catch (error) {
            console.error("Visitor verification error:", error);
            toast.error(
              error.response?.data?.message ||
                error.message ||
                "Payment verification failed. Contact support before paying again.",
            );
          } finally {
            setSubmitting(false);
          }
        },

        modal: {
          ondismiss: () => {
            setSubmitting(false);
            toast("Payment window closed.");
          },
        },

        theme: { color: "#2563eb" },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);
        toast.error(
          response.error?.description || "Payment failed. Please try again.",
        );
        setSubmitting(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Visitor checkout error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to start payment.",
      );
      setSubmitting(false);
    }
  };

  // ---------------------------------------------
  // Confirmation screen
  // ---------------------------------------------

  if (confirmedVisit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
          <CheckCircle2 size={56} className="mx-auto text-green-600" />

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Visitor Pass Confirmed!
          </h1>

          <p className="mt-3 text-gray-600">
            Your payment was verified and the visitor pass has been issued.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
            <p className="text-sm text-gray-500">Visit ID</p>
            <p className="mt-1 break-all font-semibold text-gray-900">
              {confirmedVisit.visitId}
            </p>

            <p className="mt-4 text-sm text-gray-500">Visitor</p>
            <p className="mt-1 font-medium text-gray-900">
              {confirmedVisit.name} ({confirmedVisit.attendees}{" "}
              {confirmedVisit.attendees === 1 ? "attendee" : "attendees"},{" "}
              {confirmedVisit.visitHours}{" "}
              {confirmedVisit.visitHours === 1 ? "hour" : "hours"})
            </p>

            <p className="mt-4 text-sm text-gray-500">Workspace Booking</p>
            <p className="mt-1 font-medium text-gray-900">
              {confirmedVisit.bookingLabel}
            </p>

            <p className="mt-4 text-sm text-gray-500">Amount paid</p>
            <p className="mt-1 font-medium text-gray-900">
              {formatMoney(confirmedVisit.total)}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Invite Another Visitor
            </button>

            <button
              type="button"
              onClick={() => navigate("/customer")}
              className="flex-1 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // Main Form UI
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserPlus size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invite a Visitor
            </h1>
            <p className="text-sm text-gray-500">
              Invite visitors to your booked workspace at the standard hourly
              rate.
            </p>
          </div>
        </div>

        {loadingBookings && (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <RefreshCw
              size={32}
              className="mx-auto animate-spin text-blue-600"
            />
            <p className="mt-4 text-gray-500">Loading your bookings...</p>
          </div>
        )}

        {!loadingBookings && loadError && (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p className="font-medium text-red-600">
              Could not load your bookings.
            </p>
            <p className="mt-2 text-sm text-gray-500">{loadError}</p>

            <button
              type="button"
              onClick={fetchBookings}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!loadingBookings && !loadError && bookings.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No upcoming bookings
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              You need a confirmed workspace booking before you can invite a
              visitor.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Book a Space
            </button>
          </div>
        )}

        {!loadingBookings && !loadError && bookings.length > 0 && (
          <form
            onSubmit={handlePay}
            noValidate
            className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
          >
            {/* Booking selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Your Active Workspace Booking{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                value={form.bookingId}
                onChange={(event) =>
                  updateField("bookingId", event.target.value)
                }
                disabled={submitting}
                className={inputClass(Boolean(errors.bookingId))}
              >
                <option value="">-- Select an Upcoming Booking --</option>
                {bookings.map((booking) => (
                  <option key={booking.bookingId} value={booking.bookingId}>
                    {getBookingLabel(booking)}
                  </option>
                ))}
              </select>

              {errors.bookingId ? (
                <p className="mt-1 text-xs text-red-600">{errors.bookingId}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Visitors are billed by the workspace hourly catalog rate (
                  {selectedBooking
                    ? `${formatMoney(selectedBooking.hourlyRate)}/hr`
                    : "select a space to see rate"}
                  ).
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Number of Attendees */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Number of Attendees <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  min={1}
                  max={MAX_ATTENDEES}
                  step={1}
                  value={form.attendees}
                  onChange={(event) =>
                    updateField("attendees", event.target.value)
                  }
                  disabled={submitting}
                  className={inputClass(Boolean(errors.attendees))}
                />

                {errors.attendees && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.attendees}
                  </p>
                )}
              </div>

              {/* Number of Hours */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Visit Duration (Hours) <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={MAX_HOURS}
                    step={1}
                    value={form.visitHours}
                    onChange={(event) =>
                      updateField("visitHours", event.target.value)
                    }
                    disabled={submitting}
                    className={inputClass(Boolean(errors.visitHours))}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                    <Clock size={16} />
                  </div>
                </div>

                {errors.visitHours && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.visitHours}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Visitor Name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Enter Visitor's Name"
                  maxLength={80}
                  disabled={submitting}
                  className={inputClass(Boolean(errors.name))}
                />

                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Contact */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Visitor Contact No <span className="text-red-500">*</span>
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.contact}
                  onChange={(event) =>
                    updateField(
                      "contact",
                      event.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="Enter 10-digit mobile number"
                  disabled={submitting}
                  className={inputClass(Boolean(errors.contact))}
                />

                {errors.contact && (
                  <p className="mt-1 text-xs text-red-600">{errors.contact}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Visitor Email Id
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="Enter Visitor Email (optional)"
                  maxLength={120}
                  disabled={submitting}
                  className={inputClass(Boolean(errors.email))}
                />

                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Company (read only) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Hosting Company
                </label>

                <input
                  type="text"
                  value={companyName}
                  readOnly
                  tabIndex={-1}
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-600 outline-none"
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Reason for Visit
              </label>

              <textarea
                rows={3}
                value={form.reason}
                onChange={(event) => updateField("reason", event.target.value)}
                placeholder="Enter purpose of visit"
                maxLength={MAX_REASON_LENGTH}
                disabled={submitting}
                className={`${inputClass(false)} resize-none`}
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {form.reason.length}/{MAX_REASON_LENGTH}
              </p>
            </div>

            {/* Fee breakdown */}
            {selectedBooking && (
              <div className="rounded-xl bg-gray-50 p-4 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>
                    {formatMoney(pricing.rate)} / hr × {pricing.hours}{" "}
                    {pricing.hours === 1 ? "hr" : "hrs"} × {pricing.attendees}{" "}
                    {pricing.attendees === 1 ? "attendee" : "attendees"}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(pricing.subtotal)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(pricing.gst)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatMoney(pricing.total)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={submitting || !selectedBooking}
                className="inline-flex min-w-[260px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatMoney(pricing.total)} (incl. 18% GST)`
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
