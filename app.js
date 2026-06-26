const shelfNames = window.LIBRARY_SHELF_NAMES || {};
const updateStorageKey = "libraryTeacherUpdatesV1";
const teacherPasscode = "LIBRARY2026";
let teacherUnlocked = false;
let selectedRecordId = "";
let lastTeacherAction = null;
const baseRecords = (window.LIBRARY_DATA || []).map((record) => ({
  ...record,
  type: record.category === "Books" ? "Books" : record.category === "Journals" ? "Journals" : "Thesis / Projects",
}));
let teacherUpdates = loadUpdates();
let records = applyUpdates();

const state = {
  query: "",
  type: "All",
  category: "All",
  shelf: "All",
  rack: "All",
  status: "All",
  sort: "location",
};

const els = {
  searchInput: document.getElementById("searchInput"),
  typeFilter: document.getElementById("typeFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  shelfFilter: document.getElementById("shelfFilter"),
  rackFilter: document.getElementById("rackFilter"),
  statusFilter: document.getElementById("statusFilter"),
  sortMode: document.getElementById("sortMode"),
  summaryGrid: document.getElementById("summaryGrid"),
  shelfList: document.getElementById("shelfList"),
  shelfCount: document.getElementById("shelfCount"),
  resultCount: document.getElementById("resultCount"),
  activeFilters: document.getElementById("activeFilters"),
  resultBody: document.getElementById("resultBody"),
  clearFilters: document.getElementById("clearFilters"),
  printResults: document.getElementById("printResults"),
  teacherMode: document.getElementById("teacherMode"),
  exportUpdates: document.getElementById("exportUpdates"),
  detailDrawer: document.getElementById("detailDrawer"),
  detailCategory: document.getElementById("detailCategory"),
  detailTitle: document.getElementById("detailTitle"),
  detailLocation: document.getElementById("detailLocation"),
  detailFields: document.getElementById("detailFields"),
  adminPanel: document.getElementById("adminPanel"),
  adminStatus: document.getElementById("adminStatus"),
  adminShelf: document.getElementById("adminShelf"),
  adminRack: document.getElementById("adminRack"),
  adminNote: document.getElementById("adminNote"),
  saveUpdate: document.getElementById("saveUpdate"),
  undoUpdate: document.getElementById("undoUpdate"),
  closeDrawer: document.getElementById("closeDrawer"),
};

const categories = ["Books", "Journals", "B.Pharm Projects", "Practice School", "M.Pharm Pharmacy Practice", "M.Pharm Pharmaceutics"];

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function loadUpdates() {
  try {
    return JSON.parse(localStorage.getItem(updateStorageKey) || "{}");
  } catch {
    return {};
  }
}

function saveUpdates() {
  localStorage.setItem(updateStorageKey, JSON.stringify(teacherUpdates));
}

function applyUpdates() {
  return baseRecords.map((record) => ({ ...record, ...(teacherUpdates[record.id] || {}) }));
}

function refreshRecords() {
  records = applyUpdates();
}

function norm(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function shelfName(shelf) {
  return shelfNames[shelf] || "";
}

function shelfLabel(shelf) {
  if (!shelf) return "Needs verification";
  if (shelf === "SH") return "SH - Student / staff hand";
  if (shelf === "TableTop") return "Table top";
  const name = shelfName(shelf);
  return name ? `Shelf ${shelf} - ${name}` : `Shelf ${shelf}`;
}

function statusClass(record) {
  if (record.status === "Out with student/staff" || record.status === "Not available") return "out";
  if (record.status === "Missing") return "missing";
  if (record.status === "Needs verification") return "verify";
  if (record.status === "Logged, not yet shelved") return "unassigned";
  return "available";
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
  if (category === "Journals") return "journals";
  if (category === "B.Pharm Projects") return "bpharm";
  if (category === "Practice School") return "practice";
  if (category === "M.Pharm Pharmacy Practice") return "pp";
  if (category === "M.Pharm Pharmaceutics") return "pc";
  return "";
}

function primaryPerson(record) {
  if (record.category === "Journals") return record.publisher;
  return record.category === "Books" ? record.author : record.student;
}

function secondaryPerson(record) {
  if (record.category === "Journals") return record.issue ? `Issue ${record.issue}` : "";
  return record.category === "Books" ? record.publisher : record.guide;
}

function recordLocation(record) {
  if (record.status === "Out with student/staff" || record.shelf === "SH") return "SH - with student/staff";
  if (record.shelf === "TableTop" || record.status === "Logged, not yet shelved" || record.status === "Needs verification") return "Table top";
  if (record.status === "Not available") return "Not available";
  if (record.shelf && record.rack) return `${record.shelf}-${record.rack}`;
  if (record.location) return record.location;
  if (record.shelf) return `Shelf ${record.shelf}`;
  return "Needs verification";
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
    record.status,
    record.issue,
    record.student,
    record.guide,
    record.shelf,
    record.rack,
    record.homeShelf,
    record.homeRack,
    record.location,
    shelfName(record.shelf),
    shelfName(record.homeShelf),
  ].join(" "));
}

function filteredRecords() {
  const queryTerms = norm(state.query).split(" ").filter(Boolean);
  return records.filter((record) => {
    if (state.type !== "All" && record.type !== state.type) return false;
    if (state.category !== "All" && record.category !== state.category) return false;
    if (state.shelf !== "All" && (record.shelf || "Needs verification") !== state.shelf) return false;
    if (state.rack !== "All" && (record.rack || "Needs verification") !== state.rack) return false;
    if (state.status !== "All" && (record.status || "Available") !== state.status) return false;
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

function optionLabel(select, value) {
  if (value === "All") return "All";
  if (select === els.shelfFilter) return shelfLabel(value);
  if (select === els.rackFilter && value === "Needs verification") return "Needs verification";
  return value;
}

function fillSelect(select, values, current) {
  select.innerHTML = "";
  for (const value of ["All", ...values]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = optionLabel(select, value);
    if (value === current) option.selected = true;
    select.appendChild(option);
  }
}

function renderFilters() {
  const types = unique(records.map((record) => record.type));
  const typeScoped = records.filter((record) => state.type === "All" || record.type === state.type);
  const shownCategories = categories.filter((category) => typeScoped.some((record) => record.category === category));
  const categoryScoped = typeScoped.filter((record) => state.category === "All" || record.category === state.category);
  const shelves = unique(categoryScoped.map((record) => record.shelf || "Needs verification")).sort(shelfSort);
  const shelfScoped = categoryScoped.filter((record) => state.shelf === "All" || (record.shelf || "Needs verification") === state.shelf);
  const racks = unique(shelfScoped.map((record) => record.rack || "Needs verification")).sort();
  const statuses = unique(categoryScoped.map((record) => record.status || "Available")).sort();

  if (!types.includes(state.type) && state.type !== "All") state.type = "All";
  if (!shownCategories.includes(state.category) && state.category !== "All") state.category = "All";
  if (!shelves.includes(state.shelf) && state.shelf !== "All") state.shelf = "All";
  if (!racks.includes(state.rack) && state.rack !== "All") state.rack = "All";
  if (!statuses.includes(state.status) && state.status !== "All") state.status = "All";

  fillSelect(els.typeFilter, types, state.type);
  fillSelect(els.categoryFilter, shownCategories, state.category);
  fillSelect(els.shelfFilter, shelves, state.shelf);
  fillSelect(els.rackFilter, racks, state.rack);
  fillSelect(els.statusFilter, statuses, state.status);
}

function renderSummary(list) {
  const totalBooks = records.filter((record) => record.category === "Books").length;
  const totalJournals = records.filter((record) => record.category === "Journals").length;
  const totalOut = records.filter((record) => record.status === "Out with student/staff").length;
  const totalPending = records.filter((record) => record.shelf === "TableTop" || record.status === "Logged, not yet shelved" || record.status === "Needs verification").length;
  const cards = [
    ["Total catalogue records", records.length, list.length],
    ["Library books", totalBooks, list.filter((record) => record.category === "Books").length],
    ["Journals", totalJournals, list.filter((record) => record.category === "Journals").length],
    ["Student / staff hand", totalOut, list.filter((record) => record.status === "Out with student/staff").length],
    ["Table top", totalPending, list.filter((record) => record.shelf === "TableTop" || record.status === "Logged, not yet shelved" || record.status === "Needs verification").length],
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
      if (value === "Total catalogue records" || value === "All" || value === "Shelves") {
        state.type = "All";
        state.category = "All";
        state.status = "All";
      } else if (value === "Library books") {
        state.type = "Books";
        state.category = "Books";
      } else if (value === "Journals") {
        state.type = "Journals";
        state.category = "Journals";
      } else if (value === "Student / staff hand") {
        state.type = "All";
        state.category = "All";
        state.status = "Out with student/staff";
      } else if (value === "Table top") {
        state.type = "All";
        state.category = "All";
        state.status = "All";
        state.shelf = "TableTop";
        state.query = "";
        els.searchInput.value = "";
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
  if (state.status !== "All") filters.push(state.status);
  els.activeFilters.textContent = filters.length ? filters.join(" | ") : `${records.length} total records`;
  els.resultCount.textContent = `${list.length} ${list.length === 1 ? "record" : "records"}`;
}

function renderShelfList(list) {
  const counts = new Map();
  for (const record of list) {
    const shelf = record.shelf || "Needs verification";
    counts.set(shelf, (counts.get(shelf) || 0) + 1);
  }
  const shelves = [...counts.keys()].sort(shelfSort);
  const numberedShelves = shelves.filter((shelf) => /^\d+$/.test(shelf) && Number(shelf) >= 1 && Number(shelf) <= 20).length;
  const statusAreas = shelves.length - numberedShelves;
  els.shelfCount.textContent = `${numberedShelves} shelves${statusAreas ? ` + ${statusAreas} status areas` : ""}`;
  els.shelfList.innerHTML = shelves.map((shelf) => {
    const active = state.shelf === shelf ? " active" : "";
    const label = shelfLabel(shelf);
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
    `<tr data-id="${escapeHtml(record.id)}" class="${statusClass(record)}">
      <td>${escapeHtml(record.serial)}</td>
      <td><span class="pill ${categoryClass(record.category)}">${escapeHtml(record.category)}</span></td>
      <td class="accession-cell">${escapeHtml(record.accession)}</td>
      <td class="title-cell">${highlight(record.title)}</td>
      <td>${escapeHtml(primaryPerson(record))}</td>
      <td>${escapeHtml(secondaryPerson(record))}</td>
      <td>${escapeHtml(record.year)}</td>
      <td><strong>${escapeHtml(recordLocation(record))}</strong><div class="subtext">${escapeHtml(record.status || "Available")}</div></td>
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
    ["Status", record.status || "Available"],
    ["Shelf", shelfLabel(record.shelf || "")],
    ["Rack", record.rack || "Needs verification"],
    ["Suggested home shelf", record.homeShelf ? shelfLabel(record.homeShelf) : ""],
    ["Suggested home rack", record.homeRack],
    ["Year", record.year],
  ];

  if (record.category === "Books") {
    fields.push(["Author", record.author], ["Publisher", record.publisher], ["Edition", record.edition], ["Source", record.source]);
  } else if (record.category === "Journals") {
    fields.push(["Publisher", record.publisher], ["Issue", record.issue], ["Volume / Edition", record.edition]);
  } else {
    fields.push(["Student", record.student], ["Guide", record.guide]);
  }
  if (record.catalogNote) fields.push(["Cataloguing note", record.catalogNote]);
  if (teacherUpdates[record.id]?.note) fields.push(["Update note", teacherUpdates[record.id].note]);

  els.detailFields.innerHTML = fields
    .filter(([, value]) => value)
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("");
  els.detailDrawer.classList.add("open");
  selectedRecordId = id;
  renderAdminPanel(record);
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

function renderAdminPanel(record) {
  if (!els.adminPanel) return;
  els.adminPanel.classList.toggle("hidden", !teacherUnlocked);
  if (!teacherUnlocked || !record) return;
  els.adminStatus.value = record.status || "Available";
  els.adminShelf.value = record.shelf === "SH" || record.shelf === "TableTop" || !record.shelf ? (record.homeShelf || "") : (record.shelf || "");
  els.adminRack.value = record.rack || record.homeRack || "";
  els.adminNote.value = teacherUpdates[record.id]?.note || "";
}

function unlockTeacherMode() {
  if (teacherUnlocked) {
    teacherUnlocked = false;
    els.teacherMode.textContent = "Teacher update";
    els.exportUpdates.classList.add("hidden");
    if (selectedRecordId) showDetail(selectedRecordId);
    return;
  }
  const passcode = window.prompt("Teacher passcode");
  if (passcode !== teacherPasscode) {
    window.alert("Incorrect passcode");
    return;
  }
  teacherUnlocked = true;
  els.teacherMode.textContent = "Exit teacher mode";
  els.exportUpdates.classList.remove("hidden");
  if (selectedRecordId) showDetail(selectedRecordId);
}

function saveTeacherUpdate() {
  if (!teacherUnlocked || !selectedRecordId) return;
  const record = records.find((item) => item.id === selectedRecordId);
  if (!record) return;
  const status = els.adminStatus.value;
  const shelf = els.adminShelf.value.trim();
  const rack = els.adminRack.value.trim().toUpperCase();
  const location = status === "Out with student/staff" ? "SH" : status === "Logged, not yet shelved" || status === "Needs verification" ? "Table top" : status === "Not available" ? "Not available" : rack ? `${shelf}-${rack}` : shelf;
  lastTeacherAction = {
    id: selectedRecordId,
    previous: teacherUpdates[selectedRecordId] ? { ...teacherUpdates[selectedRecordId] } : null,
  };
  teacherUpdates[selectedRecordId] = {
    status,
    shelf: status === "Out with student/staff" ? "SH" : status === "Logged, not yet shelved" || status === "Needs verification" ? "TableTop" : status === "Not available" ? "" : shelf,
    rack: status === "Out with student/staff" || status === "Logged, not yet shelved" || status === "Needs verification" || status === "Not available" ? "" : rack,
    homeShelf: shelf || record.homeShelf || "",
    homeRack: rack || record.homeRack || "",
    location,
    note: els.adminNote.value.trim(),
    updatedAt: new Date().toISOString(),
  };
  saveUpdates();
  refreshRecords();
  render();
  showDetail(selectedRecordId);
}

function undoTeacherUpdate() {
  if (!teacherUnlocked || !lastTeacherAction) return;
  if (lastTeacherAction.previous) {
    teacherUpdates[lastTeacherAction.id] = lastTeacherAction.previous;
  } else {
    delete teacherUpdates[lastTeacherAction.id];
  }
  const id = lastTeacherAction.id;
  lastTeacherAction = null;
  saveUpdates();
  refreshRecords();
  render();
  showDetail(id);
}

function exportTeacherUpdates() {
  const rows = Object.entries(teacherUpdates).map(([id, update]) => {
    const base = baseRecords.find((record) => record.id === id) || {};
    return {
      id,
      category: base.category || "",
      accession: base.accession || "",
      title: base.title || "",
      status: update.status || "",
      shelf: update.shelf || "",
      rack: update.rack || "",
      note: update.note || "",
      updatedAt: update.updatedAt || "",
    };
  });
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "library_teacher_updates.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function render() {
  refreshRecords();
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
  state.status = "All";
  render();
});

els.categoryFilter.addEventListener("change", (event) => {
  state.category = event.target.value;
  state.shelf = "All";
  state.rack = "All";
  state.status = "All";
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

els.statusFilter.addEventListener("change", (event) => {
  state.status = event.target.value;
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
  state.status = "All";
  state.sort = "location";
  els.searchInput.value = "";
  els.sortMode.value = "location";
  render();
});

els.printResults.addEventListener("click", () => {
  window.print();
});

els.teacherMode.addEventListener("click", unlockTeacherMode);
els.exportUpdates.addEventListener("click", exportTeacherUpdates);
els.saveUpdate.addEventListener("click", saveTeacherUpdate);
els.undoUpdate.addEventListener("click", undoTeacherUpdate);

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
