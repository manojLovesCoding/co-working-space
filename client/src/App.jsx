import { Navigate, Route, Routes } from "react-router-dom";

import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./routes/ProtectedRoute";

import TenantLayout from "./layouts/TenantLayout";
import LandlordLayout from "./layouts/LandlordLayout";
import AdminLayout from "./layouts/AdminLayout";

/* Auth & Public Pages */
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import VirtualOfficePrices from "./pages/VirtualOfficePrices";

/* Customer / Landlord Pages */
import Profile2 from "./pages/landloard/Profile2";
import CompanyProfile from "./pages/landloard/CompanyProfile";
import Reservations from "./pages/landloard/Reservations";
import MyTeam from "./pages/landloard/MyTeam";
import InviteVisitor from "./pages/landloard/InviteVisitor";
import Visitors from "./pages/landloard/Visitors";
import MyVirtualOfficePurchases from "./pages/landloard/MyVirtualOfficePurchases";

/* Workspace Booking Pages */
import BookSpace from "./pages/BookSpace";
import Checkout from "./pages/Checkout";

/* Admin Pages */
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import AddSpaceMaster from "./pages/admin/AddSpaceMaster";
import SpaceMaster from "./pages/admin/SpaceMaster";
import AdminReservations from "./pages/admin/Adminreservations";
import AdminVisitors from "./pages/admin/Adminvisitors";
import AddCoupon from "./pages/admin/AddCoupon";
import CouponList from "./pages/admin/CouponList";
import InvoicePage from "./pages/admin/InvoicePage";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminOccupancyDashboard from "./pages/admin/AdminOccupancyDashboard";

/* Admin Team Management */
import TeamManagement from "./pages/admin/TeamManagement";

/* Virtual Office Admin Pages */
import VirtualOfficePrice from "./pages/admin/VirtualOfficePrice";
import VirtualOfficePurchases from "./pages/admin/VirtualOfficePurchases";

const App = () => {
  return (
    <>
      {/* React Hot Toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#382B26",
            color: "#FAF6EF",
            border: "1px solid #71392F",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "13px",
            fontWeight: "500",
          },
          success: {
            iconTheme: {
              primary: "#A8BDA5",
              secondary: "#382B26",
            },
          },
          error: {
            iconTheme: {
              primary: "#E57373",
              secondary: "#382B26",
            },
          },
        }}
      />

      {/* React Toastify */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastStyle={{
          background: "#FFFDFA",
          color: "#382B26",
          border: "1px solid #E9DED0",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: "500",
        }}
        progressStyle={{
          background: "#A95643",
        }}
      />

      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/virtual-office-prices"
          element={<VirtualOfficePrices />}
        />

        <Route path="/book-space/:id" element={<BookSpace />} />

        {/* ================= CUSTOMER ROUTES ================= */}

        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route path="/checkout" element={<Checkout />} />

          <Route path="/customer" element={<LandlordLayout />}>
            <Route index element={<Navigate to="reservations" replace />} />

            <Route path="reservations" element={<Reservations />} />

            <Route path="profile2" element={<Profile2 />} />

            <Route path="company-profile" element={<CompanyProfile />} />

            <Route path="invite-visitor" element={<InviteVisitor />} />

            <Route path="visitors" element={<Visitors />} />

            <Route path="my-team" element={<MyTeam />} />

            <Route
              path="invoice/:bookingId"
              element={<InvoicePage mode="customer" />}
            />

            <Route
              path="virtual-office-purchases"
              element={<MyVirtualOfficePurchases />}
            />
          </Route>
        </Route>

        {/* ================= ADMIN ROUTES ================= */}

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />

            {/* User Management */}
            <Route path="users" element={<Users />} />

            {/* Space Management */}
            <Route path="add-space-master" element={<AddSpaceMaster />} />

            <Route path="occupancy" element={<AdminOccupancyDashboard />} />

            <Route path="space-master-list" element={<SpaceMaster />} />

            {/* Booking Management */}
            <Route path="reservations" element={<AdminReservations />} />

            <Route path="visitors" element={<AdminVisitors />} />

            {/* Coupon Management */}
            <Route path="coupons" element={<AddCoupon />} />

            <Route path="coupon-list" element={<CouponList />} />

            {/* Team Management */}
            <Route path="team-management" element={<TeamManagement />} />

            {/* Invoice Management */}
            <Route path="invoices/:id" element={<InvoicePage mode="admin" />} />

            <Route path="invoices" element={<AdminInvoices />} />

            {/* Virtual Office Management */}
            <Route
              path="virtual-office-prices"
              element={<VirtualOfficePrice />}
            />

            <Route
              path="virtual-office-purchases"
              element={<VirtualOfficePurchases />}
            />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;
