import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios.js";

export const SPACE_GROUPS = {
  Workspace: { prefix: "WS", max: 45 },
  "Team Leads Cubicle": { prefix: "TLC", max: 4 },
  "Senior Leads Cubicle": { prefix: "SLC", max: 3 },
  "Manager Cubicle": { prefix: "MC", max: 2 },
  "Video Conferencing": { prefix: "VC", max: 1 },
  "Executive Cabin": { prefix: "EC", max: 2 },
  "CEO Cabin": { prefix: "CD", max: 1 },
};

const FIELD_LABELS = {
  per_hour: "Per Hour",
  per_day: "Per Day",
  per_month: "Per Month",
  one_week: "One Week",
  two_weeks: "Two Weeks",
  three_weeks: "Three Weeks",
  min_duration: "Min Duration",
  min_duration_desc: "Min Duration (text)",
  max_duration: "Max Duration",
  max_duration_desc: "Max Duration (text)",
};

const DEFAULT_FORM = {
  space: "",
  per_hour: "",
  per_day: "",
  one_week: "",
  two_weeks: "",
  three_weeks: "",
  per_month: "",
  min_duration: "",
  min_duration_desc: "",
  max_duration: "",
  max_duration_desc: "",
  status: "Active",
};

const DEFAULT_PRICES = {
  Workspace: {
    per_hour: "100",
    per_day: "500",
    one_week: "4800",
    two_weeks: "5760",
    three_weeks: "7200",
    per_month: "4000",
    min_duration: "1",
    min_duration_desc: "1 Day",
    max_duration: "30",
    max_duration_desc: "30 Day",
  },

  "Team Leads Cubicle": {
    per_hour: "120",
    per_day: "600",
    one_week: "5760",
    two_weeks: "6912",
    three_weeks: "8640",
    per_month: "4500",
    min_duration: "1",
    min_duration_desc: "1 Day",
    max_duration: "30",
    max_duration_desc: "30 Day",
  },

  "Senior Leads Cubicle": {
    per_hour: "120",
    per_day: "600",
    one_week: "5760",
    two_weeks: "6912",
    three_weeks: "8640",
    per_month: "4500",
    min_duration: "1",
    min_duration_desc: "1 Day",
    max_duration: "30",
    max_duration_desc: "30 Day",
  },

  "Manager Cubicle": {
    per_hour: "120",
    per_day: "750",
    one_week: "7200",
    two_weeks: "8640",
    three_weeks: "10800",
    per_month: "6000",
    min_duration: "1",
    min_duration_desc: "1 Day",
    max_duration: "30",
    max_duration_desc: "30 Day",
  },

  "Video Conferencing": {
    per_hour: "100",
    per_day: "",
    one_week: "",
    two_weeks: "",
    three_weeks: "",
    per_month: "",
    min_duration: "1",
    min_duration_desc: "1 Hour",
    max_duration: "8",
    max_duration_desc: "8 Hour",
  },

  "Executive Cabin": {
    per_hour: "200",
    per_day: "1000",
    one_week: "",
    two_weeks: "",
    three_weeks: "",
    per_month: "15000",
    min_duration: "1",
    min_duration_desc: "1 Hour",
    max_duration: "8",
    max_duration_desc: "8 Hour",
  },

  "CEO Cabin": {
    per_hour: "500",
    per_day: "4000",
    one_week: "",
    two_weeks: "",
    three_weeks: "",
    per_month: "50000",
    min_duration: "1",
    min_duration_desc: "1 Hour",
    max_duration: "8",
    max_duration_desc: "8 Hour",
  },
};

const AddSpaceMaster = () => {
  const [form, setForm] = useState(DEFAULT_FORM);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [spaces, setSpaces] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetchingSpaces, setFetchingSpaces] = useState(false);

  /*
   * Fetch spaces from backend.
   */
  const fetchSpaces = useCallback(async () => {
    try {
      setFetchingSpaces(true);

      const response = await api.get("/space");

      if (response.data?.success) {
        setSpaces(response.data.spaces || []);
      } else {
        toast.error(
          response.data?.message || "Failed to fetch spaces"
        );
      }
    } catch (error) {
      console.error("Fetch spaces error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load spaces"
      );
    } finally {
      setFetchingSpaces(false);
    }
  }, []);

  /*
   * Load spaces when component mounts.
   */
  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  /*
   * Handle form inputs.
   */
  const handleInput = useCallback((event) => {
    const { name, value } = event.target;

    /*
     * When space type changes, load default prices.
     *
     * Existing manually entered values are preserved.
     */
    if (name === "space") {
      const defaults = DEFAULT_PRICES[value] || {};

      setForm((previous) => {
        const updated = {
          ...previous,
          space: value,
        };

        Object.keys(defaults).forEach((key) => {
          if (
            !updated[key] &&
            defaults[key] !== ""
          ) {
            updated[key] = defaults[key];
          }
        });

        return updated;
      });

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }, []);

  /*
   * Handle image selection.
   *
   * The selected file is stored in state and
   * displayed immediately using a local preview.
   *
   * The actual upload happens when the form is submitted.
   */
  const handleImageChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image");
        event.target.value = "";
        return;
      }

      /*
       * Optional 5 MB frontend validation.
       *
       * Backend should still validate upload size.
       */
      const maxSize = 5 * 1024 * 1024;

      if (file.size > maxSize) {
        toast.error("Image size must be less than 5 MB");
        event.target.value = "";
        return;
      }

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      const objectUrl = URL.createObjectURL(file);

      setImage(file);
      setPreview(objectUrl);
    },
    [preview]
  );

  /*
   * Cleanup preview URL.
   */
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /*
   * Validate numeric values.
   */
  const isPositiveNumber = (value) => {
    return (
      value !== "" &&
      !Number.isNaN(Number(value)) &&
      Number(value) >= 0
    );
  };

  /*
   * Validate form.
   */
  const validate = useCallback(() => {
    if (!form.space) {
      toast.error("Select Space Type");
      return false;
    }

    /*
     * At least one primary rate is required.
     */
    if (
      !form.per_hour &&
      !form.per_day &&
      !form.per_month
    ) {
      toast.error("Provide at least one rate");
      return false;
    }

    /*
     * Validate numeric fields.
     */
    const numericFields = [
      "per_hour",
      "per_day",
      "one_week",
      "two_weeks",
      "three_weeks",
      "per_month",
      "min_duration",
      "max_duration",
    ];

    const invalidField = numericFields.find(
      (field) =>
        form[field] !== "" &&
        !isPositiveNumber(form[field])
    );

    if (invalidField) {
      toast.error(
        `${FIELD_LABELS[invalidField]} must be a valid non-negative number`
      );

      return false;
    }

    /*
     * Image is required for a new space.
     */
    if (!image) {
      toast.error("Please upload a space image");
      return false;
    }

    return true;
  }, [form, image]);

  /*
   * Add space to backend.
   *
   * IMPORTANT:
   *
   * Because an image is being uploaded, we use FormData.
   *
   * The backend route should be:
   *
   * router.post("/", upload.single("image"), createSpace);
   *
   * The field name MUST be "image".
   */
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!validate()) {
        return;
      }

      setLoading(true);

      try {
        const formData = new FormData();

        /*
         * Space information.
         */
        formData.append(
          "space",
          form.space
        );

        /*
         * Numeric values.
         *
         * Only append fields that contain values.
         * This allows the backend/model to use null/default
         * values for fields that were left empty.
         */
        const numericFields = {
          perHour: form.per_hour,
          perDay: form.per_day,
          oneWeek: form.one_week,
          twoWeeks: form.two_weeks,
          threeWeeks: form.three_weeks,
          perMonth: form.per_month,
          minDuration: form.min_duration,
          maxDuration: form.max_duration,
        };

        Object.entries(numericFields).forEach(
          ([key, value]) => {
            if (value !== "") {
              formData.append(
                key,
                Number(value)
              );
            }
          }
        );

        /*
         * Text fields.
         */
        formData.append(
          "minDurationDesc",
          form.min_duration_desc
        );

        formData.append(
          "maxDurationDesc",
          form.max_duration_desc
        );

        formData.append(
          "status",
          form.status
        );

        /*
         * Actual image file.
         *
         * This is what multer receives as req.file.
         */
        formData.append("image", image);

        /*
         * DO NOT manually set Content-Type.
         *
         * Axios/browser will automatically set:
         *
         * multipart/form-data;
         * boundary=...
         */
        const response = await api.post(
          "/space",
          formData
        );

        if (!response.data?.success) {
          toast.error(
            response.data?.message ||
              "Failed to add space"
          );

          return;
        }

        const createdSpace =
          response.data.space;

        toast.success(
          `Space ${
            createdSpace?.spaceCode || ""
          } added successfully!`
        );

        /*
         * Refresh list.
         */
        await fetchSpaces();

        /*
         * Reset form.
         */
        setForm({
          ...DEFAULT_FORM,
        });

        /*
         * Remove selected image.
         */
        if (preview) {
          URL.revokeObjectURL(preview);
        }

        setImage(null);
        setPreview(null);

        /*
         * Reset file input.
         *
         * React does not directly control the file input,
         * so resetting the form through state is not enough.
         */
        event.target.reset();
      } catch (error) {
        console.error(
          "Add space error:",
          error
        );

        toast.error(
          error.response?.data?.message ||
            "Failed to add space"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      form,
      image,
      preview,
      validate,
      fetchSpaces,
    ]
  );

  /*
   * Calculate group status using backend data.
   */
  const groupStatus = useMemo(() => {
    const status = {};

    Object.entries(SPACE_GROUPS).forEach(
      ([name, { prefix, max }]) => {
        const existing = spaces.filter(
          (space) =>
            space.spaceCode?.startsWith(prefix)
        ).length;

        status[name] = {
          existing,
          max,
        };
      }
    );

    return status;
  }, [spaces]);

  /*
   * Generate buttons.
   *
   * Bulk generation remains disabled because
   * there is no bulk endpoint.
   */
  const GenerateButtons = useMemo(() => {
    return (
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.keys(SPACE_GROUPS).map(
          (name) => {
            const {
              existing,
              max,
            } = groupStatus[name] || {
              existing: 0,
              max: SPACE_GROUPS[name].max,
            };

            const fullyCreated =
              existing >= max;

            return (
              <div key={name}>
                <button
                  type="button"
                  disabled
                  className={`w-full px-3 py-2 border rounded
                    bg-orange-50 text-orange-600
                    disabled:opacity-60
                    ${
                      fullyCreated
                        ? "line-through text-gray-400"
                        : ""
                    }`}
                >
                  {fullyCreated
                    ? `All ${name} created`
                    : `Generate ${name} (${existing}/${max})`}
                </button>
              </div>
            );
          }
        )}
      </div>
    );
  }, [groupStatus]);

  /*
   * Loading overlay.
   */
  const LoadingOverlay = () => {
    if (!loading) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white p-4 rounded shadow">
          <div className="font-medium">
            Saving space...
          </div>

          <div className="text-sm text-gray-500 mt-1">
            Uploading image to Cloudinary
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 relative">
      <LoadingOverlay />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Add New Space
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Create a new space and upload its image
          </p>
        </div>
      </div>

      {/* GROUP STATUS */}
      {GenerateButtons}

      {/* ADD SPACE FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-sm rounded-lg p-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-4">

            {/* SPACE TYPE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Space Name{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <select
                name="space"
                value={form.space}
                onChange={handleInput}
                disabled={loading}
                className="w-full border border-orange-400 rounded px-3 py-2"
              >
                <option value="">
                  Select Space Type
                </option>

                {Object.keys(
                  SPACE_GROUPS
                ).map((space) => (
                  <option
                    key={space}
                    value={space}
                  >
                    {space}
                  </option>
                ))}
              </select>
            </div>

            {/* SPACE CODE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Space Code
              </label>

              <input
                value={
                  form.space
                    ? "Generated by backend"
                    : ""
                }
                readOnly
                className="w-full border border-orange-400 rounded px-3 py-2 bg-gray-100"
                placeholder="Generated when space is added"
              />
            </div>

            {/* HOURLY / DAILY / MONTHLY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                "per_hour",
                "per_day",
                "per_month",
              ].map((field) => (
                <div key={field}>
                  <label className="block text-sm text-gray-700 mb-1">
                    {FIELD_LABELS[field]}
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    name={field}
                    value={form[field]}
                    onChange={handleInput}
                    inputMode="decimal"
                    disabled={loading}
                    className="w-full border border-orange-400 rounded px-3 py-2"
                  />
                </div>
              ))}
            </div>

            {/* WEEKLY PRICING */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                "one_week",
                "two_weeks",
                "three_weeks",
              ].map((field) => (
                <div key={field}>
                  <label className="block text-sm text-gray-700 mb-1">
                    {FIELD_LABELS[field]}
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    name={field}
                    value={form[field]}
                    onChange={handleInput}
                    inputMode="decimal"
                    disabled={loading}
                    className="w-full border border-orange-400 rounded px-3 py-2"
                  />
                </div>
              ))}
            </div>

            {/* DURATION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                "min_duration",
                "min_duration_desc",
                "max_duration",
              ].map((field) => (
                <div key={field}>
                  <label className="block text-sm text-gray-700 mb-1">
                    {FIELD_LABELS[field]}
                  </label>

                  <input
                    type={
                      field.includes("duration") &&
                      !field.includes("desc")
                        ? "number"
                        : "text"
                    }
                    min={
                      field.includes("duration") &&
                      !field.includes("desc")
                        ? "0"
                        : undefined
                    }
                    step={
                      field.includes("duration") &&
                      !field.includes("desc")
                        ? "any"
                        : undefined
                    }
                    name={field}
                    value={form[field]}
                    onChange={handleInput}
                    disabled={loading}
                    className="w-full border border-orange-400 rounded px-3 py-2"
                  />
                </div>
              ))}
            </div>

            {/* MAX DURATION DESCRIPTION */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Max Duration Description
              </label>

              <input
                type="text"
                name="max_duration_desc"
                value={
                  form.max_duration_desc
                }
                onChange={handleInput}
                disabled={loading}
                className="w-full border border-orange-400 rounded px-3 py-2"
              />
            </div>

            {/* IMAGE UPLOAD */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Space Image{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                disabled={loading}
                className="w-full border border-orange-400 rounded px-3 py-2 bg-white"
              />

              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: 5 MB.
                The image will be uploaded to
                Cloudinary when you save the space.
              </p>

              {image && (
                <p className="text-xs text-green-600 mt-1">
                  Selected: {image.name}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6 flex flex-col items-center">

            {/* IMAGE PREVIEW */}
            <div className="w-full flex justify-center mt-2">
              <div className="p-2 border border-orange-300 rounded-lg bg-orange-50 shadow-sm">

                {preview ? (
                  <img
                    src={preview}
                    alt="Space Preview"
                    className="w-64 h-64 object-cover rounded-md shadow-md"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-gray-400 text-sm">
                    No image selected
                  </div>
                )}

              </div>
            </div>

            {/* STATUS */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleInput}
                disabled={loading}
                className="w-full border border-orange-400 rounded px-3 py-2"
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>

            {/* SUBMIT */}
            <div className="pt-4 w-full">
              <button
                type="submit"
                disabled={
                  loading ||
                  fetchingSpaces
                }
                className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition disabled:opacity-60"
              >
                {loading
                  ? "Uploading & Saving..."
                  : "Add Space"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* BACKEND SPACE LIST */}
      <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Spaces
          </h2>

          {fetchingSpaces && (
            <span className="text-sm text-gray-500">
              Loading...
            </span>
          )}
        </div>

        {spaces.length === 0 &&
        !fetchingSpaces ? (
          <div className="text-center py-8 text-gray-500">
            No spaces found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2">
                    Code
                  </th>

                  <th className="text-left p-2">
                    Space
                  </th>

                  <th className="text-left p-2">
                    Image
                  </th>

                  <th className="text-left p-2">
                    Per Hour
                  </th>

                  <th className="text-left p-2">
                    Per Day
                  </th>

                  <th className="text-left p-2">
                    Per Month
                  </th>

                  <th className="text-left p-2">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {spaces.map((space) => (
                  <tr
                    key={space._id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-2 font-medium">
                      {space.spaceCode}
                    </td>

                    <td className="p-2">
                      {space.space}
                    </td>

                    <td className="p-2">
                      {space.image ? (
                        <img
                          src={space.image}
                          alt={space.spaceCode}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">
                          No image
                        </span>
                      )}
                    </td>

                    <td className="p-2">
                      {space.perHour ?? "-"}
                    </td>

                    <td className="p-2">
                      {space.perDay ?? "-"}
                    </td>

                    <td className="p-2">
                      {space.perMonth ?? "-"}
                    </td>

                    <td className="p-2">
                      <span
                        className={
                          space.status ===
                          "Active"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {space.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddSpaceMaster;
