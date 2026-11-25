// Pladesmeden Bjergby – bestil tid (mail), ring og find vej (GPS).
(() => {
  const V = window.VAERKSTED;
  const $ = (id) => document.getElementById(id);
  const harSted = V.lat != null && V.lon != null;

  // Hvad mangler i config.js?
  const mangler = [];
  if (!V.telefon) mangler.push("telefonnummer");
  if (!V.email) mangler.push("mailadresse");
  if (!V.adresse && !harSted) mangler.push("adresse");
  if (mangler.length) {
    $("mangler").textContent = `Appen er ikke færdig: ${mangler.join(", ")} mangler i config.js.`;
    $("mangler").classList.remove("hidden");
  }

  // Ring
  const ring = $("ringBtn");
  if (V.telefon) {
    ring.href = "tel:" + V.telefon.replace(/[^\d+]/g, "");
    $("ringTekst").textContent = V.telefon;
  } else {
    ring.classList.add("slaaet-fra");
    $("ringTekst").textContent = "Nummer mangler";
  }

  // Vis/skjul panelerne Bestil tid og Find vej
  document.querySelectorAll("[data-vis]").forEach((knap) => {
    knap.addEventListener("click", () => {
      const panel = $(knap.dataset.vis);
      const aaben = panel.classList.contains("hidden");
      document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
      document.querySelectorAll("[data-vis]").forEach((k) => k.classList.remove("aktiv"));
      if (aaben) {
        panel.classList.remove("hidden");
        knap.classList.add("aktiv");
        if (knap.dataset.vis === "vej") visAfstand();
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Bestil tid
  const opgave = $("opgave");
  [...V.ydelser, "Andet"].forEach((y) => opgave.add(new Option(y, y)));
  $("dato").min = new Date().toISOString().slice(0, 10);

  // Nummerplade: store bogstaver og dansk opstilling "AB 12 345" (ønskeplader bevares som skrevet)
  const pladeFormat = (s) => {
    const r = s.toUpperCase().replace(/[\s-]+/g, "");
    return /^[A-ZÆØÅ]{2}\d{5}$/.test(r) ? `${r.slice(0, 2)} ${r.slice(2, 4)} ${r.slice(4)}` : s.trim().toUpperCase();
  };
  const pladeFelt = document.querySelector('[name="plade"]');
  pladeFelt.addEventListener("blur", () => { pladeFelt.value = pladeFormat(pladeFelt.value); });

  // Billeder: gøres mindre (maks 1600 px, JPEG), så mailen ikke bliver for tung
  const MAKS_BILLEDER = 6;
  let billeder = [];
  async function formindsk(fil, nr) {
    try {
      const bmp = await createImageBitmap(fil);
      const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * s);
      c.height = Math.round(bmp.height * s);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
      return blob ? new File([blob], `skade-${nr}.jpg`, { type: "image/jpeg" }) : fil;
    } catch {
      return fil;
    }
  }
  function visMiniaturer() {
    const boks = $("miniaturer");
    boks.querySelectorAll("img").forEach((i) => URL.revokeObjectURL(i.src));
    boks.innerHTML = "";
    billeder.forEach((fil, i) => {
      const d = document.createElement("div");
      d.className = "mini";
      const img = document.createElement("img");
      img.src = URL.createObjectURL(fil);
      img.alt = `Billede ${i + 1}`;
      const x = document.createElement("button");
      x.type = "button";
      x.textContent = "×";
      x.setAttribute("aria-label", "Fjern billede");
      x.onclick = () => { billeder.splice(i, 1); visMiniaturer(); };
      d.append(img, x);
      boks.append(d);
    });
    const info = $("billedInfo");
    info.textContent = billeder.length ? `${billeder.length} billede${billeder.length > 1 ? "r" : ""} valgt` : "";
    info.classList.toggle("hidden", !billeder.length);
  }
  $("billedInput").addEventListener("change", async (e) => {
    const nye = [...e.target.files].filter((f) => f.type.startsWith("image/") || !f.type);
    e.target.value = "";
    const plads = MAKS_BILLEDER - billeder.length;
    if (nye.length > plads) alert(`Du kan højst sende ${MAKS_BILLEDER} billeder.`);
    $("billedInfo").textContent = "Gør billederne klar …";
    $("billedInfo").classList.remove("hidden");
    for (const f of nye.slice(0, plads)) billeder.push(await formindsk(f, billeder.length + 1));
    visMiniaturer();
  });

  // Send direkte til værkstedet via FormSubmit (almindelig formular-afsendelse, som understøtter vedhæftede filer).
  // FormSubmit sender en mail til V.email og sender kunden tilbage til appen med ?sendt=1.
  // Første gang skal værkstedet aktivere formularen via et link i en mail fra FormSubmit.
  if (V.telefon) {
    $("ringHellere").innerHTML = `Vil du hellere snakke? Ring på <a href="tel:${V.telefon.replace(/[^\d+]/g, "")}">${V.telefon}</a>.`;
  }
  $("bestilForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const fejl = $("fejl");
    const visFejl = (t) => { fejl.textContent = t; fejl.classList.remove("hidden"); };
    if (!f.navn.trim() || !f.telefon.trim()) return visFejl("Skriv venligst navn og telefonnummer, så vi kan vende tilbage.");
    if (f.email.trim() && !e.target.email.checkValidity()) return visFejl("Mailadressen ser ikke rigtig ud.");
    if (!V.email) return visFejl("Værkstedets mailadresse er ikke sat op endnu – ring i stedet.");
    const total = billeder.reduce((s, b) => s + b.size, 0);
    if (total > 9.5 * 1024 * 1024) return visFejl("Billederne fylder for meget. Fjern et eller to, og prøv igen.");
    fejl.classList.add("hidden");

    const dato = f.dato ? new Date(f.dato + "T12:00").toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Hurtigst muligt";
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `https://formsubmit.co/${V.email}`;
    form.enctype = "multipart/form-data";
    form.hidden = true;
    const felt = (navn, vaerdi) => {
      const i = document.createElement("input");
      i.type = "hidden";
      i.name = navn;
      i.value = vaerdi;
      form.append(i);
    };
    felt("_subject", `Tidsbestilling: ${f.opgave} – ${f.navn.trim()}`);
    felt("_template", "table");
    felt("_captcha", "false");
    felt("_next", `${location.origin}${location.pathname}?sendt=1`);
    felt("Navn", f.navn.trim());
    felt("Telefon", f.telefon.trim());
    if (f.email.trim()) felt("email", f.email.trim()); // FormSubmit bruger feltet "email" som Svar-til
    felt("Bil", f.bil.trim() || "-");
    felt("Nummerplade", pladeFormat(f.plade) || "-");
    felt("Opgave", f.opgave);
    felt("Ønsket dato", dato);
    felt("Beskrivelse", f.beskrivelse.trim() || "-");
    let medBilleder = 0;
    try {
      billeder.forEach((fil, i) => {
        const dt = new DataTransfer();
        dt.items.add(fil);
        const inp = document.createElement("input");
        inp.type = "file";
        inp.name = `Billede ${i + 1}`;
        inp.files = dt.files;
        form.append(inp);
        medBilleder++;
      });
    } catch {
      // Meget gamle browsere kan ikke lægge billeder i en formular – så sendes teksten alene
    }
    felt("Billeder", medBilleder ? `${medBilleder} vedhæftet` : billeder.length ? "Kunne ikke vedhæftes" : "Ingen");
    $("sendKnap").disabled = true;
    $("sendKnap").textContent = "Sender …";
    document.body.append(form);
    form.submit();
  });

  // Tilbage fra FormSubmit: vis tak og fjern ?sendt=1 fra adressen
  if (new URLSearchParams(location.search).has("sendt")) {
    $("tak").classList.remove("hidden");
    history.replaceState(null, "", location.pathname);
  }
  // Hvis man trykker Tilbage fra FormSubmit-siden, skal knappen virke igen
  window.addEventListener("pageshow", () => {
    $("sendKnap").disabled = false;
    $("sendKnap").textContent = "Send forespørgsel";
  });

  // Find vej
  const maal = harSted ? `${V.lat},${V.lon}` : V.adresse;
  $("adresseTekst").textContent = V.adresse || (harSted ? "" : "Adresse mangler");
  if (maal) {
    $("appleKort").href = `https://maps.apple.com/?daddr=${encodeURIComponent(maal)}&dirflg=d`;
    $("googleKort").href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(maal)}&travelmode=driving`;
  } else {
    document.querySelectorAll(".vejknap").forEach((a) => a.classList.add("hidden"));
  }
  if (harSted) {
    const d = 0.01;
    const k = $("kort");
    k.src = `https://www.openstreetmap.org/export/embed.html?bbox=${V.lon - d * 2},${V.lat - d},${V.lon + d * 2},${V.lat + d}&layer=mapnik&marker=${V.lat},${V.lon}`;
    k.classList.remove("hidden");
  }

  let afstandVist = false;
  function visAfstand() {
    if (!harSted || afstandVist || !navigator.geolocation) return;
    afstandVist = true;
    navigator.geolocation.getCurrentPosition((p) => {
      const km = afstandKm(p.coords.latitude, p.coords.longitude, V.lat, V.lon);
      const el = $("afstand");
      el.textContent = `Du er ca. ${km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km)} km fra værkstedet (i luftlinje).`;
      el.classList.remove("hidden");
    }, () => {}, { timeout: 10000, maximumAge: 300000 });
  }
  function afstandKm(a1, o1, a2, o2) {
    const r = Math.PI / 180, R = 6371;
    const x = Math.sin((a2 - a1) * r / 2) ** 2 + Math.cos(a1 * r) * Math.cos(a2 * r) * Math.sin((o2 - o1) * r / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  // Åbningstider og ydelser
  $("tider").innerHTML = "";
  if (!V.aabningstider.length) {
    const p = document.createElement("p");
    p.className = "efter-aftale";
    p.textContent = "Efter aftale – ring eller bestil tid.";
    $("tider").replaceWith(p);
  }
  V.aabningstider.forEach(([dag, tid]) => {
    const tr = $("tider").insertRow();
    tr.insertCell().textContent = dag;
    tr.insertCell().textContent = tid;
  });
  V.ydelser.forEach((y) => {
    const li = document.createElement("li");
    li.textContent = y;
    $("ydelser").append(li);
  });

  if (V.beskrivelse) $("beskrivelse").textContent = V.beskrivelse;

  const fod =[V.navn, V.kontakt, V.adresse, V.cvr && "CVR " + V.cvr].filter(Boolean).join(" · ");
  $("fod").textContent = fod;

  // Læg appen på hjemmeskærmen. Android/Chrome/Edge: rigtig installér-dialog. iPhone: vejledning (ingen dialog findes).
  const erApp = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  let installer = null;
  if (!erApp) $("hjem").classList.remove("hidden");
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installer = e; });
  window.addEventListener("appinstalled", () => $("hjem").classList.add("hidden"));
  $("hjemKnap").addEventListener("click", async () => {
    if (installer) {
      installer.prompt();
      await installer.userChoice;
      installer = null;
      return;
    }
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const hjaelp = $("hjemHjaelp");
    hjaelp.innerHTML = ios
      ? /CriOS|EdgiOS|FxiOS/.test(ua)
        ? "Tryk på <b>Del</b>-ikonet <b>⬆︎</b> (i Edge og Chrome sidder det i adresselinjen eller under menuen <b>•••</b>), og vælg <b>Føj til hjemmeskærm</b>."
        : "Tryk på <b>Del</b>-ikonet <b>⬆︎</b> nederst i Safari, og vælg <b>Føj til hjemmeskærm</b>."
      : /Android/.test(ua)
        ? "Tryk på menuen <b>⋮</b> i browseren, og vælg <b>Installer app</b> eller <b>Føj til startskærm</b>."
        : "Åbn browserens menu, og vælg <b>Installer app</b> – eller åbn siden på din telefon.";
    hjaelp.classList.toggle("hidden");
  });

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    // Når en ny version af appen tager over, genindlæses siden én gang, så den nye version vises med det samme
    const havdeGammel = !!navigator.serviceWorker.controller;
    let genindlaest = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (havdeGammel && !genindlaest) { genindlaest = true; location.reload(); }
    });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => reg.update());
  }
})();
