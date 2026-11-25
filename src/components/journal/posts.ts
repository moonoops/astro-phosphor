import { getCollection } from "astro:content";

const shortDate = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const longDate = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeZone: "UTC",
});

export async function getJournalPosts() {
  const entries = await getCollection("journal", ({ data }) => !data.draft);
  return entries.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id));
}

export function journalPostUrl(id: string) {
  return `/journal/${encodeURIComponent(id)}`;
}

export function journalDate(date: Date, style: "short" | "long" = "short") {
  return (style === "long" ? longDate : shortDate).format(date);
}
