import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

type ContentItem = {
  id: string;
  title: string;
  outlet: string;
  type: string;
  section: string;
  date: string;
  url: string;
  description?: string;
  imageUrl?: string;
  showOnSite: boolean;
  highlightFeatured: boolean;
};

const initialForm: Omit<ContentItem, "id"> = {
  title: "",
  outlet: "",
  type: "Article",
  section: "Featured",
  date: "",
  url: "",
  description: "",
  imageUrl: "",
  showOnSite: true,
  highlightFeatured: false,
};

export default function AdminDashboard() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [form, setForm] = useState<Omit<ContentItem, "id">>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Subscribe to Firestore changes
  useEffect(() => {
    const q = query(collection(db, "contentItems"), orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: ContentItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data() as Omit<ContentItem, "id">;
        return {
          id: docSnap.id,
          ...d,
        };
      });
      setItems(data);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    const checked =
      e.target instanceof HTMLInputElement ? e.target.checked : undefined;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      outlet: item.outlet,
      type: item.type,
      section: item.section,
      date: item.date,
      url: item.url,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      showOnSite: item.showOnSite,
      highlightFeatured: item.highlightFeatured,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    await deleteDoc(doc(db, "contentItems", id));
    if (editingId === id) {
      setEditingId(null);
      setForm(initialForm);
    }
  };

  const handleClear = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "contentItems", editingId), form);
      } else {
        await addDoc(collection(db, "contentItems"), form);
      }
      setForm(initialForm);
      setEditingId(null);
    } catch (err) {
      console.error("Error saving content item:", err);
    } finally {
      setSaving(false);
    }
  };

  const totalEntries = items.length;
  const featuredCount = items.filter(
    (item) => item.section === "Featured" && item.showOnSite
  ).length;
  //const sectionCount = new Set(items.map((item) => item.section)).size || 0;

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Content Manager
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              Add, edit, and organize the pieces that appear on the portfolio
              site.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-xs text-gray-500">
              <span className="font-semibold text-gray-700">
                Current profile
              </span>
              <span>Lauren Gibson · Portfolio</span>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full border border-gray-300 bg-white text-xs sm:text-sm hover:bg-gray-50"
            >
              Switch profile
            </button>
          </div>
        </header>

        {/* Quick stats */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total entries
            </p>
            <p className="mt-2 text-2xl font-bold">{totalEntries}</p>
            <p className="mt-1 text-xs text-gray-500">
              Includes articles, radio shows, and projects.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Featured on homepage
            </p>
            <p className="mt-2 text-2xl font-bold">{featuredCount}</p>
            <p className="mt-1 text-xs text-gray-500">
              Shown in the &quot;Featured Work&quot; section.
            </p>
          </div>
        </section>

        {/* Main layout: list + form */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)] items-start">
          {/* Left: content list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Filters (UI only for now) */}
            <div className="border-b border-gray-200 px-4 sm:px-5 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-800">
                  Content entries
                </span>
                <span className="text-xs text-gray-500">
                  ({items.length} items)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Search by title or outlet..."
                  className="w-full sm:w-56 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled
                />
                <select
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled
                >
                  <option>All types</option>
                  <option>Article</option>
                  <option>Radio Show</option>
                  <option>Project</option>
                </select>
                <select
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled
                >
                  <option>All sections</option>
                  <option>Featured</option>
                  <option>Selected Work</option>
                  <option>Archive</option>
                </select>
              </div>
            </div>

            {/* Table-ish list */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 sm:px-4 py-2 font-medium text-gray-500">
                      Title
                    </th>
                    <th className="px-3 sm:px-4 py-2 font-medium text-gray-500 hidden md:table-cell">
                      Outlet
                    </th>
                    <th className="px-3 sm:px-4 py-2 font-medium text-gray-500 hidden sm:table-cell">
                      Type
                    </th>
                    <th className="px-3 sm:px-4 py-2 font-medium text-gray-500 hidden sm:table-cell">
                      Section
                    </th>
                    <th className="px-3 sm:px-4 py-2 font-medium text-gray-500 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-3 sm:px-4 py-3 align-top">
                        <div className="font-medium text-gray-900 line-clamp-2">
                          {item.title}
                        </div>
                        <div className="md:hidden text-xs text-gray-500 mt-1">
                          {item.outlet} · {item.type}
                        </div>
                        <div className="md:hidden text-[11px] text-gray-400">
                          Section: {item.section}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 hidden md:table-cell align-top">
                        {item.outlet}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 hidden sm:table-cell align-top">
                        {item.type}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-gray-700 hidden sm:table-cell align-top">
                        {item.section}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right align-top">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="text-xs px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400 text-right hidden sm:block">
                          {item.date}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-sm text-gray-500"
                      >
                        No content yet. Use &quot;New content item&quot; to add
                        one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: CRUD form */}
          <div className="space-y-4">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Content details
                </h2>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  Mode: {editingId ? "Edit existing" : "Create new"}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Title
                  </label>
                  <input
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="Title as it should appear on the site"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Outlet / Platform
                    </label>
                    <input
                      name="outlet"
                      type="text"
                      value={form.outlet}
                      onChange={handleInputChange}
                      placeholder="Capital Current, CKCU FM 93.1, Freelance..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Content type
                    </label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option>Article</option>
                      <option>Radio Show</option>
                      <option>Podcast</option>
                      <option>Project</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Portfolio section
                    </label>
                    <select
                      name="section"
                      value={form.section}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option>Featured</option>
                      <option>Selected Work</option>
                      <option>Archive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Published date
                    </label>
                    <input
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Link to piece
                  </label>
                  <input
                    name="url"
                    type="url"
                    value={form.url}
                    onChange={handleInputChange}
                    placeholder="https://capitalcurrent.ca/..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Image URL (optional)
                  </label>
                  <input
                    name="imageUrl"
                    type="url"
                    value={form.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Short description (optional)
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="One or two sentences about this piece for the portfolio."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 mt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-500">
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        name="showOnSite"
                        type="checkbox"
                        checked={form.showOnSite}
                        onChange={handleInputChange}
                        className="rounded border-gray-300"
                      />
                      <span>Show on site</span>
                    </label>
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        name="highlightFeatured"
                        type="checkbox"
                        checked={form.highlightFeatured}
                        onChange={handleInputChange}
                        className="rounded border-gray-300"
                      />
                      <span>Highlight as featured</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
                    >
                      Clear form
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {saving
                        ? "Saving..."
                        : editingId
                        ? "Save changes"
                        : "Create content item"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
