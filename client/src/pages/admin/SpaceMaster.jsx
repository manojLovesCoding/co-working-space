import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Building2,
  Search,
  RefreshCw,
  Pencil,
  ImagePlus,
  X,
  UploadCloud,
  Trash2,
  Clock3,
  CalendarDays,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Layers3,
  CheckCircle2,
  AlertCircle,
  Eye,
  LoaderCircle,
  Armchair,
  Hash,
  ShieldCheck,
} from "lucide-react";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios.js";

const ITEMS_PER_PAGE = 10;

const SPACE_GROUPS = {
  Workspace: { prefix: "WS", max: 45 },
  "Team Leads Cubicle": { prefix: "TLC", max: 4 },
  "Senior Leads Cubicle": { prefix: "SLC", max: 3 },
  "Manager Cubicle": { prefix: "MC", max: 2 },
  "Video Conferencing": { prefix: "VC", max: 1 },
  "Executive Cabin": { prefix: "EC", max: 2 },
  "CEO Cabin": { prefix: "CD", max: 1 },
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

const inputClass =
  "w-full rounded-xl border border-[#E9DED0] bg-[#FBF3ED] px-3.5 py-2.5 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99A8D] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "mb-1.5 block text-sm font-medium text-[#5D4A40]";

const SpaceMaster = () => {
  const fileRef = useRef(null);

  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [editingSpace, setEditingSpace] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [previewImage, setPreviewImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  /*
   * Fetch spaces.
   */
  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/space");

      if (response.data?.success) {
        setSpaces(response.data.spaces || []);
      } else {
        toast.error(response.data?.message || "Failed to load spaces");
      }
    } catch (error) {
      console.error("Fetch spaces error:", error);

      toast.error(error.response?.data?.message || "Failed to load spaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  /*
   * Search.
   */
  const filteredSpaces = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return spaces;

    return spaces.filter(
      (space) =>
        space.spaceCode?.toLowerCase().includes(value) ||
        space.space?.toLowerCase().includes(value) ||
        space.status?.toLowerCase().includes(value),
    );
  }, [spaces, search]);

  /*
   * Pagination.
   */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSpaces.length / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedSpaces = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredSpaces.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSpaces, currentPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return pages;
  }, [totalPages]);

  const activeSpaces = useMemo(
    () => spaces.filter((space) => space.status === "Active").length,
    [spaces],
  );

  const inactiveSpaces = spaces.length - activeSpaces;

  /*
   * Search handler.
   */
  const handleSearch = useCallback((event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  }, []);

  /*
   * Open edit modal.
   */
  const handleEdit = useCallback((space) => {
    setEditingSpace(space);

    setSelectedImage(null);
    setImagePreview(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }

    setForm({
      space: space.space || "",

      perHour:
        space.perHour !== null && space.perHour !== undefined
          ? String(space.perHour)
          : "",

      perDay:
        space.perDay !== null && space.perDay !== undefined
          ? String(space.perDay)
          : "",

      oneWeek:
        space.oneWeek !== null && space.oneWeek !== undefined
          ? String(space.oneWeek)
          : "",

      twoWeeks:
        space.twoWeeks !== null && space.twoWeeks !== undefined
          ? String(space.twoWeeks)
          : "",

      threeWeeks:
        space.threeWeeks !== null && space.threeWeeks !== undefined
          ? String(space.threeWeeks)
          : "",

      perMonth:
        space.perMonth !== null && space.perMonth !== undefined
          ? String(space.perMonth)
          : "",

      minDuration:
        space.minDuration !== null && space.minDuration !== undefined
          ? String(space.minDuration)
          : "",

      minDurationDesc: space.minDurationDesc || "",

      maxDuration:
        space.maxDuration !== null && space.maxDuration !== undefined
          ? String(space.maxDuration)
          : "",

      maxDurationDesc: space.maxDurationDesc || "",
      status: space.status || "Active",
    });
  }, []);

  /*
   * Close edit modal.
   */
  const handleCloseEdit = useCallback(() => {
    if (saving) return;

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
  const handleInput = useCallback((event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }, []);

  /*
   * Image selection.
   */
  const handleImageChange = useCallback((event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5 MB");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }, []);

  /*
   * Remove selected new image.
   */
  const removeSelectedImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }, []);

  /*
   * Validate form.
   */
  const validateForm = useCallback(() => {
    if (!form.space) {
      toast.error("Space type is required");
      return false;
    }

    if (!form.perHour && !form.perDay && !form.perMonth) {
      toast.error("Provide at least one rate");
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
      if (form[field] === "") continue;

      const number = Number(form[field]);

      if (Number.isNaN(number) || number < 0) {
        toast.error(
          `${FIELD_LABELS[field]} must be a valid non-negative number`,
        );

        return false;
      }
    }

    return true;
  }, [form]);

  /*
   * Update space.
   */
  const handleUpdate = useCallback(
    async (event) => {
      event.preventDefault();

      if (!editingSpace) return;
      if (!validateForm()) return;

      setSaving(true);

      try {
        const data = new FormData();

        data.append("space", form.space);
        data.append("perHour", form.perHour);
        data.append("perDay", form.perDay);
        data.append("oneWeek", form.oneWeek);
        data.append("twoWeeks", form.twoWeeks);
        data.append("threeWeeks", form.threeWeeks);
        data.append("perMonth", form.perMonth);
        data.append("minDuration", form.minDuration);
        data.append("minDurationDesc", form.minDurationDesc.trim());
        data.append("maxDuration", form.maxDuration);
        data.append("maxDurationDesc", form.maxDurationDesc.trim());
        data.append("status", form.status);

        data.append("oldImageUrl", editingSpace.image || "");

        if (selectedImage) {
          data.append("image", selectedImage);
        }

        const response = await api.put(`/space/${editingSpace._id}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (!response.data?.success) {
          toast.error(response.data?.message || "Failed to update space");

          return;
        }

        const updatedSpace = response.data.space;

        setSpaces((previous) =>
          previous.map((item) =>
            item._id === editingSpace._id ? updatedSpace : item,
          ),
        );

        toast.success(response.data?.message || "Space updated successfully");

        setEditingSpace(null);
        setForm(EMPTY_FORM);
        setSelectedImage(null);
        setImagePreview(null);

        if (fileRef.current) {
          fileRef.current.value = "";
        }

        await fetchSpaces();
      } catch (error) {
        console.error("Update space error:", error);

        toast.error(error.response?.data?.message || "Failed to update space");
      } finally {
        setSaving(false);
      }
    },
    [editingSpace, form, validateForm, selectedImage, fetchSpaces],
  );

  /*
   * Preview image.
   */
  const handlePreview = useCallback((space) => {
    if (!space.image) {
      toast.info("No image available for this space");
      return;
    }

    setPreviewImage(space);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  /*
   * Pagination.
   */
  const goToPage = useCallback(
    (page) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
    },
    [totalPages],
  );

  const getGroupInfo = useCallback((spaceName) => SPACE_GROUPS[spaceName], []);

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-4 sm:p-5 lg:p-6">
      {/* PAGE HEADER */}
      <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#71392F] via-[#A95643] to-[#C9826C] p-5 text-white shadow-lg shadow-[#71392F]/15 sm:p-6">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
              <Building2 size={17} />
              <span>Oorza Administration</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Space Master
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
              Manage your workspace inventory, pricing, booking durations and
              space availability from one place.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Layers3 size={23} />
            </div>

            <div>
              <p className="text-sm text-white/80">Total spaces</p>
              <p className="text-2xl font-bold tabular-nums">
                {loading ? "..." : spaces.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E9DED0] bg-[#FFFDFA] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8F8175]">Total Spaces</p>
              <h3 className="mt-1.5 text-2xl font-bold text-[#382B26]">
                {loading ? "—" : spaces.length}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
              <Building2 size={22} />
            </div>
          </div>
          <p className="mt-2.5 text-xs text-[#A99A8D]">
            Registered workspace inventory
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-[#FFFDFA] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8F8175]">
                Active Spaces
              </p>
              <h3 className="mt-1.5 text-2xl font-bold text-emerald-600">
                {loading ? "—" : activeSpaces}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <p className="mt-2.5 text-xs text-[#A99A8D]">
            Currently enabled spaces
          </p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-[#FFFDFA] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8F8175]">
                Inactive Spaces
              </p>
              <h3 className="mt-1.5 text-2xl font-bold text-amber-600">
                {loading ? "—" : inactiveSpaces}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle size={22} />
            </div>
          </div>
          <p className="mt-2.5 text-xs text-[#A99A8D]">
            Currently disabled spaces
          </p>
        </div>
      </div>

      {/* SPACE LIST */}
      <div className="overflow-hidden rounded-2xl border border-[#E9DED0] bg-[#FFFDFA] shadow-sm">
        {/* TABLE HEADER */}
        <div className="border-b border-[#E9DED0] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#382B26]">
                Workspace Inventory
              </h2>
              <p className="mt-1 text-sm text-[#8F8175]">
                View and manage your registered spaces.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <div className="relative min-w-0 sm:w-80">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A99A8D]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search code, type or status..."
                  className="w-full rounded-xl border border-[#E9DED0] bg-[#FBF3ED] py-2.5 pl-10 pr-4 text-sm text-[#382B26] outline-none transition placeholder:text-[#A99A8D] focus:border-[#A95643] focus:bg-white focus:ring-4 focus:ring-[#A95643]/10"
                />
              </div>

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#E9DED0] px-4 py-2.5 text-sm font-medium text-[#6F5B50] transition hover:bg-[#F8EDE6]"
                >
                  <X size={16} />
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={fetchSpaces}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#A95643] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#71392F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoaderCircle size={34} className="animate-spin text-[#A95643]" />
            <p className="mt-4 text-sm font-medium text-[#8F8175]">
              Loading workspace inventory...
            </p>
          </div>
        ) : paginatedSpaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8EDE6] text-[#A95643]">
              <Building2 size={30} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-[#382B26]">
              {search ? "No matching spaces" : "No spaces available"}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-[#8F8175]">
              {search
                ? "Try searching with another space name, code or status."
                : "Your registered workspace spaces will appear here."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 rounded-xl bg-[#F8EDE6] px-4 py-2 text-sm font-semibold text-[#A95643] transition hover:bg-[#F1DED4]"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="bg-[#F8EDE6] text-left">
                  {[
                    "#",
                    "Space Details",
                    "Space Code",
                    "Hourly",
                    "Daily",
                    "Monthly",
                    "Duration",
                    "Status",
                    "Image",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#806B5F]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0E7DE]">
                {paginatedSpaces.map((space, index) => {
                  const group = getGroupInfo(space.space);

                  return (
                    <tr
                      key={space._id}
                      className="transition hover:bg-[#FBF3ED]/70"
                    >
                      <td className="px-4 py-3.5 text-sm text-[#A99A8D]">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE6] text-[#A95643]">
                            <Armchair size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-[#382B26]">
                              {space.space}
                            </p>
                            {group && (
                              <p className="mt-1 text-xs text-[#A99A8D]">
                                {group.prefix} · Maximum {group.max}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8EDE6] px-2.5 py-1.5 text-xs font-bold text-[#8B4436]">
                          <Hash size={12} />
                          {space.spaceCode}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-sm font-medium text-[#5D4A40]">
                        {space.perHour ?? "-"}
                      </td>

                      <td className="px-4 py-3.5 text-sm font-medium text-[#5D4A40]">
                        {space.perDay ?? "-"}
                      </td>

                      <td className="px-4 py-3.5 text-sm font-medium text-[#5D4A40]">
                        {space.perMonth ?? "-"}
                      </td>

                      <td className="px-4 py-3.5">
                        {space.minDuration !== null ||
                        space.maxDuration !== null ? (
                          <div>
                            <p className="text-sm font-semibold text-[#5D4A40]">
                              {space.minDuration ?? "-"} to{" "}
                              {space.maxDuration ?? "-"}
                            </p>

                            <p className="mt-1 max-w-[150px] text-xs text-[#A99A8D]">
                              {space.minDurationDesc || ""}
                              {space.minDurationDesc && space.maxDurationDesc
                                ? " - "
                                : ""}
                              {space.maxDurationDesc || ""}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-[#A99A8D]">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            space.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              space.status === "Active"
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {space.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {space.image ? (
                          <button
                            type="button"
                            onClick={() => handlePreview(space)}
                            className="group relative h-11 w-11 overflow-hidden rounded-xl border border-[#E9DED0]"
                            title="Preview image"
                          >
                            <img
                              src={space.image}
                              alt={space.spaceCode}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-[#71392F]/50 text-white opacity-0 transition group-hover:opacity-100">
                              <Eye size={16} />
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-[#A99A8D]">
                            No image
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(space)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#E3C6B9] bg-white px-3.5 py-2 text-xs font-semibold text-[#A95643] transition hover:border-[#A95643] hover:bg-[#A95643] hover:text-white"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filteredSpaces.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#E9DED0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-[#8F8175]">
              Showing{" "}
              <span className="font-semibold text-[#382B26]">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#382B26]">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredSpaces.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#382B26]">
                {filteredSpaces.length}
              </span>{" "}
              spaces
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-[#E9DED0] px-3 py-2 text-xs font-semibold text-[#6F5B50] transition hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`h-9 min-w-9 rounded-lg px-3 text-xs font-semibold transition ${
                    currentPage === page
                      ? "bg-[#A95643] text-white shadow-sm shadow-[#A95643]/20"
                      : "border border-[#E9DED0] text-[#6F5B50] hover:border-[#C9826C] hover:bg-[#F8EDE6]"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-[#E9DED0] px-3 py-2 text-xs font-semibold text-[#6F5B50] transition hover:bg-[#F8EDE6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#382B26]/65 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#FFFDFA] shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#71392F] to-[#A95643] px-5 py-4 text-white sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Pencil size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold sm:text-xl">Edit Space</h2>

                  <p className="mt-1 text-xs text-white/75">
                    Update workspace details and pricing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL FORM */}
            <form
              onSubmit={handleUpdate}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="overflow-y-auto p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  {/* LEFT FORM */}
                  <div className="space-y-4 lg:col-span-2">
                    {/* SPACE DETAILS */}
                    <section className="rounded-xl border border-[#E9DED0] bg-[#FBF3ED] p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1DED4] text-[#A95643]">
                          <Building2 size={18} />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-[#382B26]">
                            Space Details
                          </h3>
                          <p className="text-xs text-[#8F8175]">
                            Basic workspace information
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Space Type</label>

                          <select
                            name="space"
                            value={form.space}
                            onChange={handleInput}
                            disabled={saving}
                            className={inputClass}
                          >
                            <option value="">Select Space Type</option>

                            {Object.keys(SPACE_GROUPS).map((space) => (
                              <option key={space} value={space}>
                                {space}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={labelClass}>Space Code</label>

                          <input
                            value={editingSpace.spaceCode}
                            readOnly
                            className={`${inputClass} bg-[#F1E8DE] font-semibold text-[#A95643]`}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelClass}>Status</label>

                          <select
                            name="status"
                            value={form.status}
                            onChange={handleInput}
                            disabled={saving}
                            className={inputClass}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    {/* PRICING */}
                    <section className="rounded-xl border border-[#E9DED0] bg-white p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                          <IndianRupee size={18} />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-[#382B26]">
                            Pricing Configuration
                          </h3>
                          <p className="text-xs text-[#8F8175]">
                            Set the booking rates for this space
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                        {["perHour", "perDay", "perMonth"].map((field) => (
                          <div key={field}>
                            <label className={labelClass}>
                              {FIELD_LABELS[field]}
                            </label>

                            <div className="relative">
                              <IndianRupee
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A99A8D]"
                              />

                              <input
                                name={field}
                                value={form[field]}
                                onChange={handleInput}
                                type="number"
                                min="0"
                                step="any"
                                disabled={saving}
                                placeholder="0.00"
                                className={`${inputClass} pl-9`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="my-4 border-t border-dashed border-[#E9DED0]" />

                      <div className="mb-3 flex items-center gap-2">
                        <CalendarDays size={16} className="text-[#A95643]" />
                        <p className="text-xs font-bold uppercase tracking-wider text-[#806B5F]">
                          Extended Booking Rates
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                        {["oneWeek", "twoWeeks", "threeWeeks"].map((field) => (
                          <div key={field}>
                            <label className={labelClass}>
                              {FIELD_LABELS[field]}
                            </label>

                            <div className="relative">
                              <IndianRupee
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A99A8D]"
                              />

                              <input
                                name={field}
                                value={form[field]}
                                onChange={handleInput}
                                type="number"
                                min="0"
                                step="any"
                                disabled={saving}
                                placeholder="0.00"
                                className={`${inputClass} pl-9`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* DURATION */}
                    <section className="rounded-xl border border-[#E9DED0] bg-[#FBF3ED] p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1DED4] text-[#A95643]">
                          <Clock3 size={18} />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-[#382B26]">
                            Booking Duration
                          </h3>
                          <p className="text-xs text-[#8F8175]">
                            Configure minimum and maximum duration
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Min Duration</label>

                          <input
                            name="minDuration"
                            value={form.minDuration}
                            onChange={handleInput}
                            type="number"
                            min="0"
                            step="any"
                            disabled={saving}
                            placeholder="Minimum duration"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            Min Duration Description
                          </label>

                          <input
                            name="minDurationDesc"
                            value={form.minDurationDesc}
                            onChange={handleInput}
                            disabled={saving}
                            placeholder="e.g. 1 Hour"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Max Duration</label>

                          <input
                            name="maxDuration"
                            value={form.maxDuration}
                            onChange={handleInput}
                            type="number"
                            min="0"
                            step="any"
                            disabled={saving}
                            placeholder="Maximum duration"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            Max Duration Description
                          </label>

                          <input
                            name="maxDurationDesc"
                            value={form.maxDurationDesc}
                            onChange={handleInput}
                            disabled={saving}
                            placeholder="e.g. 30 Days"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* RIGHT IMAGE PANEL */}
                  <div className="space-y-4">
                    <section className="rounded-xl border border-[#E9DED0] bg-white p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8EDE6] text-[#A95643]">
                          <ImagePlus size={18} />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-[#382B26]">
                            Space Image
                          </h3>
                          <p className="text-xs text-[#8F8175]">
                            Update the space photo
                          </p>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-[#E9DED0] bg-[#FBF3ED]">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="New space preview"
                            className="aspect-square w-full object-cover"
                          />
                        ) : editingSpace.image ? (
                          <img
                            src={editingSpace.image}
                            alt={editingSpace.spaceCode}
                            className="aspect-square w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-square flex-col items-center justify-center text-[#A99A8D]">
                            <ImagePlus size={38} strokeWidth={1.4} />
                            <p className="mt-3 text-sm">No image available</p>
                          </div>
                        )}
                      </div>

                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleImageChange}
                        disabled={saving}
                        className="hidden"
                        id="space-image"
                      />

                      <label
                        htmlFor="space-image"
                        className={`mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E3C6B9] bg-[#F8EDE6] px-4 py-3 text-sm font-semibold text-[#A95643] transition hover:border-[#A95643] hover:bg-[#F1DED4] ${
                          saving ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        <UploadCloud size={17} />
                        {selectedImage ? "Change Image" : "Choose New Image"}
                      </label>

                      {selectedImage && (
                        <button
                          type="button"
                          onClick={removeSelectedImage}
                          disabled={saving}
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Remove New Image
                        </button>
                      )}

                      {!imagePreview && editingSpace.image && (
                        <button
                          type="button"
                          onClick={() => handlePreview(editingSpace)}
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E9DED0] px-4 py-2.5 text-sm font-medium text-[#6F5B50] transition hover:bg-[#FBF3ED]"
                        >
                          <Eye size={15} />
                          Preview Image
                        </button>
                      )}

                      <div className="mt-4 rounded-xl bg-[#FBF3ED] p-3">
                        <div className="flex items-start gap-2">
                          <ShieldCheck
                            size={16}
                            className="mt-0.5 shrink-0 text-[#A95643]"
                          />

                          <p className="text-xs leading-5 text-[#806B5F]">
                            Supported formats: PNG, JPG, JPEG and WEBP. Maximum
                            file size is 5 MB.
                          </p>
                        </div>
                      </div>
                    </section>

                    <div className="rounded-xl border border-[#E9DED0] bg-gradient-to-br from-[#F8EDE6] to-[#FAF6EF] p-4">
                      <div className="flex items-center gap-2 text-[#A95643]">
                        <CheckCircle2 size={17} />
                        <p className="text-sm font-semibold">
                          Update Guidelines
                        </p>
                      </div>

                      <ul className="mt-3 space-y-2 text-xs leading-5 text-[#6F5B50]">
                        <li>• At least one pricing rate is required.</li>
                        <li>• Rates and durations must be non-negative.</li>
                        <li>
                          • The existing image is retained if no new image is
                          selected.
                        </li>
                        <li>• Space code remains unchanged.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#E9DED0] bg-[#FBF3ED] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="hidden text-xs text-[#A99A8D] sm:block">
                  Review your changes before saving.
                </p>

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    disabled={saving}
                    className="rounded-xl border border-[#E9DED0] bg-white px-5 py-2.5 text-sm font-semibold text-[#6F5B50] transition hover:bg-[#F8EDE6] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#71392F] to-[#A95643] px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#71392F]/20 transition hover:from-[#5D2E26] hover:to-[#8F4435] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle size={17} className="animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={17} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#382B26]/85 p-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-[#FFFDFA] p-3 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#5D4A40] shadow-lg transition hover:bg-rose-50 hover:text-rose-600"
            >
              <X size={20} />
            </button>

            <div className="flex max-h-[75vh] items-center justify-center overflow-hidden rounded-xl bg-[#F1E8DE]">
              <img
                src={previewImage.image}
                alt={previewImage.spaceCode}
                className="max-h-[75vh] max-w-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-2 px-2 pb-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-[#382B26]">{previewImage.space}</p>
                <p className="mt-1 text-xs text-[#8F8175]">
                  Space Code: {previewImage.spaceCode}
                </p>
              </div>

              <span className="w-fit rounded-full bg-[#F8EDE6] px-3 py-1.5 text-xs font-semibold text-[#A95643]">
                Space Image
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceMaster;
