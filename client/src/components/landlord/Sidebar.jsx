
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  UserRound,
  CalendarDays,
  Users,
  Mail,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";

const LandlordSidebar = ({ collapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { label: "Home", path: "/", icon: Home, end: true },
    { label: "Customer Profile", path: "profile2", icon: UserRound },
    { label: "Reservations", path: "reservations", icon: CalendarDays },
    {
      label: "Virtual Office Purchases",
      path: "virtual-office-purchases",
      icon: BriefcaseBusiness,
    },
    { label: "My Team", path: "my-team", icon: Users },
    { label: "Invite Visitor", path: "invite-visitor", icon: Mail },
    { label: "Visitors", path: "visitors", icon: Users },
    {
      label: "Company Profile",
      path: "company-profile",
      icon: BriefcaseBusiness,
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
      <div className="print:hidden fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[#E9DED0] bg-[#FFFDFA]/95 px-3 shadow-sm backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#71392F] transition hover:bg-[#F1DFD5]"
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>

        <div className="flex items-center">
          <img
            src="/oorza-logo.png"
            alt="Oorza"
            className="h-11 w-auto max-w-[150px] object-contain"
          />
        </div>

        <div className="w-9" />
      </div>

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
          <div className="flex min-h-[56px] items-center justify-between gap-2">

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
                <h1 className="truncate text-base font-extrabold text-[#382B26]">
                  Oorza
                </h1>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#8F8175]">
                  Customer Portal
                </p>
              </div>
            </div>

            {/* SMALL DESKTOP TOGGLE */}
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

        {/* PROFILE */}
        <div className={`pt-3 ${collapsed ? "px-2" : "px-3"}`}>
          <div
            className={`rounded-xl border border-[#E9DED0] bg-[#F8EDE6] ${
              collapsed ? "p-1.5 md:flex md:justify-center" : "p-2"
            }`}
            title={collapsed ? user?.name || "Customer" : undefined}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#C9826C] to-[#A95643] text-sm font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "L"}
              </div>

              <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
                <p className="truncate text-xs font-bold text-[#382B26]">
                  {user?.name || "Customer"}
                </p>
                <p className="truncate text-[10px] text-[#8F8175]">
                  {user?.email || "Customer Account"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MENU HEADING */}
        <div className={`pt-4 ${collapsed ? "px-3" : "px-4"}`}>
          <p
            className={`px-2 text-[9px] font-bold uppercase tracking-wider text-[#A99B8E] ${
              collapsed ? "md:hidden" : ""
            }`}
          >
            Main Menu
          </p>

          {collapsed && (
            <div className="hidden border-t border-[#E9DED0] md:block" />
          )}
        </div>

        {/* NAVIGATION */}
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
                end={item.end || false}
                onClick={closeMobileMenu}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => `
                  group relative flex items-center gap-2.5
                  rounded-lg px-2.5 py-2
                  text-[12px] font-semibold
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-[#A95643] text-white shadow-sm shadow-[#A95643]/20"
                      : "text-[#6F6259] hover:bg-[#F8EDE6] hover:text-[#A95643]"
                  }
                  ${collapsed ? "md:justify-center md:px-2" : ""}
                `}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`
                        flex h-8 w-8 shrink-0 items-center justify-center
                        rounded-lg transition
                        ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-[#F8EDE6] text-[#A95643] group-hover:bg-[#F1DFD5]"
                        }
                      `}
                    >
                      <Icon size={16} />
                    </span>

                    <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>
                      {item.label}
                    </span>

                    <span
                      className={`ml-auto ${
                        collapsed ? "md:hidden" : ""
                      } ${
                        isActive
                          ? "text-white/70"
                          : "text-[#C2B4A7] opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <ArrowRight size={12} />
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          <div className="my-2 border-t border-[#E9DED0]" />

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`
              group flex w-full items-center gap-2.5
              rounded-lg px-2.5 py-2 text-left
              text-xs font-semibold text-red-500
              transition hover:bg-red-50 hover:text-red-600
              ${collapsed ? "md:justify-center md:px-2" : ""}
            `}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100">
              <LogOut size={16} />
            </span>

            <span className={collapsed ? "md:hidden" : ""}>Logout</span>
          </button>
        </nav>

        {/* FOOTER */}
        <div className="border-t border-[#E9DED0] p-2.5">
          <div
            className={`rounded-lg bg-[#FAF6EF] px-2.5 py-2 ${
              collapsed ? "md:flex md:justify-center md:bg-transparent" : ""
            }`}
            title={collapsed ? "System Online" : undefined}
          >
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span
                className={`text-[10px] font-medium text-[#8F8175] ${
                  collapsed ? "md:hidden" : ""
                }`}
              >
                System Online
              </span>
            </div>

            <p
              className={`mt-1 text-[9px] text-[#A99B8E] ${
                collapsed ? "md:hidden" : ""
              }`}
            >
              © {new Date().getFullYear()} Oorza
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default LandlordSidebar;
