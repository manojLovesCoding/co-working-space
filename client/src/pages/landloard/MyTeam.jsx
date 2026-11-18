import React, { useEffect, useState } from "react";
import {
  Users,
  UserRound,
  Mail,
  Phone,
  BriefcaseBusiness,
  UsersRound,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
  UserPlus,
  Building2,
} from "lucide-react";
import api from "../../api/axios.js";

const MyTeam = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyTeam = async () => {
      try {
        const { data } = await api.get("/team/my-team");
        setTeamMembers(data.teamMembers || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load your team members.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyTeam();
  }, []);

  const getInitials = (name) => {
    if (!name) return "TM";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  return (
    <div className="min-h-screen bg-[#EAF4FF] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* PAGE HEADER */}
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
            <Building2 size={17} />
            <span>Oorza Customer Portal</span>
            <span className="text-blue-300">/</span>
            <span className="text-slate-500">My Team</span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                My Team
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                View and connect with the team members associated with your
                customer account.
              </p>
            </div>

            {!loading && !error && teamMembers.length > 0 && (
              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2.5 shadow-sm">
                <Users size={17} className="text-blue-600" />
                <span className="text-sm font-semibold text-slate-700">
                  {teamMembers.length}{" "}
                  {teamMembers.length === 1 ? "Member" : "Members"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY BANNER */}
        <div className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-900/10 sm:p-7">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-1/3 h-52 w-52 rounded-full bg-indigo-400/20" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50">
                <ShieldCheck size={14} />
                Your Team Space
              </div>

              <h2 className="text-xl font-extrabold sm:text-2xl">
                Better Together
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-blue-100">
                Keep your team information organized and easily accessible from
                your Oorza customer account.
              </p>
            </div>

            <div className="flex h-20 w-20 shrink-0 items-center justify-center self-start rounded-2xl border border-white/20 bg-white/10 sm:self-center">
              <UsersRound size={42} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-white p-4 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertCircle size={19} />
            </div>

            <div>
              <p className="text-sm font-bold text-red-700">
                Unable to load team members
              </p>
              <p className="mt-1 text-sm text-slate-600">{error}</p>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="rounded-2xl border border-blue-100 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <LoaderCircle size={28} className="animate-spin text-blue-600" />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-800">
              Loading your team
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Please wait while we fetch your team members.
            </p>
          </div>
        ) : !error && teamMembers.length === 0 ? (
          /* EMPTY STATE */
          <div className="rounded-2xl border border-blue-100 bg-white px-5 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <UserPlus size={36} strokeWidth={1.5} />
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-slate-900">
              No team members yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Your team members will appear here once the administrator adds
              them to your customer account.
            </p>

            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
              <ShieldCheck size={15} />
              Managed by your administrator
            </div>
          </div>
        ) : !error ? (
          <>
            {/* TEAM SECTION TITLE */}
            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Team Members
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  People associated with your account
                </p>
              </div>

              <span className="text-xs font-medium text-slate-400">
                {teamMembers.length}{" "}
                {teamMembers.length === 1 ? "member" : "members"} found
              </span>
            </div>

            {/* TEAM MEMBER CARDS */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {teamMembers.map((member, index) => (
                <div
                  key={member._id || member.email || index}
                  className="group overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5"
                >
                  {/* CARD TOP */}
                  <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

                  <div className="p-5">
                    {/* MEMBER PROFILE */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-extrabold text-white shadow-md shadow-blue-600/20">
                        {getInitials(member.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-extrabold text-slate-900">
                          {member.name || "Unnamed Member"}
                        </h3>

                        <div className="mt-1 flex items-center gap-1.5">
                          <BriefcaseBusiness
                            size={13}
                            className="shrink-0 text-blue-500"
                          />
                          <p className="truncate text-xs font-medium text-slate-500">
                            {member.designation || "Team Member"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DIVIDER */}
                    <div className="my-5 border-t border-slate-100" />

                    {/* CONTACT DETAILS */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Mail size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Email Address
                          </p>
                          <p className="mt-1 break-all text-sm font-medium text-slate-700">
                            {member.email || "Not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Phone size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Phone Number
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {member.phone || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CARD FOOTER */}
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-slate-500">
                          Team Member
                        </span>
                      </div>

                      <span className="text-xs font-bold text-blue-600">
                        {getInitials(member.name)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {/* BOTTOM NOTE */}
        {!loading && !error && teamMembers.length > 0 && (
          <div className="mt-7 flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <UserRound size={17} />
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Team member information is managed by your administrator. Contact
              your administrator if any details need to be updated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeam;
