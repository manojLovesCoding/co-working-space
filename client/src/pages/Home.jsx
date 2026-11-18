import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Users,
  Wifi,
  Coffee,
  CalendarDays,
  BriefcaseBusiness,
  Video,
  MapPin,
} from "lucide-react";

import Navbar from "../components/public/Navbar.jsx";
import Footer from "../components/public/Footer.jsx";
import PublicSpaces from "../components/public/PublicSpaces.jsx";

const Home = () => {
  const benefits = [
    {
      icon: Wifi,
      title: "High-Speed Internet",
      description:
        "Stay connected and productive with reliable high-speed internet.",
    },
    {
      icon: Users,
      title: "Collaborative Community",
      description:
        "Connect, collaborate, and grow alongside a community of professionals.",
    },
    {
      icon: Coffee,
      title: "Comfortable Workspaces",
      description:
        "Work in thoughtfully designed spaces that keep you comfortable and focused.",
    },
    {
      icon: CalendarDays,
      title: "Flexible Bookings",
      description:
        "Choose workspace options that fit your schedule and business needs.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute -left-40 -top-40 -z-10 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute -right-40 bottom-0 -z-10 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />

        <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          {/* Hero Content */}
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-green-400" />A Better Way
              to Work
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your Next Great Idea Needs
              <span className="mt-2 block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                The Right Space.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Discover inspiring coworking spaces, private offices, and meeting
              rooms. Find a workspace that fits the way you work and the way you
              grow.
            </p>

            <p className="mt-5 text-sm font-semibold tracking-wide text-blue-300">
              Your Space. Your People. Your Work.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <a
                href="#workspaces"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Explore Workspaces
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>

              <Link
                to="/virtual-office-prices"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Virtual Office Plans
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-4 border-t border-white/10 pt-7 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-green-400" />
                Flexible Workspaces
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-green-400" />
                Professional Environment
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-green-400" />
                Easy Booking
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-800 p-3 shadow-2xl">
              <div className="relative flex min-h-[390px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-blue-950 p-7 sm:p-9">
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[35px] border-white/5" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg">
                    <Building2 size={29} />
                  </div>

                  <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-blue-300">
                    Work better together
                  </p>

                  <h2 className="mt-3 max-w-sm text-3xl font-bold leading-tight text-white sm:text-4xl">
                    A workspace for every ambition.
                  </h2>

                  <p className="mt-4 max-w-sm leading-7 text-slate-300">
                    From focused individual work to team collaboration, find the
                    environment that helps you do your best work.
                  </p>
                </div>

                <div className="relative mt-10 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <BriefcaseBusiness size={22} className="text-blue-300" />
                    <p className="mt-3 font-semibold text-white">
                      Private Offices
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      Your own space
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <Video size={22} className="text-blue-300" />
                    <p className="mt-3 font-semibold text-white">
                      Meeting Rooms
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      Meet and collaborate
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:flex">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Users size={23} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Work Together
                </p>
                <p className="text-xs text-slate-500">Grow your network</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WORKSPACE BENEFITS ================= */}
      <section className="bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Why Choose Oorza
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to Work Better
            </h2>

            <p className="mt-4 leading-7 text-slate-500">
              More than just a desk. Get access to an environment designed for
              productivity, collaboration, and growth.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={27} />
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= WORKSPACE TYPES ================= */}
      <section className="bg-slate-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Find Your Perfect Fit
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Spaces Designed Around Your Work
            </h2>

            <p className="mt-4 leading-7 text-slate-500">
              Whether you're working solo, building a team, or meeting clients,
              discover a space that works for you.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={25} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Coworking Spaces
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Flexible desks and shared work environments for freelancers,
                entrepreneurs, and professionals.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BriefcaseBusiness size={25} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Private Offices
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Dedicated and private workspaces for teams that need their own
                professional environment.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Video size={25} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Meeting Rooms
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Professional spaces for team discussions, presentations,
                interviews, and client meetings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= AVAILABLE WORKSPACES ================= */}
      <section id="workspaces" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <PublicSpaces />
        </div>
      </section>

      {/* ================= VIRTUAL OFFICE ================= */}
      <section className="relative isolate overflow-hidden bg-slate-950 px-6 py-20 lg:px-8">
        <div className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 -z-10 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
              Virtual Office Solutions
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-5xl">
              Build Your Business Presence Without a Physical Office
            </h2>

            <p className="mt-6 max-w-xl leading-8 text-slate-400">
              Explore our virtual office plans and choose a solution that
              supports your professional business presence.
            </p>

            <Link
              to="/virtual-office-prices"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Explore Virtual Office Plans
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur sm:p-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-300">
              <Building2 size={34} />
            </div>

            <h3 className="mt-7 text-2xl font-bold text-white">
              Your Business. Your Identity.
            </h3>

            <p className="mt-3 leading-7 text-slate-400">
              Discover virtual office options with transparent pricing and a
              straightforward purchase process.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Explore available virtual office plans",
                "Compare transparent pricing",
                "View GST breakdown",
                "Secure online payment",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-slate-300"
                >
                  <CheckCircle2 size={18} className="shrink-0 text-green-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="bg-blue-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <MapPin size={27} />
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Your Next Workspace Is Waiting.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-500">
            Join Oorza and discover a better way to work, connect with
            professionals, and grow your business.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
