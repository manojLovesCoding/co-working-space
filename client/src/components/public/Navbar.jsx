import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Building2, Menu, X, ArrowRight } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Building2 size={25} />
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Oorza
            </h1>
            <p className="text-[10px] font-medium tracking-widest text-slate-500">
              Your Space. Your People. Your Work.
            </p>
          </div>
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
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
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
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                My Account
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
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
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-5 shadow-lg md:hidden">
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
                className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
              >
                {link.name}
              </Link>
            ))}

            {!authLoading &&
              (isAuthenticated ? (
                <Link
                  to={accountPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  My Account
                </Link>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
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
