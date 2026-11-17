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

/* Tenant pages */
import TenantDashboard from "./pages/tenant/TenantDashboard";
import PropertyDetails from "./pages/tenant/PropertyDetails";
import RentStatus from "./pages/tenant/RentStatus";
import PaymentHistory from "./pages/tenant/PaymentHistory";
import PaymentReceipt from "./pages/tenant/PaymentReceipt";

/* Landlord / Customer pages */
import LandlordDashboard from "./pages/landloard/LandlordDashboard";
import PropertyList from "./pages/landloard/PropertyList";
import AddProperty from "./pages/landloard/AddProperty";
import TenantList from "./pages/landloard/TenantList";
import Payments from "./pages/landloard/Payments";
import Profile2 from "./pages/landloard/Profile2";
import CompanyProfile from "./pages/landloard/CompanyProfile";
import EditProperty from "./pages/landloard/EditProperty";
import AddTenant from "./pages/landloard/AddTenant";
import EditTenant from "./pages/landloard/EditTenant";
import UpdateTenantPassword from "./pages/landloard/UpdateTenantPassword";
import AssignTenant from "./pages/landloard/AssignTenant";
import AssignedTenants from "./pages/landloard/AssignedTenants";
import Reservations from "./pages/landloard/Reservations";

/* Admin pages */
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import AdminProperties from "./pages/admin/Properties";
import AdminPayments from "./pages/admin/Payments";
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

const App = () => {
  return (
    <>
      <Toaster />

      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Workspace selection */}
        <Route path="/book-space/:id" element={<BookSpace />} />

        {/* ================= TENANT ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["tenant"]} />}>
          <Route path="/tenant" element={<TenantLayout />}>
            <Route index element={<TenantDashboard />} />

            <Route path="property" element={<PropertyDetails />} />
            <Route path="rent" element={<RentStatus />} />
            <Route path="history" element={<PaymentHistory />} />
            <Route path="receipt" element={<PaymentReceipt />} />

            {/* <Route path="pay" element={<PaymentPage />} /> */}
          </Route>
        </Route>

        {/* ================= CUSTOMER ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          {/* Checkout */}
          <Route path="/checkout" element={<Checkout />} />

          {/* Customer layout */}
          <Route path="/customer" element={<LandlordLayout />}>
            {/* Default page */}
            <Route index element={<Navigate to="reservations" replace />} />

            <Route path="properties" element={<PropertyList />} />
            <Route path="add-property" element={<AddProperty />} />

            <Route path="property/edit/:id" element={<EditProperty />} />

            <Route
              path="property/:id/assign-tenant"
              element={<AssignTenant />}
            />

            <Route path="assigned-tenants" element={<AssignedTenants />} />

            <Route path="tenants" element={<TenantList />} />
            <Route path="add-tenant" element={<AddTenant />} />

            <Route path="tenant/edit/:id" element={<EditTenant />} />

            <Route
              path="tenant/password/:id"
              element={<UpdateTenantPassword />}
            />

            <Route path="payments" element={<Payments />} />

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
          </Route>
        </Route>

        {/* ================= ADMIN ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />

            <Route path="users" element={<Users />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="payments" element={<AdminPayments />} />

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

            {/* <Route path="reports" element={<AdminReports />} /> */}
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;
