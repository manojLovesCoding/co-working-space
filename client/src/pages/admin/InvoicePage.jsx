import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Building2,
  FileText,
  CalendarDays,
  Mail,
  Phone,
  CheckCircle2,
  Armchair,
  UserRound,
} from "lucide-react";
import api from "../../api/axios";

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

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";

  const suffix = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

const getPeriodText = (period) => {
  if (!period) return "—";

  if (period.plan === "hourly") {
    return period.startTime
      ? `${formatDate(period.bookingDate)}, ${formatTime(
          period.startTime,
        )} - ${formatTime(period.endTime)}`
      : formatDate(period.bookingDate);
  }

  const end = period.endAt
    ? new Date(new Date(period.endAt).getTime() - 1)
    : null;

  return `${formatDate(period.startAt)} to ${
    end && !Number.isNaN(end.getTime()) ? formatDate(end) : "—"
  }`;
};

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
      <div className="flex min-h-screen items-center justify-center bg-[#EAF4FF]">
        <div className="text-center">
          <RefreshCw size={30} className="mx-auto animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Preparing your invoice...
          </p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#EAF4FF] p-6">
        <FileText size={36} className="text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">
          Invoice unavailable
        </h2>
        <p className="max-w-md text-center text-sm text-slate-500">
          {error || "Invoice not found."}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Go Back
          </button>
          <button
            onClick={loadInvoice}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isBusiness = invoice.invoiceType === "business";
  const { seller, buyer } = invoice;
  const hasDiscount = Number(invoice.discountAmount) > 0;

  const planLabel = `${invoice.period?.plan || "—"} ${
    invoice.period?.duration ?? ""
  } ${
    invoice.period?.plan === "hourly"
      ? "hour(s)"
      : invoice.period?.plan === "monthly"
        ? "month(s)"
        : invoice.period?.plan === "daily"
          ? "day(s)"
          : ""
  }`;

  const taxAmount =
    Number(invoice.cgst || 0) +
    Number(invoice.sgst || 0) +
    Number(invoice.igst || 0);

  return (
    <div className="min-h-screen bg-[#EAF4FF] px-3 py-6 sm:px-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        {/* ACTION BAR */}
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
              <Building2 size={17} />
              Oorza
              <span className="font-normal text-slate-400">/ Invoice</span>
            </div>
            <h1 className="mt-1 text-xl font-extrabold text-slate-900">
              Invoice Details
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              <Printer size={16} />
              Print / PDF
            </button>
          </div>
        </div>

        {/* INVOICE */}
        <div className="invoice-sheet overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg print:rounded-none print:border-0 print:shadow-none">
          {/* HEADER */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-blue-600 px-6 py-5 sm:px-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-blue-700">
                <Building2 size={22} />
                <span className="text-xl font-extrabold">
                  {seller?.name || "Oorza"}
                </span>
              </div>

              {seller?.address && (
                <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-500">
                  {seller.address}
                </p>
              )}

              {seller?.gstin && (
                <p className="mt-1 text-xs text-slate-600">
                  GSTIN: {seller.gstin}
                </p>
              )}

              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                {seller?.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail size={11} />
                    {seller.email}
                  </span>
                )}
                {seller?.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={11} />
                    {seller.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-2xl font-extrabold uppercase tracking-wide text-slate-900">
                {isBusiness ? "Tax Invoice" : "Invoice"}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 size={12} />
                PAYMENT RECEIVED
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-5 sm:px-8">
            {/* INVOICE DETAILS */}
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-blue-50/70 p-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Invoice Number
                </p>
                <p className="mt-1 break-all text-xs font-bold text-slate-900">
                  {invoice.invoiceNumber || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Invoice Date
                </p>
                <p className="mt-1 text-xs font-bold text-slate-900">
                  {formatDate(invoice.issuedAt)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Booking ID
                </p>
                <p className="mt-1 break-all text-xs font-bold text-slate-900">
                  {invoice.bookingId || "—"}
                </p>
              </div>
            </div>

            {/* BILLING + BOOKING */}
            <div className="grid grid-cols-2 gap-5">
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-blue-700">
                  <UserRound size={14} />
                  Billed To
                </h3>

                <p className="text-sm font-bold text-slate-900">
                  {isBusiness ? buyer?.businessName || "—" : buyer?.name || "—"}
                </p>

                {buyer?.address && (
                  <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-500">
                    {buyer.address}
                  </p>
                )}

                {isBusiness && buyer?.gstin && (
                  <p className="mt-1 text-xs text-slate-600">
                    GSTIN: {buyer.gstin}
                  </p>
                )}

                {isBusiness && buyer?.name && (
                  <p className="mt-1 text-xs text-slate-500">
                    Contact: {buyer.name}
                  </p>
                )}

                {buyer?.email && (
                  <p className="mt-1 break-all text-xs text-slate-500">
                    {buyer.email}
                  </p>
                )}

                {buyer?.phone && (
                  <p className="mt-1 text-xs text-slate-500">{buyer.phone}</p>
                )}
              </section>

              <section className="border-l border-slate-200 pl-5">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-blue-700">
                  <CalendarDays size={14} />
                  Booking Information
                </h3>

                <p className="text-xs text-slate-500">Booking Plan</p>
                <p className="mt-0.5 text-sm font-bold capitalize text-slate-900">
                  {planLabel}
                </p>

                <p className="mt-2 text-xs text-slate-500">Booking Period</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-900">
                  {getPeriodText(invoice.period)}
                </p>

                {isBusiness && buyer?.state && (
                  <>
                    <p className="mt-2 text-xs text-slate-500">
                      Place of Supply
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-900">
                      {buyer.state} ({buyer.stateCode})
                    </p>
                  </>
                )}
              </section>
            </div>

            {/* ITEMS */}
            <section>
              <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-blue-700">
                Invoice Items
              </h3>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-600">
                    <th className="px-3 py-2 font-bold">Description</th>
                    <th className="px-3 py-2 font-bold">SAC</th>
                    <th className="px-3 py-2 text-right font-bold">Qty</th>
                    <th className="px-3 py-2 text-right font-bold">Rate</th>
                    <th className="px-3 py-2 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-semibold text-slate-800">
                        {item.description}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {item.sacCode || "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {item.quantity} {item.unit}
                        {item.quantity > 1 ? "s" : ""}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}

                  {(!invoice.items || invoice.items.length === 0) && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-3 py-4 text-center text-slate-400"
                      >
                        No invoice items available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* SEATS + TOTALS */}
            <div className="grid grid-cols-2 gap-5">
              <section>
                {invoice.seats?.length > 0 && (
                  <>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-blue-700">
                      <Armchair size={14} />
                      Reserved Seats
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {invoice.seats.map((seat, index) => (
                        <span
                          key={`${seat.spaceCode || "seat"}-${index}`}
                          className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-slate-700"
                        >
                          {seat.spaceCode}
                          {seat.name ? ` (${seat.name})` : ""}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {isBusiness && (
                  <div className="mt-3 text-xs text-slate-600">
                    <p className="font-bold text-slate-700">Tax Details</p>
                    <p className="mt-1">
                      Taxable Value: {formatCurrency(invoice.taxableValue)}
                    </p>
                    {invoice.taxType === "IGST" ? (
                      <p>
                        IGST @ {invoice.gstRate}%:{" "}
                        {formatCurrency(invoice.igst)}
                      </p>
                    ) : (
                      <>
                        <p>
                          CGST @ {invoice.gstRate / 2}%:{" "}
                          {formatCurrency(invoice.cgst)}
                        </p>
                        <p>
                          SGST @ {invoice.gstRate / 2}%:{" "}
                          {formatCurrency(invoice.sgst)}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {!isBusiness && (
                  <p className="mt-2 text-[10px] leading-4 text-slate-500">
                    Includes GST @ {invoice.gstRate}% (
                    {formatCurrency(taxAmount)}).
                  </p>
                )}
              </section>

              <section className="ml-auto w-full max-w-xs">
                <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-blue-700">
                  Payment Summary
                </h3>

                <div className="space-y-2 rounded-lg border border-slate-200 p-3 text-xs">
                  <div className="flex justify-between gap-3 text-slate-600">
                    <span>Subtotal (incl. GST)</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(invoice.subtotal)}
                    </span>
                  </div>

                  {hasDiscount && (
                    <div className="flex justify-between gap-3 text-emerald-700">
                      <span>
                        Discount
                        {invoice.couponCode ? ` (${invoice.couponCode})` : ""}
                      </span>
                      <span className="font-semibold">
                        - {formatCurrency(invoice.discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
                    <span>Total Paid</span>
                    <span className="text-blue-700">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* PAYMENT RECORD */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    Payment received successfully
                  </p>
                  <p className="text-[10px] text-emerald-700">
                    Paid online via Razorpay
                  </p>
                </div>
              </div>

              {invoice.razorpayPaymentId && (
                <p className="max-w-[48%] break-all text-right text-[9px] text-emerald-800">
                  Payment ID: {invoice.razorpayPaymentId}
                </p>
              )}
            </div>

            {/* FOOTER */}
            <footer className="flex items-end justify-between gap-4 border-t border-slate-200 pt-3">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Thank you for choosing {seller?.name || "Oorza"}!
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Computer-generated invoice. No signature required.
                </p>
              </div>

              <p className="text-right text-[10px] font-bold text-blue-700">
                Your Space. Your People. Your Work.
              </p>
            </footer>
          </div>
        </div>

        <div className="mt-4 flex justify-center print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700"
          >
            <Printer size={16} />
            Print Invoice
          </button>
        </div>
      </div>

      <style>{`
        @page {
          size: A4 portrait;
          margin: 9mm;
        }

        @media print {
          html,
          body,
          #root {
            width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .invoice-sheet {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .invoice-sheet > div:last-child {
            padding: 12px 18px !important;
          }

          .invoice-sheet table {
            page-break-inside: auto;
          }

          .invoice-sheet tr,
          .invoice-sheet section,
          .invoice-sheet footer {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .invoice-sheet * {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
