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

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];

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
    "w-full rounded-xl border border-[#E9DED0] bg-[#FFFDFA] px-3.5 py-2.5 text-sm font-medium text-[#382B26] placeholder:font-normal placeholder:text-[#B5A79B] outline-none transition-all duration-200 hover:border-[#C9826C] focus:border-[#A95643] focus:ring-4 focus:ring-[#A95643]/10 disabled:cursor-not-allowed disabled:bg-[#FAF6EF]";

  const labelClass = "mb-1.5 block text-xs font-semibold text-[#514239]";

  const Required = () => <span className="ml-1 text-red-500">*</span>;

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
          <div className="flex flex-col items-center rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] px-8 py-7 shadow-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EDE6]">
              <LoaderCircle className="h-6 w-6 animate-spin text-[#A95643]" />
            </div>

            <h2 className="text-sm font-bold text-[#382B26]">
              Loading company profile
            </h2>

            <p className="mt-1 text-xs text-[#8F8175]">
              Please wait while we fetch your details...
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
          {/* Page Header */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-full bg-[#F8EDE6] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A95643]">
                  Oorza Workspace
                </span>

                <span className="text-xs font-medium text-[#A99B8E]">
                  / Settings
                </span>
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-[#382B26] sm:text-3xl">
                Company Profile
              </h1>

              <p className="mt-1 text-xs text-[#8F8175] sm:text-sm">
                Manage your business identity, contact details and company logo.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 self-start rounded-xl border border-[#E9DED0] bg-[#FFFDFA] px-3.5 py-2 shadow-sm sm:self-center">
              <ShieldCheck className="h-4 w-4 text-[#A95643]" />

              <span className="text-xs font-semibold text-[#514239]">
                Company Settings
              </span>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#C9826C] p-5 text-white shadow-lg shadow-[#71392F]/10 sm:p-6">
            <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[30px] border-white/10" />
            <div className="absolute -bottom-24 right-36 h-48 w-48 rounded-full bg-white/5" />

            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <div className="mb-2 flex items-center gap-2 text-[#F8EDE6]">
                  <Building2 className="h-4 w-4" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                    Business Information
                  </span>
                </div>

                <h2 className="text-xl font-bold sm:text-2xl">
                  Make your workspace official.
                </h2>

                <p className="mt-1.5 text-xs leading-relaxed text-white/80 sm:text-sm">
                  Keep your company details accurate and up to date for bookings,
                  invoices and business communication.
                </p>
              </div>

              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm sm:flex">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="overflow-hidden rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
            {/* Card Heading */}
            <div className="flex flex-col gap-2.5 border-b border-[#F0E8DE] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                  <FileText className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#382B26]">
                    Company Details
                  </h3>

                  <p className="mt-0.5 text-[11px] text-[#8F8175]">
                    Fields marked with * are required
                  </p>
                </div>
              </div>

              <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Profile Management
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-4 sm:p-6">
                {/* Logo Section */}
                <section>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-[#382B26]">
                      Company Branding
                    </h4>

                    <p className="mt-0.5 text-xs text-[#8F8175]">
                      Upload a logo to represent your company.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 rounded-xl border border-dashed border-[#DCC3B5] bg-[#FBF3ED] p-4 sm:flex-row sm:items-center">
                    {/* Logo Preview */}
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E9DED0] bg-white shadow-sm">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Company Logo"
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-[#C9826C]">
                          <Building2 className="mb-1.5 h-8 w-8" />
                          <span className="text-[10px] font-medium">
                            No Logo
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#A95643] text-white shadow-sm">
                        <Camera className="h-3 w-3" />
                      </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="min-w-0 flex-1">
                      <h5 className="text-sm font-semibold text-[#382B26]">
                        Company Logo
                      </h5>

                      <p className="mt-0.5 text-xs text-[#8F8175]">
                        Choose an image that clearly represents your business.
                      </p>

                      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        <label
                          htmlFor="company-logo"
                          className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-[#A95643] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#71392F] ${
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

                        <span className="text-[10px] text-[#A99B8E]">
                          PNG, JPG or JPEG · Max 2MB
                        </span>
                      </div>

                      {logo && (
                        <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-[#A95643]">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span className="break-all">
                            Selected: {logo.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <div className="h-px bg-[#F0E8DE]" />

                {/* Basic Information */}
                <section>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-[#382B26]">
                      Basic Information
                    </h4>

                    <p className="mt-0.5 text-xs text-[#8F8175]">
                      Enter your registered company name and GST details.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Company Name */}
                    <div>
                      <label className={labelClass}>
                        Company Name <Required />
                      </label>

                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A99B8E]" />

                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          placeholder="Enter company name"
                          disabled={saving}
                          className={`${inputClass} pl-9`}
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
                        <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A99B8E]" />

                        <input
                          type="text"
                          name="gstNo"
                          value={formData.gstNo}
                          onChange={handleChange}
                          placeholder="Enter GST number"
                          disabled={saving}
                          className={`${inputClass} pl-9 uppercase`}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-[#F0E8DE]" />

                {/* Contact Information */}
                <section>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-[#382B26]">
                      Contact Information
                    </h4>

                    <p className="mt-0.5 text-xs text-[#8F8175]">
                      Provide the contact details customers can use to reach
                      your company.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Email */}
                    <div>
                      <label className={labelClass}>
                        Company Email <Required />
                      </label>

                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A99B8E]" />

                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="company@example.com"
                          disabled={saving}
                          className={`${inputClass} pl-9`}
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
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A99B8E]" />

                        <input
                          type="tel"
                          name="contact"
                          value={formData.contact}
                          onChange={handleChange}
                          placeholder="Enter contact number"
                          disabled={saving}
                          className={`${inputClass} pl-9`}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-[#F0E8DE]" />

                {/* Address */}
                <section>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-[#382B26]">
                      Business Address
                    </h4>

                    <p className="mt-0.5 text-xs text-[#8F8175]">
                      Add your company's registered or business address.
                    </p>
                  </div>

                  <label className={labelClass}>
                    Company Address <Required />
                  </label>

                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#A99B8E]" />

                    <textarea
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter complete company address"
                      disabled={saving}
                      className={`${inputClass} resize-none pl-9`}
                      required
                    />
                  </div>
                </section>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#F0E8DE] bg-[#FBF8F3] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="hidden items-center gap-2 text-[11px] text-[#8F8175] sm:flex">
                  <ShieldCheck className="h-4 w-4 text-[#A95643]" />
                  Your company information is managed securely.
                </p>

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E9DED0] bg-white px-4 py-2.5 text-xs font-semibold text-[#8F8175] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#A95643] to-[#71392F] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#71392F]/15 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
              <RefreshCw className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-semibold text-[#382B26]">
                Keep your information up to date
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-[#8F8175]">
                Updated company details can be used across your workspace
                records and billing information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyProfile;