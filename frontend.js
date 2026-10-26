import { icons } from "./assets/lucide-icons.js";
import { routeAliases } from "./routes.js";

const appURL = new URL(".", import.meta.url);
const basePath = appURL.pathname;
const staticPreview = document.documentElement.dataset.preview === "static";
const localURL = path => new URL(path.replace(/^\//, ""), appURL).pathname;

let content;
let lang = "fr";
let revealObserver;
let menuTimer;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileViewport = window.matchMedia("(max-width: 1100px)");
const groups = [
  { id: "presentation", icon: "Factory", children: ["historique", "outil-industriel", "actionnariat", "certifications", "partenaires"] },
  { id: "offre", icon: "Layers", children: ["ceramiques-techniques", "serigraphie", "traitements-de-surface", "developpements-industriels", "etapes-process"] },
  { id: "materiaux", icon: "Hexagon", children: ["porcelaine-technique", "alumine", "alumine-haute-purete", "zta", "zircone"] },
  { id: "marches", icon: "ShieldCheck", children: ["defense", "industrie", "horlogerie", "contenants", "architecture"] },
  { id: "actualites", icon: "ScanLine", children: ["publications", "evenements", "salons"] }
];
const offers = groups[1].children.slice(0, 4);
const materials = groups[2].children;
const markets = groups[3].children;
const routeImages = {
  presentation: "industrial", historique: "history", actionnariat: "industrial", partenaires: "production",
  "ceramiques-techniques": "hero", serigraphie: "screenprint", "traitements-de-surface": "surface",
  "developpements-industriels": "production", "outil-industriel": "production", production: "hero",
  "deliantage-frittage": "furnace", "ajout-de-fonctions": "surface", defense: "defense", industrie: "production",
  horlogerie: "printingDetail"
};
const routeIcons = { "ceramiques-techniques": "Hexagon", serigraphie: "ScanLine", "traitements-de-surface": "Layers", "developpements-industriels": "FlaskConical", defense: "ShieldCheck", industrie: "Factory", horlogerie: "Watch", contenants: "Package", architecture: "Layers" };
const chemistry = ["Silicates", "Al₂O₃", "Al₂O₃", "Al₂O₃ + ZrO₂", "ZrO₂"];
const esc = (value = "") => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
const get = path => path.split(".").reduce((value, key) => value?.[key], content?.[lang]);
const t = path => path.split(".").reduce((value, key) => value?.[key], content?.website?.[lang]);
const page = id => t(`pages.${id}`);
const currentId = () => {
  const raw = location.pathname.slice(basePath.length).replace(/^\/|\/$/g, "") || "home";
  return routeAliases[raw] || raw;
};
const parent = id => groups.find(group => group.id === id || group.children.includes(id))?.id || (["production", "deliantage-frittage", "ajout-de-fonctions"].includes(id) ? "offre" : "");
const title = id => page(id)?.short || page(id)?.title || "";

function icon(name, className = "") {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(icons[name] || icons.ArrowUpRight).map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${esc(value)}"`).join(" ")}></${tag}>`).join("")}</svg>`;
}

function link(id, label = title(id), className = "", arrow = false) {
  return `<a class="${className}" href="${localURL(id === "home" ? "" : `${id}${staticPreview ? "/" : ""}`)}">${label}${arrow ? icon("ArrowUpRight") : ""}</a>`;
}

function picture(slot, alt = "", className = "", eager = false) {
  return `<img class="${className}" src="${esc(localURL(content.images[slot]))}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" ${eager ? 'fetchpriority="high"' : ""} decoding="async">`;
}

function renderHeader() {
  const active = parent(currentId());
  document.querySelector("#siteHeader").innerHTML = `<div class="header-inner">
    <a class="brand" href="${basePath}" aria-label="${esc(content.settings.siteName)}">${picture("logo", content.settings.siteName, "", true)}</a>
    <nav class="main-nav" id="mainNav" aria-label="${lang === "fr" ? "Navigation principale" : "Main navigation"}">
      ${groups.map((group, index) => `<div class="nav-group" data-nav-group="${group.id}">
        <div class="nav-item ${group.id === active ? "is-active" : ""}">${link(group.id, esc(t("ui.sections")[index]))}<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="nav-${group.id}" aria-label="${esc(t("ui.overview"))} ${esc(title(group.id))}">${icon("ChevronDown")}</button></div>
        <div class="mega-menu" id="nav-${group.id}" hidden><div class="mega-intro">${icon(group.icon)}<p class="eyebrow">${esc(t("ui.sections")[index])}</p><p>${esc(page(group.id).intro)}</p>${link(group.id, esc(t("ui.all")), "text-link", true)}</div><div class="mega-links">${group.children.map((id, i) => link(id, `<span class="menu-number">${String(i + 1).padStart(2, "0")}</span><span>${esc(title(id))}</span>`, "mega-link", true)).join("")}</div></div>
      </div>`).join("")}
      ${link("contact", esc(t("ui.contact")), "mobile-contact", true)}
    </nav>
    <div class="header-actions"><div class="language-control"><button type="button" class="language-trigger" aria-label="${esc(t("ui.language"))}" aria-expanded="false" aria-controls="languageOptions">${icon("Globe")}<span>${lang.toUpperCase()}</span>${icon("ChevronDown")}</button><div class="language-options" id="languageOptions" hidden>${["fr", "en"].map(code => `<button type="button" data-lang="${code}" lang="${code}" aria-pressed="${lang === code}"><span>${code === "fr" ? "Français" : "English"}</span>${lang === code ? icon("Check") : ""}</button>`).join("")}</div></div>${link("contact", esc(get("nav.contact")), "header-contact", true)}<button type="button" class="mobile-toggle" aria-label="${esc(t("ui.menu"))}" aria-expanded="false" aria-controls="mainNav">${icon("Menu")}</button></div>
    </div><div class="scroll-progress" aria-hidden="true"></div>`;
  document.querySelector("#mainNav").inert = mobileViewport.matches;
  document.querySelector(".skip-link").textContent = t("ui.skip");
  document.querySelector(".skip-link").href = `${location.pathname}#app`;
}

function metrics() {
  return `<section class="metrics" aria-label="${lang === "fr" ? "Chiffres clés du groupe Bernardaud" : "Bernardaud group key figures"}"><div class="container metric-grid">${content[lang].metrics.map(metric => `<div data-reveal><strong class="${metric.value.startsWith("ISO") ? "metric-certifications" : ""}">${esc(metric.value.replace("m2", "m²"))}</strong><span>${esc(metric.label)}</span></div>`).join("")}</div></section>`;
}

function heading(eyebrow, name, intro, action = "") {
  return `<div class="section-heading" data-reveal><div><p class="eyebrow">${esc(eyebrow)}</p><h2>${esc(name)}</h2></div><div class="section-description"><p>${esc(intro)}</p>${action}</div></div>`;
}

function offerCards(detailed = false) {
  const slots = ["technicalParts", "screenprint", "surface", "production"];
  return `<div class="offer-grid">${offers.map((id, i) => `<article class="offer-card" data-reveal>${link(id, `<div class="offer-photo">${picture(slots[i], title(id))}<span class="photo-arrow">${icon("ArrowUpRight")}</span></div><div class="offer-copy"><span class="offer-number">0${i + 1}</span><h3>${esc(page("offre").items[i].title)}</h3><p>${esc(detailed ? page("offre").items[i].body : content[lang].pillars[i].summary)}</p></div>`)}</article>`).join("")}</div>`;
}

function marketCards() {
  return `<div class="market-grid">${markets.map((id, i) => `<article class="market-card" data-reveal>${link(id, `<div class="market-card-top">${icon(routeIcons[id])}<span>0${i + 1}</span></div><h3>${esc(title(id))}</h3><p>${esc(id === "defense" ? page(id).title : page(id).intro)}</p><span class="text-link">${esc(t("ui.discover"))}${icon("ArrowUpRight")}</span>`)}</article>`).join("")}</div>`;
}

function developmentSupport() {
  const data = page("offre").support;
  return `<section class="section development-support"><div class="container support-layout"><div data-reveal><p class="eyebrow">R&D · ${esc(title("developpements-industriels"))}</p><h2>${esc(data.title)}</h2><p>${esc(data.body)}</p>${link("etapes-process", esc(title("etapes-process")), "text-link", true)}</div><figure data-reveal>${picture("laboratory", lang === "fr" ? "Microscope du laboratoire Bernardaud" : "Microscope at the Bernardaud laboratory")}</figure></div></section>`;
}

function manufacturingProcess() {
  const data = page("etapes-process");
  return `${pageHero("etapes-process")}<section class="section"><div class="container"><div class="manufacturing-flow">${data.stages.map((stage, i) => `<article data-reveal><span class="flow-number">0${i + 1}</span><div><h2>${esc(stage.title)}</h2><p>${esc(stage.body)}</p><ul>${stage.points.map(point => `<li>${icon("Check")}${esc(point)}</li>`).join("")}</ul></div>${link(stage.route, esc(title(stage.route)), "text-link", true)}</article>`).join("")}</div></div></section>${related(["production", "deliantage-frittage", "ajout-de-fonctions"])}${contactBand()}`;
}

function productionDetail() {
  const data = page("production");
  return `${pageHero("production")}<section class="section"><div class="container"><div class="manufacturing-grid">${data.sections.map((item, i) => `<article data-reveal><figure class="manufacturing-photo ${item.image === "pressing" ? "compact" : ""}">${picture(item.image, item.title)}</figure><span class="detail-number">0${i + 1}</span><h2>${esc(item.title)}</h2><p>${esc(item.body)}</p></article>`).join("")}</div><h2 class="table-heading">${esc(data.comparison.title)}</h2><div class="table-scroll" role="region" aria-label="${esc(data.comparison.title)}" tabindex="0"><table><thead><tr>${data.comparison.headings.map(label => `<th scope="col">${esc(label)}</th>`).join("")}</tr></thead><tbody>${data.comparison.rows.map(row => `<tr><th scope="row">${esc(row[0])}</th>${row.slice(1).map(cell => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="production-sectors" data-reveal><h2>${esc(data.sectors.title)}</h2><p>${esc(data.sectors.body)}</p><ul>${data.sectors.items.map(item => `<li>${esc(item)}</li>`).join("")}</ul></div></div></section>${related(["etapes-process", "deliantage-frittage", "materiaux"])}${contactBand()}`;
}

function thermalDetail() {
  const data = page("deliantage-frittage");
  const stats = `<section class="metrics thermal-metrics"><div class="container metric-grid">${data.metrics.map(metric => `<div data-reveal><strong>${esc(metric.value)}</strong><span>${esc(metric.label)}</span></div>`).join("")}</div></section>`;
  const conditions = `<section class="section thermal-conditions"><div class="container"><div class="capability-grid">${data.conditions.map(item => `<article data-reveal><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></article>`).join("")}</div></div></section>`;
  return detail("deliantage-frittage", conditions + mediaGallery(data.gallery), stats);
}

function home() {
  return `<section class="home-hero"><div class="hero-media">${picture("hero", lang === "fr" ? "Presse d’injection céramique Arburg dans les ateliers Bernardaud" : "Arburg ceramic injection machine at Bernardaud", "hero-photo", true)}</div>
    <div class="container hero-content"><p class="hero-eyebrow">${esc(t("home.eyebrow"))}</p><h1><span>${esc(t("home.title"))}</span> ${esc(t("home.subtitle"))}</h1><p class="hero-lead">${esc(t("home.intro"))}</p><div class="hero-actions">${link("offre", esc(t("home.primary")), "button light", true)}${link("contact", esc(t("home.secondary")), "hero-text-link", true)}</div></div>
    <div class="hero-bottom container"><a class="scroll-link" href="#savoir-faire">${icon("ArrowDown")}<span>${esc(t("home.scroll"))}</span></a>${link("outil-industriel", `<span class="image-caption">${esc(t("home.caption"))}</span>`, "hero-caption", true)}</div></section>
    ${metrics()}
    <section class="section" id="savoir-faire"><div class="container">${heading(t("ui.expertise"), t("home.offerTitle"), t("home.offerIntro"), link("offre", esc(t("home.offerLink")), "text-link", true))}${offerCards()}</div></section>
    <section class="heritage-section"><div class="container heritage-layout"><div class="heritage-art" data-reveal>${picture("history", lang === "fr" ? "Dessin de la manufacture Bernardaud à Limoges" : "Drawing of the Bernardaud manufacture in Limoges")}<span class="heritage-year">1863</span></div><div class="heritage-copy" data-reveal><p class="eyebrow">Bernardaud · Limoges</p><h2>${esc(t("home.heritageTitle"))}</h2><p>${esc(t("home.heritageIntro"))}</p>${link("presentation", esc(t("home.heritageLink")), "text-link", true)}</div></div></section>
    <section class="section statement-section"><div class="container statement-layout" data-reveal><blockquote><p>« ${esc(t("home.quote"))} »</p><footer><strong>${esc(t("home.quoteAuthor"))}</strong><span>${esc(t("home.quoteRole"))}</span></footer></blockquote></div></section>
    <section class="section"><div class="container">${heading(t("ui.applications"), t("home.marketsTitle"), t("home.marketsIntro"))}${marketCards()}</div></section>
    <section class="production-banner">${picture("production", lang === "fr" ? "Atelier de production Bernardaud" : "Bernardaud production workshop")}<div class="container"><div class="production-copy" data-reveal><p class="eyebrow">${esc(title("outil-industriel"))}</p><h2>${esc(t("home.productionTitle"))}</h2><p>${esc(t("home.productionIntro"))}</p>${link("outil-industriel", esc(t("home.productionLink")), "button light", true)}</div></div></section>${contactBand()}`;
}

function breadcrumb(id) {
  const group = parent(id);
  return `<nav class="breadcrumbs" aria-label="${lang === "fr" ? "Fil d’Ariane" : "Breadcrumb"}">${link("home", esc(t("ui.home")))}${icon("ChevronRight")}${group && group !== id ? `${link(group, esc(title(group)))}${icon("ChevronRight")}` : ""}<span aria-current="page">${esc(page(id)?.title || t("ui.notFound"))}</span></nav>`;
}

function pageHero(id) {
  const data = page(id);
  return `<section class="page-hero"><div class="container">${breadcrumb(id)}<div class="page-heading"><div><p class="eyebrow">Bernardaud Solutions Industrielles</p><h1>${esc(data?.title || t("ui.notFound"))}</h1></div><p class="page-lead">${esc(data?.intro || "")}</p></div></div></section>`;
}

function bulletList(items = []) {
  return items.length ? `<ul class="editorial-list">${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>` : "";
}

function sections(items = [], className = "") {
  return `<div class="detail-sections ${className}">${items.map((item, i) => `<article data-reveal><span class="detail-number">${String(i + 1).padStart(2, "0")}</span><div><h2>${esc(item.title)}</h2><p>${esc(item.body)}</p>${bulletList(item.points)}${(item.paragraphs || []).map(text => `<p>${esc(text)}</p>`).join("")}</div></article>`).join("")}</div>`;
}

function technicalGrid(items, columns = 3) {
  return `<div class="technical-grid technical-grid-${columns}">${items.map((item, i) => `<article data-reveal><span class="detail-number">${String(i + 1).padStart(2, "0")}</span><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></article>`).join("")}</div>`;
}

function mediaGallery(data) {
  return `<section class="section media-section"><div class="container">${heading(t("ui.expertise"), data.title, data.intro)}<div class="media-gallery">${data.items.map(item => `<figure data-reveal><div class="media-frame">${picture(item.image, item.title)}</div><figcaption><h3>${esc(item.title)}</h3><span>${esc(item.credit)}</span></figcaption></figure>`).join("")}</div></div></section>`;
}

function screenPrintingDetail() {
  const data = page("serigraphie");
  const creative = `<section class="section technical-section"><div class="container">${heading(t("ui.expertise"), data.creative.title, data.creative.intro)}${technicalGrid(data.creative.items)}</div></section>`;
  const precision = `<section class="section technical-band"><div class="container">${heading(t("ui.expertise"), data.precision.title, data.precision.body)}<dl class="precision-metrics">${data.precision.metrics.map(metric => `<div data-reveal><dt>${esc(metric.label)}</dt><dd>${esc(metric.value)}</dd></div>`).join("")}</dl><p class="precision-note">${esc(data.precision.note)}</p>${technicalGrid(data.precision.items, 4)}</div></section>`;
  const digital = `<section class="section"><div class="container digital-layout"><div data-reveal><p class="eyebrow">${esc(t("ui.expertise"))}</p><h2>${esc(data.digital.title)}</h2><p>${esc(data.digital.body)}</p></div><figure data-reveal>${picture(data.digital.image, data.digital.caption)}<figcaption>${esc(data.digital.caption)}</figcaption></figure></div></section>`;
  return detail("serigraphie", creative + precision + digital + mediaGallery(data.gallery));
}

function surfaceTreatmentDetail() {
  const data = page("traitements-de-surface");
  const processes = `<section class="section technical-section"><div class="container">${heading(t("ui.expertise"), data.processes.title, data.processes.intro)}${technicalGrid(data.processes.items, 4)}</div></section>`;
  const functional = `<section class="section technical-band"><div class="container functional-layout"><div data-reveal><p class="eyebrow">${esc(t("ui.applications"))}</p><h2>${esc(data.functional.title)}</h2><p>${esc(data.functional.body)}</p></div>${bulletList(data.functional.points)}</div></section>`;
  const controls = `<section class="section"><div class="container">${heading(t("ui.quality"), data.controls.title, data.controls.intro)}<div class="surface-controls"><figure data-reveal>${picture("laboratory", lang === "fr" ? "Microscope du laboratoire Bernardaud" : "Microscope at the Bernardaud laboratory")}</figure>${technicalGrid(data.controls.items, 2)}</div></div></section>`;
  return detail("traitements-de-surface", processes + functional + controls);
}

function applicationGroups(items) {
  if (!items?.length) return "";
  return `<section class="section application-section"><div class="container"><p class="eyebrow">${esc(t("ui.applications"))}</p><div class="application-grid">${items.map((item, i) => `<article data-reveal><span class="detail-number">${String(i + 1).padStart(2, "0")}</span><h2>${esc(item.title)}</h2>${bulletList(item.points)}</article>`).join("")}</div></div></section>`;
}

function portraits(items) {
  if (!items?.length) return "";
  return `<div class="portrait-grid">${items.map(item => `<figure data-reveal>${picture(item.image, item.name)}<figcaption>${esc(item.name)}</figcaption></figure>`).join("")}</div>`;
}

function related(ids) {
  return `<section class="section related-section"><div class="container"><p class="eyebrow">${esc(t("ui.next"))}</p><div class="related-links">${ids.map(id => link(id, `<span>${esc(title(id))}</span>`, "related-link", true)).join("")}</div></div></section>`;
}

function ballisticGallery() {
  return `<section class="section"><div class="container">${heading(t("ui.applications"), t("ballistic.title"), t("ballistic.intro"))}<div class="ballistic-gallery">${t("ballistic.products").map((product, i) => `<figure data-reveal>${picture(["ballisticTiles", "defense", "multiCurvature"][i], product.title)}<figcaption><h3>${esc(product.title)}</h3><p>${esc(product.body)}</p></figcaption></figure>`).join("")}</div><a class="text-link" href="${localURL("assets/protection-balistique.pdf")}" target="_blank" rel="noopener">${esc(page("publications").title)} · PDF${icon("Download")}</a></div></section>`;
}

function sites() {
  return `<section class="section sites-section"><div class="container">${heading(title("outil-industriel"), t("ui.sites"), t("ui.sitesIntro"))}<div class="site-grid">${content[lang].presentationPage.sites.map((site, i) => `<article data-reveal>${icon(["Factory", "ScanLine", "Layers", "Package"][i])}<p class="eyebrow">${esc(site.role)}</p><h3>${esc(site.name)}</h3><p>${esc(site.details)}</p>${bulletList(site.points)}</article>`).join("")}</div></div></section>`;
}

function presentation(id) {
  const data = page(id);
  const image = routeImages[id];
  return `${pageHero(id)}<section class="section presentation-content"><div class="container">${image && id !== "actionnariat" ? `<figure class="page-visual ${id === "historique" ? "drawing" : ""}" data-reveal>${picture(image, data.title)}</figure>` : ""}${portraits(data.portraits)}${sections(data.sections, id === "historique" ? "timeline" : "")}</div></section>${data.gallery ? mediaGallery(data.gallery) : ""}${id === "presentation" ? `${sites()}${metrics()}${related(groups[0].children.filter(child => child !== "outil-industriel"))}` : ""}${id === "certifications" ? related(["outil-industriel", "partenaires"]) : ""}${contactBand()}`;
}

function offer() {
  return `${pageHero("offre")}<section class="section"><div class="container">${offerCards(true)}</div></section>${developmentSupport()}${related(["outil-industriel", "materiaux"])}${contactBand()}`;
}

function detail(id, extra = "", before = "") {
  const data = page(id);
  const image = routeImages[id] ? `<figure class="detail-image" data-reveal>${picture(routeImages[id], data.title)}</figure>` : "";
  const applications = data.points ? `<div class="application-list" data-reveal><h3>${esc(t("ui.applications"))}</h3><ul>${data.points.map(point => `<li>${icon("Check")}<span>${esc(point)}</span></li>`).join("")}</ul></div>` : "";
  const defense = id === "defense" ? `<section class="section defense-band"><div class="container">${heading(t("ui.materials"), title("alumine-haute-purete") + " · ZTA · " + title("zircone"), data.sections[2].body)}<div class="defense-formats">${["Al₂O₃", "Al₂O₃ + ZrO₂", "ZrO₂"].map((formula, i) => link(["alumine-haute-purete", "zta", "zircone"][i], `<span>${formula}</span><strong>${esc(title(["alumine-haute-purete", "zta", "zircone"][i]))}</strong>`, "formula-link", true)).join("")}</div></div></section>` : "";
  const aside = image || applications ? `<aside class="detail-aside">${image}${applications}</aside>` : "";
  return `${pageHero(id)}${before}<section class="section detail-content"><div class="container detail-layout ${aside ? "" : "text-only"}"><div>${sections(data.sections)}</div>${aside}</div></section>${applicationGroups(data.applications)}${defense}${extra}${related(parent(id) === "marches" ? markets.filter(other => other !== id).slice(0, 3) : ["etapes-process", "materiaux", "outil-industriel"])}${contactBand()}`;
}

function materialIndex() {
  const data = page("materiaux");
  return `${pageHero("materiaux")}<section class="section"><div class="container">${sections(data.sections)}<div class="material-index">${materials.map((id, i) => link(id, `<span class="material-formula">${chemistry[i]}</span><div><span class="material-id">0${i + 1}</span><h2>${esc(title(id))}</h2><p>${esc(page(id).intro)}</p></div>${icon("ArrowUpRight")}`, "material-row")).join("")}</div><div class="other-materials" data-reveal><h2>${esc(data.other.title)}</h2><p>${esc(data.other.body)}</p>${link("contact", esc(t("ui.contact")), "text-link", true)}</div></div></section>${related(["ceramiques-techniques", "industrie", "defense"])}${contactBand()}`;
}

function materialDetail(id) {
  const data = page(id);
  const table = content.materialTables[id];
  const units = ["%", "g/cm³", "%", "", "MPa·m½", "GPa", "MPa", "m/s", "W·m⁻¹·K⁻¹"];
  return `${pageHero(id)}<nav class="material-tabs" aria-label="${esc(t("ui.materials"))}"><div class="container">${materials.map(item => link(item, esc(title(item)), item === id ? "active" : "")).join("")}</div></nav><section class="section"><div class="container"><div class="material-formula material-heading-formula">${chemistry[materials.indexOf(id)]}</div><div class="material-editorial"><div>${sections(data.sections)}</div><aside class="application-list"><h3>${lang === "fr" ? "Applications industrielles" : "Industrial applications"}</h3>${bulletList(data.points)}</aside></div><h2 class="table-heading">${esc(t("ui.properties"))}</h2><div class="table-scroll" role="region" aria-label="${esc(t("ui.properties"))}" tabindex="0"><table><thead><tr><th scope="col">${esc(t("ui.property"))}</th><th scope="col">${esc(t("ui.unit"))}</th>${table.grades.map(grade => `<th scope="col">${esc(grade === "Porcelaine" ? title(id) : grade)}</th>`).join("")}</tr></thead><tbody>${table.values.map((values, i) => `<tr><th scope="row">${esc(t("ui.propertyLabels")[i])}</th><td>${esc(units[i])}</td>${values.map(value => `<td>${esc(value === "Selon grade" ? (lang === "fr" ? value : "Grade-dependent") : lang === "fr" ? value.replaceAll(".", ",") : value)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="technical-note">${esc(t("ui.tableNote"))}</p></div></section>${related(["ceramiques-techniques", "contact"])}${contactBand()}`;
}

function industrial() {
  return `${pageHero("outil-industriel")}<section class="industrial-photo">${picture("production", page("outil-industriel").title, "", true)}</section>${metrics()}${sites()}<section class="section"><div class="container"><div class="workshop-gallery"><figure data-reveal>${picture("hero", title("production"))}<figcaption>${link("production", esc(title("production")), "text-link", true)}</figcaption></figure><figure data-reveal>${picture("furnace", title("deliantage-frittage"))}<figcaption>${link("deliantage-frittage", esc(title("deliantage-frittage")), "text-link", true)}</figcaption></figure><figure data-reveal>${picture("screenprint", title("serigraphie"))}<figcaption>${link("serigraphie", esc(title("serigraphie")), "text-link", true)}</figcaption></figure></div></div></section>${related(["certifications", "etapes-process", "ajout-de-fonctions"])}${contactBand()}`;
}

function news(id) {
  return `${pageHero(id)}<section class="section"><div class="container">${id === "actualites" ? `<div class="news-grid">${groups[4].children.map(child => link(child, `${icon(child === "publications" ? "Download" : "MapPin")}<h2>${esc(title(child))}</h2><p>${esc(page(child).intro)}</p><span class="text-link">${esc(t("ui.discover"))}${icon("ArrowUpRight")}</span>`, "news-category")).join("")}</div>` : id === "publications" ? `<article class="publication" data-reveal><div class="publication-image">${picture("defense", title("defense"))}</div><div><p class="eyebrow">BSI · ${esc(t("ui.materials"))}</p><h2>${esc(page(id).sections[0].title)}</h2><p>${esc(page(id).sections[0].body)}</p><a class="button primary" href="${localURL("assets/protection-balistique.pdf")}" target="_blank" rel="noopener">${lang === "fr" ? "Consulter la brochure" : "View the brochure"}${icon("Download")}</a></div></article>` : `<div class="empty-state">${icon("MapPin")}<p>${esc(page(id).empty)}</p>${link("contact", esc(t("ui.contact")), "text-link", true)}</div>`}</div></section>${id !== "actualites" ? related(groups[4].children.filter(child => child !== id)) : ""}${contactBand()}`;
}

function contactBand() {
  return `<section class="contact-band"><div class="container" data-reveal><p class="eyebrow">Bernardaud Solutions Industrielles</p><div><h2>${esc(page("contact").title)}</h2>${link("contact", `<span class="sr-only">${esc(t("ui.contact"))}</span>${icon("ArrowUpRight")}`, "contact-arrow")}</div><p>${esc(page("contact").intro)}</p></div></section>`;
}

function contact() {
  const settings = content.settings;
  return `${pageHero("contact")}<section class="section contact-section"><div class="container contact-layout"><div class="contact-copy" data-reveal><h2>${esc(t("ui.contactDetails"))}</h2><p>${esc(t("ui.contactIntro"))}</p><a class="button primary" href="mailto:${esc(settings.contactEmail)}?subject=${encodeURIComponent(t("ui.contactSubject"))}">${esc(get("contact.button"))}${icon("Mail")}</a></div><div class="contact-details" data-reveal><div>${icon("Mail")}<div><span>${esc(t("ui.email"))}</span><a href="mailto:${esc(settings.contactEmail)}">${esc(settings.contactEmail)}</a></div></div><div>${icon("Phone")}<div><span>${esc(t("ui.phone"))}</span><a href="tel:${esc(settings.contactPhone.replace("(0)", "").replace(/[^+\d]/g, ""))}">${esc(settings.contactPhone)}</a></div></div><div>${icon("MapPin")}<div><span>${esc(t("ui.address"))}</span><p>${esc(settings.address)}</p></div></div></div></div></section><section class="contact-photo">${picture("industrial", lang === "fr" ? "La manufacture Bernardaud à Limoges" : "The Bernardaud manufacture in Limoges")}</section>`;
}

function renderFooter() {
  document.querySelector("#siteFooter").innerHTML = `<div class="container"><div class="footer-top"><div class="footer-brand">${picture("logo", content.settings.siteName)}<p>${esc(t("home.footerBaseline"))}</p><a class="text-link" href="mailto:${esc(content.settings.contactEmail)}">${esc(content.settings.contactEmail)}${icon("ArrowUpRight")}</a></div>${[groups[0], groups[2], groups[3]].map(group => `<div class="footer-column"><h3>${esc(title(group.id))}</h3>${group.children.map(id => link(id, esc(title(id)))).join("")}</div>`).join("")}</div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${esc(content.settings.siteName)}</span><div>${link("confidentialite", esc(t("ui.privacy")))}<button type="button" data-cookie-settings>${esc(t("ui.cookieSettings"))}</button><a href="/admin">${icon("LockKeyhole")}${esc(t("ui.admin"))}</a></div></div></div>`;
}

function renderRoute() {
  const id = currentId();
  if (id === "home") return home();
  if (!page(id)) return `<section class="section container not-found"><h1>${esc(t("ui.notFound"))}</h1>${link("home", esc(t("ui.backHome")), "button primary", true)}</section>`;
  if (id === "offre") return offer();
  if (id === "materiaux") return materialIndex();
  if (materials.includes(id)) return materialDetail(id);
  if (id === "marches") return `${pageHero(id)}<section class="section"><div class="container">${marketCards()}</div></section>${contactBand()}`;
  if (id === "outil-industriel") return industrial();
  if (id === "etapes-process") return manufacturingProcess();
  if (id === "production") return productionDetail();
  if (id === "deliantage-frittage") return thermalDetail();
  if (id === "serigraphie") return screenPrintingDetail();
  if (id === "traitements-de-surface") return surfaceTreatmentDetail();
  if (id === "defense") return detail(id, ballisticGallery());
  if (id === "actualites" || groups[4].children.includes(id)) return news(id);
  if (id === "contact") return contact();
  if (id === "confidentialite") return `${pageHero(id)}<section class="section container">${sections(page(id).sections)}<button type="button" class="button primary" data-cookie-settings>${esc(t("ui.cookieSettings"))}</button></section>`;
  if (id === "presentation" || ["historique", "actionnariat", "certifications", "partenaires"].includes(id)) return presentation(id);
  return detail(id);
}

function cookieBanner() {
  document.querySelector("[data-cookie-title]").textContent = get("cookies.title");
  document.querySelector("[data-cookie-body]").textContent = lang === "fr" ? "Nous conservons votre choix de langue et vos préférences sur cet appareil. Aucun traceur publicitaire ni outil de mesure d’audience n’est activé." : "We keep your language choice and preferences on this device. No advertising trackers or audience measurement tools are active.";
  document.querySelector('[data-cookie-choice="reject"]').textContent = get("cookies.reject");
  document.querySelector('[data-cookie-choice="accept"]').textContent = get("cookies.accept");
  document.querySelector("[data-cookie-policy]").textContent = t("ui.privacy");
  document.querySelector("#cookieBanner").hidden = Boolean(localStorage.getItem("bsi_cookie_choice"));
}

function setGroup(node, open) {
  node.dataset.open = String(open);
  node.querySelector(".nav-toggle").setAttribute("aria-expanded", String(open));
  node.querySelector(".mega-menu").hidden = !open;
}

function closeMenus() {
  document.querySelectorAll("[data-nav-group]").forEach(node => setGroup(node, false));
  document.querySelector(".language-trigger")?.setAttribute("aria-expanded", "false");
  const options = document.querySelector("#languageOptions");
  if (options) options.hidden = true;
}

function setMobileMenu(open) {
  const header = document.querySelector("#siteHeader");
  header.dataset.mobileOpen = String(open);
  const button = header.querySelector(".mobile-toggle");
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", t(open ? "ui.close" : "ui.menu"));
  button.innerHTML = icon(open ? "X" : "Menu");
  header.querySelector("#mainNav").inert = mobileViewport.matches && !open;
  document.body.classList.toggle("menu-open", open && mobileViewport.matches);
  document.querySelector("#app").inert = open && mobileViewport.matches;
  document.querySelector("#siteFooter").inert = open && mobileViewport.matches;
}

function bindHeader() {
  document.querySelectorAll("[data-nav-group]").forEach(node => {
    node.querySelector(".nav-toggle").addEventListener("click", event => {
      const open = !mobileViewport.matches && event.detail > 0 ? true : node.dataset.open !== "true";
      clearTimeout(menuTimer);
      closeMenus();
      setGroup(node, open);
    });
    node.addEventListener("pointerenter", event => {
      if (mobileViewport.matches || event.pointerType === "touch") return;
      clearTimeout(menuTimer);
      closeMenus();
      setGroup(node, true);
    });
    node.addEventListener("pointerleave", () => {
      if (!mobileViewport.matches) menuTimer = setTimeout(() => setGroup(node, false), 180);
    });
    node.addEventListener("focusout", event => {
      if (!node.contains(event.relatedTarget)) setGroup(node, false);
    });
  });
  document.querySelector(".language-trigger").addEventListener("click", event => {
    const open = event.currentTarget.getAttribute("aria-expanded") !== "true";
    closeMenus();
    event.currentTarget.setAttribute("aria-expanded", String(open));
    document.querySelector("#languageOptions").hidden = !open;
  });
  document.querySelector(".mobile-toggle").addEventListener("click", () => setMobileMenu(document.querySelector("#siteHeader").dataset.mobileOpen !== "true"));
}

function initMotion() {
  revealObserver?.disconnect();
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  const nodes = document.querySelectorAll("[data-reveal]");
  revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  }), { threshold: 0.08 });
  nodes.forEach(node => {
    node.classList.add("reveal");
    node.style.setProperty("--reveal-delay", `${Math.min([...node.parentElement.children].indexOf(node) * 65, 195)}ms`);
    revealObserver.observe(node);
  });
}

function updateScroll() {
  const header = document.querySelector("#siteHeader");
  header.dataset.scrolled = String(window.scrollY > 20);
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  header.style.setProperty("--scroll", distance > 0 ? Math.min(window.scrollY / distance, 1) : 0);
  if (!reducedMotion.matches) {
    const hero = document.querySelector(".hero-photo");
    if (hero && window.scrollY < window.innerHeight) hero.style.setProperty("--parallax", `${Math.min(window.scrollY * 0.12, 85)}px`);
  }
}

function render() {
  clearTimeout(menuTimer);
  document.body.classList.remove("menu-open");
  document.querySelector("#siteHeader").dataset.mobileOpen = "false";
  document.querySelector("#app").inert = false;
  document.querySelector("#siteFooter").inert = false;
  document.documentElement.lang = lang;
  document.title = `${currentId() === "home" ? "" : `${page(currentId())?.title || t("ui.notFound")} | `}${content.settings.siteName}`;
  document.querySelector('meta[name="description"]').content = currentId() === "home" ? t("home.intro") : page(currentId())?.intro || content.settings.baseline;
  renderHeader();
  document.querySelector("#app").innerHTML = renderRoute();
  renderFooter();
  if (staticPreview) document.querySelector('#siteFooter a[href="/admin"]')?.remove();
  document.querySelector("[data-cookie-policy]").href = localURL("confidentialite/");
  document.querySelectorAll('a[href="/assets/protection-balistique.pdf"]').forEach(anchor => { anchor.href = localURL("assets/protection-balistique.pdf"); });
  cookieBanner();
  bindHeader();
  initMotion();
  updateScroll();
}

document.addEventListener("click", event => {
  const language = event.target.closest("[data-lang]");
  if (language && content) {
    lang = language.dataset.lang;
    localStorage.setItem("bsi_lang", lang);
    render();
    document.querySelector(".language-trigger").focus();
    return;
  }
  const choice = event.target.closest("[data-cookie-choice]");
  if (choice) {
    localStorage.setItem("bsi_cookie_choice", choice.dataset.cookieChoice);
    document.querySelector("#cookieBanner").hidden = true;
    return;
  }
  if (event.target.closest("[data-cookie-settings]")) {
    document.querySelector("#cookieBanner").hidden = false;
    document.querySelector("#cookieBanner button").focus();
    return;
  }
  const anchor = event.target.closest("a");
  if (anchor && !event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0 && !anchor.target && !anchor.download) {
    const url = new URL(anchor.href, location.href);
    if (url.origin === location.origin && url.pathname.startsWith(basePath) && !url.pathname.startsWith(localURL("assets/")) && url.pathname !== localURL("admin") && !url.hash && content) {
      event.preventDefault();
      history.pushState({}, "", url.pathname);
      window.scrollTo({ top: 0, behavior: "instant" });
      render();
      document.querySelector("#app").focus({ preventScroll: true });
      return;
    }
  }
  if (!event.target.closest(".nav-group, .language-control")) closeMenus();
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  const expanded = document.querySelector('.nav-toggle[aria-expanded="true"], .language-trigger[aria-expanded="true"]');
  closeMenus();
  if (document.querySelector("#siteHeader").dataset.mobileOpen === "true") {
    setMobileMenu(false);
    document.querySelector(".mobile-toggle").focus();
  } else expanded?.focus();
});

window.addEventListener("popstate", () => { if (content) render(); });
window.addEventListener("scroll", updateScroll, { passive: true });
mobileViewport.addEventListener("change", () => { if (content) { closeMenus(); setMobileMenu(false); } });
reducedMotion.addEventListener("change", () => { if (content) render(); });

async function load() {
  try {
    const response = await fetch(new URL(staticPreview ? "content.json" : "api/content", appURL), { cache: "no-cache" });
    if (!response.ok) throw new Error("Content unavailable");
    content = await response.json();
    const saved = localStorage.getItem("bsi_lang");
    lang = ["fr", "en"].includes(saved) ? saved : navigator.language?.startsWith("en") ? "en" : content.settings.defaultLang;
    render();
  } catch {
    document.querySelector("#app").innerHTML = '<section class="section container not-found"><h1>Le contenu n’a pas pu être chargé.</h1><button class="button primary" type="button" id="retryLoad">Réessayer</button></section>';
    document.querySelector("#retryLoad").addEventListener("click", load);
  }
}
load();
