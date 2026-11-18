import React, { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Camera,
  Save,
  Loader2,
  ShieldCheck,
  UserCircle,
  CheckCircle2,
  Sparkles,
  Pencil,
  ArrowUpRight,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/axios";

const Profile2 = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    designation: "",
    dob: "",
    address: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await api.get("/profile");
        const result = response.data;

        if (!result.success || !result.user) {
          toast.error(result.message || "Failed to fetch profile");
          return;
        }

        const user = result.user;

        setFormData({
          name: user.name || "",
          contact: user.phone || "",
          email: user.email || "",
          designation: user.designation || "",
          dob: user.dob ? user.dob.substring(0, 10) : "",
          address: user.address || "",
        });

        if (user.profilePic) setPreview(user.profilePic);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error(error.response?.data?.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile image must be less than 5 MB");
      e.target.value = "";
      return;
    }

    setProfilePic(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error("Name is required!");
    if (!formData.contact.trim())
      return toast.error("Contact number is required!");
    if (!formData.email.trim()) return toast.error("Email is required!");
    if (!formData.designation.trim())
      return toast.error("Designation is required!");
    if (!formData.address.trim()) return toast.error("Address is required!");

    try {
      setSaving(true);

      const data = new FormData();
      data.append("name", formData.name.trim());
      data.append("phone", formData.contact.trim());
      data.append("email", formData.email.trim());
      data.append("designation", formData.designation.trim());
      data.append("dob", formData.dob);
      data.append("address", formData.address.trim());

      if (profilePic) data.append("profilePic", profilePic);

      const response = await api.put("/profile", data);
      const result = response.data;

      if (!result.success) {
        toast.error(result.message || "Failed to update profile");
        return;
      }

      if (result.user) {
        const user = result.user;

        setFormData({
          name: user.name || "",
          contact: user.phone || "",
          email: user.email || "",
          designation: user.designation || "",
          dob: user.dob ? user.dob.substring(0, 10) : "",
          address: user.address || "",
        });

        if (user.profilePic) setPreview(user.profilePic);
      }

      setProfilePic(null);
      toast.success(result.message || "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  const fields = [
    {
      label: "Full Name",
      name: "name",
      placeholder: "Enter your full name",
      icon: UserRound,
      type: "text",
      required: true,
    },
    {
      label: "Contact Number",
      name: "contact",
      placeholder: "Enter your contact number",
      icon: Phone,
      type: "tel",
      required: true,
    },
    {
      label: "Email Address",
      name: "email",
      placeholder: "Enter your email address",
      icon: Mail,
      type: "email",
      required: true,
    },
    {
      label: "Designation",
      name: "designation",
      placeholder: "e.g. Software Developer",
      icon: BriefcaseBusiness,
      type: "text",
      required: true,
    },
    {
      label: "Date of Birth",
      name: "dob",
      placeholder: "",
      icon: CalendarDays,
      type: "date",
      required: false,
    },
  ];

  if (loading) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
        <div className="flex min-h-screen items-center justify-center bg-[#EAF4FF] px-4">
          <div className="rounded-3xl border border-white bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-800">
              Loading your profile
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Please wait while we fetch your information.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="light" />

      <div className="min-h-screen bg-[#EAF4FF] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                <UserCircle size={16} />
                <span>Oorza Customer Portal</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500">My Profile</span>
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Account Settings
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage your profile, personal details and contact information.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 shadow-sm">
              <ShieldCheck size={17} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">
                Secure Account
              </span>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#155EEF] via-[#2563EB] to-[#4338CA] p-6 shadow-xl shadow-blue-900/10 sm:p-8">
            <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-indigo-300/20" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-3xl font-extrabold text-white shadow-lg backdrop-blur">
                {formData.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 text-sm text-blue-100">
                  <Sparkles size={15} />
                  Welcome back
                </div>
                <h2 className="truncate text-2xl font-extrabold text-white sm:text-3xl">
                  {formData.name || "Oorza Member"}
                </h2>
                <p className="mt-1 text-sm text-blue-100">
                  {formData.designation || "Workspace Member"}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur sm:self-center">
                <CheckCircle2 size={18} className="text-emerald-300" />
                <span className="text-sm font-semibold text-white">
                  Profile Management
                </span>
              </div>
            </div>
          </div>

          {/* Profile Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Left Profile Card */}
            <aside className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />

              <div className="-mt-12 px-6 pb-6">
                <div className="relative mx-auto h-28 w-28">
                  <div className="h-28 w-28 overflow-hidden rounded-3xl border-4 border-white bg-blue-50 shadow-lg">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound size={42} className="text-blue-300" />
                      </div>
                    )}
                  </div>

                  <label
                    className={`absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700 ${
                      saving ? "pointer-events-none opacity-60" : ""
                    }`}
                    title="Change profile photo"
                  >
                    <Camera size={17} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={saving}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="mt-5 text-center">
                  <h3 className="break-words text-lg font-extrabold text-slate-900">
                    {formData.name || "Your Name"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formData.designation || "Oorza Member"}
                  </p>
                  <p className="mt-2 break-all text-xs text-slate-400">
                    {formData.email}
                  </p>
                </div>

                <div className="my-6 border-t border-slate-100" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Email Address
                      </p>
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {formData.email || "Not added"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Phone size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Phone Number
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formData.contact || "Not added"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <ShieldCheck size={17} />
                    <span className="text-xs font-bold">Your information</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-blue-700/80">
                    Keep your account details up to date for a better workspace
                    experience.
                  </p>
                </div>
              </div>
            </aside>

            {/* Right Form Card */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:px-8">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Personal Information
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Update your personal details below.
                  </p>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                  <Pencil size={14} />
                  Edit Profile
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-6 sm:p-8">
                  {/* Photo Upload */}
                  <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-dashed border-blue-200 bg-[#F5F9FF] p-5 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <Camera size={22} />
                    </div>

                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800">
                        Profile Picture
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Upload a JPG, PNG or WEBP image. Maximum file size 5 MB.
                      </p>
                      {profilePic && (
                        <p className="mt-2 break-all text-xs font-semibold text-blue-600">
                          Selected: {profilePic.name}
                        </p>
                      )}
                    </div>

                    <label
                      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 ${
                        saving ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <Camera size={16} />
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={saving}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Section Heading */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <UserRound size={19} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">
                        Basic Details
                      </h4>
                      <p className="text-xs text-slate-400">
                        Your personal and contact information
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                    {fields.map((field) => {
                      const Icon = field.icon;

                      return (
                        <div key={field.name}>
                          <label className={labelClass}>
                            {field.label}
                            {field.required && (
                              <span className="ml-1 text-red-500">*</span>
                            )}
                          </label>

                          <div className="relative">
                            <Icon
                              size={17}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              type={field.type}
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleChange}
                              placeholder={field.placeholder}
                              disabled={saving}
                              required={field.required}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin
                          size={18}
                          className="absolute left-4 top-4 text-slate-400"
                        />
                        <textarea
                          name="address"
                          rows={4}
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter your complete address"
                          disabled={saving}
                          required
                          className={`${inputClass} resize-none pl-11`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Information Note */}
                  <div className="mt-8 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <ShieldCheck
                      size={19}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-blue-800">
                        Your privacy matters
                      </p>
                      <p className="mt-1 text-xs leading-5 text-blue-700/80">
                        Your profile information is used to manage your Oorza
                        workspace experience. Please ensure your contact details
                        are accurate.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <p className="text-xs text-slate-400">
                    <span className="text-red-500">*</span> Required fields
                  </p>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                        <ArrowUpRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-7 pb-3 text-center">
            <p className="text-xs font-medium tracking-wide text-slate-400">
              OORZA · Your Space. Your People. Your Work.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile2;
