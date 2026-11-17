import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios.js";

// Bookings are made in India Standard Time, so months and days are
// always calculated in IST.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const PERIODS = [
  { id: "today", label: "Today", days: 0 },
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
];

/* ---------- helpers ---------- */

const toIst = (date) => new Date(new Date(date).getTime() + IST_OFFSET_MS);

const istDateKey = (date) => toIst(date).toISOString().slice(0, 10);

const istMonthKey = (date) => toIst(date).toISOString().slice(0, 7);

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

// 1,25,000 -> ₹1.25L, 45,000 -> ₹45K
const formatCompact = (amount) => {
  const value = Number(amount) || 0;

  if (value >= 10000000) return `₹${+(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${+(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${+(value / 1000).toFixed(1)}K`;

  return `₹${Math.round(value)}`;
};

// Rounds the top of the chart up to a clean number (e.g. 83,400 -> 100,000).
const niceMax = (value) => {
  if (value <= 0) return 1000;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return step * magnitude;
};

// Only paid and confirmed bookings count as real reservations.
const isConfirmed = (reservation) =>
  reservation.status === "Confirmed" && reservation.paymentStatus === "Paid";

// Last 12 months (including the current one), oldest first.
const getLastMonths = (count = 3) => {
  const [year, month] = istMonthKey(Date.now()).split("-").map(Number);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));

    return {
      key: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString("en-IN", {
        month: "short",
        timeZone: "UTC",
      }),
      year: date.toLocaleDateString("en-IN", {
        year: "2-digit",
        timeZone: "UTC",
      }),
      fullLabel: date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    };
  });
};

/* ---------- small components ---------- */

const StatCard = ({ title, value, hint, tone, children }) => (
  <div className="bg-white shadow-sm rounded-lg p-5">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm text-gray-500">{title}</p>
      {children}
    </div>

    <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>

    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const RevenueChart = ({ data }) => {
  const [activeKey, setActiveKey] = useState(null);

  const max = useMemo(
    () => niceMax(Math.max(...data.map((item) => item.value), 0)),
    [data],
  );

  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="flex gap-3">
      {/* Y axis */}
      <div className="flex h-64 flex-col justify-between pb-0 text-right text-[11px] text-gray-400">
        {ticks.map((tick) => (
          <span key={tick} className="leading-none">
            {formatCompact(max * tick)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="min-w-[520px]">
          {/* Plot area */}
          <div className="relative h-64">
            {/* Grid lines */}
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute left-0 right-0 border-t border-dashed border-gray-200"
                style={{ top: `${(1 - tick) * 100}%` }}
              />
            ))}

            {/* Bars */}
            <div className="absolute inset-0 flex items-end gap-2">
              {data.map((item) => {
                const height = (item.value / max) * 100;
                const isActive = activeKey === item.key;

                return (
                  <div
                    key={item.key}
                    className="relative flex h-full flex-1 items-end justify-center"
                    onMouseEnter={() => setActiveKey(item.key)}
                    onMouseLeave={() => setActiveKey(null)}
                    onFocus={() => setActiveKey(item.key)}
                    onBlur={() => setActiveKey(null)}
                  >
                    {isActive && (
                      <div
                        className="absolute z-10 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow"
                        style={{ bottom: `calc(${height}% + 8px)` }}
                      >
                        {item.fullLabel}: {formatCurrency(item.value)}
                        <span className="ml-1 text-gray-300">
                          ({item.count}{" "}
                          {item.count === 1 ? "booking" : "bookings"})
                        </span>
                      </div>
                    )}

                    <div
                      tabIndex={0}
                      role="img"
                      aria-label={`${item.fullLabel}: ${formatCurrency(
                        item.value,
                      )}`}
                      className={`w-full max-w-10 rounded-t transition-colors ${
                        item.isCurrent
                          ? isActive
                            ? "bg-orange-600"
                            : "bg-orange-500"
                          : isActive
                            ? "bg-orange-400"
                            : "bg-orange-300"
                      }`}
                      style={{
                        height: item.value > 0 ? `max(${height}%, 3px)` : "0",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X axis */}
          <div className="mt-2 flex gap-2">
            {data.map((item) => (
              <div
                key={item.key}
                className="flex-1 text-center text-[11px] text-gray-500"
              >
                <div className="font-medium">{item.label}</div>
                <div className="text-gray-400">&apos;{item.year}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- component ---------- */

const AdminDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState("7d");
  const [includeGst, setIncludeGst] = useState(true);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/booking/all_reservations");

      if (response.data?.success) {
        setReservations(response.data.reservations || []);
      } else {
        const message = response.data?.message || "Failed to load dashboard";
        setError(message);
        toast.error(message);
      }
    } catch (err) {
      console.error("Fetch dashboard error:", err);

      const message = err.response?.data?.message || "Failed to load dashboard";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  /*
   * Reservation counts.
   *
   * New       = confirmed bookings created in the selected period
   * Ongoing   = confirmed bookings happening right now (startAt <= now < endAt)
   * Completed = confirmed bookings whose end time has passed
   * Upcoming  = confirmed bookings that have not started yet
   */
  const stats = useMemo(() => {
    const now = Date.now();
    const today = istDateKey(now);

    const selectedPeriod = PERIODS.find((item) => item.id === period);

    const oldestDay = istDateKey(
      now - Math.max(selectedPeriod.days - 1, 0) * 24 * 60 * 60 * 1000,
    );

    const result = { newCount: 0, ongoing: 0, completed: 0, upcoming: 0 };
    let confirmedTotal = 0;

    reservations.forEach((item) => {
      if (!isConfirmed(item)) return;

      confirmedTotal += 1;

      const created = item.createdAt ? istDateKey(item.createdAt) : null;

      if (created && created >= oldestDay && created <= today) {
        result.newCount += 1;
      }

      const start = new Date(item.startAt).getTime();
      const end = new Date(item.endAt).getTime();

      if (Number.isNaN(start) || Number.isNaN(end)) return;

      if (now >= end) result.completed += 1;
      else if (now >= start) result.ongoing += 1;
      else result.upcoming += 1;
    });

    return { ...result, confirmedTotal };
  }, [reservations, period]);

  /*
   * Monthly revenue for the last 12 months.
   *
   * Only paid and confirmed bookings count (cancelled and refunded
   * bookings are excluded). Grouped by the month the booking was made.
   * "Incl. GST" uses totalAmount, "Excl. GST" uses taxableAmount.
   */
  const monthlyRevenue = useMemo(() => {
    const months = getLastMonths(3).map((month, index, all) => ({
      ...month,
      value: 0,
      count: 0,
      isCurrent: index === all.length - 1,
    }));

    const byKey = new Map(months.map((month) => [month.key, month]));

    reservations.forEach((item) => {
      if (!isConfirmed(item) || !item.createdAt) return;

      const month = byKey.get(istMonthKey(item.createdAt));

      if (!month) return;

      const amount = includeGst
        ? Number(item.totalAmount)
        : Number(item.taxableAmount ?? item.totalAmount);

      month.value += Number.isFinite(amount) ? amount : 0;
      month.count += 1;
    });

    return months.map((month) => ({
      ...month,
      value: Math.round(month.value * 100) / 100,
    }));
  }, [reservations, includeGst]);

  const revenueTotals = useMemo(() => {
    const total = monthlyRevenue.reduce((sum, month) => sum + month.value, 0);

    return {
      total,
      thisMonth: monthlyRevenue[monthlyRevenue.length - 1]?.value || 0,
      lastMonth: monthlyRevenue[monthlyRevenue.length - 2]?.value || 0,
    };
  }, [monthlyRevenue]);

  const periodLabel = PERIODS.find((item) => item.id === period)?.label;

  return (
    <div className="p-6">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>

          <p className="text-sm text-gray-500 mt-1">
            Overview of workspace reservations and revenue
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReservations}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && !loading && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* RESERVATION STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="New Reservations"
          value={loading ? "—" : stats.newCount}
          hint={`Booked ${periodLabel?.toLowerCase()}`}
          tone="text-orange-600"
        >
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            aria-label="New reservations period"
            className="rounded border border-orange-400 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-orange-200"
          >
            {PERIODS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </StatCard>

        <StatCard
          title="Ongoing Reservations"
          value={loading ? "—" : stats.ongoing}
          hint="Happening right now"
          tone="text-green-600"
        />

        <StatCard
          title="Completed Reservations"
          value={loading ? "—" : stats.completed}
          hint="Booking period has ended"
          tone="text-blue-600"
        />

        <StatCard
          title="Upcoming Reservations"
          value={loading ? "—" : stats.upcoming}
          hint={loading ? "" : `${stats.confirmedTotal} confirmed in total`}
          tone="text-gray-700"
        />
      </div>

      {/* MONTHLY REVENUE */}

      <div className="bg-white shadow-sm rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold">Monthly Revenue</h2>

            <p className="text-sm text-gray-500 mt-1">
              Last 12 months, paid bookings only
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-gray-500">This month</p>
              <p className="text-lg font-semibold text-orange-600">
                {formatCurrency(revenueTotals.thisMonth)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Last month</p>
              <p className="text-lg font-semibold text-gray-700">
                {formatCurrency(revenueTotals.lastMonth)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">12-month total</p>
              <p className="text-lg font-semibold text-gray-700">
                {formatCurrency(revenueTotals.total)}
              </p>
            </div>

            <div className="inline-flex overflow-hidden rounded border border-orange-400 text-sm">
              <button
                type="button"
                onClick={() => setIncludeGst(true)}
                className={`px-3 py-1.5 ${
                  includeGst
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 hover:bg-orange-50"
                }`}
              >
                Incl. GST
              </button>

              <button
                type="button"
                onClick={() => setIncludeGst(false)}
                className={`px-3 py-1.5 ${
                  !includeGst
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 hover:bg-orange-50"
                }`}
              >
                Excl. GST
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-gray-500">
            Loading revenue...
          </div>
        ) : revenueTotals.total === 0 ? (
          <div className="flex h-64 items-center justify-center text-center text-gray-500">
            No paid bookings in the last 12 months yet.
          </div>
        ) : (
          <RevenueChart data={monthlyRevenue} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
