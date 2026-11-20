import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import LandlordSidebar from "../components/landlord/Sidebar";

const LandlordLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <LandlordSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />

      <main
        className={`
          min-h-screen overflow-x-hidden pt-16
          transition-[margin] duration-300 ease-in-out
          ${collapsed ? "md:ml-20" : "md:ml-64"}
          md:pt-0
        `}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default LandlordLayout;