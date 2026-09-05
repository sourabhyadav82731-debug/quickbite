"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { apiClient, uploadImage, friendlyErrorMessage, API_URL } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Only JPEG, PNG, or WEBP images are allowed";
  if (file.size > MAX_BYTES) return "Image must be 5MB or smaller";
  return null;
}

function resolveUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

/** Cover + gallery photo management for a restaurant owner's own restaurant.
 *  Every mutation re-fetches both the gallery list and the restaurant record
 *  (coverImageUrl mirrors whichever gallery photo is primary) so this and the
 *  rest of the profile page can never show stale data relative to each other. */
export function RestaurantPhotoManager({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { data: photos } = useQuery({
    queryKey: ["restaurant-photos", restaurantId],
    queryFn: () => apiClient.get<any[]>(`/restaurants/${restaurantId}/photos`),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["restaurant-photos", restaurantId] });
    qc.invalidateQueries({ queryKey: ["my-restaurants"] });
  }

  async function onCoverSelected(file: File | undefined) {
    if (!file) return;
    const invalid = validateFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setUploadingCover(true);
    try {
      await uploadImage(`/restaurants/${restaurantId}/photos/cover`, file);
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Failed to upload cover photo"));
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function onGallerySelected(file: File | undefined) {
    if (!file) return;
    const invalid = validateFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setUploadingGallery(true);
    try {
      await uploadImage(`/restaurants/${restaurantId}/photos`, file);
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Failed to upload photo"));
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  async function deletePhoto(photoId: string) {
    setBusyPhotoId(photoId);
    setError(null);
    try {
      await apiClient.delete(`/restaurants/${restaurantId}/photos/${photoId}`);
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Failed to delete photo"));
    } finally {
      setBusyPhotoId(null);
    }
  }

  async function setPrimary(photoId: string) {
    setBusyPhotoId(photoId);
    setError(null);
    try {
      await apiClient.patch(`/restaurants/${restaurantId}/photos/${photoId}/primary`, {});
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Failed to set primary photo"));
    } finally {
      setBusyPhotoId(null);
    }
  }

  const gallery = (photos as any[]) ?? [];

  return (
    <div className="d3-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Restaurant Photos</div>
        <label className="qb-btn-secondary text-xs px-3 py-1.5 rounded-lg cursor-pointer">
          {uploadingCover ? "Uploading…" : "Set Cover Photo"}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploadingCover}
            onChange={(e) => onCoverSelected(e.target.files?.[0])}
          />
        </label>
      </div>
      <p className="text-xs opacity-60">
        The cover photo is what customers see first on your restaurant card. Add more photos
        below for your gallery — customers can browse all of them on your restaurant page.
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {gallery.map((photo) => (
          <div
            key={photo.id}
            className="relative rounded-xl overflow-hidden aspect-square"
            style={{ background: "var(--qb-elevated)" }}
          >
            <img
              src={resolveUrl(photo.url) ?? ""}
              alt="Restaurant"
              className="w-full h-full object-cover"
            />
            {photo.isCover && (
              <span
                className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: "var(--qb-primary)" }}
              >
                COVER
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 bg-black/50">
              {!photo.isCover && (
                <button
                  onClick={() => setPrimary(photo.id)}
                  disabled={busyPhotoId === photo.id}
                  className="flex-1 text-[9px] font-semibold text-white py-1 rounded disabled:opacity-50"
                  style={{ minHeight: 22 }}
                >
                  Make Cover
                </button>
              )}
              <button
                onClick={() => deletePhoto(photo.id)}
                disabled={busyPhotoId === photo.id}
                className="flex-1 text-[9px] font-semibold py-1 rounded disabled:opacity-50"
                style={{ color: "var(--qb-error)", minHeight: 22 }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        <label
          className="rounded-xl aspect-square flex items-center justify-center text-xs opacity-70 cursor-pointer border-2 border-dashed"
          style={{ borderColor: "var(--qb-border)", minHeight: 44 }}
        >
          {uploadingGallery ? "Uploading…" : "+ Add Photo"}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploadingGallery}
            onChange={(e) => onGallerySelected(e.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  );
}
