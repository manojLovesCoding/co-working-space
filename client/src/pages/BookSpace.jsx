import { useMemo, useState } from "react";
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

// ---------------------------------------------
// Helpers
// ---------------------------------------------

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "₹0";
  }

  const amount = Number(price);
  return Number.isFinite(amount)
    ? `₹${amount.toLocaleString("en-IN")}`
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

const getSpaceCapacity = (spaceName = "") => {
  const name = spaceName.toLowerCase();

  if (name.includes("individual")) return "1 Person";
  if (name.includes("team")) return "Team Space";
  if (name.includes("conference")) return "Meeting Space";
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

const getDurationLimits = (space, plan) => {
  const min = Math.max(1, Number(space?.minDuration) || 1);

  const defaultMax =
    plan === "hourly" ? 12 : plan === "daily" ? 30 : 12;

  const configuredMax = Number(space?.maxDuration) || defaultMax;
  const max = Math.max(min, configuredMax);

  return { min, max };
};

// ---------------------------------------------
// BookSpace Component
// ---------------------------------------------

export default function BookSpace() {
  const location = useLocation();
  const navigate = useNavigate();

  const space = location.state?.space;

  const pricingOptions = useMemo(() => getPricingOptions(space), [space]);

  const availableSpaces = useMemo(() => getSpaces(space), [space]);

  const [selectedPlan, setSelectedPlan] = useState(
    pricingOptions[0]?.id || "daily"
  );

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedSpaces, setSelectedSpaces] = useState([]);
  const [duration, setDuration] = useState(1);

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [unavailableSpaces, setUnavailableSpaces] = useState([]);
  const [availabilityError, setAvailabilityError] = useState("");

  const selectedPricing = useMemo(
    () =>
      pricingOptions.find((option) => option.id === selectedPlan) ||
      pricingOptions[0],
    [pricingOptions, selectedPlan]
  );

  const { min: minDuration, max: maxDuration } = useMemo(
    () => getDurationLimits(space, selectedPlan),
    [space, selectedPlan]
  );

  const totalAmount = useMemo(() => {
    if (!selectedPricing) return 0;

    return selectedPricing.price * duration * selectedSpaces.length;
  }, [selectedPricing, duration, selectedSpaces.length]);

  const availableSpaceCount = useMemo(
    () =>
      availableSpaces.filter(
        (item) =>
          item.status === "Active" &&
          !unavailableSpaces.includes(item.spaceCode)
      ).length,
    [availableSpaces, unavailableSpaces]
  );

  const clearAvailabilityResult = () => {
    setUnavailableSpaces([]);
    setAvailabilityError("");
  };

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
    clearAvailabilityResult();

    setSelectedSpaces((previous) =>
      previous.includes(spaceCode)
        ? previous.filter((code) => code !== spaceCode)
        : [...previous, spaceCode]
    );
  };

  const handlePlanChange = (planId) => {
    setSelectedPlan(planId);

    const limits = getDurationLimits(space, planId);

    setDuration((previous) =>
      Math.min(Math.max(previous, limits.min), limits.max)
    );

    clearAvailabilityResult();
  };

  // ---------------------------------------------
  // Check availability and navigate to checkout
  // POST /api/booking/check_workspace_availability
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

    if (!selectedSpaces.length) {
      setAvailabilityError("Please select at least one space.");
      return;
    }

    if (new Set(selectedSpaces).size !== selectedSpaces.length) {
      setAvailabilityError("Duplicate spaces are not allowed.");
      return;
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

    const selectedCodes = new Set(
      availableSpaces
        .filter((item) => item.status === "Active")
        .map((item) => item.spaceCode)
    );

    if (selectedSpaces.some((code) => !selectedCodes.has(code))) {
      setAvailabilityError(
        "One or more selected spaces are no longer active. Please select again."
      );
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityError("");
    setUnavailableSpaces([]);

    try {
      const response = await api.post(
        "/booking/check_workspace_availability",
        {
          spaceName: space.space,
          bookingDate: selectedDate,
          plan: selectedPlan,
          duration,
          selectedSpaces,
        }
      );

      const result = response.data;

      if (!result?.success) {
        setAvailabilityError(
          result?.message || "Unable to check workspace availability."
        );
        return;
      }

      if (!result.available) {
        const unavailable = Array.isArray(result.unavailableSpaces)
          ? result.unavailableSpaces
          : [];

        setUnavailableSpaces(unavailable);

        setSelectedSpaces((previous) =>
          previous.filter((code) => !unavailable.includes(code))
        );

        setAvailabilityError(
          unavailable.length
            ? `These spaces are unavailable: ${unavailable.join(", ")}. Please select different spaces.`
            : "The selected spaces are unavailable. Please select different spaces."
        );

        return;
      }

      // The frontend amount is for display only.
      // The backend must recalculate the final amount when creating
      // the Razorpay order.
      const bookingData = {
        spaceName: space.space,
        bookingDate: selectedDate,
        plan: selectedPlan,
        duration: Number(duration),
        selectedSpaces: [...selectedSpaces],
        pricePerUnit: selectedPricing.price,
        totalAmount,
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
          "Unable to check availability. Please try again."
      );
    } finally {
      setCheckingAvailability(false);
    }
  };

  // ---------------------------------------------
  // Missing workspace information
  // ---------------------------------------------

  if (!space) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Home size={28} className="text-gray-500" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            Space information not found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Please return to the homepage and select a space again.
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <ArrowLeft size={18} />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // Main UI
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">
              Book Your Space
            </h1>
            <p className="text-xs text-gray-500">
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
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                <div className="h-60 bg-gray-100 md:h-full">
                  {space.image ? (
                    <img
                      src={space.image}
                      alt={space.space}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Home size={60} className="text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Active Workspace
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900">
                        {space.space}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {availableSpaceCount}{" "}
                        {availableSpaceCount === 1 ? "space" : "spaces"}{" "}
                        available
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      <Users size={17} />
                      {getSpaceCapacity(space.space)}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {space.perHour != null && (
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Hourly</p>
                        <p className="mt-1 font-bold text-gray-900">
                          {formatPrice(space.perHour)}
                        </p>
                      </div>
                    )}

                    {space.perDay != null && (
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Daily</p>
                        <p className="mt-1 font-bold text-gray-900">
                          {formatPrice(space.perDay)}
                        </p>
                      </div>
                    )}

                    {space.perMonth != null && (
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Monthly</p>
                        <p className="mt-1 font-bold text-gray-900">
                          {formatPrice(space.perMonth)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 1: Booking plan */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  1. Select Booking Plan
                </h2>
                <p className="mt-1 text-sm text-gray-500">
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
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Check size={13} />
                          </div>
                        )}

                        <Icon
                          size={22}
                          className={
                            isSelected ? "text-blue-600" : "text-gray-500"
                          }
                        />

                        <p className="mt-3 font-semibold text-gray-900">
                          {option.label}
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-900">
                          {formatPrice(option.price)}
                        </p>

                        <p className="text-xs text-gray-500">
                          per {option.shortLabel.toLowerCase()}
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

            {/* Step 2: Date and duration */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  2. Select Date &amp; Duration
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select when and how long you need the space.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Booking Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="date"
                      min={getToday()}
                      value={selectedDate}
                      onChange={(event) => {
                        setSelectedDate(event.target.value);
                        clearAvailabilityResult();
                      }}
                      className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {selectedDate && (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected:{" "}
                      <span className="font-medium text-gray-700">
                        {formatDate(selectedDate)}
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Duration
                  </label>

                  <div className="flex h-[52px] items-center justify-between rounded-xl border border-gray-200 px-3">
                    <button
                      type="button"
                      onClick={decrementDuration}
                      disabled={
                        duration <= minDuration || checkingAvailability
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={17} />
                    </button>

                    <div className="text-center">
                      <p className="font-bold text-gray-900">{duration}</p>
                      <p className="text-[11px] text-gray-500">
                        {selectedPricing?.shortLabel || "unit"}
                        {duration > 1 ? "s" : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={incrementDuration}
                      disabled={
                        duration >= maxDuration || checkingAvailability
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={17} />
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {minDuration} - {maxDuration}{" "}
                    {selectedPricing?.shortLabel?.toLowerCase() || "units"}{" "}
                    available.
                  </p>
                </div>
              </div>
            </section>

            {/* Step 3: Space selection */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    3. Select Your Space
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose the space you want to book.
                  </p>
                </div>

                <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
                  {selectedSpaces.length} Selected
                </div>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-md border border-gray-300 bg-white" />
                  Available
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-md bg-blue-600" />
                  Selected
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-md bg-gray-300" />
                  Unavailable
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5 sm:p-8">
                <div className="mb-8 flex justify-center">
                  <div className="w-full max-w-md">
                    <div className="mb-2 h-2 rounded-full bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    <p className="text-center text-[10px] uppercase tracking-[0.25em] text-gray-400">
                      Workspace Front
                    </p>
                  </div>
                </div>

                {availableSpaces.length > 0 ? (
                  <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
                    {availableSpaces.map((spaceItem) => {
                      const seatCode = spaceItem.spaceCode;
                      const isSelected = selectedSpaces.includes(seatCode);

                      const isAvailable =
                        spaceItem.status === "Active" &&
                        !unavailableSpaces.includes(seatCode);

                      return (
                        <button
                          key={seatCode}
                          type="button"
                          disabled={!isAvailable || checkingAvailability}
                          onClick={() => toggleSpace(seatCode)}
                          aria-pressed={isSelected}
                          className={`relative flex aspect-square min-h-[58px] flex-col items-center justify-center rounded-xl border-2 text-xs font-semibold transition sm:min-h-[64px] ${
                            !isAvailable
                              ? "cursor-not-allowed border-gray-200 bg-gray-300 text-gray-500"
                              : isSelected
                                ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                                : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          {isSelected ? (
                            <Check size={18} />
                          ) : (
                            <span className="text-[11px]">{seatCode}</span>
                          )}

                          {isSelected && (
                            <span className="mt-0.5 text-[9px]">
                              Selected
                            </span>
                          )}

                          {!isAvailable && (
                            <span className="text-[9px]">Unavailable</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Home size={40} className="mx-auto text-gray-300" />
                    <p className="mt-4 text-sm font-medium text-gray-600">
                      No spaces available.
                    </p>
                  </div>
                )}

                {availableSpaces.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <div className="rounded-lg bg-gray-200 px-12 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                      Back
                    </div>
                  </div>
                )}
              </div>

              {selectedSpaces.length > 0 && (
                <div className="mt-5 rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Selected Spaces
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSpaces.map((spaceCode) => (
                      <span
                        key={spaceCode}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {spaceCode}
                      </span>
                    ))}
                  </div>
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
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-900 p-5 text-white">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Booking Summary
                </p>

                <h2 className="mt-1 text-xl font-bold">{space.space}</h2>

                <p className="mt-1 text-sm text-gray-400">
                  {availableSpaceCount}{" "}
                  {availableSpaceCount === 1 ? "space" : "spaces"} available
                </p>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatDate(selectedDate)}
                    </p>
                  </div>
                  <CalendarDays size={19} className="text-gray-400" />
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-4">
                  <div>
                    <p className="text-xs text-gray-500">Plan</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
                      {selectedPricing?.label || "-"}
                    </p>
                  </div>
                  <Clock3 size={19} className="text-gray-400" />
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-4">
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {duration} {selectedPricing?.shortLabel || "unit"}
                      {duration > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                    × {duration}
                  </div>
                </div>

                <div className="border-b border-gray-100 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Spaces</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedSpaces.length}
                    </p>
                  </div>

                  {selectedSpaces.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {selectedSpaces.map((spaceCode) => (
                        <span
                          key={spaceCode}
                          className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700"
                        >
                          {spaceCode}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">
                      No space selected
                    </p>
                  )}
                </div>

                <div className="py-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Price /{" "}
                      {selectedPricing?.shortLabel?.toLowerCase() || "unit"}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(selectedPricing?.price)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium text-gray-900">
                      × {duration}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Spaces</span>
                    <span className="font-medium text-gray-900">
                      × {selectedSpaces.length}
                    </span>
                  </div>

                  <div className="mt-5 flex items-end justify-between border-t border-gray-100 pt-5">
                    <div>
                      <p className="text-xs text-gray-500">Estimated Total</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {formatPrice(totalAmount)}
                      </p>
                    </div>

                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-600">
                      Before taxes
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={
                    !selectedSpaces.length ||
                    !selectedPricing ||
                    checkingAvailability
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
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

                {!selectedSpaces.length && (
                  <p className="mt-3 text-center text-xs text-gray-400">
                    Select at least one space to continue.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50">
                  <Check size={18} className="text-green-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Secure Booking
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
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