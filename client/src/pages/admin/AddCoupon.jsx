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
import { useNavigate } from "react-router-dom";

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

  const navigate = useNavigate();

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
        navigate("/admin/coupon-list");
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
    "w-full rounded-xl border border-[#E9DED0] bg-[#FBF3ED] px-3.5 py-2.5 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99A8D] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10 disabled:cursor-not-allowed disabled:opacity-60";

  const labelClass = "mb-1.5 block text-xs font-semibold text-[#6F5D52]";

  const selectClass =
    "w-full cursor-pointer appearance-none rounded-xl border border-[#E9DED0] bg-[#FBF3ED] px-3.5 py-2.5 text-sm text-[#382B26] outline-none transition focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10 disabled:cursor-not-allowed disabled:opacity-60";

  const SectionHeading = ({ icon: Icon, title, description }) => (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-bold text-[#382B26]">{title}</h3>
        <p className="mt-0.5 text-xs text-[#8F8175]">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-3 sm:p-4 lg:p-5">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}

        <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#C9826C] p-4 text-white shadow-md shadow-[#71392F]/10 sm:p-5">
          <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-40 h-36 w-36 rounded-full bg-white/10" />

          <div className="relative z-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                <Sparkles size={13} />
                Oorza Admin Panel
              </div>

              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Create a Coupon
              </h1>

              <p className="mt-1.5 max-w-xl text-sm leading-5 text-white/80">
                Create promotional offers and manage discounts for workspace
                bookings.
              </p>
            </div>

            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 sm:flex">
              <Ticket size={34} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* MAIN FORM CARD */}

        <div className="overflow-hidden rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
          {/* CARD HEADER */}

          <div className="flex flex-col gap-2 border-b border-[#E9DED0] bg-[#FBF3ED] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                <Tag size={19} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-[#382B26]">
                  Coupon Information
                </h2>
                <p className="mt-0.5 text-xs text-[#8F8175]">
                  Configure coupon details and booking eligibility
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full border border-[#E9DED0] bg-[#FFFDFA] px-3 py-1 text-xs font-semibold text-[#A95643]">
              Required fields *
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5 p-4 sm:p-5">
              {/* BASIC INFORMATION */}

              <section>
                <SectionHeading
                  icon={Ticket}
                  title="Basic Information"
                  description="Set your coupon code and its validity period."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelClass}>Coupon Code *</label>

                    <div className="relative">
                      <Ticket
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A95643]"
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

                    <p className="mt-1.5 text-[11px] text-[#A99A8D]">
                      Letters, numbers, hyphens and underscores.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Valid From *</label>

                    <div className="relative">
                      <CalendarDays
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A95643]"
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
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A95643]"
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

              <div className="border-t border-dashed border-[#E9DED0]" />

              {/* ELIGIBILITY */}

              <section>
                <SectionHeading
                  icon={Users}
                  title="Customer Eligibility"
                  description="Choose which customers can use this coupon."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>User Type *</label>

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

                  {form.userType === "Selected Email Addresses" && (
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Customer Email Addresses *
                      </label>

                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3.5 top-3.5 text-[#A95643]"
                        />

                        <textarea
                          name="selectedEmails"
                          value={form.selectedEmails}
                          onChange={handleInput}
                          placeholder={
                            "customer1@gmail.com\ncustomer2@gmail.com\ncustomer3@gmail.com"
                          }
                          rows={3}
                          disabled={saving}
                          className={`${inputClass} resize-y pl-10`}
                        />
                      </div>

                      <div className="mt-1.5 flex flex-col gap-1 text-[11px] text-[#A99A8D] sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          Separate addresses using commas, semicolons, or new
                          lines. Duplicates are removed.
                        </span>

                        <span className="font-semibold text-[#A95643]">
                          {previewEmails.length} email(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className="border-t border-dashed border-[#E9DED0]" />

              {/* BOOKING CONDITIONS */}

              <section>
                <SectionHeading
                  icon={Building2}
                  title="Booking Conditions"
                  description="Select the workspace category and booking duration."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A95643]"
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

              <div className="border-t border-dashed border-[#E9DED0]" />

              {/* DISCOUNT CONFIGURATION */}

              <section>
                <SectionHeading
                  icon={Percent}
                  title="Discount Configuration"
                  description="Define the discount percentage and eligible booking price range."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                        className={`${inputClass} pr-10`}
                      />

                      <Percent
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A95643]"
                      />
                    </div>

                    <p className="mt-1.5 text-[11px] text-[#A99A8D]">
                      Enter a value between 1 and 100.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Minimum Price (₹) *</label>

                    <div className="relative">
                      <IndianRupee
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A95643]"
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
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A95643]"
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

              <section className="overflow-hidden rounded-2xl border border-[#E9DED0] bg-gradient-to-br from-[#F8EDE6] via-[#FFFDFA] to-[#FBF3ED]">
                <div className="flex items-center justify-between gap-3 border-b border-[#E9DED0] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1DED3] text-[#A95643]">
                      <Sparkles size={17} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#382B26]">
                        Coupon Preview
                      </h3>
                      <p className="text-[11px] text-[#8F8175]">
                        Live preview of your offer
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-[#F1DED3] px-3 py-1 text-[11px] font-semibold text-[#71392F]">
                    Preview
                  </span>
                </div>

                <div className="p-3.5 sm:p-4">
                  <div className="mb-3 flex flex-col gap-3 rounded-xl border border-dashed border-[#C9826C] bg-[#FFFDFA] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8F8175]">
                        Coupon Code
                      </p>

                      <p className="mt-1 break-all text-lg font-extrabold tracking-widest text-[#71392F]">
                        {form.couponCode || "YOURCOUPON"}
                      </p>
                    </div>

                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#71392F] to-[#A95643] text-white shadow-sm">
                      <span className="text-lg font-extrabold">
                        {form.discount ? `${form.discount}%` : "0%"}
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider">
                        OFF
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA]/90 p-3">
                      <p className="text-[11px] text-[#8F8175]">Discount</p>
                      <p className="mt-1 font-bold text-[#A95643]">
                        {form.discount ? `${form.discount}%` : "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA]/90 p-3">
                      <p className="text-[11px] text-[#8F8175]">User Type</p>
                      <p className="mt-1 break-words text-xs font-semibold text-[#382B26]">
                        {form.userType}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA]/90 p-3">
                      <p className="text-[11px] text-[#8F8175]">Space Type</p>
                      <p className="mt-1 break-words text-xs font-semibold text-[#382B26]">
                        {form.spaceType}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA]/90 p-3">
                      <p className="text-[11px] text-[#8F8175]">Pack Type</p>
                      <p className="mt-1 break-words text-xs font-semibold text-[#382B26]">
                        {form.packType}
                      </p>
                    </div>
                  </div>

                  {form.userType === "Selected Email Addresses" && (
                    <div className="mt-3 rounded-xl border border-[#E9DED0] bg-[#FFFDFA]/90 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Mail size={14} className="text-[#A95643]" />

                        <p className="text-xs font-semibold text-[#382B26]">
                          Eligible Email Addresses ({previewEmails.length})
                        </p>
                      </div>

                      <p className="break-words text-xs leading-relaxed text-[#6F5D52]">
                        {previewEmails.join(", ") || "-"}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* FORM FOOTER */}

            <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-[#E9DED0] bg-[#FBF3ED] p-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-5">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E9DED0] bg-[#FFFDFA] px-4 py-2.5 text-sm font-semibold text-[#6F5D52] transition hover:border-[#C9826C] hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Reset Form
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#A95643] to-[#71392F] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-[#71392F] hover:to-[#5D2D25] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Coupon
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* FOOTNOTE */}

        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-[#8F8175]">
          <CheckCircle2 size={13} className="text-emerald-600" />
          Review the coupon details before creating the offer.
        </div>
      </div>
    </div>
  );
};

export default AddCoupon;
