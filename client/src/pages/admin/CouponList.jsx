
import { useState, useEffect, useCallback, useMemo } from "react";
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
      toast.error(
        error.response?.data?.message || "Failed to load coupons"
      );
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
        statusFilter === "All" ||
        coupon.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  // TOGGLE COUPON STATUS
  const handleStatusChange = async (coupon) => {
    const newStatus =
      coupon.status === "Active" ? "Inactive" : "Active";

    try {
      setUpdatingId(coupon._id);

      const response = await api.put(`/coupon/${coupon._id}`, {
        status: newStatus,
      });

      if (response.data?.success) {
        setCoupons((previous) =>
          previous.map((item) =>
            item._id === coupon._id
              ? { ...item, status: newStatus }
              : item
          )
        );

        toast.success(`Coupon ${newStatus.toLowerCase()} successfully`);
      }
    } catch (error) {
      console.error("Update coupon status error:", error);

      toast.error(
        error.response?.data?.message || "Failed to update coupon status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // DELETE COUPON
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this coupon? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const response = await api.delete(`/coupon/${id}`);

      if (response.data?.success) {
        setCoupons((previous) =>
          previous.filter((coupon) => coupon._id !== id)
        );

        toast.success("Coupon deleted successfully");
      }
    } catch (error) {
      console.error("Delete coupon error:", error);

      toast.error(
        error.response?.data?.message || "Failed to delete coupon"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // SUMMARY COUNTS
  const totalCoupons = coupons.length;

  const activeCoupons = coupons.filter(
    (coupon) => coupon.status === "Active"
  ).length;

  const inactiveCoupons = coupons.filter(
    (coupon) => coupon.status === "Inactive"
  ).length;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Coupon Management
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage discount coupons and their booking conditions.
          </p>
        </div>

        <button
          onClick={fetchCoupons}
          disabled={loading}
          className="px-4 py-2 border border-orange-400 text-orange-600 rounded-lg hover:bg-orange-50 transition disabled:opacity-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Total Coupons</p>
          <h2 className="text-2xl font-bold text-gray-800 mt-2">
            {totalCoupons}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Active Coupons</p>
          <h2 className="text-2xl font-bold text-green-600 mt-2">
            {activeCoupons}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Inactive Coupons</p>
          <h2 className="text-2xl font-bold text-gray-500 mt-2">
            {inactiveCoupons}
          </h2>
        </div>

      </div>

      {/* FILTER SECTION */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-5">

        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">

          {/* SEARCH */}
          <div className="w-full md:max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coupon code, space type, user type..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* STATUS FILTER */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">
              Status:
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-orange-400"
            >
              <option value="All">All Coupons</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

        </div>
      </div>

      {/* COUPON TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-semibold text-gray-800">
              Coupon List
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Showing {filteredCoupons.length} of {totalCoupons} coupons
            </p>
          </div>
        </div>

        {loading ? (

          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-9 h-9 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-3">
              Loading coupons...
            </p>
          </div>

        ) : filteredCoupons.length === 0 ? (

          <div className="text-center py-16 px-4">
            <div className="text-4xl mb-3">🎟️</div>

            <h3 className="font-semibold text-gray-700">
              No coupons found
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {search || statusFilter !== "All"
                ? "Try changing your search or filter."
                : "Create your first coupon to get started."}
            </p>
          </div>

        ) : (

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">

              <thead className="bg-orange-50 text-gray-700">
                <tr>
                  <th className="px-5 py-4 font-semibold">#</th>
                  <th className="px-5 py-4 font-semibold">Coupon Code</th>
                  <th className="px-5 py-4 font-semibold">Discount</th>
                  <th className="px-5 py-4 font-semibold">User Type</th>
                  <th className="px-5 py-4 font-semibold">Space Type</th>
                  <th className="px-5 py-4 font-semibold">Pack Type</th>
                  <th className="px-5 py-4 font-semibold">Price Range</th>
                  <th className="px-5 py-4 font-semibold">Valid From</th>
                  <th className="px-5 py-4 font-semibold">Valid To</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredCoupons.map((coupon, index) => (

                  <tr
                    key={coupon._id}
                    className="hover:bg-orange-50/40 transition"
                  >

                    <td className="px-5 py-4 text-gray-500">
                      {index + 1}
                    </td>

                    {/* COUPON CODE */}
                    <td className="px-5 py-4">
                      <span className="font-bold text-orange-600 tracking-wide">
                        {coupon.couponCode}
                      </span>
                    </td>

                    {/* DISCOUNT */}
                    <td className="px-5 py-4">
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
                        {coupon.discount}%
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {coupon.userType}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {coupon.spaceType}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {coupon.packType}
                    </td>

                    {/* PRICE RANGE */}
                    <td className="px-5 py-4 font-medium text-gray-700">
                      ₹{coupon.minimumPrice} - ₹{coupon.maximumPrice}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(coupon.validFrom)}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(coupon.validTo)}
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          coupon.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 ${
                            coupon.status === "Active"
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {updatingId === coupon._id
                            ? "Updating..."
                            : coupon.status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                        </button>

                        <button
                          onClick={() => handleDelete(coupon._id)}
                          disabled={
                            deletingId === coupon._id ||
                            updatingId === coupon._id
                          }
                          title="Delete coupon"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {deletingId === coupon._id
                            ? "Deleting..."
                            : "Delete"}
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
  );
};

export default CouponList;
