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

  $("bestilForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const fejl = $("fejl");
    if (!f.navn.trim() || !f.telefon.trim()) {
      fejl.textContent = "Skriv venligst navn og telefonnummer, så vi kan vende tilbage.";
      fejl.classList.remove("hidden");
      return;
    }
    if (!V.email) {
      fejl.textContent = "Værkstedets mailadresse er ikke sat op endnu – ring i stedet.";
      fejl.classList.remove("hidden");
      return;
    }
    fejl.classList.add("hidden");
    const dato = f.dato ? new Date(f.dato + "T12:00").toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Hurtigst muligt";
    const emne = `Tidsbestilling: ${f.opgave} – ${f.navn.trim()}`;
    const tekst = [
      "Hej Pladesmeden",
      "",
      "Jeg vil gerne bestille tid.",
      "",
      `Navn: ${f.navn.trim()}`,
      `Telefon: ${f.telefon.trim()}`,
      `Bil: ${f.bil.trim() || "-"}`,
      `Nummerplade: ${pladeFormat(f.plade) || "-"}`,
      `Opgave: ${f.opgave}`,
      `Ønsket dato: ${dato}`,
      "",
      "Beskrivelse:",
      f.beskrivelse.trim() || "-",
      "",
      "Venlig hilsen",
      f.navn.trim(),
    ].join("\n");
    visMailValg(emne, tekst);
  });

  // Send med telefonens mail-app, eller kopiér teksten. (Gmail/Outlook på nettet kan ikke udfylde mailen
  // på en telefon, app-links fejlede i Edge, og direkte afsendelse via FormSubmit blev fravalgt.)
  function visMailValg(emne, tekst) {
    $("mailStandard").href = `mailto:${V.email}?subject=${encodeURIComponent(emne)}&body=${encodeURIComponent(tekst)}`;
    $("mailKopier").onclick = async () => {
      const alt = `Til: ${V.email}\nEmne: ${emne}\n\n${tekst}`;
      try {
        await navigator.clipboard.writeText(alt);
        $("kopieret").textContent = `Kopieret! Sæt teksten ind i en mail til ${V.email}.`;
      } catch {
        $("kopieret").textContent = `Kunne ikke kopiere. Skriv til ${V.email}.`;
      }
      $("kopieret").classList.remove("hidden");
    };
    $("kopieret").classList.add("hidden");
    $("mailValg").classList.remove("hidden");
    $("mailValg").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  $("mailLuk").addEventListener("click", () => $("mailValg").classList.add("hidden"));

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
