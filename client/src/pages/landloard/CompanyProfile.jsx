import { useEffect, useState } from "react";
import {
  Building2,
  Camera,
  CheckCircle2,
  FileText,
  ImagePlus,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/axios.js";

const CompanyProfile = () => {
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    gstNo: "",
    email: "",
    contact: "",
    address: "",
  });

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        setLoading(true);

        const response = await api.get("/company");
        const result = response.data;

        if (!result.success) {
          toast.error(result.message || "Failed to fetch company profile");
          return;
        }

        if (!result.company) return;

        const company = result.company;

        setFormData({
          companyName: company.companyName || "",
          gstNo: company.gstNo || "",
          email: company.email || "",
          contact: company.contact || "",
          address: company.address || "",
        });

        if (company.logo) {
          setPreview(company.logo);
        }
      } catch (error) {
        console.error("Error fetching company profile:", error);

        toast.error(
          error.response?.data?.message || "Failed to fetch company profile",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyProfile();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo size should be less than 2MB.");
      e.target.value = "";
      return;
    }

    setLogo(file);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
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

    if (!formData.companyName.trim()) {
      toast.error("Company Name is required!");
      return;
    }

    if (!formData.gstNo.trim()) {
      toast.error("GST No is required!");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Company Email is required!");
      return;
    }

    if (!formData.contact.trim()) {
      toast.error("Company Contact is required!");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Address is required!");
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();

      data.append("companyName", formData.companyName.trim());
      data.append("gstNo", formData.gstNo.trim().toUpperCase());
      data.append("email", formData.email.trim());
      data.append("contact", formData.contact.trim());
      data.append("address", formData.address.trim());

      if (logo) {
        data.append("logo", logo);
      }

      const response = await api.put("/company", data);
      const result = response.data;

      if (!result.success) {
        toast.error(result.message || "Failed to save company profile");
        return;
      }

      if (result.company) {
        const company = result.company;

        setFormData({
          companyName: company.companyName || "",
          gstNo: company.gstNo || "",
          email: company.email || "",
          contact: company.contact || "",
          address: company.address || "",
        });

        if (company.logo) {
          setPreview(company.logo);
        }
      }

      setLogo(null);

      const fileInput = document.getElementById("company-logo");

      if (fileInput) {
        fileInput.value = "";
      }

      toast.success(result.message || "Company profile saved successfully!");
    } catch (error) {
      console.error("Error saving company profile:", error);

      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setFormData({
      companyName: "",
      gstNo: "",
      email: "",
      contact: "",
      address: "",
    });

    setLogo(null);
    setPreview(null);

    const fileInput = document.getElementById("company-logo");

    if (fileInput) {
      fileInput.value = "";
    }

    toast.info("Form cleared.");
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  const Required = () => <span className="ml-1 text-rose-500">*</span>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF4FF] px-4">
        <div className="flex flex-col items-center rounded-2xl border border-blue-100 bg-white px-10 py-9 shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
          </div>

          <h2 className="text-base font-semibold text-slate-800">
            Loading company profile
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please wait while we fetch your details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAF4FF] px-4 py-6 sm:px-6 lg:px-8">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Oorza Workspace
              </span>

              <span className="text-xs font-medium text-slate-400">
                / Settings
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Company Profile
            </h1>

            <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
              Manage your business identity, contact details and company logo.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-blue-100 bg-white px-4 py-2.5 shadow-sm sm:self-center">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">
              Company Settings
            </span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-200/60 sm:p-8">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
          <div className="absolute -bottom-24 right-36 h-52 w-52 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 flex items-center gap-2 text-blue-100">
                <Building2 className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-[0.15em]">
                  Business Information
                </span>
              </div>

              <h2 className="text-xl font-bold sm:text-2xl">
                Make your workspace official.
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-blue-100">
                Keep your company details accurate and up to date for bookings,
                invoices and business communication.
              </p>
            </div>

            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm sm:flex">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          {/* Card Heading */}
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-bold text-slate-800">Company Details</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Fields marked with * are required
                </p>
              </div>
            </div>

            <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Profile Management
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-8 p-5 sm:p-7">
              {/* Logo Section */}
              <section>
                <div className="mb-4">
                  <h4 className="font-bold text-slate-800">Company Branding</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Upload a logo to represent your company.
                  </p>
                </div>

                <div className="flex flex-col gap-5 rounded-2xl border border-dashed border-blue-200 bg-[#F5F9FF] p-5 sm:flex-row sm:items-center sm:p-6">
                  {/* Logo Preview */}
                  <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Company Logo"
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-blue-300">
                        <Building2 className="mb-2 h-10 w-10" />
                        <span className="text-xs font-medium">No Logo</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                      <Camera className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* Upload Controls */}
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-slate-800">
                      Company Logo
                    </h5>

                    <p className="mt-1 text-sm text-slate-500">
                      Choose an image that clearly represents your business.
                    </p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label
                        htmlFor="company-logo"
                        className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 ${
                          saving ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        <ImagePlus className="h-4 w-4" />
                        Upload Logo
                      </label>

                      <input
                        id="company-logo"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoChange}
                        disabled={saving}
                        className="hidden"
                      />

                      <span className="text-xs text-slate-400">
                        PNG, JPG or JPEG · Max 2MB
                      </span>
                    </div>

                    {logo && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span className="break-all">Selected: {logo.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              {/* Basic Information */}
              <section>
                <div className="mb-5">
                  <h4 className="font-bold text-slate-800">
                    Basic Information
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter your registered company name and GST details.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Company Name */}
                  <div>
                    <label className={labelClass}>
                      Company Name <Required />
                    </label>

                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Enter company name"
                        disabled={saving}
                        className={`${inputClass} pl-10`}
                        required
                      />
                    </div>
                  </div>

                  {/* GST */}
                  <div>
                    <label className={labelClass}>
                      GST Number <Required />
                    </label>

                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="text"
                        name="gstNo"
                        value={formData.gstNo}
                        onChange={handleChange}
                        placeholder="Enter GST number"
                        disabled={saving}
                        className={`${inputClass} pl-10 uppercase`}
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              {/* Contact Information */}
              <section>
                <div className="mb-5">
                  <h4 className="font-bold text-slate-800">
                    Contact Information
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Provide the contact details customers can use to reach your
                    company.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Email */}
                  <div>
                    <label className={labelClass}>
                      Company Email <Required />
                    </label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="company@example.com"
                        disabled={saving}
                        className={`${inputClass} pl-10`}
                        required
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div>
                    <label className={labelClass}>
                      Company Contact <Required />
                    </label>

                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="tel"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        placeholder="Enter contact number"
                        disabled={saving}
                        className={`${inputClass} pl-10`}
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              {/* Address */}
              <section>
                <div className="mb-5">
                  <h4 className="font-bold text-slate-800">Business Address</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Add your company's registered or business address.
                  </p>
                </div>

                <label className={labelClass}>
                  Company Address <Required />
                </label>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400" />

                  <textarea
                    name="address"
                    rows="4"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter complete company address"
                    disabled={saving}
                    className={`${inputClass} resize-none pl-10`}
                    required
                  />
                </div>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Your company information is managed securely.
              </p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Bottom Note */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-white/70 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <RefreshCw className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700">
              Keep your information up to date
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Updated company details can be used across your workspace records
              and billing information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
