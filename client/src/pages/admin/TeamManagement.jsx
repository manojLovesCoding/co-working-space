import React, { useEffect, useState } from "react";
import api from "../../api/axios.js";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  designation: "",
};

const TeamManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);

  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);

      const { data } = await api.get("/auth/users");

      const allUsers = Array.isArray(data) ? data : data.users || [];

      const customerUsers = allUsers.filter(
        (user) => user.role === "customer" && user.isActive !== false,
      );

      setCustomers(customerUsers);

      if (customerUsers.length > 0) {
        setSelectedCustomer((current) => {
          if (
            current &&
            customerUsers.some((customer) => customer._id === current)
          ) {
            return current;
          }

          return customerUsers[0]._id;
        });
      } else {
        setSelectedCustomer("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load customers.");
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Fetch selected customer's team
  const fetchTeamMembers = async () => {
    if (!selectedCustomer) {
      setTeamMembers([]);
      return;
    }

    try {
      setLoadingTeam(true);
      setError("");

      const { data } = await api.get(`/team/customer/${selectedCustomer}`);

      setTeamMembers(data.teamMembers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load team members.");
      setTeamMembers([]);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [selectedCustomer]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  // Add or update team member
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      setError("Please select a customer.");
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim()
    ) {
      setError("Name, email and phone are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        designation: formData.designation.trim(),
      };

      if (editingId) {
        await api.put(`/team/${editingId}`, payload);
        alert("Team member updated successfully.");
      } else {
        await api.post("/team", {
          ...payload,
          customerId: selectedCustomer,
        });

        alert("Team member added successfully.");
      }

      resetForm();
      await fetchTeamMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save team member.");
    } finally {
      setSaving(false);
    }
  };

  // Edit team member
  const handleEdit = (member) => {
    setEditingId(member._id);

    setFormData({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      designation: member.designation || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Deactivate team member
  const handleDeactivate = async (memberId) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this team member?",
    );

    if (!confirmed) return;

    try {
      await api.patch(`/team/${memberId}/deactivate`);

      alert("Team member deactivated successfully.");

      if (editingId === memberId) {
        resetForm();
      }

      await fetchTeamMembers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to deactivate team member.",
      );
    }
  };

  const currentCustomer = customers.find(
    (customer) => customer._id === selectedCustomer,
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Team Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage team members belonging to your customers.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Customer Selection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Select Customer
          </label>

          {loadingCustomers ? (
            <p className="text-sm text-slate-500">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="text-sm text-slate-500">
              No active customer accounts found. Create a customer account
              first.
            </p>
          ) : (
            <select
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                resetForm();
              }}
              className="w-full max-w-xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          )}

          {currentCustomer && (
            <div className="mt-4 rounded-xl bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Selected Customer
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {currentCustomer.name}
              </p>

              <p className="text-sm text-slate-600">{currentCustomer.email}</p>
            </div>
          )}
        </div>

        {selectedCustomer && (
          <>
            {/* Add / Edit Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingId ? "Edit Team Member" : "Add Team Member"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {editingId
                      ? "Update the team member's information."
                      : "Add a new member to the selected customer's team."}
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
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Full Name *
                    </label>

                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email Address *
                    </label>

                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="member@example.com"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Phone Number *
                    </label>

                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Designation
                    </label>

                    <input
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="e.g. Software Developer"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Team Member"
                        : "Add Team Member"}
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

            {/* Team Members List */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Team Members
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Members associated with {currentCustomer?.name}.
                  </p>
                </div>

                <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  {teamMembers.length} Members
                </div>
              </div>

              {loadingTeam ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Loading team members...
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                    👥
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    No team members yet
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Add the first team member for this customer.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Team Member</th>
                        <th className="px-5 py-4">Phone</th>
                        <th className="px-5 py-4">Designation</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {teamMembers.map((member) => (
                        <tr key={member._id} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {member.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {member.email}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {member.phone}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {member.designation || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(member)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeactivate(member._id)}
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Deactivate
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
          </>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
