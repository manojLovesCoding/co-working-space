import { Link } from "react-router-dom";
import {
  Building2,
  ArrowUpRight,
  Home,
  BriefcaseBusiness,
  LogIn,
  UserPlus,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-5 inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Building2 size={25} />
              </div>

              <span className="text-2xl font-extrabold tracking-tight text-white">
                Oorza
              </span>
            </Link>

            <p className="max-w-xs text-sm leading-7 text-slate-400">
              Your space, your people, your possibilities. Discover rental
              properties and flexible workspace solutions with Oorza.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
              Quick Links
            </h3>

            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  to="/"
                  className="flex items-center gap-2 transition hover:text-blue-400"
                >
                  <Home size={16} />
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/virtual-office-prices"
                  className="flex items-center gap-2 transition hover:text-blue-400"
                >
                  <BriefcaseBusiness size={16} />
                  Virtual Office Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
              Your Account
            </h3>

            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  to="/login"
                  className="flex items-center gap-2 transition hover:text-blue-400"
                >
                  <LogIn size={16} />
                  Sign In
                </Link>
              </li>

              <li>
                <Link
                  to="/register"
                  className="flex items-center gap-2 transition hover:text-blue-400"
                >
                  <UserPlus size={16} />
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
              Get Started
            </h3>

            <p className="mb-5 text-sm leading-7 text-slate-400">
              Find your next space or manage your workspace journey with Oorza.
            </p>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Join Oorza
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-center sm:flex-row sm:text-left">
          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Oorza. All rights reserved.
            </p>

            <p className="text-sm text-slate-500">
              Designed and Developed by{" "}
              <span className="font-semibold text-blue-400">
                Manoj Kumar P V
              </span>
            </p>
          </div>

          <p className="text-sm text-slate-500">
            Your Space. Your People. Your Work.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
