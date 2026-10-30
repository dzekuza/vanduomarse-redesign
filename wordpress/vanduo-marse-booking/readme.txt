=== Vanduo Marse rezervacijos ===
Requires at least: 6.1
Requires PHP: 7.4
Stable tag: 1.2.0
License: GPL-2.0-or-later

Vanduo Marse rezervacijų formos (pirtis, keturračiai, nameliai, renginiai, kuponai) WordPress svetainėje.

== Description ==

Formos lieka Vanduo Marse sistemoje (Next.js): įskiepis rodo jos /embed/* puslapius
iframe lange ir pritaiko aukštį pagal turinį. Kainos, užimtumas ir užklausos visada
ateina iš sistemos, todėl pakeitus kainas /admin, WordPress nieko keisti nereikia.

Trys būdai įdėti formą:

* Blokas „Vanduo Marse rezervacija“ (Gutenberg)
* Valdiklis „Vanduo Marse rezervacija“ (Išvaizda → Valdikliai)
* Trumpasis kodas: [vm_booking type="pirtis"]

Tipai: pirtis, keturraciai, miegas, renginiai, kuponai.
Skirtukai: pirtis → tab="renginiai", keturraciai → tab="zygiai".

Plotis: forma užima visą bloko, stulpelio ar šoninės juostos plotį ir prisitaiko prie jo
(veikia nuo ~285 px). Bloke galima rinktis „Platus“ ar „Visas plotis“ lygiavimą.

Išvaizda: Nustatymai → Vanduo Marse → „Išvaizda“: fono, turinio, suvestinės,
teksto, akcento ir skirtukų spalvos, teksto ir antraščių šriftai (Google Fonts),
antraščių raidės. Apačioje yra gyva peržiūra.

== Installation ==

1. Supakuokite aplanką vanduo-marse-booking į zip ir įkelkite: Įskiepiai → Pridėti → Įkelti.
2. Sistemos adresas pagal nutylėjimą https://vanduomarse-redesign.vercel.app; kitą (pvz. savo domeną) galima nurodyti Nustatymai → Vanduo Marse.
3. Sistemos aplinkos kintamajame EMBED_ALLOWED_ORIGINS nurodykite šios svetainės adresą
   (pvz. https://vanduomarse.lt). Be jo naršyklė formos neparodys.
