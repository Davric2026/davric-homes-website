document.documentElement.classList.add("js");

const themeToggle = document.querySelector(".theme-toggle");
const themeSymbol = themeToggle?.querySelector(".theme-symbol");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme, persist = false) {
  const activeTheme = theme === "dark" ? "dark" : "light";
  const isDark = activeTheme === "dark";
  document.documentElement.dataset.theme = activeTheme;
  themeToggle?.setAttribute("aria-pressed", String(isDark));
  themeToggle?.setAttribute("aria-label", isDark ? "Use light color theme" : "Use dark color theme");
  themeToggle?.setAttribute("title", isDark ? "Switch to light theme" : "Switch to dark theme");
  if (themeSymbol) themeSymbol.textContent = isDark ? "☀" : "◐";
  if (themeColorMeta) themeColorMeta.content = isDark ? "#151314" : "#f7f6f3";
  if (persist) {
    try { localStorage.setItem("davric-theme", activeTheme); } catch { /* Storage can be disabled by the browser. */ }
  }
}

applyTheme(document.documentElement.dataset.theme || "light");
themeToggle?.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
});

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
systemTheme.addEventListener?.("change", (event) => {
  try {
    if (localStorage.getItem("davric-theme")) return;
  } catch { /* Keep following the system when browser storage is unavailable. */ }
  applyTheme(event.matches ? "dark" : "light");
});

const siteIntro = document.querySelector("[data-site-intro]");
let arrivedFromPageTransition = false;
try {
  arrivedFromPageTransition = sessionStorage.getItem("davric-page-transition") === "1";
  sessionStorage.removeItem("davric-page-transition");
} catch { /* A normal intro still runs when session storage is unavailable. */ }

if (siteIntro && !arrivedFromPageTransition) {
  const pageSections = [document.querySelector(".site-header"), document.querySelector("main")].filter(Boolean);
  pageSections.forEach((section) => { section.inert = true; });
  document.body.classList.add("intro-playing");
  requestAnimationFrame(() => siteIntro.classList.add("is-ready"));

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const introExitDelay = prefersReducedMotion ? 80 : 1420;
  const introFinishDelay = prefersReducedMotion ? 340 : 2180;
  window.setTimeout(() => siteIntro.classList.add("is-exiting"), introExitDelay);
  window.setTimeout(() => {
    siteIntro.remove();
    document.body.classList.remove("intro-playing");
    pageSections.forEach((section) => { section.inert = false; });
  }, introFinishDelay);
} else {
  siteIntro?.remove();
}

if (arrivedFromPageTransition) {
  document.documentElement.classList.add("page-arriving");
  window.setTimeout(() => document.documentElement.classList.remove("page-arriving"), 720);
}

const menuButton = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
const desktopNavDropdowns = [...document.querySelectorAll(".desktop-nav-dropdown")];

desktopNavDropdowns.forEach((dropdown) => {
  dropdown.addEventListener("toggle", () => {
    if (!dropdown.open) return;
    desktopNavDropdowns.forEach((otherDropdown) => {
      if (otherDropdown !== dropdown) otherDropdown.open = false;
    });
  });

  dropdown.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      dropdown.open = true;
    }
  });
  dropdown.addEventListener("pointerleave", () => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !dropdown.contains(document.activeElement)) {
      dropdown.open = false;
    }
  });
  dropdown.addEventListener("focusin", () => { dropdown.open = true; });
  dropdown.addEventListener("focusout", (event) => {
    if (!dropdown.contains(event.relatedTarget) && !dropdown.matches(":hover")) dropdown.open = false;
  });
});

document.addEventListener("click", (event) => {
  desktopNavDropdowns.forEach((dropdown) => {
    if (dropdown.open && !dropdown.contains(event.target)) dropdown.open = false;
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const openDropdown = desktopNavDropdowns.find((dropdown) => dropdown.open);
  if (!openDropdown) return;
  openDropdown.open = false;
  openDropdown.querySelector("summary")?.focus();
});

function setMenuOpen(open, returnFocus = false) {
  if (!menuButton || !primaryNav) return;
  menuButton.setAttribute("aria-expanded", String(open));
  primaryNav.classList.toggle("is-open", open);
  primaryNav.inert = !open;
  primaryNav.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("menu-open", open);
  const label = menuButton.querySelector(".sr-only");
  if (label) label.textContent = open ? "Close navigation" : "Open navigation";
  if (open) primaryNav.querySelector(".menu-links a")?.focus({ preventScroll: true });
  else if (returnFocus) menuButton.focus({ preventScroll: true });
}

menuButton?.addEventListener("click", () => {
  const opening = menuButton.getAttribute("aria-expanded") !== "true";
  setMenuOpen(opening, !opening);
});

primaryNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") setMenuOpen(false, true);
});

primaryNav?.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const focusableLinks = Array.from(primaryNav.querySelectorAll("a[href]"));
  const first = focusableLinks[0];
  const last = focusableLinks[focusableLinks.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
});

const pageTransition = document.querySelector("[data-page-transition]");
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;

  // The back/forward cache restores the old DOM mid-transition. Reset its overlay.
  document.documentElement.classList.remove("page-leaving", "page-arriving");
  pageTransition?.classList.remove("is-active");
});

document.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target && link.target !== "_self" || link.hasAttribute("download")) return;

  const target = new URL(link.href, window.location.href);
  if (target.origin !== window.location.origin || !["http:", "https:"].includes(target.protocol)) return;

  const currentPath = window.location.pathname;
  const targetPath = target.pathname;
  if (currentPath === targetPath && target.search === window.location.search) return;

  event.preventDefault();
  setMenuOpen(false);
  document.documentElement.classList.add("page-leaving");
  pageTransition?.classList.add("is-active");
  try { sessionStorage.setItem("davric-page-transition", "1"); } catch { /* Navigation still proceeds without session storage. */ }

  const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 620;
  window.setTimeout(() => window.location.assign(target.href), delay);
});

const scrollMeter = document.querySelector("[data-scroll-meter]");
let scrollMeterQueued = false;

function updateScrollMeter() {
  if (!scrollMeter) return;
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
  scrollMeter.style.transform = `scaleX(${progress})`;
  scrollMeterQueued = false;
}

function queueScrollMeterUpdate() {
  if (scrollMeterQueued) return;
  scrollMeterQueued = true;
  window.requestAnimationFrame(updateScrollMeter);
}

window.addEventListener("scroll", queueScrollMeterUpdate, { passive: true });
window.addEventListener("resize", queueScrollMeterUpdate);
updateScrollMeter();

const projectFilterForm = document.querySelector("#project-filters");
const projectFilterDisclosure = document.querySelector("#project-filter-disclosure");
const mobileProjectFilterQuery = window.matchMedia("(max-width: 720px)");
const projectCards = document.querySelectorAll(".project-card[data-city]");
const projectCount = document.querySelector(".project-count");
const projectEmptyState = document.querySelector("[data-project-empty]");

if (projectFilterForm) {
  const requestedFilters = new URLSearchParams(window.location.search);
  ["location", "type", "bedrooms", "availability"].forEach((name) => {
    const requestedValue = requestedFilters.get(name);
    const control = projectFilterForm.elements.namedItem(name);
    if (!requestedValue || !(control instanceof HTMLSelectElement)) return;
    if ([...control.options].some((option) => option.value === requestedValue)) control.value = requestedValue;
  });
}

const syncProjectFilterDisclosure = () => {
  if (projectFilterDisclosure) projectFilterDisclosure.open = !mobileProjectFilterQuery.matches;
};

syncProjectFilterDisclosure();
mobileProjectFilterQuery.addEventListener("change", syncProjectFilterDisclosure);

function applyProjectFilters() {
  if (!projectFilterForm) return;
  const values = new FormData(projectFilterForm);
  const location = values.get("location");
  const type = values.get("type");
  const bedrooms = values.get("bedrooms");
  const availability = values.get("availability");
  const minPrice = String(values.get("priceMin") || "").trim();
  const maxPrice = String(values.get("priceMax") || "").trim();
  let visible = 0;

  projectCards.forEach((card) => {
    const cardBedrooms = (card.dataset.bedrooms || "").split(",").filter(Boolean);
    const price = Number(card.dataset.price);
    let show = (location === "all" || card.dataset.city === location)
      && (type === "all" || card.dataset.type === type)
      && (bedrooms === "all" || cardBedrooms.includes(bedrooms))
      && (availability === "all" || card.dataset.availability === availability);

    if (show && (minPrice || maxPrice)) {
      show = Number.isFinite(price) && price > 0
        && (!minPrice || price >= Number(minPrice))
        && (!maxPrice || price <= Number(maxPrice));
    }

    card.hidden = !show;
    if (show) visible += 1;
  });

  const noun = projectCount?.dataset.countNoun || "property";
  if (projectCount) projectCount.textContent = `Showing ${visible} ${noun}${visible === 1 ? "" : "s"}`;
  if (projectEmptyState) projectEmptyState.hidden = visible > 0;
  const hasFilters = location !== "all" || type !== "all" || bedrooms !== "all"
    || availability !== "all" || Boolean(minPrice || maxPrice);
  projectFilterForm.querySelector(".project-clear-button").hidden = !hasFilters;
}

projectFilterForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  applyProjectFilters();
  if (mobileProjectFilterQuery.matches && projectFilterDisclosure) projectFilterDisclosure.open = false;
});
projectFilterForm?.addEventListener("reset", () => {
  window.requestAnimationFrame(applyProjectFilters);
});
applyProjectFilters();

document.querySelectorAll("[data-project-gallery]").forEach((gallery) => {
  const image = gallery.querySelector(".project-image img");
  const counter = gallery.querySelector("[data-project-image-index]");
  if (!image) return;

  let photos = [];
  try {
    photos = JSON.parse(gallery.dataset.projectPhotos || "[]");
  } catch {
    photos = [];
  }
  const seenPhotoSources = new Set();
  photos = photos.filter((photo) => {
    const source = String(photo?.src || "").trim();
    if (!source || seenPhotoSources.has(source)) return false;
    seenPhotoSources.add(source);
    return true;
  });
  if (!photos.length) return;

  let activePhoto = 0;
  const showPhoto = () => {
    const photo = photos[activePhoto];
    image.src = photo.src;
    image.alt = photo.alt || "";
    if (counter) counter.textContent = String(activePhoto + 1).padStart(2, "0") + " / " + String(photos.length).padStart(2, "0");
  };
  gallery.querySelectorAll("[data-project-gallery-step]").forEach((button) => {
    button.hidden = photos.length < 2;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const step = Math.sign(Number(button.dataset.projectGalleryStep)) || 1;
      activePhoto = (activePhoto + step + photos.length) % photos.length;
      showPhoto();
    });
  });
  showPhoto();
});

const savedProjectKey = "davric-saved-projects";
let savedProjectSlugs = [];
try {
  const storedProjects = JSON.parse(window.localStorage.getItem(savedProjectKey) || "[]");
  if (Array.isArray(storedProjects)) savedProjectSlugs = storedProjects;
} catch {
  savedProjectSlugs = [];
}

document.querySelectorAll("[data-project-save]").forEach((button) => {
  const slug = button.dataset.projectSlug;
  const syncSavedState = () => {
    const isSaved = savedProjectSlugs.includes(slug);
    button.classList.toggle("is-saved", isSaved);
    button.setAttribute("aria-pressed", String(isSaved));
    const label = slug.replaceAll("-", " ");
    button.setAttribute("aria-label", (isSaved ? "Remove saved " : "Save ") + label);
  };
  syncSavedState();
  button.addEventListener("click", () => {
    savedProjectSlugs = savedProjectSlugs.includes(slug)
      ? savedProjectSlugs.filter((savedSlug) => savedSlug !== slug)
      : [...savedProjectSlugs, slug];
    try {
      window.localStorage.setItem(savedProjectKey, JSON.stringify(savedProjectSlugs));
    } catch {
      // Keep the save button usable for this session if local storage is unavailable.
    }
    syncSavedState();
  });
});
const projectStories = {
  "pebblebrooks-estate": {
    title: "Pebblebrooks Estate", estateName: "Pebblebrooks Estate", seoTitle: "Pebblebrooks Estate | Jericho, Ibadan | Dav-Ric Homes", seoDescription: "Explore 13 gated homes in Jericho, Ibadan, with a central gas system, estate security and a location close to the Police Commissioner’s Residence.", number: "01", category: "Residential · Ibadan", location: "Jericho, Ibadan", area: "Approx. 3,218 sqm",
    image: "assets/pebblebrooks/gallery/pebblebrooks-home-05.webp", imageAlt: "Aerial architectural visualisation of Pebblebrooks Estate and its 13 homes", visualNote: "Pebblebrooks Estate · Jericho, Ibadan · Architectural visualisation",
    deck: "13 gated homes in Jericho, with a central gas system, estate security and a location close to the Police Commissioner’s Residence.",
    price: "On request", formValue: "Pebblebrooks Estate",
    facts: [["Homes", "13"], ["Home types", "7 terraces · 6 semi-detached"], ["Semi-detached homes", "6 with one-bedroom basement suites"], ["Site area", "Approx. 3,218 sqm"]],
    keyFeaturesLead: "Designed for slow, easy living.",
    keyFeatures: [
      { title: "Central gas reticulation system", priority: true },
      { title: "Swimming pool", priority: true },
      { title: "Badminton court", priority: true },
      { title: "24/7 security & CCTV" },
      { title: "Modern kitchen" },
      { title: "Large windows" },
      { title: "Outdoor terrace / sit-out" },
      { title: "Gym" },
      { title: "Green playground" },
      { title: "Ample parking" },
      { title: "Ensuite bathrooms" },
      { title: "Large balconies" },
    ],
    galleryAfter: 1, galleryTitle: "Estate and exterior gallery", galleryLabel: "Pebblebrooks Estate · Jericho, Ibadan", galleryLayout: "pebblebrooks-gallery",
    galleryNote: "Architectural visualisations are illustrative; home layouts, materials and final specifications are subject to confirmation.",
    gallery: [
      { image: "assets/pebblebrooks-render.webp", alt: "Aerial architectural visualisation of the Pebblebrooks Estate homes and shared courtyard", caption: "The estate", size: "wide" },
      { image: "assets/pebblebrooks/gallery/pebblebrooks-home-04.webp", alt: "Architectural visualisation of a landscaped shared courtyard between modern residences", caption: "The shared courtyard", size: "wide" },
      { image: "assets/pebblebrooks/gallery/pebblebrooks-home-05.webp", alt: "Aerial architectural visualisation of a residential community with homes facing a central court", caption: "The residential community", size: "wide" },
    ],
    pairedSections: [6, 7],
    sections: [
      { label: "The setting", heading: "A complete estate plan for Jericho.", paragraphs: [
        "Pebblebrooks is planned across approximately 3,218 square metres in Jericho, Ibadan. Its site layout places seven terrace homes and six semi-detached homes around internal access ways and a central landscaped court.",
        "The same plan marks parking, an ancillary building, a gatehouse and a badminton court. It gives a clear overview of how homes, circulation and shared spaces fit together.",
      ], galleryLayout: "plans-landscape-single", gallery: [
        { image: "assets/pebblebrooks/plans/pebblebrooks-site-layout.webp", alt: "Pebblebrooks Estate site layout showing seven terraces, six semi-detached homes, parking, badminton court, ancillary building and gatehouse", caption: "Estate site layout", note: "13 homes · Jericho, Ibadan" },
      ] },
      { label: "Terrace homes", heading: "7 units of four-bedroom homes, planned across three levels.", paragraphs: [
        "The terrace home has an 83.5 sqm ground floor, a 98 sqm first floor and a 98 sqm second floor. The ground level brings together a 31 sqm lounge, dining room, kitchen, pantry, guest WC and a maid’s room with its own bath.",
        "The upper floors add a family lounge, two bedrooms and a main bedroom with a walk-in closet. Balconies appear on both upper levels in the supplied drawings.",
      ], galleryLayout: "plans-landscape", gallery: [
        { image: "assets/pebblebrooks/plans/pebblebrooks-terrace-ground-floor.webp", alt: "Ground floor plan for a Pebblebrooks terrace home, 83.5 square metres", caption: "Ground floor", note: "83.5 sqm · lounge, kitchen and maid’s room" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-terrace-first-floor.webp", alt: "First floor plan for a Pebblebrooks terrace home, 98 square metres", caption: "First floor", note: "98 sqm · family lounge and bedrooms" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-terrace-second-floor.webp", alt: "Second floor plan for a Pebblebrooks terrace home, 98 square metres", caption: "Second floor", note: "98 sqm · main bedroom and bedroom three" },
      ] },
      { label: "Semi-detached homes", heading: "6 units with a separate one-bedroom basement apartment.", paragraphs: [
        "The semi-detached home is shown with a 59 sqm basement, an 84 sqm ground floor and two 100 sqm upper floors. Each home is described as a four-bedroom residence with a one-bedroom basement apartment.",
        "The basement plan includes a lounge, kitchen, bath, laundry and store. Above it, the ground floor contains the main living, dining and kitchen spaces; the upper floors add bedrooms, family lounge, cinema room, walk-in closets and balconies.",
      ], galleryLayout: "plans-landscape-pair", gallery: [
        { image: "assets/pebblebrooks/plans/pebblebrooks-semi-basement.webp", alt: "Basement floor plan for a Pebblebrooks semi-detached home, 59 square metres", caption: "Basement floor", note: "59 sqm · one-bedroom apartment layout" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-semi-ground-floor.webp", alt: "Ground floor plan for a Pebblebrooks semi-detached home, 84 square metres", caption: "Ground floor", note: "84 sqm · living, dining and kitchen" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-semi-first-floor.webp", alt: "First floor plan for a Pebblebrooks semi-detached home, 100 square metres", caption: "First floor", note: "100 sqm · bedrooms, lounge and cinema" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-semi-second-floor.webp", alt: "Second floor plan for a Pebblebrooks semi-detached home, 100 square metres", caption: "Second floor", note: "100 sqm · main bedroom and bedroom three" },
      ] },
      { label: "Shared amenities", heading: "Everyday recreation has its own place.", paragraphs: [
        "The ancillary building drawings show a ground-floor green and play area beside a swimming pool, with parking and washroom facilities. The first floor contains a 38 sqm gym, while the second floor is arranged as an outdoor terrace and sit-out.",
        "These spaces complement the badminton court and landscaped central mall shown on the estate layout.",
      ], galleryLayout: "plans-landscape", gallery: [
        { image: "assets/pebblebrooks/plans/pebblebrooks-ancillary-ground-floor.webp", alt: "Ground floor plan for the Pebblebrooks ancillary building showing a green and play area, pool, parking and washroom", caption: "Ground floor", note: "Green and play area · pool · parking" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-ancillary-first-floor.webp", alt: "First floor plan for the Pebblebrooks ancillary building showing a 38 square metre gym", caption: "First floor", note: "38 sqm gym" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-ancillary-second-floor.webp", alt: "Second floor plan for the Pebblebrooks ancillary building showing an outdoor terrace and sit-out", caption: "Second floor", note: "Outdoor terrace and sit-out" },
      ] },
      { label: "Gatehouse & services", heading: "Security, management and utilities are planned at the entrance.", paragraphs: [
        "The ground-floor gatehouse plan labels a 7 sqm gas station and a 7 sqm generator space, alongside a bedroom, office and pedestrian gate. The first-floor plan adds a CCTV/security office, storage, a general office and a facility manager’s room.",
        "The descriptions here follow the room labels in the supplied plans. Ask Dav-Ric Homes to confirm the final operating arrangement for estate services.",
      ], galleryLayout: "plans-landscape-pair", gallery: [
        { image: "assets/pebblebrooks/plans/pebblebrooks-gatehouse-ground-floor.webp", alt: "Ground floor gatehouse plan showing a gas station, generator, bedroom, office and pedestrian gate", caption: "Ground floor", note: "Gas station · generator · entrance office" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-gatehouse-first-floor.webp", alt: "First floor gatehouse plan showing CCTV office, storage, general office and facility manager room", caption: "First floor", note: "CCTV · storage · management offices" },
      ] },
      { label: "Design & finish", heading: "A contemporary design brief with considered finishes.", paragraphs: [
        "The brochure describes open floor plans, clean-lined architecture, large energy-efficient windows and a focus on natural light. It also lists premium flooring, countertops and cabinetry, designer kitchen appliances, high-end fixtures and spa-style bathrooms as part of the finish direction.",
        "Its neighbourhood description emphasises landscaping, green space and a quieter, family-oriented setting. These are brochure statements; confirm final specifications with Dav-Ric Homes.",
      ] },
      { label: "Project update", heading: "Structure is progressing on site.", paragraphs: [
        "The latest published Dav-Ric update lists structural works as ongoing. Construction status can change as the programme advances.",
        "Construction status, availability and pricing can change. Contact Dav-Ric Homes for the latest site update and to arrange a visit before making a decision.",
      ] },
    ],
  },
  "project-beta": {
    title: "Palm Harbour Estate", estateName: "Palm Harbour Estate", seoTitle: "Palm Harbour Estate | Alalubosa, Ibadan", seoDescription: "Explore Palm Harbour Estate in Alalubosa, Ibadan, with project information, home plans and exterior views.", number: "04", category: "Residential · Ibadan", location: "Alalubosa, Ibadan", area: "Approx. 3,023 sqm",
    image: "assets/palm-harbour/palm-harbour-exterior-01.jpeg", imageAlt: "Palm Harbour Estate contemporary terrace homes viewed from the street in Alalubosa, Ibadan", visualNote: "Architectural visualisations · illustrative",
    deck: "A fresh look at Palm Harbour Estate, a residential community in Alalubosa, Ibadan.",
    price: "On request", formValue: "Palm Harbour Estate",
    facts: [["Location", "Palm Harbour Estate · Alalubosa, Ibadan"], ["Site area", "Approx. 3,023 sqm"], ["Existing row", "5 terrace homes"], ["New phase", "5 homes · G+2"]],
    keyFeatures: [
      { title: "Two development stages", detail: "The project information lists five existing terrace homes and a separate new phase of five G+2 homes." },
      { title: "Everyday ground-floor spaces", detail: "The supplied plan shows a living room, dining area, kitchen, laundry, store, guest room and ante room." },
      { title: "Upper-floor rooms", detail: "The upper plan includes a master bedroom, other bedrooms, toilets, a lounge beside a void and a terrace." },
      { title: "Alalubosa address", detail: "The estate is located in Alalubosa, Ibadan, on an approximately 3,023 sqm site." },
    ],
    galleryAfter: 1, galleryTitle: "Exterior gallery", galleryLabel: "Palm Harbour Estate · Alalubosa, Ibadan", galleryLayout: "three-up", gallery: [
      { image: "assets/palm-harbour/palm-harbour-exterior-01.jpeg", alt: "Palm Harbour Estate terrace homes viewed from the street with residents arriving", caption: "A welcoming street front", note: "Architectural visualisation" },
      { image: "assets/palm-harbour/palm-harbour-exterior-02.jpeg", alt: "A row of Palm Harbour Estate homes at sunset", caption: "The terrace row at sunset", note: "Architectural visualisation" },
      { image: "assets/palm-harbour/palm-harbour-exterior-03.jpeg", alt: "Palm Harbour Estate homes and landscaped entrances", caption: "Homes and landscaped entries", note: "Architectural visualisation" },
      { image: "assets/palm-harbour/palm-harbour-exterior-04.jpeg", alt: "Palm Harbour Estate front elevation at dusk", caption: "An evening view of the homes", note: "Architectural visualisation" },
    ],
    pairedSections: [3, 4],
    sections: [
      { label: "The setting", heading: "An established Alalubosa address with a new phase.", paragraphs: [
        "Palm Harbour Estate is located in Alalubosa, Ibadan, on an approximately 3,023 sqm site. The published project information lists an existing row of five terrace homes and a separate new phase of five homes.",
        "The exterior visualisations show the homes, entrance and shared estate setting from several angles.",
      ] },
      { label: "Building plans", heading: "Ground- and upper-floor layouts, together.", paragraphs: [
        "The supplied ground-floor drawing places the living room and dining area beside the kitchen, with a laundry, store, guest room and ante room. The upper-floor drawing shows a master bedroom, other bedrooms, toilets, a lounge around a void and a terrace.",
        "The plans illustrate room arrangement and dimensions. Confirm the final layout and specifications with Dav-Ric Homes.",
      ], galleryLayout: "plans-landscape-pair", gallery: [
        { image: "assets/palm-harbour/plans/palm-harbour-ground-floor.webp", alt: "Palm Harbour Estate ground-floor plan showing living, dining, kitchen, laundry, store and guest room spaces", caption: "Ground-floor plan", note: "Living · dining · kitchen · guest room" },
        { image: "assets/palm-harbour/plans/palm-harbour-upper-floor.webp", alt: "Palm Harbour Estate upper-floor plan showing bedrooms, lounge, void, toilets and terrace", caption: "Upper-floor plan", note: "Bedrooms · lounge · terrace" },
      ] },
      { label: "The new homes", heading: "Five G+2 homes meet the street.", paragraphs: [
        "The new phase is described as five G+2 homes, with taller massing shaped towards the street. The published design direction aims to make the frontage feel intentional while responding to the terrace row already on the site.",
        "The supplied drawings and images are architectural design material; they do not establish final construction specifications.",
      ] },
      { label: "Project update", heading: "Two stages of work are described.", paragraphs: [
        "Dav-Ric’s published update places rear units at carcass stage and the street-frontage phase in development. These notes describe different parts of the project, rather than a single site-wide completion stage.",
        "Ask the Dav-Ric Homes team for current construction details, availability and a site visit. Project information can change as work progresses.",
      ] },
    ],
  },
  guzape: {
    title: "Guzape · Abuja", estateName: "Guzape Main Project", seoTitle: "Guzape Main Project | Abuja | Dav-Ric Homes", seoDescription: "Explore the Guzape, Abuja terrace-home concept through its four-home site layout, three-level floor plans and architectural visualisations.", number: "03", category: "Residential · Abuja", location: "Guzape, Abuja, FCT", area: "Approx. 1,667 sqm",
    image: "assets/guzape/guzape-terrace-row-hero.jpg", imageAlt: "Architectural visualisation of a terrace-home row for the Guzape project in Abuja", visualNote: "Concept visualisation · subject to final design",
    deck: "A terrace-home concept for Guzape, Abuja, presented through a four-home site layout, three-level plans and exterior visualisations.",
    price: "On request", formValue: "Guzape Main Project",
    facts: [["Location", "Guzape Main Project · Guzape, Abuja, FCT"], ["Site area", "Approx. 1,667 sqm"], ["Homes shown", "4 terrace homes"], ["Plans", "Ground · first · second floors"], ["Stage", "Concept design"]],
    keyFeatures: [
      { title: "Guzape, Abuja" },
      { title: "Approx. 1,667 sqm" },
      { title: "Four-home site layout" },
      { title: "Three-level floor plans" },
      { title: "Terrace home designs" },
      { title: "Concept design" },
    ],
    galleryTitle: "Guzape project presentation", galleryLabel: "Guzape Main Project · Guzape, Abuja", galleryLayout: "three-up",
    galleryNote: "Concept plans and architectural visualisations from the Abuja project presentation.",
    gallery: [
      { image: "assets/guzape/guzape-aerial-view.jpg", alt: "Aerial exterior visualisation of the Guzape terrace-home development", caption: "Aerial exterior view", size: "wide" },
      { image: "assets/guzape/guzape-site-layout.jpg", alt: "Site layout showing four terrace homes in Guzape", caption: "Four-home site layout", type: "plan", size: "wide" },
      { image: "assets/guzape/guzape-three-floor-plans.png", alt: "Ground, first and second floor plans for the Guzape terrace homes", caption: "Three-level floor plans", type: "plan" },
      { image: "assets/guzape/guzape-terrace-home-render.jpg", alt: "Exterior architectural visualisation of a Guzape terrace home", caption: "Terrace home design" },
      { image: "assets/guzape/guzape-street-elevation.jpg", alt: "Street elevation visualisation of the Guzape terrace homes", caption: "Street elevation" },
    ],
    sections: [
      { label: "The setting", heading: "A terrace-home concept for Guzape, Abuja.", paragraphs: [
        "The Abuja presentation shows a proposed terrace-home development in Guzape, with a site layout for four homes and floor plans across the ground, first and second floors.",
        "The project is listed at concept design stage. The presentation communicates an architectural direction and does not confirm final construction specifications or approvals.",
      ] },
      { label: "Design direction", heading: "A street-facing terrace design.", paragraphs: [
        "The presentation pairs an aerial view and street elevation with exterior views of the terrace homes. Together, they show the proposed massing, balconies, roof terraces and arrival sequence.",
        "These are concept visualisations; confirm the latest approved designs and specifications with Dav-Ric Homes.",
      ] },
      { label: "What to know", heading: "Plans and visuals for the current concept.", paragraphs: [
        "The supplied drawings show ground, first and second floor plans alongside a four-home site layout. They provide an overview of the concept rather than a final specification.",
        "Ask the Dav-Ric Homes team for current project status, confirmed details, availability and any updates to the presentation.",
      ] },
    ],
  },

  ajoda: {
    title: "Living Waters Estate", estateName: "Living Waters Estate", seoTitle: "Living Waters Estate | Ajoda New Town, Ibadan", seoDescription: "Explore three home plan options for Living Waters Estate in Ajoda New Town, Ibadan, including three-bedroom, two-bedroom and flat-roof designs.", number: "02", category: "Residential · Ibadan", location: "Ajoda New Town, Ibadan",
    image: "assets/ajoda/ajoda-three-bedroom-vision.png", imageAlt: "Architectural visualisation of a three-bedroom home design for Living Waters Estate in Ajoda New Town, Ibadan", visualNote: "Architectural visualisation · illustrative",
    deck: "Two and three-bedroom homes for Living Waters Estate in Ajoda New Town, Ibadan, including a two-bedroom flat-roof option.",
    price: "On request", formValue: "Living Waters Estate",
    galleryTitle: "The Living Waters home collection", galleryLabel: "Living Waters Estate · Ajoda New Town, Ibadan", galleryLayout: "living-waters-gallery",
    galleryNote: "Design visuals are illustrative. Confirm final layouts and specifications with Dav-Ric Homes.",
    gallery: [
      { image: "assets/ajoda/ajoda-three-bedroom-vision.png", alt: "Exterior visualisation of the three-bedroom Living Waters Estate home", caption: "Three-bedroom home" },
      { image: "assets/ajoda/ajoda-two-bedroom-vision.png", alt: "Exterior visualisation of the two-bedroom Living Waters Estate home", caption: "Two-bedroom home" },
      { image: "assets/ajoda/ajoda-two-bedroom-flat-roof-vision.png", alt: "Exterior visualisation of the two-bedroom flat-roof Living Waters Estate home", caption: "Flat-roof home" },
      { image: "assets/ajoda/ajoda-three-bedroom-plan.png", alt: "Architectural floor plan for the three-bedroom Living Waters Estate home", caption: "Three-bedroom plan", type: "plan" },
      { image: "assets/ajoda/ajoda-two-bedroom-plan.png", alt: "Architectural floor plan for the two-bedroom Living Waters Estate home", caption: "Two-bedroom plan", type: "plan" },
      { image: "assets/ajoda/ajoda-two-bedroom-flat-roof-plan.png", alt: "Architectural floor plan for the two-bedroom flat-roof Living Waters Estate home", caption: "Flat-roof plan", type: "plan" },
    ],
    facts: [["Location", "Living Waters Estate · Ajoda New Town, Ibadan"], ["Home types", "3-bedroom · 2-bedroom"], ["Roof option", "2-bedroom flat roof"]],
    keyFeatures: [
      { title: "Three-bedroom home", detail: "A three-bedroom home plan is supplied for Living Waters Estate." },
      { title: "Two-bedroom home", detail: "A separate two-bedroom home plan and exterior visualisation are supplied." },
      { title: "Flat-roof option", detail: "The portfolio also includes a two-bedroom flat-roof design." },
      { title: "Ajoda New Town", detail: "Living Waters Estate is located in Ajoda New Town, Ibadan." },
    ],
    sections: [
      { label: "The setting", heading: "A new home vision for Living Waters Estate.", paragraphs: [
        "Living Waters Estate is located in Ajoda New Town, Ibadan. The supplied drawings and visualisations show three residential options: a three-bedroom home, a two-bedroom home and a two-bedroom flat-roof design.",
        "The gallery above pairs each home plan with its exterior direction, making the three options easy to compare.",
      ] },
      { label: "Building plans", heading: "Three layouts, shown on their own.", paragraphs: [
        "The architectural drawings set out the three-bedroom plan, two-bedroom plan and two-bedroom flat-roof plan as separate images, apart from the exterior visualisations.",
        "These are the supplied plan drawings. Confirm final specifications and availability with Dav-Ric Homes.",
      ] },
      { label: "The vision", heading: "Exterior concepts for each home type.", paragraphs: [
        "The visualisations pair each layout with an exterior direction. They show the three-bedroom design, the two-bedroom home and the flat-roof option as distinct ways of imagining the Living Waters Estate homes.",
        "These images illustrate design intent; final appearance and specifications should be confirmed with Dav-Ric Homes.",
      ] },
    ],
  },
};

const pebblebrooksHomeTypes = {
  terrace: {
    title: "Terrace Home",
    sectionLabel: "Terrace homes",
    galleryTitle: "Terrace home plans",
    contactSlug: "pebblebrooks-two-bedroom",
    formValue: "Terrace home · Pebblebrooks Estate",
    pageTitle: "Terrace Home at Pebblebrooks Estate | Jericho, Ibadan | Dav-Ric Homes",
    pageDescription: "Explore the terrace home plans and shared estate features at Pebblebrooks Estate in Jericho, Ibadan.",
    deck: "A four-bedroom terrace home with plans across three levels, set within Pebblebrooks Estate in Jericho, Ibadan, and its shared community features.",
    facts: [["Bedrooms", "4"], ["Floor levels", "Ground · first · second"], ["Plan areas", "83.5 · 98 · 98 sqm"]],
  },
  "semi-detached": {
    title: "Semi-detached Building",
    sectionLabel: "Semi-detached homes",
    galleryTitle: "Semi-detached building plans",
    contactSlug: "pebblebrooks-three-bedroom",
    formValue: "Semi-detached building · Pebblebrooks Estate",
    pageTitle: "Semi-detached Building at Pebblebrooks Estate | Jericho, Ibadan | Dav-Ric Homes",
    pageDescription: "Explore the semi-detached home plans and shared estate features at Pebblebrooks Estate in Jericho, Ibadan.",
    deck: "A four-bedroom semi-detached building with a separate one-bedroom basement apartment, set within Pebblebrooks Estate in Jericho, Ibadan.",
    facts: [["Bedrooms", "4 + 1 basement suite"], ["Floor levels", "Basement · ground · first · second"], ["Plan areas", "59 · 84 · 100 · 100 sqm"]],
  },
};

const pebblebrooksHomeRoutes = {
  "pebblebrooks-terrace-home": "terrace",
  "pebblebrooks-semi-detached-building": "semi-detached",
};

const livingWatersHomeTypes = {
  "two-bedroom": {
    title: "Two-Bedroom Home",
    seoTitle: "Two-Bedroom Home | Living Waters Estate, Ajoda, Ibadan | Dav-Ric Homes",
    seoDescription: "Explore the two-bedroom home at Living Waters Estate in Ajoda New Town, including its exterior visualisation, floor plan and flat-roof option.",
    deck: "A two-bedroom residence at Living Waters Estate in Ajoda New Town, Ibadan, with a separate flat-roof design option.",
    contactSlug: "living-waters-two-bedroom",
    image: "assets/ajoda/ajoda-two-bedroom-vision.png",
    imageAlt: "Architectural visualisation of the two-bedroom Living Waters Estate home in Ajoda New Town, Ibadan",
    visualNote: "Two-bedroom home · Living Waters Estate · Ajoda New Town",
    price: "On request",
    facts: [["Bedrooms", "2"], ["Design options", "Standard · flat roof"], ["Location", "Living Waters Estate · Ajoda New Town, Ibadan"]],
    keyFeatures: [
      { title: "Two-bedroom home plan" },
      { title: "Standard and flat-roof designs" },
      { title: "Living Waters Estate · Ajoda New Town" },
    ],
    galleryTitle: "Two-bedroom home and plans",
    galleryLabel: "Living Waters Estate · Ajoda New Town, Ibadan",
    galleryLayout: "living-waters-home-gallery",
    galleryNote: "Design visuals are illustrative. Confirm final layouts and specifications with Dav-Ric Homes.",
    gallery: [
      { image: "assets/ajoda/ajoda-two-bedroom-vision.png", alt: "Exterior visualisation of the standard two-bedroom Living Waters home", caption: "Two-bedroom home" },
      { image: "assets/ajoda/ajoda-two-bedroom-plan.png", alt: "Architectural floor plan for the two-bedroom Living Waters home", caption: "Two-bedroom plan", type: "plan" },
      { image: "assets/ajoda/ajoda-two-bedroom-flat-roof-vision.png", alt: "Exterior visualisation of the two-bedroom flat-roof Living Waters home", caption: "Flat-roof option" },
      { image: "assets/ajoda/ajoda-two-bedroom-flat-roof-plan.png", alt: "Architectural floor plan for the two-bedroom flat-roof Living Waters home", caption: "Flat-roof plan", type: "plan" },
    ],
    sections: [{ label: "Two-bedroom home", heading: "A two-bedroom home with two design options.", paragraphs: [
      "The Living Waters collection includes a standard two-bedroom home and a separate two-bedroom flat-roof design.",
      "Compare each supplied exterior visualisation with its floor plan in the gallery above. Confirm final layouts and specifications with Dav-Ric Homes.",
    ] }],
  },
  "three-bedroom": {
    title: "Three-Bedroom Home",
    seoTitle: "Three-Bedroom Home | Living Waters Estate, Ajoda, Ibadan | Dav-Ric Homes",
    seoDescription: "Explore the three-bedroom home at Living Waters Estate in Ajoda New Town with its exterior visualisation and floor plan.",
    deck: "A three-bedroom residence at Living Waters Estate in Ajoda New Town, Ibadan, with its own exterior visualisation and floor plan.",
    contactSlug: "living-waters-three-bedroom",
    image: "assets/ajoda/ajoda-three-bedroom-vision.png",
    imageAlt: "Architectural visualisation of the three-bedroom Living Waters Estate home in Ajoda New Town, Ibadan",
    visualNote: "Three-bedroom home · Living Waters Estate · Ajoda New Town",
    price: "On request",
    facts: [["Bedrooms", "3"], ["Plan", "Three-bedroom residence"], ["Location", "Living Waters Estate · Ajoda New Town, Ibadan"]],
    keyFeatures: [
      { title: "Three-bedroom home plan" },
      { title: "Exterior design visualisation" },
      { title: "Living Waters Estate · Ajoda New Town" },
    ],
    galleryTitle: "Three-bedroom home and plan",
    galleryLabel: "Living Waters Estate · Ajoda New Town, Ibadan",
    galleryLayout: "living-waters-home-gallery",
    galleryNote: "Design visuals are illustrative. Confirm final layouts and specifications with Dav-Ric Homes.",
    gallery: [
      { image: "assets/ajoda/ajoda-three-bedroom-vision.png", alt: "Exterior visualisation of the three-bedroom Living Waters home", caption: "Three-bedroom home" },
      { image: "assets/ajoda/ajoda-three-bedroom-plan.png", alt: "Architectural floor plan for the three-bedroom Living Waters home", caption: "Three-bedroom plan", type: "plan" },
    ],
    sections: [{ label: "Three-bedroom home", heading: "A three-bedroom home for Living Waters Estate.", paragraphs: [
      "Explore the supplied exterior visualisation alongside the three-bedroom floor plan.",
      "The design images are illustrative. Confirm final layouts and specifications with Dav-Ric Homes.",
    ] }],
  },
};

const livingWatersHomeRoutes = {
  "living-waters-two-bedroom-home": "two-bedroom",
  "living-waters-three-bedroom-home": "three-bedroom",
};

const mediaProjectAlbums = document.querySelector("[data-media-project-albums]");
if (mediaProjectAlbums) {
  const escapeMediaMarkup = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
  const mediaRouteSlugs = {
    "pebblebrooks-estate": "pebblebrooks-estate",
    ajoda: "living-waters-estate",
    guzape: "guzape-abuja",
    "project-beta": "palm-harbour-estate-phase-1",
  };
  const albumMarkup = Object.entries(projectStories)
    .sort(([, first], [, second]) => Number(first.number) - Number(second.number))
    .map(([slug, story]) => {
      const seenImages = new Set(story.image ? [story.image] : []);
      const projectImages = [
        ...(story.gallery || []),
        ...(story.sections || []).flatMap((section) => section.gallery || []),
      ].filter((item) => {
        if (!item?.image || seenImages.has(item.image)) return false;
        seenImages.add(item.image);
        return true;
      });
      if (!projectImages.length && story.image) {
        projectImages.push({
          image: story.image,
          alt: story.imageAlt || story.title,
          caption: story.visualNote || story.title,
        });
      }
      if (!projectImages.length) return "";
      const isPlanImage = (item) => item.type === "plan" || /\b(plan|layout)\b/i.test(`${item.caption || ""} ${item.alt || ""} ${item.image || ""}`);

      const count = projectImages.length;
      const previewImages = projectImages.slice(0, 3);
      const previewLayout = previewImages.length === 1
        ? "media-project-preview--one"
        : previewImages.length === 2 ? "media-project-preview--two" : "media-project-preview--three";
      const previewMarkup = previewImages.map((item, index) => `
        <figure class="media-project-placeholder-figure ${isPlanImage(item) ? "media-project-preview-item--plan" : ""}">
          <div class="media-project-placeholder-art" aria-hidden="true">
            <span class="media-project-placeholder-number">${String(index + 1).padStart(2, "0")}</span>
            <span class="media-project-placeholder-monogram">DR</span>
          </div>
          <figcaption><small>PROJECT VISUAL · COMING SOON</small><strong>${escapeMediaMarkup(item.caption || "Project view")}</strong><span>${String(index + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}</span></figcaption>
        </figure>
      `).join("");
      const galleryMarkup = `
        <div class="media-empty-state media-project-empty-state">
          <span class="media-empty-index">${escapeMediaMarkup(story.number)}</span>
          <div><h4>Project images coming soon.</h4><p>The photographs and plans for ${escapeMediaMarkup(story.title)} are being prepared. You can read the project story in the meantime.</p></div>
        </div>
      `;
      const projectTitle = escapeMediaMarkup(story.galleryTitle || story.title);
      const projectDescription = escapeMediaMarkup(story.deck || story.galleryNote || "Explore the images from this Dav-Ric project.");
      const projectLabel = escapeMediaMarkup(`${story.number} · ${story.category} · ${story.estateName || story.title} · ${story.location}`);
      const routeSlug = mediaRouteSlugs[slug] || slug;

      return `
        <details class="media-album media-album--project">
          <summary class="media-album-summary media-album-summary--project">
            <div class="media-project-preview ${previewLayout}" role="group" aria-label="${escapeMediaMarkup(`Preview of ${story.title} project images`)}">${previewMarkup}</div>
            <div class="media-album-copy"><p class="eyebrow">${projectLabel}</p><h4>${projectTitle}</h4><p>${projectDescription}</p><span class="media-album-action">Project images coming soon <span aria-hidden="true">↗</span></span></div>
          </summary>
          <div class="media-album-content">
            <div class="media-project-gallery media-project-gallery--empty">${galleryMarkup}</div>
            <a class="media-project-link" href="/projects/${escapeMediaMarkup(routeSlug)}">Read the ${escapeMediaMarkup(story.title)} project story <span aria-hidden="true">↗</span></a>
          </div>
        </details>
      `;
    })
    .join("");
  mediaProjectAlbums.innerHTML = albumMarkup;
}

document.querySelectorAll("[data-inquiry-form]").forEach((inquiryForm) => {
  const formNote = inquiryForm.querySelector(".form-note");
  const whatsappInquiryButton = inquiryForm.querySelector("[data-whatsapp-inquiry]");
  const interestSelect = inquiryForm.querySelector('[name="interest"]');
  const projectSlug = new URLSearchParams(window.location.search).get("project");
  const requestedStory = projectStories[projectSlug];
  const requestedPebblebrooksHomeType = {
    "pebblebrooks-two-bedroom": "Terrace home",
    "pebblebrooks-three-bedroom": "Semi-detached building",
  }[projectSlug];
  const requestedLivingWatersHomeType = {
    "living-waters-two-bedroom": "Two-bedroom home",
    "living-waters-three-bedroom": "Three-bedroom home",
  }[projectSlug];
  if (interestSelect && requestedStory) interestSelect.value = requestedStory.formValue;
  if (interestSelect && requestedPebblebrooksHomeType) interestSelect.value = "Pebblebrooks Estate";
  if (interestSelect && requestedLivingWatersHomeType) interestSelect.value = "Living Waters Estate";

  const getEnquiryMessage = () => {
    const formData = new FormData(inquiryForm);
    const details = String(formData.get("message") || "").trim();
    const lines = [
      "Hello Dav-Ric Homes, I’d like to make an enquiry.",
      "",
      `Name: ${formData.get("name")}`,
      `Email: ${formData.get("email")}`,
      `Phone: ${formData.get("phone") || "Not provided"}`,
      `Interested in: ${formData.get("interest")}`,
      `Looking to: ${formData.get("intent")}`,
    ];
    if (requestedPebblebrooksHomeType) lines.push(`Home type: ${requestedPebblebrooksHomeType}`);
    if (requestedLivingWatersHomeType) lines.push(`Home type: ${requestedLivingWatersHomeType}`);
    if (details) lines.push(`More details: ${details}`);
    return { formData, lines };
  };

  inquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const { formData, lines } = getEnquiryMessage();
    const subject = `Dav-Ric Homes enquiry — ${formData.get("interest")}`;
    const emailUrl = `mailto:kuteyi.vincent@davricgroup.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = emailUrl;
    if (formNote) formNote.textContent = "Your email app is ready with this enquiry addressed to kuteyi.vincent@davricgroup.com. Review it and tap Send.";
  });

  if (whatsappInquiryButton) {
    whatsappInquiryButton.addEventListener("click", () => {
      if (!inquiryForm.reportValidity()) return;
      const { lines } = getEnquiryMessage();
      const whatsappUrl = `https://wa.me/2349134000494?text=${encodeURIComponent(lines.join("\n"))}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      if (formNote) formNote.textContent = "A WhatsApp message is ready in a new tab. Review the details there and tap Send.";
    });
  }
});

const year = document.querySelector("#current-year");
if (year) year.textContent = String(new Date().getFullYear());

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll("[data-reveal]");
const countItems = document.querySelectorAll("[data-count-up]");

function formatCount(value, mode) {
  const rounded = Math.round(value);
  if (mode === "pad2") return String(rounded).padStart(2, "0");
  if (mode === "comma") return rounded.toLocaleString("en-NG");
  return String(rounded);
}

function setCountFinal(element) {
  const target = Number(element.dataset.countUp);
  if (Number.isFinite(target)) element.textContent = formatCount(target, element.dataset.countMode);
}

function animateCount(element) {
  const target = Number(element.dataset.countUp);
  if (!Number.isFinite(target)) return;

  const startedAt = performance.now();
  const duration = 1050;
  const tick = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatCount(target * eased, element.dataset.countMode);
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

document.querySelectorAll(".project-card[data-reveal], .approach-step[data-reveal], .feature-card[data-reveal]").forEach((item) => {
  const siblings = Array.from(item.parentElement.children).filter((element) => element.matches(".project-card, .approach-step, .feature-card"));
  const index = siblings.indexOf(item);
  item.style.setProperty("--reveal-delay", `${Math.min(index, 4) * 90}ms`);
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          if (entry.target.matches(".hero-copy")) entry.target.closest(".hero")?.classList.add("is-entered");
          if (entry.target.matches(".stat-row")) {
            entry.target.querySelectorAll("[data-count-up]").forEach(reducedMotion ? setCountFinal : animateCount);
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
  document.querySelector(".hero")?.classList.add("is-entered");
  countItems.forEach(setCountFinal);
}

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const heroScenes = Array.from(document.querySelectorAll("[data-hero-scene]"));
const heroVideo = document.querySelector("[data-hero-video]");
const heroSection = heroVideo?.closest(".hero");
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
let heroInView = false;
let activeHeroScene = Math.max(0, heroScenes.findIndex((scene) => scene.classList.contains("is-active")));
let heroSceneTimer;

if (finePointerQuery.matches && !reducedMotionQuery.matches) {
  projectCards.forEach((card) => {
    const image = card.querySelector(".project-image");
    card.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const bounds = card.getBoundingClientRect();
      const imageBounds = image?.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty("--project-tilt-x", `${(-y * 2.2).toFixed(2)}deg`);
      card.style.setProperty("--project-tilt-y", `${(x * 2.8).toFixed(2)}deg`);
      if (imageBounds && imageBounds.width && imageBounds.height) {
        image.style.setProperty("--shine-x", `${((event.clientX - imageBounds.left) / imageBounds.width * 100).toFixed(1)}%`);
        image.style.setProperty("--shine-y", `${((event.clientY - imageBounds.top) / imageBounds.height * 100).toFixed(1)}%`);
      }
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--project-tilt-x", "0deg");
      card.style.setProperty("--project-tilt-y", "0deg");
      image?.style.removeProperty("--shine-x");
      image?.style.removeProperty("--shine-y");
    });
  });
}

function syncHeroVideoPlayback() {
  if (!heroVideo) return;
  if (document.hidden || !heroInView) {
    heroVideo.pause();
    heroVideo.classList.remove("is-ready");
    return;
  }

  const playback = heroVideo.play();
  playback?.catch(() => heroVideo.classList.remove("is-ready"));
}

heroVideo?.addEventListener("playing", () => {
  heroVideo.classList.add("is-ready");
});
heroVideo?.addEventListener("error", () => {
  heroVideo.classList.remove("is-ready");
});

const heroVisibilityObserver = heroSection && "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        heroInView = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        if (heroInView) scheduleHeroScene();
        else stopHeroSceneTimer();
        syncHeroVideoPlayback();
      });
    }, { threshold: [0, 0.2, 0.5] })
  : null;

if (heroSection && heroVisibilityObserver) {
  heroVisibilityObserver.observe(heroSection);
} else if (heroSection) {
  heroInView = true;
}
syncHeroVideoPlayback();

function setHeroScene(index) {
  heroScenes[activeHeroScene]?.classList.remove("is-active");
  activeHeroScene = index;
  heroScenes[activeHeroScene]?.classList.add("is-active");
}

function stopHeroSceneTimer() {
  window.clearTimeout(heroSceneTimer);
  heroSceneTimer = undefined;
}

function scheduleHeroScene() {
  stopHeroSceneTimer();
  if (heroScenes.length < 2 || reducedMotionQuery.matches || document.hidden || !heroInView) return;
  heroSceneTimer = window.setTimeout(() => {
    setHeroScene((activeHeroScene + 1) % heroScenes.length);
    scheduleHeroScene();
  }, 8200);
}

if (!reducedMotion) scheduleHeroScene();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopHeroSceneTimer();
  else scheduleHeroScene();
  syncHeroVideoPlayback();
});

reducedMotionQuery.addEventListener?.("change", (event) => {
  stopHeroSceneTimer();
  if (event.matches) setHeroScene(0);
  else scheduleHeroScene();
  syncHeroVideoPlayback();
});

const storyPage = document.querySelector("[data-project-story]");
if (storyPage) {
  const projectRouteSlugs = {
    "pebblebrooks-estate": "pebblebrooks-estate",
    ajoda: "living-waters-estate",
    guzape: "guzape-abuja",
    "project-beta": "palm-harbour-estate-phase-1",
  };
  const storyRouteSlug = window.location.pathname.match(/^\/projects\/([^/]+)\/?$/)?.[1];
  const homeTypeFromRoute = pebblebrooksHomeRoutes[storyRouteSlug];
  const livingWatersHomeTypeFromRoute = livingWatersHomeRoutes[storyRouteSlug];
  const storySlug = storyRouteSlug
    ? homeTypeFromRoute
      ? "pebblebrooks-estate"
      : livingWatersHomeTypeFromRoute
        ? "ajoda"
        : Object.entries(projectRouteSlugs).find(([, routeSlug]) => routeSlug === storyRouteSlug)?.[0]
    : new URLSearchParams(window.location.search).get("story");
  const requestedHomeType = homeTypeFromRoute || livingWatersHomeTypeFromRoute || new URLSearchParams(window.location.search).get("home");
  const selectedPebblebrooksHomeType = storySlug === "pebblebrooks-estate"
    ? pebblebrooksHomeTypes[requestedHomeType]
    : null;
  const selectedLivingWatersHomeType = storySlug === "ajoda"
    ? livingWatersHomeTypes[requestedHomeType]
    : null;
  const selectedHomeType = selectedPebblebrooksHomeType || selectedLivingWatersHomeType;
  const baseStory = projectStories[storySlug];
  const selectedHomeSection = selectedPebblebrooksHomeType
    ? baseStory?.sections.find((section) => section.label === selectedPebblebrooksHomeType.sectionLabel)
    : null;
  const story = selectedPebblebrooksHomeType && selectedHomeSection
    ? {
      ...baseStory,
      ...selectedPebblebrooksHomeType,
      seoTitle: selectedPebblebrooksHomeType.pageTitle,
      seoDescription: selectedPebblebrooksHomeType.pageDescription,
      image: baseStory.image,
      imageAlt: baseStory.imageAlt,
      keyFeatures: requestedHomeType === "semi-detached"
        ? [...baseStory.keyFeatures, { title: "Dedicated cinema" }]
        : baseStory.keyFeatures,
      visualNote: `${selectedPebblebrooksHomeType.title} · Pebblebrooks Estate, Jericho, Ibadan`,
      category: `${baseStory.category} · ${selectedPebblebrooksHomeType.title}`,
      galleryLabel: "Pebblebrooks Estate · Jericho, Ibadan",
      galleryLayout: selectedHomeSection.gallery.length === 3 ? "three-up" : selectedHomeSection.galleryLayout,
      galleryNote: "Plan drawings supplied for the Pebblebrooks Estate home type. Confirm final specifications with Dav-Ric Homes.",
      gallery: selectedHomeSection.gallery.map((item) => ({ ...item, type: "plan" })),
      sections: baseStory.sections
        .filter((section) => !["Terrace homes", "Semi-detached homes"].includes(section.label)
          || section.label === selectedPebblebrooksHomeType.sectionLabel)
        .map((section) => section.label === selectedPebblebrooksHomeType.sectionLabel
          ? { ...section, label: selectedPebblebrooksHomeType.title, gallery: [] }
          : section),
      pairedSections: [5, 6],
    }
    : selectedLivingWatersHomeType
      ? {
        ...baseStory,
        ...selectedLivingWatersHomeType,
        category: `${baseStory.category} · ${selectedLivingWatersHomeType.title}`,
        pairedSections: [],
      }
    : storySlug === "pebblebrooks-estate"
      ? {
        ...baseStory,
        sections: baseStory.sections.filter((section) => !["Terrace homes", "Semi-detached homes"].includes(section.label)),
        pairedSections: [4, 5],
      }
      : baseStory;
  const title = storyPage.querySelector("[data-story-title]");
  const heading = storyPage.querySelector(".project-story-heading");
  const meta = storyPage.querySelector("[data-story-meta]");
  const deck = storyPage.querySelector("[data-story-deck]");
  const image = storyPage.querySelector("[data-story-image]");
  const visual = storyPage.querySelector("[data-story-visual]");
  const visualNote = storyPage.querySelector("[data-story-visual-note]");
  const facts = storyPage.querySelector("[data-story-facts]");
  const keyFeatures = storyPage.querySelector("[data-story-key-features]");
  const price = storyPage.querySelector("[data-story-price]");
  const priceLabel = storyPage.querySelector("[data-story-price-label]");
  const priceBox = storyPage.querySelector("[data-story-price-box]");
  const body = storyPage.querySelector("[data-story-body]");
  const enquiryLink = storyPage.querySelector("[data-story-enquiry]");
  const chapterNav = storyPage.querySelector("[data-story-chapters]");
  const readingTime = storyPage.querySelector("[data-story-reading-time]");
  const relatedGrid = storyPage.querySelector("[data-story-related]");
  const pebblebrooksListings = storyPage.querySelector("[data-pebblebrooks-listings]");
  const livingWatersListings = storyPage.querySelector("[data-living-waters-listings]");

  if (story) {
    const isPebblebrooksHomeType = storySlug === "pebblebrooks-estate" && Boolean(selectedPebblebrooksHomeType);
    const isLivingWatersHomeType = storySlug === "ajoda" && Boolean(selectedLivingWatersHomeType);
    storyPage.classList.toggle("project-story-page--pebblebrooks-home", isPebblebrooksHomeType);
    storyPage.classList.toggle("project-story-page--living-waters-home", isLivingWatersHomeType);
    if (pebblebrooksListings) pebblebrooksListings.hidden = isPebblebrooksHomeType;
    if (livingWatersListings) livingWatersListings.hidden = isLivingWatersHomeType;
    const pageTitle = story.seoTitle || `${story.title} in ${story.location} | Dav-Ric Homes`;
    const pageDescription = story.seoDescription || story.deck;
    const routeSlug = projectRouteSlugs[storySlug] || storySlug;
    const homeTypeRouteSlug = Object.entries(pebblebrooksHomeRoutes).find(([, homeType]) => homeType === requestedHomeType)?.[0];
    const livingWatersHomeRouteSlug = Object.entries(livingWatersHomeRoutes).find(([, homeType]) => homeType === requestedHomeType)?.[0];
    const canonicalSlug = selectedHomeType ? homeTypeRouteSlug || livingWatersHomeRouteSlug || routeSlug : routeSlug;
    const pageUrl = `https://davrichomes.com/projects/${encodeURIComponent(canonicalSlug)}`;
    const imagePath = story.image || (storySlug === "guzape" ? "assets/davric-mark.png" : "assets/pebblebrooks-render.webp");
    const imageUrl = new URL(imagePath, `${window.location.origin}/`).href;
    document.title = pageTitle;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.content = pageDescription;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.append(canonicalLink);
    }
    canonicalLink.href = pageUrl;
    const updateMeta = (selector, content) => {
      const element = document.querySelector(selector);
      if (element) element.content = content;
    };
    updateMeta('meta[property="og:title"]', pageTitle);
    updateMeta('meta[property="og:description"]', pageDescription);
    updateMeta('meta[property="og:url"]', pageUrl);
    updateMeta('meta[property="og:image"]', imageUrl);
    updateMeta('meta[property="og:image:alt"]', story.imageAlt || story.title);
    updateMeta('meta[name="twitter:title"]', pageTitle);
    updateMeta('meta[name="twitter:description"]', pageDescription);
    updateMeta('meta[name="twitter:image"]', imageUrl);
    let projectStructuredData = document.getElementById("project-structured-data");
    if (!projectStructuredData) {
      projectStructuredData = document.createElement("script");
      projectStructuredData.id = "project-structured-data";
      projectStructuredData.type = "application/ld+json";
    }
    projectStructuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      name: pageTitle,
      description: pageDescription,
      url: pageUrl,
      primaryImageOfPage: { "@type": "ImageObject", url: imageUrl },
      isPartOf: { "@type": "WebSite", name: "Dav-Ric Homes", url: "https://davrichomes.com/" },
      publisher: { "@type": "Organization", name: "Dav-Ric Homes", url: "https://davrichomes.com/" },
      inLanguage: "en",
    });
    if (!projectStructuredData.isConnected) document.head.append(projectStructuredData);
    if (title) {
      if (storySlug === "pebblebrooks-estate" && !selectedHomeType) {
        title.innerHTML = "<span>Pebble</span><span>Brooks</span>";
      } else if (storySlug === "ajoda" && !selectedLivingWatersHomeType) {
        title.innerHTML = "<span>Living</span><span>Waters</span>";
      } else {
        title.textContent = story.title;
      }
    }
    if (title && priceBox && heading && !storyPage.classList.contains("project-story-page--pebblebrooks-home") && storySlug !== "pebblebrooks-estate" && storySlug !== "ajoda") title.insertAdjacentElement("afterend", priceBox);
    if (meta) meta.textContent = story.number + " / " + String(Object.keys(projectStories).length).padStart(2, "0") + " · " + story.category;
    if (deck) deck.textContent = story.deck;
    if (visualNote) {
      visualNote.textContent = story.visualNote;
      if (storySlug === "ajoda") visualNote.hidden = !selectedLivingWatersHomeType;
    }
    if (price) price.textContent = story.price || "On request";
    if (priceLabel) priceLabel.textContent = story.price === "SOLD" ? "Availability" : "Price";
    if (priceBox) priceBox.classList.toggle("is-sold", story.price === "SOLD");
    if (enquiryLink) enquiryLink.href = `/contact?project=${encodeURIComponent(selectedHomeType?.contactSlug || storySlug)}`;

    if (visual && story.video && story.image) {
      const hero = storyPage.querySelector(".project-story-hero");
      hero?.classList.add("project-story-hero--cinematic");
      visual.classList.add("project-story-visual--film");

      const heroVideo = document.createElement("video");
      heroVideo.className = "project-story-video";
      heroVideo.src = story.video;
      heroVideo.poster = story.image;
      heroVideo.setAttribute("aria-label", story.videoAlt || `${story.title} construction film`);
      heroVideo.setAttribute("autoplay", "");
      heroVideo.setAttribute("muted", "");
      heroVideo.setAttribute("playsinline", "");
      heroVideo.setAttribute("preload", "auto");
      heroVideo.autoplay = true;
      heroVideo.muted = true;
      heroVideo.defaultMuted = true;
      heroVideo.playsInline = true;
      heroVideo.preload = "auto";

      const completedImage = document.createElement("img");
      completedImage.className = "project-story-film-endcard";
      completedImage.src = story.image;
      completedImage.alt = story.imageAlt || `${story.title}, completed`;
      completedImage.fetchPriority = "high";

      const filmStamp = document.createElement("span");
      filmStamp.className = "project-story-film-stamp";
      filmStamp.innerHTML = '<i aria-hidden="true"></i><span>DAV-RIC</span>';
      visual.replaceChildren(heroVideo, completedImage, filmStamp);

      const showCompletedBuilding = () => {
        visual.classList.add("is-film-finished");
      };

      heroVideo.addEventListener("ended", showCompletedBuilding, { once: true });
      heroVideo.addEventListener("error", showCompletedBuilding, { once: true });
      const playback = heroVideo.play();
      playback?.catch(showCompletedBuilding);
    } else if (visual && story.image) {
      visual.classList.toggle("project-story-visual-plan", story.imageFit === "contain");
      const storyImage = document.createElement("img");
      storyImage.src = story.image;
      storyImage.alt = story.imageAlt;
      storyImage.fetchPriority = "high";
      visual.replaceChildren(storyImage);
    } else if (visual && story.artClass) {
      const artwork = document.createElement("div");
      artwork.className = `story-editorial ${story.artClass}`;
      artwork.setAttribute("aria-hidden", "true");
      artwork.innerHTML = `<span>${story.shortTitle || story.title}</span><i></i><b>${story.number}</b>`;
      visual.replaceChildren(artwork);
    }

    if (facts) {
      facts.innerHTML = story.facts.map(([label, value]) => `<div class="story-fact"><dt>${label}</dt><dd>${value}</dd></div>`).join("");
    }

    if (keyFeatures && story.keyFeatures?.length) {
      const featureIcon = (title) => {
        const label = String(title || "").toLowerCase();
        let shape = '<path d="M8 43V14a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v29M8 18h32M14 18v25m9-25v25m9-25v25m8-25v25M5 43h38" />';

        if (/road|drainage|pav|street|access|parking/.test(label)) {
          shape = '<path d="M7 44 18 4m23 40L30 4" /><path d="M24 8v5m0 8v6m0 8v5" />';
        } else if (/gas|power|water|utility|electric/.test(label)) {
          shape = '<path d="m27 4-16 23h12l-2 17 16-24H25l2-16Z" />';
        } else if (/amenit|golf|leisure|resident|gym|pool|play|lifestyle|badminton|cinema|court|sport|terrace|sit.?out/.test(label)) {
          shape = '<circle cx="18" cy="10" r="4" /><path d="m17 15-4 11 8 5 7 12m-15-17-8 9m8-9 10-4m-2 0 8-7m-6 11 8 8M5 43h38" />';
        } else if (/location|address|proximity|near|residence|police|jericho|ibadan|abuja|landmark/.test(label)) {
          shape = '<path d="M24 43s14-12.4 14-24a14 14 0 1 0-28 0c0 11.6 14 24 14 24Z" /><circle cx="24" cy="19" r="4.5" />';
        } else if (/home|house|bedroom|terrace|bungalow|residential|floor|suite|kitchen|window|bath|balcony/.test(label)) {
          shape = '<path d="m5 22 19-16 19 16M11 20v22h26V20M20 42V28h8v14M14 26h3m14 0h3" />';
        } else if (/finish|design|facade|concept|plan/.test(label)) {
          shape = '<path d="m8 36 22-28 10 8-22 28H8v-8Z" /><path d="m25 14 10 8M8 36l10 8M6 44h36" />';
        } else if (/completed|stage|phase|project|development/.test(label)) {
          shape = '<path d="M8 43V10h32v33M4 43h40M14 17h5m10 0h5M14 25h5m10 0h5M14 33h5m10 0h5" /><path d="M21 43V8a3 3 0 0 1 6 0v35" />';
        } else if (/building|commercial|headquarters|estate services|office/.test(label)) {
          shape = '<path d="M8 43V10h32v33M4 43h40M14 17h5m10 0h5M14 25h5m10 0h5M14 33h5m10 0h5" />';
        } else if (/security|gate|controlled|cctv/.test(label)) {
          shape = '<path d="M8 43V14a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v29M8 18h32M14 18v25m9-25v25m9-25v25m8-25v25M5 43h38" />';
        }

        return `<svg class="story-key-feature-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shape}</svg>`;
      };
      keyFeatures.hidden = false;
      keyFeatures.innerHTML = [
        '<div class="story-key-features-heading">',
        '<p class="eyebrow eyebrow-dark">Project specification</p>',
        `<h2 id="story-key-features-title">${story.keyFeaturesLead || "Key features"}</h2>`,
        '</div>',
        '<div class="story-key-features-grid">',
        story.keyFeatures.map((feature) => `<article class="story-key-feature${feature.priority ? " story-key-feature--priority" : ""}" data-reveal="zoom">${featureIcon(feature.title)}<h3>${feature.title}</h3></article>`).join(""),
        '</div>',
      ].join("");

      const featureCards = keyFeatures.querySelectorAll(".story-key-feature[data-reveal]");
      if ("IntersectionObserver" in window && !reducedMotion) {
        const featureObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
        featureCards.forEach((card, index) => {
          card.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 75}ms`);
          featureObserver.observe(card);
        });
      } else {
        featureCards.forEach((card) => card.classList.add("is-visible"));
      }
    }

    if (body) {
      const seenStoryImages = new Set(
        ["living-waters-gallery", "living-waters-home-gallery"].includes(story.galleryLayout) || !story.image ? [] : [story.image],
      );
      const uniqueStoryImages = (items = []) => items.filter((item) => {
        if (!item?.image || seenStoryImages.has(item.image)) return false;
        seenStoryImages.add(item.image);
        return true;
      });
      const storyGallery = uniqueStoryImages(story.gallery || []);
      const galleryByline = `${story.estateName || story.title} · ${story.location}`;
      const galleryMarkup = story.galleryTitle
        ? `
          <section class="palm-gallery-section palm-gallery-section--${story.galleryLayout || "palm-harbour"}" data-story-reveal aria-label="${story.galleryTitle}">
            <div class="palm-gallery-heading">
              <div><p class="eyebrow eyebrow-dark">${story.galleryLabel}</p><h2>${story.galleryTitle}</h2></div>
              <span class="palm-gallery-total"><span>${String(storyGallery.length).padStart(2, "0")}</span> curated views</span>
            </div>
            <div class="story-image-gallery story-image-gallery--${story.galleryLayout || "palm-harbour"}">
              ${storyGallery.map((item, index) => `
                <figure class="palm-gallery-tile palm-gallery-tile--${index + 1}${item.size === "wide" ? " palm-gallery-tile--wide" : ""}${item.type === "plan" ? " palm-gallery-tile--plan" : ""}">
                  <button class="palm-gallery-open" type="button" data-gallery-open data-gallery-index="${index}" data-gallery-src="${item.image}" data-gallery-alt="${item.alt}" data-gallery-caption="${item.caption}" aria-label="View ${item.caption}">
                    <img src="${item.image}" alt="${item.alt}" loading="lazy" decoding="async" />
                    <span class="palm-gallery-counter"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 9.5 3h5L16 5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3Z"/><circle cx="12" cy="12" r="3.5"/></svg>${String(storyGallery.length).padStart(2, "0")} <i>views</i></span>
                    <span class="palm-gallery-caption"><span class="palm-gallery-brand"><strong>DAV-RIC</strong><small>HOMES</small></span><span><strong>${item.caption}</strong><small>${galleryByline}</small></span><span class="palm-gallery-arrow" aria-hidden="true"><svg class="ui-arrow ui-arrow--up-right" viewBox="0 0 24 24" focusable="false"><path d="M7 17 17 7M7 7h10v10" /></svg></span></span>
                  </button>
                </figure>
              `).join("")}
            </div>
            <p class="palm-gallery-note">${story.galleryNote || "Design imagery shown is illustrative. Final specifications are subject to confirmation."}</p>
          </section>
        `
        : storyGallery.map((item) => `
          <figure class="story-image-spread" data-story-reveal>
            <div class="story-image-frame"><img src="${item.image}" alt="${item.alt}" loading="lazy" /></div>
            <figcaption><span>${item.caption}</span><span>${item.note}</span></figcaption>
          </figure>
        `).join("");

      if (galleryMarkup) {
        const openingGallery = document.createElement("div");
        openingGallery.className = "project-story-gallery-top shell";
        if (!story.galleryTitle) {
          openingGallery.setAttribute("role", "region");
          openingGallery.setAttribute("aria-label", "Project image gallery");
        }
        openingGallery.innerHTML = galleryMarkup;
        const galleryAnchor = storySlug === "pebblebrooks-estate" && !selectedHomeType
          ? pebblebrooksListings
          : storyPage.querySelector(".project-story-hero");
        galleryAnchor?.insertAdjacentElement("afterend", openingGallery);
      }

      const pairedSections = new Set(story.pairedSections || []);
      body.classList.toggle("has-paired-sections", pairedSections.size > 0);
      body.innerHTML = story.sections.map((section, index) => `
        <section class="story-section${pairedSections.has(index + 1) ? " story-section--paired" : ""}" id="story-chapter-${index + 1}" data-story-section data-story-reveal>
          <p class="story-chapter-index"><span>${String(index + 1).padStart(2, "0")}</span><span>${section.label}</span></p>
          <div class="story-section-copy">
            <h2>${section.heading}</h2>
            ${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
          </div>
        </section>
      `).join("");

      story.sections.forEach((section, index) => {
        const sectionGallery = uniqueStoryImages(section.gallery || []);
        if (!sectionGallery.length) return;
        const gallery = document.createElement("div");
        gallery.className = "story-image-gallery story-image-gallery--" + (section.galleryLayout || "single");
        gallery.dataset.storyReveal = "";
        gallery.setAttribute("role", "group");
        gallery.setAttribute("aria-label", section.heading + " image gallery");

        sectionGallery.forEach((item, itemIndex) => {
          const figure = document.createElement("figure");
          figure.className = "story-image-spread";
          figure.dataset.storyReveal = "";

          const frame = document.createElement("div");
          frame.className = "story-image-frame";
          const openButton = document.createElement("button");
          openButton.type = "button";
          openButton.className = "story-gallery-open";
          openButton.dataset.galleryOpen = "";
          openButton.dataset.galleryIndex = String(itemIndex);
          openButton.dataset.gallerySrc = item.image;
          openButton.dataset.galleryAlt = item.alt;
          openButton.dataset.galleryCaption = item.caption;
          openButton.setAttribute("aria-label", "View " + item.caption);
          const image = document.createElement("img");
          image.src = item.image;
          image.alt = item.alt;
          image.loading = "lazy";
          image.decoding = "async";
          openButton.append(image);
          frame.append(openButton);

          const caption = document.createElement("figcaption");
          const captionTitle = document.createElement("span");
          captionTitle.textContent = item.caption;
          const captionNote = document.createElement("span");
          captionNote.textContent = item.note;
          caption.append(captionTitle, captionNote);
          figure.append(frame, caption);
          gallery.append(figure);
        });

        body.querySelector("#story-chapter-" + (index + 1))?.after(gallery);
      });

      const propertyLightbox = document.querySelector("[data-property-lightbox]");
      const galleryImage = propertyLightbox?.querySelector("[data-gallery-image]");
      const galleryCaption = propertyLightbox?.querySelector("[data-gallery-caption]");
      const galleryCounter = propertyLightbox?.querySelector("[data-gallery-counter]");
      const galleryButtons = [...body.querySelectorAll("[data-gallery-open]")];
      if (propertyLightbox && galleryImage && galleryCaption && galleryCounter && galleryButtons.length) {
        let currentGallery = [];
        let currentGalleryIndex = 0;
        const showGalleryImage = () => {
          const button = currentGallery[currentGalleryIndex];
          if (!button) return;
          galleryImage.src = button.dataset.gallerySrc;
          galleryImage.alt = button.dataset.galleryAlt || "";
          galleryCaption.textContent = button.dataset.galleryCaption || "";
          galleryCounter.textContent = `${String(currentGalleryIndex + 1).padStart(2, "0")} / ${String(currentGallery.length).padStart(2, "0")}`;
        };
        const moveGallery = (step) => {
          if (!currentGallery.length) return;
          currentGalleryIndex = (currentGalleryIndex + step + currentGallery.length) % currentGallery.length;
          showGalleryImage();
        };

        body.addEventListener("click", (event) => {
          const button = event.target.closest("[data-gallery-open]");
          if (!button) return;
          const gallery = button.closest(".story-image-gallery");
          const seenGallerySources = new Set();
          currentGallery = [...(gallery?.querySelectorAll("[data-gallery-open]") || [])].filter((item) => {
            const source = item.dataset.gallerySrc;
            if (!source || seenGallerySources.has(source)) return false;
            seenGallerySources.add(source);
            return true;
          });
          currentGalleryIndex = Math.max(0, currentGallery.indexOf(button));
          showGalleryImage();
          propertyLightbox.showModal();
        });
        propertyLightbox.querySelector("[data-gallery-close]")?.addEventListener("click", () => propertyLightbox.close());
        propertyLightbox.querySelector("[data-gallery-previous]")?.addEventListener("click", () => moveGallery(-1));
        propertyLightbox.querySelector("[data-gallery-next]")?.addEventListener("click", () => moveGallery(1));
        propertyLightbox.addEventListener("click", (event) => {
          if (event.target === propertyLightbox) propertyLightbox.close();
        });
        propertyLightbox.addEventListener("keydown", (event) => {
          if (event.key === "ArrowRight") moveGallery(1);
          if (event.key === "ArrowLeft") moveGallery(-1);
        });
      }

      const storyWords = [story.deck, ...story.sections.flatMap((section) => [section.heading, ...section.paragraphs]), ...(story.keyFeatures || []).map((feature) => feature.title)].join(" ").trim().split(/\s+/).filter(Boolean).length;
      if (readingTime) readingTime.textContent = `${Math.max(1, Math.ceil(storyWords / 220))} min read`;
      if (chapterNav) {
        chapterNav.innerHTML = `<span class="story-chapter-nav-label">In this story</span>${story.sections.map((section, index) => `<a href="#story-chapter-${index + 1}" data-story-chapter-link="${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span>${section.label}</a>`).join("")}`;
      }

      const storyReveals = storyPage.querySelectorAll("[data-story-reveal]");
      const chapterSections = body.querySelectorAll("[data-story-section]");
      const chapterLinks = chapterNav?.querySelectorAll("[data-story-chapter-link]") || [];
      const setActiveChapter = (index) => {
        chapterLinks.forEach((link) => {
          const active = Number(link.dataset.storyChapterLink) === index;
          link.classList.toggle("is-current", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      };

      if ("IntersectionObserver" in window && !reducedMotion) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
        storyReveals.forEach((item) => revealObserver.observe(item));

        const chapterObserver = new IntersectionObserver((entries) => {
          const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActiveChapter(Number(visible[0].target.dataset.storySection));
        }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });
        chapterSections.forEach((section, index) => {
          section.dataset.storySection = String(index + 1);
          chapterObserver.observe(section);
        });
      } else {
        storyReveals.forEach((item) => item.classList.add("is-visible"));
        setActiveChapter(1);
      }
    }

    if (relatedGrid) {
      relatedGrid.innerHTML = Object.entries(projectStories)
        .filter(([slug]) => slug !== storySlug)
        .map(([slug, related]) => {
          const preview = related.image
            ? `<img src="${related.image}" alt="" loading="lazy" />`
            : `<div class="story-editorial story-related-art ${related.artClass}" aria-hidden="true"><span>${related.shortTitle || related.title}</span><i></i><b>${related.number}</b></div>`;
          return `
            <a class="story-related-card" href="/projects/${encodeURIComponent(projectRouteSlugs[slug] || slug)}" aria-label="Read the ${related.title} project story">
              <div class="story-related-media">${preview}<span class="story-related-arrow" aria-hidden="true"><svg class="ui-arrow ui-arrow--up-right" viewBox="0 0 24 24" focusable="false"><path d="M7 17 17 7M7 7h10v10" /></svg></span></div>
              <div class="story-related-copy"><p>${related.category}</p><h3>${related.estateName || related.title}</h3><span>${related.location}</span></div>
            </a>
          `;
        }).join("");
    }
  } else if (title) {
    document.title = "Project stories — Dav-Ric Homes";
    title.textContent = Object.keys(projectStories).length + " projects. Two cities.";
    if (deck) deck.textContent = "Choose a Dav-Ric Homes development to explore its place, design and current published details.";
    if (body) body.innerHTML = '<p>Visit the <a href="/developments">developments page</a> to choose a project story.</p>';
  }
}

const mediaAlbumList = document.querySelector(".media-album-list");
const mediaAlbumLightbox = document.querySelector("[data-media-album-lightbox]");
if (mediaAlbumList && mediaAlbumLightbox) {
  const mediaLightboxImage = mediaAlbumLightbox.querySelector("[data-media-gallery-image]");
  const mediaLightboxCaption = mediaAlbumLightbox.querySelector("[data-media-gallery-caption]");
  const mediaLightboxCounter = mediaAlbumLightbox.querySelector("[data-media-gallery-counter]");
  const mediaAlbumImages = [...mediaAlbumList.querySelectorAll(".media-album-content .media-image-grid--editorial img")];
  let activeMediaAlbumImages = [];
  let activeMediaAlbumIndex = 0;

  const mediaAlbumImageCaption = (image) => image.closest("figure")?.querySelector("figcaption strong")?.textContent.trim() || image.alt || "Estate photo";
  const showMediaAlbumImage = () => {
    const image = activeMediaAlbumImages[activeMediaAlbumIndex];
    if (!image || !mediaLightboxImage || !mediaLightboxCaption || !mediaLightboxCounter) return;
    mediaLightboxImage.src = image.currentSrc || image.src;
    mediaLightboxImage.alt = image.alt || "";
    mediaLightboxCaption.textContent = mediaAlbumImageCaption(image);
    mediaLightboxCounter.textContent = `${String(activeMediaAlbumIndex + 1).padStart(2, "0")} / ${String(activeMediaAlbumImages.length).padStart(2, "0")}`;
  };
  const moveMediaAlbumImage = (step) => {
    if (!activeMediaAlbumImages.length) return;
    activeMediaAlbumIndex = (activeMediaAlbumIndex + step + activeMediaAlbumImages.length) % activeMediaAlbumImages.length;
    showMediaAlbumImage();
  };
  const openMediaAlbumImage = (image) => {
    const album = image.closest(".media-album");
    activeMediaAlbumImages = [...(album?.querySelectorAll(".media-album-content .media-image-grid--editorial img") || [])];
    activeMediaAlbumIndex = Math.max(0, activeMediaAlbumImages.indexOf(image));
    showMediaAlbumImage();
    mediaAlbumLightbox.showModal();
  };

  mediaAlbumImages.forEach((image) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `View ${mediaAlbumImageCaption(image)}`);
  });
  mediaAlbumList.addEventListener("click", (event) => {
    const image = event.target instanceof Element ? event.target.closest(".media-album-content .media-image-grid--editorial img") : null;
    if (image) openMediaAlbumImage(image);
  });
  mediaAlbumList.addEventListener("keydown", (event) => {
    const image = event.target instanceof Element ? event.target.closest(".media-album-content .media-image-grid--editorial img") : null;
    if (!image || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openMediaAlbumImage(image);
  });

  mediaAlbumLightbox.querySelector("[data-media-gallery-close]")?.addEventListener("click", () => mediaAlbumLightbox.close());
  mediaAlbumLightbox.querySelector("[data-media-gallery-previous]")?.addEventListener("click", () => moveMediaAlbumImage(-1));
  mediaAlbumLightbox.querySelector("[data-media-gallery-next]")?.addEventListener("click", () => moveMediaAlbumImage(1));
  mediaAlbumLightbox.addEventListener("click", (event) => {
    if (event.target === mediaAlbumLightbox) mediaAlbumLightbox.close();
  });
  mediaAlbumLightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") moveMediaAlbumImage(1);
    if (event.key === "ArrowLeft") moveMediaAlbumImage(-1);
  });
}
