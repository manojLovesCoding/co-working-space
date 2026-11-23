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
  KeyRound,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  CalendarDays,
  Shield,
  Building2,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const ITEMS_PER_PAGE = 10;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customerForm, setCustomerForm] = useState(EMPTY_FORM);
  const [customerError, setCustomerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  // ==========================================
  // UPDATE CUSTOMER PASSWORD
  // ==========================================
  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState(false);

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
      setCurrentPage(1);

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
  const confirmDeactivate = async (id, toastId) => {
    toast.dismiss(toastId);

    const loadingToast = toast.loading("Deactivating customer account...");

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

      toast.dismiss(loadingToast);
      toast.success("Customer account deactivated successfully.");
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error(
        error.response?.data?.message || "Failed to deactivate customer.",
      );
    }
  };

  const handleDeactivate = (id) => {
    toast(
      (t) => (
        <div className="w-full min-w-[280px]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-[#382B26]">
                Deactivate Customer?
              </p>
              <p className="mt-1 text-xs leading-5 text-[#8F8175]">
                Are you sure you want to deactivate this customer account?
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="rounded-lg border border-[#E9DED0] px-3 py-2 text-xs font-semibold text-[#71645B] transition hover:bg-[#FAF6EF]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => confirmDeactivate(id, t.id)}
              className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              Deactivate
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
        style: {
          maxWidth: "420px",
          padding: "16px",
          borderRadius: "16px",
          background: "#FFFDFA",
          boxShadow: "0 10px 35px rgba(56, 43, 38, 0.12)",
        },
      },
    );
  };

  // ==========================================
  // UPDATE CUSTOMER PASSWORD
  // ==========================================
  const closePasswordModal = () => {
    if (updatingPassword) return;

    setPasswordUser(null);
    setPasswordForm({ password: "", confirmPassword: "" });
    setPasswordError("");
    setShowNewPassword(false);
    setShowNewConfirmPassword(false);
  };

  const handleUpdateCustomerPassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    const { password, confirmPassword } = passwordForm;

    if (!password || !confirmPassword) {
      setPasswordError("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      setUpdatingPassword(true);

      await api.patch(`/auth/customer/${passwordUser._id}/password`, {
        password,
      });

      toast.success("Customer password updated successfully.");
      setPasswordUser(null);
      setPasswordForm({ password: "", confirmPassword: "" });
      setPasswordError("");
      setShowNewPassword(false);
      setShowNewConfirmPassword(false);
    } catch (error) {
      console.error("Failed to update customer password:", error);
      setPasswordError(
        error.response?.data?.message || "Failed to update customer password.",
      );
    } finally {
      setUpdatingPassword(false);
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
  // PAGINATION
  // ==========================================
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const startRecord =
    filteredUsers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredUsers.length,
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }

    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRoleChange = (value) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  };

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
        return "bg-[#F8EDE6] text-[#71392F] ring-[#E9CFC3]";

      case "customer":
        return "bg-[#F5EFE7] text-[#8A6651] ring-[#E9DED0]";

      default:
        return "bg-[#F5F0EA] text-[#71645B] ring-[#E9DED0]";
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

  const inputClass =
    "w-full rounded-xl border border-[#E9DED0] bg-[#FAF6EF] px-4 py-3 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8F] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10 disabled:opacity-60";

  const iconInputClass =
    "w-full rounded-xl border border-[#E9DED0] bg-[#FAF6EF] py-3 pl-11 pr-4 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8F] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10 disabled:opacity-60";

  // ==========================================
  // PAGINATION COMPONENT
  // ==========================================
  const Pagination = () => (
    <div className="flex flex-col gap-3 border-t border-[#E9DED0] bg-[#FBF3ED] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-[#8F8175]">
        Showing <span className="font-bold text-[#382B26]">{startRecord}</span>
        {" - "}
        <span className="font-bold text-[#382B26]">{endRecord}</span>
        {" of "}
        <span className="font-bold text-[#382B26]">
          {filteredUsers.length}
        </span>{" "}
        users
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="flex h-9 items-center gap-1 rounded-lg border border-[#E9DED0] bg-white px-3 text-xs font-semibold text-[#71645B] transition hover:border-[#C9826C] hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={15} />
          <span>Previous</span>
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setCurrentPage(page)}
            className={`h-9 min-w-9 rounded-lg px-3 text-xs font-bold transition ${
              currentPage === page
                ? "bg-[#A95643] text-white shadow-sm"
                : "border border-[#E9DED0] bg-white text-[#71645B] hover:border-[#C9826C] hover:bg-[#F8EDE6]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages || totalPages === 0}
          className="flex h-9 items-center gap-1 rounded-lg border border-[#E9DED0] bg-white px-3 text-xs font-semibold text-[#71645B] transition hover:border-[#C9826C] hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Next</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] p-4 sm:p-5 lg:p-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-5">
          <div className="h-48 rounded-2xl bg-white shadow-sm" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>

          <div className="h-24 rounded-2xl bg-white shadow-sm" />

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 rounded-xl bg-[#F8EDE6]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* PAGE HEADER */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#71392F] via-[#8F493A] to-[#A95643] p-5 text-white shadow-lg shadow-[#71392F]/10 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[30px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[#F8EDE6]">
                <Building2 size={14} />
                OORZA ADMINISTRATION
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                User Management
              </h1>

              <p className="mt-2 max-w-lg text-sm leading-6 text-[#F5DFD5]">
                Manage customer accounts, monitor account activity, and keep
                your workspace community organized.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#F5DFD5]">
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-3 gap-2">
                <div className="min-w-[76px] rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm">
                  <p className="text-xl font-bold">{users.length}</p>
                  <p className="mt-1 text-[10px] font-medium text-[#F5DFD5]">
                    Total
                  </p>
                </div>

                <div className="min-w-[76px] rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm">
                  <p className="text-xl font-bold text-emerald-200">
                    {activeCount}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-[#F5DFD5]">
                    Active
                  </p>
                </div>

                <div className="min-w-[76px] rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm">
                  <p className="text-xl font-bold text-rose-200">
                    {inactiveCount}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-[#F5DFD5]">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FAF6EF] px-5 py-3 text-sm font-bold text-[#71392F] shadow-md transition hover:-translate-y-0.5 hover:bg-white"
              >
                <UserPlus size={17} />
                Create Customer
              </button>
            </div>
          </div>
        </section>

        {/* OVERVIEW CARDS */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#E9DED0] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                <UsersIcon size={20} />
              </div>
              <span className="rounded-full bg-[#F8EDE6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#A95643]">
                All users
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-[#8F8175]">
              Total Users
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#382B26]">
              {users.length}
            </p>
            <p className="mt-1 text-xs text-[#A99B8F]">
              Registered platform accounts
            </p>
          </div>

          <div className="rounded-2xl border border-[#DCE8DC] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck size={20} />
            </div>
            <p className="mt-3 text-sm font-medium text-[#8F8175]">
              Active Accounts
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600">
              {activeCount}
            </p>
            <p className="mt-1 text-xs text-[#A99B8F]">
              Accounts currently active
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <UserX size={20} />
            </div>
            <p className="mt-3 text-sm font-medium text-[#8F8175]">
              Inactive Accounts
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-rose-600">
              {inactiveCount}
            </p>
            <p className="mt-1 text-xs text-[#A99B8F]">Deactivated accounts</p>
          </div>

          <div className="rounded-2xl border border-[#E9DED0] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EFE7] text-[#8A6651]">
              <ShieldCheck size={20} />
            </div>
            <p className="mt-3 text-sm font-medium text-[#8F8175]">
              Administrators
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#71392F]">
              {adminCount}
            </p>
            <p className="mt-1 text-xs text-[#A99B8F]">
              {customerCount} customer accounts
            </p>
          </div>
        </section>

        {/* FILTERS */}
        <section className="rounded-2xl border border-[#E9DED0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
              <Filter size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#382B26]">Find Users</h2>
              <p className="text-xs text-[#A99B8F]">
                Search and filter your user directory
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A99B8F]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, email or phone..."
                className="w-full rounded-xl border border-[#E9DED0] bg-[#FAF6EF] py-3 pl-11 pr-4 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8F] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="rounded-xl border border-[#E9DED0] bg-[#FAF6EF] px-4 py-3 text-sm font-medium text-[#71645B] outline-none transition focus:border-[#A95643] focus:ring-4 focus:ring-[#A95643]/10"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-xl border border-[#E9DED0] bg-[#FAF6EF] px-4 py-3 text-sm font-medium text-[#71645B] outline-none transition focus:border-[#A95643] focus:ring-4 focus:ring-[#A95643]/10"
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
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-[#E9DED0] px-4 py-3 text-sm font-semibold text-[#A95643] transition hover:bg-[#F8EDE6]"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0E8DE] pt-3">
            <p className="text-xs text-[#8F8175]">
              Showing{" "}
              <span className="font-bold text-[#382B26]">
                {filteredUsers.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#382B26]">{users.length}</span>{" "}
              users
            </p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchUsers();
              }}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#A95643] transition hover:bg-[#F8EDE6]"
            >
              <RefreshCw size={14} />
              Refresh List
            </button>
          </div>
        </section>

        {/* DESKTOP TABLE */}
        <section className="hidden overflow-hidden rounded-2xl border border-[#E9DED0] bg-white shadow-sm md:block">
          <div className="flex flex-col gap-2 border-b border-[#F0E8DE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#382B26]">All Users</h2>
              <p className="mt-1 text-xs text-[#A99B8F]">
                View and manage registered accounts
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-[#F8EDE6] px-3 py-1.5 text-xs font-semibold text-[#A95643]">
              <UsersIcon size={14} />
              {filteredUsers.length} Records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-[#F0E8DE] bg-[#FBF3ED]">
                  {[
                    "User",
                    "Contact Information",
                    "Role",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#8F8175] ${
                        heading === "Actions" ? "text-right" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0E8DE]">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="transition hover:bg-[#FFFDFA]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#A95643] to-[#71392F] text-sm font-bold text-white">
                            {getInitials(user.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate text-sm font-bold text-[#382B26]">
                              {user.name}
                            </p>
                            <p className="mt-1 text-[10px] text-[#A99B8F]">
                              ID: {user._id?.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#71645B]">
                          <Mail size={14} className="shrink-0 text-[#A95643]" />
                          <span className="max-w-[220px] truncate">
                            {user.email}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-[#A99B8F]">
                          <Phone size={13} className="shrink-0" />
                          {user.phone || "No phone number"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ${getRoleStyle(user.role)}`}
                        >
                          {user.role === "admin" ? (
                            <Shield size={13} />
                          ) : (
                            <UsersIcon size={13} />
                          )}
                          {user.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
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

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9DED0] bg-[#FAF6EF] px-3 py-2 text-xs font-bold text-[#A95643] transition hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          {user.role === "customer" && (
                            <button
                              type="button"
                              onClick={() => {
                                setPasswordError("");
                                setPasswordForm({
                                  password: "",
                                  confirmPassword: "",
                                });
                                setPasswordUser(user);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9DED0] bg-white px-3 py-2 text-xs font-bold text-[#71392F] transition hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                            >
                              <KeyRound size={14} />
                              Password
                            </button>
                          )}

                          {user.role === "customer" && user.isActive && (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(user._id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
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
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                        <UsersIcon size={23} />
                      </div>
                      <p className="mt-3 font-bold text-[#382B26]">
                        No users found
                      </p>
                      <p className="mt-1 text-sm text-[#8F8175]">
                        Try changing your search or filter options.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredUsers.length > 0 && <Pagination />}
        </section>

        {/* MOBILE USER CARDS */}
        <section className="space-y-3 md:hidden">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-[#382B26]">All Users</h2>
            <span className="text-xs font-semibold text-[#8F8175]">
              {filteredUsers.length} Records
            </span>
          </div>

          {paginatedUsers.length > 0 ? (
            paginatedUsers.map((user) => (
              <div
                key={user._id}
                className="rounded-2xl border border-[#E9DED0] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#A95643] to-[#71392F] text-sm font-bold text-white">
                      {getInitials(user.name)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[#382B26]">
                        {user.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-[#A99B8F]">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ${getRoleStyle(user.role)}`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-[#FAF6EF] p-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A99B8F]">
                      Phone
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-[#71645B]">
                      {user.phone || "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A99B8F]">
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

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E9DED0] bg-[#FAF6EF] py-2.5 text-xs font-bold text-[#A95643] transition hover:bg-[#F8EDE6]"
                  >
                    <Eye size={14} />
                    View Details
                  </button>

                  {user.role === "customer" && (
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordError("");
                        setPasswordForm({ password: "", confirmPassword: "" });
                        setPasswordUser(user);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E9DED0] bg-white py-2.5 text-xs font-bold text-[#71392F] transition hover:bg-[#F8EDE6]"
                    >
                      <KeyRound size={14} />
                      Password
                    </button>
                  )}

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
            <div className="rounded-2xl border border-[#E9DED0] bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                <Search size={22} />
              </div>
              <h3 className="mt-3 font-bold text-[#382B26]">No users found</h3>
              <p className="mt-1 text-sm text-[#8F8175]">
                Try changing your search or filters.
              </p>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-[#E9DED0] bg-white">
              <Pagination />
            </div>
          )}
        </section>
      </div>

      {/* CREATE CUSTOMER MODAL */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#382B26]/60 p-3 backdrop-blur-sm"
          onClick={closeCreateModal}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#71392F] to-[#A95643] px-5 py-5 text-white">
              <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[20px] border-white/10" />

              <div className="relative flex items-start justify-between">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <UserPlus size={21} />
                  </div>
                  <h2 className="text-xl font-bold">Create Customer</h2>
                  <p className="mt-1 text-sm text-[#F5DFD5]">
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

            <form onSubmit={handleCreateCustomer} className="space-y-4 p-5">
              {customerError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  {customerError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#71645B]">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => updateCustomerField("name", e.target.value)}
                  placeholder="Enter customer name"
                  disabled={creating}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#71645B]">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99B8F]"
                  />
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) =>
                      updateCustomerField("email", e.target.value)
                    }
                    placeholder="customer@example.com"
                    disabled={creating}
                    className={iconInputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#71645B]">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99B8F]"
                  />
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) =>
                      updateCustomerField("phone", e.target.value)
                    }
                    placeholder="Enter phone number"
                    disabled={creating}
                    className={iconInputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#71645B]">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99B8F]"
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
                    className="w-full rounded-xl border border-[#E9DED0] bg-[#FAF6EF] py-3 pl-11 pr-12 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8F] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A99B8F] transition hover:text-[#A95643]"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#71645B]">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99B8F]"
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
                    className="w-full rounded-xl border border-[#E9DED0] bg-[#FAF6EF] py-3 pl-11 pr-12 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8F] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A99B8F] transition hover:text-[#A95643]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#E9DED0] bg-[#F8EDE6] p-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#A95643]"
                />
                <div>
                  <p className="text-xs font-bold text-[#71392F]">
                    Account configuration
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#8F6255]">
                    The account will automatically be created with the Customer
                    role and Active status.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#F0E8DE] pt-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="flex-1 rounded-xl border border-[#E9DED0] py-3 text-sm font-semibold text-[#71645B] transition hover:bg-[#FAF6EF] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#A95643] py-3 text-sm font-bold text-white shadow-md shadow-[#A95643]/15 transition hover:bg-[#8F493A] disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* UPDATE CUSTOMER PASSWORD MODAL */}
      {passwordUser && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#382B26]/60 p-3 backdrop-blur-sm"
          onClick={closePasswordModal}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#71392F] to-[#A95643] px-5 py-5 text-white">
              <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[20px] border-white/10" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <KeyRound size={21} />
                  </div>
                  <h2 className="text-xl font-bold">Update Password</h2>
                  <p className="mt-1 text-sm text-[#F5DFD5]">
                    Set a new login password for this customer.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={updatingPassword}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleUpdateCustomerPassword}
              className="space-y-4 p-5"
            >
              <div className="rounded-xl border border-[#E9DED0] bg-[#FAF6EF] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A99B8F]">
                  Customer account
                </p>
                <p className="mt-1 text-sm font-bold text-[#382B26]">
                  {passwordUser.name}
                </p>
                <p className="mt-0.5 break-all text-xs text-[#8F8175]">
                  {passwordUser.email}
                </p>
              </div>

              {passwordError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#71645B]">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99B8F]"
                  />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.password}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    disabled={updatingPassword}
                    className="w-full rounded-xl border border-[#E9DED0] bg-[#FAF6EF] py-3 pl-11 pr-12 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8F] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    disabled={updatingPassword}
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A99B8F] transition hover:text-[#A95643]"
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#71645B]">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A99B8F]"
                  />
                  <input
                    type={showNewConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    disabled={updatingPassword}
                    className="w-full rounded-xl border border-[#E9DED0] bg-[#FAF6EF] py-3 pl-11 pr-12 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8F] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewConfirmPassword((prev) => !prev)}
                    disabled={updatingPassword}
                    aria-label={
                      showNewConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A99B8F] transition hover:text-[#A95643]"
                  >
                    {showNewConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#E9DED0] bg-[#F8EDE6] p-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#A95643]"
                />
                <div>
                  <p className="text-xs font-bold text-[#71392F]">
                    Password security
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#8F6255]">
                    The new password will replace the customer's current login
                    password.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#F0E8DE] pt-4">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={updatingPassword}
                  className="flex-1 rounded-xl border border-[#E9DED0] py-3 text-sm font-semibold text-[#71645B] transition hover:bg-[#FAF6EF] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#A95643] py-3 text-sm font-bold text-white shadow-md shadow-[#A95643]/15 transition hover:bg-[#8F493A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingPassword ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USER MODAL */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#382B26]/60 p-3 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-[#71392F] to-[#A95643] px-5 pb-11 pt-5 text-white">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[25px] border-white/10" />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#F5DFD5]">
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

            <div className="-mt-9 px-5">
              <div className="relative rounded-2xl border border-[#E9DED0] bg-white p-4 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A95643] to-[#71392F] text-xl font-bold text-white shadow-lg shadow-[#A95643]/15">
                  {getInitials(selectedUser.name)}
                </div>

                <h3 className="mt-3 text-lg font-bold text-[#382B26]">
                  {selectedUser.name}
                </h3>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${getRoleStyle(selectedUser.role)}`}
                >
                  {selectedUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-5">
              <div className="flex items-start gap-3 rounded-xl bg-[#FAF6EF] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                  <Mail size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A99B8F]">
                    Email Address
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-[#382B26]">
                    {selectedUser.email || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#FAF6EF] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                  <Phone size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A99B8F]">
                    Phone Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#382B26]">
                    {selectedUser.phone || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#FAF6EF] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                  <CheckCircle2 size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A99B8F]">
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

              <div className="flex items-start gap-3 rounded-xl bg-[#FAF6EF] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                  <CalendarDays size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A99B8F]">
                    Account Created
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#382B26]">
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
                className="w-full rounded-xl bg-[#A95643] py-3 text-sm font-bold text-white shadow-md shadow-[#A95643]/15 transition hover:bg-[#8F493A]"
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
