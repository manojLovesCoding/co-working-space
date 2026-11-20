
import React, { useEffect, useState } from "react";
import {
  Building2,
  IndianRupee,
  Percent,
  FileText,
  Plus,
  Pencil,
  Power,
  PowerOff,
  RefreshCw,
  Calculator,
  Wallet,
  Receipt,
  CheckCircle2,
  XCircle,
  Sparkles,
  Tag,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axios.js";

const initialForm = {
  planName: "",
  description: "",
  basePrice: "",
  gstRate: 18,
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const VirtualOfficePrice = () => {
  const [prices, setPrices] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState("");

  // Fetch all price plans
  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/virtual-office-price");

      setPrices(data.prices || []);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to load virtual office prices.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) setError("");
  };

  // Live GST calculation
  const basePrice = Number(formData.basePrice) || 0;
  const gstRate = Number(formData.gstRate) || 0;

  const gstAmount = Number(((basePrice * gstRate) / 100).toFixed(2));
  const totalPrice = Number((basePrice + gstAmount).toFixed(2));

  // Reset form
  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setError("");
  };

  // Add or update price
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.planName.trim() ||
      formData.basePrice === "" ||
      !Number.isFinite(Number(formData.basePrice)) ||
      Number(formData.basePrice) < 0 ||
      formData.gstRate === "" ||
      !Number.isFinite(Number(formData.gstRate)) ||
      Number(formData.gstRate) < 0 ||
      Number(formData.gstRate) > 100
    ) {
      const message = "Please enter valid plan details and pricing.";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        planName: formData.planName.trim(),
        description: formData.description.trim(),
        basePrice: Number(formData.basePrice),
        gstRate: Number(formData.gstRate),
      };

      if (editingId) {
        await api.put(`/virtual-office-price/${editingId}`, payload);
        toast.success("Virtual office price updated successfully.");
      } else {
        await api.post("/virtual-office-price", payload);
        toast.success("Virtual office price added successfully.");
      }

      resetForm();
      await fetchPrices();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to save virtual office price.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Edit price
  const handleEdit = (price) => {
    setEditingId(price._id);

    setFormData({
      planName: price.planName || "",
      description: price.description || "",
      basePrice: String(price.basePrice),
      gstRate: String(price.gstRate),
    });

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Perform status update after confirmation
  const confirmToggleStatus = async (price) => {
    const action = price.isActive ? "deactivate" : "activate";

    try {
      setTogglingId(price._id);
      setError("");

      await api.patch(`/virtual-office-price/${price._id}/toggle-status`);

      toast.success(
        `Price plan ${action}d successfully.`,
      );

      await fetchPrices();
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to update price status.";

      setError(message);
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };

  // Toast-based confirmation instead of window.confirm
  const handleToggleStatus = (price) => {
    if (togglingId) return;

    const action = price.isActive ? "Deactivate" : "Activate";

    toast(
      ({ closeToast }) => (
        <div className="w-full">
          <div className="flex items-start gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
              {price.isActive ? (
                <PowerOff size={17} />
              ) : (
                <Power size={17} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#382B26]">
                {action} Price Plan?
              </p>
              <p className="mt-1 text-xs leading-5 text-[#8F8175]">
                Are you sure you want to {action.toLowerCase()}{" "}
                <span className="font-semibold text-[#71392F]">
                  {price.planName}
                </span>
                ?
              </p>
            </div>

            <button
              type="button"
              onClick={closeToast}
              className="text-[#A99B8D] transition hover:text-[#71392F]"
              aria-label="Close confirmation"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeToast}
              className="rounded-lg border border-[#E9DED0] px-3 py-2 text-xs font-semibold text-[#6F6259] transition hover:bg-[#FBF3ED]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                closeToast();
                confirmToggleStatus(price);
              }}
              className="rounded-lg bg-[#A95643] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#8E4939]"
            >
              Yes, {action}
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        className: "!w-[350px] !max-w-[calc(100vw-32px)] !rounded-xl !border !border-[#E9DED0] !bg-[#FFFDFA] !p-3 !shadow-xl",
      },
    );
  };

  const activePlans = prices.filter((price) => price.isActive).length;
  const inactivePlans = prices.filter((price) => !price.isActive).length;

  const inputClass =
    "w-full rounded-lg border border-[#E9DED0] bg-[#FBF7F1] px-3 py-2.5 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8D] focus:border-[#C9826C] focus:bg-white focus:ring-2 focus:ring-[#A95643]/10";

  const labelClass = "mb-1.5 block text-sm font-semibold text-[#6F6259]";

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-3 sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1500px] space-y-4">

        {/* PAGE HEADER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] via-[#8E4939] to-[#A95643] p-5 shadow-md shadow-[#71392F]/10 sm:p-6">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[30px] border-white/10" />

          <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-[#FAE9DE]">
                <Sparkles size={13} />
                Oorza Admin Panel
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Virtual Office Prices
              </h1>

              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#F5DDD2]">
                Configure virtual office plans, manage pricing, and calculate
                GST-inclusive customer prices.
              </p>
            </div>

            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 sm:flex">
              <Building2 size={34} strokeWidth={1.5} className="text-white" />
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#8F8175]">
                  Total Plans
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#71392F]">
                  {prices.length}
                </h2>
                <p className="mt-1 text-[11px] text-[#A99B8D]">
                  All configured plans
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                <Building2 size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#8F8175]">
                  Active Plans
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#527C61]">
                  {activePlans}
                </h2>
                <p className="mt-1 text-[11px] text-[#A99B8D]">
                  Available for customers
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0E7] text-[#527C61]">
                <CheckCircle2 size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#8F8175]">
                  Inactive Plans
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#8F8175]">
                  {inactivePlans}
                </h2>
                <p className="mt-1 text-[11px] text-[#A99B8D]">
                  Currently unavailable
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2EEE8] text-[#8F8175]">
                <XCircle size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <XCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ADD / EDIT FORM */}
        <div className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">

          {/* FORM HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9DED0] bg-[#FBF3ED] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0DDD3] text-[#A95643]">
                {editingId ? <Pencil size={18} /> : <Plus size={20} />}
              </div>

              <div>
                <h2 className="text-sm font-bold text-[#382B26]">
                  {editingId ? "Edit Price Plan" : "Add Price Plan"}
                </h2>

                <p className="mt-0.5 text-[11px] text-[#8F8175]">
                  {editingId
                    ? "Update your virtual office pricing details."
                    : "Create a new virtual office pricing configuration."}
                </p>
              </div>
            </div>

            {editingId && (
              <span className="rounded-full border border-[#E3C5B7] bg-[#F8EDE6] px-3 py-1 text-[11px] font-semibold text-[#71392F]">
                Editing Plan
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5 p-4 sm:p-5">

              {/* PLAN DETAILS */}
              <section>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#382B26]">
                      Plan Details
                    </h3>
                    <p className="text-[11px] text-[#8F8175]">
                      Basic information for this plan.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Plan Name *</label>
                    <div className="relative">
                      <Tag
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A95643]"
                      />
                      <input
                        name="planName"
                        value={formData.planName}
                        onChange={handleChange}
                        placeholder="e.g. Virtual Office - Basic"
                        required
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>
                    <div className="relative">
                      <FileText
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A95643]"
                      />
                      <input
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter plan description"
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-dashed border-[#E9DED0]" />

              {/* PRICING DETAILS */}
              <section>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#382B26]">
                      Pricing Configuration
                    </h3>
                    <p className="text-[11px] text-[#8F8175]">
                      Set the base price and applicable GST rate.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Base Price (₹) *</label>
                    <div className="relative">
                      <IndianRupee
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A95643]"
                      />
                      <input
                        name="basePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.basePrice}
                        onChange={handleChange}
                        placeholder="Enter base price"
                        required
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>GST Rate (%) *</label>
                    <div className="relative">
                      <input
                        name="gstRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.gstRate}
                        onChange={handleChange}
                        required
                        className={`${inputClass} pr-10`}
                      />
                      <Percent
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A95643]"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#A99B8D]">
                      GST rate must be between 0% and 100%.
                    </p>
                  </div>
                </div>
              </section>

              {/* LIVE PRICE CALCULATION */}
              <section className="overflow-hidden rounded-xl border border-[#E3C5B7] bg-[#FBF3ED]">
                <div className="flex items-center gap-2.5 border-b border-[#E9DED0] px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0DDD3] text-[#A95643]">
                    <Calculator size={17} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#382B26]">
                      Price Calculation
                    </h3>
                    <p className="text-[11px] text-[#8F8175]">
                      Automatically calculated from your inputs.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2.5 p-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-[#E9DED0] bg-[#FFFDFA] p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#8F8175]">
                      <Wallet size={14} className="text-[#A95643]" />
                      Base Price
                    </div>
                    <p className="mt-2 text-lg font-bold text-[#382B26]">
                      {formatCurrency(basePrice)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#E9DED0] bg-[#FFFDFA] p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#8F8175]">
                      <Receipt size={14} className="text-[#A95643]" />
                      GST ({gstRate}%)
                    </div>
                    <p className="mt-2 text-lg font-bold text-[#382B26]">
                      {formatCurrency(gstAmount)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#A95643] bg-[#71392F] p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#F5DDD2]">
                      <IndianRupee size={14} />
                      Total Customer Price
                    </div>
                    <p className="mt-2 text-lg font-bold text-white">
                      {formatCurrency(totalPrice)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#F5DDD2]">
                      Including GST
                    </p>
                  </div>
                </div>

                <div className="mx-3 mb-3 flex items-start gap-2 rounded-lg bg-white/80 p-2.5 text-[11px] text-[#8F8175]">
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 shrink-0 text-[#527C61]"
                  />
                  Total price includes GST added to the base price.
                </div>
              </section>
            </div>

            {/* FORM FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#E9DED0] bg-[#FBF7F1] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="text-[11px] text-[#A99B8D]">
                Fields marked with * are required.
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E9DED0] bg-white px-4 py-2.5 text-xs font-semibold text-[#6F6259] transition hover:bg-[#FBF3ED] disabled:opacity-50"
                  >
                    <RotateCcw size={14} />
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A95643] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8E4939] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    <>
                      <Pencil size={14} />
                      Update Price Plan
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Price Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* PRICE LIST */}
        <div className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">

          {/* TABLE HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9DED0] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                <Building2 size={18} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-[#382B26]">
                  Virtual Office Price List
                </h2>
                <p className="mt-0.5 text-[11px] text-[#8F8175]">
                  Manage all configured pricing plans.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-[#F8EDE6] px-3 py-1.5 text-[11px] font-semibold text-[#71392F]">
              <Tag size={13} />
              {prices.length} Plans
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#E9DED0] border-t-[#A95643]" />
              <p className="mt-3 text-xs font-medium text-[#8F8175]">
                Loading price plans...
              </p>
            </div>
          ) : prices.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                <Building2 size={28} strokeWidth={1.5} />
              </div>

              <h3 className="text-sm font-bold text-[#382B26]">
                No price plans available
              </h3>

              <p className="mt-1.5 text-xs text-[#8F8175]">
                Add your first virtual office price plan to get started.
              </p>
            </div>
          ) : (
            /* TABLE */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-[#FBF3ED] text-[11px] uppercase tracking-wide text-[#8F8175]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Plan</th>
                    <th className="px-4 py-3 font-bold">Base Price</th>
                    <th className="px-4 py-3 font-bold">GST Rate</th>
                    <th className="px-4 py-3 font-bold">GST Amount</th>
                    <th className="px-4 py-3 font-bold">Total Price</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0E7DC]">
                  {prices.map((price) => (
                    <tr
                      key={price._id}
                      className="transition hover:bg-[#FBF7F1]"
                    >
                      {/* PLAN */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                            <Building2 size={17} />
                          </div>

                          <div className="max-w-[220px]">
                            <p className="text-sm font-bold text-[#382B26]">
                              {price.planName}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-[#A99B8D]">
                              {price.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-medium text-[#6F6259]">
                        {formatCurrency(price.basePrice)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-md bg-[#F8EDE6] px-2.5 py-1 text-xs font-semibold text-[#71392F]">
                          {price.gstRate}%
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-[#6F6259]">
                        {formatCurrency(price.gstAmount)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-bold text-[#71392F]">
                          {formatCurrency(price.totalPrice)}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            price.isActive
                              ? "border border-[#D5E3D2] bg-[#EAF0E7] text-[#527C61]"
                              : "border border-[#E9DED0] bg-[#F2EEE8] text-[#8F8175]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              price.isActive
                                ? "bg-[#527C61]"
                                : "bg-[#A99B8D]"
                            }`}
                          />
                          {price.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(price)}
                            disabled={Boolean(togglingId)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#F8EDE6] px-2.5 py-2 text-[11px] font-semibold text-[#71392F] transition hover:bg-[#F0DDD3] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(price)}
                            disabled={Boolean(togglingId)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              price.isActive
                                ? "bg-[#F2EEE8] text-[#6F6259] hover:bg-[#E9DED0]"
                                : "bg-[#EAF0E7] text-[#527C61] hover:bg-[#DCE8D8]"
                            }`}
                          >
                            {togglingId === price._id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : price.isActive ? (
                              <PowerOff size={12} />
                            ) : (
                              <Power size={12} />
                            )}

                            {togglingId === price._id
                              ? "Updating..."
                              : price.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE FOOTER */}
          {!loading && prices.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-[#E9DED0] bg-[#FBF7F1] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-[#8F8175]">
                Total{" "}
                <span className="font-semibold text-[#382B26]">
                  {prices.length}
                </span>{" "}
                pricing plan(s)
              </p>

              <p className="text-[11px] text-[#A99B8D]">
                Manage plan details and availability using the row actions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualOfficePrice;
