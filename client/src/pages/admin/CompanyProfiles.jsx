import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  RefreshCw,
  Users,
  Mail,
  Phone,
  Eye,
  X,
  CalendarDays,
  MapPin,
  FileText,
  Image as ImageIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Globe,
  Hash,
} from "lucide-react";

import toast from "react-hot-toast";
import api from "../../api/axios.js";

const ITEMS_PER_PAGE = 10;

const CompanyProfiles = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [logoFilter, setLogoFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedCompany, setSelectedCompany] = useState(null);

  // ==========================================
  // FETCH COMPANY PROFILES
  // ==========================================

  const fetchCompanies = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get("/company/admin/all");

      if (res.data.success) {
        setCompanies(res.data.companies || []);
      } else {
        throw new Error(
          res.data.message || "Failed to fetch company profiles.",
        );
      }
    } catch (error) {
      console.error("Failed to fetch company profiles:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch company profiles.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // ==========================================
  // FILTER COMPANY PROFILES
  // ==========================================

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const searchValue = search.toLowerCase().trim();
      const customer = company.createdBy || {};

      const matchesSearch =
        company.companyName?.toLowerCase().includes(searchValue) ||
        company.gstNo?.toLowerCase().includes(searchValue) ||
        company.email?.toLowerCase().includes(searchValue) ||
        company.contact?.toLowerCase().includes(searchValue) ||
        company.address?.toLowerCase().includes(searchValue) ||
        customer.name?.toLowerCase().includes(searchValue) ||
        customer.email?.toLowerCase().includes(searchValue) ||
        customer.phone?.toLowerCase().includes(searchValue);

      const matchesLogo =
        logoFilter === "all" ||
        (logoFilter === "with-logo" && Boolean(company.logo)) ||
        (logoFilter === "without-logo" && !company.logo);

      return matchesSearch && matchesLogo;
    });
  }, [companies, search, logoFilter]);

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);

  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCompanies, currentPage]);

  const startRecord =
    filteredCompanies.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredCompanies.length,
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

  const handleLogoFilterChange = (value) => {
    setLogoFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setLogoFilter("all");
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

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalWithLogo = companies.filter((company) => company.logo).length;

  const totalWithoutLogo = companies.length - totalWithLogo;

  const linkedCustomers = companies.filter(
    (company) => company.createdBy?._id,
  ).length;

  // ==========================================
  // STYLING
  // ==========================================

  const inputClass =
    "w-full rounded-xl border border-[#E9DED0] bg-[#FAF6EF] px-4 py-3 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8F] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10";

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
          {filteredCompanies.length}
        </span>{" "}
        companies
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
  // COMPANY DETAIL ITEM
  // ==========================================

  const DetailItem = ({ icon, label, value }) => (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 shrink-0 text-[#A95643]">{icon}</div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#A99B8F]">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-[#382B26]">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );

  // ==========================================
  // COMPANY DETAILS MODAL
  // ==========================================

  const CompanyDetailsModal = ({ company, onClose }) => {
    if (!company) return null;

    const customer = company.createdBy || {};

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#382B26]/60 p-3 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* MODAL HEADER */}

          <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#71392F] to-[#A95643] px-5 py-5 text-white">
            <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[20px] border-white/10" />

            <div className="relative flex items-start justify-between">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Building2 size={21} />
                </div>

                <h2 className="text-xl font-bold">Company Details</h2>

                <p className="mt-1 text-sm text-[#F5DFD5]">
                  Complete company profile information.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          <div className="space-y-5 p-5">
            {/* COMPANY IDENTITY */}

            <div className="flex flex-col items-center rounded-2xl border border-[#E9DED0] bg-[#FAF6EF] p-6 text-center">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.companyName || "Company logo"}
                  className="h-24 w-24 rounded-2xl border border-[#E9DED0] bg-white object-contain p-2 shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A95643] to-[#71392F] text-white shadow-sm">
                  <Building2 size={38} />
                </div>
              )}

              <h3 className="mt-4 text-xl font-bold text-[#382B26]">
                {company.companyName || "Unnamed Company"}
              </h3>

              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#F8EDE6] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#A95643] ring-1 ring-[#E9CFC3]">
                <ShieldCheck size={13} />
                Registered Company
              </span>
            </div>

            {/* COMPANY INFORMATION */}

            <section className="rounded-2xl border border-[#E9DED0] bg-white p-4">
              <div className="mb-4 flex items-center gap-2 border-b border-[#F0E8DE] pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                  <Building2 size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#382B26]">
                    Company Information
                  </h3>
                  <p className="text-xs text-[#A99B8F]">
                    Registered business details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailItem
                  icon={<Building2 size={17} />}
                  label="Company Name"
                  value={company.companyName}
                />

                <DetailItem
                  icon={<Hash size={17} />}
                  label="GST Number"
                  value={company.gstNo}
                />

                <DetailItem
                  icon={<Mail size={17} />}
                  label="Company Email"
                  value={company.email}
                />

                <DetailItem
                  icon={<Phone size={17} />}
                  label="Company Contact"
                  value={company.contact}
                />

                <div className="sm:col-span-2">
                  <DetailItem
                    icon={<MapPin size={17} />}
                    label="Company Address"
                    value={company.address}
                  />
                </div>

                <DetailItem
                  icon={<CalendarDays size={17} />}
                  label="Registration Date"
                  value={formatDate(company.createdAt)}
                />
              </div>
            </section>

            {/* CUSTOMER INFORMATION */}

            <section className="rounded-2xl border border-[#E9DED0] bg-white p-4">
              <div className="mb-4 flex items-center gap-2 border-b border-[#F0E8DE] pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5EFE7] text-[#8A6651]">
                  <Users size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#382B26]">
                    Associated Customer
                  </h3>
                  <p className="text-xs text-[#A99B8F]">
                    Customer who created this company profile
                  </p>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#FAF6EF] p-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#A95643] to-[#71392F] text-sm font-bold text-white">
                  {getInitials(customer.name) || <Users size={19} />}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#382B26]">
                    {customer.name || "Customer unavailable"}
                  </p>

                  <p className="text-xs text-[#A99B8F]">Registered customer</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailItem
                  icon={<Mail size={17} />}
                  label="Customer Email"
                  value={customer.email}
                />

                <DetailItem
                  icon={<Phone size={17} />}
                  label="Customer Phone"
                  value={customer.phone}
                />
              </div>

              {!customer._id && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  <AlertCircle size={16} className="shrink-0" />
                  Associated customer information is unavailable.
                </div>
              )}
            </section>

            {/* LOGO INFORMATION */}

            <section className="flex items-center justify-between gap-3 rounded-xl border border-[#E9DED0] bg-[#FAF6EF] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#A95643]">
                  <ImageIcon size={18} />
                </div>

                <div>
                  <p className="text-xs font-bold text-[#382B26]">
                    Company Logo
                  </p>
                  <p className="mt-0.5 text-xs text-[#A99B8F]">
                    {company.logo
                      ? "Logo uploaded successfully"
                      : "No company logo uploaded"}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
                  company.logo
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-[#F0E8DE] text-[#8F8175]"
                }`}
              >
                {company.logo ? "Available" : "Not Available"}
              </span>
            </section>
          </div>

          {/* MODAL FOOTER */}

          <div className="border-t border-[#E9DED0] bg-[#FBF3ED] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#A95643] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#71392F]"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // LOADING STATE
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

          <div className="h-28 rounded-2xl bg-white shadow-sm" />

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

  // ==========================================
  // MAIN UI
  // ==========================================

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
                Company Profiles
              </h1>

              <p className="mt-2 max-w-lg text-sm leading-6 text-[#F5DFD5]">
                View and manage registered company profiles, verify business
                information, and monitor customer company registrations.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#F5DFD5]">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <ShieldCheck size={14} />
                  Secure administration
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <Building2 size={14} />
                  Centralized company directory
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-3 gap-2">
                <div className="min-w-[76px] rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm">
                  <p className="text-xl font-bold">{companies.length}</p>
                  <p className="mt-1 text-[10px] font-medium text-[#F5DFD5]">
                    Total
                  </p>
                </div>

                <div className="min-w-[76px] rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm">
                  <p className="text-xl font-bold text-emerald-200">
                    {totalWithLogo}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-[#F5DFD5]">
                    With Logo
                  </p>
                </div>

                <div className="min-w-[76px] rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm">
                  <p className="text-xl font-bold text-amber-200">
                    {totalWithoutLogo}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-[#F5DFD5]">
                    No Logo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchCompanies(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FAF6EF] px-5 py-3 text-sm font-bold text-[#71392F] shadow-md transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </section>

        {/* OVERVIEW CARDS */}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {/* TOTAL COMPANIES */}

          <div className="rounded-2xl border border-[#E9DED0] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                <Building2 size={20} />
              </div>

              <span className="rounded-full bg-[#F8EDE6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#A95643]">
                All profiles
              </span>
            </div>

            <p className="mt-3 text-sm font-medium text-[#8F8175]">
              Total Companies
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-[#382B26]">
              {companies.length}
            </p>

            <p className="mt-1 text-xs text-[#A99B8F]">
              Registered company profiles
            </p>
          </div>

          {/* WITH LOGO */}

          <div className="rounded-2xl border border-[#DCE8DC] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ImageIcon size={20} />
            </div>

            <p className="mt-3 text-sm font-medium text-[#8F8175]">
              Logo Uploaded
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600">
              {totalWithLogo}
            </p>

            <p className="mt-1 text-xs text-[#A99B8F]">Companies with a logo</p>
          </div>

          {/* WITHOUT LOGO */}

          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileText size={20} />
            </div>

            <p className="mt-3 text-sm font-medium text-[#8F8175]">
              Logo Missing
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600">
              {totalWithoutLogo}
            </p>

            <p className="mt-1 text-xs text-[#A99B8F]">
              Companies without a logo
            </p>
          </div>

          {/* LINKED CUSTOMERS */}

          <div className="rounded-2xl border border-[#E9DED0] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EFE7] text-[#8A6651]">
              <Users size={20} />
            </div>

            <p className="mt-3 text-sm font-medium text-[#8F8175]">
              Linked Customers
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-[#71392F]">
              {linkedCustomers}
            </p>

            <p className="mt-1 text-xs text-[#A99B8F]">
              Associated customer accounts
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
              <h2 className="text-sm font-bold text-[#382B26]">
                Find Companies
              </h2>

              <p className="text-xs text-[#A99B8F]">
                Search and filter registered company profiles
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
                placeholder="Search company, GST, email, phone or customer..."
                className="w-full rounded-xl border border-[#E9DED0] bg-[#FAF6EF] py-3 pl-11 pr-4 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99B8F] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10"
              />
            </div>

            <select
              value={logoFilter}
              onChange={(e) => handleLogoFilterChange(e.target.value)}
              className="rounded-xl border border-[#E9DED0] bg-[#FAF6EF] px-4 py-3 text-sm font-medium text-[#71645B] outline-none transition focus:border-[#A95643] focus:ring-4 focus:ring-[#A95643]/10"
            >
              <option value="all">All Companies</option>
              <option value="with-logo">With Logo</option>
              <option value="without-logo">Without Logo</option>
            </select>

            {(search || logoFilter !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
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
                {filteredCompanies.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#382B26]">
                {companies.length}
              </span>{" "}
              companies
            </p>

            <button
              type="button"
              onClick={() => fetchCompanies(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#A95643] transition hover:bg-[#F8EDE6] disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh List
            </button>
          </div>
        </section>

        {/* DESKTOP TABLE */}

        <section className="hidden overflow-hidden rounded-2xl border border-[#E9DED0] bg-white shadow-sm md:block">
          <div className="flex flex-col gap-2 border-b border-[#F0E8DE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#382B26]">
                All Company Profiles
              </h2>

              <p className="mt-1 text-xs text-[#A99B8F]">
                View registered company and customer information
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-[#F8EDE6] px-3 py-1.5 text-xs font-semibold text-[#A95643]">
              <Building2 size={14} />
              {filteredCompanies.length} Records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b border-[#F0E8DE] bg-[#FBF3ED]">
                  {[
                    "Company",
                    "GST Number",
                    "Contact Information",
                    "Customer",
                    "Registration Date",
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
                {paginatedCompanies.length > 0 ? (
                  paginatedCompanies.map((company) => {
                    const customer = company.createdBy || {};

                    return (
                      <tr
                        key={company._id}
                        className="transition hover:bg-[#FFFDFA]"
                      >
                        {/* COMPANY */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {company.logo ? (
                              <img
                                src={company.logo}
                                alt={company.companyName || "Company"}
                                className="h-11 w-11 shrink-0 rounded-xl border border-[#E9DED0] bg-white object-contain p-1"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#A95643] to-[#71392F] text-white">
                                <Building2 size={21} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="max-w-[190px] truncate text-sm font-bold text-[#382B26]">
                                {company.companyName || "—"}
                              </p>

                              <p className="mt-1 max-w-[190px] truncate text-[10px] text-[#A99B8F]">
                                {company.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* GST */}

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-[#F8EDE6] px-2.5 py-1.5 text-xs font-bold text-[#A95643]">
                            {company.gstNo || "—"}
                          </span>
                        </td>

                        {/* CONTACT */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#71645B]">
                            <Phone
                              size={13}
                              className="shrink-0 text-[#A95643]"
                            />
                            {company.contact || "—"}
                          </div>

                          <div className="mt-1.5 flex max-w-[200px] items-center gap-2 text-xs text-[#A99B8F]">
                            <MapPin size={13} className="shrink-0" />
                            <span className="truncate">
                              {company.address || "No address"}
                            </span>
                          </div>
                        </td>

                        {/* CUSTOMER */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5EFE7] text-[10px] font-bold text-[#8A6651]">
                              {getInitials(customer.name) || (
                                <Users size={14} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[160px] truncate text-sm font-bold text-[#382B26]">
                                {customer.name || "Unavailable"}
                              </p>

                              <p className="mt-1 max-w-[160px] truncate text-[10px] text-[#A99B8F]">
                                {customer.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* DATE */}

                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2 text-xs font-medium text-[#71645B]">
                            <CalendarDays
                              size={14}
                              className="text-[#A95643]"
                            />
                            {formatDate(company.createdAt)}
                          </div>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedCompany(company)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9DED0] bg-[#FAF6EF] px-3 py-2 text-xs font-bold text-[#A95643] transition hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                            >
                              <Eye size={14} />
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                        <Building2 size={23} />
                      </div>

                      <p className="mt-3 font-bold text-[#382B26]">
                        No companies found
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

          {filteredCompanies.length > 0 && <Pagination />}
        </section>

        {/* MOBILE COMPANY CARDS */}

        <section className="space-y-3 md:hidden">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-[#382B26]">All Companies</h2>

            <span className="text-xs font-semibold text-[#8F8175]">
              {filteredCompanies.length} Records
            </span>
          </div>

          {paginatedCompanies.length > 0 ? (
            paginatedCompanies.map((company) => {
              const customer = company.createdBy || {};

              return (
                <div
                  key={company._id}
                  className="rounded-2xl border border-[#E9DED0] bg-white p-4 shadow-sm"
                >
                  {/* COMPANY HEADER */}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={company.companyName || "Company"}
                          className="h-12 w-12 shrink-0 rounded-xl border border-[#E9DED0] bg-white object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#A95643] to-[#71392F] text-white">
                          <Building2 size={22} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-[#382B26]">
                          {company.companyName || "Unnamed Company"}
                        </h3>

                        <p className="mt-1 truncate text-xs text-[#A99B8F]">
                          {company.gstNo || "GST not provided"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        company.logo
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {company.logo ? "Logo Added" : "No Logo"}
                    </span>
                  </div>

                  {/* COMPANY DETAILS */}

                  <div className="mt-4 space-y-3 rounded-xl bg-[#FAF6EF] p-3">
                    <div className="flex items-center gap-2 text-sm text-[#71645B]">
                      <Mail size={14} className="shrink-0 text-[#A95643]" />
                      <span className="truncate">
                        {company.email || "Email not provided"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#71645B]">
                      <Phone size={14} className="shrink-0 text-[#A95643]" />
                      {company.contact || "Contact not provided"}
                    </div>

                    <div className="flex items-start gap-2 text-sm text-[#71645B]">
                      <MapPin
                        size={14}
                        className="mt-0.5 shrink-0 text-[#A95643]"
                      />
                      <span className="line-clamp-2">
                        {company.address || "Address not provided"}
                      </span>
                    </div>
                  </div>

                  {/* CUSTOMER DETAILS */}

                  <div className="mt-3 flex items-center gap-3 border-t border-[#F0E8DE] pt-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE7] text-xs font-bold text-[#8A6651]">
                      {getInitials(customer.name) || <Users size={16} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#A99B8F]">
                        Associated Customer
                      </p>

                      <p className="mt-0.5 truncate text-sm font-bold text-[#382B26]">
                        {customer.name || "Customer unavailable"}
                      </p>

                      <p className="truncate text-xs text-[#A99B8F]">
                        {customer.email || "No email"}
                      </p>
                    </div>
                  </div>

                  {/* DATE */}

                  <div className="mt-3 flex items-center gap-2 text-xs text-[#8F8175]">
                    <CalendarDays size={14} className="text-[#A95643]" />
                    Registered: {formatDate(company.createdAt)}
                  </div>

                  {/* ACTION */}

                  <button
                    type="button"
                    onClick={() => setSelectedCompany(company)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E9DED0] bg-[#FAF6EF] py-2.5 text-xs font-bold text-[#A95643] transition hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                  >
                    <Eye size={14} />
                    View Company Details
                  </button>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-[#E9DED0] bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                <Search size={22} />
              </div>

              <h3 className="mt-3 font-bold text-[#382B26]">
                No companies found
              </h3>

              <p className="mt-1 text-sm text-[#8F8175]">
                Try changing your search or filters.
              </p>
            </div>
          )}

          {filteredCompanies.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-[#E9DED0] bg-white">
              <Pagination />
            </div>
          )}
        </section>
      </div>

      {/* COMPANY DETAILS MODAL */}

      {selectedCompany && (
        <CompanyDetailsModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
};

export default CompanyProfiles;
