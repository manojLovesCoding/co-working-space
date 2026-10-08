import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
  Loader2,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import api from "../../api/axios.js";
const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return null;
  }
  return `₹${Number(price).toLocaleString("en-IN")}`;
};
const getStartingPrice = (space) => {
  const prices = [
    { value: space.perHour, label: "hour" },
    { value: space.perDay, label: "day" },
    { value: space.perMonth, label: "month" },
  ].filter(
    (item) =>
      item.value !== null && item.value !== undefined && item.value !== "",
  );
  if (!prices.length) {
    return null;
  }
  return prices.sort((a, b) => Number(a.value) - Number(b.value))[0];
};
const getSpaceIcon = (spaceName = "") => {
  const name = spaceName.toLowerCase();
  if (name.includes("conference")) {
    return Users;
  }
  if (
    name.includes("cabin") ||
    name.includes("cubicle") ||
    name.includes("workspace")
  ) {
    return Home;
  }
  return Home;
};
const getSpaceCapacity = (spaceName = "") => {
  const name = spaceName.toLowerCase();
  if (name.includes("individual")) {
    return "1 Person";
  }
  if (name.includes("team")) {
    return "Team Space";
  }
  if (name.includes("conference")) {
    return "Meeting Space";
  }
  if (name.includes("ceo")) {
    return "Private Cabin";
  }
  if (name.includes("executive")) {
    return "Executive Space";
  }
  if (name.includes("manager")) {
    return "Private Cabin";
  }
  return "Flexible Space";
};
const getAvailableCount = (space) => {
  if (!Array.isArray(space.spaces)) {
    return 0;
  }
  return space.spaces.filter((item) => item.status === "Active").length;
};
export default function PublicSpaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  useEffect(() => {
    fetchPublicSpaces();
  }, []);
  const fetchPublicSpaces = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/space/public");
      if (response.data?.success) {
        setSpaces(response.data.spaces || []);
      } else {
        setSpaces([]);
        setError(response.data?.message || "Unable to load spaces.");
      }
    } catch (err) {
      console.error("Fetch public spaces error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load spaces. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  /* * Categories are now based on grouped workspace types. * * Example: * Individual Working Space * Team Leads Cubicle * Manager Cubicle * Executive Cabin */ const categories =
    useMemo(() => {
      const uniqueCategories = [
        ...new Set(spaces.map((space) => space.space).filter(Boolean)),
      ];
      return ["All", ...uniqueCategories];
    }, [spaces]);
  /* * Search/filter grouped workspace cards. */ const filteredSpaces =
    useMemo(() => {
      const searchValue = search.trim().toLowerCase();
      return spaces.filter((space) => {
        const matchesSearch =
          !searchValue || space.space?.toLowerCase().includes(searchValue);
        const matchesCategory =
          selectedCategory === "All" || space.space === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    }, [spaces, search, selectedCategory]);
  return (
    <section id="spaces" className="w-full bg-gray-50 py-16 sm:py-20">
      {" "}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {" "}
        {/* Header */}{" "}
        <div className="mb-10 text-center">
          {" "}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600">
            {" "}
            <MapPin size={16} /> Find Your Perfect Space{" "}
          </div>{" "}
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {" "}
            Book Your Space{" "}
          </h2>{" "}
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            {" "}
            Choose from our available workspaces, cabins and meeting spaces and
            book the one that fits your needs.{" "}
          </p>{" "}
        </div>{" "}
        {/* Search + Filters */}{" "}
        {!loading && spaces.length > 0 && (
          <div className="mb-8 space-y-4">
            {" "}
            {/* Search */}{" "}
            <div className="relative mx-auto max-w-xl">
              {" "}
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />{" "}
              <input
                type="text"
                placeholder="Search workspace, cabin, conference room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />{" "}
            </div>{" "}
            {/* Categories */}{" "}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {" "}
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition ${selectedCategory === category ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"}`}
                >
                  {" "}
                  {category}{" "}
                </button>
              ))}{" "}
            </div>{" "}
          </div>
        )}{" "}
        {/* Loading */}{" "}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            {" "}
            <div className="flex flex-col items-center gap-3 text-gray-500">
              {" "}
              <Loader2 size={32} className="animate-spin text-blue-600" />{" "}
              <p className="text-sm"> Loading available spaces... </p>{" "}
            </div>{" "}
          </div>
        )}{" "}
        {/* Error */}{" "}
        {!loading && error && (
          <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            {" "}
            <p className="font-medium text-red-700"> {error} </p>{" "}
            <button
              type="button"
              onClick={fetchPublicSpaces}
              className="mt-4 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              {" "}
              Try Again{" "}
            </button>{" "}
          </div>
        )}{" "}
        {/* Empty */}{" "}
        {!loading && !error && spaces.length === 0 && (
          <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-10 text-center">
            {" "}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              {" "}
              <Home size={26} className="text-gray-500" />{" "}
            </div>{" "}
            <h3 className="text-lg font-semibold text-gray-900">
              {" "}
              No spaces available{" "}
            </h3>{" "}
            <p className="mt-2 text-sm text-gray-500">
              {" "}
              There are currently no spaces available for booking.{" "}
            </p>{" "}
          </div>
        )}{" "}
        {/* No Search Results */}{" "}
        {!loading &&
          !error &&
          spaces.length > 0 &&
          filteredSpaces.length === 0 && (
            <div className="py-12 text-center">
              {" "}
              <Search size={40} className="mx-auto text-gray-300" />{" "}
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {" "}
                No spaces found{" "}
              </h3>{" "}
              <p className="mt-2 text-sm text-gray-500">
                {" "}
                Try changing your search or category.{" "}
              </p>{" "}
            </div>
          )}{" "}
        {/* Space Cards */}{" "}
        {!loading && !error && filteredSpaces.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {" "}
            {filteredSpaces.map((space) => {
              const Icon = getSpaceIcon(space.space);
              const startingPrice = getStartingPrice(space);
              const availableCount = getAvailableCount(space);
              return (
                <article
                  key={space.space}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {" "}
                  {/* Image */}{" "}
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    {" "}
                    {space.image ? (
                      <img
                        src={space.image}
                        alt={space.space}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {" "}
                        <Home size={50} className="text-gray-300" />{" "}
                      </div>
                    )}{" "}
                    {/* Available badge */}{" "}
                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-green-600 shadow">
                      {" "}
                      <CheckCircle2 size={14} /> Available{" "}
                    </div>{" "}
                    {/* Number of spaces */}{" "}
                    <div className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
                      {" "}
                      {availableCount}{" "}
                      {availableCount === 1 ? "Space" : "Spaces"}{" "}
                    </div>{" "}
                  </div>{" "}
                  {/* Content */}{" "}
                  <div className="p-5">
                    {" "}
                    {/* Title */}{" "}
                    <div className="flex items-start justify-between gap-3">
                      {" "}
                      <div>
                        {" "}
                        <h3 className="text-lg font-bold text-gray-900">
                          {" "}
                          {space.space}{" "}
                        </h3>{" "}
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                          {" "}
                          <Icon size={15} />{" "}
                          {getSpaceCapacity(space.space)}{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* Availability */}{" "}
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5">
                      {" "}
                      <CheckCircle2 size={16} className="text-green-600" />{" "}
                      <span className="text-sm font-medium text-green-700">
                        {" "}
                        {availableCount}{" "}
                        {availableCount === 1 ? "space" : "spaces"}{" "}
                        available{" "}
                      </span>{" "}
                    </div>{" "}
                    {/* Features */}{" "}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {" "}
                      {space.perHour !== null &&
                        space.perHour !== undefined && (
                          <div className="rounded-lg bg-gray-50 p-3">
                            {" "}
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              {" "}
                              <Clock3 size={14} /> Hourly{" "}
                            </div>{" "}
                            <p className="mt-1 font-semibold text-gray-900">
                              {" "}
                              {formatPrice(space.perHour)}{" "}
                            </p>{" "}
                          </div>
                        )}{" "}
                      {space.perDay !== null && space.perDay !== undefined && (
                        <div className="rounded-lg bg-gray-50 p-3">
                          {" "}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            {" "}
                            <CalendarDays size={14} /> Daily{" "}
                          </div>{" "}
                          <p className="mt-1 font-semibold text-gray-900">
                            {" "}
                            {formatPrice(space.perDay)}{" "}
                          </p>{" "}
                        </div>
                      )}{" "}
                      {space.perMonth !== null &&
                        space.perMonth !== undefined && (
                          <div className="rounded-lg bg-gray-50 p-3">
                            {" "}
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              {" "}
                              <CalendarDays size={14} /> Monthly{" "}
                            </div>{" "}
                            <p className="mt-1 font-semibold text-gray-900">
                              {" "}
                              {formatPrice(space.perMonth)}{" "}
                            </p>{" "}
                          </div>
                        )}{" "}
                    </div>{" "}
                    {/* Starting price */}{" "}
                    {startingPrice && (
                      <div className="mt-5 border-t border-gray-100 pt-4">
                        {" "}
                        <p className="text-xs text-gray-500">
                          {" "}
                          Starting from{" "}
                        </p>{" "}
                        <p className="mt-0.5 text-xl font-bold text-gray-900">
                          {" "}
                          {formatPrice(startingPrice.value)}{" "}
                          <span className="ml-1 text-sm font-normal text-gray-500">
                            {" "}
                            /{startingPrice.label}{" "}
                          </span>{" "}
                        </p>{" "}
                      </div>
                    )}{" "}
                    {/* Book button */}{" "}
                    <Link
                      to={`/book-space/${encodeURIComponent(space.space)}`}
                      state={{ space }}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                      {" "}
                      Book This Space <ArrowRight size={18} />{" "}
                    </Link>{" "}
                  </div>{" "}
                </article>
              );
            })}{" "}
          </div>
        )}{" "}
        {/* Results count */}{" "}
        {!loading && !error && filteredSpaces.length > 0 && (
          <p className="mt-8 text-center text-sm text-gray-500">
            {" "}
            Showing {filteredSpaces.length} of {spaces.length} workspace
            types{" "}
          </p>
        )}{" "}
      </div>{" "}
    </section>
  );
}
