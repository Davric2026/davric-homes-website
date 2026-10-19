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

const filterButtons = document.querySelectorAll(".filter-button");
const projectCards = document.querySelectorAll(".project-card[data-city]");
const projectCount = document.querySelector(".project-count");
const projectGrid = document.querySelector("#project-grid");
const projectScrollPrompt = document.querySelector("[data-project-scroll-prompt]");
const projectScrollTrack = document.querySelector("[data-project-scroll-track]");
const projectScrollCopy = document.querySelector("[data-project-scroll-copy]");
const projectScrollIndex = document.querySelector("[data-project-scroll-index]");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    let visible = 0;

    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    projectCards.forEach((card) => {
      const show = filter === "all" || card.dataset.city === filter;
      card.hidden = !show;
      if (show) visible += 1;
    });

    projectGrid?.scrollTo({ left: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    window.requestAnimationFrame(syncProjectScrollButtons);

    if (projectCount) {
      const place = filter === "all" ? "" : ` in ${filter[0].toUpperCase() + filter.slice(1)}`;
      const noun = visible === 1 ? "property development" : "property developments";
      projectCount.textContent = `Showing ${visible} ${noun}${place}`;
    }
  });
});

const projectStories = {
  "pebblebrooks-estate": {
    title: "Pebblebrooks Estate", number: "01", category: "Residential · Ibadan", location: "Jericho, Ibadan", area: "Approx. 3,218 sqm",
    image: "assets/pebblebrooks-render.webp", imageAlt: "Architectural concept rendering of the Pebblebrooks Estate homes", visualNote: "Artist’s impression · design visualisation",
    deck: "13 gated homes in Jericho, with a central gas system, estate security and a location close to the Police Commissioner’s Residence.",
    price: "On request", formValue: "Pebblebrooks Estate",
    facts: [["Homes", "13"], ["Home types", "7 terraces · 6 semi-detached"], ["Semi-detached homes", "6 with one-bedroom basement suites"], ["Site area", "Approx. 3,218 sqm"]],
    keyFeaturesLead: "13 homes, secured for everyday living.",
    keyFeaturesIntro: "Central gas, estate security and a close Jericho landmark lead the offer.",
    keyFeatures: [
      { title: "Central gas system", detail: "A central gas system serves the estate, making convenient everyday cooking a defining part of the Pebblebrooks offer.", priority: true },
      { title: "Gated estate security", detail: "The estate plans include controlled access, security and CCTV, with dedicated gatehouse and security office spaces.", priority: true },
      { title: "Close to the Police Commissioner’s Residence", detail: "Pebblebrooks is in Jericho, close to the Police Commissioner’s Residence, a notable nearby landmark.", priority: true },
      { title: "13 homes", detail: "Seven four-bedroom terrace homes and six four-bedroom semi-detached homes are arranged around the shared estate grounds." },
      { title: "Basement suites", detail: "Each semi-detached home includes a one-bedroom basement apartment. The typical basement plan is 59 sqm." },
      { title: "Three-level terrace plans", detail: "The typical terrace plan gives 83.5 sqm to the ground floor and 98 sqm each to the first and second floors." },
      { title: "Resident amenities", detail: "The plans show a landscaped central mall, badminton court, swimming pool, green and play area, gym and outdoor terrace." },
      { title: "Estate services", detail: "The gatehouse plans identify generator space, a general office and facility manager spaces alongside estate security services." },
      { title: "Design and finish", detail: "The brochure describes open plans, large energy-efficient windows, premium flooring and cabinetry, designer kitchen appliances and spa-style bathrooms." },
    ],
    galleryAfter: 1, galleryTitle: "Estate and exterior gallery", galleryLabel: "Architectural visualisations · Jericho, Ibadan", galleryLayout: "pebblebrooks-gallery",
    galleryNote: "Architectural visualisations are illustrative; home layouts, materials and final specifications are subject to confirmation.",
    gallery: [
      { image: "assets/pebblebrooks-render.webp", alt: "Aerial architectural visualisation of the Pebblebrooks Estate homes and shared courtyard", caption: "The estate", size: "wide" },
      { image: "assets/pebblebrooks/gallery/pebblebrooks-home-01.webp", alt: "Aerial architectural visualisation of modern homes arranged around a shared residential courtyard", caption: "Homes around the courtyard", size: "wide" },
      { image: "assets/pebblebrooks/gallery/pebblebrooks-home-04.webp", alt: "Architectural visualisation of a landscaped shared courtyard between modern residences", caption: "The shared courtyard", size: "wide" },
      { image: "assets/pebblebrooks/gallery/pebblebrooks-home-05.webp", alt: "Aerial architectural visualisation of a residential community with homes facing a central court", caption: "The residential community", size: "wide" },
    ],
    sections: [
      { label: "The setting", heading: "A complete estate plan for Jericho.", paragraphs: [
        "Pebblebrooks is planned across approximately 3,218 square metres in Jericho, Ibadan. Its site layout places seven terrace homes and six semi-detached homes around internal access ways and a central landscaped court.",
        "The same plan marks parking, an ancillary building, a gatehouse and a badminton court. It gives a clear overview of how homes, circulation and shared spaces fit together.",
      ], galleryLayout: "plans-landscape-single", gallery: [
        { image: "assets/pebblebrooks/plans/pebblebrooks-site-layout.webp", alt: "Pebblebrooks Estate site layout showing seven terraces, six semi-detached homes, parking, badminton court, ancillary building and gatehouse", caption: "Estate site layout", note: "13 homes · Jericho, Ibadan" },
      ] },
      { label: "Terrace homes", heading: "Seven four-bedroom homes, planned across three levels.", paragraphs: [
        "The typical terrace home has an 83.5 sqm ground floor, a 98 sqm first floor and a 98 sqm second floor. The ground level brings together a 31 sqm lounge, dining room, kitchen, pantry, guest WC and a maid’s room with its own bath.",
        "The upper floors add a family lounge, two bedrooms and a main bedroom with a walk-in closet. Balconies appear on both upper levels in the supplied drawings.",
      ], galleryLayout: "plans-landscape", gallery: [
        { image: "assets/pebblebrooks/plans/pebblebrooks-terrace-ground-floor.webp", alt: "Ground floor plan for a typical Pebblebrooks terrace home, 83.5 square metres", caption: "Ground floor", note: "83.5 sqm · lounge, kitchen and maid’s room" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-terrace-first-floor.webp", alt: "First floor plan for a typical Pebblebrooks terrace home, 98 square metres", caption: "First floor", note: "98 sqm · family lounge and bedrooms" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-terrace-second-floor.webp", alt: "Second floor plan for a typical Pebblebrooks terrace home, 98 square metres", caption: "Second floor", note: "98 sqm · main bedroom and bedroom three" },
      ] },
      { label: "Semi-detached homes", heading: "Six homes with a separate one-bedroom basement apartment.", paragraphs: [
        "The typical semi-detached home is shown with a 59 sqm basement, an 84 sqm ground floor and two 100 sqm upper floors. Each home is described as a four-bedroom residence with a one-bedroom basement apartment.",
        "The basement plan includes a lounge, kitchen, bath, laundry and store. Above it, the ground floor contains the main living, dining and kitchen spaces; the upper floors add bedrooms, family lounge, cinema room, walk-in closets and balconies.",
      ], galleryLayout: "plans-landscape-pair", gallery: [
        { image: "assets/pebblebrooks/plans/pebblebrooks-semi-basement.webp", alt: "Basement floor plan for a typical Pebblebrooks semi-detached home, 59 square metres", caption: "Basement floor", note: "59 sqm · one-bedroom apartment layout" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-semi-ground-floor.webp", alt: "Ground floor plan for a typical Pebblebrooks semi-detached home, 84 square metres", caption: "Ground floor", note: "84 sqm · living, dining and kitchen" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-semi-first-floor.webp", alt: "First floor plan for a typical Pebblebrooks semi-detached home, 100 square metres", caption: "First floor", note: "100 sqm · bedrooms, lounge and cinema" },
        { image: "assets/pebblebrooks/plans/pebblebrooks-semi-second-floor.webp", alt: "Second floor plan for a typical Pebblebrooks semi-detached home, 100 square metres", caption: "Second floor", note: "100 sqm · main bedroom and bedroom three" },
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
    title: "Palm Harbour Estate Phase 1", number: "04", category: "Residential · Ibadan", location: "Alalubosa, Ibadan", area: "Approx. 3,023 sqm",
    image: "assets/palm-harbour/palm-harbour-aerial.jpeg", imageAlt: "Aerial architectural rendering of Palm Harbour Estate Phase 1 in Alalubosa, Ibadan", visualNote: "Architectural visualisations · illustrative",
    deck: "A fresh look at Palm Harbour Estate Phase 1, a residential community in Alalubosa, Ibadan.",
    price: "On request", formValue: "Palm Harbour Estate Phase 1",
    facts: [["Location", "Alalubosa, Ibadan"], ["Site area", "Approx. 3,023 sqm"], ["Existing row", "5 terrace homes"], ["New phase", "5 homes · G+2"]],
    keyFeatures: [
      { title: "Two development stages", detail: "The project information lists five existing terrace homes and a separate new phase of five G+2 homes." },
      { title: "Everyday ground-floor spaces", detail: "The supplied plan shows a living room, dining area, kitchen, laundry, store, guest room and ante room." },
      { title: "Upper-floor rooms", detail: "The upper plan includes a master bedroom, other bedrooms, toilets, a lounge beside a void and a terrace." },
      { title: "Alalubosa address", detail: "The estate is located in Alalubosa, Ibadan, on an approximately 3,023 sqm site." },
    ],
    galleryAfter: 1, galleryTitle: "Exterior gallery", galleryLabel: "Architectural visualisations · Alalubosa, Ibadan", gallery: [
      { image: "assets/palm-harbour/palm-harbour-street-view.jpeg", alt: "Street-facing architectural rendering of homes at Palm Harbour Estate Phase 1", caption: "The street-facing homes", note: "Architectural visualisation" },
      { image: "assets/palm-harbour/palm-harbour-homes.jpeg", alt: "Architectural rendering of the Palm Harbour Estate Phase 1 residential homes", caption: "A closer view of the homes", note: "Architectural visualisation" },
      { image: "assets/palm-harbour/palm-harbour-entrance.jpeg", alt: "Entrance and perimeter view of Palm Harbour Estate Phase 1", caption: "Estate entrance", note: "Architectural visualisation" },
      { image: "assets/palm-harbour/palm-harbour-aerial.jpeg", alt: "Aerial rendering showing the homes and shared estate grounds at Palm Harbour Estate Phase 1", caption: "The estate from above", note: "Architectural visualisation" },
      { image: "assets/palm-harbour/alalubosa-aerial-estate.webp", alt: "Aerial architectural visualisation of homes and shared grounds in Alalubosa, Ibadan", caption: "Aerial estate view", note: "Architectural visualisation · Alalubosa, Ibadan" },
    ],
    sections: [
      { label: "The setting", heading: "An established Alalubosa address with a new phase.", paragraphs: [
        "Palm Harbour Estate Phase 1 is located in Alalubosa, Ibadan, on an approximately 3,023 sqm site. The published project information lists an existing row of five terrace homes and a separate new phase of five homes.",
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
    title: "Guzape · Abuja", number: "03", category: "Luxury residential · Abuja", location: "Guzape, Abuja, FCT", area: "Approx. 1,667 sqm",
    artClass: "story-art-guzape", visualNote: "Indicative design direction · subject to change",
    deck: "A luxury terrace concept for Guzape, a sought-after residential neighbourhood in Abuja.",
    price: "On request", formValue: "Guzape Main Project",
    facts: [["Location", "Guzape, Abuja"], ["Site area", "Approx. 1,667 sqm"], ["Development", "Luxury terraces"], ["Stage", "Concept design"]],
    keyFeatures: [
      { title: "Guzape, Abuja", detail: "The proposed residential development is located in Guzape, Abuja, FCT." },
      { title: "Approx. 1,667 sqm", detail: "Published project information gives the site area as approximately 1,667 square metres." },
      { title: "Luxury terrace brief", detail: "The current project listing identifies luxury terrace homes as the intended development type." },
      { title: "Concept stage", detail: "The scheme is listed at concept design stage; unit mix, amenities and final specifications are not yet confirmed." },
    ],
    sections: [
      { label: "The setting", heading: "A residential concept for Guzape, Abuja.", paragraphs: [
        "Guzape is planned as a luxury terrace development in Abuja. The published project information places the site at approximately 1,667 square metres and lists the scheme at concept design stage.",
        "At this point, the project is best understood through its location, intended residential type and evolving design direction. The concept will need to develop further before every detail can be treated as final.",
      ] },
      { label: "Design direction", heading: "An early design story, still taking shape.", paragraphs: [
        "Dav-Ric’s broader design language includes carefully composed volumes, red-lattice screens, sculpted stone forms and rooftop pergolas. Those references help explain the architectural vocabulary behind the portfolio, while the Guzape concept remains subject to its own design development.",
        "The artwork on this page is an abstract editorial visual, not a project rendering. It is intentionally used in place of unverified architectural imagery.",
      ] },
      { label: "What to know", heading: "Treat the current information as a concept brief.", paragraphs: [
        "The public project listing identifies Guzape as a concept-stage development. It does not establish a final specification, construction timetable, handover date or current availability.",
        "For a useful next conversation, ask the Dav-Ric Homes team for the latest design material, the current development stage and any confirmed timing or sales information.",
      ] },
    ],
  },

  "davric-towers": {
    title: "Dav-Ric Towers", number: "05", category: "Commercial building · Ibadan", location: "Oluyole, Ibadan",
    image: "assets/davric-towers-real.jpg", imageAlt: "Real exterior photograph of completed Dav-Ric Towers in Oluyole, Ibadan", video: "assets/davric-towers-construction.mp4?v=img-9256-20260928", videoAlt: "Construction film showing Dav-Ric Towers in Oluyole, Ibadan",
    deck: "Dav-Ric Towers is the completed Dav-Ric Group headquarters in Oluyole, Ibadan.",
    price: "SOLD", formValue: "Dav-Ric Towers",
    facts: [["Location", "Oluyole, Ibadan"], ["Use", "Dav-Ric Group headquarters"], ["Project type", "Commercial building"]],
    keyFeatures: [
      { title: "Group headquarters", detail: "Dav-Ric Towers serves as the Dav-Ric Group headquarters in Oluyole, Ibadan." },
      { title: "Commercial building", detail: "The completed project is presented as a commercial building in the Dav-Ric portfolio." },
      { title: "Red lattice facade", detail: "The exterior combines a bold red lattice screen with glazed openings and darker solid forms." },
      { title: "Completed", detail: "The portfolio lists Dav-Ric Towers as complete and its availability as sold." },
    ],
    galleryAfter: 2, galleryTitle: "Dav-Ric Towers, in detail", galleryLabel: "Completed headquarters · Oluyole, Ibadan", galleryLayout: "project-mosaic",
    galleryNote: "Completed-building photography and architectural visualisations.",
    gallery: [
      { image: "assets/davric-towers-real.jpg", alt: "Real street-facing exterior photograph of Dav-Ric Towers with its red lattice facade", caption: "Dav-Ric Towers · completed exterior", size: "wide" },
      { image: "assets/davric-towers-completed.jpg", alt: "Street-facing exterior photograph of Dav-Ric Towers with its red lattice facade", caption: "The street-facing exterior", size: "wide" },
      { image: "assets/davric-towers.webp", alt: "Architectural visualisation of Dav-Ric Towers with its red lattice facade", caption: "Architectural visualisation" },
      { image: "assets/davric-towers/gallery/davric-towers-new-view.webp", alt: "New architectural visualisation of Dav-Ric Towers with the red lattice facade", caption: "A new exterior view" },
    ],
    sections: [
      { label: "The setting", heading: "A completed landmark in Oluyole, Ibadan.", paragraphs: [
        "Dav-Ric Towers is the Dav-Ric Group headquarters in Oluyole, Ibadan. The updated project photograph shows the completed building at its Ibadan address.",
        "Its place in the portfolio recognises the built work behind Dav-Ric’s wider real estate vision, alongside residential homes and communities across the two cities.",
      ] },
      { label: "The building", heading: "A distinct identity, carried through the facade.", paragraphs: [
        "The building pairs a bold red lattice with glazed openings and darker solid forms. The facade gives the headquarters a clear architectural identity on its street.",
        "The updated exterior photograph presents the completed facade, from its red lattice to the building’s glazed openings.",
      ] },
      { label: "Project status", heading: "Completed.", paragraphs: [
        "Dav-Ric Towers is marked complete in the Dav-Ric Homes portfolio.",
      ] },
    ],
  },
  ajoda: {
    title: "Living Waters Estate", number: "02", category: "Residential · Ibadan", location: "Ajoda New Town, Ibadan",
    image: "assets/ajoda/ajoda-three-bedroom-vision.png", imageAlt: "Architectural visualisation of a three-bedroom home design for Living Waters Estate in Ajoda New Town, Ibadan", visualNote: "Architectural visualisation · illustrative",
    deck: "Three home plan options for Living Waters Estate in Ajoda New Town, Ibadan: a three-bedroom home, a two-bedroom home and a two-bedroom flat-roof design.",
    price: "On request", formValue: "Living Waters Estate",
    facts: [["Location", "Ajoda New Town, Ibadan"], ["Home types", "3-bedroom · 2-bedroom"], ["Roof option", "2-bedroom flat roof"]],
    keyFeatures: [
      { title: "Three-bedroom home", detail: "A three-bedroom home plan is supplied for Living Waters Estate." },
      { title: "Two-bedroom home", detail: "A separate two-bedroom home plan and exterior visualisation are supplied." },
      { title: "Flat-roof option", detail: "The portfolio also includes a two-bedroom flat-roof design." },
      { title: "Ajoda New Town", detail: "Living Waters Estate is located in Ajoda New Town, Ibadan." },
    ],
    galleryAfter: 1, galleryTitle: "A milestone for Living Waters Estate", galleryLabel: "Living Waters Estate · Ajoda New Town, Ibadan", galleryLayout: "project-mosaic",
    galleryNote: "Project meeting, allocation and signing moments at Living Waters Estate in Ajoda New Town, Ibadan.",
    gallery: [
      { image: "assets/ajoda/gallery/living-waters-milestone-01.webp", alt: "Dav-Ric team gathered for a Living Waters Estate project meeting", caption: "The project team", size: "wide" },
      { image: "assets/ajoda/gallery/living-waters-milestone-02.webp", alt: "Team members present a project document during the Living Waters Estate meeting", caption: "Presenting the agreement", size: "wide" },
      { image: "assets/ajoda/gallery/living-waters-milestone-03.webp", alt: "Dav-Ric representatives review a document at the Living Waters Estate meeting", caption: "Reviewing the agreement", size: "wide" },
      { image: "assets/ajoda/gallery/living-waters-milestone-04.webp", alt: "Living Waters Estate project team members standing together after the meeting", caption: "Together at the milestone", size: "wide" },
      { image: "assets/ajoda/gallery/living-waters-milestone-05.webp", alt: "Project representatives gathered around the table during the Living Waters Estate meeting", caption: "Around the table" },
      { image: "assets/ajoda/gallery/living-waters-milestone-06.webp", alt: "Representatives discuss project papers together at the table", caption: "A closer discussion", size: "wide" },
      { image: "assets/ajoda/gallery/living-waters-milestone-07.webp", alt: "Dav-Ric representatives review paperwork together during the project meeting", caption: "Reviewing the project papers", size: "wide" },
      { image: "assets/ajoda/gallery/living-waters-milestone-08.webp", alt: "Project representatives speak together around the meeting table", caption: "Working through the details" },
      { image: "assets/ajoda/gallery/living-waters-milestone-09.webp", alt: "Representatives seated together during the Living Waters Estate project meeting", caption: "In conversation" },
      { image: "assets/ajoda/gallery/living-waters-milestone-10.webp", alt: "Dav-Ric representatives discuss the agreement before signing", caption: "Before the signing" },
      { image: "assets/ajoda/gallery/living-waters-milestone-11.webp", alt: "A project representative reviews the agreement with a Dav-Ric representative", caption: "A careful review" },
      { image: "assets/ajoda/gallery/living-waters-milestone-12.webp", alt: "Two representatives review and sign project documents at the table", caption: "Signing the documents" },
      { image: "assets/ajoda/gallery/living-waters-milestone-13.webp", alt: "Representatives work through the project documents together", caption: "Documents in review" },
      { image: "assets/ajoda/gallery/living-waters-milestone-14.webp", alt: "Dav-Ric representatives seated with the Living Waters Estate agreement", caption: "The agreement at the table" },
      { image: "assets/ajoda/gallery/living-waters-milestone-15.webp", alt: "A representative signs a Living Waters Estate project document", caption: "A signature on the agreement" },
      { image: "assets/ajoda/gallery/living-waters-milestone-16.webp", alt: "Close view of a representative signing project documents", caption: "At the signing table" },
      { image: "assets/ajoda/gallery/living-waters-milestone-17.webp", alt: "Dav-Ric representatives review paperwork together at the table", caption: "Final document review" },
      { image: "assets/ajoda/gallery/living-waters-milestone-18.webp", alt: "Representatives discuss the agreement during the project meeting", caption: "A shared review" },
      { image: "assets/ajoda/gallery/living-waters-milestone-19.webp", alt: "Dav-Ric representatives review and sign documents at the Living Waters Estate meeting", caption: "Moving forward together" },
    ],
    sections: [
      { label: "The setting", heading: "A new home vision for Living Waters Estate.", paragraphs: [
        "Living Waters Estate is located in Ajoda New Town, Ibadan. The supplied drawings and visualisations show three residential options: a three-bedroom home, a two-bedroom home and a two-bedroom flat-roof design.",
        "The plans and exterior images below keep each home type easy to review while its project details continue to develop.",
      ] },
      { label: "Building plans", heading: "Three layouts, shown on their own.", paragraphs: [
        "The architectural drawings set out the three-bedroom plan, two-bedroom plan and two-bedroom flat-roof plan as separate images, apart from the exterior visualisations.",
        "These are the supplied plan drawings. Confirm final specifications and availability with Dav-Ric Homes.",
      ], galleryLayout: "plans", gallery: [
        { image: "assets/ajoda/ajoda-three-bedroom-plan.png", alt: "Architectural floor plan for the three-bedroom Living Waters Estate home", caption: "Three-bedroom home", note: "Building plan" },
        { image: "assets/ajoda/ajoda-two-bedroom-plan.png", alt: "Architectural floor plan for the two-bedroom Living Waters Estate home", caption: "Two-bedroom home", note: "Building plan" },
        { image: "assets/ajoda/ajoda-two-bedroom-flat-roof-plan.png", alt: "Architectural floor plan for the two-bedroom flat-roof Living Waters Estate home", caption: "Two-bedroom flat-roof home", note: "Building plan" },
      ] },
      { label: "The vision", heading: "Exterior concepts for each home type.", paragraphs: [
        "The visualisations pair each layout with an exterior direction. They show the three-bedroom design, the two-bedroom home and the flat-roof option as distinct ways of imagining the Living Waters Estate homes.",
        "These images illustrate design intent; final appearance and specifications should be confirmed with Dav-Ric Homes.",
      ], galleryLayout: "vision", gallery: [
        { image: "assets/ajoda/ajoda-three-bedroom-vision.png", alt: "Exterior visualisation of the three-bedroom Living Waters Estate home", caption: "Three-bedroom home", note: "Architectural visualisation" },
        { image: "assets/ajoda/ajoda-two-bedroom-vision.png", alt: "Exterior visualisation of the two-bedroom Living Waters Estate home", caption: "Two-bedroom home", note: "Architectural visualisation" },
        { image: "assets/ajoda/ajoda-two-bedroom-flat-roof-vision.png", alt: "Exterior visualisation of the two-bedroom flat-roof Living Waters Estate home", caption: "Two-bedroom flat-roof home", note: "Architectural visualisation" },
      ] },
    ],
  },
};

document.querySelectorAll("[data-inquiry-form]").forEach((inquiryForm) => {
  const formNote = inquiryForm.querySelector(".form-note");
  const whatsappInquiryButton = inquiryForm.querySelector("[data-whatsapp-inquiry]");
  const interestSelect = inquiryForm.querySelector('[name="interest"]');
  const projectSlug = new URLSearchParams(window.location.search).get("project");
  const requestedStory = projectStories[projectSlug];
  if (interestSelect && requestedStory) interestSelect.value = requestedStory.formValue;

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

const towerSequence = document.querySelector("[data-tower-sequence]");
const towerConstructionVideo = towerSequence?.querySelector("[data-tower-construction-video]");
const towerSequenceStatus = towerSequence?.querySelector("[data-tower-sequence-status]");

if (towerSequence && towerConstructionVideo) {
  const showCompletedTower = (message = "Completed Dav-Ric Towers photograph shown.") => {
    towerSequence.classList.remove("is-playing");
    towerSequence.classList.add("is-complete");
    if (towerSequenceStatus) towerSequenceStatus.textContent = message;
    towerConstructionVideo.pause();
  };

  const playTowerSequence = () => {
    if (towerConstructionVideo.ended) {
      showCompletedTower();
      return;
    }
    towerSequence.classList.remove("is-complete");
    towerSequence.classList.add("is-playing");
    if (towerSequenceStatus) towerSequenceStatus.textContent = "Playing Dav-Ric Towers construction footage.";
    towerConstructionVideo.play()?.catch(() => showCompletedTower("Construction video could not start; completed Dav-Ric Towers photograph shown."));
  };

  towerConstructionVideo.addEventListener("ended", () => showCompletedTower("Construction video finished; showing completed Dav-Ric Towers photograph."), { once: true });
  towerConstructionVideo.addEventListener("error", () => showCompletedTower("Construction video could not load; completed Dav-Ric Towers photograph shown."), { once: true });

  if ("IntersectionObserver" in window) {
    const towerSequenceObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          playTowerSequence();
        } else if (!towerConstructionVideo.ended) {
          towerConstructionVideo.pause();
        }
      });
    }, { threshold: [0, 0.35] });
    towerSequenceObserver.observe(towerSequence);
  } else {
    playTowerSequence();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      towerConstructionVideo.pause();
      return;
    }
    const bounds = towerSequence.getBoundingClientRect();
    if (bounds.bottom > 0 && bounds.top < window.innerHeight) playTowerSequence();
  });
}

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

const projectScrollButtons = document.querySelectorAll("[data-project-scroll]");

function syncProjectScrollButtons() {
  if (!projectGrid) return;
  const maxScroll = projectGrid.scrollWidth - projectGrid.clientWidth;
  const visibleCards = [...projectGrid.querySelectorAll(".project-card:not([hidden])")];
  projectScrollButtons.forEach((button) => {
    const isPrevious = button.dataset.projectScroll === "previous";
    button.disabled = maxScroll <= 1 || (isPrevious ? projectGrid.scrollLeft <= 1 : projectGrid.scrollLeft >= maxScroll - 1);
  });

  const canScroll = maxScroll > 1 && visibleCards.length > 1;
  projectScrollPrompt?.classList.toggle("is-visible", canScroll);
  if (!visibleCards.length) return;

  const gap = Number.parseFloat(getComputedStyle(projectGrid).columnGap) || 0;
  const cardWidth = visibleCards[0].getBoundingClientRect().width;
  const step = Math.max(1, cardWidth + gap);
  const currentIndex = Math.min(visibleCards.length, Math.floor((projectGrid.scrollLeft + gap / 2) / step) + 1);
  const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (projectGrid.scrollLeft / maxScroll) * 100)) : 100;
  const remaining = visibleCards.length - currentIndex;

  if (projectScrollTrack) {
    projectScrollTrack.value = String(Math.round(progress));
    projectScrollTrack.setAttribute("aria-valuetext", `Project ${currentIndex} of ${visibleCards.length}`);
  }
  if (projectScrollCopy) {
    projectScrollCopy.textContent = remaining > 0
      ? `${remaining} more ${remaining === 1 ? "development" : "developments"} to explore`
      : "You are at the end of the portfolio";
  }
  if (projectScrollIndex) {
    projectScrollIndex.textContent = `${String(currentIndex).padStart(2, "0")} / ${String(visibleCards.length).padStart(2, "0")}`;
  }
}

projectScrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!projectGrid) return;
    const firstVisibleCard = projectGrid.querySelector(".project-card:not([hidden])");
    const gap = Number.parseFloat(getComputedStyle(projectGrid).columnGap) || 0;
    const step = firstVisibleCard ? firstVisibleCard.getBoundingClientRect().width + gap : projectGrid.clientWidth * 0.8;
    const direction = button.dataset.projectScroll === "previous" ? -1 : 1;
    projectGrid.scrollBy({ left: direction * step, behavior: reducedMotionQuery.matches ? "auto" : "smooth" });
  });
});

projectGrid?.addEventListener("scroll", () => requestAnimationFrame(syncProjectScrollButtons), { passive: true });
projectScrollTrack?.addEventListener("input", () => {
  if (!projectGrid) return;
  const maxScroll = projectGrid.scrollWidth - projectGrid.clientWidth;
  projectGrid.scrollTo({ left: maxScroll * (Number(projectScrollTrack.value) / 100), behavior: "auto" });
});
window.addEventListener("resize", syncProjectScrollButtons);
syncProjectScrollButtons();

const storyPage = document.querySelector("[data-project-story]");
if (storyPage) {
  const storySlug = new URLSearchParams(window.location.search).get("story");
  const story = projectStories[storySlug];
  const title = storyPage.querySelector("[data-story-title]");
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

  if (story) {
    const isDavricTowers = storySlug === "davric-towers";
    storyPage.classList.toggle("project-story-page--towers", isDavricTowers);
    if (isDavricTowers) visualNote?.remove();
    document.title = `${story.title} — Dav-Ric Homes`;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.content = story.deck;
    if (title) title.textContent = story.title;
    if (meta) meta.textContent = story.number + " / " + String(Object.keys(projectStories).length).padStart(2, "0") + " · " + story.category;
    if (deck) deck.textContent = story.deck;
    if (visualNote) visualNote.textContent = story.visualNote;
    if (storySlug === "davric-towers") {
      priceBox?.remove();
    } else {
      if (price) price.textContent = story.price || "On request";
      if (priceLabel) priceLabel.textContent = story.price === "SOLD" ? "Availability" : "Price";
      if (priceBox) priceBox.classList.toggle("is-sold", story.price === "SOLD");
    }
    if (enquiryLink) enquiryLink.href = `/contact?project=${encodeURIComponent(storySlug)}`;

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
      keyFeatures.hidden = false;
      keyFeatures.innerHTML = [
        '<div class="story-key-features-heading">',
        '<p class="eyebrow eyebrow-dark">Project specification</p>',
        `<h2 id="story-key-features-title">${story.keyFeaturesLead || "Key features"}</h2>`,
        `<p>${story.keyFeaturesIntro || "Project details gathered from the published project information, drawings and brochure."}</p>`,
        '</div>',
        '<div class="story-key-features-grid">',
        story.keyFeatures.map((feature, index) => `<article class="story-key-feature${feature.priority ? " story-key-feature--priority" : ""}" data-reveal="zoom"><span>${String(index + 1).padStart(2, "0")}</span><h3>${feature.title}</h3><p>${feature.detail}</p></article>`).join(""),
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
      const galleryMarkup = story.galleryTitle
        ? `
          <section class="palm-gallery-section" data-story-reveal aria-label="${story.galleryTitle}">
            <div class="palm-gallery-heading">
              <div><p class="eyebrow eyebrow-dark">${story.galleryLabel}</p><h2>${story.galleryTitle}</h2></div>
              <span class="palm-gallery-total"><span>${String(story.gallery.length).padStart(2, "0")}</span> curated views</span>
            </div>
            <div class="story-image-gallery story-image-gallery--${story.galleryLayout || "palm-harbour"}">
              ${story.gallery.map((item, index) => `
                <figure class="palm-gallery-tile palm-gallery-tile--${index + 1}${item.size === "wide" ? " palm-gallery-tile--wide" : ""}">
                  <button class="palm-gallery-open" type="button" data-gallery-open data-gallery-index="${index}" data-gallery-src="${item.image}" data-gallery-alt="${item.alt}" data-gallery-caption="${item.caption}" aria-label="View ${item.caption}">
                    <img src="${item.image}" alt="${item.alt}" loading="lazy" decoding="async" />
                    <span class="palm-gallery-counter"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 9.5 3h5L16 5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3Z"/><circle cx="12" cy="12" r="3.5"/></svg>${String(story.gallery.length).padStart(2, "0")} <i>views</i></span>
                    <span class="palm-gallery-caption"><span class="palm-gallery-brand"><strong>DAV-RIC</strong><small>HOMES</small></span><span><strong>${item.caption}</strong><small>${story.location}</small></span><span class="palm-gallery-arrow" aria-hidden="true"><svg class="ui-arrow ui-arrow--up-right" viewBox="0 0 24 24" focusable="false"><path d="M7 17 17 7M7 7h10v10" /></svg></span></span>
                  </button>
                </figure>
              `).join("")}
            </div>
            <p class="palm-gallery-note">${story.galleryNote || "Design imagery shown is illustrative. Final specifications are subject to confirmation."}</p>
          </section>
        `
        : (story.gallery || []).map((item) => `
          <figure class="story-image-spread" data-story-reveal>
            <div class="story-image-frame"><img src="${item.image}" alt="${item.alt}" loading="lazy" /></div>
            <figcaption><span>${item.caption}</span><span>${item.note}</span></figcaption>
          </figure>
        `).join("");

      body.innerHTML = story.sections.map((section, index) => `
        <section class="story-section" id="story-chapter-${index + 1}" data-story-section data-story-reveal>
          <p class="story-chapter-index"><span>${String(index + 1).padStart(2, "0")}</span><span>${section.label}</span></p>
          <div class="story-section-copy">
            <h2>${section.heading}</h2>
            ${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
          </div>
        </section>
        ${story.galleryAfter === index + 1 ? galleryMarkup : ""}
      `).join("");

      story.sections.forEach((section, index) => {
        if (!section.gallery?.length) return;
        const gallery = document.createElement("div");
        gallery.className = "story-image-gallery story-image-gallery--" + (section.galleryLayout || "single");
        gallery.dataset.storyReveal = "";
        gallery.setAttribute("role", "group");
        gallery.setAttribute("aria-label", section.heading + " image gallery");

        section.gallery.forEach((item, itemIndex) => {
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
          currentGallery = [...(gallery?.querySelectorAll("[data-gallery-open]") || [])];
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

      const storyWords = [story.deck, ...story.sections.flatMap((section) => [section.heading, ...section.paragraphs]), ...(story.keyFeatures || []).flatMap((feature) => [feature.title, feature.detail])].join(" ").trim().split(/\s+/).filter(Boolean).length;
      if (readingTime) readingTime.textContent = `${Math.max(1, Math.ceil(storyWords / 220))} min read`;
      if (chapterNav) {
        chapterNav.innerHTML = `<span class="story-chapter-nav-label">In this story</span>${story.sections.map((section, index) => `<a href="#story-chapter-${index + 1}" data-story-chapter-link="${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span>${section.label}</a>`).join("")}`;
      }

      const storyReveals = body.querySelectorAll("[data-story-reveal]");
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
            <a class="story-related-card" href="/project?story=${encodeURIComponent(slug)}" aria-label="Read the ${related.title} project story">
              <div class="story-related-media">${preview}<span class="story-related-arrow" aria-hidden="true"><svg class="ui-arrow ui-arrow--up-right" viewBox="0 0 24 24" focusable="false"><path d="M7 17 17 7M7 7h10v10" /></svg></span></div>
              <div class="story-related-copy"><p>${related.category}</p><h3>${related.title}</h3><span>${related.location}</span></div>
            </a>
          `;
        }).join("");
    }
  } else if (title) {
    document.title = "Project stories — Dav-Ric Homes";
    title.textContent = Object.keys(projectStories).length + " projects. Two cities.";
    if (deck) deck.textContent = "Choose a Dav-Ric Homes development to explore its place, design and current published details.";
    if (body) body.innerHTML = '<p>Visit the <a href="/#developments">developments page</a> to choose a project story.</p>';
  }
}
