import { getCollection } from "astro:content";

export async function getProjects() {
  const projects = await getCollection("projects");

  return projects.sort((a, b) => (
    b.data.year - a.data.year ||
    a.data.featuredOrder - b.data.featuredOrder ||
    a.data.title.localeCompare(b.data.title, "en")
  ));
}
