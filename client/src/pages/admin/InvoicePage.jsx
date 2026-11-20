
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
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF]">
        <div className="text-center">
          <RefreshCw
            size={27}
            className="mx-auto animate-spin text-[#A95643]"
          />
          <p className="mt-3 text-sm font-semibold text-[#8F8175]">
            Preparing your invoice...
          </p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#FAF6EF] p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
          <FileText size={30} />
        </div>

        <h2 className="text-lg font-bold text-[#382B26]">
          Invoice unavailable
        </h2>

        <p className="max-w-md text-center text-sm text-[#8F8175]">
          {error || "Invoice not found."}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-[#E9DED0] bg-white px-4 py-2 text-sm font-semibold text-[#71392F] transition hover:bg-[#F8EDE6]"
          >
            Go Back
          </button>

          <button
            type="button"
            onClick={loadInvoice}
            className="rounded-lg bg-[#A95643] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#71392F]"
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
    <div className="min-h-screen bg-[#FAF6EF] px-3 py-4 sm:px-5 sm:py-5 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        {/* ACTION BAR */}
        <div className="mb-3 flex items-center justify-between gap-2 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#A95643]">
              <Building2 size={15} />
              Oorza
              <span className="font-normal text-[#C5B5A8]">/ Invoice</span>
            </div>

            <h1 className="mt-1 text-lg font-extrabold text-[#382B26] sm:text-xl">
              Invoice Details
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9DED0] bg-white px-3 py-2 text-xs font-semibold text-[#71392F] transition hover:bg-[#F8EDE6]"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#A95643] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#71392F]"
            >
              <Printer size={15} />
              Print / PDF
            </button>
          </div>
        </div>

        {/* INVOICE */}
        <div className="invoice-sheet overflow-hidden rounded-xl border border-[#E9DED0] bg-white shadow-md print:rounded-none print:border-0 print:shadow-none">
          {/* HEADER */}
          <div className="flex items-start justify-between gap-3 border-b-2 border-[#A95643] px-4 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#A95643]">
                <Building2 size={20} />
                <span className="text-lg font-extrabold">
                  {seller?.name || "Oorza"}
                </span>
              </div>

              {seller?.address && (
                <p className="mt-1.5 whitespace-pre-line text-[11px] leading-4 text-[#8F8175]">
                  {seller.address}
                </p>
              )}

              {seller?.gstin && (
                <p className="mt-1 text-[11px] text-[#57473E]">
                  GSTIN: {seller.gstin}
                </p>
              )}

              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#8F8175]">
                {seller?.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail size={10} />
                    {seller.email}
                  </span>
                )}

                {seller?.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={10} />
                    {seller.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-lg font-extrabold uppercase tracking-wide text-[#382B26] sm:text-2xl">
                {isBusiness ? "Tax Invoice" : "Invoice"}
              </p>

              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#EAF0E6] px-2 py-1 text-[9px] font-bold text-[#527C61]">
                <CheckCircle2 size={11} />
                PAYMENT RECEIVED
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            {/* INVOICE DETAILS */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#E9DED0] bg-[#FBF8F3] p-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#8F8175]">
                  Invoice Number
                </p>
                <p className="mt-1 break-all text-[11px] font-bold text-[#382B26]">
                  {invoice.invoiceNumber || "—"}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#8F8175]">
                  Invoice Date
                </p>
                <p className="mt-1 text-[11px] font-bold text-[#382B26]">
                  {formatDate(invoice.issuedAt)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#8F8175]">
                  Booking ID
                </p>
                <p className="mt-1 break-all text-[11px] font-bold text-[#382B26]">
                  {invoice.bookingId || "—"}
                </p>
              </div>
            </div>

            {/* BILLING + BOOKING */}
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#A95643]">
                  <UserRound size={13} />
                  Billed To
                </h3>

                <p className="text-xs font-bold text-[#382B26]">
                  {isBusiness ? buyer?.businessName || "—" : buyer?.name || "—"}
                </p>

                {buyer?.address && (
                  <p className="mt-1 whitespace-pre-line text-[11px] leading-4 text-[#8F8175]">
                    {buyer.address}
                  </p>
                )}

                {isBusiness && buyer?.gstin && (
                  <p className="mt-1 text-[10px] text-[#57473E]">
                    GSTIN: {buyer.gstin}
                  </p>
                )}

                {isBusiness && buyer?.name && (
                  <p className="mt-1 text-[10px] text-[#8F8175]">
                    Contact: {buyer.name}
                  </p>
                )}

                {buyer?.email && (
                  <p className="mt-1 break-all text-[10px] text-[#8F8175]">
                    {buyer.email}
                  </p>
                )}

                {buyer?.phone && (
                  <p className="mt-1 text-[10px] text-[#8F8175]">
                    {buyer.phone}
                  </p>
                )}
              </section>

              <section className="border-l border-[#E9DED0] pl-3 sm:pl-5">
                <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#A95643]">
                  <CalendarDays size={13} />
                  Booking Information
                </h3>

                <p className="text-[10px] text-[#8F8175]">Booking Plan</p>
                <p className="mt-0.5 text-xs font-bold capitalize text-[#382B26]">
                  {planLabel}
                </p>

                <p className="mt-2 text-[10px] text-[#8F8175]">
                  Booking Period
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#382B26]">
                  {getPeriodText(invoice.period)}
                </p>

                {isBusiness && buyer?.state && (
                  <>
                    <p className="mt-2 text-[10px] text-[#8F8175]">
                      Place of Supply
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#382B26]">
                      {buyer.state} ({buyer.stateCode})
                    </p>
                  </>
                )}
              </section>
            </div>

            {/* ITEMS */}
            <section>
              <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#A95643]">
                Invoice Items
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-[11px]">
                  <thead>
                    <tr className="border-y border-[#E9DED0] bg-[#F8EDE6] text-left text-[9px] uppercase tracking-wide text-[#71392F]">
                      <th className="px-2.5 py-2 font-bold">Description</th>
                      <th className="px-2.5 py-2 font-bold">SAC</th>
                      <th className="px-2.5 py-2 text-right font-bold">Qty</th>
                      <th className="px-2.5 py-2 text-right font-bold">Rate</th>
                      <th className="px-2.5 py-2 text-right font-bold">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={index} className="border-b border-[#F2E9E0]">
                        <td className="px-2.5 py-2 font-semibold text-[#382B26]">
                          {item.description}
                        </td>

                        <td className="px-2.5 py-2 text-[#8F8175]">
                          {item.sacCode || "—"}
                        </td>

                        <td className="px-2.5 py-2 text-right text-[#57473E]">
                          {item.quantity} {item.unit}
                          {item.quantity > 1 ? "s" : ""}
                        </td>

                        <td className="px-2.5 py-2 text-right text-[#57473E]">
                          {formatCurrency(item.rate)}
                        </td>

                        <td className="px-2.5 py-2 text-right font-bold text-[#382B26]">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}

                    {(!invoice.items || invoice.items.length === 0) && (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-3 py-4 text-center text-[#A99B8F]"
                        >
                          No invoice items available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SEATS + TOTALS */}
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <section>
                {invoice.seats?.length > 0 && (
                  <>
                    <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#A95643]">
                      <Armchair size={13} />
                      Reserved Seats
                    </h3>

                    <div className="flex flex-wrap gap-1.5">
                      {invoice.seats.map((seat, index) => (
                        <span
                          key={`${seat.spaceCode || "seat"}-${index}`}
                          className="rounded-md border border-[#E9DED0] bg-[#FBF8F3] px-2 py-1 text-[9px] font-semibold text-[#57473E]"
                        >
                          {seat.spaceCode}
                          {seat.name ? ` (${seat.name})` : ""}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {isBusiness && (
                  <div className="mt-3 text-[10px] text-[#57473E]">
                    <p className="font-bold text-[#382B26]">Tax Details</p>

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
                  <p className="mt-2 text-[9px] leading-4 text-[#8F8175]">
                    Includes GST @ {invoice.gstRate}% (
                    {formatCurrency(taxAmount)}).
                  </p>
                )}
              </section>

              <section className="ml-auto w-full max-w-xs">
                <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#A95643]">
                  Payment Summary
                </h3>

                <div className="space-y-2 rounded-lg border border-[#E9DED0] bg-[#FBF8F3] p-3 text-[10px]">
                  <div className="flex justify-between gap-2 text-[#8F8175]">
                    <span>Subtotal (incl. GST)</span>
                    <span className="font-semibold text-[#382B26]">
                      {formatCurrency(invoice.subtotal)}
                    </span>
                  </div>

                  {hasDiscount && (
                    <div className="flex justify-between gap-2 text-[#527C61]">
                      <span>
                        Discount
                        {invoice.couponCode ? ` (${invoice.couponCode})` : ""}
                      </span>
                      <span className="font-semibold">
                        - {formatCurrency(invoice.discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between gap-2 border-t border-[#E9DED0] pt-2 text-xs font-extrabold text-[#382B26]">
                    <span>Total Paid</span>
                    <span className="text-[#A95643]">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* PAYMENT RECORD */}
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#C9D8C4] bg-[#EAF0E6] px-3 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={16}
                  className="shrink-0 text-[#527C61]"
                />

                <div>
                  <p className="text-[11px] font-bold text-[#3F654B]">
                    Payment received successfully
                  </p>
                  <p className="text-[9px] text-[#527C61]">
                    Paid online via Razorpay
                  </p>
                </div>
              </div>

              {invoice.razorpayPaymentId && (
                <p className="max-w-[48%] break-all text-right text-[9px] text-[#527C61]">
                  Payment ID: {invoice.razorpayPaymentId}
                </p>
              )}
            </div>

            {/* FOOTER */}
            <footer className="flex items-end justify-between gap-3 border-t border-[#E9DED0] pt-3">
              <div>
                <p className="text-[11px] font-bold text-[#382B26]">
                  Thank you for choosing {seller?.name || "Oorza"}!
                </p>
                <p className="mt-1 text-[9px] text-[#8F8175]">
                  Computer-generated invoice. No signature required.
                </p>
              </div>

              <p className="text-right text-[9px] font-bold text-[#A95643]">
                Your Space. Your People. Your Work.
              </p>
            </footer>
          </div>
        </div>

        {/* PRINT BUTTON */}
        <div className="mt-3 flex justify-center print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E9DED0] bg-white px-4 py-2 text-xs font-bold text-[#A95643] transition hover:bg-[#F8EDE6]"
          >
            <Printer size={15} />
            Print Invoice
          </button>
        </div>
      </div>

      {/* PRINT STYLES */}
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
