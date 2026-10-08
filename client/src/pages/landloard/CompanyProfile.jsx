import { useEffect, useState } from "react";
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

  /*
   * ============================
   * FETCH COMPANY PROFILE
   * ============================
   */
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        setLoading(true);

        const response = await api.get("/company");

        const result = response.data;

        if (!result.success) {
          toast.error(
            result.message ||
              "Failed to fetch company profile"
          );
          return;
        }

        /*
         * No company profile exists yet.
         */
        if (!result.company) {
          return;
        }

        const company = result.company;

        /*
         * Fill form with saved company data.
         */
        setFormData({
          companyName: company.companyName || "",
          gstNo: company.gstNo || "",
          email: company.email || "",
          contact: company.contact || "",
          address: company.address || "",
        });

        /*
         * Show existing Cloudinary logo.
         */
        if (company.logo) {
          setPreview(company.logo);
        }
      } catch (error) {
        console.error(
          "Error fetching company profile:",
          error
        );

        const errorMessage =
          error.response?.data?.message ||
          "Failed to fetch company profile";

        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyProfile();
  }, []);

  /*
   * ============================
   * HANDLE LOGO CHANGE
   * ============================
   */
  const handleLogoChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    /*
     * Check image type.
     */
    if (!file.type.startsWith("image/")) {
      toast.error(
        "Please select a valid image file."
      );

      e.target.value = "";
      return;
    }

    /*
     * Maximum size: 2MB
     */
    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        "Logo size should be less than 2MB."
      );

      e.target.value = "";
      return;
    }

    /*
     * Save selected image.
     */
    setLogo(file);

    /*
     * Show local preview.
     */
    const imageUrl = URL.createObjectURL(file);

    setPreview(imageUrl);
  };

  /*
   * ============================
   * HANDLE INPUT CHANGE
   * ============================
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
   * ============================
   * SAVE COMPANY PROFILE
   * ============================
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    /*
     * Frontend validation.
     */
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

      /*
       * FormData is required because
       * we may upload a logo.
       */
      const data = new FormData();

      data.append(
        "companyName",
        formData.companyName.trim()
      );

      data.append(
        "gstNo",
        formData.gstNo.trim().toUpperCase()
      );

      data.append(
        "email",
        formData.email.trim()
      );

      data.append(
        "contact",
        formData.contact.trim()
      );

      data.append(
        "address",
        formData.address.trim()
      );

      /*
       * Only send logo if a new one
       * was selected.
       */
      if (logo) {
        data.append("logo", logo);
      }

      /*
       * PUT /api/company
       *
       * Your axios interceptor automatically
       * adds the JWT Authorization header.
       */
      const response = await api.put(
        "/company",
        data
      );

      const result = response.data;

      if (!result.success) {
        toast.error(
          result.message ||
            "Failed to save company profile"
        );
        return;
      }

      /*
       * Update the form with the data returned
       * from the backend.
       */
      if (result.company) {
        const company = result.company;

        setFormData({
          companyName:
            company.companyName || "",
          gstNo: company.gstNo || "",
          email: company.email || "",
          contact: company.contact || "",
          address: company.address || "",
        });

        /*
         * Backend returns the Cloudinary URL.
         */
        if (company.logo) {
          setPreview(company.logo);
        }
      }

      /*
       * The selected file has already been uploaded.
       */
      setLogo(null);

      /*
       * Reset file input so the same file
       * can be selected again if needed.
       */
      const fileInput =
        document.getElementById(
          "company-logo"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      toast.success(
        result.message ||
          "Company profile saved successfully!"
      );
    } catch (error) {
      console.error(
        "Error saving company profile:",
        error
      );

      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong!";

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================
   * CLEAR FORM
   * ============================
   *
   * This only clears the frontend form.
   * It does NOT delete the company profile
   * from the database.
   */
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

    const fileInput =
      document.getElementById(
        "company-logo"
      );

    if (fileInput) {
      fileInput.value = "";
    }

    toast.info("Form cleared.");
  };

  /*
   * ============================
   * LOADING STATE
   * ============================
   */
  if (loading) {
    return (
      <>
        <ToastContainer
          position="top-right"
          autoClose={3000}
        />

        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">
            Loading company profile...
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <ToastContainer
        position="top-right"
        autoClose={3000}
      />

      {/* ============================
          PAGE HEADER
      ============================ */}
      <div className="max-w-5xl mx-auto mb-6">

        <h1 className="text-2xl font-semibold text-gray-800">
          Company Profile
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Manage your company information and logo
        </p>

      </div>

      {/* ============================
          MAIN CARD
      ============================ */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >

          {/* ============================
              COMPANY LOGO
          ============================ */}
          <div className="sm:col-span-2">

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

              {/* Logo Preview */}
              <div className="w-32 h-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">

                {preview ? (
                  <img
                    src={preview}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">

                    <div className="text-gray-400 text-3xl mb-1">
                      🏢
                    </div>

                    <p className="text-gray-400 text-xs">
                      No Logo
                    </p>

                  </div>
                )}

              </div>

              {/* Upload */}
              <div className="flex flex-col">

                <label className="text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>

                <input
                  id="company-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoChange}
                  disabled={saving}
                  className="border border-gray-300 rounded-lg p-2 text-sm w-full sm:w-72
                  focus:outline-none focus:ring-2 focus:ring-orange-500
                  focus:border-orange-500
                  disabled:bg-gray-100
                  disabled:cursor-not-allowed"
                />

                {logo && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {logo.name}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  PNG, JPG or JPEG. Maximum size 2MB.
                </p>

              </div>

            </div>

          </div>

          {/* ============================
              COMPANY NAME
          ============================ */}
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
              disabled={saving}
              className="w-full border border-gray-300 rounded-lg p-2.5
              focus:outline-none focus:ring-2 focus:ring-orange-500
              focus:border-orange-500
              disabled:bg-gray-100"
              required
            />

          </div>

          {/* ============================
              GST
          ============================ */}
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST No{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              name="gstNo"
              value={formData.gstNo}
              onChange={handleChange}
              placeholder="Enter GST number"
              disabled={saving}
              className="w-full border border-gray-300 rounded-lg p-2.5
              focus:outline-none focus:ring-2 focus:ring-orange-500
              focus:border-orange-500 uppercase
              disabled:bg-gray-100"
              required
            />

          </div>

          {/* ============================
              EMAIL
          ============================ */}
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Email{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter company email"
              disabled={saving}
              className="w-full border border-gray-300 rounded-lg p-2.5
              focus:outline-none focus:ring-2 focus:ring-orange-500
              focus:border-orange-500
              disabled:bg-gray-100"
              required
            />

          </div>

          {/* ============================
              CONTACT
          ============================ */}
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Contact{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="Enter contact number"
              disabled={saving}
              className="w-full border border-gray-300 rounded-lg p-2.5
              focus:outline-none focus:ring-2 focus:ring-orange-500
              focus:border-orange-500
              disabled:bg-gray-100"
              required
            />

          </div>

          {/* ============================
              ADDRESS
          ============================ */}
          <div className="sm:col-span-2">

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <textarea
              name="address"
              rows="4"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter company address"
              disabled={saving}
              className="w-full border border-gray-300 rounded-lg p-2.5
              focus:outline-none focus:ring-2 focus:ring-orange-500
              focus:border-orange-500 resize-none
              disabled:bg-gray-100"
              required
            />

          </div>

          {/* ============================
              BUTTONS
          ============================ */}
          <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">

            {/* Clear */}
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg border border-gray-300
              text-gray-700 font-medium hover:bg-gray-50
              transition
              disabled:bg-gray-100
              disabled:cursor-not-allowed"
            >
              Clear
            </button>

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600
              disabled:bg-orange-300
              disabled:cursor-not-allowed
              text-white font-medium px-6 py-2.5 rounded-lg
              shadow-sm transition"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default CompanyProfile;