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

  aabningstider: [
    ["Mandag–torsdag", "7.00–16.00"],
    ["Fredag", "7.00–14.00"],
    ["Lørdag–søndag", "Lukket"],
  ],

  ydelser: [
    "Rustreparation",
    "Buler og pladeskader",
    "Svejsning",
    "Restaurering af klassiske biler",
    "Klargøring til syn",
  ],
};
