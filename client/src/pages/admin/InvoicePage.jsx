import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import api from "../../api/axios";


// Invoices are issued in India Standard Time.
const TIME_ZONE = "Asia/Kolkata";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00+05:30`)
    : new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

// endAt is exclusive, so subtract 1 ms to show the last booked day.
const getPeriodText = (period) => {
  if (!period) return "—";

  if (period.plan === "hourly") {
    return period.startTime
      ? `${formatDate(period.bookingDate)}, ${formatTime(
          period.startTime,
        )} - ${formatTime(period.endTime)}`
      : formatDate(period.bookingDate);
  }

  const end = period.endAt ? new Date(new Date(period.endAt).getTime() - 1) : null;

  return `${formatDate(period.startAt)} to ${end ? formatDate(end) : "—"}`;
};

/**
 * mode="customer"  ->  route /customer/invoice/:bookingId
 * mode="admin"     ->  route /admin/invoices/:id
 */
export default function InvoicePage({ mode = "customer" }) {
  const navigate = useNavigate();
  const { bookingId, id } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const url =
        mode === "admin"
          ? `/invoice/admin/${id}`
          : `/invoice/booking/${bookingId}`;

      const response = await api.get(url);

      if (response.data?.success) {
        setInvoice(response.data.invoice);
      } else {
        throw new Error(response.data?.message || "Failed to load invoice.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load invoice.",
      );
    } finally {
      setLoading(false);
    }
  }, [mode, id, bookingId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <RefreshCw size={30} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6">
        <p className="font-medium text-red-600">
          {error || "Invoice not found."}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Go back
          </button>

          <button
            type="button"
            onClick={loadInvoice}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const isBusiness = invoice.invoiceType === "business";
  const { seller, buyer } = invoice;
  const hasDiscount = Number(invoice.discountAmount) > 0;

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        {/* Toolbar (hidden when printing) */}
        <div className="mb-4 flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Printer size={16} />
            Print / Save as PDF
          </button>
        </div>

        {/* Invoice document */}
        <div className="rounded-xl bg-white p-6 shadow-sm sm:p-10 print:rounded-none print:p-0 print:shadow-none">
          <div className="flex flex-col justify-between gap-6 border-b border-gray-200 pb-6 sm:flex-row">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{seller?.name}</h1>

              {seller?.address && (
                <p className="mt-1 max-w-xs whitespace-pre-line text-sm text-gray-600">
                  {seller.address}
                </p>
              )}

              {seller?.gstin && (
                <p className="mt-1 text-sm text-gray-600">
                  GSTIN: <span className="font-medium">{seller.gstin}</span>
                </p>
              )}

              {(seller?.email || seller?.phone) && (
                <p className="mt-1 text-sm text-gray-600">
                  {[seller.email, seller.phone].filter(Boolean).join(" | ")}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <p className="text-2xl font-bold uppercase tracking-wide text-gray-900">
                {isBusiness ? "Tax Invoice" : "Invoice"}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Invoice No:{" "}
                <span className="font-semibold text-gray-900">
                  {invoice.invoiceNumber}
                </span>
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Date:{" "}
                <span className="font-medium text-gray-900">
                  {formatDate(invoice.issuedAt)}
                </span>
              </p>

              <p className="mt-1 break-all text-xs text-gray-500">
                Booking: {invoice.bookingId}
              </p>
            </div>
          </div>

          {/* Billed to */}
          <div className="grid gap-6 border-b border-gray-200 py-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Billed to
              </p>

              {isBusiness ? (
                <>
                  <p className="mt-2 font-semibold text-gray-900">
                    {buyer.businessName}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
                    {buyer.address}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    GSTIN: <span className="font-medium">{buyer.gstin}</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Contact: {buyer.name}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 font-semibold text-gray-900">
                    {buyer.name}
                  </p>
                  {buyer.address && (
                    <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
                      {buyer.address}
                    </p>
                  )}
                </>
              )}

              {buyer.email && (
                <p className="mt-1 text-sm text-gray-600">{buyer.email}</p>
              )}
              {buyer.phone && (
                <p className="mt-1 text-sm text-gray-600">{buyer.phone}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Booking period
              </p>
              <p className="mt-2 text-sm font-medium capitalize text-gray-900">
                {invoice.period?.plan} - {invoice.period?.duration}{" "}
                {invoice.period?.plan === "hourly"
                  ? "hour(s)"
                  : invoice.period?.plan === "monthly"
                    ? "month(s)"
                    : "day(s)"}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {getPeriodText(invoice.period)}
              </p>

              {isBusiness && buyer.state && (
                <p className="mt-3 text-sm text-gray-600">
                  Place of supply:{" "}
                  <span className="font-medium">
                    {buyer.state} ({buyer.stateCode})
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto py-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-3 font-semibold">Description</th>
                  <th className="px-3 py-2 font-semibold">SAC</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Rate</th>
                  <th className="py-2 pl-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>

              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 align-top">
                    <td className="py-3 pr-3 text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {item.sacCode || "—"}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-600">
                      {item.quantity} {item.unit}
                      {item.quantity > 1 ? "s" : ""}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-600">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-3 pl-3 text-right font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Seat holders */}
            {invoice.seats?.length > 0 && (
              <p className="mt-4 text-xs text-gray-500">
                Seats:{" "}
                {invoice.seats
                  .map((seat) =>
                    seat.name ? `${seat.spaceCode} (${seat.name})` : seat.spaceCode,
                  )
                  .join(", ")}
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="ml-auto w-full max-w-sm space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal (incl. GST)</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>

            {hasDiscount && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount{invoice.couponCode ? ` (${invoice.couponCode})` : ""}
                </span>
                <span>- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-300 pt-3 text-base font-bold text-gray-900">
              <span>Total paid</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>

            {/* Tax details */}
            {isBusiness ? (
              <div className="mt-4 space-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 print:border print:border-gray-200">
                <div className="flex justify-between">
                  <span>Taxable value</span>
                  <span>{formatCurrency(invoice.taxableValue)}</span>
                </div>

                {invoice.taxType === "IGST" ? (
                  <div className="flex justify-between">
                    <span>IGST @ {invoice.gstRate}%</span>
                    <span>{formatCurrency(invoice.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>CGST @ {invoice.gstRate / 2}%</span>
                      <span>{formatCurrency(invoice.cgst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST @ {invoice.gstRate / 2}%</span>
                      <span>{formatCurrency(invoice.sgst)}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="pt-1 text-xs text-gray-500">
                Includes GST @ {invoice.gstRate}% of{" "}
                {formatCurrency(invoice.cgst + invoice.sgst + invoice.igst)}.
              </p>
            )}
          </div>

          <div className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-500">
            <p>
              Payment received online via Razorpay
              {invoice.razorpayPaymentId
                ? ` (Payment ID: ${invoice.razorpayPaymentId})`
                : ""}
              .
            </p>
            <p className="mt-1">
              This is a computer-generated invoice and does not require a
              signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}