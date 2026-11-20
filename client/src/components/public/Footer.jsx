import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Home,
  BriefcaseBusiness,
  LogIn,
  UserPlus,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-[#60473D] bg-[#382B26] text-[#E5D8CE]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="group mb-4 inline-flex items-center"
            >
              <img
                src="/oorza-logo.png"
                alt="Oorza - Your Space. Your People. Your Work."
                className="h-20 w-auto max-w-[240px] object-contain transition duration-300 group-hover:scale-[1.03]"
              />
            </Link>

            <p className="max-w-xs text-xs leading-6 text-[#C5B5A9]">
              Your space, your people, your possibilities. Discover rental
              properties and flexible workspace solutions with Oorza.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Quick Links
            </h3>

            <ul className="space-y-3 text-xs">
              <li>
                <Link
                  to="/"
                  className="flex items-center gap-2 transition duration-200 hover:translate-x-1 hover:text-[#E5A58E]"
                >
                  <Home size={15} className="text-[#C9826C]" />
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/virtual-office-prices"
                  className="flex items-center gap-2 transition duration-200 hover:translate-x-1 hover:text-[#E5A58E]"
                >
                  <BriefcaseBusiness size={15} className="text-[#C9826C]" />
                  Virtual Office Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Your Account
            </h3>

            <ul className="space-y-3 text-xs">
              <li>
                <Link
                  to="/login"
                  className="flex items-center gap-2 transition duration-200 hover:translate-x-1 hover:text-[#E5A58E]"
                >
                  <LogIn size={15} className="text-[#C9826C]" />
                  Sign In
                </Link>
              </li>

              <li>
                <Link
                  to="/register"
                  className="flex items-center gap-2 transition duration-200 hover:translate-x-1 hover:text-[#E5A58E]"
                >
                  <UserPlus size={15} className="text-[#C9826C]" />
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              Get Started
            </h3>

            <p className="mb-4 text-xs leading-6 text-[#C5B5A9]">
              Find your next space or manage your workspace journey with Oorza.
            </p>

            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#71392F] to-[#A95643] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20"
            >
              Join Oorza
              <ArrowUpRight
                size={15}
                className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Link>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-9 flex flex-col items-center justify-between gap-3 border-t border-[#60473D] pt-5 text-center sm:flex-row sm:text-left">
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#A99A8F]">
              © {new Date().getFullYear()} Oorza. All rights reserved.
            </p>

            <p className="text-[11px] text-[#A99A8F]">
              Designed and Developed by{" "}
              <span className="font-semibold text-[#E5A58E]">
                Manoj Kumar P V
              </span>
            </p>
          </div>

          <p className="text-[11px] text-[#A99A8F]">
            Your Space. Your People. Your Work.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;