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
    "w-full rounded-xl border border-[#E9DED0] bg-[#FFFDFA] py-3 pl-11 pr-4 text-sm font-medium text-[#382B26] outline-none transition placeholder:font-normal placeholder:text-[#B5A79B] hover:border-[#C9826C] focus:border-[#A95643] focus:ring-4 focus:ring-[#A95643]/10 disabled:cursor-not-allowed disabled:bg-[#FAF6EF] disabled:opacity-60";

  const labelClass = "mb-1.5 block text-sm font-semibold text-[#514239]";

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
        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="light"
          toastStyle={{
            background: "#FFFDFA",
            color: "#382B26",
            border: "1px solid #E9DED0",
          }}
          progressStyle={{ background: "#A95643" }}
        />

        <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-4">
          <div className="rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] p-7 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#F8EDE6]">
              <Loader2 className="h-7 w-7 animate-spin text-[#A95643]" />
            </div>

            <h2 className="mt-4 text-base font-bold text-[#382B26]">
              Loading your profile
            </h2>

            <p className="mt-1.5 text-xs text-[#8F8175]">
              Please wait while we fetch your information.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="light"
        toastStyle={{
          background: "#FFFDFA",
          color: "#382B26",
          border: "1px solid #E9DED0",
        }}
        progressStyle={{ background: "#A95643" }}
      />

      <div className="min-h-screen bg-[#FAF6EF] px-3 py-5 sm:px-5 lg:px-7">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#A95643]">
                <UserCircle size={15} />
                <span>Oorza Customer Portal</span>
                <span className="text-[#D6C9BB]">/</span>
                <span className="text-[#8F8175]">My Profile</span>
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-[#382B26] sm:text-3xl">
                Account Settings
              </h1>

              <p className="mt-1 text-sm text-[#8F8175]">
                Manage your profile, personal details and contact information.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-2 shadow-sm">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">
                Secure Account
              </span>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#71392F] via-[#A95643] to-[#C9826C] p-5 shadow-lg shadow-[#71392F]/10 sm:p-6">
            <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -bottom-32 right-1/3 h-56 w-56 rounded-full bg-[#F8EDE6]/15" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-2xl font-extrabold text-white shadow-md backdrop-blur">
                {formData.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#F8EDE6]">
                  <Sparkles size={14} />
                  Welcome back
                </div>

                <h2 className="truncate text-xl font-extrabold text-white sm:text-2xl">
                  {formData.name || "Oorza Member"}
                </h2>

                <p className="mt-1 text-xs text-white/75">
                  {formData.designation || "Workspace Member"}
                </p>
              </div>

              <div className="flex w-fit items-center gap-2 self-start rounded-lg border border-white/20 bg-white/10 px-3 py-2 backdrop-blur sm:self-center">
                <CheckCircle2 size={16} className="text-emerald-200" />
                <span className="text-xs font-semibold text-white">
                  Profile Management
                </span>
              </div>
            </div>
          </div>

          {/* Profile Layout */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Left Profile Card */}
            <aside className="h-fit overflow-hidden rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
              <div className="h-20 bg-gradient-to-r from-[#71392F] to-[#C9826C]" />

              <div className="-mt-10 px-5 pb-5">
                <div className="relative mx-auto h-24 w-24">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-[#FFFDFA] bg-[#F8EDE6] shadow-md">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound size={38} className="text-[#C9826C]" />
                      </div>
                    )}
                  </div>

                  <label
                    className={`absolute -bottom-1.5 -right-1.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#FFFDFA] bg-[#A95643] text-white shadow-md transition hover:bg-[#71392F] ${
                      saving ? "pointer-events-none opacity-60" : ""
                    }`}
                    title="Change profile photo"
                  >
                    <Camera size={16} />

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={saving}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="mt-4 text-center">
                  <h3 className="break-words text-base font-extrabold text-[#382B26]">
                    {formData.name || "Your Name"}
                  </h3>

                  <p className="mt-1 text-xs text-[#8F8175]">
                    {formData.designation || "Oorza Member"}
                  </p>

                  <p className="mt-2 break-all text-xs text-[#A99B8E]">
                    {formData.email}
                  </p>
                </div>

                <div className="my-5 border-t border-[#F0E8DE]" />

                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                      <Mail size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#A99B8E]">
                        Email Address
                      </p>

                      <p className="truncate text-xs font-semibold text-[#514239]">
                        {formData.email || "Not added"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                      <Phone size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#A99B8E]">
                        Phone Number
                      </p>

                      <p className="text-xs font-semibold text-[#514239]">
                        {formData.contact || "Not added"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-[#E9DED0] bg-[#FBF3ED] p-3">
                  <div className="flex items-center gap-2 text-[#71392F]">
                    <ShieldCheck size={15} />
                    <span className="text-xs font-bold">
                      Your information
                    </span>
                  </div>

                  <p className="mt-1.5 text-[11px] leading-5 text-[#8F8175]">
                    Keep your account details up to date for a better workspace
                    experience.
                  </p>
                </div>
              </div>
            </aside>

            {/* Right Form Card */}
            <section className="overflow-hidden rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
              <div className="flex flex-col justify-between gap-2 border-b border-[#F0E8DE] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <h3 className="text-base font-extrabold text-[#382B26]">
                    Personal Information
                  </h3>

                  <p className="mt-0.5 text-xs text-[#8F8175]">
                    Update your personal details below.
                  </p>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-lg bg-[#F8EDE6] px-3 py-2 text-[11px] font-bold text-[#A95643]">
                  <Pencil size={13} />
                  Edit Profile
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-5 sm:p-6">
                  {/* Photo Upload */}
                  <div className="mb-6 flex flex-col gap-3 rounded-xl border border-dashed border-[#DCC3B5] bg-[#FBF3ED] p-4 sm:flex-row sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#A95643] shadow-sm">
                      <Camera size={19} />
                    </div>

                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-[#382B26]">
                        Profile Picture
                      </h4>

                      <p className="mt-0.5 text-[11px] text-[#8F8175]">
                        Upload a JPG, PNG or WEBP image. Maximum file size 5 MB.
                      </p>

                      {profilePic && (
                        <p className="mt-1.5 break-all text-[11px] font-semibold text-[#A95643]">
                          Selected: {profilePic.name}
                        </p>
                      )}
                    </div>

                    <label
                      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#E9DED0] bg-white px-3.5 py-2 text-xs font-bold text-[#A95643] shadow-sm transition hover:border-[#C9826C] hover:bg-[#F8EDE6] ${
                        saving ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <Camera size={15} />
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
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                      <UserRound size={17} />
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-[#382B26]">
                        Basic Details
                      </h4>

                      <p className="text-[11px] text-[#A99B8E]">
                        Your personal and contact information
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
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
                              size={16}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A99B8E]"
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
                          size={17}
                          className="absolute left-3.5 top-3.5 text-[#A99B8E]"
                        />

                        <textarea
                          name="address"
                          rows={3}
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
                  <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[#E9DED0] bg-[#FBF3ED] p-3.5">
                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-[#A95643]"
                    />

                    <div>
                      <p className="text-xs font-bold text-[#71392F]">
                        Your privacy matters
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-[#8F8175]">
                        Your profile information is used to manage your Oorza
                        workspace experience. Please ensure your contact details
                        are accurate.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-3 border-t border-[#F0E8DE] bg-[#FBF8F3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-[11px] text-[#A99B8E]">
                    <span className="text-red-500">*</span> Required fields
                  </p>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#A95643] to-[#71392F] px-6 py-3 text-xs font-bold text-white shadow-md shadow-[#71392F]/15 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                        <ArrowUpRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-5 pb-2 text-center">
            <p className="text-[10px] font-medium tracking-wide text-[#A99B8E]">
              OORZA · Your Space. Your People. Your Work.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile2;