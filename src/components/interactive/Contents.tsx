import { useEffect, useState } from "react";
import { journal } from "../../data/page-copy.json";

interface Heading {
  slug: string;
  text: string;
}

interface Props {
  articleId: string;
  headings: Heading[];
  lang?: string;
}

export default function Contents({ articleId, headings, lang }: Props) {
  const [current, setCurrent] = useState<string | undefined>(headings[0]?.slug);

  useEffect(() => {
    const article = document.getElementById(articleId);
    const scrollPane = article?.closest<HTMLElement>(".window-scroll");
    if (!article || !scrollPane) return;

    const targets = headings
      .map(({ slug }) => document.getElementById(slug))
      .filter((node): node is HTMLElement => node !== null && article.contains(node));
    if (targets.length === 0) return;

    const update = () => {
      const top = scrollPane.getBoundingClientRect().top + 28;
      const reached = targets.filter((heading) => heading.getBoundingClientRect().top <= top);
      const atEnd = scrollPane.scrollTop > 0 && scrollPane.scrollTop + scrollPane.clientHeight >= scrollPane.scrollHeight - 2;
      const active = atEnd ? targets.at(-1) : reached.at(-1) ?? targets[0];
      setCurrent(active?.id);
    };

    const observer = new IntersectionObserver(update, { root: scrollPane });
    targets.forEach((target) => observer.observe(target));
    scrollPane.addEventListener("scroll", update, { passive: true });
    update();

    return () => {
      observer.disconnect();
      scrollPane.removeEventListener("scroll", update);
    };
  }, [articleId, headings]);

  return (
    <nav className="journal-contents" aria-label={journal.article.contents}>
      <p className="quiet">{journal.article.contents}</p>
      <ul>
        {headings.map(({ slug, text }) => (
          <li key={slug}>
            <a href={`#${encodeURIComponent(slug)}`} lang={lang} aria-current={current === slug ? "location" : undefined} onClick={() => setCurrent(slug)}>
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
