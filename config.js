// Værkstedets oplysninger. Ret her – resten af appen henter alt herfra.
// Tomme felter ("") vises som "mangler" i appen, og knappen virker ikke før de er udfyldt.
window.VAERKSTED = {
  navn: "Pladesmeden Bjergby",
  slogan: "Professionelt pladearbejde med sans for detaljen",

  telefon: "",            // fx "+45 12 34 56 78"
  email: "",              // fx "kontakt@pladesmeden.dk" – bestillinger sendes hertil

  adresse: "",            // fx "Bjergbyvej 1, 9800 Hjørring" – bruges til GPS
  // Valgfrit: præcis placering (fra Google Maps: højreklik på stedet → kopier tal).
  // Hvis udfyldt, bruges de i stedet for adressen, og der vises kort og afstand.
  lat: null,              // fx 57.4
  lon: null,              // fx 9.97

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
