const records = (window.LIBRARY_DATA || []).map((record) => ({
  ...record,
  type: record.category === "Books" ? "Books" : "Thesis / Projects",
}));

const state = {
  query: "",
  type: "All",
  category: "All",
  shelf: "All",
  rack: "All",
  sort: "location",
};

const els = {
  searchInput: document.getElementById("searchInput"),
  typeFilter: document.getElementById("typeFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  shelfFilter: document.getElementById("shelfFilter"),
  rackFilter: document.getElementById("rackFilter"),
  sortMode: document.getElementById("sortMode"),
  summaryGrid: document.getElementById("summaryGrid"),
  shelfList: document.getElementById("shelfList"),
  shelfCount: document.getElementById("shelfCount"),
  resultCount: document.getElementById("resultCount"),
  activeFilters: document.getElementById("activeFilters"),
  resultBody: document.getElementById("resultBody"),
  clearFilters: document.getElementById("clearFilters"),
  printResults: document.getElementById("printResults"),
  detailDrawer: document.getElementById("detailDrawer"),
  detailCategory: document.getElementById("detailCategory"),
  detailTitle: document.getElementById("detailTitle"),
  detailLocation: document.getElementById("detailLocation"),
  detailFields: document.getElementById("detailFields"),
  closeDrawer: document.getElementById("closeDrawer"),
};

const categories = ["Books", "B.Pharm Projects", "Practice School", "M.Pharm Pharmacy Practice", "M.Pharm Pharmaceutics"];

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function norm(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function shelfSort(a, b) {
  if (a === "SH") return 1;
  if (b === "SH") return -1;
  const an = Number.parseInt(a, 10);
  const bn = Number.parseInt(b, 10);
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
  if (Number.isFinite(an)) return -1;
  if (Number.isFinite(bn)) return 1;
  return String(a).localeCompare(String(b));
}

function categoryClass(category) {
  if (category === "Books") return "books";
  if (category === "B.Pharm Projects") return "bpharm";
  if (category === "Practice School") return "practice";
  if (category === "M.Pharm Pharmacy Practice") return "pp";
  if (category === "M.Pharm Pharmaceutics") return "pc";
  return "";
}

function primaryPerson(record) {
  return record.category === "Books" ? record.author : record.student;
}

function secondaryPerson(record) {
  return record.category === "Books" ? record.publisher : record.guide;
}

function recordLocation(record) {
  if (record.source === "SH") return "SH";
  if (record.shelf && record.rack) return `${record.shelf}-${record.rack}`;
  if (record.location) return record.location;
  if (record.shelf) return `Shelf ${record.shelf}`;
  return "Unspecified";
}

function searchableText(record) {
  return norm([
    record.type,
    record.category,
    record.serial,
    record.accession,
    record.title,
    record.author,
    record.publisher,
    record.edition,
    record.year,
    record.source,
    record.student,
    record.guide,
    record.shelf,
    record.rack,
    record.location,
  ].join(" "));
}

function filteredRecords() {
  const queryTerms = norm(state.query).split(" ").filter(Boolean);
  return records.filter((record) => {
    if (state.type !== "All" && record.type !== state.type) return false;
    if (state.category !== "All" && record.category !== state.category) return false;
    if (state.shelf !== "All" && (record.shelf || "Unspecified") !== state.shelf) return false;
    if (state.rack !== "All" && (record.rack || "Unspecified") !== state.rack) return false;
    if (queryTerms.length) {
      const text = searchableText(record);
      if (!queryTerms.every((term) => text.includes(term))) return false;
    }
    return true;
  });
}

function locationCompare(a, b) {
  const shelfCompare = shelfSort(a.shelf || "9999", b.shelf || "9999");
  if (shelfCompare !== 0) return shelfCompare;
  const rackCompare = (a.rack || "ZZ").localeCompare(b.rack || "ZZ");
  if (rackCompare !== 0) return rackCompare;
  return Number(a.serial || 0) - Number(b.serial || 0);
}

function accessionCompare(a, b) {
  return norm(a.accession).localeCompare(norm(b.accession)) || locationCompare(a, b);
}

function sortRecords(list) {
  const sorted = [...list];
  sorted.sort((a, b) => {
    if (state.sort === "title") return String(a.title).localeCompare(String(b.title)) || locationCompare(a, b);
    if (state.sort === "year") return String(a.year).localeCompare(String(b.year)) || locationCompare(a, b);
    if (state.sort === "category") return a.category.localeCompare(b.category) || locationCompare(a, b);
    if (state.sort === "accession") return accessionCompare(a, b);
    return locationCompare(a, b);
  });
  return sorted;
}

function fillSelect(select, values, current) {
  select.innerHTML = "";
  for (const value of ["All", ...values]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    if (value === current) option.selected = true;
    select.appendChild(option);
  }
}

function renderFilters() {
  const types = unique(records.map((record) => record.type));
  const typeScoped = records.filter((record) => state.type === "All" || record.type === state.type);
  const shownCategories = categories.filter((category) => typeScoped.some((record) => record.category === category));
  const categoryScoped = typeScoped.filter((record) => state.category === "All" || record.category === state.category);
  const shelves = unique(categoryScoped.map((record) => record.shelf || "Unspecified")).sort(shelfSort);
  const shelfScoped = categoryScoped.filter((record) => state.shelf === "All" || (record.shelf || "Unspecified") === state.shelf);
  const racks = unique(shelfScoped.map((record) => record.rack || "Unspecified")).sort();

  if (!types.includes(state.type) && state.type !== "All") state.type = "All";
  if (!shownCategories.includes(state.category) && state.category !== "All") state.category = "All";
  if (!shelves.includes(state.shelf) && state.shelf !== "All") state.shelf = "All";
  if (!racks.includes(state.rack) && state.rack !== "All") state.rack = "All";

  fillSelect(els.typeFilter, types, state.type);
  fillSelect(els.categoryFilter, shownCategories, state.category);
  fillSelect(els.shelfFilter, shelves, state.shelf);
  fillSelect(els.rackFilter, racks, state.rack);
}

function renderSummary(list) {
  const totalBooks = records.filter((record) => record.category === "Books").length;
  const totalThesis = records.length - totalBooks;
  const cards = [
    ["All", records.length, list.length],
    ["Books", totalBooks, list.filter((record) => record.category === "Books").length],
    ["Thesis / Projects", totalThesis, list.filter((record) => record.category !== "Books").length],
    ["Shelves", unique(records.map((record) => record.shelf)).length, unique(list.map((record) => record.shelf)).length],
  ];
  els.summaryGrid.innerHTML = cards.map(([label, count, shown]) => (
    `<button class="summary-card" data-summary="${escapeHtml(label)}">
      <strong>${count}</strong>
      <span>${escapeHtml(label)} (${shown} shown)</span>
    </button>`
  )).join("");

  els.summaryGrid.querySelectorAll(".summary-card").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.summary;
      if (value === "All" || value === "Shelves") {
        state.type = "All";
        state.category = "All";
      } else if (value === "Books") {
        state.type = "Books";
        state.category = "Books";
      } else {
        state.type = "Thesis / Projects";
        state.category = "All";
      }
      state.shelf = "All";
      state.rack = "All";
      render();
    });
  });
}

function renderActiveFilters(list) {
  const filters = [];
  if (state.query.trim()) filters.push(`Search: ${state.query.trim()}`);
  if (state.type !== "All") filters.push(state.type);
  if (state.category !== "All") filters.push(state.category);
  if (state.shelf !== "All") filters.push(`Shelf ${state.shelf}`);
  if (state.rack !== "All") filters.push(`Rack ${state.rack}`);
  els.activeFilters.textContent = filters.length ? filters.join(" | ") : `${records.length} total records`;
  els.resultCount.textContent = `${list.length} ${list.length === 1 ? "record" : "records"}`;
}

function renderShelfList(list) {
  const counts = new Map();
  for (const record of list) {
    const shelf = record.shelf || "Unspecified";
    counts.set(shelf, (counts.get(shelf) || 0) + 1);
  }
  const shelves = [...counts.keys()].sort(shelfSort);
  els.shelfCount.textContent = `${shelves.length} shelves`;
  els.shelfList.innerHTML = shelves.map((shelf) => {
    const active = state.shelf === shelf ? " active" : "";
    const label = shelf === "SH" ? "SH" : `Shelf ${shelf}`;
    return `<button class="shelf-item${active}" data-shelf="${escapeHtml(shelf)}">
      <span>${escapeHtml(label)}</span>
      <span>${counts.get(shelf)}</span>
    </button>`;
  }).join("");

  els.shelfList.querySelectorAll(".shelf-item").forEach((button) => {
    button.addEventListener("click", () => {
      state.shelf = button.dataset.shelf;
      state.rack = "All";
      render();
    });
  });
}

function renderResults(list) {
  const sorted = sortRecords(list);
  if (!sorted.length) {
    els.resultBody.innerHTML = `<tr><td class="empty-state" colspan="8">No matching record found</td></tr>`;
    return;
  }

  els.resultBody.innerHTML = sorted.map((record) => (
    `<tr data-id="${escapeHtml(record.id)}">
      <td>${escapeHtml(record.serial)}</td>
      <td><span class="pill ${categoryClass(record.category)}">${escapeHtml(record.category)}</span></td>
      <td class="accession-cell">${escapeHtml(record.accession)}</td>
      <td class="title-cell">${highlight(record.title)}</td>
      <td>${escapeHtml(primaryPerson(record))}</td>
      <td>${escapeHtml(secondaryPerson(record))}</td>
      <td>${escapeHtml(record.year)}</td>
      <td><strong>${escapeHtml(recordLocation(record))}</strong></td>
    </tr>`
  )).join("");

  els.resultBody.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => showDetail(row.dataset.id));
  });
}

function showDetail(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;
  els.detailCategory.textContent = record.category;
  els.detailTitle.textContent = record.title || "Untitled";
  els.detailLocation.innerHTML = `<span>Location</span><strong>${escapeHtml(recordLocation(record))}</strong>`;

  const fields = [
    ["Accession", record.accession],
    ["Serial", record.serial],
    ["Shelf", record.shelf || "Unspecified"],
    ["Rack", record.rack || "Unspecified"],
    ["Year", record.year],
  ];

  if (record.category === "Books") {
    fields.push(["Author", record.author], ["Publisher", record.publisher], ["Edition", record.edition], ["Source", record.source]);
  } else {
    fields.push(["Student", record.student], ["Guide", record.guide]);
  }

  els.detailFields.innerHTML = fields
    .filter(([, value]) => value)
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("");
  els.detailDrawer.classList.add("open");
}

function highlight(value) {
  const text = escapeHtml(value);
  const q = state.query.trim();
  if (!q) return text;
  const first = q.split(/\s+/).find((term) => term.length >= 3);
  if (!first) return text;
  const escaped = first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${escaped})`, "ig"), "<mark>$1</mark>");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  renderFilters();
  const list = filteredRecords();
  renderSummary(list);
  renderActiveFilters(list);
  renderShelfList(list);
  renderResults(list);
}

els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

els.typeFilter.addEventListener("change", (event) => {
  state.type = event.target.value;
  state.category = "All";
  state.shelf = "All";
  state.rack = "All";
  render();
});

els.categoryFilter.addEventListener("change", (event) => {
  state.category = event.target.value;
  state.shelf = "All";
  state.rack = "All";
  render();
});

els.shelfFilter.addEventListener("change", (event) => {
  state.shelf = event.target.value;
  state.rack = "All";
  render();
});

els.rackFilter.addEventListener("change", (event) => {
  state.rack = event.target.value;
  render();
});

els.sortMode.addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});

els.clearFilters.addEventListener("click", () => {
  state.query = "";
  state.type = "All";
  state.category = "All";
  state.shelf = "All";
  state.rack = "All";
  state.sort = "location";
  els.searchInput.value = "";
  els.sortMode.value = "location";
  render();
});

els.printResults.addEventListener("click", () => {
  window.print();
});

els.closeDrawer.addEventListener("click", () => {
  els.detailDrawer.classList.remove("open");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") els.detailDrawer.classList.remove("open");
  if (event.key === "/" && document.activeElement !== els.searchInput) {
    event.preventDefault();
    els.searchInput.focus();
  }
});

render();
