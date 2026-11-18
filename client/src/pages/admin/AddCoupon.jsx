import { useState, useCallback } from "react";
import {
  Ticket,
  CalendarDays,
  Users,
  Building2,
  Clock3,
  Percent,
  IndianRupee,
  Mail,
  RotateCcw,
  Plus,
  Sparkles,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axios.js";

const SPACE_TYPES = [
  "Workspace",
  "Team Leads Cubicle",
  "Senior Leads Cubicle",
  "Manager Cubicle",
  "Video Conferencing",
  "Executive Cabin",
  "CEO Cabin",
];

const USER_TYPES = [
  "All Users",
  "First Time Users",
  "Existing Users",
  "Selected Email Addresses",
];

const PACK_TYPES = [
  "Per Hour",
  "Per Day",
  "One Week",
  "Two Weeks",
  "Three Weeks",
  "Per Month",
];

const EMPTY_FORM = {
  couponCode: "",
  validFrom: "",
  validTo: "",
  userType: "First Time Users",
  selectedEmails: "",
  spaceType: "Workspace",
  discount: "",
  minimumPrice: "",
  maximumPrice: "",
  packType: "Per Month",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseEmails = (value) => [
  ...new Set(
    value
      .split(/[\n,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ),
];

const AddCoupon = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleInput = useCallback((event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "couponCode" ? value.toUpperCase().replace(/\s/g, "") : value,
    }));
  }, []);

  const validateForm = useCallback(() => {
    if (!form.couponCode.trim()) {
      toast.error("Coupon code is required");
      return false;
    }

    if (!/^[A-Z0-9_-]+$/.test(form.couponCode)) {
      toast.error("Coupon code can contain only letters, numbers, _ and -");
      return false;
    }

    if (!form.validFrom || !form.validTo) {
      toast.error("Please select coupon validity dates");
      return false;
    }

    if (new Date(form.validTo) < new Date(form.validFrom)) {
      toast.error("Valid To must be after or equal to Valid From");
      return false;
    }

    if (
      form.discount === "" ||
      Number(form.discount) < 1 ||
      Number(form.discount) > 100
    ) {
      toast.error("Discount must be between 1 and 100");
      return false;
    }

    if (form.minimumPrice === "" || Number(form.minimumPrice) < 0) {
      toast.error("Enter a valid minimum price");
      return false;
    }

    if (form.maximumPrice === "" || Number(form.maximumPrice) < 0) {
      toast.error("Enter a valid maximum price");
      return false;
    }

    if (Number(form.maximumPrice) < Number(form.minimumPrice)) {
      toast.error(
        "Maximum price must be greater than or equal to minimum price",
      );
      return false;
    }

    if (form.userType === "Selected Email Addresses") {
      const emails = parseEmails(form.selectedEmails);

      if (emails.length === 0) {
        toast.error("Please enter at least one email address");
        return false;
      }

      const invalidEmail = emails.find((email) => !EMAIL_REGEX.test(email));

      if (invalidEmail) {
        toast.error(`Invalid email address: ${invalidEmail}`);
        return false;
      }
    }

    return true;
  }, [form]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!validateForm()) return;

      setSaving(true);

      try {
        const payload = {
          couponCode: form.couponCode.trim(),
          validFrom: form.validFrom,
          validTo: form.validTo,
          userType: form.userType,
          selectedEmails:
            form.userType === "Selected Email Addresses"
              ? parseEmails(form.selectedEmails)
              : [],
          spaceType: form.spaceType,
          discount: Number(form.discount),
          minimumPrice: Number(form.minimumPrice),
          maximumPrice: Number(form.maximumPrice),
          packType: form.packType,
        };

        const response = await api.post("/coupon", payload);

        if (!response.data?.success) {
          toast.error(response.data?.message || "Failed to create coupon");
          return;
        }

        toast.success(response.data?.message || "Coupon created successfully");
        setForm(EMPTY_FORM);
      } catch (error) {
        console.error("Create coupon error:", error);
        toast.error(error.response?.data?.message || "Failed to create coupon");
      } finally {
        setSaving(false);
      }
    },
    [form, validateForm],
  );

  const handleReset = () => {
    if (saving) return;
    setForm(EMPTY_FORM);
  };

  const previewEmails =
    form.userType === "Selected Email Addresses"
      ? parseEmails(form.selectedEmails)
      : [];

  const inputClass =
    "w-full rounded-xl border border-blue-100 bg-[#F8FBFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  const selectClass =
    "w-full cursor-pointer appearance-none rounded-xl border border-blue-100 bg-[#F8FBFF] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

  const SectionHeading = ({ icon: Icon, title, description }) => (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={19} />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 shadow-lg shadow-blue-200/60 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50">
                <Sparkles size={14} />
                Oorza Admin Panel
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Create a Coupon
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
                Create promotional offers and manage discounts for workspace
                bookings.
              </p>
            </div>

            <div className="hidden h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:flex">
              <Ticket size={48} strokeWidth={1.4} className="text-white" />
            </div>
          </div>
        </div>

        {/* MAIN FORM CARD */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          {/* CARD HEADER */}
          <div className="flex flex-col gap-3 border-b border-blue-100 bg-[#F5F9FF] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Tag size={21} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Coupon Information</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Configure coupon details and booking eligibility
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600">
              Required fields *
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-8 p-5 sm:p-7">
              {/* BASIC INFORMATION */}
              <section>
                <SectionHeading
                  icon={Ticket}
                  title="Basic Information"
                  description="Set your coupon code and its validity period."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelClass}>Coupon Code *</label>
                    <div className="relative">
                      <Ticket
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
                      />
                      <input
                        type="text"
                        name="couponCode"
                        value={form.couponCode}
                        onChange={handleInput}
                        placeholder="e.g. WELCOME20"
                        maxLength={30}
                        disabled={saving}
                        className={`${inputClass} pl-10 font-semibold uppercase tracking-wider`}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Letters, numbers, hyphens and underscores.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Valid From *</label>
                    <div className="relative">
                      <CalendarDays
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
                      />
                      <input
                        type="date"
                        name="validFrom"
                        value={form.validFrom}
                        onChange={handleInput}
                        disabled={saving}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Valid To *</label>
                    <div className="relative">
                      <CalendarDays
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
                      />
                      <input
                        type="date"
                        name="validTo"
                        value={form.validTo}
                        min={form.validFrom || undefined}
                        onChange={handleInput}
                        disabled={saving}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-dashed border-blue-100" />

              {/* ELIGIBILITY */}
              <section>
                <SectionHeading
                  icon={Users}
                  title="Customer Eligibility"
                  description="Choose which customers can use this coupon."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>User Type *</label>
                    <div className="relative">
                      <select
                        name="userType"
                        value={form.userType}
                        onChange={handleInput}
                        disabled={saving}
                        className={selectClass}
                      >
                        {USER_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {form.userType === "Selected Email Addresses" && (
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Customer Email Addresses *
                      </label>
                      <div className="relative">
                        <Mail
                          size={17}
                          className="absolute left-4 top-4 text-blue-500"
                        />
                        <textarea
                          name="selectedEmails"
                          value={form.selectedEmails}
                          onChange={handleInput}
                          placeholder={
                            "customer1@gmail.com\ncustomer2@gmail.com\ncustomer3@gmail.com"
                          }
                          rows={4}
                          disabled={saving}
                          className={`${inputClass} resize-y pl-11`}
                        />
                      </div>

                      <div className="mt-2 flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          Separate addresses using commas, semicolons, or new
                          lines. Duplicates are removed.
                        </span>
                        <span className="font-medium text-blue-600">
                          {previewEmails.length} email(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className="border-t border-dashed border-blue-100" />

              {/* BOOKING CONDITIONS */}
              <section>
                <SectionHeading
                  icon={Building2}
                  title="Booking Conditions"
                  description="Select the workspace category and booking duration."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Space Type *</label>
                    <select
                      name="spaceType"
                      value={form.spaceType}
                      onChange={handleInput}
                      disabled={saving}
                      className={selectClass}
                    >
                      {SPACE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Pack Type *</label>
                    <div className="relative">
                      <Clock3
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
                      />
                      <select
                        name="packType"
                        value={form.packType}
                        onChange={handleInput}
                        disabled={saving}
                        className={`${selectClass} pl-10`}
                      >
                        {PACK_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-dashed border-blue-100" />

              {/* DISCOUNT CONFIGURATION */}
              <section>
                <SectionHeading
                  icon={Percent}
                  title="Discount Configuration"
                  description="Define the discount percentage and eligible booking price range."
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div>
                    <label className={labelClass}>Discount (%) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discount"
                        value={form.discount}
                        onChange={handleInput}
                        placeholder="20"
                        min="1"
                        max="100"
                        step="any"
                        disabled={saving}
                        className={`${inputClass} pr-11`}
                      />
                      <Percent
                        size={17}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Enter a value between 1 and 100.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Minimum Price (₹) *</label>
                    <div className="relative">
                      <IndianRupee
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
                      />
                      <input
                        type="number"
                        name="minimumPrice"
                        value={form.minimumPrice}
                        onChange={handleInput}
                        placeholder="500"
                        min="0"
                        step="any"
                        disabled={saving}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Maximum Price (₹) *</label>
                    <div className="relative">
                      <IndianRupee
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
                      />
                      <input
                        type="number"
                        name="maximumPrice"
                        value={form.maximumPrice}
                        onChange={handleInput}
                        placeholder="5000"
                        min="0"
                        step="any"
                        disabled={saving}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* COUPON PREVIEW */}
              <section className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-[#F0F7FF] via-white to-indigo-50">
                <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">
                        Coupon Preview
                      </h3>
                      <p className="text-xs text-slate-500">
                        Live preview of your offer
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    Preview
                  </span>
                </div>

                <div className="p-5">
                  <div className="mb-5 flex flex-col gap-4 rounded-xl border border-dashed border-blue-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Coupon Code
                      </p>
                      <p className="mt-1 break-all text-xl font-extrabold tracking-widest text-blue-700">
                        {form.couponCode || "YOURCOUPON"}
                      </p>
                    </div>

                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
                      <span className="text-xl font-extrabold">
                        {form.discount ? `${form.discount}%` : "0%"}
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider">
                        OFF
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-xs text-slate-400">Discount</p>
                      <p className="mt-1 font-bold text-blue-700">
                        {form.discount ? `${form.discount}%` : "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-xs text-slate-400">User Type</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                        {form.userType}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-xs text-slate-400">Space Type</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                        {form.spaceType}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-xs text-slate-400">Pack Type</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {form.packType}
                      </p>
                    </div>
                  </div>

                  {form.userType === "Selected Email Addresses" && (
                    <div className="mt-4 rounded-xl bg-white/80 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Mail size={15} className="text-blue-500" />
                        <p className="text-sm font-semibold text-slate-700">
                          Eligible Email Addresses ({previewEmails.length})
                        </p>
                      </div>
                      <p className="break-words text-sm leading-relaxed text-slate-600">
                        {previewEmails.join(", ") || "-"}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* FORM FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-blue-100 bg-[#F5F9FF] p-5 sm:flex-row sm:items-center sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Reset Form
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    Create Coupon
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* FOOTNOTE */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <CheckCircle2 size={14} className="text-blue-500" />
          Review the coupon details before creating the offer.
        </div>
      </div>
    </div>
  );
};

export default AddCoupon;
