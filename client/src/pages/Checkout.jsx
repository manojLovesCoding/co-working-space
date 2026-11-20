import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios.js";

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

// ---------------------------------------------
// Helpers
// ---------------------------------------------

// Spaces billed per person (one room, many attendees).
// Must match PER_HEAD_SPACES in bookingController.js and BookSpace.jsx.
const PER_HEAD_SPACES = ["Video Conferencing"];

// 15-character Indian GSTIN.
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const isSunday = (dateString) =>
  Boolean(dateString) && new Date(`${dateString}T00:00:00Z`).getUTCDay() === 0;

const formatDate = (dateString) => {
  if (!dateString) return "";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

// Shows up to 2 decimals so GST paise are displayed correctly.
const formatPrice = (value) => {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
    : "₹0";
};

const unitLabel = (plan, count) => {
  const base =
    plan === "hourly" ? "hour" : plan === "monthly" ? "month" : "day";

  return Number(count) === 1 ? base : `${base}s`;
};

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const bookingData = state?.bookingData;
  const space = state?.space;

  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");

  // Amounts confirmed by the server after the order is created.
  const [paidSummary, setPaidSummary] = useState(null);

  // Invoice: customer OR business (GST).
  const [invoiceType, setInvoiceType] = useState("customer");

  const [billing, setBilling] = useState({
    businessName: "",
    gstin: "",
    address: "",
  });

  const updateBilling = (field, value) =>
    setBilling((previous) => ({ ...previous, [field]: value }));

  if (!bookingData || !space) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#FAF6EF] p-4">
        <h2 className="text-lg font-bold text-[#382B26]">
          Booking information not found
        </h2>

        <p className="text-center text-sm text-[#8F8175]">
          Please select your workspace and booking dates again.
        </p>

        <button
          onClick={() => navigate("/")}
          className="rounded-lg bg-[#A95643] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#71392F]"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const {
    spaceName,
    bookingDate,
    plan,
    duration,
    selectedSpaces,
    seatAssignments,
    startTime,
    endTime,
    couponCode,
  } = bookingData;

  const isHourly = plan === "hourly";
  const isPerHead = PER_HEAD_SPACES.includes(spaceName);

  const hasAssignments =
    Array.isArray(seatAssignments) && seatAssignments.length > 0;

  // Billable units: attendees for per-head rooms, seats otherwise.
  const headCount = isPerHead
    ? hasAssignments
      ? seatAssignments.length
      : Number(bookingData.headCount) || 0
    : Array.isArray(selectedSpaces)
      ? selectedSpaces.length
      : 0;

  const seatsText = (
    hasAssignments
      ? seatAssignments.map((seat) => `${seat.spaceCode} (${seat.label})`)
      : selectedSpaces
  ).join(", ");

  const roomText = Array.isArray(selectedSpaces)
    ? selectedSpaces.join(", ")
    : "";

  const attendeeNames = hasAssignments
    ? seatAssignments.map((seat) => seat.label)
    : [];

  const attendeesText = attendeeNames.join(", ");

  // Display-only amounts. The server recalculates everything.
  const totalAmount = Number(
    bookingData.totalAmount ?? bookingData.totalPrice ?? bookingData.total ?? 0,
  );

  const discountAmount = Number(bookingData.discountAmount || 0);
  const gstRate = Number(bookingData.gstRate ?? 18);
  const gstAmount = Number(bookingData.gstAmount || 0);

  const taxableAmount = Number(
    bookingData.taxableAmount ?? totalAmount - gstAmount,
  );

  const subtotal = Number(
    bookingData.subtotal ?? taxableAmount + discountAmount,
  );

  const pricePerUnit = Number(bookingData.pricePerUnit || 0);
  const hasCoupon = Boolean(couponCode) && discountAmount > 0;

  const handlePayment = async () => {
    if (loading) return;

    if (
      !spaceName ||
      !bookingDate ||
      !plan ||
      !Number.isInteger(Number(duration)) ||
      Number(duration) < 1 ||
      !Array.isArray(selectedSpaces) ||
      selectedSpaces.length === 0
    ) {
      toast.error(
        "Booking details are incomplete. Please select your workspace again.",
      );
      return;
    }

    if (isPerHead) {
      if (
        selectedSpaces.length !== 1 ||
        !Array.isArray(seatAssignments) ||
        seatAssignments.length < 1
      ) {
        toast.error(
          "Select the conference room and at least one attendee. Please select your workspace again.",
        );
        return;
      }
    } else if (
      !Array.isArray(seatAssignments) ||
      seatAssignments.length !== selectedSpaces.length
    ) {
      toast.error(
        "Every seat must be assigned to you or a team member. Please select your workspace again.",
      );
      return;
    }

    if (isSunday(bookingDate)) {
      toast.error(
        "Our office is closed on Sundays. Please select another date.",
      );
      return;
    }

    if (isHourly && !startTime) {
      toast.error("Please select a start time for your hourly booking.");
      return;
    }

    if (invoiceType === "business") {
      if (!billing.businessName.trim()) {
        toast.error("Enter your business name for the invoice.");
        return;
      }

      if (!GSTIN_REGEX.test(billing.gstin.trim().toUpperCase())) {
        toast.error("Enter a valid 15-character GSTIN.");
        return;
      }

      if (billing.address.trim().length < 10) {
        toast.error("Enter your business billing address.");
        return;
      }
    }

    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout. Please try again.");
      }

      // Step 1: Create order on backend.
      const orderResponse = await api.post("/booking/create_razorpay_order", {
        spaceName,
        bookingDate,
        plan,
        duration: Number(duration),
        selectedSpaces,
        seatAssignments: seatAssignments.map(
          ({ spaceCode, assigneeType, teamMemberId }) => ({
            spaceCode,
            assigneeType,
            ...(assigneeType === "team" ? { teamMemberId } : {}),
          }),
        ),
        ...(isHourly ? { startTime } : {}),
        invoiceType,
        ...(invoiceType === "business"
          ? {
              billingDetails: {
                businessName: billing.businessName.trim(),
                gstin: billing.gstin.trim().toUpperCase(),
                address: billing.address.trim(),
              },
            }
          : {}),
        ...(couponCode ? { couponCode } : {}),
      });

      const order = orderResponse.data;

      if (
        !order?.success ||
        !order.orderId ||
        !order.keyId ||
        !order.bookingId ||
        !Number.isFinite(Number(order.amount))
      ) {
        throw new Error(
          order?.message || "Could not create the payment order.",
        );
      }

      // Amounts confirmed by the server.
      setPaidSummary({
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        couponCode: order.couponCode,
        taxableAmount: order.taxableAmount,
        gstRate: order.gstRate,
        gstAmount: order.gstAmount,
        totalAmount: order.totalAmount,
      });

      // Step 2: Open Razorpay Checkout.
      const options = {
        key: order.keyId,
        amount: Number(order.amount),
        currency: order.currency || "INR",
        name: "Workspace Booking",
        description: isPerHead
          ? `${spaceName} - ${headCount} ${headCount === 1 ? "person" : "people"}`
          : `${spaceName} - ${selectedSpaces.length} space(s)`,
        order_id: order.orderId,

        // Step 3: Verify payment with backend.
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await api.post(
              "/booking/add_workspace_booking",
              {
                bookingId: order.bookingId,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              },
            );

            if (!verifyResponse.data?.success) {
              throw new Error(
                verifyResponse.data?.message || "Payment verification failed.",
              );
            }

            setConfirmedBookingId(
              verifyResponse.data.booking?.bookingId || order.bookingId,
            );

            setBookingConfirmed(true);
            toast.success("Payment verified and booking confirmed!");
          } catch (error) {
            console.error("Booking verification error:", error);

            toast.error(
              error.response?.data?.message ||
                error.message ||
                "Payment verification failed. Contact support before paying again.",
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            toast("Payment window closed.");
          },
        },

        theme: {
          color: "#A95643",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);

        toast.error(
          response.error?.description || "Payment failed. Please try again.",
        );

        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to start checkout.",
      );

      setLoading(false);
    }
  };

  // ---------------------------------------------
  // BOOKING CONFIRMATION
  // ---------------------------------------------

  if (bookingConfirmed) {
    const finalPaid = paidSummary?.totalAmount ?? totalAmount;
    const finalDiscount = paidSummary?.discountAmount ?? discountAmount;
    const finalCoupon = paidSummary?.couponCode ?? couponCode;
    const finalGst = paidSummary?.gstAmount ?? gstAmount;
    const finalGstRate = paidSummary?.gstRate ?? gstRate;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] p-3 sm:p-5">
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#E9DED0] bg-white shadow-lg shadow-[#71392F]/[0.06]">
          <div className="h-1 w-full bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#D58B70]" />

          <div className="p-4 text-center sm:p-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF0E6] text-2xl text-[#527C61]">
              <span>✓</span>
            </div>

            <h1 className="text-xl font-bold text-[#382B26]">
              Booking Confirmed!
            </h1>

            <p className="mt-1.5 text-xs leading-5 text-[#8F8175]">
              Your payment was verified and your workspace booking is confirmed.
            </p>

            <div className="mt-4 rounded-lg border border-[#E9DED0] bg-[#FBF8F3] p-3 text-left">
              <p className="text-[11px] text-[#8F8175]">Booking ID</p>
              <p className="mt-0.5 break-all text-sm font-semibold text-[#382B26]">
                {confirmedBookingId}
              </p>

              <p className="mt-3 text-[11px] text-[#8F8175]">Workspace</p>
              <p className="mt-0.5 text-sm font-medium text-[#382B26]">
                {spaceName}
              </p>

              {isPerHead ? (
                <>
                  <p className="mt-3 text-[11px] text-[#8F8175]">Room</p>
                  <p className="mt-0.5 text-sm font-medium text-[#382B26]">
                    {roomText}
                  </p>

                  <p className="mt-3 text-[11px] text-[#8F8175]">
                    Attendees ({headCount})
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[#382B26]">
                    {attendeesText}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-[11px] text-[#8F8175]">
                    Selected seats
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[#382B26]">
                    {seatsText}
                  </p>
                </>
              )}

              <p className="mt-3 text-[11px] text-[#8F8175]">Booking date</p>
              <p className="mt-0.5 text-sm font-medium text-[#382B26]">
                {formatDate(bookingDate)}
              </p>

              {isHourly && startTime && (
                <>
                  <p className="mt-3 text-[11px] text-[#8F8175]">Time</p>
                  <p className="mt-0.5 text-sm font-medium text-[#382B26]">
                    {formatTime(startTime)} - {formatTime(endTime)}
                  </p>
                </>
              )}

              <div className="mt-3 border-t border-[#E9DED0] pt-3">
                <p className="text-[11px] text-[#8F8175]">
                  Amount paid (incl. GST)
                </p>

                <p className="mt-0.5 text-xl font-bold text-[#A95643]">
                  {formatPrice(finalPaid)}
                </p>

                {Number(finalGst) > 0 && (
                  <p className="mt-1 text-[11px] text-[#8F8175]">
                    Includes GST ({finalGstRate}%) of {formatPrice(finalGst)}
                  </p>
                )}

                {finalCoupon && Number(finalDiscount) > 0 && (
                  <p className="mt-1 text-[11px] font-medium text-[#527C61]">
                    Coupon {finalCoupon} saved you {formatPrice(finalDiscount)}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/customer/invoice/${confirmedBookingId}`)
              }
              className="mt-4 w-full rounded-lg border border-[#A95643] px-4 py-2.5 text-sm font-semibold text-[#A95643] transition hover:bg-[#F8EDE6]"
            >
              View {invoiceType === "business" ? "Business" : "Personal"}{" "}
              Invoice
            </button>

            <button
              onClick={() => navigate("/customer")}
              className="mt-2 w-full rounded-lg bg-[#A95643] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#71392F]"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // CHECKOUT PAGE
  // ---------------------------------------------

  const fieldClass =
    "w-full rounded-lg border border-[#E9DED0] bg-[#FFFDFA] px-3 py-2 text-xs text-[#382B26] outline-none transition placeholder:text-[#A99A8D] focus:border-[#A95643] focus:ring-2 focus:ring-[#A95643]/10 disabled:cursor-not-allowed disabled:opacity-60";

  const infoCardClass =
    "rounded-lg border border-[#E9DED0]/80 bg-[#FBF8F3] p-3";

  const labelClass = "text-[11px] text-[#8F8175]";

  const valueClass = "mt-1 break-words text-sm font-semibold text-[#382B26]";

  return (
    <div className="min-h-screen bg-[#FAF6EF] px-3 py-4 sm:px-4 sm:py-5">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          disabled={loading}
          className="mb-3 text-xs font-semibold text-[#A95643] transition hover:text-[#71392F] disabled:opacity-50"
        >
          ← Back
        </button>

        <div className="overflow-hidden rounded-xl border border-[#E9DED0] bg-white shadow-md shadow-[#71392F]/[0.05]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#71392F] to-[#A95643] px-4 py-3.5 text-white sm:px-5">
            <h1 className="text-lg font-bold">Checkout</h1>
            <p className="mt-0.5 text-[11px] text-[#F5E5DC]">
              Review your workspace booking before payment.
            </p>
          </div>

          <div className="space-y-4 p-3.5 sm:p-5">
            {/* Workspace */}
            <div>
              <p className={labelClass}>Workspace</p>
              <h2 className="mt-0.5 text-base font-bold text-[#382B26]">
                {spaceName}
              </h2>
            </div>

            {/* Booking details */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className={infoCardClass}>
                <p className={labelClass}>Booking date</p>
                <p className={valueClass}>{formatDate(bookingDate)}</p>
              </div>

              {isHourly && (
                <div className={infoCardClass}>
                  <p className={labelClass}>Time</p>
                  <p className={valueClass}>
                    {startTime
                      ? `${formatTime(startTime)} - ${formatTime(endTime)}`
                      : "Not selected"}
                  </p>
                </div>
              )}

              <div className={infoCardClass}>
                <p className={labelClass}>Plan</p>
                <p className={`${valueClass} capitalize`}>{plan}</p>
              </div>

              <div className={infoCardClass}>
                <p className={labelClass}>Duration</p>
                <p className={valueClass}>
                  {duration} {unitLabel(plan, duration)}
                </p>
              </div>

              {isPerHead ? (
                <>
                  <div className={infoCardClass}>
                    <p className={labelClass}>Room</p>
                    <p className={valueClass}>{roomText}</p>
                  </div>

                  <div className={`${infoCardClass} col-span-2`}>
                    <p className={labelClass}>Attendees ({headCount})</p>
                    <p className={valueClass}>{attendeesText || "-"}</p>
                  </div>
                </>
              ) : (
                <div className={`${infoCardClass} col-span-2`}>
                  <p className={labelClass}>Selected seats</p>
                  <p className={valueClass}>{seatsText}</p>
                </div>
              )}
            </div>

            {/* Price summary */}
            <div className="border-t border-[#E9DED0] pt-3.5">
              <h3 className="mb-3 text-sm font-bold text-[#382B26]">
                Price summary
              </h3>

              <div className="mb-3 space-y-2">
                {isPerHead && pricePerUnit > 0 && (
                  <div className="flex items-center justify-between gap-3 text-[11px] text-[#8F8175]">
                    <span>
                      {formatPrice(pricePerUnit)} × {duration}{" "}
                      {unitLabel(plan, duration)} × {headCount}{" "}
                      {headCount === 1 ? "person" : "people"}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8F8175]">Subtotal</span>
                  <span className="font-semibold text-[#382B26]">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {hasCoupon && (
                  <div className="flex items-center justify-between rounded-lg border border-[#DCE7D8] bg-[#F0F5EC] px-3 py-2 text-xs">
                    <span className="font-semibold text-[#527C61]">
                      Coupon {couponCode}
                    </span>
                    <span className="font-bold text-[#527C61]">
                      − {formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8F8175]">Taxable amount</span>
                  <span className="font-semibold text-[#382B26]">
                    {formatPrice(taxableAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8F8175]">GST ({gstRate}%)</span>
                  <span className="font-semibold text-[#382B26]">
                    {formatPrice(gstAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[#E9DED0] pt-3">
                <span className="text-xs font-semibold text-[#55443B]">
                  Total (incl. GST)
                </span>

                <span className="text-xl font-extrabold text-[#A95643]">
                  {Number.isFinite(totalAmount) && totalAmount > 0
                    ? formatPrice(totalAmount)
                    : "Calculated securely by server"}
                </span>
              </div>

              <p className="mt-2 text-[10px] leading-4 text-[#8F8175]">
                The final payable amount, including any coupon discount and GST,
                is calculated and validated by the server when your order is
                created.
              </p>
            </div>

            {/* Invoice type */}
            <div className="border-t border-[#E9DED0] pt-3.5">
              <h3 className="text-sm font-bold text-[#382B26]">Invoice type</h3>

              <p className="mt-1 text-[10px] leading-4 text-[#8F8175]">
                Choose one. Your invoice is generated after payment is confirmed
                and cannot be switched later.
              </p>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {[
                  {
                    id: "customer",
                    title: "Personal invoice",
                    text: "In your name, without GST details.",
                  },
                  {
                    id: "business",
                    title: "Business invoice (GST)",
                    text: "In your business name with your GSTIN.",
                  },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-lg border p-2.5 transition ${
                      invoiceType === option.id
                        ? "border-[#A95643] bg-[#F8EDE6] ring-1 ring-[#A95643]/10"
                        : "border-[#E9DED0] bg-white hover:border-[#D5A08D] hover:bg-[#FBF8F3]"
                    } ${loading ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="invoiceType"
                      value={option.id}
                      checked={invoiceType === option.id}
                      onChange={() => setInvoiceType(option.id)}
                      disabled={loading}
                      className="sr-only"
                    />

                    <div className="flex items-start gap-1.5">
                      <span
                        className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                          invoiceType === option.id
                            ? "border-[#A95643]"
                            : "border-[#CBBCAF]"
                        }`}
                      >
                        {invoiceType === option.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#A95643]" />
                        )}
                      </span>

                      <div>
                        <p className="text-[11px] font-bold text-[#382B26]">
                          {option.title}
                        </p>
                        <p className="mt-0.5 text-[9px] leading-4 text-[#8F8175]">
                          {option.text}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Business billing details */}
              {invoiceType === "business" && (
                <div className="mt-3 space-y-2.5 rounded-lg border border-[#E9DED0] bg-[#FBF8F3] p-3">
                  <div>
                    <label
                      htmlFor="business-name"
                      className="mb-1 block text-[11px] font-semibold text-[#55443B]"
                    >
                      Business name <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="business-name"
                      type="text"
                      value={billing.businessName}
                      onChange={(event) =>
                        updateBilling("businessName", event.target.value)
                      }
                      maxLength={150}
                      disabled={loading}
                      placeholder="Enter business name"
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="business-gstin"
                      className="mb-1 block text-[11px] font-semibold text-[#55443B]"
                    >
                      GSTIN <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="business-gstin"
                      type="text"
                      value={billing.gstin}
                      onChange={(event) =>
                        updateBilling(
                          "gstin",
                          event.target.value.toUpperCase().replace(/\s/g, ""),
                        )
                      }
                      maxLength={15}
                      placeholder="15-character GSTIN"
                      disabled={loading}
                      className={`${fieldClass} uppercase`}
                    />

                    {billing.gstin.length === 15 &&
                      !GSTIN_REGEX.test(billing.gstin) && (
                        <p className="mt-1 text-[10px] text-red-600">
                          This GSTIN does not look valid.
                        </p>
                      )}
                  </div>

                  <div>
                    <label
                      htmlFor="business-address"
                      className="mb-1 block text-[11px] font-semibold text-[#55443B]"
                    >
                      Billing address <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      id="business-address"
                      rows={2}
                      value={billing.address}
                      onChange={(event) =>
                        updateBilling("address", event.target.value)
                      }
                      maxLength={300}
                      disabled={loading}
                      placeholder="Enter complete billing address"
                      className={`${fieldClass} resize-y`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment button */}
            <div className="border-t border-[#E9DED0] pt-3">
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#A95643] to-[#874536] px-4 py-3 text-sm font-bold text-white shadow-sm shadow-[#A95643]/20 transition hover:from-[#71392F] hover:to-[#71392F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing...
                  </>
                ) : (
                  "Pay Securely with Razorpay"
                )}
              </button>

              <p className="mt-2 text-center text-[10px] leading-4 text-[#8F8175]">
                Your booking is confirmed only after the backend verifies your
                payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
