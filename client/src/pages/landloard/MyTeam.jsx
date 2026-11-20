import React, { useEffect, useState } from "react";
import {
  Users,
  UserRound,
  Mail,
  Phone,
  BriefcaseBusiness,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
  UserPlus,
  Building2,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios.js";

const MyTeam = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyTeam = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get("/team/my-team");
        setTeamMembers(data.teamMembers || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load your team members."
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
    <div className="min-h-screen bg-[#FAF6EF] p-3 sm:p-4">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#A95643]">
            <Building2 size={14} />
            <span>Oorza Customer Portal</span>
            <span className="text-[#C9826C]">/</span>
            <span className="text-[#8F8175]">My Team</span>
          </div>

          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#382B26] sm:text-2xl">
                My Team
              </h1>

              <p className="mt-1 text-xs text-[#8F8175]">
                View and connect with team members associated with your
                customer account.
              </p>
            </div>

            {!loading && !error && teamMembers.length > 0 && (
              <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#E9DED0] bg-[#FFFDFA] px-3 py-2 shadow-sm">
                <Users size={15} className="text-[#A95643]" />
                <span className="text-xs font-semibold text-[#382B26]">
                  {teamMembers.length}{" "}
                  {teamMembers.length === 1 ? "Member" : "Members"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY BANNER */}
        <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-r from-[#71392F] via-[#914B3B] to-[#A95643] p-4 text-white shadow-sm">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-1/3 h-32 w-32 rounded-full bg-[#C9826C]/20" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[9px] font-semibold text-[#FAE9E1]">
                <ShieldCheck size={12} />
                YOUR TEAM SPACE
              </div>

              <h2 className="text-lg font-extrabold sm:text-xl">
                Better Together
              </h2>

              <p className="mt-1 max-w-lg text-[11px] leading-4 text-[#F5DED4] sm:text-xs">
                Keep your team information organized and accessible from your
                Oorza customer account.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 sm:h-14 sm:w-14">
              <Users size={25} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-red-200 bg-[#FFFDFA] p-3 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertCircle size={17} />
            </div>

            <div>
              <p className="text-xs font-bold text-red-700">
                Unable to load team members
              </p>
              <p className="mt-1 text-[11px] text-[#8F8175]">{error}</p>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="rounded-lg border border-[#E9DED0] bg-[#FFFDFA] px-4 py-12 text-center shadow-sm">
            <LoaderCircle
              size={25}
              className="mx-auto animate-spin text-[#A95643]"
            />

            <h3 className="mt-3 text-sm font-bold text-[#382B26]">
              Loading your team
            </h3>

            <p className="mt-1 text-[11px] text-[#8F8175]">
              Please wait while we fetch your team members.
            </p>
          </div>
        ) : !error && teamMembers.length === 0 ? (
          /* EMPTY STATE */
          <div className="rounded-lg border border-[#E9DED0] bg-[#FFFDFA] px-5 py-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
              <UserPlus size={28} strokeWidth={1.5} />
            </div>

            <h2 className="mt-3 text-base font-extrabold text-[#382B26]">
              No team members yet
            </h2>

            <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-[#8F8175]">
              Your team members will appear here once the administrator adds
              them to your customer account.
            </p>

            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg bg-[#F8EDE6] px-3 py-2 text-[10px] font-semibold text-[#A95643]">
              <ShieldCheck size={13} />
              Managed by your administrator
            </div>
          </div>
        ) : !error ? (
          <>
            {/* TEAM SECTION HEADER */}
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold text-[#382B26]">
                  Team Members
                </h2>
                <p className="mt-0.5 text-[10px] text-[#8F8175]">
                  People associated with your account
                </p>
              </div>

              <span className="text-[10px] font-medium text-[#A3978B]">
                {teamMembers.length}{" "}
                {teamMembers.length === 1 ? "member" : "members"} found
              </span>
            </div>

            {/* TEAM MEMBERS TABLE */}
            <div className="overflow-hidden rounded-lg border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E9DED0] bg-[#FBF3ED] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#A95643]" />
                  <h3 className="text-xs font-bold text-[#382B26]">
                    Team Directory
                  </h3>
                </div>

                <span className="text-[10px] text-[#8F8175]">
                  {teamMembers.length} records
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E9DED0] bg-[#FAF6EF]">
                      <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        #
                      </th>

                      <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Team Member
                      </th>

                      <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Designation
                      </th>

                      <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Email Address
                      </th>

                      <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Phone Number
                      </th>

                      <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#8F8175]">
                        Role
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F0E8DF]">
                    {teamMembers.map((member, index) => (
                      <tr
                        key={member._id || member.email || index}
                        className="transition hover:bg-[#FBF8F3]"
                      >
                        {/* SERIAL NUMBER */}
                        <td className="px-3 py-2.5 text-[11px] font-medium text-[#A3978B]">
                          {index + 1}
                        </td>

                        {/* MEMBER */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[10px] font-extrabold text-[#A95643]">
                              {getInitials(member.name)}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[160px] truncate text-xs font-bold text-[#382B26]">
                                {member.name || "Unnamed Member"}
                              </p>
                              <p className="mt-0.5 text-[9px] text-[#A3978B]">
                                Team Member
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* DESIGNATION */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <BriefcaseBusiness
                              size={12}
                              className="shrink-0 text-[#A95643]"
                            />
                            <span className="text-[11px] text-[#716359]">
                              {member.designation || "Team Member"}
                            </span>
                          </div>
                        </td>

                        {/* EMAIL */}
                        <td className="px-3 py-2.5">
                          <div className="flex max-w-[210px] items-center gap-1.5">
                            <Mail
                              size={12}
                              className="shrink-0 text-[#A3978B]"
                            />
                            <span className="truncate text-[11px] text-[#716359]">
                              {member.email || "Not provided"}
                            </span>
                          </div>
                        </td>

                        {/* PHONE */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <Phone
                              size={12}
                              className="shrink-0 text-[#A3978B]"
                            />
                            <span className="whitespace-nowrap text-[11px] text-[#716359]">
                              {member.phone || "Not provided"}
                            </span>
                          </div>
                        </td>

                        {/* ROLE */}
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#E9DED0] bg-[#F8EDE6] px-2 py-1 text-[9px] font-bold text-[#A95643]">
                            <ShieldCheck size={11} />
                            Team Member
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TABLE FOOTER */}
              <div className="flex flex-col gap-1 border-t border-[#E9DED0] bg-[#FBF8F3] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-[#8F8175]">
                  Total{" "}
                  <span className="font-bold text-[#382B26]">
                    {teamMembers.length}
                  </span>{" "}
                  team members
                </p>

                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#A3978B]">
                  Oorza Team Directory
                </p>
              </div>
            </div>
          </>
        ) : null}

        {/* BOTTOM NOTE */}
        {!loading && !error && teamMembers.length > 0 && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-[#E9DED0] bg-[#FFFDFA] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
              <UserRound size={15} />
            </div>

            <p className="text-[10px] leading-5 text-[#8F8175]">
              Team member information is managed by your administrator.
              Contact your administrator if any details need to be updated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeam;