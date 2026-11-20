import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAuthenticated, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const accountPath =
    role === "tenant"
      ? "/tenant"
      : role === "customer"
        ? "/customer"
        : role === "admin"
          ? "/admin"
          : "/";

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Workspaces", path: "/#workspaces" },
    { name: "Virtual Office", path: "/virtual-office-prices" },
  ];

  const handleWorkspaceClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname === "/") {
      document.getElementById("workspaces")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      navigate("/", { state: { scrollToWorkspaces: true } });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#E9DED0] bg-[#FFFDFA]/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex min-h-[88px] max-w-7xl items-center justify-between px-4 py-1 sm:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="group flex shrink-0 items-center"
          onClick={() => setMobileMenuOpen(false)}
        >
          <img
            src="/oorza-logo.png"
            alt="Oorza - Your Space. Your People. Your Work."
            className="h-[76px] w-auto max-w-none object-contain transition duration-300 group-hover:scale-[1.03] sm:h-[84px]"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={
                link.name === "Workspaces" ? handleWorkspaceClick : undefined
              }
              className="relative py-2 text-sm font-semibold text-[#6F6259] transition hover:text-[#A95643] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#A95643] after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {!authLoading &&
            (isAuthenticated ? (
              <Link
                to={accountPath}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#71392F] to-[#A95643] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#71392F]/15 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#71392F]/20"
              >
                My Account
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#6F6259] transition hover:bg-[#F8EDE6] hover:text-[#A95643]"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-r from-[#71392F] to-[#A95643] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#71392F]/15 transition hover:-translate-y-0.5 hover:shadow-[#71392F]/25"
                >
                  Get Started
                </Link>
              </>
            ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-[#71392F] transition hover:bg-[#F8EDE6] md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E9DED0] bg-[#FFFDFA] px-5 py-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={
                  link.name === "Workspaces"
                    ? handleWorkspaceClick
                    : () => setMobileMenuOpen(false)
                }
                className="rounded-lg px-4 py-3 text-sm font-semibold text-[#6F6259] transition hover:bg-[#F8EDE6] hover:text-[#A95643]"
              >
                {link.name}
              </Link>
            ))}

            {!authLoading &&
              (isAuthenticated ? (
                <Link
                  to={accountPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#71392F] to-[#A95643] px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-[#71392F]/15"
                >
                  My Account
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-[#E9DED0] bg-white px-4 py-3 text-center text-sm font-semibold text-[#71392F] transition hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-gradient-to-r from-[#71392F] to-[#A95643] px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-[#71392F]/15 transition hover:shadow-lg"
                  >
                    Register
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;