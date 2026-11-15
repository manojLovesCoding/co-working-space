import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios.js";

const ITEMS_PER_PAGE = 10;
const TIME_ZONE = "Asia/Kolkata";

const TYPE_FILTERS = ["All", "customer", "business"];

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const selectClass =
  "border border-orange-400 rounded px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-orange-200 capitalize";

const AdminInvoices = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/invoice/all");

      if (response.data?.success) {
        setInvoices(response.data.invoices || []);
      } else {
        toast.error(response.data?.message || "Failed to load invoices");
      }
    } catch (error) {
      console.error("Fetch invoices error:", error);

      toast.error(error.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();

    return invoices.filter((item) => {
      if (typeFilter !== "All" && item.invoiceType !== typeFilter) {
        return false;
      }

      if (!value) return true;

      return [
        item.invoiceNumber,
        item.bookingId,
        item.buyer?.name,
        item.buyer?.businessName,
        item.buyer?.gstin,
        item.user?.email,
      ].some((field) => field?.toLowerCase().includes(value));
    });
  }, [invoices, search, typeFilter]);

  const summary = useMemo(() => {
    let business = 0;
    let customer = 0;
    let total = 0;

    invoices.forEach((item) => {
      if (item.invoiceType === "business") business += 1;
      else customer += 1;

      total += Number(item.totalAmount) || 0;
    });

    return { business, customer, total };
  }, [invoices]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const goToPage = useCallback(
    (page) => {
      if (page < 1 || page > totalPages) return;

      setCurrentPage(page);
    },
    [totalPages],
  );

  const hasActiveFilters = search || typeFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("All");
    setCurrentPage(1);
  };

  return (
    <div className="p-6">
      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>

          <p className="mt-1 text-sm text-gray-500">
            Invoices generated for confirmed, paid bookings
          </p>
        </div>

        <div className="text-sm text-gray-600">
          Total Invoices:{" "}
          <span className="font-semibold">{invoices.length}</span>
        </div>
      </div>

      {/* SUMMARY */}

      {!loading && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Customer invoices</p>
            <p className="mt-1 text-2xl font-semibold text-blue-600">
              {summary.customer}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Business invoices</p>
            <p className="mt-1 text-2xl font-semibold text-purple-600">
              {summary.business}
            </p>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total invoiced</p>
            <p className="mt-1 text-2xl font-semibold text-orange-600">
              {formatCurrency(summary.total)}
            </p>
          </div>
        </div>
      )}

      {/* SEARCH + FILTERS */}

      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by invoice no, booking ID, customer, business name or GSTIN..."
            className="flex-1 rounded border border-orange-400 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
          />

          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setCurrentPage(1);
            }}
            className={selectClass}
            aria-label="Filter by invoice type"
          >
            {TYPE_FILTERS.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "All types" : `${option} invoice`}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={fetchInvoices}
            disabled={loading}
            className="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading invoices...
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            {hasActiveFilters
              ? "No invoices match your search or filters."
              : "No invoices yet. They appear once a booking is confirmed and paid."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-orange-50">
                  <th className="p-3 text-left text-sm font-semibold">#</th>
                  <th className="p-3 text-left text-sm font-semibold">
                    Invoice No
                  </th>
                  <th className="p-3 text-left text-sm font-semibold">
                    Billed To
                  </th>
                  <th className="p-3 text-left text-sm font-semibold">Type</th>
                  <th className="p-3 text-left text-sm font-semibold">
                    Booking ID
                  </th>
                  <th className="p-3 text-left text-sm font-semibold">Date</th>
                  <th className="p-3 text-left text-sm font-semibold">
                    Amount
                  </th>
                  <th className="p-3 text-left text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((item, index) => {
                  const isBusiness = item.invoiceType === "business";

                  return (
                    <tr
                      key={item._id}
                      className="border-b align-top hover:bg-gray-50"
                    >
                      <td className="p-3 text-sm text-gray-600">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      <td className="p-3 text-sm font-semibold text-orange-600">
                        {item.invoiceNumber}
                      </td>

                      <td className="p-3">
                        <div className="text-sm font-medium">
                          {isBusiness
                            ? item.buyer?.businessName
                            : item.buyer?.name}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          {isBusiness
                            ? `GSTIN: ${item.buyer?.gstin}`
                            : item.user?.email || item.buyer?.email}
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            isBusiness
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isBusiness ? "Business" : "Customer"}
                        </span>
                      </td>

                      <td className="break-all p-3 text-xs text-gray-600">
                        {item.bookingId}
                      </td>

                      <td className="whitespace-nowrap p-3 text-sm">
                        {formatDate(item.issuedAt)}
                      </td>

                      <td className="whitespace-nowrap p-3 text-sm font-semibold">
                        {formatCurrency(item.totalAmount)}
                      </td>

                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/invoices/${item._id}`)}
                          className="rounded border border-orange-400 px-3 py-1.5 text-orange-500 hover:bg-orange-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t p-4 sm:flex-row">
            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
              </span>{" "}
              of <span className="font-medium">{filtered.length}</span> invoices
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={`min-w-9 rounded border px-3 py-1.5 ${
                      currentPage === page
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "hover:bg-orange-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvoices;