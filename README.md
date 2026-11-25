# Pladesmeden Bjergby

Webapp (PWA) til kunder hos Pladesmeden Bjergby. Ren HTML/CSS/JS – ingen build-trin.

- **Bestil tid**: formular, der sender bestillingen direkte til værkstedets mail via FormSubmit (formsubmit.co). Skal aktiveres én gang: første bestilling udløser en aktiveringsmail til værkstedets Gmail. Fejler afsendelsen, kan kunden bruge sin egen mail i stedet.
- **Ring til os**: ringer direkte op.
- **Find vej**: åbner GPS-vejvisning i Apple Kort eller Google Maps (og viser kort og afstand, hvis koordinater er sat).

## Ret oplysninger

Alt om værkstedet (telefon, mail, adresse, åbningstider, ydelser) står i `config.js`.
Hæv `VERSION` i `sw.js`, når filer ændres.

## Kør lokalt

```bash
python3 -m http.server 8791
```

Åbn http://localhost:8791.

## Læg på iPhone

Appen ligger på GitHub Pages. Åbn adressen i Safari og vælg Del → "Føj til hjemmeskærm".

## Ikoner

`swift tools/make_icons.swift <logo-fil>` laver `icons/icon-*.png` ud fra bilen i logoet.

## QR-kode

`qr/pladesmeden-qr.png` peger på appen. Logoet sidder i midten. Lav en ny med `swift tools/make_qr.swift <adresse> qr/pladesmeden-qr.png icons/logo.png`.
