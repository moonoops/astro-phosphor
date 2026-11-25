import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import PixelIcon from "../os/PixelIcon";
import ButtonBase from "../ui/ButtonBase";
import "../../styles/work.css";

export interface GalleryItem {
  src: string;
  alt: string;
  caption?: string;
}

interface Props {
  items: GalleryItem[];
  group: string;
}

export default function GalleryLightbox({ items, group }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLAnchorElement>(null);
  const isOpen = index !== null;

  useEffect(() => {
    function openGallery(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }

      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-gallery]") : null;
      if (link?.dataset.gallery !== group) return;

      const selected = Number(link.dataset.galleryIndex);
      if (!Number.isInteger(selected) || selected < 0 || selected >= items.length) return;

      event.preventDefault();
      opener.current = link;
      setIndex(selected);
    }

    // Intercept the image link before Astro can handle it as a route.
    document.addEventListener("click", openGallery, true);
    return () => document.removeEventListener("click", openGallery, true);
  }, [group, items.length]);

  useEffect(() => {
    if (isOpen && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [isOpen]);

  function move(direction: number) {
    setIndex((current) => current === null ? current : (current + direction + items.length) % items.length);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (items.length < 2 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  }

  function restoreFocus() {
    setIndex(null);
    if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    opener.current = null;
  }

  if (index === null) return null;

  const item = items[index];
  const multiple = items.length > 1;

  return createPortal(
    <dialog
      ref={dialog}
      className="gallery-lightbox"
      data-gallery-dialog
      aria-label="Image gallery"
      onClose={restoreFocus}
      onKeyDown={onKeyDown}
    >
      <header className="gallery-toolbar">
        <span className="gallery-counter" role="status">{index + 1} / {items.length}</span>
        <ButtonBase
          variant="primary"
          className="gallery-close"
          aria-label="Close gallery"
          onClick={() => dialog.current?.close()}
        >
          <PixelIcon name="close" size={20} />
        </ButtonBase>
      </header>

      <div className="gallery-stage" data-multiple={multiple ? "true" : undefined}>
        {multiple && (
          <ButtonBase variant="icon" className="gallery-arrow" aria-label="Previous image" onClick={() => move(-1)}>
            <PixelIcon name="previous" size={24} />
          </ButtonBase>
        )}

        <figure className="gallery-figure">
          <img className="gallery-full-image" src={item.src} alt={item.alt} />
          {item.caption && <figcaption>{item.caption}</figcaption>}
        </figure>

        {multiple && (
          <ButtonBase variant="icon" className="gallery-arrow" aria-label="Next image" onClick={() => move(1)}>
            <PixelIcon name="next" size={24} />
          </ButtonBase>
        )}
      </div>

      {multiple && (
        <div className="gallery-thumbnails" role="group" aria-label="Images">
          {items.map((thumbnail, thumbnailIndex) => (
            <button
              key={`${thumbnail.src}-${thumbnailIndex}`}
              className="gallery-thumb"
              type="button"
              aria-label={`View image ${thumbnailIndex + 1}: ${thumbnail.alt}`}
              aria-pressed={thumbnailIndex === index}
              onClick={() => setIndex(thumbnailIndex)}
            >
              <img src={thumbnail.src} width="72" height="48" alt="" />
            </button>
          ))}
        </div>
      )}
    </dialog>,
    document.body,
  );
}
