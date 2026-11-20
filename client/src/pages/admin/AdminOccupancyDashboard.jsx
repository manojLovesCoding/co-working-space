import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Activity,
  Armchair,
  Building2,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Coffee,
  CreditCard,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  UserRound,
  X,
  Hash,
  ChevronRight,
  CircleDot,
  DoorOpen,
  AlertCircle,
} from "lucide-react";

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
    tone: "terracotta",
  },
  "Executive Cabin": {
    title: "Executive Cubicles",
    span: "lg:col-span-4",
    tone: "sand",
  },
  "Team Leads Cubicle": {
    title: "Team Lead Cubicles",
    span: "lg:col-span-4",
    tone: "sage",
  },
  "Senior Leads Cubicle": {
    title: "Senior Lead Cubicles",
    span: "lg:col-span-4",
    tone: "rose",
  },
  "Manager Cubicle": {
    title: "Manager Cubicles",
    span: "lg:col-span-4",
    tone: "amber",
  },
  "CEO Cabin": {
    title: "CEO Suite",
    span: "lg:col-span-4",
    tone: "brown",
  },
  "Video Conferencing": {
    title: "Video Conference Room",
    span: "lg:col-span-4",
    tone: "cafe",
  },
};

const ZONE_TONES = {
  terracotta: "border-[#C9826C] bg-[#F8EDE6]/80",
  sand: "border-[#E9DED0] bg-[#FBF3ED]/80",
  sage: "border-[#A8BDA5] bg-[#EDF3EA]/80",
  rose: "border-[#E7C4B9] bg-[#F9EEEA]/80",
  amber: "border-amber-200 bg-amber-50/70",
  brown: "border-[#BCA99A] bg-[#F1EAE2]/80",
  cafe: "border-[#D6A45D] bg-[#FBF3E7]/80",
};

const ZONE_PILLS = {
  terracotta: "bg-[#A95643]/10 text-[#71392F]",
  sand: "bg-[#E9DED0]/70 text-[#6F5B4D]",
  sage: "bg-[#A8BDA5]/25 text-[#42634A]",
  rose: "bg-[#F1DCD5] text-[#914F40]",
  amber: "bg-amber-100 text-amber-800",
  brown: "bg-[#E8DED3] text-[#5D4638]",
  cafe: "bg-[#F4E4C9] text-[#805B25]",
};

/* ---------- seat states ---------- */

const STATES = {
  available: {
    label: "Available",
    tile: "border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
    bar: "bg-emerald-400",
  },
  occupied: {
    label: "Occupied",
    tile: "border-[#A95643] bg-[#A95643] text-white hover:border-[#71392F] hover:bg-[#71392F]",
    badge: "bg-[#F8EDE6] text-[#71392F] ring-[#A95643]/20",
    dot: "bg-[#A95643]",
    bar: "bg-[#A95643]",
  },
  reserved: {
    label: "Reserved later today",
    tile: "border-[#D9A18F] bg-[#F8EDE6] text-[#71392F] hover:border-[#A95643] hover:bg-[#F3DFD5]",
    badge: "bg-[#F8EDE6] text-[#71392F] ring-[#A95643]/20",
    dot: "bg-[#C9826C]",
    bar: "bg-[#C9826C]",
  },
  held: {
    label: "Payment in progress",
    tile: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
    bar: "bg-amber-400",
  },
  inactive: {
    label: "Out of service",
    tile: "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200",
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
    bar: "bg-slate-300",
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
    return `${formatDay(booking.start)}, ${formatClock(
      booking.start,
    )} - ${formatClock(booking.end)}`;
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

const StatCard = ({ title, value, hint, tone, icon: Icon }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-[0_3px_15px_rgba(113,57,47,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(113,57,47,0.08)]">
    <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-[#F8EDE6]/80 transition-transform duration-300 group-hover:scale-125" />

    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#8F8175]">{title}</p>
        <p className={`mt-2 text-3xl font-extrabold tracking-tight ${tone}`}>
          {value}
        </p>
        {hint && (
          <p className="mt-2 text-xs font-medium text-[#A99A8D]">{hint}</p>
        )}
      </div>

      {Icon && (
        <div className="rounded-2xl bg-[#F8EDE6] p-3 text-[#A95643]">
          <Icon size={22} />
        </div>
      )}
    </div>
  </div>
);

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-4 flex items-center gap-3">
    <div className="rounded-xl bg-[#F8EDE6] p-2.5 text-[#A95643]">
      <Icon size={19} />
    </div>
    <div>
      <h2 className="text-base font-bold text-[#382B26]">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-[#8F8175]">{subtitle}</p>}
    </div>
  </div>
);

const DetailItem = ({ label, value, icon: Icon }) => (
  <div className="min-w-0 rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-3">
    <div className="flex items-center gap-2 text-[#A99A8D]">
      {Icon && <Icon size={14} />}
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
    </div>
    <p className="mt-2 break-all text-sm font-semibold text-[#382B26]">
      {value || "—"}
    </p>
  </div>
);

const selectClass =
  "w-full rounded-xl border border-[#E9DED0] bg-[#FBF3ED] px-3 py-2.5 text-sm font-medium text-[#382B26] outline-none transition focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10";

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
        return `${holders.length} ${
          holders.length === 1 ? "person" : "people"
        }`;
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
    <div className="min-h-screen bg-[#FAF6EF] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1550px] space-y-5">
        {/* HEADER */}

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#C9826C] p-5 shadow-lg shadow-[#71392F]/10 sm:p-7">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />
          <div className="absolute -bottom-28 right-44 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                <Building2 size={14} />
                Oorza Administration
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Live Occupancy
                </h1>

                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                    officeOpen
                      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
                      : "border-white/20 bg-white/10 text-white/80"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      officeOpen
                        ? "animate-pulse bg-emerald-400"
                        : "bg-white/50"
                    }`}
                  />
                  Office {officeOpen ? "Open" : "Closed"}
                </span>
              </div>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
                Monitor real-time workspace availability, track reservations and
                view the occupancy of every office space.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-white/80">
                <span className="flex items-center gap-1.5">
                  <Activity size={15} />
                  Live monitoring
                </span>
                <span className="h-1 w-1 rounded-full bg-white/50" />
                <span className="flex items-center gap-1.5">
                  <LayoutGrid size={15} />
                  Floor overview
                </span>
                <span className="h-1 w-1 rounded-full bg-white/50" />
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={15} />
                  Booking status
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:min-w-[300px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/65">
                    Current India time
                  </p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-white">
                    <LiveClock />
                  </p>
                  <p className="mt-1 text-xs text-white/65">
                    {formatDay(now)} · IST
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-3 text-white">
                  <Clock3 size={25} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/65">
                    Last synchronized
                  </p>
                  <p className="mt-1 text-xs font-bold text-white">
                    {lastUpdated
                      ? `${formatClock(lastUpdated)} IST`
                      : "Waiting for data..."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchData(false)}
                  disabled={loading || refreshing}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FFFDFA] px-4 py-2.5 text-xs font-bold text-[#71392F] shadow-sm transition hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={15}
                    className={loading || refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Utilization"
            value={loading ? "—" : `${totals.utilization}%`}
            hint={
              loading
                ? ""
                : `${totals.occupied} of ${totals.inService} seats in use`
            }
            tone="text-[#A95643]"
            icon={Activity}
          />

          <StatCard
            title="Available Now"
            value={loading ? "—" : totals.available}
            hint="Free to book"
            tone="text-emerald-600"
            icon={CheckCircle2}
          />

          <StatCard
            title="Occupied Now"
            value={loading ? "—" : totals.occupied}
            hint="Booking in progress"
            tone="text-[#A95643]"
            icon={Users}
          />

          <StatCard
            title="Reserved Later Today"
            value={loading ? "—" : totals.reserved + totals.held}
            hint={
              loading || !totals.held
                ? "Booked for later"
                : `Includes ${totals.held} being paid for`
            }
            tone="text-amber-600"
            icon={CalendarCheck}
          />

          <StatCard
            title="Out of Service"
            value={loading ? "—" : totals.inactive}
            hint="Switched off by admin"
            tone="text-slate-600"
            icon={DoorOpen}
          />
        </div>

        {/* UTILIZATION BY SPACE TYPE */}

        {!loading && groups.length > 0 && (
          <div className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-[0_3px_15px_rgba(113,57,47,0.04)] sm:p-5">
            <SectionHeading
              icon={Activity}
              title="Utilization by Space Type"
              subtitle="Live occupancy breakdown across your workspace"
            />

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
              {groups.map((group) => {
                const inService = group.total - group.counts.inactive;
                const percent = inService
                  ? Math.round((group.counts.occupied / inService) * 100)
                  : 0;

                return (
                  <div key={group.type}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#382B26]">
                          {group.type}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#A99A8D]">
                          {inService} active spaces
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-extrabold text-[#382B26]">
                          {percent}%
                        </p>
                        <p className="text-[10px] text-[#A99A8D]">
                          {group.counts.occupied}/{inService} occupied
                        </p>
                      </div>
                    </div>

                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#F1EAE2]">
                      {["occupied", "held", "reserved"].map((state) =>
                        group.counts[state] > 0 ? (
                          <div
                            key={state}
                            className={STATES[state].bar}
                            style={{
                              width: `${
                                (group.counts[state] / group.total) * 100
                              }%`,
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

        <div className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-[0_3px_15px_rgba(113,57,47,0.04)] sm:p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#F8EDE6] p-2.5 text-[#A95643]">
                <Search size={19} />
              </div>
              <div>
                <h2 className="font-bold text-[#382B26]">Find a Workspace</h2>
                <p className="mt-0.5 text-xs text-[#8F8175]">
                  Search seats and filter by space type or availability
                </p>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A95643] transition hover:text-[#71392F]"
              >
                <X size={14} />
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99A8D]"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search seat code, person, customer or booking ID..."
                className="w-full rounded-xl border border-[#E9DED0] bg-[#FBF3ED] py-3 pl-11 pr-4 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99A8D] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={selectClass}
              aria-label="Filter by space type"
            >
              <option value="All">All Space Types</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 border-t border-[#E9DED0] pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A99A8D]">
                Filter by availability
              </p>
              <p className="text-xs font-medium text-[#A99A8D]">
                {filteredSeats.length} of {totals.total} spaces
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStateFilter("All")}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 transition ${
                  stateFilter === "All"
                    ? "bg-[#A95643] text-white ring-[#A95643]"
                    : "bg-white text-[#6F6259] ring-[#E9DED0] hover:bg-[#F8EDE6]"
                }`}
              >
                All Spaces ({totals.total})
              </button>

              {STATE_ORDER.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() =>
                    setStateFilter(stateFilter === state ? "All" : state)
                  }
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 transition ${
                    stateFilter === state
                      ? "bg-[#A95643] text-white ring-[#A95643]"
                      : "bg-white text-[#6F6259] ring-[#E9DED0] hover:bg-[#F8EDE6]"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      stateFilter === state ? "bg-white" : STATES[state].dot
                    }`}
                  />
                  {STATES[state].label} ({totals[state]})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FLOOR PLAN */}

        <div className="overflow-hidden rounded-3xl border border-[#E9DED0] bg-[#FFFDFA] shadow-[0_3px_15px_rgba(113,57,47,0.04)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#E9DED0] p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#F8EDE6] p-2.5 text-[#A95643]">
                <LayoutGrid size={21} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#382B26]">
                  Office Floor Plan
                </h2>
                <p className="mt-1 text-xs text-[#8F8175]">
                  Select any seat or room to view its live booking details
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-lg bg-[#F8EDE6] px-3 py-2 text-xs font-bold text-[#71392F]">
                <Armchair size={14} />
                {totals.total} Total Spaces
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={14} />
                {totals.available} Available
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-4 bg-[#FAF6EF]">
              <div className="rounded-2xl bg-[#F8EDE6] p-4">
                <RefreshCw size={30} className="animate-spin text-[#A95643]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#382B26]">
                  Loading office floor
                </p>
                <p className="mt-1 text-xs text-[#A99A8D]">
                  Retrieving spaces and reservations...
                </p>
              </div>
            </div>
          ) : seats.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center bg-[#FAF6EF] px-4 text-center">
              <div className="rounded-2xl bg-[#F8EDE6] p-5 text-[#A95643]">
                <Armchair size={32} />
              </div>
              <h3 className="mt-4 font-bold text-[#382B26]">
                No spaces available
              </h3>
              <p className="mt-1 max-w-sm text-sm text-[#8F8175]">
                No seats have been created yet. Add spaces first to see
                occupancy.
              </p>
            </div>
          ) : filteredSeats.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center bg-[#FAF6EF] px-4 text-center">
              <div className="rounded-2xl bg-[#F8EDE6] p-5 text-[#A95643]">
                <Search size={32} />
              </div>
              <h3 className="mt-4 font-bold text-[#382B26]">
                No matching spaces
              </h3>
              <p className="mt-1 text-sm text-[#8F8175]">
                Try changing your search or availability filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-[#A95643] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#71392F]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="bg-[#FAF6EF] p-3 sm:p-4">
              <div className="mb-4 flex flex-col gap-2 border-b border-[#E9DED0] px-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#A95643]">
                    Workspace Layout
                  </p>
                  <h3 className="mt-1 text-lg font-extrabold text-[#382B26]">
                    Live Space Map
                  </h3>
                  <p className="mt-1 text-xs text-[#8F8175]">
                    Each tile represents a bookable space
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATE_ORDER.map((state) => (
                    <span
                      key={state}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E9DED0] bg-[#FFFDFA] px-2.5 py-1.5 text-[10px] font-semibold text-[#6F6259] shadow-sm"
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
                      tone: "terracotta",
                    };
                    const tone = layout.tone;
                    const inService = group.total - group.counts.inactive;
                    const occupiedPercent = inService
                      ? Math.round((group.counts.occupied / inService) * 100)
                      : 0;

                    return (
                      <section
                        key={group.type}
                        className={`${layout.span} min-w-0 rounded-2xl border-2 p-3 shadow-sm transition hover:shadow-md sm:p-4 ${
                          ZONE_TONES[tone] || ZONE_TONES.terracotta
                        }`}
                      >
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                ZONE_PILLS[tone] || ZONE_PILLS.terracotta
                              }`}
                            >
                              {layout.title}
                            </span>
                            <p className="mt-2 text-xs font-medium text-[#8F8175]">
                              {group.total}{" "}
                              {group.total === 1 ? "space" : "spaces"} ·{" "}
                              {occupiedPercent}% occupied
                            </p>
                          </div>

                          <div className="flex flex-wrap justify-end gap-1.5">
                            {STATE_ORDER.filter(
                              (state) => group.counts[state] > 0,
                            ).map((state) => (
                              <span
                                key={state}
                                className="rounded-lg border border-white/80 bg-white/80 px-2 py-1 text-[10px] font-bold text-[#6F6259]"
                              >
                                {group.counts[state]}{" "}
                                {state === "available" ? "free" : state}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div
                          className={
                            group.type === "Workspace"
                              ? "overflow-x-auto rounded-xl pb-2"
                              : ""
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
                                      "repeat(7, minmax(72px, auto))",
                                  }
                                : undefined
                            }
                          >
                            {group.visible.map((seat, index) => {
                              // Column 1 has WS01-WS03; columns 2-7 have seven seats each.
                              const workspacePosition =
                                group.type === "Workspace"
                                  ? index < 3
                                    ? {
                                        gridColumn: 1,
                                        gridRow: index + 1,
                                      }
                                    : {
                                        gridColumn:
                                          2 + Math.floor((index - 3) / 7),
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
                                  className={`group relative flex min-h-[72px] min-w-0 flex-col items-center justify-center rounded-xl border px-2 py-3 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A95643] focus:ring-offset-2 ${
                                    STATES[seat.state].tile
                                  }`}
                                >
                                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-current opacity-70" />

                                  <span className="max-w-full truncate text-xs font-extrabold tracking-wide">
                                    {seat.code}
                                  </span>

                                  <span className="mt-1.5 max-w-full truncate text-[10px] font-semibold opacity-80">
                                    {getTileLabel(seat)}
                                  </span>

                                  <span className="mt-1 text-[9px] font-bold uppercase tracking-wider opacity-60">
                                    {STATES[seat.state].label}
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
                <aside className="hidden min-h-[150px] flex-col items-center justify-center rounded-2xl border-2 border-[#D6A45D] bg-[#FBF3E7] p-4 text-center shadow-sm md:flex lg:col-span-4 lg:col-start-9 lg:row-start-2">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#A95643] shadow-sm">
                    <Coffee size={25} />
                  </span>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#71392F]">
                    Breakout Lounge & Café
                  </p>
                  <p className="mt-1 text-[11px] text-[#8F8175]">
                    Shared space · Not bookable
                  </p>
                </aside>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E9DED0] px-1 pt-4 text-[11px] font-medium text-[#8F8175]">
                <span className="flex items-center gap-1.5">
                  <CircleDot size={13} className="text-emerald-500" />
                  Live status synced with booking system
                </span>
                <span>
                  {totals.total} total spaces · {totals.inService} in service
                </span>
              </div>
            </div>
          )}
        </div>

        {/* AUTO REFRESH FOOTER */}

        <div className="flex flex-col justify-between gap-2 rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] px-4 py-3 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#F8EDE6] p-2 text-[#A95643]">
              <RefreshCw
                size={15}
                className={autoRefresh ? "animate-spin" : ""}
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[#382B26]">
                Automatic occupancy synchronization
              </p>
              <p className="mt-0.5 text-[11px] text-[#8F8175]">
                {autoRefresh
                  ? "Dashboard refreshes every 30 seconds when the tab is visible."
                  : "Automatic refresh is currently paused."}
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#F8EDE6] px-3 py-2 text-xs font-bold text-[#71392F]">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
              className="h-4 w-4 accent-[#A95643]"
            />
            Auto Refresh
          </label>
        </div>
      </div>

      {/* SEAT DETAILS MODAL */}

      {selectedSeat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#382B26]/60 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setSelectedCode(null)}
        >
          <div
            className="max-h-[94vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-[#FFFDFA] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#C9826C] px-5 py-5 sm:px-6">
              <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border-[25px] border-white/5" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80">
                    <Building2 size={12} />
                    Workspace Details
                  </div>

                  <h2 className="text-xl font-extrabold text-white sm:text-2xl">
                    {selectedSeat.code}
                  </h2>

                  <p className="mt-1 text-sm text-white/80">
                    {selectedSeat.type}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCode(null)}
                  aria-label="Close"
                  className="rounded-xl border border-white/20 bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
                    STATES[selectedSeat.state].badge
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${STATES[selectedSeat.state].dot}`}
                  />
                  {STATES[selectedSeat.state].label}
                </span>

                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                  {selectedSeat.upcoming.length} Upcoming Bookings
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[calc(94vh-180px)] space-y-5 overflow-y-auto bg-[#FAF6EF] p-4 sm:p-5">
              {/* Current / held booking */}
              {(selectedSeat.current || selectedSeat.held) &&
                (() => {
                  const booking = selectedSeat.current || selectedSeat.held;
                  const customer = getCustomer(booking);
                  const holders = getHolders(booking, selectedSeat.code);

                  return (
                    <section>
                      <SectionHeading
                        icon={Activity}
                        title={
                          selectedSeat.current
                            ? "Currently Occupied"
                            : "Payment in Progress"
                        }
                        subtitle="Active booking and customer information"
                      />

                      <div className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A99A8D]">
                            Booking Reference
                          </span>
                          <span className="rounded-lg bg-[#F8EDE6] px-3 py-1.5 text-xs font-extrabold text-[#71392F]">
                            {booking.bookingId || "—"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <DetailItem
                            label="Plan"
                            value={`${booking.plan || "—"} · ${
                              booking.duration || "—"
                            }`}
                            icon={CalendarDays}
                          />
                          <DetailItem
                            label="Schedule"
                            value={getSchedule(booking)}
                            icon={Clock3}
                          />
                          <DetailItem
                            label="Booked By"
                            value={customer.name}
                            icon={UserRound}
                          />
                          <DetailItem
                            label="Contact Number"
                            value={customer.phone}
                            icon={Phone}
                          />
                        </div>

                        {selectedSeat.current && (
                          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                            <Clock3 size={15} />
                            Booking ends {formatDateTime(booking.end)}
                          </div>
                        )}
                      </div>

                      <div className="mb-3 mt-4 flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#382B26]">
                            {PER_HEAD_SPACES.includes(selectedSeat.type)
                              ? `Attendees (${holders.length})`
                              : "Seat Holder"}
                          </h3>
                          <p className="mt-0.5 text-xs text-[#8F8175]">
                            Assigned people for this space
                          </p>
                        </div>
                        <span className="rounded-lg bg-[#F8EDE6] px-2.5 py-1 text-xs font-bold text-[#71392F]">
                          {holders.length}{" "}
                          {holders.length === 1 ? "Person" : "People"}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-[#E9DED0] bg-[#FFFDFA]">
                        <table className="w-full min-w-[520px] border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-[#E9DED0] bg-[#FBF3ED]">
                              <th className="p-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-[#8F8175]">
                                Person
                              </th>
                              <th className="p-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-[#8F8175]">
                                Email
                              </th>
                              <th className="p-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-[#8F8175]">
                                Phone
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-[#F1EAE2]">
                            {holders.map((holder, index) => (
                              <tr
                                key={`${holder.name}-${index}`}
                                className="transition hover:bg-[#FBF3ED]"
                              >
                                <td className="p-3">
                                  <p className="font-bold text-[#382B26]">
                                    {holder.name}
                                  </p>
                                  {holder.isSelf && (
                                    <span className="mt-1 inline-flex rounded-full bg-[#F8EDE6] px-2 py-0.5 text-[10px] font-bold text-[#71392F]">
                                      Customer
                                    </span>
                                  )}
                                </td>
                                <td className="break-all p-3 text-xs text-[#6F6259]">
                                  {holder.email || "—"}
                                </td>
                                <td className="p-3 text-xs text-[#6F6259]">
                                  {holder.phone || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  );
                })()}

              {/* Upcoming bookings */}
              <section>
                <SectionHeading
                  icon={CalendarCheck}
                  title="Upcoming Bookings"
                  subtitle="Next confirmed reservations for this space"
                />

                {selectedSeat.upcoming.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSeat.upcoming.map((booking, index) => {
                      const holders = getHolders(booking, selectedSeat.code);

                      return (
                        <div
                          key={booking._id || booking.bookingId}
                          className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm transition hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="rounded-xl bg-[#F8EDE6] p-2.5 text-[#A95643]">
                                <CalendarDays size={18} />
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#382B26]">
                                  {getSchedule(booking)}
                                </p>
                                <p className="mt-1 text-xs text-[#8F8175]">
                                  {holders
                                    .map((holder) => holder.name)
                                    .join(", ")}
                                </p>
                              </div>
                            </div>

                            <span className="shrink-0 rounded-lg bg-[#F8EDE6] px-2.5 py-1 text-[10px] font-bold text-[#71392F]">
                              #{index + 1}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1EAE2] pt-3">
                            <span className="text-[10px] font-semibold text-[#A99A8D]">
                              Booking ID
                            </span>
                            <span className="break-all text-xs font-semibold text-[#6F6259]">
                              {booking.bookingId || "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#D9C8B9] bg-[#FFFDFA] p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                      <CalendarDays size={22} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#382B26]">
                      No upcoming bookings
                    </p>
                    <p className="mt-1 text-xs text-[#8F8175]">
                      {selectedSeat.state === "inactive"
                        ? "This seat is currently out of service."
                        : "There are no upcoming reservations for this space."}
                    </p>
                  </div>
                )}
              </section>

              {/* Available / inactive state */}
              {!selectedSeat.current && !selectedSeat.held && (
                <div
                  className={`rounded-2xl border p-4 ${
                    selectedSeat.state === "inactive"
                      ? "border-slate-200 bg-slate-100"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedSeat.state === "inactive" ? (
                      <AlertCircle size={21} className="text-slate-500" />
                    ) : (
                      <CheckCircle2 size={21} className="text-emerald-600" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          selectedSeat.state === "inactive"
                            ? "text-slate-700"
                            : "text-emerald-800"
                        }`}
                      >
                        {selectedSeat.state === "inactive"
                          ? "Space is out of service"
                          : selectedSeat.state === "reserved"
                            ? "Space is reserved later today"
                            : "Space is currently available"}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          selectedSeat.state === "inactive"
                            ? "text-slate-500"
                            : "text-emerald-700"
                        }`}
                      >
                        {selectedSeat.state === "inactive"
                          ? "This space is currently not available for booking."
                          : selectedSeat.state === "reserved"
                            ? `Next reservation starts at ${formatClock(
                                selectedSeat.next.start,
                              )}.`
                            : "No active booking is using this space right now."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#E9DED0] bg-[#FFFDFA] p-4 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={() => setSelectedCode(null)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#71392F] to-[#A95643] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#71392F]/10 transition hover:from-[#5D2E27] hover:to-[#8F4435]"
              >
                <X size={17} />
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOccupancyDashboard;
