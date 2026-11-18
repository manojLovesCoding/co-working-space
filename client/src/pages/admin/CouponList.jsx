import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Ticket,
  RefreshCw,
  Search,
  Tag,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Users,
  Building2,
  Clock3,
  IndianRupee,
  Percent,
  Trash2,
  Power,
  PowerOff,
  Filter,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axios.js";

const CouponList = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // GET ALL COUPONS
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/coupon");

      if (response.data?.success) {
        setCoupons(response.data.coupons || []);
      } else {
        toast.error("Failed to fetch coupons");
      }
    } catch (error) {
      console.error("Fetch coupons error:", error);
      toast.error(error.response?.data?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "-";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(date));
  };

  // FILTER COUPONS
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        coupon.couponCode?.toLowerCase().includes(searchText) ||
        coupon.spaceType?.toLowerCase().includes(searchText) ||
        coupon.userType?.toLowerCase().includes(searchText) ||
        coupon.packType?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || coupon.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  // TOGGLE COUPON STATUS
  const handleStatusChange = async (coupon) => {
    const newStatus = coupon.status === "Active" ? "Inactive" : "Active";

    try {
      setUpdatingId(coupon._id);

      const response = await api.put(`/coupon/${coupon._id}`, {
        status: newStatus,
      });

      if (response.data?.success) {
        setCoupons((previous) =>
          previous.map((item) =>
            item._id === coupon._id ? { ...item, status: newStatus } : item,
          ),
        );

        toast.success(`Coupon ${newStatus.toLowerCase()} successfully`);
      }
    } catch (error) {
      console.error("Update coupon status error:", error);

      toast.error(
        error.response?.data?.message || "Failed to update coupon status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // DELETE COUPON
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this coupon? This action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const response = await api.delete(`/coupon/${id}`);

      if (response.data?.success) {
        setCoupons((previous) =>
          previous.filter((coupon) => coupon._id !== id),
        );

        toast.success("Coupon deleted successfully");
      }
    } catch (error) {
      console.error("Delete coupon error:", error);

      toast.error(error.response?.data?.message || "Failed to delete coupon");
    } finally {
      setDeletingId(null);
    }
  };

  // SUMMARY COUNTS
  const totalCoupons = coupons.length;

  const activeCoupons = coupons.filter(
    (coupon) => coupon.status === "Active",
  ).length;

  const inactiveCoupons = coupons.filter(
    (coupon) => coupon.status === "Inactive",
  ).length;

  const summaryCards = [
    {
      title: "Total Coupons",
      value: totalCoupons,
      description: "All created coupons",
      icon: Ticket,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      valueColor: "text-slate-800",
    },
    {
      title: "Active Coupons",
      value: activeCoupons,
      description: "Currently enabled",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-600",
    },
    {
      title: "Inactive Coupons",
      value: inactiveCoupons,
      description: "Currently disabled",
      icon: XCircle,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-500",
      valueColor: "text-slate-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* PAGE HEADER */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 shadow-lg shadow-blue-200/60 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50">
                <Sparkles size={14} />
                Oorza Admin Panel
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Coupon Management
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
                Manage discount coupons, monitor their status, and control
                booking offers from one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:flex">
                <Ticket size={42} strokeWidth={1.5} className="text-white" />
              </div>

              <button
                onClick={fetchCoupons}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>

                    <h2
                      className={`mt-3 text-3xl font-bold tracking-tight ${card.valueColor}`}
                    >
                      {card.value}
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      {card.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
                  >
                    <Icon size={23} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FILTER SECTION */}
        <div className="mb-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Filter size={17} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Search & Filter
              </h2>
              <p className="text-xs text-slate-400">
                Find coupons using code, space, user type, or status.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* SEARCH */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search coupon code, space type, user type..."
                className="w-full rounded-xl border border-blue-100 bg-[#F8FBFF] py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="relative w-full lg:w-56">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-blue-100 bg-[#F8FBFF] px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="All">All Coupons</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {(search || statusFilter !== "All") && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Showing results for your selected filters.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                }}
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* COUPON TABLE CARD */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          {/* TABLE HEADER */}
          <div className="flex flex-col gap-3 border-b border-blue-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Tag size={19} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">Coupon List</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Showing {filteredCoupons.length} of {totalCoupons} coupons
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:self-auto">
              <Ticket size={14} />
              {filteredCoupons.length} Results
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading coupons...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Please wait while we fetch your data.
              </p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                <Ticket size={32} strokeWidth={1.5} />
              </div>

              <h3 className="font-bold text-slate-800">No coupons found</h3>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                {search || statusFilter !== "All"
                  ? "No coupons match your search or selected filter. Try changing your search criteria."
                  : "There are no coupons available yet. Create your first coupon to get started."}
              </p>

              {(search || statusFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                  }}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            /* TABLE */
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="bg-[#F0F7FF] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-bold">#</th>
                    <th className="px-5 py-4 font-bold">Coupon Code</th>
                    <th className="px-5 py-4 font-bold">Discount</th>
                    <th className="px-5 py-4 font-bold">User Type</th>
                    <th className="px-5 py-4 font-bold">Space Type</th>
                    <th className="px-5 py-4 font-bold">Pack Type</th>
                    <th className="px-5 py-4 font-bold">Price Range</th>
                    <th className="px-5 py-4 font-bold">Valid From</th>
                    <th className="px-5 py-4 font-bold">Valid To</th>
                    <th className="px-5 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 text-center font-bold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-blue-50">
                  {filteredCoupons.map((coupon, index) => (
                    <tr
                      key={coupon._id}
                      className="transition hover:bg-[#F5F9FF]"
                    >
                      {/* INDEX */}
                      <td className="px-5 py-4 text-slate-400">{index + 1}</td>

                      {/* COUPON CODE */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Ticket size={16} />
                          </div>

                          <span className="font-bold tracking-wide text-blue-700">
                            {coupon.couponCode}
                          </span>
                        </div>
                      </td>

                      {/* DISCOUNT */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 font-bold text-blue-700">
                          {coupon.discount}
                          <Percent size={13} />
                        </span>
                      </td>

                      {/* USER TYPE */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users size={15} className="text-slate-400" />
                          {coupon.userType}
                        </div>
                      </td>

                      {/* SPACE TYPE */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building2 size={15} className="text-slate-400" />
                          {coupon.spaceType}
                        </div>
                      </td>

                      {/* PACK TYPE */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock3 size={15} className="text-slate-400" />
                          {coupon.packType}
                        </div>
                      </td>

                      {/* PRICE RANGE */}
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1">
                          <IndianRupee size={14} className="text-slate-400" />
                          {coupon.minimumPrice} - ₹{coupon.maximumPrice}
                        </div>
                      </td>

                      {/* VALID FROM */}
                      <td className="px-5 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-slate-400" />
                          {formatDate(coupon.validFrom)}
                        </div>
                      </td>

                      {/* VALID TO */}
                      <td className="px-5 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-slate-400" />
                          {formatDate(coupon.validTo)}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            coupon.status === "Active"
                              ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              coupon.status === "Active"
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {coupon.status}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStatusChange(coupon)}
                            disabled={
                              updatingId === coupon._id ||
                              deletingId === coupon._id
                            }
                            title={
                              coupon.status === "Active"
                                ? "Deactivate coupon"
                                : "Activate coupon"
                            }
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              coupon.status === "Active"
                                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {updatingId === coupon._id ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                Updating
                              </>
                            ) : coupon.status === "Active" ? (
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

                          <button
                            onClick={() => handleDelete(coupon._id)}
                            disabled={
                              deletingId === coupon._id ||
                              updatingId === coupon._id
                            }
                            title="Delete coupon"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === coupon._id ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                Deleting
                              </>
                            ) : (
                              <>
                                <Trash2 size={13} />
                                Delete
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
          {!loading && filteredCoupons.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-blue-100 bg-[#F8FBFF] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Displaying{" "}
                <span className="font-semibold text-slate-700">
                  {filteredCoupons.length}
                </span>{" "}
                coupon(s)
              </p>

              <p className="text-xs text-slate-400">
                Manage coupon availability using the actions in each row.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponList;
