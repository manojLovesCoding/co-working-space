import React, { useEffect, useState } from "react";
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Virtual Office Prices
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage virtual office pricing, GST and total customer prices.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Add / Edit Price Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Price Plan" : "Add Price Plan"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingId
                  ? "Update virtual office pricing details."
                  : "Create a new virtual office price plan."}
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Plan Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Plan Name *
                </label>

                <input
                  name="planName"
                  value={formData.planName}
                  onChange={handleChange}
                  placeholder="e.g. Virtual Office - Basic"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Base Price */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Base Price (₹) *
                </label>

                <input
                  name="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={handleChange}
                  placeholder="Enter base price"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* GST */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  GST Rate (%)
                </label>

                <input
                  name="gstRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.gstRate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter plan description"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Price Calculation */}
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="mb-4 font-semibold text-slate-800">
                Price Calculation
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Base Price</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatCurrency(basePrice)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">GST ({gstRate}%)</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatCurrency(gstAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Total Price</p>
                  <p className="mt-1 text-xl font-bold text-blue-700">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Price"
                    : "Add Price Plan"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Price List */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Virtual Office Price List
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                All configured virtual office price plans.
              </p>
            </div>

            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {prices.length} Plans
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading price plans...
            </div>
          ) : prices.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                ₹
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No price plans available
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add your first virtual office price plan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Plan</th>
                    <th className="px-5 py-4">Base Price</th>
                    <th className="px-5 py-4">GST Rate</th>
                    <th className="px-5 py-4">GST Amount</th>
                    <th className="px-5 py-4">Total Price</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {prices.map((price) => (
                    <tr key={price._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {price.planName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {price.description || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatCurrency(price.basePrice)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {price.gstRate}%
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatCurrency(price.gstAmount)}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-900">
                        {formatCurrency(price.totalPrice)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            price.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {price.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(price)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(price)}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                              price.isActive
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {price.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualOfficePrice;
