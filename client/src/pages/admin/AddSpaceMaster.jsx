import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  BriefcaseBusiness,
  Video,
  Crown,
  Users,
  UserRound,
  Camera,
  ImagePlus,
  Upload,
  IndianRupee,
  Clock,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Sparkles,
  X,
  Loader2,
  Info,
  Armchair,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios.js";

export const SPACE_GROUPS = {
  Workspace: { prefix: "WS", max: 45 },
  "Team Leads Cubicle": { prefix: "TLC", max: 4 },
  "Senior Leads Cubicle": { prefix: "SLC", max: 3 },
  "Manager Cubicle": { prefix: "MC", max: 2 },
  "Video Conferencing": { prefix: "VC", max: 1 },
  "Executive Cabin": { prefix: "EC", max: 2 },
  "CEO Cabin": { prefix: "CD", max: 1 },
};

const FIELD_LABELS = {
  per_hour: "Per Hour",
  per_day: "Per Day",
  per_month: "Per Month",
  one_week: "One Week",
  two_weeks: "Two Weeks",
  three_weeks: "Three Weeks",
  min_duration: "Min Duration",
  min_duration_desc: "Min Duration (text)",
  max_duration: "Max Duration",
  max_duration_desc: "Max Duration (text)",
};

const DEFAULT_FORM = {
  space: "",
  per_hour: "",
  per_day: "",
  one_week: "",
  two_weeks: "",
  three_weeks: "",
  per_month: "",
  min_duration: "",
  min_duration_desc: "",
  max_duration: "",
  max_duration_desc: "",
  status: "Active",
};

const DEFAULT_PRICES = {
  Workspace: {
    per_hour: "100",
    per_day: "500",
    one_week: "4800",
    two_weeks: "5760",
    three_weeks: "7200",
    per_month: "4000",
    min_duration: "1",
    min_duration_desc: "1 Day",
    max_duration: "30",
    max_duration_desc: "30 Day",
  },

  "Team Leads Cubicle": {
    per_hour: "120",
    per_day: "600",
    one_week: "5760",
    two_weeks: "6912",
    three_weeks: "8640",
    per_month: "4500",
    min_duration: "1",
    min_duration_desc: "1 Day",
    max_duration: "30",
    max_duration_desc: "30 Day",
  },

  "Senior Leads Cubicle": {
    per_hour: "120",
    per_day: "600",
    one_week: "5760",
    two_weeks: "6912",
    three_weeks: "8640",
    per_month: "4500",
    min_duration: "1",
    min_duration_desc: "1 Day",
    max_duration: "30",
    max_duration_desc: "30 Day",
  },

  "Manager Cubicle": {
    per_hour: "120",
    per_day: "750",
    one_week: "7200",
    two_weeks: "8640",
    three_weeks: "10800",
    per_month: "6000",
    min_duration: "1",
    min_duration_desc: "1 Day",
    max_duration: "30",
    max_duration_desc: "30 Day",
  },

  "Video Conferencing": {
    per_hour: "100",
    per_day: "",
    one_week: "",
    two_weeks: "",
    three_weeks: "",
    per_month: "",
    min_duration: "1",
    min_duration_desc: "1 Hour",
    max_duration: "8",
    max_duration_desc: "8 Hour",
  },

  "Executive Cabin": {
    per_hour: "200",
    per_day: "1000",
    one_week: "",
    two_weeks: "",
    three_weeks: "",
    per_month: "15000",
    min_duration: "1",
    min_duration_desc: "1 Hour",
    max_duration: "8",
    max_duration_desc: "8 Hour",
  },

  "CEO Cabin": {
    per_hour: "500",
    per_day: "4000",
    one_week: "",
    two_weeks: "",
    three_weeks: "",
    per_month: "50000",
    min_duration: "1",
    min_duration_desc: "1 Hour",
    max_duration: "8",
    max_duration_desc: "8 Hour",
  },
};

const SPACE_ICONS = {
  Workspace: Users,
  "Team Leads Cubicle": UserRound,
  "Senior Leads Cubicle": BriefcaseBusiness,
  "Manager Cubicle": Building2,
  "Video Conferencing": Video,
  "Executive Cabin": Crown,
  "CEO Cabin": Sparkles,
};

const AddSpaceMaster = () => {
  const [form, setForm] = useState(DEFAULT_FORM);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-blue-100 bg-[#F8FBFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60";

  const selectedSpaceInfo = form.space ? SPACE_GROUPS[form.space] : null;

  /*
   * Handle form inputs.
   * Existing manually entered values are preserved
   * when switching space types.
   */
  const handleInput = useCallback((event) => {
    const { name, value } = event.target;

    if (name === "space") {
      const defaults = DEFAULT_PRICES[value] || {};

      setForm((previous) => {
        const updated = {
          ...previous,
          space: value,
        };

        Object.keys(defaults).forEach((key) => {
          if (!updated[key] && defaults[key] !== "") {
            updated[key] = defaults[key];
          }
        });

        return updated;
      });

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }, []);

  /*
   * Handle image selection.
   */
  const handleImageChange = useCallback((event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image");
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Image size must be less than 5 MB");
      event.target.value = "";
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  /*
   * Remove selected image.
   */
  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview(null);

    const fileInput = document.getElementById("space-image");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  /*
   * Cleanup preview URL.
   */
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /*
   * Validate numeric values.
   */
  const isPositiveNumber = (value) => {
    return value !== "" && !Number.isNaN(Number(value)) && Number(value) >= 0;
  };

  /*
   * Validate form.
   */
  const validate = useCallback(() => {
    if (!form.space) {
      toast.error("Select Space Type");
      return false;
    }

    if (!form.per_hour && !form.per_day && !form.per_month) {
      toast.error("Provide at least one rate");
      return false;
    }

    const numericFields = [
      "per_hour",
      "per_day",
      "one_week",
      "two_weeks",
      "three_weeks",
      "per_month",
      "min_duration",
      "max_duration",
    ];

    const invalidField = numericFields.find(
      (field) => form[field] !== "" && !isPositiveNumber(form[field]),
    );

    if (invalidField) {
      toast.error(
        `${FIELD_LABELS[invalidField]} must be a valid non-negative number`,
      );

      return false;
    }

    if (!image) {
      toast.error("Please upload a space image");
      return false;
    }

    return true;
  }, [form, image]);

  /*
   * Add space to backend.
   */
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!validate()) return;

      setLoading(true);

      try {
        const formData = new FormData();

        formData.append("space", form.space);

        const numericFields = {
          perHour: form.per_hour,
          perDay: form.per_day,
          oneWeek: form.one_week,
          twoWeeks: form.two_weeks,
          threeWeeks: form.three_weeks,
          perMonth: form.per_month,
          minDuration: form.min_duration,
          maxDuration: form.max_duration,
        };

        Object.entries(numericFields).forEach(([key, value]) => {
          if (value !== "") {
            formData.append(key, Number(value));
          }
        });

        formData.append("minDurationDesc", form.min_duration_desc);
        formData.append("maxDurationDesc", form.max_duration_desc);
        formData.append("status", form.status);
        formData.append("image", image);

        const response = await api.post("/space", formData);

        if (!response.data?.success) {
          toast.error(response.data?.message || "Failed to add space");
          return;
        }

        const createdSpace = response.data.space;

        toast.success(
          `Space ${createdSpace?.spaceCode || ""} added successfully!`,
        );

        setForm({ ...DEFAULT_FORM });

        if (preview) {
          URL.revokeObjectURL(preview);
        }

        setImage(null);
        setPreview(null);

        event.target.reset();
      } catch (error) {
        console.error("Add space error:", error);

        toast.error(error.response?.data?.message || "Failed to add space");
      } finally {
        setLoading(false);
      }
    },
    [form, image, preview, validate],
  );

  const selectedIcon = form.space ? SPACE_ICONS[form.space] : Building2;

  const SelectedIcon = selectedIcon;

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-blue-200/60 sm:p-8">
          <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full border-[40px] border-white/10" />
          <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-50">
                <Sparkles size={14} />
                OORZA SPACE MANAGEMENT
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Add New Space
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Configure your workspace, set booking prices, and upload images
                to make your space available for booking.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <Layers3 size={25} />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {Object.keys(SPACE_GROUPS).length}
                </p>
                <p className="text-xs font-medium text-blue-100">
                  Space Categories
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SPACE CATEGORY OVERVIEW */}
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Space Categories</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Available category types and their maximum configured capacity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(SPACE_GROUPS).map(([name, details]) => {
              const Icon = SPACE_ICONS[name];
              const isSelected = form.space === name;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    handleInput({
                      target: {
                        name: "space",
                        value: name,
                      },
                    })
                  }
                  disabled={loading}
                  className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-blue-400 bg-blue-50 ring-2 ring-blue-500/10"
                      : "border-blue-100 bg-[#F8FBFF] hover:border-blue-300 hover:bg-blue-50/70"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-white text-blue-600 shadow-sm"
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Prefix: {details.prefix} · Max: {details.max}
                    </p>
                  </div>

                  {isSelected && (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-blue-600"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
            <p className="text-xs leading-5 text-slate-600">
              Select a category above or use the space type field below.
              Capacity values are configured limits, not live counts of existing
              spaces.
            </p>
          </div>
        </section>

        {/* MAIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SPACE INFORMATION */}
          <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-blue-50 px-5 py-5 sm:px-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Armchair size={22} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Space Information</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose the space category and configure its details
                </p>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                {/* SPACE TYPE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Space Type <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <SelectedIcon
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"
                    />
                    <select
                      name="space"
                      value={form.space}
                      onChange={handleInput}
                      disabled={loading}
                      required
                      className={`${inputClass} appearance-none pl-11 pr-10`}
                    >
                      <option value="">Select Space Type</option>
                      {Object.keys(SPACE_GROUPS).map((space) => (
                        <option key={space} value={space}>
                          {space}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      ▼
                    </span>
                  </div>

                  {selectedSpaceInfo && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">
                      <CheckCircle2 size={16} className="text-blue-600" />
                      <p className="text-xs font-medium text-blue-700">
                        Selected: {form.space} · Code prefix:{" "}
                        {selectedSpaceInfo.prefix} · Configured maximum:{" "}
                        {selectedSpaceInfo.max}
                      </p>
                    </div>
                  )}
                </div>

                {/* SPACE CODE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Space Code
                  </label>
                  <input
                    value={
                      form.space ? "Generated automatically by backend" : ""
                    }
                    readOnly
                    className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`}
                    placeholder="Select a space type first"
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    The unique space code will be assigned when the space is
                    created.
                  </p>
                </div>

                {/* STATUS */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Space Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInput}
                    disabled={loading}
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* SELECTED SPACE CARD */}
              <div className="flex flex-col justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <SelectedIcon size={30} />
                </div>

                <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  Selected Category
                </p>

                <h3 className="mt-2 text-center text-lg font-bold text-slate-800">
                  {form.space || "No Space Selected"}
                </h3>

                <p className="mt-2 text-center text-xs leading-5 text-slate-500">
                  {form.space
                    ? `This space belongs to the ${form.space} category.`
                    : "Choose a category to configure your new space."}
                </p>

                {selectedSpaceInfo && (
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase text-slate-400">
                        Prefix
                      </p>
                      <p className="mt-1 font-bold text-blue-700">
                        {selectedSpaceInfo.prefix}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase text-slate-400">
                        Max Units
                      </p>
                      <p className="mt-1 font-bold text-blue-700">
                        {selectedSpaceInfo.max}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-blue-50 px-5 py-5 sm:px-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <IndianRupee size={21} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">
                  Pricing Configuration
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Set rental prices for different booking durations
                </p>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {/* HOURLY / DAILY / MONTHLY */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Clock size={17} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Standard Rates
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      name: "per_hour",
                      label: "Per Hour",
                      hint: "Hourly booking rate",
                      icon: Clock,
                    },
                    {
                      name: "per_day",
                      label: "Per Day",
                      hint: "Daily booking rate",
                      icon: CalendarDays,
                    },
                    {
                      name: "per_month",
                      label: "Per Month",
                      hint: "Monthly booking rate",
                      icon: CalendarRange,
                    },
                  ].map((field) => {
                    const Icon = field.icon;

                    return (
                      <div
                        key={field.name}
                        className="rounded-2xl border border-blue-100 bg-[#F8FBFF] p-4"
                      >
                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Icon size={16} className="text-blue-500" />
                          {field.label}
                        </label>

                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            name={field.name}
                            value={form[field.name]}
                            onChange={handleInput}
                            inputMode="decimal"
                            disabled={loading}
                            placeholder="0.00"
                            className={`${inputClass} bg-white pl-8`}
                          />
                        </div>

                        <p className="mt-2 text-[11px] text-slate-400">
                          {field.hint}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* WEEKLY RATES */}
              <div className="border-t border-blue-50 pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarRange size={17} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Weekly Packages
                  </h3>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">
                    Optional
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: "one_week", label: "1 Week", days: "7 days" },
                    { name: "two_weeks", label: "2 Weeks", days: "14 days" },
                    { name: "three_weeks", label: "3 Weeks", days: "21 days" },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        {field.label}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleInput}
                          inputMode="decimal"
                          disabled={loading}
                          placeholder="0.00"
                          className={`${inputClass} pl-8`}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400">
                        {field.days} package
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* DURATION */}
          <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-blue-50 px-5 py-5 sm:px-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CalendarRange size={21} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Booking Duration</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Define minimum and maximum booking periods
                </p>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              {/* MINIMUM */}
              <div className="rounded-2xl border border-blue-100 bg-[#F8FBFF] p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Minimum Duration
                    </h3>
                    <p className="text-xs text-slate-400">
                      Shortest allowed booking
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Duration Value
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      name="min_duration"
                      value={form.min_duration}
                      onChange={handleInput}
                      disabled={loading}
                      placeholder="e.g. 1"
                      className={`${inputClass} bg-white`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Duration Description
                    </label>
                    <input
                      type="text"
                      name="min_duration_desc"
                      value={form.min_duration_desc}
                      onChange={handleInput}
                      disabled={loading}
                      placeholder="e.g. 1 Hour"
                      className={`${inputClass} bg-white`}
                    />
                  </div>
                </div>
              </div>

              {/* MAXIMUM */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Maximum Duration
                    </h3>
                    <p className="text-xs text-slate-400">
                      Longest allowed booking
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Duration Value
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      name="max_duration"
                      value={form.max_duration}
                      onChange={handleInput}
                      disabled={loading}
                      placeholder="e.g. 30"
                      className={`${inputClass} bg-white`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Duration Description
                    </label>
                    <input
                      type="text"
                      name="max_duration_desc"
                      value={form.max_duration_desc}
                      onChange={handleInput}
                      disabled={loading}
                      placeholder="e.g. 30 Days"
                      className={`${inputClass} bg-white`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* IMAGE UPLOAD AND STATUS */}
          <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-blue-50 px-5 py-5 sm:px-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Camera size={21} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Space Image</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Upload a photo to showcase your workspace
                </p>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              {/* UPLOAD AREA */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Upload Image <span className="text-red-500">*</span>
                </label>

                <label
                  htmlFor="space-image"
                  className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    preview
                      ? "border-blue-200 bg-blue-50/40"
                      : "border-blue-200 bg-[#F8FBFF] hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {preview ? (
                    <div className="flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                        <CheckCircle2 size={28} />
                      </div>
                      <p className="mt-3 text-sm font-bold text-slate-800">
                        Image Selected
                      </p>
                      <p className="mt-1 max-w-full break-all text-xs text-slate-500">
                        {image?.name}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-blue-600">
                        Click to replace image
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                        <ImagePlus size={27} />
                      </div>
                      <p className="mt-4 text-sm font-bold text-slate-800">
                        Choose an image
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Click to browse your files
                      </p>
                      <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white">
                        <Upload size={14} />
                        Browse Files
                      </span>
                    </>
                  )}

                  <input
                    id="space-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="hidden"
                  />
                </label>

                <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-400">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  JPG, PNG, WEBP or GIF. Maximum file size 5 MB.
                </div>
              </div>

              {/* PREVIEW */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Image Preview
                  </label>

                  {preview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={loading}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      <X size={14} />
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-[#F3F8FF] p-3">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Space Preview"
                      className="max-h-[260px] w-full rounded-xl object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-300 shadow-sm">
                        <ImagePlus size={27} />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-500">
                        Preview will appear here
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Select an image to see how it looks
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SUBMIT */}
          <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Ready to create your space?
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Review the details and upload an image before saving.
                    Required fields are marked with an asterisk.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading & Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Add Space
                  </>
                )}
              </button>
            </div>
          </section>
        </form>

        {/* LOADING OVERLAY */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-800">
                Creating Your Space
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Uploading the image and saving your space details. Please
                wait...
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
          <ShieldCheck size={14} />
          Oorza Space Administration
        </div>
      </div>
    </div>
  );
};

export default AddSpaceMaster;
