import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios.js";

// Bookings are made in India Standard Time, so everything is shown in IST.
const TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// How often the floor re-reads bookings from the server.
const REFRESH_MS = 30 * 1000;

// Must match the 10 minute pending window used by the backend.
const PENDING_HOLD_MS = 10 * 60 * 1000;

// Must match PER_HEAD_SPACES in the booking pages / controller.
const PER_HEAD_SPACES = ["Video Conferencing"];

const GROUP_ORDER = [
  "Workspace",
  "Executive Cabin",
  "Team Leads Cubicle",
  "Senior Leads Cubicle",
  "Manager Cubicle",
  "CEO Cabin",
  "Video Conferencing",
];

// Responsive spans arrange the live spaces like the supplied office plan.
const FLOOR_ZONE_LAYOUT = {
  Workspace: {
    title: "Open Workspace",
    span: "lg:col-span-12",
    tone: "violet",
  },
  "Executive Cabin": {
    title: "Executive Cubicles",
    span: "lg:col-span-4",
    tone: "blue",
  },
  "Team Leads Cubicle": {
    title: "Team Lead Cubicles",
    span: "lg:col-span-4",
    tone: "teal",
  },
  "Senior Leads Cubicle": {
    title: "Senior Lead Cubicles",
    span: "lg:col-span-4",
    tone: "indigo",
  },
  "Manager Cubicle": {
    title: "Manager Cubicles",
    span: "lg:col-span-4",
    tone: "amber",
  },
  "CEO Cabin": { title: "CEO Suite", span: "lg:col-span-4", tone: "rose" },
  "Video Conferencing": {
    title: "Video Conference Room",
    span: "lg:col-span-4",
    tone: "cyan",
  },
};

const ZONE_TONES = {
  violet: "border-violet-200 bg-violet-50/70",
  blue: "border-blue-200 bg-blue-50/70",
  teal: "border-teal-200 bg-teal-50/70",
  indigo: "border-indigo-200 bg-indigo-50/70",
  amber: "border-amber-200 bg-amber-50/70",
  rose: "border-rose-200 bg-rose-50/70",
  cyan: "border-cyan-200 bg-cyan-50/70",
};

const ZONE_PILLS = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-blue-100 text-blue-700",
  teal: "bg-teal-100 text-teal-700",
  indigo: "bg-indigo-100 text-indigo-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  cyan: "bg-cyan-100 text-cyan-700",
};

/* ---------- seat states ---------- */

const STATES = {
  available: {
    label: "Available",
    tile: "border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    bar: "bg-green-400",
  },
  occupied: {
    label: "Occupied",
    tile: "border-rose-400 bg-rose-500 text-white hover:bg-rose-600",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },
  reserved: {
    label: "Reserved later today",
    tile: "border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400 hover:bg-sky-100",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    bar: "bg-blue-400",
  },
  held: {
    label: "Payment in progress",
    tile: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    bar: "bg-amber-400",
  },
  inactive: {
    label: "Out of service",
    tile: "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200",
    badge: "bg-gray-200 text-gray-600",
    dot: "bg-gray-400",
    bar: "bg-gray-300",
  },
};

const STATE_ORDER = ["available", "occupied", "reserved", "held", "inactive"];

/* ---------- time helpers ---------- */

const istDateKey = (ms) =>
  new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);

// 0 = Sunday ... 6 = Saturday, in IST
const istWeekday = (ms) => new Date(ms + IST_OFFSET_MS).getUTCDay();

const istMinutes = (ms) => {
  const date = new Date(ms + IST_OFFSET_MS);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
};

// Start of the next IST day (when "today" ends).
const endOfIstDay = (ms) =>
  new Date(`${istDateKey(ms)}T00:00:00.000+05:30`).getTime() +
  24 * 60 * 60 * 1000;

const isOfficeOpen = (ms) => {
  const day = istWeekday(ms);

  if (day === 0) return false;

  const open = day === 6 ? 9 * 60 : 8 * 60;
  const minutes = istMinutes(ms);

  return minutes >= open && minutes < 19 * 60;
};

const formatClock = (ms) =>
  new Date(ms).toLocaleTimeString("en-IN", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatDay = (ms) =>
  new Date(ms).toLocaleDateString("en-IN", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

const formatDateTime = (ms) =>
  new Date(ms).toLocaleString("en-IN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

// Human readable schedule of one booking.
const getSchedule = (booking) => {
  if (booking.plan === "hourly") {
    return `${formatDay(booking.start)}, ${formatClock(booking.start)} - ${formatClock(
      booking.end,
    )}`;
  }

  return `${formatDay(booking.start)} to ${formatDay(booking.end - 1)}`;
};

/* ---------- booking helpers ---------- */

// Normalises one reservation from the API.
const normalizeBooking = (reservation) => ({
  ...reservation,
  start: new Date(reservation.startAt).getTime(),
  end: new Date(reservation.endAt).getTime(),
  created: reservation.createdAt
    ? new Date(reservation.createdAt).getTime()
    : 0,
});

const isConfirmed = (booking) =>
  booking.status === "Confirmed" && booking.paymentStatus === "Paid";

const isHeld = (booking, now) =>
  booking.status === "Pending" &&
  booking.paymentStatus === "Pending" &&
  now - booking.created <= PENDING_HOLD_MS;

// A daily booking does not cover Sundays (the office is closed).
const coversNow = (booking, now) => {
  if (Number.isNaN(booking.start) || Number.isNaN(booking.end)) return false;
  if (!(booking.start <= now && now < booking.end)) return false;
  if (booking.plan === "daily" && istWeekday(now) === 0) return false;

  return true;
};

const getCustomer = (booking) => {
  const user = booking.user;

  if (user && typeof user === "object") {
    return {
      name: user.name || "Unnamed customer",
      email: user.email || "",
      phone: user.phone || "",
    };
  }

  return { name: "Deleted user", email: "", phone: "" };
};

// People a seat is booked for (falls back to the customer for old bookings).
const getHolders = (booking, code) => {
  const assignments = Array.isArray(booking.seatAssignments)
    ? booking.seatAssignments.filter((item) => item.spaceCode === code)
    : [];

  if (assignments.length > 0) {
    return assignments.map((item) => ({
      name: item.name || "Unnamed",
      email: item.email || "",
      phone: item.phone || "",
      isSelf: item.assigneeType === "self",
    }));
  }

  const customer = getCustomer(booking);

  return [{ ...customer, isSelf: true }];
};

/* ---------- small components ---------- */

// Own component so the ticking clock does not re-render the whole floor.
const LiveClock = () => {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <span className="tabular-nums">
      {new Date(time).toLocaleTimeString("en-IN", {
        timeZone: TIME_ZONE,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })}
    </span>
  );
};

const StatCard = ({ title, value, hint, tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">{title}</p>
    <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const selectClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

/* ---------- component ---------- */

const AdminOccupancyDashboard = () => {
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [now, setNow] = useState(Date.now());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [typeFilter, setTypeFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [selectedCode, setSelectedCode] = useState(null);

  /*
   * Load every seat and every reservation.
   * Silent refreshes (auto refresh) never show the full page loader.
   */
  const fetchData = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const [spacesResponse, bookingsResponse] = await Promise.all([
        api.get("/space"),
        api.get("/booking/all_reservations"),
      ]);

      if (!spacesResponse.data?.success || !bookingsResponse.data?.success) {
        throw new Error(
          spacesResponse.data?.message ||
            bookingsResponse.data?.message ||
            "Failed to load occupancy data",
        );
      }

      setSpaces(spacesResponse.data.spaces || []);
      setBookings(
        (bookingsResponse.data.reservations || []).map(normalizeBooking),
      );
      setNow(Date.now());
      setLastUpdated(Date.now());
      setError("");
    } catch (err) {
      console.error("Occupancy fetch error:", err);

      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to load occupancy data";

      setError(message);

      // Do not spam toasts every 30 seconds while auto refreshing.
      if (!silent) toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Auto refresh while the tab is visible.
  useEffect(() => {
    if (!autoRefresh) return undefined;

    const timer = setInterval(() => {
      if (!document.hidden) fetchData(true);
    }, REFRESH_MS);

    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  // Keep "now" moving between refreshes so bookings start and end on time.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15 * 1000);

    return () => clearInterval(timer);
  }, []);

  /*
   * Work out the live state of every seat.
   *
   * occupied  = confirmed booking covering right now
   * held      = someone is paying for it right now (pending < 10 min)
   * reserved  = confirmed booking starting later today
   * inactive  = seat switched off by the admin
   * available = none of the above
   */
  const seats = useMemo(() => {
    const byCode = new Map();

    bookings.forEach((booking) => {
      const live = isConfirmed(booking) || isHeld(booking, now);

      if (!live || !Array.isArray(booking.selectedSpaces)) return;

      booking.selectedSpaces.forEach((code) => {
        if (!byCode.has(code)) byCode.set(code, []);
        byCode.get(code).push(booking);
      });
    });

    const dayEnd = endOfIstDay(now);

    return spaces.map((space) => {
      const code = space.spaceCode;
      const seatBookings = byCode.get(code) || [];

      const current = seatBookings.find(
        (booking) => isConfirmed(booking) && coversNow(booking, now),
      );

      const held = seatBookings.find(
        (booking) => isHeld(booking, now) && coversNow(booking, now),
      );

      const upcoming = seatBookings
        .filter((booking) => isConfirmed(booking) && booking.start > now)
        .sort((a, b) => a.start - b.start);

      const next = upcoming[0] || null;

      let state = "available";

      if (space.status !== "Active") state = "inactive";
      else if (current) state = "occupied";
      else if (held) state = "held";
      else if (next && next.start < dayEnd) state = "reserved";

      return {
        code,
        type: space.space,
        state,
        current: current || null,
        held: held || null,
        next,
        upcoming: upcoming.slice(0, 3),
      };
    });
  }, [spaces, bookings, now]);

  /*
   * Filter + search.
   */
  const filteredSeats = useMemo(() => {
    const value = search.trim().toLowerCase();

    return seats.filter((seat) => {
      if (typeFilter !== "All" && seat.type !== typeFilter) return false;
      if (stateFilter !== "All" && seat.state !== stateFilter) return false;

      if (!value) return true;

      const booking = seat.current || seat.held || seat.next;

      const fields = [seat.code, seat.type];

      if (booking) {
        const customer = getCustomer(booking);

        fields.push(
          booking.bookingId,
          customer.name,
          customer.email,
          ...getHolders(booking, seat.code).flatMap((holder) => [
            holder.name,
            holder.email,
          ]),
        );
      }

      return fields.some((field) => field?.toLowerCase().includes(value));
    });
  }, [seats, typeFilter, stateFilter, search]);

  /*
   * Floor groups (one block per space type).
   */
  const groups = useMemo(() => {
    const map = new Map();

    seats.forEach((seat) => {
      if (!map.has(seat.type)) {
        map.set(seat.type, {
          type: seat.type,
          counts: {
            available: 0,
            occupied: 0,
            reserved: 0,
            held: 0,
            inactive: 0,
          },
          total: 0,
          visible: [],
        });
      }

      const group = map.get(seat.type);
      group.counts[seat.state] += 1;
      group.total += 1;
    });

    filteredSeats.forEach((seat) => map.get(seat.type)?.visible.push(seat));

    map.forEach((group) =>
      group.visible.sort((a, b) =>
        a.code.localeCompare(b.code, undefined, { numeric: true }),
      ),
    );

    return [...map.values()].sort((a, b) => {
      const indexA = GROUP_ORDER.indexOf(a.type);
      const indexB = GROUP_ORDER.indexOf(b.type);

      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });
  }, [seats, filteredSeats]);

  /*
   * Overall numbers.
   */
  const totals = useMemo(() => {
    const counts = {
      available: 0,
      occupied: 0,
      reserved: 0,
      held: 0,
      inactive: 0,
    };

    seats.forEach((seat) => {
      counts[seat.state] += 1;
    });

    const inService = seats.length - counts.inactive;

    return {
      ...counts,
      total: seats.length,
      inService,
      utilization: inService
        ? Math.round((counts.occupied / inService) * 100)
        : 0,
    };
  }, [seats]);

  const typeOptions = useMemo(
    () => groups.map((group) => group.type),
    [groups],
  );

  const hasActiveFilters =
    typeFilter !== "All" || stateFilter !== "All" || search.trim();

  const clearFilters = () => {
    setTypeFilter("All");
    setStateFilter("All");
    setSearch("");
  };

  const selectedSeat = selectedCode
    ? seats.find((seat) => seat.code === selectedCode)
    : null;

  const officeOpen = isOfficeOpen(now);

  /*
   * Text shown inside a seat tile.
   */
  const getTileLabel = (seat) => {
    if (seat.state === "occupied") {
      const holders = getHolders(seat.current, seat.code);

      if (PER_HEAD_SPACES.includes(seat.type)) {
        return `${holders.length} ${holders.length === 1 ? "person" : "people"}`;
      }

      return holders[0]?.name?.split(" ")[0] || "Occupied";
    }

    if (seat.state === "reserved")
      return `From ${formatClock(seat.next.start)}`;
    if (seat.state === "held") return "Paying";
    if (seat.state === "inactive") return "Off";

    return "Free";
  };

  /* ---------- render ---------- */

  return (
    <div className="min-h-screen bg-[#f7f8fc] p-4 text-slate-800 sm:p-6">
      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Live Occupancy
            </h1>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                officeOpen
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  officeOpen ? "bg-green-500" : "bg-gray-500"
                }`}
              />
              Office {officeOpen ? "open" : "closed"}
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Which seats are free, occupied or reserved right now
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-semibold leading-tight text-gray-800">
              <LiveClock />
            </p>
            <p className="text-xs text-gray-400">
              {lastUpdated
                ? `Updated ${formatClock(lastUpdated)} IST`
                : "Loading..."}
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
            Auto refresh (30s)
          </label>

          <button
            type="button"
            onClick={() => fetchData(false)}
            disabled={loading || refreshing}
            className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading || refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard
          title="Utilization"
          value={loading ? "—" : `${totals.utilization}%`}
          hint={
            loading
              ? ""
              : `${totals.occupied} of ${totals.inService} seats in use`
          }
          tone="text-orange-600"
        />

        <StatCard
          title="Available now"
          value={loading ? "—" : totals.available}
          hint="Free to book"
          tone="text-green-600"
        />

        <StatCard
          title="Occupied now"
          value={loading ? "—" : totals.occupied}
          hint="Booking in progress"
          tone="text-red-600"
        />

        <StatCard
          title="Reserved later today"
          value={loading ? "—" : totals.reserved + totals.held}
          hint={
            loading || !totals.held
              ? "Booked for later"
              : `Includes ${totals.held} being paid for`
          }
          tone="text-blue-600"
        />

        <StatCard
          title="Out of service"
          value={loading ? "—" : totals.inactive}
          hint="Switched off by admin"
          tone="text-gray-600"
        />
      </div>

      {/* UTILIZATION BY SPACE TYPE */}

      {!loading && groups.length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Utilization by space type
          </h2>

          <div className="space-y-4">
            {groups.map((group) => {
              const inService = group.total - group.counts.inactive;
              const percent = inService
                ? Math.round((group.counts.occupied / inService) * 100)
                : 0;

              return (
                <div key={group.type}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-800">
                      {group.type}
                    </span>
                    <span className="text-gray-500">
                      {group.counts.occupied}/{inService} in use ·{" "}
                      <span className="font-semibold text-gray-700">
                        {percent}%
                      </span>
                    </span>
                  </div>

                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    {["occupied", "held", "reserved"].map((state) =>
                      group.counts[state] > 0 ? (
                        <div
                          key={state}
                          className={STATES[state].bar}
                          style={{
                            width: `${(group.counts[state] / group.total) * 100}%`,
                          }}
                          title={`${STATES[state].label}: ${group.counts[state]}`}
                        />
                      ) : null,
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTERS + LEGEND */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search seat code, person, customer or booking ID..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className={selectClass}
            aria-label="Filter by space type"
          >
            <option value="All">All space types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStateFilter("All")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
              stateFilter === "All"
                ? "bg-indigo-600 text-white ring-indigo-600"
                : "bg-white text-gray-600 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            All ({totals.total})
          </button>

          {STATE_ORDER.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() =>
                setStateFilter(stateFilter === state ? "All" : state)
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                stateFilter === state
                  ? "bg-indigo-600 text-white ring-indigo-600"
                  : "bg-white text-gray-600 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${STATES[state].dot}`} />
              {STATES[state].label} ({totals[state]})
            </button>
          ))}
        </div>
      </div>

      {/* FLOOR PLAN */}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          Loading office floor...
        </div>
      ) : seats.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No seats have been created yet. Add spaces first to see occupancy.
        </div>
      ) : filteredSeats.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No seats match your search or filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#f1f3f8] p-3 shadow-inner sm:p-5">
          <div className="mb-4 flex flex-col gap-2 border-b border-slate-200 px-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                Workspace map
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-800">
                Office floor plan
              </h2>
              <p className="text-xs text-slate-500">
                Select any seat or room to view its live booking details
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-medium">
              {STATE_ORDER.map((state) => (
                <span
                  key={state}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/90 px-2.5 py-1 text-slate-600 shadow-sm"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${STATES[state].dot}`}
                  />
                  {STATES[state].label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
            {groups
              .filter((group) => group.visible.length > 0)
              .map((group) => {
                const layout = FLOOR_ZONE_LAYOUT[group.type] || {
                  title: group.type,
                  span: "lg:col-span-6",
                  tone: "blue",
                };
                const tone = layout.tone;
                const inService = group.total - group.counts.inactive;
                const occupiedPercent = inService
                  ? Math.round((group.counts.occupied / inService) * 100)
                  : 0;

                return (
                  <section
                    key={group.type}
                    className={`${layout.span} min-w-0 rounded-2xl border-2 p-3 shadow-sm sm:p-4 ${ZONE_TONES[tone] || ZONE_TONES.blue}`}
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${ZONE_PILLS[tone] || ZONE_PILLS.blue}`}
                        >
                          {layout.title}
                        </span>
                        <p className="mt-1.5 text-xs text-slate-500">
                          {group.total} {group.total === 1 ? "space" : "spaces"}{" "}
                          · {occupiedPercent}% occupied
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {STATE_ORDER.filter(
                          (state) => group.counts[state] > 0,
                        ).map((state) => (
                          <span
                            key={state}
                            className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-600"
                          >
                            {group.counts[state]}{" "}
                            {state === "available" ? "free" : state}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      className={
                        group.type === "Workspace" ? "overflow-x-auto pb-2" : ""
                      }
                    >
                      <div
                        className={`grid gap-2 ${
                          group.type === "Workspace"
                            ? "min-w-[680px]"
                            : "grid-cols-2 sm:grid-cols-3"
                        }`}
                        style={
                          group.type === "Workspace"
                            ? {
                                gridTemplateColumns:
                                  "repeat(7, minmax(90px, 1fr))",
                                gridTemplateRows:
                                  "repeat(7, minmax(66px, auto))",
                              }
                            : undefined
                        }
                      >
                        {group.visible.map((seat, index) => {
                          // Column 1 has WS01-WS03; columns 2-7 have seven seats each.
                          const workspacePosition =
                            group.type === "Workspace"
                              ? index < 3
                                ? { gridColumn: 1, gridRow: index + 1 }
                                : {
                                    gridColumn: 2 + Math.floor((index - 3) / 7),
                                    gridRow: ((index - 3) % 7) + 1,
                                  }
                              : undefined;

                          return (
                            <button
                              key={seat.code}
                              type="button"
                              onClick={() => setSelectedCode(seat.code)}
                              title={`${seat.code} · ${STATES[seat.state].label}`}
                              style={workspacePosition}
                              className={`group relative flex min-h-[66px] min-w-0 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1 ${STATES[seat.state].tile}`}
                            >
                              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                              <span className="max-w-full truncate text-xs font-extrabold tracking-wide">
                                {seat.code}
                              </span>
                              <span className="mt-1 max-w-full truncate text-[10px] font-medium opacity-80">
                                {getTileLabel(seat)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                );
              })}

            {/* Decorative shared area from the reference plan; it is not a bookable seat. */}
            <aside className="hidden min-h-[150px] flex-col items-center justify-center rounded-2xl border-2 border-orange-200 bg-orange-50/80 p-4 text-center shadow-sm md:flex lg:col-span-4 lg:col-start-9 lg:row-start-2">
              <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                ☕
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
                Breakout lounge & café
              </p>
              <p className="mt-1 text-[11px] text-orange-600/80">
                Shared space · not bookable
              </p>
            </aside>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-1 pt-3 text-[11px] text-slate-500">
            <span>Live status is synced with the booking system</span>
            <span>
              {totals.total} total spaces · {totals.inService} in service
            </span>
          </div>
        </div>
      )}

      {/* SEAT DETAILS MODAL */}

      {selectedSeat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedCode(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-start p-5 border-b">
              <div>
                <h2 className="text-xl font-semibold">
                  Seat {selectedSeat.code}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSeat.type}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATES[selectedSeat.state].badge}`}
                >
                  {STATES[selectedSeat.state].label}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedCode(null)}
                  aria-label="Close"
                  className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Current / held booking */}
              {(selectedSeat.current || selectedSeat.held) &&
                (() => {
                  const booking = selectedSeat.current || selectedSeat.held;
                  const customer = getCustomer(booking);
                  const holders = getHolders(booking, selectedSeat.code);

                  return (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        {selectedSeat.current
                          ? "In use right now"
                          : "Payment in progress"}
                      </h3>

                      <div className="rounded-lg bg-gray-50 p-4 text-sm space-y-2">
                        <p>
                          <span className="font-medium">Booking:</span>{" "}
                          <span className="break-all text-orange-600">
                            {booking.bookingId}
                          </span>
                        </p>
                        <p className="capitalize">
                          <span className="font-medium">Plan:</span>{" "}
                          {booking.plan} · {booking.duration}
                        </p>
                        <p>
                          <span className="font-medium">When:</span>{" "}
                          {getSchedule(booking)}
                        </p>
                        <p>
                          <span className="font-medium">Booked by:</span>{" "}
                          {customer.name}
                          {customer.phone && (
                            <span className="text-gray-500">
                              {" "}
                              · {customer.phone}
                            </span>
                          )}
                        </p>
                        {selectedSeat.current && (
                          <p className="text-gray-500">
                            Ends {formatDateTime(booking.end)}
                          </p>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-2">
                        {PER_HEAD_SPACES.includes(selectedSeat.type)
                          ? `Attendees (${holders.length})`
                          : "Seat holder"}
                      </h3>

                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="text-left p-2 font-semibold">
                                Person
                              </th>
                              <th className="text-left p-2 font-semibold">
                                Email
                              </th>
                              <th className="text-left p-2 font-semibold">
                                Phone
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {holders.map((holder, index) => (
                              <tr
                                key={`${holder.name}-${index}`}
                                className="border-b last:border-b-0"
                              >
                                <td className="p-2">
                                  {holder.name}
                                  {holder.isSelf && (
                                    <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                                      Customer
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-gray-600 break-all">
                                  {holder.email || "—"}
                                </td>
                                <td className="p-2 text-gray-600">
                                  {holder.phone || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

              {/* Upcoming bookings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Upcoming bookings
                </h3>

                {selectedSeat.upcoming.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSeat.upcoming.map((booking) => {
                      const holders = getHolders(booking, selectedSeat.code);

                      return (
                        <div
                          key={booking._id || booking.bookingId}
                          className="rounded-lg border p-3 text-sm"
                        >
                          <p className="font-medium">{getSchedule(booking)}</p>
                          <p className="text-gray-500 mt-1">
                            {holders.map((holder) => holder.name).join(", ")}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 break-all">
                            {booking.bookingId}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {selectedSeat.state === "inactive"
                      ? "This seat is out of service."
                      : "No upcoming bookings for this seat."}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end p-5 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setSelectedCode(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOccupancyDashboard;
