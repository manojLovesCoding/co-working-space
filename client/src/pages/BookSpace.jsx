import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Home,
  Minus,
  Plus,
  Users,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios.js";

// Value used in the assignment dropdown for "the logged-in customer".
const SELF = "self";

// GST rate in percent (the server applies the same rate; this is for display).
const GST_RATE = 18;

// Spaces billed per person (one room, many attendees).
// Must match PER_HEAD_SPACES in bookingController.js.
const PER_HEAD_SPACES = ["Video Conferencing"];
const MAX_HEADS = 20;

// Oorza theme colors
const COLORS = {
  primary: "#A95643",
  primaryDark: "#71392F",
  primarySoft: "#C9826C",
  ivory: "#FAF6EF",
  pale: "#F8EDE6",
  brown: "#382B26",
  muted: "#8F8175",
  border: "#E9DED0",
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// ---------------------------------------------
// Office hours
// ---------------------------------------------

const OFFICE_HOURS = {
  weekday: { open: 8 * 60, close: 19 * 60 },
  saturday: { open: 9 * 60, close: 19 * 60 },
};

const OFFICE_HOURS_TEXT =
  "Mon - Fri: 8:00 AM - 7:00 PM  |  Sat: 9:00 AM - 7:00 PM  |  Sunday: Closed";

// ---------------------------------------------
// Helpers
// ---------------------------------------------

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "₹0";
  }

  const amount = Number(price);

  return Number.isFinite(amount)
    ? `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
    : "₹0";
};

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getWeekday = (dateString) =>
  new Date(`${dateString}T00:00:00Z`).getUTCDay();

const isSunday = (dateString) =>
  Boolean(dateString) && getWeekday(dateString) === 0;

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const getOfficeHours = (dateString) => {
  if (!dateString) return null;

  const day = getWeekday(dateString);

  if (Number.isNaN(day) || day === 0) return null;

  return day === 6 ? OFFICE_HOURS.saturday : OFFICE_HOURS.weekday;
};

const getNextOpenDate = (dateString) =>
  isSunday(dateString) ? addDays(dateString, 1) : dateString;

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) =>
  `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(
    totalMinutes % 60,
  ).padStart(2, "0")}`;

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

const getEndTime = (startTime, durationHours) =>
  minutesToTime(timeToMinutes(startTime) + durationHours * 60);

const getDailyEndDate = (startDate, duration) => {
  let cursor = startDate;
  let counted = 0;
  let last = startDate;

  while (counted < duration) {
    if (!isSunday(cursor)) {
      counted += 1;
      last = cursor;
    }
    cursor = addDays(cursor, 1);
  }

  return last;
};

const getSpaceCapacity = (spaceName = "") => {
  const name = spaceName.toLowerCase();

  if (name.includes("individual")) return "1 Person";
  if (name.includes("team")) return "Team Space";
  if (name.includes("conferenc")) return "Meeting Space";
  if (name.includes("ceo")) return "Private Cabin";
  if (name.includes("executive")) return "Executive Space";
  if (name.includes("manager")) return "Private Cabin";

  return "Workspace";
};

const getSpaces = (space) => {
  return Array.isArray(space?.spaces) ? space.spaces : [];
};

const getPricingOptions = (space) => {
  const options = [];

  const addOption = (id, label, shortLabel, value, icon) => {
    if (value === null || value === undefined || value === "") return;

    const price = Number(value);

    if (!Number.isFinite(price) || price < 0) return;

    options.push({ id, label, shortLabel, price, icon });
  };

  addOption("hourly", "Hourly", "Hour", space?.perHour, Clock3);
  addOption("daily", "Daily", "Day", space?.perDay, CalendarDays);
  addOption("monthly", "Monthly", "Month", space?.perMonth, CalendarDays);

  return options;
};

const getDurationLimits = (space, plan, dateString, startTime) => {
  const min = Math.max(1, Number(space?.minDuration) || 1);

  const defaultMax = plan === "hourly" ? 12 : plan === "daily" ? 30 : 12;

  const configuredMax = Number(space?.maxDuration) || defaultMax;
  let max = Math.max(min, configuredMax);

  if (plan === "hourly") {
    const hours = getOfficeHours(dateString);

    if (hours) {
      const startMinutes = startTime ? timeToMinutes(startTime) : hours.open;

      const hoursLeft = Math.floor((hours.close - startMinutes) / 60);
      max = Math.min(max, hoursLeft);
    }
  }

  return { min, max: Math.max(min, max) };
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const getFreeStartTimes = (
  bookedSlots,
  hours,
  durationHours,
  minStart = -1,
) => {
  if (!hours) return [];

  const free = [];

  for (let m = hours.open; m + durationHours * 60 <= hours.close; m += 60) {
    if (m <= minStart) continue;

    const end = m + durationHours * 60;

    const clash = bookedSlots.some((slot) =>
      overlaps(
        m,
        end,
        timeToMinutes(slot.startTime),
        timeToMinutes(slot.endTime),
      ),
    );

    if (!clash) free.push(minutesToTime(m));
  }

  return free;
};

// ---------------------------------------------
// BookSpace Component
// ---------------------------------------------

export default function BookSpace() {
  const location = useLocation();
  const navigate = useNavigate();

  const space = location.state?.space;

  const isPerHead = PER_HEAD_SPACES.includes(space?.space);

  const pricingOptions = useMemo(() => getPricingOptions(space), [space]);

  const availableSpaces = useMemo(() => getSpaces(space), [space]);

  const [selectedPlan, setSelectedPlan] = useState(
    pricingOptions[0]?.id || "daily",
  );

  const [selectedDate, setSelectedDate] = useState(getNextOpenDate(getToday()));
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSpaces, setSelectedSpaces] = useState([]);
  const [duration, setDuration] = useState(1);

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [unavailableSpaces, setUnavailableSpaces] = useState([]);
  const [availabilityError, setAvailabilityError] = useState("");

  const [seatStatus, setSeatStatus] = useState({});
  const [toast, setToast] = useState(null);

  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [assignments, setAssignments] = useState({});

  const [attendees, setAttendees] = useState([]);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Load team members
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await api.get("/team/my-team");

        if (active && response.data?.success) {
          setTeamMembers(response.data.teamMembers || []);
        }
      } catch (error) {
        console.error("Load team error:", error);
      } finally {
        if (active) setTeamLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const isHourly = selectedPlan === "hourly";
  const isClosedDay = isSunday(selectedDate);

  const officeHours = useMemo(
    () => getOfficeHours(selectedDate),
    [selectedDate],
  );

  const selectedPricing = useMemo(
    () =>
      pricingOptions.find((option) => option.id === selectedPlan) ||
      pricingOptions[0],
    [pricingOptions, selectedPlan],
  );

  const { min: minDuration, max: maxDuration } = useMemo(
    () => getDurationLimits(space, selectedPlan, selectedDate, selectedTime),
    [space, selectedPlan, selectedDate, selectedTime],
  );

  const baseMinDuration = Math.max(1, Number(space?.minDuration) || 1);

  const timeSlots = useMemo(() => {
    if (!isHourly || !officeHours) return [];

    const isToday = selectedDate === getToday();
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const slots = [];

    for (
      let minutes = officeHours.open;
      minutes + baseMinDuration * 60 <= officeHours.close;
      minutes += 60
    ) {
      const value = minutesToTime(minutes);

      slots.push({
        value,
        label: formatTime(value),
        disabled: isToday && minutes <= nowMinutes,
      });
    }

    return slots;
  }, [isHourly, officeHours, selectedDate, baseMinDuration]);

  const endTime =
    isHourly && selectedTime ? getEndTime(selectedTime, duration) : "";

  const dailyEndDate =
    selectedPlan === "daily" && duration > 1 && !isClosedDay
      ? getDailyEndDate(selectedDate, duration)
      : "";

  const billableQty = isPerHead ? attendees.length : selectedSpaces.length;

  const totalAmount = useMemo(() => {
    if (!selectedPricing) return 0;

    return selectedPricing.price * duration * billableQty;
  }, [selectedPricing, duration, billableQty]);

  const taxableAmount = appliedCoupon ? appliedCoupon.finalAmount : totalAmount;

  const gstAmount = round2((taxableAmount * GST_RATE) / 100);

  const payableAmount = round2(taxableAmount + gstAmount);

  const availableSpaceCount = useMemo(
    () =>
      availableSpaces.filter(
        (item) =>
          item.status === "Active" &&
          !unavailableSpaces.includes(item.spaceCode) &&
          !seatStatus[item.spaceCode]?.fullDay,
      ).length,
    [availableSpaces, unavailableSpaces, seatStatus],
  );

  const assignmentsComplete = isPerHead
    ? selectedSpaces.length === 1 && attendees.length > 0
    : selectedSpaces.length > 0 &&
      selectedSpaces.every((code) => Boolean(assignments[code]));

  const takenAssignees = new Set(Object.values(assignments));

  const getAssigneeName = (value) => {
    if (!value) return "";
    if (value === SELF) return "Me";

    return teamMembers.find((member) => member._id === value)?.name || "";
  };

  const buildSeatAssignments = () => {
    const toEntry = (code, value) => {
      const member = teamMembers.find((item) => item._id === value);

      return value === SELF
        ? { spaceCode: code, assigneeType: "self", label: "Myself" }
        : {
            spaceCode: code,
            assigneeType: "team",
            teamMemberId: value,
            label: member?.name || "Team member",
          };
    };

    return isPerHead
      ? attendees.map((value) => toEntry(selectedSpaces[0], value))
      : selectedSpaces.map((code) => toEntry(code, assignments[code]));
  };

  const removeCoupon = (message = "") => {
    setAppliedCoupon(null);
    setCouponError(message);
  };

  const clearAvailabilityResult = () => {
    setUnavailableSpaces([]);
    setAvailabilityError("");

    if (appliedCoupon) {
      removeCoupon("Booking changed. Please apply your coupon again.");
    }
  };

  // ---------------------------------------------
  // Toast
  // ---------------------------------------------

  const showToast = (message, type = "error") => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 7000);

    return () => clearTimeout(timer);
  }, [toast]);

  // ---------------------------------------------
  // Seat status
  // ---------------------------------------------

  const refreshSeatStatus = useCallback(async () => {
    if (!space?.space || !selectedDate || isClosedDay || !selectedPlan) {
      setSeatStatus({});
      return {};
    }

    try {
      const response = await api.post("/booking/seat_status", {
        spaceName: space.space,
        bookingDate: selectedDate,
        plan: selectedPlan,
        duration,
      });

      const seats = response.data?.success ? response.data.seats || {} : {};

      setSeatStatus(seats);
      return seats;
    } catch (error) {
      console.error("Seat status error:", error);
      return {};
    }
  }, [space?.space, selectedDate, selectedPlan, duration, isClosedDay]);

  useEffect(() => {
    refreshSeatStatus();
  }, [refreshSeatStatus]);

  const getSeatBlock = (code, status = seatStatus) => {
    const info = status[code];

    if (!info) return null;
    if (info.fullDay) return "full";

    if (isHourly && selectedTime) {
      const start = timeToMinutes(selectedTime);
      const end = start + duration * 60;

      const clash = (info.bookedSlots || []).some((slot) =>
        overlaps(
          start,
          end,
          timeToMinutes(slot.startTime),
          timeToMinutes(slot.endTime),
        ),
      );

      if (clash) return "time";
    }

    return null;
  };

  const notifySeatBooked = (code, status = seatStatus) => {
    const info = status[code];

    if (info?.fullDay) {
      showToast(`Seat ${code} is already booked for the selected date(s).`);
      return;
    }

    const slots = info?.bookedSlots || [];

    const now = new Date();
    const minStart =
      selectedDate === getToday() ? now.getHours() * 60 + now.getMinutes() : -1;

    const free = getFreeStartTimes(slots, officeHours, duration, minStart);

    const when = selectedTime
      ? `${formatTime(selectedTime)} - ${formatTime(endTime)}`
      : "the selected time";

    showToast(
      `Seat ${code} is already booked for ${when}. ` +
        (free.length
          ? `Available start times: ${free.map(formatTime).join(", ")}.`
          : "No other times are available on this date."),
    );
  };

  useEffect(() => {
    const conflicts = selectedSpaces.filter((code) => getSeatBlock(code));

    if (!conflicts.length) return;

    setSelectedSpaces((previous) =>
      previous.filter((code) => !conflicts.includes(code)),
    );

    setAssignments((previous) => {
      const next = { ...previous };
      conflicts.forEach((code) => delete next[code]);
      return next;
    });

    removeCoupon();
    notifySeatBooked(conflicts[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatStatus, selectedTime, duration]);

  const incrementDuration = () => {
    if (duration < maxDuration) {
      setDuration((previous) => previous + 1);
      clearAvailabilityResult();
    }
  };

  const decrementDuration = () => {
    if (duration > minDuration) {
      setDuration((previous) => previous - 1);
      clearAvailabilityResult();
    }
  };

  const toggleSpace = (spaceCode) => {
    if (!selectedSpaces.includes(spaceCode) && getSeatBlock(spaceCode)) {
      notifySeatBooked(spaceCode);
      return;
    }

    clearAvailabilityResult();

    if (selectedSpaces.includes(spaceCode)) {
      setAssignments((previous) => {
        const next = { ...previous };
        delete next[spaceCode];
        return next;
      });
    }

    setSelectedSpaces((previous) =>
      previous.includes(spaceCode)
        ? previous.filter((code) => code !== spaceCode)
        : isPerHead
          ? [spaceCode]
          : [...previous, spaceCode],
    );
  };

  const handleAssign = (spaceCode, value) => {
    setAssignments((previous) => {
      const next = { ...previous };

      if (value) next[spaceCode] = value;
      else delete next[spaceCode];

      return next;
    });

    setAvailabilityError("");
  };

  const toggleAttendee = (value) => {
    setAttendees((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : previous.length >= MAX_HEADS
          ? previous
          : [...previous, value],
    );

    clearAvailabilityResult();
  };

  const handlePlanChange = (planId) => {
    setSelectedPlan(planId);
    setSeatStatus({});

    const limits = getDurationLimits(space, planId, selectedDate, selectedTime);

    setDuration((previous) =>
      Math.min(Math.max(previous, limits.min), limits.max),
    );

    clearAvailabilityResult();
  };

  const handleDateChange = (value) => {
    setSelectedDate(value);
    setSeatStatus({});

    const hours = getOfficeHours(value);
    let nextTime = selectedTime;

    if (selectedTime && (!hours || timeToMinutes(selectedTime) < hours.open)) {
      nextTime = "";
      setSelectedTime("");
    }

    const limits = getDurationLimits(space, selectedPlan, value, nextTime);

    setDuration((previous) =>
      Math.min(Math.max(previous, limits.min), limits.max),
    );

    clearAvailabilityResult();
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);

    const limits = getDurationLimits(space, selectedPlan, selectedDate, time);

    setDuration((previous) =>
      Math.min(Math.max(previous, limits.min), limits.max),
    );

    clearAvailabilityResult();
  };

  // ---------------------------------------------
  // Apply coupon
  // ---------------------------------------------

  const handleApplyCoupon = async () => {
    if (couponLoading) return;

    const code = couponInput.trim().toUpperCase();

    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }

    if (!selectedSpaces.length || !selectedPricing) {
      setCouponError("Select your spaces and plan first.");
      return;
    }

    if (isPerHead && !attendees.length) {
      setCouponError("Select attendees first.");
      return;
    }

    if (isClosedDay) {
      setCouponError("Select a valid booking date first.");
      return;
    }

    if (isHourly && !selectedTime) {
      setCouponError("Select a start time first.");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const response = await api.post("/booking/validate_coupon", {
        couponCode: code,
        spaceName: space.space,
        bookingDate: selectedDate,
        plan: selectedPlan,
        duration,
        selectedSpaces,
        ...(isPerHead ? { seatAssignments: buildSeatAssignments() } : {}),
        ...(isHourly ? { startTime: selectedTime } : {}),
      });

      if (response.data?.success) {
        setAppliedCoupon({
          couponCode: response.data.couponCode,
          discountPercent: response.data.discountPercent,
          discountAmount: response.data.discountAmount,
          finalAmount: response.data.finalAmount,
        });
        setCouponInput("");
      } else {
        setAppliedCoupon(null);
        setCouponError(response.data?.message || "Unable to apply coupon.");
      }
    } catch (error) {
      console.error("Apply coupon error:", error);

      setAppliedCoupon(null);
      setCouponError(
        error.response?.data?.message || "Unable to apply coupon.",
      );
    } finally {
      setCouponLoading(false);
    }
  };

  // ---------------------------------------------
  // Check availability and navigate to checkout
  // ---------------------------------------------

  const handleContinue = async () => {
    if (checkingAvailability) return;

    if (!space?.space) {
      setAvailabilityError("Workspace information is missing.");
      return;
    }

    if (!selectedDate) {
      setAvailabilityError("Please select a booking date.");
      return;
    }

    if (selectedDate < getToday()) {
      setAvailabilityError("Please select today or a future date.");
      return;
    }

    if (isSunday(selectedDate)) {
      setAvailabilityError(
        "Our office is closed on Sundays. Please select another date.",
      );
      return;
    }

    if (!selectedSpaces.length) {
      setAvailabilityError("Please select at least one space.");
      return;
    }

    if (new Set(selectedSpaces).size !== selectedSpaces.length) {
      setAvailabilityError("Duplicate spaces are not allowed.");
      return;
    }

    if (isPerHead) {
      if (selectedSpaces.length !== 1) {
        setAvailabilityError("Please select the conference room.");
        return;
      }

      if (!attendees.length) {
        setAvailabilityError("Please select at least one attendee.");
        return;
      }
    } else {
      if (!selectedSpaces.every((code) => assignments[code])) {
        setAvailabilityError(
          "Please assign every selected seat to yourself or a team member.",
        );
        return;
      }

      const assignedValues = selectedSpaces.map((code) => assignments[code]);

      if (new Set(assignedValues).size !== assignedValues.length) {
        setAvailabilityError(
          "One person cannot be assigned to multiple seats.",
        );
        return;
      }
    }

    if (!selectedPricing) {
      setAvailabilityError("Please select a valid booking plan.");
      return;
    }

    if (
      !Number.isInteger(duration) ||
      duration < minDuration ||
      duration > maxDuration
    ) {
      setAvailabilityError("Please select a valid booking duration.");
      return;
    }

    if (isHourly) {
      if (!selectedTime) {
        setAvailabilityError("Please select a start time.");
        return;
      }

      const startMinutes = timeToMinutes(selectedTime);
      const endMinutes = startMinutes + duration * 60;

      if (
        !officeHours ||
        startMinutes < officeHours.open ||
        endMinutes > officeHours.close
      ) {
        setAvailabilityError(
          "Selected time is outside office hours. Please choose another time.",
        );
        return;
      }

      if (selectedDate === getToday()) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        if (startMinutes <= nowMinutes) {
          setAvailabilityError(
            "Selected time has already passed. Please choose a later time.",
          );
          return;
        }
      }
    }

    const selectedCodes = new Set(
      availableSpaces
        .filter((item) => item.status === "Active")
        .map((item) => item.spaceCode),
    );

    if (selectedSpaces.some((code) => !selectedCodes.has(code))) {
      setAvailabilityError(
        "One or more selected spaces are no longer active. Please select again.",
      );
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityError("");
    setUnavailableSpaces([]);

    try {
      const response = await api.post("/booking/check_workspace_availability", {
        spaceName: space.space,
        bookingDate: selectedDate,
        plan: selectedPlan,
        duration,
        selectedSpaces,
        ...(isHourly ? { startTime: selectedTime } : {}),
      });

      const result = response.data;

      if (!result?.success) {
        setAvailabilityError(
          result?.message || "Unable to check workspace availability.",
        );
        return;
      }

      if (!result.available) {
        const unavailable = Array.isArray(result.unavailableSpaces)
          ? result.unavailableSpaces
          : [];

        setUnavailableSpaces(unavailable);

        setSelectedSpaces((previous) =>
          previous.filter((code) => !unavailable.includes(code)),
        );

        setAssignments((previous) => {
          const next = { ...previous };
          unavailable.forEach((code) => delete next[code]);
          return next;
        });

        removeCoupon();

        const latest = await refreshSeatStatus();
        if (unavailable[0]) notifySeatBooked(unavailable[0], latest);

        setAvailabilityError(
          unavailable.length
            ? `These spaces are unavailable: ${unavailable.join(", ")}. Please select different spaces.`
            : "The selected spaces are unavailable. Please select different spaces.",
        );

        return;
      }

      const bookingData = {
        spaceName: space.space,
        bookingDate: selectedDate,
        plan: selectedPlan,
        duration: Number(duration),
        selectedSpaces: [...selectedSpaces],
        seatAssignments: buildSeatAssignments(),
        headCount: billableQty,
        pricePerUnit: selectedPricing.price,
        subtotal: totalAmount,
        discountAmount: appliedCoupon?.discountAmount || 0,
        couponCode: appliedCoupon?.couponCode || null,
        taxableAmount,
        gstRate: GST_RATE,
        gstAmount,
        totalAmount: payableAmount,
        ...(isHourly
          ? {
              startTime: selectedTime,
              endTime: getEndTime(selectedTime, Number(duration)),
            }
          : {}),
      };

      navigate("/checkout", {
        state: {
          bookingData,
          space,
        },
      });
    } catch (error) {
      console.error("Workspace availability error:", error);

      if (error.response?.status === 401) {
        return;
      }

      setAvailabilityError(
        error.response?.data?.message ||
          "Unable to check availability. Please try again.",
      );
    } finally {
      setCheckingAvailability(false);
    }
  };

  const continueDisabled =
    !selectedSpaces.length ||
    !assignmentsComplete ||
    !selectedPricing ||
    checkingAvailability ||
    isClosedDay ||
    (isHourly && !selectedTime);

  // ---------------------------------------------
  // Missing workspace information
  // ---------------------------------------------

  if (!space) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#E9DED0] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F8EDE6]">
            <Home size={28} className="text-[#A95643]" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-[#382B26]">
            Space information not found
          </h2>

          <p className="mt-2 text-sm text-[#8F8175]">
            Please return to the homepage and select a space again.
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#A95643] px-5 py-3 font-semibold text-white transition hover:bg-[#71392F]"
          >
            <ArrowLeft size={18} />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const attendeeOptions = [
    { id: SELF, name: "Myself", designation: "" },
    ...teamMembers.map((member) => ({
      id: member._id,
      name: member.name,
      designation: member.designation,
    })),
  ];

  // ---------------------------------------------
  // Main UI
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Toast notification */}
      {toast && (
        <div
          key={toast.id}
          role="alert"
          className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-[#E9DED0] bg-white p-4 text-sm text-[#382B26] shadow-xl"
        >
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-[#A95643]" />
          <p className="flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            className="text-xs font-semibold text-[#A99A8D] hover:text-[#382B26]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E9DED0] bg-[#FFFDFA]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#76675D] transition hover:text-[#A95643]"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-[#382B26]">
              Book Your Space
            </h1>
            <p className="text-xs text-[#8F8175]">
              Select your preferred space
            </p>
          </div>

          <div className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Workspace information */}
            <section className="overflow-hidden rounded-2xl border border-[#E9DED0] bg-white shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                <div className="h-60 bg-[#F8EDE6] md:h-full">
                  {space.image ? (
                    <img
                      src={space.image}
                      alt={space.space}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Home size={60} className="text-[#C9B8A9]" />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#F0F5ED] px-3 py-1.5 text-xs font-semibold text-[#527C61]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#527C61]" />
                        Active Workspace
                      </div>

                      <h2 className="text-2xl font-bold text-[#382B26]">
                        {space.space}
                      </h2>

                      <p className="mt-1 text-sm text-[#8F8175]">
                        {availableSpaceCount}{" "}
                        {availableSpaceCount === 1 ? "space" : "spaces"}{" "}
                        available
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-[#F8EDE6] px-3 py-2 text-sm text-[#71392F]">
                      <Users size={17} />
                      {getSpaceCapacity(space.space)}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {space.perHour != null && (
                      <div className="rounded-xl border border-[#E9DED0] bg-[#FBF8F3] p-3">
                        <p className="text-xs text-[#8F8175]">
                          Hourly{isPerHead ? " (per person)" : ""}
                        </p>
                        <p className="mt-1 font-bold text-[#382B26]">
                          {formatPrice(space.perHour)}
                        </p>
                      </div>
                    )}

                    {space.perDay != null && (
                      <div className="rounded-xl border border-[#E9DED0] bg-[#FBF8F3] p-3">
                        <p className="text-xs text-[#8F8175]">
                          Daily{isPerHead ? " (per person)" : ""}
                        </p>
                        <p className="mt-1 font-bold text-[#382B26]">
                          {formatPrice(space.perDay)}
                        </p>
                      </div>
                    )}

                    {space.perMonth != null && (
                      <div className="rounded-xl border border-[#E9DED0] bg-[#FBF8F3] p-3">
                        <p className="text-xs text-[#8F8175]">
                          Monthly{isPerHead ? " (per person)" : ""}
                        </p>
                        <p className="mt-1 font-bold text-[#382B26]">
                          {formatPrice(space.perMonth)}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-[#A99A8D]">
                    Prices are exclusive of GST. {GST_RATE}% GST is added at
                    checkout.
                  </p>
                </div>
              </div>
            </section>

            {/* Step 1: Booking plan */}
            <section className="rounded-2xl border border-[#E9DED0] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[#382B26]">
                  1. Select Booking Plan
                </h2>
                <p className="mt-1 text-sm text-[#8F8175]">
                  Choose how you want to book your space.
                </p>
              </div>

              {pricingOptions.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {pricingOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedPlan === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handlePlanChange(option.id)}
                        className={`relative rounded-xl border-2 p-4 text-left transition ${
                          isSelected
                            ? "border-[#A95643] bg-[#F8EDE6]"
                            : "border-[#E9DED0] bg-white hover:border-[#C9826C] hover:bg-[#FBF8F3]"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#A95643] text-white">
                            <Check size={13} />
                          </div>
                        )}

                        <Icon
                          size={22}
                          className={
                            isSelected ? "text-[#A95643]" : "text-[#8F8175]"
                          }
                        />

                        <p className="mt-3 font-semibold text-[#382B26]">
                          {option.label}
                        </p>

                        <p className="mt-1 text-xl font-bold text-[#71392F]">
                          {formatPrice(option.price)}
                        </p>

                        <p className="text-xs text-[#8F8175]">
                          per {isPerHead ? "person per " : ""}
                          {option.shortLabel.toLowerCase()}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  No valid pricing plans are configured for this workspace.
                </p>
              )}
            </section>

            {/* Step 2: Date, time and duration */}
            <section className="rounded-2xl border border-[#E9DED0] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[#382B26]">
                  2. Select Date{isHourly ? ", Time" : ""} &amp; Duration
                </h2>
                <p className="mt-1 text-sm text-[#8F8175]">
                  Select when and how long you need the space.
                </p>
              </div>

              <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#E9DED0] bg-[#F8EDE6] px-4 py-3 text-xs text-[#71392F]">
                <Clock3 size={15} className="mt-0.5 shrink-0" />
                <p>Office hours: {OFFICE_HOURS_TEXT}</p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#55443B]">
                    Booking Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A95643]"
                    />

                    <input
                      type="date"
                      min={getToday()}
                      value={selectedDate}
                      onChange={(event) => handleDateChange(event.target.value)}
                      className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-[#382B26] outline-none transition focus:ring-2 ${
                        isClosedDay
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-[#E9DED0] focus:border-[#A95643] focus:ring-[#A95643]/15"
                      }`}
                    />
                  </div>

                  {selectedDate && !isClosedDay && (
                    <p className="mt-2 text-xs text-[#8F8175]">
                      Selected:{" "}
                      <span className="font-medium text-[#382B26]">
                        {formatDate(selectedDate)}
                      </span>
                    </p>
                  )}

                  {isClosedDay && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      Our office is closed on Sundays. Please select another
                      date.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#55443B]">
                    Duration
                  </label>

                  <div className="flex h-[52px] items-center justify-between rounded-xl border border-[#E9DED0] px-3">
                    <button
                      type="button"
                      onClick={decrementDuration}
                      disabled={duration <= minDuration || checkingAvailability}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#71392F] transition hover:bg-[#EEDDD2] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={17} />
                    </button>

                    <div className="text-center">
                      <p className="font-bold text-[#382B26]">{duration}</p>
                      <p className="text-[11px] text-[#8F8175]">
                        {selectedPricing?.shortLabel || "unit"}
                        {duration > 1 ? "s" : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={incrementDuration}
                      disabled={duration >= maxDuration || checkingAvailability}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#71392F] transition hover:bg-[#EEDDD2] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={17} />
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-[#8F8175]">
                    {minDuration} - {maxDuration}{" "}
                    {selectedPricing?.shortLabel?.toLowerCase() || "units"}{" "}
                    available.
                  </p>

                  {selectedPlan === "daily" && (
                    <p className="mt-1 text-xs text-[#A99A8D]">
                      Sundays are not counted in daily bookings.
                    </p>
                  )}
                </div>
              </div>

              {/* Hourly: start time selection */}
              {isHourly && !isClosedDay && (
                <div className="mt-6">
                  <label className="mb-2 block text-sm font-semibold text-[#55443B]">
                    Start Time
                  </label>

                  {timeSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                      {timeSlots.map((slot) => {
                        const isSelected = selectedTime === slot.value;

                        return (
                          <button
                            key={slot.value}
                            type="button"
                            disabled={slot.disabled || checkingAvailability}
                            onClick={() => handleTimeChange(slot.value)}
                            aria-pressed={isSelected}
                            className={`rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition ${
                              slot.disabled
                                ? "cursor-not-allowed border-[#E9DED0] bg-[#F5F0E9] text-[#B8AA9D]"
                                : isSelected
                                  ? "border-[#A95643] bg-[#A95643] text-white shadow-md shadow-[#71392F]/15"
                                  : "border-[#E9DED0] bg-white text-[#55443B] hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                      No time slots available on this date.
                    </p>
                  )}

                  {selectedTime ? (
                    <p className="mt-3 text-xs text-[#8F8175]">
                      Your booking:{" "}
                      <span className="font-medium text-[#382B26]">
                        {formatTime(selectedTime)} - {formatTime(endTime)}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-[#A99A8D]">
                      Select a start time to continue.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Step 3: Space selection */}
            <section className="rounded-2xl border border-[#E9DED0] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#382B26]">
                    3. Select Your Space
                  </h2>
                  <p className="mt-1 text-sm text-[#8F8175]">
                    {isPerHead
                      ? "Choose the room, then pick who is attending."
                      : "Choose the space you want to book."}
                  </p>
                </div>

                <div className="rounded-full bg-[#F8EDE6] px-4 py-2 text-sm font-semibold text-[#A95643]">
                  {selectedSpaces.length} Selected
                </div>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-5 text-xs text-[#8F8175]">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-md border border-[#D8CBBE] bg-white" />
                  Available
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-md bg-[#A95643]" />
                  Selected
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-md bg-[#D6CEC5]" />
                  Booked / Unavailable
                </div>
              </div>

              <div className="rounded-2xl border border-[#E9DED0] bg-[#FBF8F3] p-5 sm:p-8">
                <div className="mb-8 flex justify-center">
                  <div className="w-full max-w-md">
                    <div className="mb-2 h-2 rounded-full bg-gradient-to-r from-transparent via-[#C9B8A9] to-transparent" />
                    <p className="text-center text-[10px] uppercase tracking-[0.25em] text-[#A99A8D]">
                      Workspace Front
                    </p>
                  </div>
                </div>

                {availableSpaces.length > 0 ? (
                  <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
                    {availableSpaces.map((spaceItem) => {
                      const seatCode = spaceItem.spaceCode;
                      const isSelected = selectedSpaces.includes(seatCode);
                      const block = getSeatBlock(seatCode);

                      const isAvailable =
                        spaceItem.status === "Active" &&
                        !unavailableSpaces.includes(seatCode) &&
                        block !== "full";

                      const hourlyClash = block === "time";

                      return (
                        <button
                          key={seatCode}
                          type="button"
                          disabled={!isAvailable || checkingAvailability}
                          onClick={() => toggleSpace(seatCode)}
                          aria-pressed={isSelected}
                          className={`relative flex aspect-square min-h-[58px] flex-col items-center justify-center rounded-xl border-2 text-xs font-semibold transition sm:min-h-[64px] ${
                            !isAvailable || hourlyClash
                              ? `border-[#E2DAD1] bg-[#D6CEC5] text-[#8F8175] ${
                                  !isAvailable
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer"
                                }`
                              : isSelected
                                ? "border-[#A95643] bg-[#A95643] text-white shadow-md shadow-[#71392F]/20"
                                : "border-[#D8CBBE] bg-white text-[#55443B] hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                          }`}
                        >
                          {isSelected ? (
                            <Check size={18} />
                          ) : (
                            <span className="text-[11px]">{seatCode}</span>
                          )}

                          {isSelected && (
                            <span className="mt-0.5 text-[9px]">Selected</span>
                          )}

                          {(!isAvailable || hourlyClash) && (
                            <span className="text-[9px]">Booked</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Home size={40} className="mx-auto text-[#C9B8A9]" />
                    <p className="mt-4 text-sm font-medium text-[#76675D]">
                      No spaces available.
                    </p>
                  </div>
                )}

                {availableSpaces.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <div className="rounded-lg bg-[#E9DED0] px-12 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#8F8175]">
                      Back
                    </div>
                  </div>
                )}
              </div>

              {selectedSpaces.length > 0 && (
                <div className="mt-5 rounded-xl border border-[#E9DED0] bg-[#F8EDE6] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#A95643]">
                    Selected Spaces
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSpaces.map((spaceCode) => (
                      <span
                        key={spaceCode}
                        className="rounded-lg bg-[#A95643] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {spaceCode}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Normal spaces: assign seats */}
              {!isPerHead && selectedSpaces.length > 0 && (
                <div className="mt-5 rounded-xl border border-[#E9DED0] p-4">
                  <p className="text-sm font-semibold text-[#382B26]">
                    Who is each seat for?{" "}
                    <span className="text-red-500">*</span>
                  </p>
                  <p className="mt-1 text-xs text-[#8F8175]">
                    Assign every seat to yourself or a team member. Each person
                    can take one seat.
                  </p>

                  {!teamLoading && teamMembers.length === 0 && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      No team members are linked to your account, so you can
                      only book a seat for yourself.
                    </p>
                  )}

                  <div className="mt-3 space-y-2">
                    {selectedSpaces.map((code) => {
                      const current = assignments[code] || "";

                      return (
                        <div
                          key={code}
                          className="flex items-center justify-between gap-3 rounded-lg bg-[#FBF8F3] px-3 py-2"
                        >
                          <span className="rounded-md bg-[#A95643] px-2.5 py-1 text-xs font-semibold text-white">
                            {code}
                          </span>

                          <select
                            value={current}
                            onChange={(event) =>
                              handleAssign(code, event.target.value)
                            }
                            disabled={checkingAvailability || teamLoading}
                            aria-label={`Assign seat ${code}`}
                            className={`min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm text-[#382B26] outline-none focus:ring-2 ${
                              current
                                ? "border-[#E9DED0] focus:border-[#A95643] focus:ring-[#A95643]/15"
                                : "border-red-300 focus:border-red-400 focus:ring-red-100"
                            }`}
                          >
                            <option value="">Select person</option>

                            <option
                              value={SELF}
                              disabled={
                                takenAssignees.has(SELF) && current !== SELF
                              }
                            >
                              Myself
                            </option>

                            {teamMembers.map((member) => (
                              <option
                                key={member._id}
                                value={member._id}
                                disabled={
                                  takenAssignees.has(member._id) &&
                                  current !== member._id
                                }
                              >
                                {member.name}
                                {member.designation
                                  ? ` (${member.designation})`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Per-head rooms: attendees */}
              {isPerHead && selectedSpaces.length > 0 && (
                <div className="mt-5 rounded-xl border border-[#E9DED0] p-4">
                  <p className="text-sm font-semibold text-[#382B26]">
                    Who is attending? <span className="text-red-500">*</span>
                  </p>
                  <p className="mt-1 text-xs text-[#8F8175]">
                    {formatPrice(selectedPricing?.price)} per person per{" "}
                    {selectedPricing?.shortLabel?.toLowerCase() || "unit"}.
                    Maximum {MAX_HEADS} people.
                  </p>

                  {!teamLoading && teamMembers.length === 0 && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      No team members are linked to your account, so you can
                      only book for yourself.
                    </p>
                  )}

                  <div className="mt-3 space-y-2">
                    {attendeeOptions.map((person) => {
                      const checked = attendees.includes(person.id);
                      const limitReached =
                        !checked && attendees.length >= MAX_HEADS;

                      return (
                        <label
                          key={person.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                            checked
                              ? "bg-[#F8EDE6] ring-1 ring-[#C9826C]"
                              : "bg-[#FBF8F3]"
                          } ${limitReached ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAttendee(person.id)}
                            disabled={
                              checkingAvailability ||
                              teamLoading ||
                              limitReached
                            }
                            className="h-4 w-4 accent-[#A95643]"
                          />

                          <span className="font-medium text-[#382B26]">
                            {person.name}
                          </span>

                          {person.designation && (
                            <span className="text-xs text-[#8F8175]">
                              ({person.designation})
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs font-semibold text-[#A95643]">
                    {attendees.length}{" "}
                    {attendees.length === 1 ? "person" : "people"} attending
                  </p>
                </div>
              )}

              {availabilityError && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  <p>{availabilityError}</p>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-[#E9DED0] bg-white shadow-sm">
              <div className="border-b border-[#60473D] bg-[#382B26] p-5 text-white">
                <p className="text-xs font-medium uppercase tracking-wider text-[#D8B8A8]">
                  Booking Summary
                </p>

                <h2 className="mt-1 text-xl font-bold">{space.space}</h2>

                <p className="mt-1 text-sm text-[#D0BEB2]">
                  {availableSpaceCount}{" "}
                  {availableSpaceCount === 1 ? "space" : "spaces"} available
                </p>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4 border-b border-[#F0E7DD] pb-4">
                  <div>
                    <p className="text-xs text-[#8F8175]">Date</p>
                    <p className="mt-1 text-sm font-semibold text-[#382B26]">
                      {formatDate(selectedDate)}
                    </p>
                    {dailyEndDate && (
                      <p className="mt-1 text-xs text-[#8F8175]">
                        till {formatDate(dailyEndDate)} (Sundays excluded)
                      </p>
                    )}
                  </div>
                  <CalendarDays size={19} className="text-[#A95643]" />
                </div>

                {isHourly && (
                  <div className="flex items-start justify-between gap-4 border-b border-[#F0E7DD] py-4">
                    <div>
                      <p className="text-xs text-[#8F8175]">Time</p>
                      <p className="mt-1 text-sm font-semibold text-[#382B26]">
                        {selectedTime
                          ? `${formatTime(selectedTime)} - ${formatTime(endTime)}`
                          : "Not selected"}
                      </p>
                    </div>
                    <Clock3 size={19} className="text-[#A95643]" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 border-b border-[#F0E7DD] py-4">
                  <div>
                    <p className="text-xs text-[#8F8175]">Plan</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-[#382B26]">
                      {selectedPricing?.label || "-"}
                    </p>
                  </div>
                  <Clock3 size={19} className="text-[#A95643]" />
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-[#F0E7DD] py-4">
                  <div>
                    <p className="text-xs text-[#8F8175]">Duration</p>
                    <p className="mt-1 text-sm font-semibold text-[#382B26]">
                      {duration} {selectedPricing?.shortLabel || "unit"}
                      {duration > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#F8EDE6] px-2.5 py-1 text-xs font-semibold text-[#A95643]">
                    × {duration}
                  </div>
                </div>

                <div className="border-b border-[#F0E7DD] py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8F8175]">
                      {isPerHead ? "Attendees" : "Spaces"}
                    </p>
                    <p className="text-sm font-semibold text-[#382B26]">
                      {isPerHead ? attendees.length : selectedSpaces.length}
                    </p>
                  </div>

                  {isPerHead ? (
                    attendees.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {attendees.map((value) => (
                          <span
                            key={value}
                            className="rounded-md bg-[#F8EDE6] px-2 py-1 text-[11px] font-semibold text-[#71392F]"
                          >
                            {getAssigneeName(value) || "Team member"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[#A99A8D]">
                        No attendees selected
                      </p>
                    )
                  ) : selectedSpaces.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {selectedSpaces.map((spaceCode) => {
                        const assigneeName = getAssigneeName(
                          assignments[spaceCode],
                        );

                        return (
                          <span
                            key={spaceCode}
                            className="rounded-md bg-[#F8EDE6] px-2 py-1 text-[11px] font-semibold text-[#71392F]"
                          >
                            {spaceCode}
                            {assigneeName && ` · ${assigneeName}`}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[#A99A8D]">
                      No space selected
                    </p>
                  )}

                  {isPerHead && selectedSpaces.length > 0 && (
                    <p className="mt-3 text-xs text-[#8F8175]">
                      Room: {selectedSpaces[0]}
                    </p>
                  )}
                </div>

                {/* Price breakdown, coupon, GST and total */}
                <div className="py-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#8F8175]">
                      Price {isPerHead ? "/ person" : ""} /{" "}
                      {selectedPricing?.shortLabel?.toLowerCase() || "unit"}
                    </span>
                    <span className="font-medium text-[#382B26]">
                      {formatPrice(selectedPricing?.price)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-[#8F8175]">Duration</span>
                    <span className="font-medium text-[#382B26]">
                      × {duration}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-[#8F8175]">
                      {isPerHead ? "People" : "Spaces"}
                    </span>
                    <span className="font-medium text-[#382B26]">
                      × {billableQty}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-[#8F8175]">Subtotal</span>
                    <span className="font-medium text-[#382B26]">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>

                  {/* Coupon */}
                  <div className="mt-4 border-t border-[#F0E7DD] pt-4">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between rounded-xl border border-[#DCE8D9] bg-[#F0F5ED] px-3 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-[#42664C]">
                            {appliedCoupon.couponCode} applied
                          </p>
                          <p className="text-xs text-[#527C61]">
                            {appliedCoupon.discountPercent}% off
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeCoupon()}
                          className="text-xs font-semibold text-[#A95643] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <label
                          htmlFor="coupon-code"
                          className="mb-2 block text-xs font-semibold text-[#55443B]"
                        >
                          Have a coupon?
                        </label>

                        <div className="flex gap-2">
                          <input
                            id="coupon-code"
                            type="text"
                            value={couponInput}
                            onChange={(event) => {
                              setCouponInput(event.target.value.toUpperCase());
                              setCouponError("");
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                            placeholder="Enter code"
                            maxLength={30}
                            className="min-w-0 flex-1 rounded-lg border border-[#E9DED0] bg-white px-3 py-2.5 text-sm uppercase text-[#382B26] outline-none placeholder:text-[#A99A8D] focus:border-[#A95643] focus:ring-2 focus:ring-[#A95643]/15"
                          />

                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponInput.trim()}
                            className="rounded-lg bg-[#382B26] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#71392F] disabled:cursor-not-allowed disabled:bg-[#D6CEC5]"
                          >
                            {couponLoading ? "..." : "Apply"}
                          </button>
                        </div>
                      </>
                    )}

                    {couponError && (
                      <p role="alert" className="mt-2 text-xs text-red-600">
                        {couponError}
                      </p>
                    )}
                  </div>

                  {appliedCoupon && (
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-[#527C61]">Coupon discount</span>
                      <span className="font-semibold text-[#527C61]">
                        − {formatPrice(appliedCoupon.discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-[#8F8175]">GST ({GST_RATE}%)</span>
                    <span className="font-medium text-[#382B26]">
                      {formatPrice(gstAmount)}
                    </span>
                  </div>

                  <div className="mt-5 flex items-end justify-between border-t border-[#E9DED0] pt-5">
                    <div>
                      <p className="text-xs text-[#8F8175]">Estimated Total</p>
                      <p className="mt-1 text-2xl font-bold text-[#71392F]">
                        {formatPrice(payableAmount)}
                      </p>
                      {appliedCoupon && (
                        <p className="text-xs text-[#A99A8D] line-through">
                          {formatPrice(
                            round2(totalAmount * (1 + GST_RATE / 100)),
                          )}
                        </p>
                      )}
                    </div>

                    <span className="rounded-full bg-[#F0F5ED] px-2.5 py-1 text-[10px] font-semibold text-[#527C61]">
                      Incl. GST
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={continueDisabled}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#A95643] px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#71392F] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A95643] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#D6CEC5] disabled:text-[#8F8175] disabled:shadow-none"
                >
                  {checkingAvailability ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Checking Availability...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {isClosedDay ? (
                  <p className="mt-3 text-center text-xs text-red-500">
                    Office is closed on Sundays. Select another date.
                  </p>
                ) : isHourly && !selectedTime ? (
                  <p className="mt-3 text-center text-xs text-[#8F8175]">
                    Select a start time to continue.
                  </p>
                ) : !selectedSpaces.length ? (
                  <p className="mt-3 text-center text-xs text-[#8F8175]">
                    Select at least one space to continue.
                  </p>
                ) : (
                  !assignmentsComplete && (
                    <p className="mt-3 text-center text-xs text-[#8F8175]">
                      {isPerHead
                        ? "Select at least one attendee to continue."
                        : "Assign each seat to a person to continue."}
                    </p>
                  )
                )}
              </div>
            </div>

            {/* Secure booking information */}
            <div className="mt-4 rounded-xl border border-[#E9DED0] bg-white p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F5ED]">
                  <Check size={18} className="text-[#527C61]" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#382B26]">
                    Secure Booking
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#8F8175]">
                    Your booking is confirmed only after successful payment
                    verification by the server.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
