// Værkstedets oplysninger. Ret her – resten af appen henter alt herfra.
// Tomme felter ("") vises som "mangler" i appen, og knappen virker ikke før de er udfyldt.
window.VAERKSTED = {
  navn: "Pladesmeden Bjergby",
  slogan: "Professionelt pladearbejde med sans for detaljen",

  kontakt: "Frank Rasmussen",
  cvr: "44777819",

  telefon: "20 44 78 24",
  email: "pladesmeden.bjergby@gmail.com",   // bestillinger sendes hertil

  adresse: "Houmarksvej 130, 8981 Spentrup", // bruges til GPS
  // Præcis placering (fra OpenStreetMap). Bruges til vejvisning, kort og afstand.
  lat: 56.523765,
  lon: 9.989328,

  beskrivelse: "Vi udfører al slags rustarbejde, opretning og udskiftning af karosseridele.",

  // Tom liste = "Efter aftale" vises. Fx [["Mandag–fredag", "7.00–16.00"], ["Weekend", "Lukket"]]
  aabningstider: [
    ["Mandag–fredag", "7.00–16.00"],
    ["Lørdag–søndag", "Lukket"],
  ],

  ydelser: [
    "Rustarbejde",
    "Opretning",
    "Udskiftning af karosseridele",
  ],
};
