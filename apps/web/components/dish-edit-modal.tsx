"use client";

import { useRef, useState } from "react";
import { api, uploadImage, friendlyErrorMessage, API_URL } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function resolveUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

interface DishEditModalProps {
  dish: {
    id: string;
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    isInStock: boolean;
    imageUrl?: string;
  };
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}

/** Edit an existing dish's Name/Description/Price/Category/Availability/Photo
 *  — always PATCHes the same dish id (never creates a new one). Backend
 *  ownership validation already lives in MenuService.updateDish; this modal
 *  never needs to re-check it client-side, only surface the 403 if it somehow
 *  fires. */
export function DishEditModal({ dish, categories, onClose, onSaved }: DishEditModalProps) {
  const [name, setName] = useState(dish.name);
  const [description, setDescription] = useState(dish.description ?? "");
  const [price, setPrice] = useState(String(dish.price));
  const [categoryId, setCategoryId] = useState(dish.categoryId);
  const [isInStock, setIsInStock] = useState(dish.isInStock);
  const [imageUrl, setImageUrl] = useState(dish.imageUrl ?? "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onPhotoSelected(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5MB or smaller");
      return;
    }
    setError(null);
    setUploadingPhoto(true);
    try {
      const res = await uploadImage(`/dishes/${dish.id}/photo`, file);
      setImageUrl(res.url);
    } catch (err) {
      setError(friendlyErrorMessage(err, "Failed to upload photo"));
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    if (!name.trim() || !price || Number(price) <= 0) {
      setError("Name and a valid price are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.menu.updateDish(dish.id, {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        categoryId,
        isInStock,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Failed to save dish"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-3 rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Edit Dish</h2>
          <button onClick={onClose} className="text-sm opacity-60" style={{ minWidth: 44, minHeight: 44 }}>
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-20 h-20 rounded-xl overflow-hidden shrink-0"
            style={{ background: "var(--qb-elevated)" }}
          >
            {imageUrl ? (
              <img src={resolveUrl(imageUrl) ?? ""} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl opacity-40">🍽️</div>
            )}
          </div>
          <label className="qb-btn-secondary text-xs px-3 py-2 rounded-lg cursor-pointer">
            {uploadingPhoto ? "Uploading…" : imageUrl ? "Replace Photo" : "Add Photo"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploadingPhoto}
              onChange={(e) => onPhotoSelected(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="space-y-2">
          <input
            placeholder="Dish name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full glass-card px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full glass-card px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              placeholder="Price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-28 glass-card px-3 py-2 text-sm"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex-1 glass-card px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isInStock}
              onChange={(e) => setIsInStock(e.target.checked)}
            />
            Available for ordering
          </label>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 qb-btn-secondary py-2.5 text-sm rounded-xl"
            style={{ minHeight: 44 }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 portal-btn-primary py-2.5 text-sm rounded-xl disabled:opacity-50"
            style={{ minHeight: 44 }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
