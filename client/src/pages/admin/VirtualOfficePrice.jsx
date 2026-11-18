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
} from "lucide-react";
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
  }).format(amount || 0);

const VirtualOfficePrice = () => {
  const [prices, setPrices] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch all price plans
  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/virtual-office-price");

      setPrices(data.prices || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load virtual office prices.",
      );
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
      setError("Please enter valid plan details and pricing.");
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

        alert("Virtual office price updated successfully.");
      } else {
        await api.post("/virtual-office-price", payload);

        alert("Virtual office price added successfully.");
      }

      resetForm();
      await fetchPrices();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save virtual office price.",
      );
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Toggle status
  const handleToggleStatus = async (price) => {
    const action = price.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this price plan?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.patch(`/virtual-office-price/${price._id}/toggle-status`);

      alert(`Price plan ${action}d successfully.`);

      await fetchPrices();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update price status.");
    }
  };

  const activePlans = prices.filter((price) => price.isActive).length;
  const inactivePlans = prices.filter((price) => !price.isActive).length;

  const inputClass =
    "w-full rounded-xl border border-blue-100 bg-[#F8FBFF] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* PAGE HEADER */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 shadow-lg shadow-blue-200/60 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50">
                <Sparkles size={14} />
                Oorza Admin Panel
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Virtual Office Prices
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
                Configure virtual office plans, manage pricing, and calculate
                GST-inclusive customer prices.
              </p>
            </div>

            <div className="hidden h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:flex">
              <Building2 size={48} strokeWidth={1.4} className="text-white" />
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Plans
                </p>
                <h2 className="mt-3 text-3xl font-bold text-slate-800">
                  {prices.length}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  All configured plans
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Plans
                </p>
                <h2 className="mt-3 text-3xl font-bold text-emerald-600">
                  {activePlans}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Available for customers
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Inactive Plans
                </p>
                <h2 className="mt-3 text-3xl font-bold text-slate-600">
                  {inactivePlans}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Currently unavailable
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <XCircle size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ADD / EDIT FORM */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          {/* FORM HEADER */}
          <div className="flex flex-col gap-3 border-b border-blue-100 bg-[#F5F9FF] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                {editingId ? <Pencil size={21} /> : <Plus size={22} />}
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  {editingId ? "Edit Price Plan" : "Add Price Plan"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {editingId
                    ? "Update your virtual office pricing details."
                    : "Create a new virtual office pricing configuration."}
                </p>
              </div>
            </div>

            {editingId && (
              <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                Editing Plan
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-7 p-5 sm:p-7">
              {/* PLAN DETAILS */}
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Plan Details</h3>
                    <p className="text-xs text-slate-500">
                      Enter the basic information for this plan.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Plan Name *</label>
                    <div className="relative">
                      <Tag
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
                      />
                      <input
                        name="planName"
                        value={formData.planName}
                        onChange={handleChange}
                        placeholder="e.g. Virtual Office - Basic"
                        required
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>
                    <div className="relative">
                      <FileText
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
                      />
                      <input
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter plan description"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-dashed border-blue-100" />

              {/* PRICING DETAILS */}
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Pricing Configuration
                    </h3>
                    <p className="text-xs text-slate-500">
                      Set the base price and applicable GST rate.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Base Price (₹) *</label>
                    <div className="relative">
                      <IndianRupee
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500"
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
                        className={`${inputClass} pl-10`}
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
                        className={`${inputClass} pr-11`}
                      />
                      <Percent
                        size={17}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      GST rate must be between 0% and 100%.
                    </p>
                  </div>
                </div>
              </section>

              {/* LIVE PRICE CALCULATION */}
              <section className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-[#F0F7FF] via-white to-indigo-50">
                <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Calculator size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800">
                      Price Calculation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Automatically calculated based on your inputs.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-3">
                  <div className="rounded-xl border border-blue-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Wallet size={15} className="text-blue-500" />
                      Base Price
                    </div>
                    <p className="mt-3 text-xl font-bold text-slate-800">
                      {formatCurrency(basePrice)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Receipt size={15} className="text-blue-500" />
                      GST ({gstRate}%)
                    </div>
                    <p className="mt-3 text-xl font-bold text-slate-800">
                      {formatCurrency(gstAmount)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-600 p-4 shadow-md shadow-blue-100">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
                      <IndianRupee size={15} />
                      Total Customer Price
                    </div>
                    <p className="mt-3 text-xl font-bold text-white">
                      {formatCurrency(totalPrice)}
                    </p>
                    <p className="mt-1 text-[11px] text-blue-100">
                      Including GST
                    </p>
                  </div>
                </div>

                <div className="mx-5 mb-5 flex items-start gap-2 rounded-lg bg-white/80 p-3 text-xs text-slate-500">
                  <CheckCircle2
                    size={15}
                    className="mt-0.5 shrink-0 text-blue-500"
                  />
                  The total price is calculated by adding GST to the base price.
                </div>
              </section>
            </div>

            {/* FORM FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-blue-100 bg-[#F5F9FF] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="text-xs text-slate-400">
                Fields marked with * are required.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    <>
                      <Pencil size={16} />
                      Update Price Plan
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Add Price Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* PRICE LIST */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          {/* TABLE HEADER */}
          <div className="flex flex-col gap-3 border-b border-blue-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Virtual Office Price List
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  View and manage all configured pricing plans.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:self-auto">
              <Tag size={14} />
              {prices.length} Plans
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading price plans...
              </p>
            </div>
          ) : prices.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Building2 size={32} strokeWidth={1.5} />
              </div>

              <h3 className="font-bold text-slate-800">
                No price plans available
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add your first virtual office price plan to get started.
              </p>
            </div>
          ) : (
            /* TABLE */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-[#F0F7FF] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-bold">Plan</th>
                    <th className="px-5 py-4 font-bold">Base Price</th>
                    <th className="px-5 py-4 font-bold">GST Rate</th>
                    <th className="px-5 py-4 font-bold">GST Amount</th>
                    <th className="px-5 py-4 font-bold">Total Price</th>
                    <th className="px-5 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-blue-50">
                  {prices.map((price) => (
                    <tr
                      key={price._id}
                      className="transition hover:bg-[#F5F9FF]"
                    >
                      {/* PLAN */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Building2 size={19} />
                          </div>

                          <div className="max-w-[220px]">
                            <p className="font-bold text-slate-800">
                              {price.planName}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {price.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* BASE PRICE */}
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {formatCurrency(price.basePrice)}
                      </td>

                      {/* GST RATE */}
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {price.gstRate}%
                        </span>
                      </td>

                      {/* GST AMOUNT */}
                      <td className="px-5 py-4 text-slate-600">
                        {formatCurrency(price.gstAmount)}
                      </td>

                      {/* TOTAL PRICE */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-blue-700">
                          {formatCurrency(price.totalPrice)}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            price.isActive
                              ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              price.isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {price.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(price)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(price)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              price.isActive
                                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {price.isActive ? (
                              <>
                                <PowerOff size={13} />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power size={13} />
                                Activate
                              </>
                            )}
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
            <div className="flex flex-col gap-2 border-t border-blue-100 bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Total{" "}
                <span className="font-semibold text-slate-700">
                  {prices.length}
                </span>{" "}
                pricing plan(s)
              </p>

              <p className="text-xs text-slate-400">
                Manage plan details and availability using the actions in each
                row.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualOfficePrice;
