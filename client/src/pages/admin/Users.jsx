import React, { useEffect, useMemo, useState } from "react";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Eye,
  X,
  Lock,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  CalendarDays,
  Shield,
  Building2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axios.js";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customerForm, setCustomerForm] = useState(EMPTY_FORM);
  const [customerError, setCustomerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  // ==========================================
  // FETCH USERS
  // ==========================================
  const fetchUsers = async () => {
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // CREATE CUSTOMER
  // ==========================================
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setCustomerError("");

    const { name, email, phone, password, confirmPassword } = customerForm;

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      setCustomerError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setCustomerError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setCustomerError("Passwords do not match.");
      return;
    }

    try {
      setCreating(true);

      await api.post("/auth/create-customer", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      setCustomerForm(EMPTY_FORM);
      setShowCreateModal(false);
      setShowPassword(false);
      setShowConfirmPassword(false);

      await fetchUsers();

      toast.success("Customer account created successfully.");
    } catch (error) {
      setCustomerError(
        error.response?.data?.message || "Failed to create customer account.",
      );
    } finally {
      setCreating(false);
    }
  };

  // ==========================================
  // DEACTIVATE CUSTOMER
  // ==========================================
  const handleDeactivate = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this customer account?",
    );

    if (!confirmed) return;

    try {
      await api.patch(`/auth/customer/${id}/deactivate`);

      setUsers((prev) =>
        prev.map((user) =>
          user._id === id ? { ...user, isActive: false } : user,
        ),
      );

      if (selectedUser?._id === id) {
        setSelectedUser((prev) => (prev ? { ...prev, isActive: false } : null));
      }

      toast.success("Customer account deactivated successfully.");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to deactivate customer.",
      );
    }
  };

  // ==========================================
  // FILTER USERS
  // ==========================================
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        user.name?.toLowerCase().includes(searchValue) ||
        user.email?.toLowerCase().includes(searchValue) ||
        user.phone?.toLowerCase().includes(searchValue);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // ==========================================
  // HELPERS
  // ==========================================
  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const getRoleStyle = (role) => {
    switch (role) {
      case "admin":
        return "bg-violet-50 text-violet-700 ring-violet-200";

      case "customer":
        return "bg-blue-50 text-blue-700 ring-blue-200";

      default:
        return "bg-slate-100 text-slate-600 ring-slate-200";
    }
  };

  const closeCreateModal = () => {
    if (creating) return;

    setShowCreateModal(false);
    setCustomerForm(EMPTY_FORM);
    setCustomerError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const updateCustomerField = (field, value) => {
    setCustomerForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.length - activeCount;
  const adminCount = users.filter((user) => user.role === "admin").length;
  const customerCount = users.filter((user) => user.role === "customer").length;

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-52 rounded-3xl bg-white shadow-sm" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>

          <div className="h-24 rounded-2xl bg-white shadow-sm" />

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 rounded-xl bg-blue-50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ======================================
            PAGE HEADER
        ====================================== */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200/60 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-50">
                <Building2 size={14} />
                OORZA ADMINISTRATION
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                User Management
              </h1>

              <p className="mt-3 max-w-lg text-sm leading-6 text-blue-100 sm:text-base">
                Manage customer accounts, monitor account activity, and keep
                your workspace community organized.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-blue-100">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <ShieldCheck size={14} />
                  Secure administration
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <UsersIcon size={14} />
                  Centralized user directory
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid grid-cols-3 gap-2">
                <div className="min-w-[82px] rounded-2xl border border-white/10 bg-white/10 px-3 py-4 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="mt-1 text-[11px] font-medium text-blue-100">
                    Total
                  </p>
                </div>

                <div className="min-w-[82px] rounded-2xl border border-white/10 bg-white/10 px-3 py-4 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold text-emerald-200">
                    {activeCount}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-blue-100">
                    Active
                  </p>
                </div>

                <div className="min-w-[82px] rounded-2xl border border-white/10 bg-white/10 px-3 py-4 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold text-rose-200">
                    {inactiveCount}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-blue-100">
                    Inactive
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomerError("");
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                <UserPlus size={18} />
                Create Customer
              </button>
            </div>
          </div>
        </section>

        {/* ======================================
            OVERVIEW CARDS
        ====================================== */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UsersIcon size={21} />
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                All users
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">
              Total Users
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
              {users.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Registered platform accounts
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck size={21} />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">
              Active Accounts
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-600">
              {activeCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Accounts currently active
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <UserX size={21} />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">
              Inactive Accounts
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-rose-600">
              {inactiveCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">Deactivated accounts</p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ShieldCheck size={21} />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">
              Administrators
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-violet-600">
              {adminCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {customerCount} customer accounts
            </p>
          </div>
        </section>

        {/* ======================================
            FILTERS
        ====================================== */}
        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Filter size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Find Users</h2>
              <p className="text-xs text-slate-400">
                Search and filter your user directory
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or phone..."
                className="w-full rounded-xl border border-slate-200 bg-[#F7FAFF] py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-[#F7FAFF] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-[#F7FAFF] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {(search || roleFilter !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="rounded-xl border border-blue-100 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredUsers.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">{users.length}</span>{" "}
              users
            </p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchUsers();
              }}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              <RefreshCw size={14} />
              Refresh List
            </button>
          </div>
        </section>

        {/* ======================================
            DESKTOP TABLE
        ====================================== */}
        <section className="hidden overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm md:block">
          <div className="flex flex-col gap-2 border-b border-blue-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">All Users</h2>
              <p className="mt-1 text-xs text-slate-400">
                View and manage registered accounts
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <UsersIcon size={14} />
              {filteredUsers.length} Records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-blue-50 bg-[#F7FAFF]">
                  {[
                    "User",
                    "Contact Information",
                    "Role",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${
                        heading === "Actions" ? "text-right" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="transition hover:bg-[#F7FAFF]"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm shadow-blue-200">
                            {getInitials(user.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate text-sm font-bold text-slate-800">
                              {user.name}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              ID: {user._id?.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Mail size={14} className="shrink-0 text-blue-500" />
                          <span className="max-w-[220px] truncate">
                            {user.email}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                          <Phone size={13} className="shrink-0" />
                          {user.phone || "No phone number"}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ${getRoleStyle(
                            user.role,
                          )}`}
                        >
                          {user.role === "admin" ? (
                            <Shield size={13} />
                          ) : (
                            <UsersIcon size={13} />
                          )}
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          {user.role === "customer" && user.isActive && (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(user._id)}
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                        <UsersIcon size={25} />
                      </div>
                      <p className="mt-4 font-bold text-slate-800">
                        No users found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filter options.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-blue-50 bg-[#F7FAFF] px-6 py-3">
            <p className="text-xs text-slate-400">
              Displaying {filteredUsers.length} user records
            </p>
          </div>
        </section>

        {/* ======================================
            MOBILE USER CARDS
        ====================================== */}
        <section className="space-y-4 md:hidden">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-slate-800">All Users</h2>
            <span className="text-xs font-semibold text-slate-500">
              {filteredUsers.length} Records
            </span>
          </div>

          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white">
                      {getInitials(user.name)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-800">
                        {user.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ${getRoleStyle(
                      user.role,
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#F4F8FF] p-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Phone
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                      {user.phone || "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </p>
                    <p
                      className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${
                        user.isActive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.isActive ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      {user.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Eye size={14} />
                    View Details
                  </button>

                  {user.role === "customer" && user.isActive && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(user._id)}
                      className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-blue-100 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                <Search size={24} />
              </div>
              <h3 className="mt-4 font-bold text-slate-800">No users found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ======================================
          CREATE CUSTOMER MODAL
      ====================================== */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeCreateModal}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-blue-700 to-indigo-700 px-6 py-6 text-white">
              <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[20px] border-white/10" />

              <div className="relative flex items-start justify-between">
                <div>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <UserPlus size={22} />
                  </div>
                  <h2 className="text-xl font-bold">Create Customer</h2>
                  <p className="mt-1 text-sm text-blue-100">
                    Add a new customer account to Oorza.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 p-6">
              {customerError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  {customerError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => updateCustomerField("name", e.target.value)}
                  placeholder="Enter customer name"
                  disabled={creating}
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFF] px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) =>
                      updateCustomerField("email", e.target.value)
                    }
                    placeholder="customer@example.com"
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFF] py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) =>
                      updateCustomerField("phone", e.target.value)
                    }
                    placeholder="Enter phone number"
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFF] py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={customerForm.password}
                    onChange={(e) =>
                      updateCustomerField("password", e.target.value)
                    }
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFF] py-3 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={customerForm.confirmPassword}
                    onChange={(e) =>
                      updateCustomerField("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    disabled={creating}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFF] py-3 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-600"
                />
                <div>
                  <p className="text-xs font-bold text-blue-800">
                    Account configuration
                  </p>
                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    The account will automatically be created with the Customer
                    role and Active status.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Create Customer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================
          VIEW USER MODAL
      ====================================== */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-indigo-700 px-6 pb-12 pt-6 text-white">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[25px] border-white/10" />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                    Account Information
                  </p>
                  <h2 className="mt-1 text-xl font-bold">User Details</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="-mt-9 px-6">
              <div className="relative rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-100">
                  {getInitials(selectedUser.name)}
                </div>

                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  {selectedUser.name}
                </h3>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${getRoleStyle(
                    selectedUser.role,
                  )}`}
                >
                  {selectedUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3 rounded-xl bg-[#F4F8FF] p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Mail size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Email Address
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                    {selectedUser.email || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#F4F8FF] p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Phone size={17} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Phone Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedUser.phone || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#F4F8FF] p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <CheckCircle2 size={17} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Account Status
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      selectedUser.isActive
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#F4F8FF] p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <CalendarDays size={17} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Account Created
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "Not available"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:from-blue-700 hover:to-indigo-700"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
