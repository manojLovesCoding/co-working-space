import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  UserRound,
  Mail,
  Phone,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Pencil,
  UserX,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UsersRound,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
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

  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const inputClass =
    "w-full rounded-xl border border-blue-100 bg-[#F8FBFF] py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-blue-200/60 sm:p-8">
          <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full border-[35px] border-white/10" />
          <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-50">
                <Sparkles size={14} />
                OORZA ADMINISTRATION
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Team Management
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Build and manage customer teams. Organize your people and keep
                every team member's information up to date.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <UsersRound size={25} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {teamMembers.length}
                </p>
                <p className="text-xs font-medium text-blue-100">
                  Team Members
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Customer Selection */}
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-blue-50 px-5 py-4 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Customer Workspace</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Choose a customer to manage their team
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Customer
              </label>

              <div className="relative">
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    resetForm();
                  }}
                  disabled={loadingCustomers || customers.length === 0}
                  className="w-full appearance-none rounded-xl border border-blue-100 bg-[#F8FBFF] px-4 py-3.5 pr-11 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingCustomers ? (
                    <option value="">Loading customers...</option>
                  ) : customers.length === 0 ? (
                    <option value="">No active customers found</option>
                  ) : (
                    customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} ({customer.email})
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {customers.length === 0 && !loadingCustomers && (
                <p className="mt-2 text-xs text-slate-500">
                  Create an active customer account first.
                </p>
              )}
            </div>

            {currentCustomer ? (
              <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-200">
                  {getInitials(currentCustomer.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Selected Customer
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      Active
                    </span>
                  </div>
                  <p className="truncate font-bold text-slate-800">
                    {currentCustomer.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {currentCustomer.email}
                  </p>
                </div>

                <ShieldCheck size={22} className="shrink-0 text-blue-500" />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-blue-200 bg-[#F8FBFF] p-4 text-sm text-slate-500">
                <Users size={20} className="text-blue-400" />
                Select a customer to view their team.
              </div>
            )}
          </div>
        </section>

        {selectedCustomer && (
          <>
            {/* Add / Edit Form */}
            <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-50 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {editingId ? <Pencil size={20} /> : <UserPlus size={21} />}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">
                      {editingId ? "Edit Team Member" : "Add Team Member"}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {editingId
                        ? "Update the selected member's details."
                        : "Add a new person to this customer's team."}
                    </p>
                  </div>
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={15} />
                    Cancel Editing
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                <div className="mb-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <UserRound
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="member@example.com"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Designation
                      <span className="ml-1 font-normal text-slate-400">
                        (Optional)
                      </span>
                    </label>
                    <div className="relative">
                      <BriefcaseBusiness
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        placeholder="e.g. Software Developer"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-blue-50 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-400">
                    <span className="text-red-500">*</span> Required fields
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={saving}
                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          {editingId ? (
                            <CheckCircle2 size={17} />
                          ) : (
                            <UserPlus size={17} />
                          )}
                          {editingId ? "Update Member" : "Add Team Member"}
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {/* Team Members */}
            <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-50 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <UsersRound size={21} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Team Members</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      People associated with {currentCustomer?.name}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2">
                  <Users size={16} className="text-blue-600" />
                  <span className="text-sm font-bold text-blue-700">
                    {teamMembers.length}
                  </span>
                  <span className="text-xs font-medium text-blue-600">
                    Members
                  </span>
                </div>
              </div>

              {loadingTeam ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 size={30} className="animate-spin text-blue-600" />
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    Loading team members...
                  </p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                    <UsersRound size={30} />
                  </div>
                  <h3 className="mt-5 font-bold text-slate-800">
                    No team members yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    This customer doesn't have any team members. Add the first
                    member using the form above.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead className="bg-[#F3F8FF] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Team Member</th>
                          <th className="px-6 py-4">Phone</th>
                          <th className="px-6 py-4">Designation</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-blue-50">
                        {teamMembers.map((member) => (
                          <tr
                            key={member._id}
                            className="transition hover:bg-[#F8FBFF]"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                                  {getInitials(member.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800">
                                    {member.name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={14} className="text-slate-400" />
                                {member.phone}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                                <BriefcaseBusiness size={13} />
                                {member.designation || "Not specified"}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(member)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeactivate(member._id)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
                                >
                                  <UserX size={14} />
                                  Deactivate
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="space-y-3 p-4 md:hidden">
                    {teamMembers.map((member) => (
                      <div
                        key={member._id}
                        className="rounded-2xl border border-blue-100 bg-[#F9FBFF] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                            {getInitials(member.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-slate-800">
                              {member.name}
                            </p>
                            <p className="mt-1 break-all text-xs text-slate-500">
                              {member.email}
                            </p>
                            <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                              <BriefcaseBusiness size={12} />
                              {member.designation || "Not specified"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 border-t border-blue-100 pt-3 text-xs text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {member.phone}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(member)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeactivate(member._id)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <UserX size={14} />
                            Deactivate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!loadingTeam && teamMembers.length > 0 && (
                <div className="border-t border-blue-50 bg-[#F8FBFF] px-5 py-3 sm:px-6">
                  <p className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {teamMembers.length}
                    </span>{" "}
                    team {teamMembers.length === 1 ? "member" : "members"} for{" "}
                    <span className="font-semibold text-slate-700">
                      {currentCustomer?.name}
                    </span>
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* Footer Note */}
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
          <ShieldCheck size={14} />
          Oorza Team Administration
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
