
import { useEffect, useState } from "react";
import {
  Building2, Users, UserRound, BriefcaseBusiness, Video, Crown,
  Sparkles, IndianRupee, Clock, CalendarDays, CalendarRange,
  CheckCircle2, ImagePlus, Upload, X, Loader2, ShieldCheck,
  Armchair, Info,
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

const SPACE_ICONS = {
  Workspace: Users,
  "Team Leads Cubicle": UserRound,
  "Senior Leads Cubicle": BriefcaseBusiness,
  "Manager Cubicle": Building2,
  "Video Conferencing": Video,
  "Executive Cabin": Crown,
  "CEO Cabin": Sparkles,
};

const DEFAULT_PRICES = {
  Workspace: {
    per_hour: "100", per_day: "500", one_week: "4800",
    two_weeks: "5760", three_weeks: "7200", per_month: "4000",
    min_duration: "1", min_duration_desc: "1 Day",
    max_duration: "30", max_duration_desc: "30 Day",
  },
  "Team Leads Cubicle": {
    per_hour: "120", per_day: "600", one_week: "5760",
    two_weeks: "6912", three_weeks: "8640", per_month: "4500",
    min_duration: "1", min_duration_desc: "1 Day",
    max_duration: "30", max_duration_desc: "30 Day",
  },
  "Senior Leads Cubicle": {
    per_hour: "120", per_day: "600", one_week: "5760",
    two_weeks: "6912", three_weeks: "8640", per_month: "4500",
    min_duration: "1", min_duration_desc: "1 Day",
    max_duration: "30", max_duration_desc: "30 Day",
  },
  "Manager Cubicle": {
    per_hour: "120", per_day: "750", one_week: "7200",
    two_weeks: "8640", three_weeks: "10800", per_month: "6000",
    min_duration: "1", min_duration_desc: "1 Day",
    max_duration: "30", max_duration_desc: "30 Day",
  },
  "Video Conferencing": {
    per_hour: "100", per_day: "", one_week: "",
    two_weeks: "", three_weeks: "", per_month: "",
    min_duration: "1", min_duration_desc: "1 Hour",
    max_duration: "8", max_duration_desc: "8 Hour",
  },
  "Executive Cabin": {
    per_hour: "200", per_day: "1000", one_week: "",
    two_weeks: "", three_weeks: "", per_month: "15000",
    min_duration: "1", min_duration_desc: "1 Hour",
    max_duration: "8", max_duration_desc: "8 Hour",
  },
  "CEO Cabin": {
    per_hour: "500", per_day: "4000", one_week: "",
    two_weeks: "", three_weeks: "", per_month: "50000",
    min_duration: "1", min_duration_desc: "1 Hour",
    max_duration: "8", max_duration_desc: "8 Hour",
  },
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

const inputClass =
  "w-full rounded-xl border border-[#E9DED0] bg-[#FBF3ED] px-3 py-2.5 text-sm text-[#382B26] outline-none focus:border-[#A95643] focus:ring-2 focus:ring-[#A95643]/10 disabled:opacity-60";

const AddSpaceMaster = () => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedInfo = SPACE_GROUPS[form.space];
  const SelectedIcon = SPACE_ICONS[form.space] || Building2;

  const handleInput = (e) => {
    const { name, value } = e.target;

    if (name === "space") {
      const defaults = DEFAULT_PRICES[value] || {};

      setForm((prev) => {
        const updated = { ...prev, space: value };

        Object.keys(defaults).forEach((key) => {
          if (!updated[key] && defaults[key] !== "") {
            updated[key] = defaults[key];
          }
        });

        return updated;
      });
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5 MB");
      e.target.value = "";
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);

    const input = document.getElementById("space-image");
    if (input) input.value = "";
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const validate = () => {
    if (!form.space) {
      toast.error("Select Space Type");
      return false;
    }

    if (!form.per_hour && !form.per_day && !form.per_month) {
      toast.error("Provide at least one rate");
      return false;
    }

    const numericFields = [
      "per_hour", "per_day", "one_week", "two_weeks",
      "three_weeks", "per_month", "min_duration", "max_duration",
    ];

    for (const field of numericFields) {
      const value = form[field];

      if (
        value !== "" &&
        (!Number.isFinite(Number(value)) || Number(value) < 0)
      ) {
        toast.error(`${field.replaceAll("_", " ")} must be a valid non-negative number`);
        return false;
      }
    }

    if (!image) {
      toast.error("Please upload a space image");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("space", form.space);

      const fields = {
        perHour: form.per_hour,
        perDay: form.per_day,
        oneWeek: form.one_week,
        twoWeeks: form.two_weeks,
        threeWeeks: form.three_weeks,
        perMonth: form.per_month,
        minDuration: form.min_duration,
        maxDuration: form.max_duration,
      };

      Object.entries(fields).forEach(([key, value]) => {
        if (value !== "") formData.append(key, Number(value));
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

      toast.success(
        `Space ${response.data.space?.spaceCode || ""} added successfully!`
      );

      setForm(DEFAULT_FORM);
      if (preview) URL.revokeObjectURL(preview);
      setImage(null);
      setPreview(null);
      e.target.reset();
    } catch (error) {
      console.error("Add space error:", error);
      toast.error(error.response?.data?.message || "Failed to add space");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (name, label, type = "number", placeholder = "Enter value") => (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#382B26]">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleInput}
        disabled={loading}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "any" : undefined}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );

  const renderPrice = (name, label) => (
    <div>
      {renderInput(name, label, "number", "0.00")}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-3 sm:p-5">
      <div className="mx-auto max-w-6xl space-y-4">

        {/* HEADER */}
        <div className="rounded-2xl bg-gradient-to-r from-[#71392F] to-[#C9826C] p-5 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-3">
              <Building2 size={25} />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/75">
                OORZA SPACE MANAGEMENT
              </p>
              <h1 className="text-2xl font-bold">Add New Space</h1>
              <p className="mt-1 text-sm text-white/80">
                Configure space details, pricing and availability.
              </p>
            </div>
          </div>
        </div>

        {/* SPACE CATEGORIES */}
        <section className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-[#382B26]">Select Space Category</h2>
            <span className="text-xs text-[#8F8175]">7 Categories</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(SPACE_GROUPS).map(([name, details]) => {
              const Icon = SPACE_ICONS[name];
              const selected = form.space === name;

              return (
                <button
                  key={name}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleInput({ target: { name: "space", value: name } })
                  }
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-[#A95643] bg-[#F8EDE6]"
                      : "border-[#E9DED0] bg-[#FBF3ED] hover:border-[#C9826C]"
                  }`}
                >
                  <Icon size={19} className="shrink-0 text-[#A95643]" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#382B26]">
                      {name}
                    </p>
                    <p className="mt-1 text-[10px] text-[#8F8175]">
                      {details.prefix} · Max {details.max}
                    </p>
                  </div>
                  {selected && (
                    <CheckCircle2 size={15} className="ml-auto shrink-0 text-[#A95643]" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* SPACE INFORMATION */}
          <section className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-[#382B26]">
              <Armchair size={20} className="text-[#A95643]" />
              Space Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#382B26]">
                  Space Type *
                </label>
                <select
                  name="space"
                  value={form.space}
                  onChange={handleInput}
                  disabled={loading}
                  required
                  className={inputClass}
                >
                  <option value="">Select Space Type</option>
                  {Object.keys(SPACE_GROUPS).map((space) => (
                    <option key={space} value={space}>{space}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#382B26]">
                  Space Code
                </label>
                <input
                  readOnly
                  value={form.space ? "Generated automatically" : ""}
                  placeholder="Select space type first"
                  className={`${inputClass} bg-[#F0EAE1]`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#382B26]">
                  Status
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

            {selectedInfo && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F8EDE6] p-3 text-xs text-[#71392F]">
                <Info size={16} />
                {form.space} · Prefix: {selectedInfo.prefix} · Maximum capacity: {selectedInfo.max}
              </div>
            )}
          </section>

          {/* PRICING */}
          <section className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-[#382B26]">
              <IndianRupee size={20} className="text-[#A95643]" />
              Pricing Configuration
            </h2>

            <h3 className="mb-3 text-sm font-semibold text-[#8F8175]">
              Standard Rates
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {renderPrice("per_hour", "Per Hour (₹)")}
              {renderPrice("per_day", "Per Day (₹)")}
              {renderPrice("per_month", "Per Month (₹)")}
            </div>

            <div className="my-5 border-t border-[#F0E7DC]" />

            <h3 className="mb-3 text-sm font-semibold text-[#8F8175]">
              Weekly Packages (Optional)
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              {renderPrice("one_week", "1 Week (₹)")}
              {renderPrice("two_weeks", "2 Weeks (₹)")}
              {renderPrice("three_weeks", "3 Weeks (₹)")}
            </div>
          </section>

          {/* BOOKING DURATION */}
          <section className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-[#382B26]">
              <CalendarRange size={20} className="text-[#A95643]" />
              Booking Duration
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-3 rounded-xl bg-[#FBF3ED] p-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#71392F]">
                  <Clock size={17} /> Minimum Duration
                </h3>
                {renderInput("min_duration", "Duration Value")}
                {renderInput("min_duration_desc", "Description", "text", "e.g. 1 Hour")}
              </div>

              <div className="space-y-3 rounded-xl bg-[#FBF3ED] p-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#71392F]">
                  <CalendarDays size={17} /> Maximum Duration
                </h3>
                {renderInput("max_duration", "Duration Value")}
                {renderInput("max_duration_desc", "Description", "text", "e.g. 30 Days")}
              </div>
            </div>
          </section>

          {/* IMAGE UPLOAD */}
          <section className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-[#382B26]">
              <ImagePlus size={20} className="text-[#A95643]" />
              Space Image *
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="space-image"
                  className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E9DED0] bg-[#FBF3ED] p-4 text-center transition hover:border-[#A95643]"
                >
                  {preview ? (
                    <>
                      <CheckCircle2 size={30} className="text-green-600" />
                      <p className="mt-2 text-sm font-bold text-[#382B26]">
                        Image Selected
                      </p>
                      <p className="mt-1 max-w-full break-all text-xs text-[#8F8175]">
                        {image?.name}
                      </p>
                      <p className="mt-2 text-xs text-[#A95643]">
                        Click to replace
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload size={30} className="text-[#A95643]" />
                      <p className="mt-3 text-sm font-bold text-[#382B26]">
                        Upload Space Image
                      </p>
                      <p className="mt-1 text-xs text-[#8F8175]">
                        JPG, PNG, WEBP or GIF · Max 5 MB
                      </p>
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
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#382B26]">
                    Image Preview
                  </p>
                  {preview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={loading}
                      className="flex items-center gap-1 text-xs font-semibold text-red-600"
                    >
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>

                <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FBF3ED] p-3">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Space Preview"
                      className="max-h-52 w-full rounded-lg object-contain"
                    />
                  ) : (
                    <div className="text-center text-[#A99A8D]">
                      <ImagePlus size={30} className="mx-auto" />
                      <p className="mt-2 text-xs">Preview will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SUBMIT */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-4 sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-[#8F8175]">
              <ShieldCheck size={19} className="text-[#527C61]" />
              Review your details before creating the space.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#A95643] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#71392F] disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Add Space
                </>
              )}
            </button>
          </div>
        </form>

        <div className="py-2 text-center text-xs text-[#8F8175]">
          Oorza Space Administration
        </div>
      </div>
    </div>
  );
};

export default AddSpaceMaster;
