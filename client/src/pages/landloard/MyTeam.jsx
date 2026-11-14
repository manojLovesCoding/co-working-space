
import React, { useEffect, useState } from "react";
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
          err.response?.data?.message ||
            "Unable to load your team members."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyTeam();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            My Account
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            My Team
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View the team members associated with your customer account.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading your team...
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              👥
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No team members added
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Your team members will appear here once the administrator
              adds them to your account.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">
                Total Team Members
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {teamMembers.length}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => (
                <div
                  key={member._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <span className="text-lg font-bold">
                        {member.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900">
                        {member.name}
                      </h3>

                      <p className="text-xs text-slate-500">
                        {member.designation || "Team Member"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Email
                      </p>

                      <p className="mt-1 break-all text-sm text-slate-700">
                        {member.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Phone
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {member.phone}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyTeam;
