import { useEffect, useRef, useState } from "react";
import copy from "../../data/page-copy.json";
import { formatCopy } from "../../site";
import PixelIcon from "../os/PixelIcon";

interface Props {
  categories: string[];
  tags: string[];
}

const emptyFilters = { query: "", category: "", tag: "" };
const { filter: filterCopy, list, sortStatus } = copy.journal;

function postCount(count: number) {
  const template = count === 1 ? filterCopy.postSingle : filterCopy.postMultiple;
  return { count, posts: formatCopy(template, { count }) };
}

export default function JournalFilter({ categories, tags }: Props) {
  const [filters, setFilters] = useState(emptyFilters);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState<number>();
  const filtered = Boolean(filters.query.trim() || filters.category || filters.tag);
  const controls = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  function selectCategory(category: string) {
    setFilters((current) => ({
      ...current,
      category: current.category === category ? "" : category,
    }));
  }

  useEffect(() => {
    const index = controls.current?.closest("[data-window-id]")?.querySelector<HTMLElement>("[data-journal-index]");
    if (!index) return;

    const params = new URLSearchParams(window.location.search);
    const category = params.get("category") ?? "";
    const tag = params.get("tag") ?? "";
    setFilters({
      query: params.get("q") ?? "",
      category: categories.includes(category) ? category : "",
      tag: tags.includes(tag) ? tag : "",
    });
    for (const button of index.querySelectorAll<HTMLButtonElement>("[data-journal-category-filter]")) {
      button.disabled = false;
    }
    setReady(true);

    function onIndexClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const rowCategory = event.target.closest<HTMLButtonElement>("[data-journal-category-filter]");
      if (rowCategory?.dataset.journalCategoryFilter) {
        selectCategory(rowCategory.dataset.journalCategoryFilter);
      } else if (event.target.closest("[data-clear-journal]")) {
        setFilters(emptyFilters);
        toggle.current?.focus();
      }
    }

    index.addEventListener("click", onIndexClick);
    return () => index.removeEventListener("click", onIndexClick);
  }, [categories, tags]);

  useEffect(() => {
    const frame = controls.current?.closest("[data-window-id]");
    const index = frame?.querySelector("[data-journal-index]");
    if (!ready || !index) return;

    const terms = filters.query.normalize("NFKC").toLowerCase().trim().split(/\s+/);
    let visibleCount = 0;

    for (const row of index.querySelectorAll<HTMLElement>("[data-journal-row]")) {
      const searchText = row.dataset.search ?? "";
      const rowTags: string[] = JSON.parse(row.dataset.tags ?? "[]");
      const category = row.dataset.category ?? "";
      const matchesCategory = !filters.category || category === filters.category;
      const matchesTag = !filters.tag || rowTags.includes(filters.tag);
      const matchesSearch = terms.every((term) => searchText.includes(term));

      row.hidden = !(matchesCategory && matchesTag && matchesSearch);
      const categoryButton = row.querySelector("[data-journal-category-filter]");
      categoryButton?.setAttribute("aria-pressed", String(category === filters.category));
      if (!row.hidden) visibleCount++;
    }

    setVisible(visibleCount);
    const empty = index.querySelector<HTMLElement>("[data-journal-empty]");
    if (empty) empty.hidden = visibleCount > 0;

    const footer = frame?.querySelector("[data-window-status]");
    const status = filtered ? formatCopy(filterCopy.filteredStatus, { sort: sortStatus, ...postCount(visibleCount) }) : sortStatus;
    if (footer && footer.textContent !== status) footer.textContent = status;

    const url = new URL(window.location.href);
    for (const [name, value] of Object.entries({ q: filters.query, category: filters.category, tag: filters.tag })) {
      if (value) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }
    if (url.href !== window.location.href) history.replaceState(history.state, "", url);
  }, [filters, filtered, ready]);

  useEffect(() => {
    if (!open) return;
    searchInput.current?.focus();

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.isComposing) return;
      event.preventDefault();
      setOpen(false);
      toggle.current?.focus();
    }

    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !controls.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener("keydown", dismissOnEscape, true);
    document.addEventListener("pointerdown", dismissOutside);
    return () => {
      document.removeEventListener("keydown", dismissOnEscape, true);
      document.removeEventListener("pointerdown", dismissOutside);
    };
  }, [open]);

  if (!categories.length) return null;

  return (
    <div className="journal-filter" ref={controls}>
      <button
        ref={toggle}
        type="button"
        className="journal-filter-toggle"
        aria-label={filterCopy.toggle}
        aria-controls="journal-filter-panel"
        aria-expanded={open}
        title={filterCopy.toggle}
        data-filtered={filtered || undefined}
        disabled={!ready}
        onClick={() => setOpen(!open)}
      ><PixelIcon name="search" size={16} /></button>
      <span className="journal-filter-result sr-only" role="status">
        {filtered && visible !== undefined ? formatCopy(filterCopy.results, postCount(visible)) : ""}
      </span>

      <div className="journal-tools" id="journal-filter-panel" role="region" aria-label={filterCopy.panel} hidden={!open}>
        <div className="journal-search">
          <label className="sr-only" htmlFor="journal-query">{filterCopy.searchLabel}</label>
          <PixelIcon name="search" size={16} />
          <input
            id="journal-query"
            ref={searchInput}
            type="search"
            placeholder={filterCopy.placeholder}
            value={filters.query}
            disabled={!ready}
            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
          />
          {filters.query && (
            <button type="button" className="journal-clear-search" aria-label={filterCopy.clearSearch} onClick={() => {
              setFilters({ ...filters, query: "" });
              searchInput.current?.focus();
            }}><PixelIcon name="close" size={12} /></button>
          )}
        </div>

        {tags.length > 0 && (
          <label className="journal-tag">
            <span className="sr-only">{filterCopy.tagLabel}</span>
            <select
              value={filters.tag}
              disabled={!ready}
              onChange={(event) => setFilters({ ...filters, tag: event.target.value })}
            >
              <option value="">{filterCopy.allTags}</option>
              {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
            <PixelIcon name="chevron" size={12} />
          </label>
        )}

        <div className="journal-categories" role="group" aria-label={filterCopy.categoryLabel}>
          {["", ...categories].map((category) => (
            <button
              className="journal-chip"
              type="button"
              disabled={!ready}
              aria-pressed={category === filters.category}
              key={category}
              onClick={() => selectCategory(category)}
            >{category || filterCopy.allCategories}</button>
          ))}
        </div>
        {filtered && <button className="journal-clear" type="button" onClick={() => {
          setFilters(emptyFilters);
          searchInput.current?.focus();
        }}>{list.clearFilters}</button>}
      </div>
    </div>
  );
}
