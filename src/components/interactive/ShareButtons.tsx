import { useEffect, useRef, useState } from "react";
import ButtonBase from "../ui/ButtonBase";

interface Props {
  title: string;
  url?: string;
}

export default function ShareButtons({ title, url }: Props) {
  const [link, setLink] = useState(url);
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const fallback = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLink(url ?? new URL(window.location.pathname, window.location.origin).href);
  }, [url]);

  useEffect(() => {
    if (status === "manual") {
      fallback.current?.focus();
      fallback.current?.select();
    }
    if (status === "copied") {
      const timeout = window.setTimeout(() => setStatus("idle"), 2500);
      return () => window.clearTimeout(timeout);
    }
  }, [status]);

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setStatus("copied");
    } catch {
      setStatus("manual");
    }
  }

  async function shareLink() {
    if (!link) return;
    if (!navigator.share) {
      setStatus("manual");
      return;
    }
    try {
      await navigator.share({ title, url: link });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("manual");
    }
  }

  const encodedTitle = encodeURIComponent(title);
  const encodedLink = encodeURIComponent(link ?? "");
  const destinations = [
    { label: "X", href: `https://x.com/intent/post?text=${encodedTitle}&url=${encodedLink}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}` },
    { label: "Bluesky", href: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedLink}` },
    { label: "Email", href: `mailto:?subject=${encodedTitle}&body=${encodedLink}` },
  ];

  return (
    <section className="journal-share" aria-label="Share this article">
      <p className="quiet">Share</p>
      <div className="journal-share-actions">
        {destinations.map(({ label, href }) => link ? (
          <ButtonBase className="sb-key" href={href} target={label === "Email" ? undefined : "_blank"} rel="noopener noreferrer" key={label}>
            {label}
          </ButtonBase>
        ) : (
          <ButtonBase className="sb-key" disabled key={label}>{label}</ButtonBase>
        ))}
        <ButtonBase className="sb-key" disabled={!link} onClick={shareLink}>Share</ButtonBase>
        <ButtonBase className="sb-key" disabled={!link} onClick={copyLink}>Copy link</ButtonBase>
      </div>
      <span className="journal-share-status quiet" role="status">
        {status === "copied" ? "Link copied." : status === "manual" ? "Copy this link." : ""}
      </span>
      {status === "manual" && <input aria-label="Article link" ref={fallback} value={link} readOnly />}
    </section>
  );
}
