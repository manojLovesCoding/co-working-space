
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
  CalendarRange,
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
    if (deletingId !== null || updatingId !== null) return;

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
      } else {
        toast.error(
          response.data?.message || "Failed to update coupon status",
        );
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

  // DELETE COUPON - SHOW CONFIRMATION TOAST
  const handleDelete = (id) => {
    if (deletingId !== null || updatingId !== null) return;

    toast(
      ({ closeToast }) => (
        <div
          className="flex flex-col gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div>
            <p className="text-sm font-semibold text-[#382B26]">
              Delete this coupon?
            </p>

            <p className="mt-1 text-xs text-[#8F8175]">
              This action cannot be undone.
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

                // Start deletion before closing the toast
                void confirmDelete(id);
                closeToast();
              }}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Delete
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

  // CONFIRM DELETE - CALL DELETE API
  const confirmDelete = async (id) => {
    if (deletingId !== null || updatingId !== null) return;

    try {
      setDeletingId(id);

      const response = await api.delete(`/coupon/${id}`);

      if (response.data?.success) {
        setCoupons((previous) =>
          previous.filter((coupon) => coupon._id !== id),
        );

        toast.success("Coupon deleted successfully");
      } else {
        toast.error(
          response.data?.message || "Failed to delete coupon",
        );
      }
    } catch (error) {
      console.error("Delete coupon error:", error);

      toast.error(
        error.response?.data?.message || "Failed to delete coupon",
      );
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
      iconBg: "bg-[#F8EDE6]",
      iconColor: "text-[#A95643]",
      valueColor: "text-[#382B26]",
    },
    {
      title: "Active Coupons",
      value: activeCoupons,
      description: "Currently enabled",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
    },
    {
      title: "Inactive Coupons",
      value: inactiveCoupons,
      description: "Currently disabled",
      icon: XCircle,
      iconBg: "bg-[#F2EDE7]",
      iconColor: "text-[#8F8175]",
      valueColor: "text-[#8F8175]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-3 sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1500px]">

        {/* PAGE HEADER */}
        <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#C9826C] p-5 shadow-md shadow-[#71392F]/10 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                <Sparkles size={13} />
                Oorza Admin Panel
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Coupon Management
              </h1>

              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/80">
                Manage discount coupons, monitor their status, and control
                booking offers from one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden h-16 w-16 items-center justify-center rounded-xl border border-white/20 bg-white/10 sm:flex">
                <Ticket size={34} strokeWidth={1.5} className="text-white" />
              </div>

              <button
                onClick={fetchCoupons}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#8F8175]">
                      {card.title}
                    </p>

                    <h2
                      className={`mt-2 text-3xl font-bold tracking-tight ${card.valueColor}`}
                    >
                      {card.value}
                    </h2>

                    <p className="mt-1 text-xs text-[#A99A8D]">
                      {card.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
                  >
                    <Icon size={21} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FILTER SECTION */}
        <div className="mb-4 rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
              <Filter size={16} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#382B26]">
                Search & Filter
              </h2>
              <p className="text-xs text-[#A99A8D]">
                Find coupons using code, space, user type, or status.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* SEARCH */}
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A99A8D]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search coupon code, space type, user type..."
                className="w-full rounded-xl border border-[#E9DED0] bg-[#FBF3ED] py-2.5 pl-10 pr-3.5 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99A8D] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="relative w-full lg:w-56">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#E9DED0] bg-[#FBF3ED] px-3.5 py-2.5 pr-9 text-sm font-medium text-[#382B26] outline-none transition focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10"
              >
                <option value="All">All Coupons</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8F8175]"
              />
            </div>
          </div>

          {(search || statusFilter !== "All") && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#8F8175]">
                Showing results for your selected filters.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                }}
                className="text-xs font-semibold text-[#A95643] transition hover:text-[#71392F]"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* COUPON TABLE CARD */}
        <div className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">

          {/* TABLE HEADER */}
          <div className="flex flex-col gap-3 border-b border-[#E9DED0] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                <Tag size={18} />
              </div>

              <div>
                <h2 className="font-bold text-[#382B26]">Coupon List</h2>
                <p className="mt-0.5 text-xs text-[#8F8175]">
                  Showing {filteredCoupons.length} of {totalCoupons} coupons
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full bg-[#F8EDE6] px-3 py-1.5 text-xs font-semibold text-[#71392F] sm:self-auto">
              <Ticket size={13} />
              {filteredCoupons.length} Results
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#E9DED0] border-t-[#A95643]" />
              <p className="mt-3 text-sm font-medium text-[#6F5D52]">
                Loading coupons...
              </p>
              <p className="mt-1 text-xs text-[#A99A8D]">
                Please wait while we fetch your data.
              </p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                <Ticket size={29} strokeWidth={1.5} />
              </div>

              <h3 className="font-bold text-[#382B26]">No coupons found</h3>

              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[#8F8175]">
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
                  className="mt-4 rounded-lg bg-[#A95643] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#71392F]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            /* SIMPLIFIED TABLE */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#FBF3ED] text-[11px] uppercase tracking-wide text-[#8F8175]">
                  <tr>
                    <th className="w-12 px-4 py-3 font-bold">#</th>
                    <th className="px-4 py-3 font-bold">Coupon</th>
                    <th className="px-4 py-3 font-bold">Discount</th>
                    <th className="px-4 py-3 font-bold">Applies To</th>
                    <th className="px-4 py-3 font-bold">Price Range</th>
                    <th className="px-4 py-3 font-bold">Validity</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 text-center font-bold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0E7DD]">
                  {filteredCoupons.map((coupon, index) => (
                    <tr
                      key={coupon._id}
                      className="transition hover:bg-[#FBF6F0]"
                    >
                      {/* INDEX */}
                      <td className="px-4 py-3 text-[#A99A8D]">
                        {index + 1}
                      </td>

                      {/* COUPON */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                            <Ticket size={16} />
                          </div>

                          <div>
                            <p className="font-bold tracking-wide text-[#71392F]">
                              {coupon.couponCode}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#A99A8D]">
                              Coupon code
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DISCOUNT */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#E9CFC2] bg-[#F8EDE6] px-3 py-1.5 font-bold text-[#A95643]">
                          {coupon.discount}
                          <Percent size={12} />
                        </span>
                      </td>

                      {/* APPLIES TO */}
                      <td className="px-4 py-3">
                        <div className="min-w-[190px] space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#382B26]">
                            <Building2
                              size={13}
                              className="shrink-0 text-[#A95643]"
                            />
                            <span>{coupon.spaceType || "-"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#8F8175]">
                            <Users
                              size={13}
                              className="shrink-0 text-[#A99A8D]"
                            />
                            <span>{coupon.userType || "-"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#8F8175]">
                            <Clock3
                              size={13}
                              className="shrink-0 text-[#A99A8D]"
                            />
                            <span>{coupon.packType || "-"}</span>
                          </div>
                        </div>
                      </td>

                      {/* PRICE RANGE */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 whitespace-nowrap font-semibold text-[#6F5D52]">
                          <IndianRupee size={14} className="text-[#A95643]" />
                          {coupon.minimumPrice} - {coupon.maximumPrice}
                        </div>
                        <p className="mt-1 text-[11px] text-[#A99A8D]">
                          Booking price
                        </p>
                      </td>

                      {/* VALIDITY */}
                      <td className="px-4 py-3">
                        <div className="min-w-[145px] space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-[#6F5D52]">
                            <CalendarDays
                              size={13}
                              className="shrink-0 text-[#A95643]"
                            />
                            <span>{formatDate(coupon.validFrom)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#8F8175]">
                            <CalendarRange
                              size={13}
                              className="shrink-0 text-[#A99A8D]"
                            />
                            <span>{formatDate(coupon.validTo)}</span>
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                            coupon.status === "Active"
                              ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border border-[#E9DED0] bg-[#F2EDE7] text-[#8F8175]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              coupon.status === "Active"
                                ? "bg-emerald-500"
                                : "bg-[#A99A8D]"
                            }`}
                          />
                          {coupon.status}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(coupon)}
                            disabled={
                              updatingId !== null || deletingId !== null
                            }
                            title={
                              coupon.status === "Active"
                                ? "Deactivate coupon"
                                : "Activate coupon"
                            }
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              coupon.status === "Active"
                                ? "bg-[#F2EDE7] text-[#6F5D52] hover:bg-[#E9DED0]"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {updatingId === coupon._id ? (
                              <>
                                <RefreshCw size={12} className="animate-spin" />
                                Updating
                              </>
                            ) : coupon.status === "Active" ? (
                              <>
                                <PowerOff size={12} />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power size={12} />
                                Activate
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(coupon._id)}
                            disabled={
                              deletingId !== null || updatingId !== null
                            }
                            title="Delete coupon"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === coupon._id ? (
                              <>
                                <RefreshCw size={12} className="animate-spin" />
                                Deleting
                              </>
                            ) : (
                              <>
                                <Trash2 size={12} />
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
            <div className="flex flex-col gap-2 border-t border-[#E9DED0] bg-[#FBF3ED] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#8F8175]">
                Displaying{" "}
                <span className="font-semibold text-[#382B26]">
                  {filteredCoupons.length}
                </span>{" "}
                coupon(s)
              </p>

              <p className="text-xs text-[#A99A8D]">
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
