
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
import { toast } from "react-toastify";
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
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [error, setError] = useState("");

  // FETCH CUSTOMERS
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

  // FETCH SELECTED CUSTOMER'S TEAM
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

  // HANDLE FORM CHANGE
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // RESET FORM
  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  // ADD OR UPDATE TEAM MEMBER
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
        toast.success("Team member updated successfully.");
      } else {
        await api.post("/team", {
          ...payload,
          customerId: selectedCustomer,
        });

        toast.success("Team member added successfully.");
      }

      resetForm();
      await fetchTeamMembers();
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to save team member.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // EDIT TEAM MEMBER
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

  // SHOW DEACTIVATION CONFIRMATION TOAST
  const handleDeactivate = (memberId) => {
    if (deactivatingId !== null || saving) return;

    toast(
      ({ closeToast }) => (
        <div
          className="flex flex-col gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div>
            <p className="text-sm font-semibold text-[#382B26]">
              Deactivate this team member?
            </p>
            <p className="mt-1 text-xs text-[#8F8175]">
              This team member will be deactivated from the customer's team.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                closeToast();
              }}
              className="rounded-lg border border-[#E9DED0] px-3 py-1.5 text-xs font-semibold text-[#6F5D52] transition hover:bg-[#FBF3ED]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                void confirmDeactivate(memberId);
                closeToast();
              }}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Deactivate
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        position: "top-right",
      },
    );
  };

  // CONFIRM DEACTIVATION
  const confirmDeactivate = async (memberId) => {
    if (deactivatingId !== null || saving) return;

    try {
      setDeactivatingId(memberId);
      setError("");

      await api.patch(`/team/${memberId}/deactivate`);

      toast.success("Team member deactivated successfully.");

      if (editingId === memberId) {
        resetForm();
      }

      await fetchTeamMembers();
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to deactivate team member.";

      setError(message);
      toast.error(message);
    } finally {
      setDeactivatingId(null);
    }
  };

  // CURRENT CUSTOMER
  const currentCustomer = customers.find(
    (customer) => customer._id === selectedCustomer,
  );

  // GET INITIALS
  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  // INPUT STYLES
  const inputClass =
    "w-full rounded-xl border border-[#E9DED0] bg-[#FBF3ED] py-2.5 pl-11 pr-4 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99A8D] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10";

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-3 sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1500px] space-y-5">

        {/* PAGE HEADER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#C9826C] p-5 text-white shadow-md shadow-[#71392F]/10 sm:p-6">
          <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full border-[35px] border-white/10" />
          <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/90">
                <Sparkles size={14} />
                OORZA ADMINISTRATION
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Team Management
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
                Build and manage customer teams. Organize your people and keep
                every team member's information up to date.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <UsersRound size={23} />
              </div>

              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {teamMembers.length}
                </p>
                <p className="text-xs font-medium text-white/80">
                  Team Members
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 shadow-sm">
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

        {/* CUSTOMER SELECTION */}
        <section className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#E9DED0] px-4 py-3.5 sm:px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
              <Building2 size={19} />
            </div>

            <div>
              <h2 className="font-bold text-[#382B26]">
                Customer Workspace
              </h2>
              <p className="mt-0.5 text-xs text-[#8F8175]">
                Choose a customer to manage their team
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2 lg:items-center">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#382B26]">
                Select Customer
              </label>

              <div className="relative">
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    resetForm();
                    setError("");
                  }}
                  disabled={loadingCustomers || customers.length === 0}
                  className="w-full appearance-none rounded-xl border border-[#E9DED0] bg-[#FBF3ED] px-4 py-3 pr-11 text-sm font-medium text-[#382B26] outline-none transition focus:border-[#A95643] focus:ring-4 focus:ring-[#A95643]/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8F8175]"
                />
              </div>

              {customers.length === 0 && !loadingCustomers && (
                <p className="mt-2 text-xs text-[#8F8175]">
                  Create an active customer account first.
                </p>
              )}
            </div>

            {currentCustomer ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#E9DED0] bg-[#FBF3ED] p-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#71392F] to-[#A95643] text-sm font-bold text-white shadow-sm">
                  {getInitials(currentCustomer.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A95643]">
                      Selected Customer
                    </span>

                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Active
                    </span>
                  </div>

                  <p className="truncate font-bold text-[#382B26]">
                    {currentCustomer.name}
                  </p>

                  <p className="truncate text-xs text-[#8F8175]">
                    {currentCustomer.email}
                  </p>
                </div>

                <ShieldCheck
                  size={21}
                  className="shrink-0 text-[#A95643]"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#E9DED0] bg-[#FBF3ED] p-4 text-sm text-[#8F8175]">
                <Users size={20} className="text-[#A95643]" />
                Select a customer to view their team.
              </div>
            )}
          </div>
        </section>

        {selectedCustomer && (
          <>
            {/* ADD / EDIT FORM */}
            <section className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9DED0] px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                    {editingId ? (
                      <Pencil size={19} />
                    ) : (
                      <UserPlus size={20} />
                    )}
                  </div>

                  <div>
                    <h2 className="font-bold text-[#382B26]">
                      {editingId ? "Edit Team Member" : "Add Team Member"}
                    </h2>

                    <p className="mt-0.5 text-xs text-[#8F8175]">
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
                    className="inline-flex items-center gap-2 rounded-lg border border-[#E9DED0] px-3 py-2 text-xs font-semibold text-[#6F5D52] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={15} />
                    Cancel Editing
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-5">
                <div className="mb-5 grid gap-4 sm:grid-cols-2">
                  {/* NAME */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#382B26]">
                      Full Name <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <UserRound
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99A8D]"
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

                  {/* EMAIL */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#382B26]">
                      Email Address <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99A8D]"
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

                  {/* PHONE */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#382B26]">
                      Phone Number <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Phone
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99A8D]"
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

                  {/* DESIGNATION */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#382B26]">
                      Designation
                      <span className="ml-1 font-normal text-[#A99A8D]">
                        (Optional)
                      </span>
                    </label>

                    <div className="relative">
                      <BriefcaseBusiness
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99A8D]"
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

                <div className="flex flex-col gap-3 border-t border-[#E9DED0] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[#A99A8D]">
                    <span className="text-red-500">*</span> Required fields
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={saving}
                        className="rounded-lg border border-[#E9DED0] px-4 py-2.5 text-sm font-semibold text-[#6F5D52] transition hover:bg-[#FBF3ED] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={saving || deactivatingId !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A95643] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#71392F] disabled:cursor-not-allowed disabled:opacity-60"
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

            {/* TEAM MEMBERS */}
            <section className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9DED0] px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                    <UsersRound size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold text-[#382B26]">
                      Team Members
                    </h2>

                    <p className="mt-0.5 text-xs text-[#8F8175]">
                      People associated with {currentCustomer?.name}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-lg border border-[#E9DED0] bg-[#FBF3ED] px-3 py-2">
                  <Users size={15} className="text-[#A95643]" />

                  <span className="text-sm font-bold text-[#71392F]">
                    {teamMembers.length}
                  </span>

                  <span className="text-xs font-medium text-[#8F8175]">
                    Members
                  </span>
                </div>
              </div>

              {/* LOADING */}
              {loadingTeam ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <Loader2
                    size={29}
                    className="animate-spin text-[#A95643]"
                  />

                  <p className="mt-3 text-sm font-medium text-[#6F5D52]">
                    Loading team members...
                  </p>
                </div>
              ) : teamMembers.length === 0 ? (
                /* EMPTY STATE */
                <div className="px-5 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                    <UsersRound size={28} />
                  </div>

                  <h3 className="mt-4 font-bold text-[#382B26]">
                    No team members yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#8F8175]">
                    This customer doesn't have any team members. Add the first
                    member using the form above.
                  </p>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead className="bg-[#FBF3ED] text-[11px] font-bold uppercase tracking-wider text-[#8F8175]">
                        <tr>
                          <th className="px-5 py-3.5">Team Member</th>
                          <th className="px-5 py-3.5">Phone</th>
                          <th className="px-5 py-3.5">Designation</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#F0E7DD]">
                        {teamMembers.map((member) => (
                          <tr
                            key={member._id}
                            className="transition hover:bg-[#FBF6F0]"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#71392F] to-[#A95643] text-xs font-bold text-white">
                                  {getInitials(member.name)}
                                </div>

                                <div className="min-w-0">
                                  <p className="font-semibold text-[#382B26]">
                                    {member.name}
                                  </p>

                                  <p className="mt-1 text-xs text-[#8F8175]">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2 text-sm text-[#6F5D52]">
                                <Phone
                                  size={14}
                                  className="text-[#A99A8D]"
                                />
                                {member.phone}
                              </div>
                            </td>

                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-2 rounded-lg bg-[#F8EDE6] px-3 py-1.5 text-xs font-semibold text-[#71392F]">
                                <BriefcaseBusiness size={13} />
                                {member.designation || "Not specified"}
                              </span>
                            </td>

                            <td className="px-5 py-3.5">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(member)}
                                  disabled={
                                    saving || deactivatingId !== null
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9DED0] bg-white px-3 py-2 text-xs font-semibold text-[#A95643] transition hover:border-[#C9826C] hover:bg-[#FBF3ED] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeactivate(member._id)
                                  }
                                  disabled={
                                    saving || deactivatingId !== null
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {deactivatingId === member._id ? (
                                    <>
                                      <Loader2
                                        size={14}
                                        className="animate-spin"
                                      />
                                      Deactivating
                                    </>
                                  ) : (
                                    <>
                                      <UserX size={14} />
                                      Deactivate
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

                  {/* MOBILE CARDS */}
                  <div className="space-y-3 p-4 md:hidden">
                    {teamMembers.map((member) => (
                      <div
                        key={member._id}
                        className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-3.5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#71392F] to-[#A95643] text-xs font-bold text-white shadow-sm">
                            {getInitials(member.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-[#382B26]">
                              {member.name}
                            </p>

                            <p className="mt-1 break-all text-xs text-[#8F8175]">
                              {member.email}
                            </p>

                            <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#F8EDE6] px-2.5 py-1 text-[11px] font-semibold text-[#71392F]">
                              <BriefcaseBusiness size={12} />
                              {member.designation || "Not specified"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 border-t border-[#E9DED0] pt-3 text-xs text-[#6F5D52]">
                          <Phone size={14} className="text-[#A99A8D]" />
                          {member.phone}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(member)}
                            disabled={saving || deactivatingId !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E9DED0] bg-white px-3 py-2.5 text-xs font-semibold text-[#A95643] transition hover:bg-[#FBF3ED] disabled:opacity-50"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeactivate(member._id)}
                            disabled={saving || deactivatingId !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deactivatingId === member._id ? (
                              <>
                                <Loader2
                                  size={14}
                                  className="animate-spin"
                                />
                                Deactivating
                              </>
                            ) : (
                              <>
                                <UserX size={14} />
                                Deactivate
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TABLE FOOTER */}
              {!loadingTeam && teamMembers.length > 0 && (
                <div className="border-t border-[#E9DED0] bg-[#FBF3ED] px-4 py-3 sm:px-5">
                  <p className="text-xs text-[#8F8175]">
                    Showing{" "}
                    <span className="font-semibold text-[#382B26]">
                      {teamMembers.length}
                    </span>{" "}
                    team {teamMembers.length === 1 ? "member" : "members"} for{" "}
                    <span className="font-semibold text-[#382B26]">
                      {currentCustomer?.name}
                    </span>
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* FOOTER */}
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-[#A99A8D]">
          <ShieldCheck size={14} />
          Oorza Team Administration
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
