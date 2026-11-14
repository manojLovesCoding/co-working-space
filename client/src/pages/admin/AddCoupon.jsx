import { useState, useCallback } from "react";
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
      .filter(Boolean)
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
        name === "couponCode"
          ? value.toUpperCase().replace(/\s/g, "")
          : value,
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
        "Maximum price must be greater than or equal to minimum price"
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

        toast.success(
          response.data?.message || "Coupon created successfully"
        );
        setForm(EMPTY_FORM);
      } catch (error) {
        console.error("Create coupon error:", error);
        toast.error(
          error.response?.data?.message || "Failed to create coupon"
        );
      } finally {
        setSaving(false);
      }
    },
    [form, validateForm]
  );

  const handleReset = () => {
    if (saving) return;
    setForm(EMPTY_FORM);
  };

  const previewEmails =
    form.userType === "Selected Email Addresses"
      ? parseEmails(form.selectedEmails)
      : [];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Add Coupon</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create discount coupons for space bookings
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="border-b bg-orange-50 p-5">
          <h2 className="font-semibold text-gray-800">Coupon Information</h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter the coupon details and applicable booking conditions.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
            {/* COUPON CODE */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Coupon Code *
              </label>
              <input
                type="text"
                name="couponCode"
                value={form.couponCode}
                onChange={handleInput}
                placeholder="e.g. WELCOME20"
                maxLength={30}
                disabled={saving}
                className="w-full rounded border border-orange-400 px-3 py-2 uppercase outline-none focus:ring-2 focus:ring-orange-200"
              />
              <p className="mt-1 text-xs text-gray-400">
                Letters, numbers, hyphens and underscores.
              </p>
            </div>

            {/* VALID FROM */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Valid From *
              </label>
              <input
                type="date"
                name="validFrom"
                value={form.validFrom}
                onChange={handleInput}
                disabled={saving}
                className="w-full rounded border border-orange-400 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* VALID TO */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Valid To *
              </label>
              <input
                type="date"
                name="validTo"
                value={form.validTo}
                min={form.validFrom || undefined}
                onChange={handleInput}
                disabled={saving}
                className="w-full rounded border border-orange-400 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* USER TYPE */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                User Type *
              </label>
              <select
                name="userType"
                value={form.userType}
                onChange={handleInput}
                disabled={saving}
                className="w-full rounded border border-orange-400 px-3 py-2 outline-none"
              >
                {USER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* SELECTED EMAIL ADDRESSES */}
            {form.userType === "Selected Email Addresses" && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Customer Email Addresses *
                </label>
                <textarea
                  name="selectedEmails"
                  value={form.selectedEmails}
                  onChange={handleInput}
                  placeholder={
                    "customer1@gmail.com\ncustomer2@gmail.com\ncustomer3@gmail.com"
                  }
                  rows={4}
                  disabled={saving}
                  className="w-full rounded border border-orange-400 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter multiple email addresses separated by commas,
                  semicolons, or new lines. Duplicate addresses are removed.
                </p>
              </div>
            )}

            {/* SPACE TYPE */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Space Type *
              </label>
              <select
                name="spaceType"
                value={form.spaceType}
                onChange={handleInput}
                disabled={saving}
                className="w-full rounded border border-orange-400 px-3 py-2 outline-none"
              >
                {SPACE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* PACK TYPE */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Pack Type *
              </label>
              <select
                name="packType"
                value={form.packType}
                onChange={handleInput}
                disabled={saving}
                className="w-full rounded border border-orange-400 px-3 py-2 outline-none"
              >
                {PACK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* DISCOUNT */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Discount (%) *
              </label>
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
                  className="w-full rounded border border-orange-400 px-3 py-2 pr-10 outline-none"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>

            {/* MINIMUM PRICE */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Minimum Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                <input
                  type="number"
                  name="minimumPrice"
                  value={form.minimumPrice}
                  onChange={handleInput}
                  placeholder="500"
                  min="0"
                  step="any"
                  disabled={saving}
                  className="w-full rounded border border-orange-400 py-2 pl-8 pr-3 outline-none"
                />
              </div>
            </div>

            {/* MAXIMUM PRICE */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Maximum Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                <input
                  type="number"
                  name="maximumPrice"
                  value={form.maximumPrice}
                  onChange={handleInput}
                  placeholder="5000"
                  min="0"
                  step="any"
                  disabled={saving}
                  className="w-full rounded border border-orange-400 py-2 pl-8 pr-3 outline-none"
                />
              </div>
            </div>
          </div>

          {/* COUPON PREVIEW */}
          <div className="mx-5 mb-5 rounded-lg border border-dashed border-orange-300 bg-orange-50 p-4">
            <h3 className="mb-3 font-semibold text-gray-800">Coupon Preview</h3>

            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-gray-500">Coupon</p>
                <p className="font-semibold text-orange-600">
                  {form.couponCode || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Discount</p>
                <p className="font-semibold">
                  {form.discount ? `${form.discount}%` : "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">User Type</p>
                <p className="font-medium">{form.userType}</p>
              </div>

              <div>
                <p className="text-gray-500">Pack Type</p>
                <p className="font-medium">{form.packType}</p>
              </div>

              {form.userType === "Selected Email Addresses" && (
                <div className="col-span-2 md:col-span-4">
                  <p className="text-gray-500">
                    Eligible Email Addresses ({previewEmails.length})
                  </p>
                  <p className="break-words font-medium">
                    {previewEmails.join(", ") || "-"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col justify-end gap-3 border-t bg-gray-50 p-5 sm:flex-row">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="rounded border border-gray-300 px-5 py-2 hover:bg-white disabled:opacity-50"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded bg-orange-500 px-6 py-2 text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCoupon;
