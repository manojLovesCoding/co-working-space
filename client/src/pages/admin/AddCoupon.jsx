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

const USER_TYPES = ["All Users", "First Time Users", "Existing Users"];

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
  spaceType: "Workspace",
  discount: "",
  minimumPrice: "",
  maximumPrice: "",
  packType: "Per Month",
};

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
      toast.error("Valid To must be after Valid From");
      return false;
    }

    if (
      !form.discount ||
      Number(form.discount) <= 0 ||
      Number(form.discount) > 100
    ) {
      toast.error("Discount must be between 1 and 100");
      return false;
    }

    if (form.minimumPrice === "" || Number(form.minimumPrice) < 0) {
      toast.error("Enter a valid minimum price");
      return false;
    }

    if (form.maximumPrice === "" || Number(form.maximumPrice) <= 0) {
      toast.error("Enter a valid maximum price");
      return false;
    }

    if (Number(form.maximumPrice) < Number(form.minimumPrice)) {
      toast.error(
        "Maximum price must be greater than or equal to minimum price",
      );
      return false;
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

  return (
    <div className="p-6">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Add Coupon</h1>

          <p className="text-sm text-gray-500 mt-1">
            Create discount coupons for space bookings
          </p>
        </div>
      </div>

      {/* FORM */}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-5 border-b bg-orange-50">
          <h2 className="font-semibold text-gray-800">Coupon Information</h2>

          <p className="text-sm text-gray-500 mt-1">
            Enter the coupon details and applicable booking conditions.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* COUPON CODE */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full border border-orange-400 rounded px-3 py-2 uppercase outline-none focus:ring-2 focus:ring-orange-200"
              />

              <p className="text-xs text-gray-400 mt-1">
                Letters, numbers, hyphens and underscores.
              </p>
            </div>

            {/* VALID FROM */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid From *
              </label>

              <input
                type="date"
                name="validFrom"
                value={form.validFrom}
                onChange={handleInput}
                disabled={saving}
                className="w-full border border-orange-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* VALID TO */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid To *
              </label>

              <input
                type="date"
                name="validTo"
                value={form.validTo}
                min={form.validFrom || undefined}
                onChange={handleInput}
                disabled={saving}
                className="w-full border border-orange-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* USER TYPE */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Type *
              </label>

              <select
                name="userType"
                value={form.userType}
                onChange={handleInput}
                disabled={saving}
                className="w-full border border-orange-400 rounded px-3 py-2 outline-none"
              >
                {USER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* SPACE TYPE */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Space Type *
              </label>

              <select
                name="spaceType"
                value={form.spaceType}
                onChange={handleInput}
                disabled={saving}
                className="w-full border border-orange-400 rounded px-3 py-2 outline-none"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pack Type *
              </label>

              <select
                name="packType"
                value={form.packType}
                onChange={handleInput}
                disabled={saving}
                className="w-full border border-orange-400 rounded px-3 py-2 outline-none"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-orange-400 rounded px-3 py-2 pr-10 outline-none"
                />

                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>

            {/* MINIMUM PRICE */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-orange-400 rounded pl-8 pr-3 py-2 outline-none"
                />
              </div>
            </div>

            {/* MAXIMUM PRICE */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-orange-400 rounded pl-8 pr-3 py-2 outline-none"
                />
              </div>
            </div>
          </div>

          {/* PREVIEW */}

          <div className="mx-5 mb-5 p-4 border border-dashed border-orange-300 rounded-lg bg-orange-50">
            <h3 className="font-semibold text-gray-800 mb-3">Coupon Preview</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex flex-col sm:flex-row justify-end gap-3 p-5 border-t bg-gray-50">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-5 py-2 border border-gray-300 rounded hover:bg-white disabled:opacity-50"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-60"
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
