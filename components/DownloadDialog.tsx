"use client";

import { useState } from "react";
import { Download, Image as ImageIcon, Images, Loader2, Share2 } from "lucide-react";
import Modal from "./Modal";
import type { Product } from "@/lib/types";
import { downloadOriginalPhotos, saveBlob } from "@/lib/download";
import { buildDetailsPng } from "@/lib/detailsImage";

type Props = {
  product: Product;
  categoryName?: string | null;
  shopName?: string | null;
  /** Photo currently open in the gallery, so the card shows what you're looking at. */
  selectedImageId?: string | null;
  onClose: () => void;
};

type Task = "photos" | "details" | null;

/**
 * Two separate downloads, deliberately not merged: the stored photos are the
 * real files, while the details card is generated artwork.
 */
export default function DownloadDialog({ product, categoryName, shopName, selectedImageId, onClose }: Props) {
  const [task, setTask] = useState<Task>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const images = [...product.product_images].sort((a, b) => a.position - b.position);
  const photoCount = images.length;
  const hasLegacyPhotos = images.some((i) => !i.original_path);

  async function downloadPhotos() {
    if (!photoCount) return;
    setTask("photos");
    setError("");
    setStatus("Preparing...");
    try {
      const result = await downloadOriginalPhotos(product, images, (done, total) =>
        setStatus(`Saving ${done} of ${total}...`)
      );
      setStatus(
        result.saved === 1 ? `Saved ${result.names[0]}` : `Saved ${result.saved} photos`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download the photos.");
      setStatus("");
    } finally {
      setTask(null);
    }
  }

  async function downloadDetails() {
    setTask("details");
    setError("");
    setStatus("Drawing the card...");
    try {
      const { blob, filename } = await buildDetailsPng({
        product,
        categoryName,
        shopName,
        imageId: selectedImageId,
      });
      saveBlob(blob, filename);
      setStatus(`Saved ${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the image.");
      setStatus("");
    } finally {
      setTask(null);
    }
  }

  const rowBase = "rounded-md border border-ink-line bg-surface p-3.5 transition-colors";

  return (
    <Modal onClose={onClose} title="Download" subtitle={product.name}>
      <div className="space-y-3 p-4 lg:p-5">
        {/* A. Stored photos */}
        <div className={`${rowBase} ${task === "photos" ? "border-accent/40 bg-canvas" : ""}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface-alt text-ink">
              <Images size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-ink">Original product photos</h3>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">
                {photoCount === 0
                  ? "This product has no photos yet."
                  : `${photoCount} file${photoCount === 1 ? "" : "s"} · original resolution, format and quality.`}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {hasLegacyPhotos && photoCount > 0 ? (
              <p className="text-[11px] leading-snug text-ink-faint">
                Older photos are stored in their optimised form.
              </p>
            ) : (
              <span />
            )}
            <button
              className="btn-ghost shrink-0 px-3 py-1.5 text-[13px]"
              onClick={downloadPhotos}
              disabled={photoCount === 0 || task !== null}
            >
              {task === "photos" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {task === "photos" ? "Downloading..." : "Download"}
            </button>
          </div>
        </div>

        {/* B. Generated card */}
        <div className={`${rowBase} ${task === "details" ? "border-accent/40 bg-canvas" : ""}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface-alt text-ink">
              <ImageIcon size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-ink">Product details image</h3>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">
                Shareable PNG with the photo you are viewing, plus the price, code, category, shop and
                variations.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-faint">
              <Share2 size={11} />
              2160 × 2700 px
            </p>
            <button
              className="btn-primary shrink-0 px-3 py-1.5 text-[13px]"
              onClick={downloadDetails}
              disabled={task !== null}
            >
              {task === "details" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {task === "details" ? "Working..." : "Generate"}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded border border-danger/25 bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {error}
          </p>
        )}

        {!error && status && (
          <p aria-live="polite" className="rounded border border-ink-line bg-canvas px-3 py-2 text-[13px] text-ink-soft">
            {status}
          </p>
        )}
      </div>
    </Modal>
  );
}
