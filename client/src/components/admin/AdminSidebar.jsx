import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  UserRound,
  FileText,
  Plus,
  Building2,
  CalendarDays,
  Contact,
  ChartNoAxesColumn,
  TicketPercent,
  IndianRupee,
  ShoppingCart,
  LogOut,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";

const AdminSidebar = ({ collapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      path: "",
      icon: LayoutDashboard,
      description: "Overview",
    },
    {
      label: "Users",
      path: "users",
      icon: Users,
      description: "Manage users",
    },
    {
      label: "Team Management",
      path: "team-management",
      icon: UserRound,
      description: "Manage customer teams",
    },
    {
      label: "Company Profiles",
      path: "company-profiles",
      icon: BriefcaseBusiness,
      description: "Manage company profiles",
    },
    {
      label: "Invoices",
      path: "invoices",
      icon: FileText,
      description: "Manage invoices",
    },
    {
      label: "Add Space Master",
      path: "add-space-master",
      icon: Plus,
      description: "Add new space",
    },
    {
      label: "Space Master List",
      path: "space-master-list",
      icon: Building2,
      description: "Manage spaces",
    },
    {
      label: "Reservations",
      path: "reservations",
      icon: CalendarDays,
      description: "Manage reservations",
    },
    {
      label: "Visitors",
      path: "visitors",
      icon: Contact,
      description: "Manage visitors",
    },
    {
      label: "Occupancy",
      path: "occupancy",
      icon: ChartNoAxesColumn,
      description: "Monitor workspace occupancy",
    },
    {
      label: "Coupons",
      path: "coupons",
      icon: TicketPercent,
      description: "Create and manage coupons",
    },
    {
      label: "Coupon List",
      path: "coupon-list",
      icon: FileText,
      description: "View all coupons",
    },
    {
      label: "Virtual Office Prices",
      path: "virtual-office-prices",
      icon: IndianRupee,
      description: "Manage virtual office pricing",
    },
    {
      label: "Virtual Office Purchases",
      path: "virtual-office-purchases",
      icon: ShoppingCart,
      description: "Manage customer plan purchases",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => setOpen(false);

  return (
    <>
      {/* MOBILE TOP BAR */}
      <header className="print:hidden fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b border-[#E9DED0] bg-[#FFFDFA]/95 px-3 shadow-sm backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#71392F] transition hover:bg-[#F1DFD5]"
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>

        <div className="ml-3 flex min-w-0 items-center gap-2">
          <img
            src="/oorza-logo.png"
            alt="Oorza"
            className="h-11 w-auto max-w-[150px] object-contain"
          />

          <div className="border-l border-[#E9DED0] pl-2">
            <p className="text-sm font-bold text-[#382B26]">Admin Panel</p>
            <p className="text-[10px] text-[#8F8175]">Oorza Management</p>
          </div>
        </div>
      </header>

      {/* MOBILE OVERLAY */}
      {open && (
        <div
          onClick={closeMobileMenu}
          className="print:hidden fixed inset-0 z-40 bg-[#382B26]/50 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          print:hidden fixed left-0 top-0 z-50 flex h-screen
          flex-col overflow-hidden border-r border-[#E9DED0]
          bg-[#FFFDFA] shadow-xl shadow-[#382B26]/10
          transition-all duration-300 ease-in-out
          md:z-30 md:translate-x-0 md:shadow-none
          ${collapsed ? "md:w-20" : "md:w-64"}
          w-[260px]
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* BRAND HEADER */}
        <div className="border-b border-[#E9DED0] px-3 py-3">
          <div className="flex min-h-[58px] items-center justify-between gap-2">
            {/* LOGO AND BRAND */}
            <div
              className={`flex min-w-0 flex-1 items-center gap-2 ${
                collapsed ? "md:justify-center" : ""
              }`}
            >
              <img
                src="/oorza-logo.png"
                alt="Oorza"
                className={`h-14 w-auto max-w-[165px] shrink-0 object-contain transition-all duration-300 ${
                  collapsed ? "md:h-10 md:max-w-[44px]" : ""
                }`}
              />

              <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
                <h1 className="truncate text-sm font-bold text-[#382B26]">
                  Admin Panel
                </h1>
                <p className="truncate text-[10px] text-[#8F8175]">
                  Oorza Management
                </p>
              </div>
            </div>

            {/* SMALL DESKTOP COLLAPSE / EXPAND TOGGLE */}
            <button
              type="button"
              onClick={onToggle}
              className="
                hidden md:flex
                h-[26px] w-[26px] shrink-0
                items-center justify-center
                rounded-md border border-[#E9DED0]
                bg-[#F8EDE6] text-[#A95643]
                transition-colors duration-200
                hover:border-[#A95643]
                hover:bg-[#A95643] hover:text-white
              "
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight size={14} strokeWidth={2.5} />
              ) : (
                <ChevronLeft size={14} strokeWidth={2.5} />
              )}
            </button>

            {/* MOBILE CLOSE */}
            <button
              type="button"
              onClick={closeMobileMenu}
              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8F8175] hover:bg-[#F8EDE6] md:hidden"
              aria-label="Close menu"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* ADMIN PROFILE */}
        <div className={`pt-3 ${collapsed ? "px-2" : "px-3"}`}>
          <div
            className={`rounded-xl border border-[#E9DED0] bg-[#F8EDE6] ${
              collapsed ? "p-1.5 md:flex md:justify-center" : "p-2"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#C9826C] to-[#A95643]">
                <span className="text-sm font-bold text-white">A</span>
              </div>

              <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
                <p className="text-xs font-bold text-[#382B26]">
                  Administrator
                </p>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-[#8F8175]">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION HEADING */}
        <div className={`pt-4 ${collapsed ? "px-3" : "px-4"}`}>
          <p
            className={`px-2 text-[9px] font-bold uppercase tracking-wider text-[#A99B8E] ${
              collapsed ? "md:hidden" : ""
            }`}
          >
            Management
          </p>

          {collapsed && (
            <div className="hidden border-t border-[#E9DED0] md:block" />
          )}
        </div>

        {/* NAVIGATION ITEMS */}
        <nav
          className={`mt-2 flex-1 space-y-1 overflow-y-auto pb-3 ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === ""}
                onClick={closeMobileMenu}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => `
                  group relative flex items-center gap-2.5
                  rounded-lg px-2.5 py-2
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-[#F8EDE6] text-[#71392F]"
                      : "text-[#6F6259] hover:bg-[#FAF6EF] hover:text-[#A95643]"
                  }
                  ${collapsed ? "md:justify-center md:px-2" : ""}
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#A95643]" />
                    )}

                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                        isActive
                          ? "bg-[#A95643] text-white shadow-sm"
                          : "bg-[#F8EDE6] text-[#A95643] group-hover:bg-[#F1DFD5]"
                      }`}
                    >
                      <Icon size={16} />
                    </span>

                    <span
                      className={`min-w-0 flex-1 ${
                        collapsed ? "md:hidden" : ""
                      }`}
                    >
                      <span className="block truncate text-xs font-semibold">
                        {item.label}
                      </span>

                      <span
                        className={`mt-0.5 block truncate text-[9px] ${
                          isActive ? "text-[#A95643]" : "text-[#A99B8E]"
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>

                    <span
                      className={`${collapsed ? "md:hidden" : ""} ${
                        isActive
                          ? "text-[#A95643]"
                          : "translate-x-[-3px] text-[#C2B4A7] opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      } transition-all`}
                    >
                      <ArrowRight size={12} />
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* SYSTEM */}
          <div className="my-2 border-t border-[#E9DED0]" />

          <p
            className={`mb-1 px-2 text-[9px] font-bold uppercase tracking-wider text-[#A99B8E] ${
              collapsed ? "md:hidden" : ""
            }`}
          >
            System
          </p>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-red-500 transition hover:bg-red-50 hover:text-red-600 ${
              collapsed ? "md:justify-center md:px-2" : ""
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 transition group-hover:bg-red-100">
              <LogOut size={16} />
            </span>

            <span className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
              <span className="block text-xs font-semibold">Logout</span>
              <span className="mt-0.5 block text-[9px] text-red-300">
                Sign out of account
              </span>
            </span>
          </button>
        </nav>

        {/* FOOTER */}
        <div className="border-t border-[#E9DED0] p-2.5">
          <div
            className={`rounded-lg border border-[#E9DED0] bg-[#FAF6EF] px-2.5 py-2 ${
              collapsed
                ? "md:flex md:justify-center md:border-0 md:bg-transparent"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={collapsed ? "md:hidden" : ""}>
                <p className="text-[10px] font-semibold text-[#6F6259]">
                  Oorza
                </p>
                <p className="mt-0.5 text-[9px] text-[#A99B8E]">
                  Admin Console
                </p>
              </div>

              <span
                className={`text-[9px] font-semibold text-[#A99B8E] ${
                  collapsed ? "md:hidden" : ""
                }`}
              >
                v1.0
              </span>

              {collapsed && (
                <img
                  src="/oorza-logo.png"
                  alt="Oorza"
                  className="hidden h-7 w-7 object-contain md:block"
                />
              )}
            </div>
          </div>

          <p
            className={`mt-2 text-center text-[9px] text-[#A99B8E] ${
              collapsed ? "md:hidden" : ""
            }`}
          >
            © {new Date().getFullYear()} Oorza
          </p>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
