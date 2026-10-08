import { useEffect, useState } from "react";
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

  /*
   * Fetch logged-in user's profile
   */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await api.get("/profile");

        const result = response.data;

        if (!result.success || !result.user) {
          toast.error(
            result.message || "Failed to fetch profile"
          );
          return;
        }

        const user = result.user;

        setFormData({
          name: user.name || "",
          contact: user.phone || "",
          email: user.email || "",
          designation: user.designation || "",
          dob: user.dob
            ? user.dob.substring(0, 10)
            : "",
          address: user.address || "",
        });

        /*
         * Show existing Cloudinary profile image
         */
        if (user.profilePic) {
          setPreview(user.profilePic);
        }
      } catch (error) {
        console.error(
          "Error fetching profile:",
          error
        );

        const errorMessage =
          error.response?.data?.message ||
          "Failed to fetch profile";

        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /*
   * Handle profile image selection
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    /*
     * Check that the selected file is an image
     */
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    /*
     * Maximum image size: 5 MB
     */
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        "Profile image must be less than 5 MB"
      );
      return;
    }

    /*
     * Save selected file
     */
    setProfilePic(file);

    /*
     * Show local preview immediately
     */
    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  /*
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
   * Submit profile
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    /*
     * Frontend validation
     */
    if (!formData.name.trim()) {
      toast.error("Name is required!");
      return;
    }

    if (!formData.contact.trim()) {
      toast.error("Contact number is required!");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required!");
      return;
    }

    if (!formData.designation.trim()) {
      toast.error("Designation is required!");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Address is required!");
      return;
    }

    try {
      setSaving(true);

      /*
       * Create FormData because we may
       * be uploading an image.
       */
      const data = new FormData();

      data.append(
        "name",
        formData.name.trim()
      );

      data.append(
        "phone",
        formData.contact.trim()
      );

      data.append(
        "email",
        formData.email.trim()
      );

      /*
       * IMPORTANT:
       *
       * Designation is now a separate
       * field in User.js.
       *
       * We do NOT send "role".
       */
      data.append(
        "designation",
        formData.designation.trim()
      );

      data.append(
        "dob",
        formData.dob
      );

      data.append(
        "address",
        formData.address.trim()
      );

      /*
       * Only send profilePic when the user
       * selected a new image.
       */
      if (profilePic) {
        data.append(
          "profilePic",
          profilePic
        );
      }

      /*
       * Send request.
       *
       * Your axios interceptor automatically
       * adds the JWT Authorization header.
       */
      const response = await api.put(
        "/profile",
        data
      );

      const result = response.data;

      if (!result.success) {
        toast.error(
          result.message ||
            "Failed to update profile"
        );
        return;
      }

      /*
       * Update UI with the data returned
       * by the backend.
       */
      if (result.user) {
        const user = result.user;

        setFormData({
          name: user.name || "",
          contact: user.phone || "",
          email: user.email || "",
          designation: user.designation || "",
          dob: user.dob
            ? user.dob.substring(0, 10)
            : "",
          address: user.address || "",
        });

        /*
         * Backend returns the new
         * Cloudinary URL.
         */
        if (user.profilePic) {
          setPreview(user.profilePic);
        }
      }

      /*
       * Clear selected file because it has
       * already been uploaded.
       */
      setProfilePic(null);

      toast.success(
        result.message ||
          "Profile updated successfully!"
      );
    } catch (error) {
      console.error(
        "Error updating profile:",
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
   * Loading screen
   */
  if (loading) {
    return (
      <>
        <ToastContainer
          position="top-right"
          autoClose={3000}
        />

        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-gray-600">
            Loading profile...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
      />

      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">

          {/* Page Title */}
          <h1 className="text-2xl font-semibold mb-6 text-gray-800">
            User Profile
          </h1>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow p-6">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >

              {/* =========================
                  PROFILE PICTURE
              ========================== */}
              <div className="sm:col-span-2 flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">

                {/* Preview */}
                <div className="w-32 h-32 rounded-full border overflow-hidden bg-gray-100 flex-shrink-0">

                  {preview ? (
                    <img
                      src={preview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
                      No Image
                    </div>
                  )}

                </div>

                {/* Upload */}
                <div className="flex flex-col">

                  <label className="text-sm font-medium text-gray-700 mb-2">
                    Upload Profile Pic
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={saving}
                    className="border border-gray-300 rounded-md p-2 text-sm w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100"
                  />

                  {profilePic && (
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {profilePic.name}
                    </p>
                  )}

                </div>
              </div>

              {/* =========================
                  NAME
              ========================== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter Your Name"
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100"
                  required
                />
              </div>

              {/* =========================
                  CONTACT
              ========================== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact No{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Enter Your Contact No"
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100"
                  required
                />
              </div>

              {/* =========================
                  EMAIL
              ========================== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Id{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Email"
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100"
                  required
                />
              </div>

              {/* =========================
                  DESIGNATION
              ========================== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Enter Designation"
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100"
                  required
                />
              </div>

              {/* =========================
                  DATE OF BIRTH
              ========================== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>

                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100"
                />
              </div>

              {/* =========================
                  ADDRESS
              ========================== */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <textarea
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter Address"
                  disabled={saving}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none disabled:bg-gray-100"
                  required
                />
              </div>

              {/* =========================
                  SAVE BUTTON
              ========================== */}
              <div className="sm:col-span-2 mt-4 flex justify-end">

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg shadow transition-all"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile2;