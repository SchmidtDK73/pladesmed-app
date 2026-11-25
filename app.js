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
    $("mailValg").classList.add("hidden");
  });

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
      `Hej ${V.kontakt || "Pladesmeden"}`,
      "",
      "Jeg vil gerne bestille tid.",
      "",
      `Navn: ${f.navn.trim()}`,
      `Telefon: ${f.telefon.trim()}`,
      `Bil: ${f.bil.trim() || "-"}`,
      `Nummerplade: ${pladeFormat(f.plade) || "-"}`,
      `Opgave: ${f.opgave}`,
      `Ønsket dato: ${dato}`,
      ...(billeder.length ? [`Billeder: ${billeder.length} vedhæftet`] : []),
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
  // Med billeder bruges telefonens Del-menu (mailto kan ikke vedhæfte filer).
  function visMailValg(emne, tekst) {
    const alt = `Til: ${V.email}\nEmne: ${emne}\n\n${tekst}`;
    const kanDele = billeder.length > 0 && navigator.canShare && navigator.canShare({ files: billeder });
    const del = $("mailDel");
    del.classList.toggle("hidden", !kanDele);
    if (kanDele) {
      del.onclick = async () => {
        try {
          await navigator.share({ files: billeder, title: emne, text: alt });
        } catch (err) {
          if (err.name !== "AbortError") alert("Billederne kunne ikke deles. Brug 'Åbn i mail' og vedhæft dem selv.");
        }
      };
    }
    $("mailHjaelp").textContent = kanDele
      ? `Tryk "Send med billeder", vælg Mail, og skriv ${V.email} som modtager.`
      : billeder.length
        ? "Mailen er skrevet færdig – husk at vedhæfte billederne, før du trykker send."
        : "Mailen er skrevet færdig – du skal bare trykke send.";
    $("mailStandard").textContent = kanDele ? "Åbn i mail uden billeder" : "Åbn i mail";
    $("mailStandard").href = `mailto:${V.email}?subject=${encodeURIComponent(emne)}&body=${encodeURIComponent(tekst)}`;
    $("mailKopier").onclick = async () => {
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
