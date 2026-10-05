import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios.js";

const ITEMS_PER_PAGE = 10;

const SPACE_GROUPS = {
  Workspace: {
    prefix: "WS",
    max: 45,
  },

  "Team Leads Cubicle": {
    prefix: "TLC",
    max: 4,
  },

  "Senior Leads Cubicle": {
    prefix: "SLC",
    max: 3,
  },

  "Manager Cubicle": {
    prefix: "MC",
    max: 2,
  },

  "Video Conferencing": {
    prefix: "VC",
    max: 1,
  },

  "Executive Cabin": {
    prefix: "EC",
    max: 2,
  },

  "CEO Cabin": {
    prefix: "CD",
    max: 1,
  },
};

const FIELD_LABELS = {
  space: "Space Type",
  perHour: "Per Hour",
  perDay: "Per Day",
  oneWeek: "One Week",
  twoWeeks: "Two Weeks",
  threeWeeks: "Three Weeks",
  perMonth: "Per Month",
  minDuration: "Min Duration",
  minDurationDesc: "Min Duration Description",
  maxDuration: "Max Duration",
  maxDurationDesc: "Max Duration Description",
  status: "Status",
};

const EMPTY_FORM = {
  space: "",
  perHour: "",
  perDay: "",
  oneWeek: "",
  twoWeeks: "",
  threeWeeks: "",
  perMonth: "",
  minDuration: "",
  minDurationDesc: "",
  maxDuration: "",
  maxDurationDesc: "",
  status: "Active",
};

const SpaceMaster = () => {
  const fileRef = useRef(null);

  const [spaces, setSpaces] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [editingSpace, setEditingSpace] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [previewImage, setPreviewImage] =
    useState(null);

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  /*
   * Fetch spaces.
   */
  const fetchSpaces = useCallback(
    async () => {
      try {
        setLoading(true);

        const response =
          await api.get("/space");

        if (response.data?.success) {
          setSpaces(
            response.data.spaces || []
          );
        } else {
          toast.error(
            response.data?.message ||
              "Failed to load spaces"
          );
        }
      } catch (error) {
        console.error(
          "Fetch spaces error:",
          error
        );

        toast.error(
          error.response?.data?.message ||
            "Failed to load spaces"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
   * Initial load.
   */
  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  /*
   * Search.
   */
  const filteredSpaces = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return spaces;
    }

    return spaces.filter((space) => {
      return (
        space.spaceCode
          ?.toLowerCase()
          .includes(value) ||
        space.space
          ?.toLowerCase()
          .includes(value) ||
        space.status
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [spaces, search]);

  /*
   * Pagination.
   */
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSpaces.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedSpaces = useMemo(() => {
    const start =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredSpaces.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [
    filteredSpaces,
    currentPage,
  ]);

  /*
   * Search handler.
   */
  const handleSearch = useCallback(
    (event) => {
      setSearch(
        event.target.value
      );

      setCurrentPage(1);
    },
    []
  );

  /*
   * Open edit modal.
   */
  const handleEdit = useCallback(
    (space) => {
      setEditingSpace(space);

      setSelectedImage(null);
      setImagePreview(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      setForm({
        space: space.space || "",

        perHour:
          space.perHour !== null &&
          space.perHour !== undefined
            ? String(space.perHour)
            : "",

        perDay:
          space.perDay !== null &&
          space.perDay !== undefined
            ? String(space.perDay)
            : "",

        oneWeek:
          space.oneWeek !== null &&
          space.oneWeek !== undefined
            ? String(space.oneWeek)
            : "",

        twoWeeks:
          space.twoWeeks !== null &&
          space.twoWeeks !== undefined
            ? String(space.twoWeeks)
            : "",

        threeWeeks:
          space.threeWeeks !== null &&
          space.threeWeeks !== undefined
            ? String(space.threeWeeks)
            : "",

        perMonth:
          space.perMonth !== null &&
          space.perMonth !== undefined
            ? String(space.perMonth)
            : "",

        minDuration:
          space.minDuration !== null &&
          space.minDuration !== undefined
            ? String(space.minDuration)
            : "",

        minDurationDesc:
          space.minDurationDesc || "",

        maxDuration:
          space.maxDuration !== null &&
          space.maxDuration !== undefined
            ? String(space.maxDuration)
            : "",

        maxDurationDesc:
          space.maxDurationDesc || "",

        status:
          space.status || "Active",
      });
    },
    []
  );

  /*
   * Close edit modal.
   */
  const handleCloseEdit =
    useCallback(() => {
      if (saving) {
        return;
      }

      setEditingSpace(null);

      setForm(EMPTY_FORM);

      setSelectedImage(null);

      setImagePreview(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }, [saving]);

  /*
   * Input handler.
   */
  const handleInput =
    useCallback((event) => {
      const {
        name,
        value,
      } = event.target;

      setForm((previous) => ({
        ...previous,
        [name]: value,
      }));
    }, []);

  /*
   * Image selection.
   */
  const handleImageChange =
    useCallback((event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      /*
       * Validate image type.
       */
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        toast.error(
          "Please select a valid image file"
        );

        event.target.value = "";

        return;
      }

      /*
       * Optional size validation.
       * 5 MB maximum.
       */
      if (
        file.size >
        5 * 1024 * 1024
      ) {
        toast.error(
          "Image size must be less than 5 MB"
        );

        event.target.value = "";

        return;
      }

      setSelectedImage(file);

      const previewUrl =
        URL.createObjectURL(file);

      setImagePreview(
        previewUrl
      );
    }, []);

  /*
   * Remove selected new image.
   */
  const removeSelectedImage =
    useCallback(() => {
      setSelectedImage(null);

      setImagePreview(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }, []);

  /*
   * Validate form.
   */
  const validateForm =
    useCallback(() => {
      if (!form.space) {
        toast.error(
          "Space type is required"
        );

        return false;
      }

      if (
        !form.perHour &&
        !form.perDay &&
        !form.perMonth
      ) {
        toast.error(
          "Provide at least one rate"
        );

        return false;
      }

      const numericFields = [
        "perHour",
        "perDay",
        "oneWeek",
        "twoWeeks",
        "threeWeeks",
        "perMonth",
        "minDuration",
        "maxDuration",
      ];

      for (const field of numericFields) {
        if (form[field] === "") {
          continue;
        }

        const number =
          Number(form[field]);

        if (
          Number.isNaN(number) ||
          number < 0
        ) {
          toast.error(
            `${FIELD_LABELS[field]} must be a valid non-negative number`
          );

          return false;
        }
      }

      return true;
    }, [form]);

  /*
   * Update space.
   *
   * Uses FormData because an image
   * may be uploaded.
   */
  const handleUpdate =
    useCallback(
      async (event) => {
        event.preventDefault();

        if (!editingSpace) {
          return;
        }

        if (!validateForm()) {
          return;
        }

        setSaving(true);

        try {
          const data =
            new FormData();

          /*
           * Add normal fields.
           */
          data.append(
            "space",
            form.space
          );

          data.append(
            "perHour",
            form.perHour
          );

          data.append(
            "perDay",
            form.perDay
          );

          data.append(
            "oneWeek",
            form.oneWeek
          );

          data.append(
            "twoWeeks",
            form.twoWeeks
          );

          data.append(
            "threeWeeks",
            form.threeWeeks
          );

          data.append(
            "perMonth",
            form.perMonth
          );

          data.append(
            "minDuration",
            form.minDuration
          );

          data.append(
            "minDurationDesc",
            form.minDurationDesc.trim()
          );

          data.append(
            "maxDuration",
            form.maxDuration
          );

          data.append(
            "maxDurationDesc",
            form.maxDurationDesc.trim()
          );

          data.append(
            "status",
            form.status
          );

          /*
           * Send old image URL so the backend
           * can remove it from Cloudinary after
           * the new image is successfully saved.
           */
          data.append(
            "oldImageUrl",
            editingSpace.image || ""
          );

          /*
           * Add new image only if selected.
           */
          if (selectedImage) {
            data.append(
              "image",
              selectedImage
            );
          }

          const response =
            await api.put(
              `/space/${editingSpace._id}`,
              data,
              {
                headers: {
                  "Content-Type":
                    "multipart/form-data",
                },
              }
            );

          if (
            !response.data?.success
          ) {
            toast.error(
              response.data?.message ||
                "Failed to update space"
            );

            return;
          }

          /*
           * Update local state.
           */
          const updatedSpace =
            response.data.space;

          setSpaces((previous) =>
            previous.map((item) =>
              item._id ===
              editingSpace._id
                ? updatedSpace
                : item
            )
          );

          toast.success(
            response.data?.message ||
              "Space updated successfully"
          );

          /*
           * Close modal.
           */
          setEditingSpace(null);

          setForm(EMPTY_FORM);

          setSelectedImage(null);

          setImagePreview(null);

          if (fileRef.current) {
            fileRef.current.value = "";
          }

          /*
           * Refresh from backend.
           */
          await fetchSpaces();
        } catch (error) {
          console.error(
            "Update space error:",
            error
          );

          toast.error(
            error.response?.data
              ?.message ||
              "Failed to update space"
          );
        } finally {
          setSaving(false);
        }
      },
      [
        editingSpace,
        form,
        validateForm,
        selectedImage,
        fetchSpaces,
      ]
    );

  /*
   * Preview image.
   */
  const handlePreview =
    useCallback((space) => {
      if (!space.image) {
        toast.info(
          "No image available for this space"
        );

        return;
      }

      setPreviewImage(space);
    }, []);

  /*
   * Close preview.
   */
  const closePreview =
    useCallback(() => {
      setPreviewImage(null);
    }, []);

  /*
   * Pagination.
   */
  const goToPage =
    useCallback(
      (page) => {
        if (
          page < 1 ||
          page > totalPages
        ) {
          return;
        }

        setCurrentPage(page);
      },
      [totalPages]
    );

  /*
   * Page numbers.
   */
  const pageNumbers = useMemo(() => {
    const pages = [];

    for (
      let i = 1;
      i <= totalPages;
      i++
    ) {
      pages.push(i);
    }

    return pages;
  }, [totalPages]);

  /*
   * Group information.
   */
  const getGroupInfo =
    useCallback(
      (spaceName) => {
        return SPACE_GROUPS[
          spaceName
        ];
      },
      []
    );

  return (
    <div className="p-6">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-2xl font-semibold">
            Space Master
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage all available spaces
          </p>
        </div>

        <div className="text-sm text-gray-600">
          Total Spaces:{" "}
          <span className="font-semibold">
            {spaces.length}
          </span>
        </div>

      </div>

      {/* SEARCH */}

      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">

        <div className="flex flex-col md:flex-row gap-3">

          <div className="flex-1">

            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by space code, space type or status..."
              className="w-full border border-orange-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
            />

          </div>

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={fetchSpaces}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-60"
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading spaces...
          </div>
        ) : paginatedSpaces.length ===
          0 ? (
          <div className="p-10 text-center text-gray-500">
            {search
              ? "No spaces found matching your search."
              : "No spaces available."}
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>
                <tr className="bg-orange-50 border-b">

                  <th className="text-left p-3 text-sm font-semibold">
                    #
                  </th>

                  <th className="text-left p-3 text-sm font-semibold">
                    Space Code
                  </th>

                  <th className="text-left p-3 text-sm font-semibold">
                    Space
                  </th>

                  <th className="text-left p-3 text-sm font-semibold">
                    Per Hour
                  </th>

                  <th className="text-left p-3 text-sm font-semibold">
                    Per Day
                  </th>

                  <th className="text-left p-3 text-sm font-semibold">
                    Per Month
                  </th>

                  <th className="text-left p-3 text-sm font-semibold">
                    Duration
                  </th>

                  <th className="text-left p-3 text-sm font-semibold">
                    Status
                  </th>

                  <th className="text-left p-3 text-sm font-semibold">
                    Image
                  </th>

                  <th className="text-left p-3 text-sm font-semibold">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {paginatedSpaces.map(
                  (space, index) => {
                    const group =
                      getGroupInfo(
                        space.space
                      );

                    return (
                      <tr
                        key={
                          space._id
                        }
                        className="border-b hover:bg-gray-50"
                      >

                        {/* NUMBER */}

                        <td className="p-3 text-sm text-gray-600">
                          {(currentPage -
                            1) *
                            ITEMS_PER_PAGE +
                            index +
                            1}
                        </td>

                        {/* CODE */}

                        <td className="p-3">
                          <span className="font-semibold text-orange-600">
                            {
                              space.spaceCode
                            }
                          </span>
                        </td>

                        {/* SPACE */}

                        <td className="p-3">

                          <div className="font-medium">
                            {
                              space.space
                            }
                          </div>

                          {group && (
                            <div className="text-xs text-gray-400 mt-1">
                              {
                                group.prefix
                              }{" "}
                              • Max{" "}
                              {
                                group.max
                              }
                            </div>
                          )}

                        </td>

                        {/* PER HOUR */}

                        <td className="p-3 text-sm">
                          {space.perHour ??
                            "-"}
                        </td>

                        {/* PER DAY */}

                        <td className="p-3 text-sm">
                          {space.perDay ??
                            "-"}
                        </td>

                        {/* PER MONTH */}

                        <td className="p-3 text-sm">
                          {space.perMonth ??
                            "-"}
                        </td>

                        {/* DURATION */}

                        <td className="p-3 text-sm">

                          {space.minDuration !==
                            null ||
                          space.maxDuration !==
                            null ? (
                            <div>

                              <div>
                                {space.minDuration ??
                                  "-"}{" "}
                                to{" "}
                                {space.maxDuration ??
                                  "-"}
                              </div>

                              <div className="text-xs text-gray-400">
                                {space.minDurationDesc ||
                                  ""}

                                {space.minDurationDesc &&
                                space.maxDurationDesc
                                  ? " - "
                                  : ""}

                                {space.maxDurationDesc ||
                                  ""}
                              </div>

                            </div>
                          ) : (
                            "-"
                          )}

                        </td>

                        {/* STATUS */}

                        <td className="p-3">

                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              space.status ===
                              "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {
                              space.status
                            }
                          </span>

                        </td>

                        {/* IMAGE */}

                        <td className="p-3">

                          {space.image ? (
                            <button
                              type="button"
                              onClick={() =>
                                handlePreview(
                                  space
                                )
                              }
                              className="w-12 h-12 rounded overflow-hidden border border-orange-200 hover:border-orange-500"
                            >
                              <img
                                src={
                                  space.image
                                }
                                alt={
                                  space.spaceCode
                                }
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No image
                            </span>
                          )}

                        </td>

                        {/* ACTION */}

                        <td className="p-3">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                space
                              )
                            }
                            className="px-3 py-1.5 border border-orange-400 text-orange-500 rounded hover:bg-orange-50"
                          >
                            Edit
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* PAGINATION */}

        {!loading &&
          filteredSpaces.length >
            0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t">

              <div className="text-sm text-gray-500">

                Showing{" "}

                <span className="font-medium">
                  {(currentPage -
                    1) *
                    ITEMS_PER_PAGE +
                    1}
                </span>

                {" "}to{" "}

                <span className="font-medium">
                  {Math.min(
                    currentPage *
                      ITEMS_PER_PAGE,
                    filteredSpaces.length
                  )}
                </span>

                {" "}of{" "}

                <span className="font-medium">
                  {
                    filteredSpaces.length
                  }
                </span>

                {" "}spaces

              </div>

              <div className="flex items-center gap-1">

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      currentPage -
                        1
                    )
                  }
                  disabled={
                    currentPage ===
                    1
                  }
                  className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>

                {pageNumbers.map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        goToPage(
                          page
                        )
                      }
                      className={`min-w-9 px-3 py-1.5 border rounded ${
                        currentPage ===
                        page
                          ? "bg-orange-500 text-white border-orange-500"
                          : "hover:bg-orange-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      currentPage +
                        1
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>

              </div>

            </div>
          )}

      </div>

      {/* EDIT MODAL */}

      {editingSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            {/* HEADER */}

            <div className="flex justify-between items-center p-5 border-b">

              <div>

                <h2 className="text-xl font-semibold">
                  Edit Space
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Code:{" "}
                  <span className="font-medium text-orange-500">
                    {
                      editingSpace.spaceCode
                    }
                  </span>
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseEdit
                }
                disabled={saving}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleUpdate
              }
            >

              <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT */}

                <div className="lg:col-span-2 space-y-4">

                  {/* SPACE TYPE */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Space Type
                    </label>

                    <select
                      name="space"
                      value={
                        form.space
                      }
                      onChange={
                        handleInput
                      }
                      disabled={
                        saving
                      }
                      className="w-full border border-orange-400 rounded px-3 py-2"
                    >

                      <option value="">
                        Select Space Type
                      </option>

                      {Object.keys(
                        SPACE_GROUPS
                      ).map(
                        (space) => (
                          <option
                            key={
                              space
                            }
                            value={
                              space
                            }
                          >
                            {
                              space
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* CODE */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Space Code
                    </label>

                    <input
                      value={
                        editingSpace.spaceCode
                      }
                      readOnly
                      className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                    />

                  </div>

                  {/* RATES */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {[
                      "perHour",
                      "perDay",
                      "perMonth",
                    ].map(
                      (field) => (
                        <div
                          key={
                            field
                          }
                        >

                          <label className="block text-sm text-gray-700 mb-1">
                            {
                              FIELD_LABELS[
                                field
                              ]
                            }
                          </label>

                          <input
                            name={
                              field
                            }
                            value={
                              form[
                                field
                              ]
                            }
                            onChange={
                              handleInput
                            }
                            type="number"
                            min="0"
                            step="any"
                            disabled={
                              saving
                            }
                            className="w-full border border-orange-400 rounded px-3 py-2"
                          />

                        </div>
                      )
                    )}

                  </div>

                  {/* WEEKLY */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {[
                      "oneWeek",
                      "twoWeeks",
                      "threeWeeks",
                    ].map(
                      (field) => (
                        <div
                          key={
                            field
                          }
                        >

                          <label className="block text-sm text-gray-700 mb-1">
                            {
                              FIELD_LABELS[
                                field
                              ]
                            }
                          </label>

                          <input
                            name={
                              field
                            }
                            value={
                              form[
                                field
                              ]
                            }
                            onChange={
                              handleInput
                            }
                            type="number"
                            min="0"
                            step="any"
                            disabled={
                              saving
                            }
                            className="w-full border border-orange-400 rounded px-3 py-2"
                          />

                        </div>
                      )
                    )}

                  </div>

                  {/* DURATIONS */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div>

                      <label className="block text-sm text-gray-700 mb-1">
                        Min Duration
                      </label>

                      <input
                        name="minDuration"
                        value={
                          form.minDuration
                        }
                        onChange={
                          handleInput
                        }
                        type="number"
                        min="0"
                        step="any"
                        disabled={
                          saving
                        }
                        className="w-full border border-orange-400 rounded px-3 py-2"
                      />

                    </div>

                    <div>

                      <label className="block text-sm text-gray-700 mb-1">
                        Min Duration Description
                      </label>

                      <input
                        name="minDurationDesc"
                        value={
                          form.minDurationDesc
                        }
                        onChange={
                          handleInput
                        }
                        disabled={
                          saving
                        }
                        className="w-full border border-orange-400 rounded px-3 py-2"
                      />

                    </div>

                    <div>

                      <label className="block text-sm text-gray-700 mb-1">
                        Max Duration
                      </label>

                      <input
                        name="maxDuration"
                        value={
                          form.maxDuration
                        }
                        onChange={
                          handleInput
                        }
                        type="number"
                        min="0"
                        step="any"
                        disabled={
                          saving
                        }
                        className="w-full border border-orange-400 rounded px-3 py-2"
                      />

                    </div>

                  </div>

                  {/* MAX DESCRIPTION */}

                  <div>

                    <label className="block text-sm text-gray-700 mb-1">
                      Max Duration Description
                    </label>

                    <input
                      name="maxDurationDesc"
                      value={
                        form.maxDurationDesc
                      }
                      onChange={
                        handleInput
                      }
                      disabled={
                        saving
                      }
                      className="w-full border border-orange-400 rounded px-3 py-2"
                    />

                  </div>

                  {/* STATUS */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleInput
                      }
                      disabled={
                        saving
                      }
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

                </div>

                {/* RIGHT - IMAGE */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Space Image
                  </label>

                  {/* Current / new image */}

                  <div className="border border-orange-300 rounded-lg bg-orange-50 p-2">

                    {imagePreview ? (
                      <img
                        src={
                          imagePreview
                        }
                        alt="New space preview"
                        className="w-full aspect-square object-cover rounded-md"
                      />
                    ) : editingSpace.image ? (
                      <img
                        src={
                          editingSpace.image
                        }
                        alt={
                          editingSpace.spaceCode
                        }
                        className="w-full aspect-square object-cover rounded-md"
                      />
                    ) : (
                      <div className="aspect-square flex items-center justify-center text-gray-400 text-sm">
                        No image available
                      </div>
                    )}

                  </div>

                  {/* File input */}

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={
                      handleImageChange
                    }
                    disabled={
                      saving
                    }
                    className="hidden"
                    id="space-image"
                  />

                  <label
                    htmlFor="space-image"
                    className="block w-full mt-3 px-3 py-2 text-center border border-orange-400 text-orange-500 rounded cursor-pointer hover:bg-orange-50"
                  >
                    {selectedImage
                      ? "Change Image"
                      : "Choose New Image"}
                  </label>

                  {/* Remove selected image */}

                  {selectedImage && (
                    <button
                      type="button"
                      onClick={
                        removeSelectedImage
                      }
                      disabled={
                        saving
                      }
                      className="w-full mt-2 px-3 py-2 border border-red-400 text-red-500 rounded hover:bg-red-50"
                    >
                      Remove New Image
                    </button>
                  )}

                  {/* Preview existing image */}

                  {!imagePreview &&
                    editingSpace.image && (
                      <button
                        type="button"
                        onClick={() =>
                          handlePreview(
                            editingSpace
                          )
                        }
                        className="w-full mt-2 px-3 py-2 border border-orange-400 text-orange-500 rounded hover:bg-orange-50"
                      >
                        Preview Image
                      </button>
                    )}

                  <p className="text-xs text-gray-400 mt-2">
                    PNG, JPG, JPEG or WEBP.
                    Maximum 5 MB.
                  </p>

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">

                <button
                  type="button"
                  onClick={
                    handleCloseEdit
                  }
                  disabled={
                    saving
                  }
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="px-5 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* IMAGE PREVIEW */}

      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={
            closePreview
          }
        >

          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-3"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              onClick={
                closePreview
              }
              className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full shadow text-xl"
            >
              ×
            </button>

            <img
              src={
                previewImage.image
              }
              alt={
                previewImage.spaceCode
              }
              className="max-w-full max-h-[80vh] object-contain rounded"
            />

            <div className="text-center mt-3">

              <p className="font-semibold">
                {
                  previewImage.spaceCode
                }
              </p>

              <p className="text-sm text-gray-500">
                {
                  previewImage.space
                }
              </p>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default SpaceMaster;
