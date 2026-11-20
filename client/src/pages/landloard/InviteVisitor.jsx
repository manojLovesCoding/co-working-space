import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  Wallet,
  AlertCircle,
  BriefcaseBusiness,
  MapPin,
  LoaderCircle,
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

  return `${booking.spaceName || "Workspace"}${
    seats ? ` (${seats})` : ""
  }${planBadge} — ${when}`;
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
  `w-full rounded-lg border bg-[#FFFDFA] px-3.5 py-2.5 text-sm text-[#382B26] outline-none transition placeholder:text-[#B2A59A] focus:ring-2 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-[#E9DED0] focus:border-[#A95643] focus:ring-[#F8EDE6]"
  }`;

const FieldLabel = ({ children, required }) => (
  <label className="mb-1.5 block text-xs font-semibold text-[#5D4B41]">
    {children}
    {required && <span className="ml-1 text-red-500">*</span>}
  </label>
);

const FieldError = ({ children }) =>
  children ? (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle size={13} />
      {children}
    </p>
  ) : null;

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

      const [bookingsResponse, companyResponse] = await Promise.all([
        api.get("/visitor/upcoming_bookings"),
        api.get("/company").catch(() => null),
      ]);

      if (!bookingsResponse.data?.success) {
        throw new Error(
          bookingsResponse.data?.message || "Failed to load your bookings.",
        );
      }

      const now = Date.now();

      const upcoming = (bookingsResponse.data.bookings || []).filter(
        (booking) => new Date(booking.endAt).getTime() > now,
      );

      setBookings(upcoming);

      setCompanyName(
        companyResponse?.data?.company?.companyName ||
          bookingsResponse.data.companyName ||
          "",
      );
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
      setErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }));
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

        theme: { color: "#A95643" },
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
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] p-3 sm:p-5">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] shadow-lg shadow-[#71392F]/5">
          <div className="bg-gradient-to-br from-[#71392F] to-[#A95643] px-5 py-7 text-center text-white sm:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <CheckCircle2 size={36} />
            </div>

            <h1 className="mt-4 text-xl font-extrabold sm:text-2xl">
              Visitor Pass Confirmed!
            </h1>

            <p className="mt-1.5 text-sm text-[#F8EDE6]">
              Your payment was verified successfully.
            </p>
          </div>

          <div className="p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-3.5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-600" size={21} />
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    Payment Successful
                  </p>
                  <p className="text-xs text-emerald-600">
                    Visitor pass has been issued
                  </p>
                </div>
              </div>

              <CheckCircle2 size={21} className="text-emerald-600" />
            </div>

            <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#8F8175]">
              Visit Summary
            </h2>

            <div className="space-y-3 rounded-xl border border-[#E9DED0] bg-[#FBF3ED] p-4">
              <div>
                <p className="text-xs font-medium text-[#8F8175]">Visit ID</p>
                <p className="mt-1 break-all text-sm font-bold text-[#382B26]">
                  {confirmedVisit.visitId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#8F8175]">Visitor</p>
                  <p className="mt-1 text-sm font-bold text-[#382B26]">
                    {confirmedVisit.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#8F8175]">Attendees</p>
                  <p className="mt-1 text-sm font-bold text-[#382B26]">
                    {confirmedVisit.attendees}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#8F8175]">Duration</p>
                  <p className="mt-1 text-sm font-bold text-[#382B26]">
                    {confirmedVisit.visitHours}{" "}
                    {confirmedVisit.visitHours === 1 ? "hour" : "hours"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#8F8175]">Amount Paid</p>
                  <p className="mt-1 text-sm font-extrabold text-[#A95643]">
                    {formatMoney(confirmedVisit.total)}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E9DED0] pt-3">
                <p className="text-xs text-[#8F8175]">Workspace Booking</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#382B26]">
                  {confirmedVisit.bookingLabel}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-lg border border-[#D9B5A7] bg-white px-4 py-2.5 text-sm font-bold text-[#A95643] transition hover:bg-[#F8EDE6]"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <UserPlus size={16} />
                  Invite Another Visitor
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/customer")}
                className="flex-1 rounded-lg bg-[#A95643] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#71392F]"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // Main Form UI
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-5xl">
        {/* PAGE HEADER */}
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#A95643]">
            <Building2 size={15} />
            <span>Oorza Customer Portal</span>
            <span className="text-[#C9826C]">/</span>
            <span className="text-[#8F8175]">Invite Visitor</span>
          </div>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#382B26] sm:text-3xl">
                Invite a Visitor
              </h1>

              <p className="mt-1.5 max-w-xl text-sm leading-5 text-[#8F8175]">
                Register your guests and arrange their access to your booked
                workspace with a simple visitor pass.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#E9DED0] bg-[#FFFDFA] px-3.5 py-2 text-sm font-semibold text-[#5D4B41] shadow-sm transition hover:bg-[#F8EDE6]"
            >
              <ArrowLeft size={15} />
              Back
            </button>
          </div>
        </div>

        {/* HERO BANNER */}
        <div className="relative mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#C9826C] p-5 text-white shadow-md shadow-[#71392F]/10 sm:p-6">
          <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-1/3 h-44 w-44 rounded-full bg-[#F8EDE6]/10" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-[#FAF6EF]">
                <ShieldCheck size={13} />
                Visitor Access
              </div>

              <h2 className="text-lg font-extrabold sm:text-xl">
                Welcome Your Guests
              </h2>

              <p className="mt-1.5 max-w-lg text-sm leading-5 text-[#F8EDE6]">
                Invite visitors to your active workspace booking. Complete their
                details and securely pay the visitor fee online.
              </p>
            </div>

            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 sm:flex">
              <UserPlus size={34} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loadingBookings && (
          <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] px-5 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EDE6]">
              <LoaderCircle size={25} className="animate-spin text-[#A95643]" />
            </div>

            <h3 className="mt-3 text-sm font-bold text-[#382B26]">
              Loading your bookings
            </h3>

            <p className="mt-1 text-xs text-[#8F8175]">
              Please wait while we fetch your active workspace bookings.
            </p>
          </div>
        )}

        {/* LOAD ERROR */}
        {!loadingBookings && loadError && (
          <div className="rounded-xl border border-red-200 bg-[#FFFDFA] p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <AlertCircle size={24} />
            </div>

            <h2 className="mt-3 text-base font-bold text-[#382B26]">
              Could not load your bookings
            </h2>

            <p className="mt-1.5 text-sm text-[#8F8175]">{loadError}</p>

            <button
              type="button"
              onClick={fetchBookings}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#A95643] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#71392F]"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        )}

        {/* NO BOOKINGS */}
        {!loadingBookings && !loadError && bookings.length === 0 && (
          <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] px-5 py-11 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8EDE6] text-[#A95643]">
              <CalendarDays size={30} strokeWidth={1.5} />
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-[#382B26]">
              No upcoming bookings
            </h2>

            <p className="mx-auto mt-1.5 max-w-md text-sm leading-5 text-[#8F8175]">
              You need an active workspace booking before you can invite
              visitors.
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#A95643] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#71392F]"
            >
              <Building2 size={16} />
              Book a Space
            </button>
          </div>
        )}

        {/* MAIN FORM */}
        {!loadingBookings && !loadError && bookings.length > 0 && (
          <form onSubmit={handlePay} noValidate className="space-y-4">
            {/* BOOKING SECTION */}
            <section className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#F0E7DC] px-4 py-3.5 sm:px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                  <Building2 size={19} />
                </div>

                <div>
                  <h2 className="text-sm font-extrabold text-[#382B26]">
                    Workspace Booking
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[#8F8175]">
                    Select the booking for your visitor
                  </p>
                </div>

                <span className="ml-auto rounded-md bg-[#F8EDE6] px-2.5 py-1 text-[10px] font-bold text-[#A95643]">
                  Step 01
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <FieldLabel required>
                  Select Your Active Workspace Booking
                </FieldLabel>

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

                <FieldError>{errors.bookingId}</FieldError>

                <p className="mt-1.5 text-[11px] leading-4 text-[#A09286]">
                  Visitors are charged according to the selected workspace's
                  hourly rate.
                </p>

                {/* SELECTED BOOKING DETAILS */}
                {selectedBooking && (
                  <div className="mt-4 rounded-lg border border-[#E9DED0] bg-[#FBF3ED] p-3.5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#A95643] shadow-sm">
                          <Building2 size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A95643]">
                            Selected Workspace
                          </p>

                          <p className="mt-1 text-sm font-extrabold text-[#382B26]">
                            {selectedBooking.spaceName || "Workspace"}
                          </p>

                          {selectedBooking.selectedSpaces?.length > 0 && (
                            <p className="mt-0.5 text-xs text-[#8F8175]">
                              Seats: {selectedBooking.selectedSpaces.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#E9DED0] bg-white px-3.5 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#A09286]">
                          Hourly Rate
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-[#A95643]">
                          {formatMoney(selectedBooking.hourlyRate)}
                          <span className="text-xs font-medium text-[#8F8175]">
                            /hr
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#E9DED0] pt-2.5 text-xs text-[#6F6056]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-[#A95643]" />
                        {formatDate(selectedBooking.bookingDate)}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-[#A95643]" />
                        {selectedBooking.startTime
                          ? `${formatTime(selectedBooking.startTime)} - ${formatTime(selectedBooking.endTime)}`
                          : selectedBooking.plan || "Booking"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* VISITOR DETAILS */}
            <section className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#F0E7DC] px-4 py-3.5 sm:px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                  <Users size={19} />
                </div>

                <div>
                  <h2 className="text-sm font-extrabold text-[#382B26]">
                    Visitor Details
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[#8F8175]">
                    Enter the information of your guest
                  </p>
                </div>

                <span className="ml-auto rounded-md bg-[#F8EDE6] px-2.5 py-1 text-[10px] font-bold text-[#A95643]">
                  Step 02
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
                {/* ATTENDEES */}
                <div>
                  <FieldLabel required>Number of Attendees</FieldLabel>

                  <div className="relative">
                    <Users
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A09286]"
                    />

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
                      className={`${inputClass(Boolean(errors.attendees))} pl-10`}
                    />
                  </div>

                  <FieldError>{errors.attendees}</FieldError>
                  <p className="mt-1 text-[11px] text-[#A09286]">
                    Maximum {MAX_ATTENDEES} attendees
                  </p>
                </div>

                {/* VISIT HOURS */}
                <div>
                  <FieldLabel required>Visit Duration (Hours)</FieldLabel>

                  <div className="relative">
                    <Clock
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A09286]"
                    />

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
                      className={`${inputClass(Boolean(errors.visitHours))} pl-10`}
                    />
                  </div>

                  <FieldError>{errors.visitHours}</FieldError>
                  <p className="mt-1 text-[11px] text-[#A09286]">
                    Maximum {MAX_HOURS} hours per visit
                  </p>
                </div>

                {/* NAME */}
                <div>
                  <FieldLabel required>Visitor Name</FieldLabel>

                  <div className="relative">
                    <User
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A09286]"
                    />

                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      placeholder="Enter visitor's full name"
                      maxLength={80}
                      disabled={submitting}
                      className={`${inputClass(Boolean(errors.name))} pl-10`}
                    />
                  </div>

                  <FieldError>{errors.name}</FieldError>
                </div>

                {/* CONTACT */}
                <div>
                  <FieldLabel required>Visitor Contact Number</FieldLabel>

                  <div className="relative">
                    <Phone
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A09286]"
                    />

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
                      placeholder="10-digit mobile number"
                      disabled={submitting}
                      className={`${inputClass(Boolean(errors.contact))} pl-10`}
                    />
                  </div>

                  <FieldError>{errors.contact}</FieldError>
                </div>

                {/* EMAIL */}
                <div>
                  <FieldLabel>Visitor Email Address</FieldLabel>

                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A09286]"
                    />

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      placeholder="Enter visitor email (optional)"
                      maxLength={120}
                      disabled={submitting}
                      className={`${inputClass(Boolean(errors.email))} pl-10`}
                    />
                  </div>

                  <FieldError>{errors.email}</FieldError>
                </div>

                {/* COMPANY */}
                <div>
                  <FieldLabel>Hosting Company</FieldLabel>

                  <div className="relative">
                    <BriefcaseBusiness
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A09286]"
                    />

                    <input
                      type="text"
                      value={companyName}
                      readOnly
                      tabIndex={-1}
                      placeholder="Company not available"
                      className="w-full cursor-not-allowed rounded-lg border border-[#E9DED0] bg-[#F5F0E8] py-2.5 pl-10 pr-3.5 text-sm text-[#6F6056] outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* VISIT PURPOSE */}
            <section className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#F0E7DC] px-4 py-3.5 sm:px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                  <MapPin size={19} />
                </div>

                <div>
                  <h2 className="text-sm font-extrabold text-[#382B26]">
                    Visit Purpose
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[#8F8175]">
                    Tell us why your visitor is coming
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <FieldLabel>Reason for Visit</FieldLabel>

                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(event) =>
                    updateField("reason", event.target.value)
                  }
                  placeholder="Enter the purpose of the visitor's visit..."
                  maxLength={MAX_REASON_LENGTH}
                  disabled={submitting}
                  className={`${inputClass(false)} resize-none`}
                />

                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-[11px] text-[#A09286]">
                    Optional information
                  </p>

                  <p className="text-[11px] font-medium text-[#A09286]">
                    {form.reason.length}/{MAX_REASON_LENGTH}
                  </p>
                </div>
              </div>
            </section>

            {/* PAYMENT SUMMARY */}
            {selectedBooking && (
              <section className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#F0E7DC] px-4 py-3.5 sm:px-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Wallet size={19} />
                  </div>

                  <div>
                    <h2 className="text-sm font-extrabold text-[#382B26]">
                      Payment Summary
                    </h2>
                    <p className="mt-0.5 text-[11px] text-[#8F8175]">
                      Review your visitor pass charges
                    </p>
                  </div>

                  <span className="ml-auto rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    Step 03
                  </span>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A09286]">
                      Charge Calculation
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-5 text-[#5D4B41]">
                      {formatMoney(pricing.rate)} × {pricing.hours}{" "}
                      {pricing.hours === 1 ? "hour" : "hours"} ×{" "}
                      {pricing.attendees}{" "}
                      {pricing.attendees === 1 ? "attendee" : "attendees"}
                    </p>

                    <p className="mt-1.5 text-xs leading-5 text-[#A09286]">
                      Visitor charges are calculated using the selected
                      workspace hourly rate.
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#E9DED0] bg-[#FBF3ED] p-3.5">
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between gap-3 text-[#6F6056]">
                        <span>Subtotal</span>
                        <span className="font-semibold text-[#382B26]">
                          {formatMoney(pricing.subtotal)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-[#6F6056]">
                        <span>GST (18%)</span>
                        <span className="font-semibold text-[#382B26]">
                          {formatMoney(pricing.gst)}
                        </span>
                      </div>

                      <div className="border-t border-[#E9DED0] pt-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-[#382B26]">
                            Total Amount
                          </span>

                          <span className="text-lg font-extrabold text-[#A95643]">
                            {formatMoney(pricing.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* PAYMENT BUTTON */}
            <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm sm:p-5">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={21} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#382B26]">
                      Secure Online Payment
                    </p>
                    <p className="mt-0.5 text-xs text-[#8F8175]">
                      Payments are securely processed by Razorpay.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedBooking}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#A95643] to-[#71392F] px-7 py-3 text-sm font-bold text-white shadow-md shadow-[#71392F]/15 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard size={17} />
                      Pay {formatMoney(pricing.total)}
                    </>
                  )}
                </button>
              </div>

              <p className="mt-3 text-center text-[10px] text-[#A09286]">
                By proceeding, you agree to pay the displayed visitor pass
                amount, including applicable GST.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
