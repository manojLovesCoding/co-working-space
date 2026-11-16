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

// 15-character Indian GSTIN (the server validates it again).
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

  // Invoice: the customer gets ONE invoice, either personal or business (GST).
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 p-6">
        <h2 className="text-xl font-bold text-gray-800">
          Booking information not found
        </h2>
        <p className="text-gray-600 text-center">
          Please select your workspace and booking dates again.
        </p>
        <button
          onClick={() => navigate("/")}
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
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

  // "A1 (Myself), A2 (Priya)" when assignments exist, otherwise just codes.
  const seatsText = (
    Array.isArray(seatAssignments) && seatAssignments.length
      ? seatAssignments.map((seat) => `${seat.spaceCode} (${seat.label})`)
      : selectedSpaces
  ).join(", ");

  // Display-only amounts. The server recalculates everything.
  // totalAmount = final payable amount including GST.
  const totalAmount = Number(
    bookingData.totalAmount ?? bookingData.totalPrice ?? bookingData.total ?? 0,
  );

  const discountAmount = Number(bookingData.discountAmount || 0);

  const gstRate = Number(bookingData.gstRate ?? 18);
  const gstAmount = Number(bookingData.gstAmount || 0);

  // Amount after coupon, before GST.
  const taxableAmount = Number(
    bookingData.taxableAmount ?? totalAmount - gstAmount,
  );

  // Price before coupon and GST.
  const subtotal = Number(
    bookingData.subtotal ?? taxableAmount + discountAmount,
  );

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

    if (
      !Array.isArray(seatAssignments) ||
      seatAssignments.length !== selectedSpaces.length
    ) {
      toast.error(
        "Every seat must be assigned to you or a team member. Please select your workspace again.",
      );
      return;
    }

    // Office is closed on Sundays (the server enforces this as well).
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

      // Step 1: Create the order on your backend.
      // The server validates the coupon and seat assignments again and
      // calculates the final amount (coupon + 18% GST).
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

      // Amounts confirmed by the server (shown after payment).
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
        description: `${spaceName} - ${selectedSpaces.length} space(s)`,
        order_id: order.orderId,

        // Step 3: Send payment details to the backend for verification.
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
          color: "#2563eb",
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

  if (bookingConfirmed) {
    const finalPaid = paidSummary?.totalAmount ?? totalAmount;
    const finalDiscount = paidSummary?.discountAmount ?? discountAmount;
    const finalCoupon = paidSummary?.couponCode ?? couponCode;
    const finalGst = paidSummary?.gstAmount ?? gstAmount;
    const finalGstRate = paidSummary?.gstRate ?? gstRate;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
            ✓
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Booking Confirmed!
          </h1>

          <p className="mt-3 text-gray-600">
            Your payment was verified and your workspace booking is confirmed.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
            <p className="text-sm text-gray-500">Booking ID</p>
            <p className="mt-1 break-all font-semibold text-gray-900">
              {confirmedBookingId}
            </p>

            <p className="mt-4 text-sm text-gray-500">Workspace</p>
            <p className="mt-1 font-medium text-gray-900">{spaceName}</p>

            <p className="mt-4 text-sm text-gray-500">Selected seats</p>
            <p className="mt-1 font-medium text-gray-900">{seatsText}</p>

            <p className="mt-4 text-sm text-gray-500">Booking date</p>
            <p className="mt-1 font-medium text-gray-900">
              {formatDate(bookingDate)}
            </p>

            {isHourly && startTime && (
              <>
                <p className="mt-4 text-sm text-gray-500">Time</p>
                <p className="mt-1 font-medium text-gray-900">
                  {formatTime(startTime)} - {formatTime(endTime)}
                </p>
              </>
            )}

            <p className="mt-4 text-sm text-gray-500">
              Amount paid (incl. GST)
            </p>
            <p className="mt-1 font-medium text-gray-900">
              {formatPrice(finalPaid)}
            </p>

            {Number(finalGst) > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Includes GST ({finalGstRate}%) of {formatPrice(finalGst)}
              </p>
            )}

            {finalCoupon && Number(finalDiscount) > 0 && (
              <p className="mt-1 text-sm text-green-600">
                Coupon {finalCoupon} saved you {formatPrice(finalDiscount)}
              </p>
            )}
          </div>

          <button
            onClick={() => navigate(`/customer/invoice/${confirmedBookingId}`)}
            className="mt-6 w-full rounded-lg border border-blue-600 px-5 py-3 font-semibold text-blue-600 hover:bg-blue-50"
          >
            View {invoiceType === "business" ? "Business" : "Personal"} Invoice
          </button>

          <button
            onClick={() => navigate("/customer")}
            className="mt-3 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          disabled={loading}
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          ← Back
        </button>

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-blue-600 px-6 py-6 text-white">
            <h1 className="text-2xl font-bold">Checkout</h1>
            <p className="mt-1 text-blue-100">
              Review your workspace booking before payment.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <p className="text-sm text-gray-500">Workspace</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                {spaceName}
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Booking date</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {formatDate(bookingDate)}
                </p>
              </div>

              {isHourly && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {startTime
                      ? `${formatTime(startTime)} - ${formatTime(endTime)}`
                      : "Not selected"}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Plan</p>
                <p className="mt-1 font-semibold capitalize text-gray-900">
                  {plan}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Duration</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {duration} {unitLabel(plan, duration)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Selected seats</p>
                <p className="mt-1 break-words font-semibold text-gray-900">
                  {seatsText}
                </p>
              </div>
            </div>

            <div className="border-t pt-5">
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {hasCoupon && (
                  <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
                    <span className="font-medium text-green-700">
                      Coupon {couponCode}
                    </span>
                    <span className="font-semibold text-green-700">
                      − {formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Taxable amount</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(taxableAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">GST ({gstRate}%)</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(gstAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <span className="text-gray-600">Total (incl. GST)</span>
                <span className="text-2xl font-bold text-gray-900">
                  {Number.isFinite(totalAmount) && totalAmount > 0
                    ? formatPrice(totalAmount)
                    : "Calculated securely by server"}
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                The final payable amount, including any coupon discount and GST,
                is calculated and validated by the server when your order is
                created.
              </p>
            </div>

            {/* Invoice type: customer OR business, not both */}
            <div className="border-t pt-5">
              <p className="text-sm font-semibold text-gray-900">
                Invoice type
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Choose one. Your invoice is generated after payment is confirmed
                and cannot be switched later.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                    className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                      invoiceType === option.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
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
                    <p className="text-sm font-semibold text-gray-900">
                      {option.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{option.text}</p>
                  </label>
                ))}
              </div>

              {invoiceType === "business" && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="business-name"
                      className="mb-1 block text-xs font-semibold text-gray-700"
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
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="business-gstin"
                      className="mb-1 block text-xs font-semibold text-gray-700"
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
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    {billing.gstin.length === 15 &&
                      !GSTIN_REGEX.test(billing.gstin) && (
                        <p className="mt-1 text-xs text-red-600">
                          This GSTIN does not look valid.
                        </p>
                      )}
                  </div>

                  <div>
                    <label
                      htmlFor="business-address"
                      className="mb-1 block text-xs font-semibold text-gray-700"
                    >
                      Billing address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="business-address"
                      rows={3}
                      value={billing.address}
                      onChange={(event) =>
                        updateBilling("address", event.target.value)
                      }
                      maxLength={300}
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Processing..." : "Pay Securely with Razorpay"}
            </button>

            <p className="text-center text-xs text-gray-500">
              Your booking is confirmed only after the backend verifies your
              payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
