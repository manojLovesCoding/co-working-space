import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import TenantLayout from "./layouts/TenantLayout";
import LandlordLayout from "./layouts/LandlordLayout";
import AdminLayout from "./layouts/AdminLayout";

/* Auth pages */
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import VirtualOfficePrices from "./pages/VirtualOfficePrices";

/* Landlord / Customer pages */
import Profile2 from "./pages/landloard/Profile2";
import CompanyProfile from "./pages/landloard/CompanyProfile";
import Reservations from "./pages/landloard/Reservations";

/* Admin pages */
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";

import AddSpaceMaster from "./pages/admin/AddSpaceMaster";
import SpaceMaster from "./pages/admin/SpaceMaster";

/* Team Management pages */
import TeamManagement from "./pages/admin/TeamManagement";
import MyTeam from "./pages/landloard/MyTeam";

/* Workspace booking pages */
import BookSpace from "./pages/BookSpace";
import Checkout from "./pages/Checkout";
import InviteVisitor from "./pages/landloard/InviteVisitor";
import Visitors from "./pages/landloard/Visitors";
import AdminReservations from "./pages/admin/Adminreservations";
import AdminVisitors from "./pages/admin/Adminvisitors";
import AddCoupon from "./pages/admin/AddCoupon";
import CouponList from "./pages/admin/CouponList";
import InvoicePage from "./pages/admin/InvoicePage";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminOccupancyDashboard from "./pages/admin/AdminOccupancyDashboard";
import VirtualOfficePrice from "./pages/admin/VirtualOfficePrice";
import MyVirtualOfficePurchases from "./pages/landloard/MyVirtualOfficePurchases";
import VirtualOfficePurchases from "./pages/admin/VirtualOfficePurchases";

const App = () => {
  return (
    <>
      <Toaster />

      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}

        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public Virtual Office Pricing */}
        <Route
          path="/virtual-office-prices"
          element={<VirtualOfficePrices />}
        />

        {/* Workspace selection */}
        <Route path="/book-space/:id" element={<BookSpace />} />

        {/* ================= CUSTOMER ROUTES ================= */}

        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          {/* Checkout */}
          <Route path="/checkout" element={<Checkout />} />

          {/* Customer layout */}
          <Route path="/customer" element={<LandlordLayout />}>
            <Route index element={<Navigate to="reservations" replace />} />

            <Route path="reservations" element={<Reservations />} />

            <Route path="profile2" element={<Profile2 />} />
            <Route path="company-profile" element={<CompanyProfile />} />

            <Route path="invite-visitor" element={<InviteVisitor />} />
            <Route path="visitors" element={<Visitors />} />

            {/* Customer Team - Read Only */}
            <Route path="my-team" element={<MyTeam />} />

            <Route
              path="/customer/invoice/:bookingId"
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

            <Route path="users" element={<Users />} />

            <Route path="add-space-master" element={<AddSpaceMaster />} />
            <Route path="occupancy" element={<AdminOccupancyDashboard />} />
            <Route path="space-master-list" element={<SpaceMaster />} />

            <Route path="reservations" element={<AdminReservations />} />
            <Route path="visitors" element={<AdminVisitors />} />

            <Route path="coupons" element={<AddCoupon />} />
            <Route path="coupon-list" element={<CouponList />} />

            {/* Team Management */}
            <Route path="team-management" element={<TeamManagement />} />

            <Route path="invoices/:id" element={<InvoicePage mode="admin" />} />
            <Route path="invoices" element={<AdminInvoices />} />

            {/* Admin Virtual Office Pricing */}
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
