import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  LoaderCircle,
  RefreshCw,
  TrendingUp,
  Wallet,
  CalendarCheck,
  CalendarClock,
} from "lucide-react";

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

/* ---------- Helpers ---------- */

const toIst = (date) => new Date(new Date(date).getTime() + IST_OFFSET_MS);

const istDateKey = (date) => toIst(date).toISOString().slice(0, 10);

const istMonthKey = (date) => toIst(date).toISOString().slice(0, 7);

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatCompact = (amount) => {
  const value = Number(amount) || 0;

  if (value >= 10000000) return `₹${+(value / 10000000).toFixed(2)}Cr`;

  if (value >= 100000) return `₹${+(value / 100000).toFixed(2)}L`;

  if (value >= 1000) return `₹${+(value / 1000).toFixed(1)}K`;

  return `₹${Math.round(value)}`;
};

const niceMax = (value) => {
  if (value <= 0) return 1000;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return step * magnitude;
};

const isConfirmed = (reservation) =>
  reservation.status === "Confirmed" && reservation.paymentStatus === "Paid";

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

/* ---------- Stat Card ---------- */

const StatCard = ({
  title,
  value,
  hint,
  icon: Icon,
  iconStyle,
  valueStyle,
  children,
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100/60">
    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-50/70 transition-transform duration-300 group-hover:scale-125" />

    <div className="relative z-10 flex items-start justify-between gap-3">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconStyle}`}
      >
        <Icon className="h-6 w-6" />
      </div>

      {children}
    </div>

    <div className="relative z-10 mt-5">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className={`mt-1 text-3xl font-bold tracking-tight ${valueStyle}`}>
        {value}
      </p>

      {hint && (
        <p className="mt-2 text-xs font-medium text-slate-400">{hint}</p>
      )}
    </div>
  </div>
);

/* ---------- Revenue Chart ---------- */

const RevenueChart = ({ data }) => {
  const [activeKey, setActiveKey] = useState(null);

  const max = useMemo(
    () => niceMax(Math.max(...data.map((item) => item.value), 0)),
    [data],
  );

  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="rounded-xl border border-slate-100 bg-[#FBFDFF] p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-700">Revenue Overview</h3>
          <p className="mt-1 text-xs text-slate-400">Monthly booking revenue</p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          Paid & Confirmed
        </div>
      </div>

      <div className="flex gap-3">
        {/* Y Axis */}
        <div className="flex h-64 flex-col justify-between pb-0 text-right text-[10px] font-medium text-slate-400 sm:text-xs">
          {ticks.map((tick) => (
            <span key={tick} className="leading-none">
              {formatCompact(max * tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="min-w-[520px]">
            {/* Chart Plot */}
            <div className="relative h-64">
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute left-0 right-0 border-t border-dashed border-slate-200"
                  style={{ top: `${(1 - tick) * 100}%` }}
                />
              ))}

              <div className="absolute inset-0 flex items-end gap-3 px-2">
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
                          className="absolute z-20 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-xl"
                          style={{
                            bottom: `calc(${height}% + 10px)`,
                          }}
                        >
                          <p className="font-semibold">{item.fullLabel}</p>

                          <p className="mt-1 font-bold text-blue-300">
                            {formatCurrency(item.value)}
                          </p>

                          <p className="mt-1 text-slate-300">
                            {item.count}{" "}
                            {item.count === 1 ? "booking" : "bookings"}
                          </p>
                        </div>
                      )}

                      <div
                        tabIndex={0}
                        role="img"
                        aria-label={`${item.fullLabel}: ${formatCurrency(
                          item.value,
                        )}`}
                        className={`w-full max-w-12 rounded-t-lg transition-all duration-200 ${
                          item.isCurrent
                            ? isActive
                              ? "bg-indigo-600"
                              : "bg-blue-600"
                            : isActive
                              ? "bg-blue-500"
                              : "bg-blue-300"
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

            {/* X Axis */}
            <div className="mt-3 flex gap-3 px-2">
              {data.map((item) => (
                <div key={item.key} className="flex-1 text-center text-xs">
                  <p
                    className={`font-semibold ${
                      item.isCurrent ? "text-blue-700" : "text-slate-500"
                    }`}
                  >
                    {item.label}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    &apos;{item.year}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Admin Dashboard ---------- */

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
   * New       = confirmed bookings created in selected period
   * Ongoing   = confirmed bookings happening right now
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

    const result = {
      newCount: 0,
      ongoing: 0,
      completed: 0,
      upcoming: 0,
    };

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
   * Monthly revenue for the last 3 months.
   * Only paid and confirmed bookings count.
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
    <div className="min-h-screen bg-[#EAF4FF] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Oorza Admin
              </span>

              <span className="text-xs font-medium text-slate-400">
                / Overview
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Monitor workspace reservations and business revenue.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReservations}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh Dashboard"}
          </button>
        </div>

        {/* Hero Banner */}
        <div className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-200/60 sm:p-8">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
          <div className="absolute -bottom-24 right-36 h-52 w-52 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 flex items-center gap-2 text-blue-100">
                <Activity className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-[0.15em]">
                  Workspace Analytics
                </span>
              </div>

              <h2 className="text-xl font-bold sm:text-2xl">
                Your workspace at a glance.
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-blue-100">
                Track reservations, monitor activity and understand your
                workspace revenue from one place.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Dashboard Overview
                </span>

                <span className="text-xs text-blue-100">
                  All figures based on confirmed and paid bookings
                </span>
              </div>
            </div>

            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm sm:flex">
              <TrendingUp className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <Activity className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-bold text-rose-800">
                  Unable to load dashboard
                </p>
                <p className="mt-0.5 text-xs text-rose-600">{error}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchReservations}
              className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Reservation Stats */}
        <div className="mb-7">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Reservation Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track booking activity and reservation status.
              </p>
            </div>

            <span className="w-fit rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700">
              <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
              Paid & Confirmed
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="New Reservations"
              value={loading ? "—" : stats.newCount}
              hint={`Booked ${periodLabel?.toLowerCase()}`}
              icon={CalendarDays}
              iconStyle="bg-blue-50 text-blue-600"
              valueStyle="text-blue-700"
            >
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                aria-label="New reservations period"
                className="max-w-[125px] rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 outline-none focus:ring-2 focus:ring-blue-200"
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
              icon={Activity}
              iconStyle="bg-emerald-50 text-emerald-600"
              valueStyle="text-emerald-600"
            />

            <StatCard
              title="Completed Reservations"
              value={loading ? "—" : stats.completed}
              hint="Booking period has ended"
              icon={CalendarCheck}
              iconStyle="bg-indigo-50 text-indigo-600"
              valueStyle="text-indigo-600"
            />

            <StatCard
              title="Upcoming Reservations"
              value={loading ? "—" : stats.upcoming}
              hint={
                loading
                  ? "Awaiting scheduled start"
                  : `${stats.confirmedTotal} confirmed in total`
              }
              icon={CalendarClock}
              iconStyle="bg-sky-50 text-sky-600"
              valueStyle="text-sky-700"
            />
          </div>
        </div>

        {/* Revenue Section */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          {/* Revenue Header */}
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Wallet className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Monthly Revenue
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Revenue generated from paid bookings over the last three
                    months.
                  </p>
                </div>
              </div>

              {/* GST Toggle */}
              <div className="flex w-fit items-center gap-1 rounded-xl border border-blue-100 bg-blue-50/70 p-1">
                <button
                  type="button"
                  onClick={() => setIncludeGst(true)}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                    includeGst
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  Incl. GST
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeGst(false)}
                  className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                    !includeGst
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  Excl. GST
                </button>
              </div>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  This Month
                </p>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <IndianRupee className="h-4 w-4" />
                </div>
              </div>

              <p className="text-2xl font-bold tracking-tight text-blue-700">
                {loading ? "—" : formatCurrency(revenueTotals.thisMonth)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Current month revenue
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Last Month
                </p>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
              </div>

              <p className="text-2xl font-bold tracking-tight text-slate-800">
                {loading ? "—" : formatCurrency(revenueTotals.lastMonth)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Previous month revenue
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  3-Month Total
                </p>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>

              <p className="text-2xl font-bold tracking-tight text-emerald-600">
                {loading ? "—" : formatCurrency(revenueTotals.total)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Total revenue generated
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="border-t border-slate-100 p-5 sm:p-6">
            {loading ? (
              <div className="flex h-80 flex-col items-center justify-center">
                <LoaderCircle className="mb-3 h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-slate-500">
                  Loading revenue data...
                </p>
              </div>
            ) : revenueTotals.total === 0 ? (
              <div className="flex h-80 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                  <Wallet className="h-8 w-8" />
                </div>

                <h3 className="font-bold text-slate-700">
                  No revenue data yet
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-400">
                  No paid and confirmed bookings were found in the last three
                  months.
                </p>
              </div>
            ) : (
              <RevenueChart data={monthlyRevenue} />
            )}
          </div>

          {/* Revenue Footer */}
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Only paid and confirmed reservations are included.
            </p>

            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Clock3 className="h-3.5 w-3.5" />
              All dates calculated in IST
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-white/70 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Activity className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700">
              Dashboard insights
            </p>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Reservation statistics and revenue are calculated using confirmed
              bookings with successful payments. Cancelled, unpaid and refunded
              reservations are excluded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
