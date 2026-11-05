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

const isSunday = (dateString) =>
  Boolean(dateString) &&
  new Date(`${dateString}T00:00:00Z`).getUTCDay() === 0;

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

const formatPrice = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `₹${amount.toLocaleString("en-IN")}`
    : "₹0";
};

const unitLabel = (plan, count) => {
  const base = plan === "hourly" ? "hour" : plan === "monthly" ? "month" : "day";
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
    startTime,
    endTime,
    couponCode,
  } = bookingData;

  const isHourly = plan === "hourly";

  // Display-only amounts. The server recalculates everything.
  const totalAmount = Number(
    bookingData.totalAmount ??
      bookingData.totalPrice ??
      bookingData.total ??
      0
  );

  const discountAmount = Number(bookingData.discountAmount || 0);

  const subtotal = Number(
    bookingData.subtotal ?? totalAmount + discountAmount
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
      toast.error("Booking details are incomplete. Please select your workspace again.");
      return;
    }

    // Office is closed on Sundays (the server enforces this as well).
    if (isSunday(bookingDate)) {
      toast.error(
        "Our office is closed on Sundays. Please select another date."
      );
      return;
    }

    if (isHourly && !startTime) {
      toast.error("Please select a start time for your hourly booking.");
      return;
    }

    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout. Please try again.");
      }

      // Step 1: Create the order on your backend.
      // The server validates the coupon again and calculates the final amount.
      const orderResponse = await api.post(
        "/booking/create_razorpay_order",
        {
          spaceName,
          bookingDate,
          plan,
          duration: Number(duration),
          selectedSpaces,
          ...(isHourly ? { startTime } : {}),
          ...(couponCode ? { couponCode } : {}),
        }
      );

      const order = orderResponse.data;

      if (
        !order?.success ||
        !order.orderId ||
        !order.keyId ||
        !order.bookingId ||
        !Number.isFinite(Number(order.amount))
      ) {
        throw new Error(
          order?.message || "Could not create the payment order."
        );
      }

      // Amounts confirmed by the server (shown after payment).
      setPaidSummary({
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        couponCode: order.couponCode,
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
              }
            );

            if (!verifyResponse.data?.success) {
              throw new Error(
                verifyResponse.data?.message ||
                  "Payment verification failed."
              );
            }

            setConfirmedBookingId(
              verifyResponse.data.booking?.bookingId || order.bookingId
            );
            setBookingConfirmed(true);
            toast.success("Payment verified and booking confirmed!");
          } catch (error) {
            console.error("Booking verification error:", error);
            toast.error(
              error.response?.data?.message ||
                error.message ||
                "Payment verification failed. Contact support before paying again."
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
          response.error?.description || "Payment failed. Please try again."
        );
        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to start checkout."
      );
      setLoading(false);
    }
  };

  if (bookingConfirmed) {
    const finalPaid = paidSummary?.totalAmount ?? totalAmount;
    const finalDiscount = paidSummary?.discountAmount ?? discountAmount;
    const finalCoupon = paidSummary?.couponCode ?? couponCode;

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
            <p className="mt-1 font-medium text-gray-900">
              {selectedSpaces.join(", ")}
            </p>

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

            <p className="mt-4 text-sm text-gray-500">Amount paid</p>
            <p className="mt-1 font-medium text-gray-900">
              {formatPrice(finalPaid)}
            </p>

            {finalCoupon && Number(finalDiscount) > 0 && (
              <p className="mt-1 text-sm text-green-600">
                Coupon {finalCoupon} saved you {formatPrice(finalDiscount)}
              </p>
            )}
          </div>

          <button
            onClick={() => navigate("/customer")}
            className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
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
                  {selectedSpaces.join(", ")}
                </p>
              </div>
            </div>

            <div className="border-t pt-5">
              {hasCoupon && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
                    <span className="font-medium text-green-700">
                      Coupon {couponCode}
                    </span>
                    <span className="font-semibold text-green-700">
                      − {formatPrice(discountAmount)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-600">Amount</span>
                <span className="text-2xl font-bold text-gray-900">
                  {Number.isFinite(totalAmount) && totalAmount > 0
                    ? formatPrice(totalAmount)
                    : "Calculated securely by server"}
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                The final payable amount, including any coupon discount, is
                calculated and validated by the server when your order is
                created.
              </p>
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