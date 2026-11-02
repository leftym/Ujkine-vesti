# Feed check

Run: 2026-11-02T21:21:36.125Z

| Outlet | OK | Items | Feed used | With image | Ads flagged |
|---|---|---|---|---|---|
| N1 | yes | 50 | https://n1info.rs/feed/ | 50 | 2 |
| Nova.rs | yes | 50 | https://nova.rs/feed/ | 50 | 1 |
| B92 | yes | 80 | https://www.b92.net/feed/ + https://www.b92.net/info/rss/vesti.xml + https://www.b92.net (homepage, +74) | 27 | 0 |
| Blic | yes | 70 | https://www.blic.rs/rss/danasnje-vesti | 70 | 0 |
| Politika | yes | 20 | https://www.politika.rs/rss | 20 | 0 |
| RTS | yes | 20 | https://www.rts.rs/vesti/rss.html | 20 | 0 |

## N1
Categories: {"drustvo":9,"ostalo":6,"svet":5,"region":4,"zivot":4,"politika":14,"ekonomija":7,"hronika":1}
- [drustvo] Studenti u blokadi: Očekujemo obustavu radova na brzoj pruzi kroz Pantelej u Nišu
- [ostalo] Statistics office: Serbia’s GDP growth at 4% in Q3
- [svet] Netanjahu otvoren za formiranje "široke nacionalne vlade", pod uslovom da on bude na čelu
- [region] Naloženo blokiranje još 104 veb-stranice za igre na sreću u S. Makedoniji
- [ostalo] Utisak nedelje: Ognjen Radonjić, Vuk Cvijić, Vida Petrović Škero (1.11.2026)
- [drustvo] Stamenković: Komisija Vrhovnog tužilaštva preuzela predmete o postupanju Krička prema studentima
  - flagged (self): Studio live, utorak u 12h: Vučićeva pomilovanja https://n1info.rs/najave-emisija/studio-live-utorak-u-12h-macura-zadrzan-u-policiji-a-gde-je-45-milijardi-dinara/
  - flagged (self): Gledajte Dnevnik u 19h https://n1info.rs/najave-emisija/gledajte-uzivo-dnevnik-u-19-ponedeljak-19-maj/

Uncategorized sample (for tuning):
- Statistics office: Serbia’s GDP growth at 4% in Q3 | https://n1info.rs/english/news/statistics-office-serbias-gdp-growth-at-4-in-q3/ | tags: ["News","economy","gdp","rzs"]
- Utisak nedelje: Ognjen Radonjić, Vuk Cvijić, Vida Petrović Škero (1.11.2026) | https://n1info.rs/video/utisak-nedelje-ognjen-radonjic-vuk-cvijic-vida-petrovic-skero-1112026/ | tags: ["Video","utisak video","utisak nedelje","video"]
- Macron congratulates Srdanovic on election victory | https://n1info.rs/english/news/macron-congratulates-srdanovic-on-election-victory/ | tags: ["News","ilija srdanovic","france","2026 elections","emmanuel macron","student list"]
- Dnevnik u 19 (01.11.2026) | https://n1info.rs/video/dnevnik/dnevnik-u-19-01-novembar-2026/ | tags: ["Dnevnik","dnevnik u 19","najvažnije vesti","vesti dana","dnevnik 19","dnevnik"]
- Gledajte Dnevnik u 19h | https://n1info.rs/najave-emisija/gledajte-uzivo-dnevnik-u-19-ponedeljak-19-maj/ | tags: ["Najave emisija","najave emisija"]
- ANEM: 111 attacks on journalists this year, just three convictions | https://n1info.rs/english/news/anem-111-attacks-on-journalists-this-year-just-three-convictions/ | tags: ["News","convictions","anem","attacks on journalists"]

## Nova.rs
Categories: {"sport":11,"politika":4,"zabava":12,"hronika":9,"zivot":1,"svet":1,"ekonomija":5,"drustvo":5,"ostalo":1,"kultura":1}
- [sport] VIDEO Užas u Španiji: Fudbaler nakon starta golmana u komi, doktori mu se bore za život
- [politika] Kako je lista Usamea Zukorlića za 12 glasova "otela" mandat Studentskoj listi: Izveštaj Crte i zapisnik s jednog biračkog mesta sve govore
- [zabava] Mišo Kovač ženio se tri puta, a jedna tragedija mu je promenila život: "Četiri godine sam bio polumrtav, ležao nakljukan sedativima ili sam bio na groblju"
- [hronika] Stamenković: Komisija Vrhovnog tužilaštva preuzela predmete o postupanju Kričaka prema studentima
- [sport] "Naš klub ne zaboravlja ko je bio uz naše šampione": Nova dobila podršku u borbi za spas novina
- [hronika] Studentkinja Nikolina Sinđelić više od godinu dana nije saslušana po prijavi protiv Marka Kričaka
  - flagged (self): Gledajte uživo Dnevnik TV Nova https://nova.rs/vesti/drustvo/gledajte-uzivo-dnevnik-tv-nova-02-11-2026/

Uncategorized sample (for tuning):
- Dnevnik - Cela emisija - 1.11.2026. | https://nova.rs/emisije/dnevnik-cela-emisija-1112026/ | tags: ["Emisije","dnevnik cela emisija"]

## B92
Categories: {"svet":10,"kultura":7,"zdravlje":6,"sport":12,"zivot":17,"ekonomija":9,"tehnologija":5,"hronika":3,"ostalo":7,"drustvo":1,"politika":2,"region":1}
- [svet] Strašne eksplozije odjekuju; Tamanjenje dronova; Masovno odlaze – ne žele da ginu FOTO/VIDEO
- [kultura] Ko će biti novi Džejms Bond? Tri glumca u trci, četvrti kandidat obavijen velom misterije
- [svet] Zelenski: "Predložili smo deeskalaciju, ali Rusija nastavlja da ubija ljude"
- [zdravlje] Beli ili zeleni čaj: Koji je bolji za zdravlje i zašto ih stručnjaci posebno izdvajaju?
- [kultura] Istorijski uspeh Kristofera Nolana: "Odiseja" ušla među najuspešnije filmove svih vremena VIDEO
- [sport] Karlik: "Razumem navijače i ljubav prema Željku, ali nismo ga mi izbacili"

Uncategorized sample (for tuning):
- Šest nedelja od porođaja zasijala je u donjem vešu, pa poručila: "Ušivali su jastučiće u moje grudnjake" FOTO | https://superzena.b92.net/zivoti-poznatih/aktuelno/281682/barbara-palvin-o-povratku-na-pistu-sest-nedelja-nakon-porodjaja/vest | tags: ["Najnovije"]
- Novembar neće biti običan mesec: Jednom znaku donosi emotivne obrte i važne lekcije | https://superzena.b92.net/astro/aktuelno/281671/jedan-horoskopski-znak-u-novembru-dobija-nove-prilike-i-izazove/vest | tags: []
- Koja kola voze CS2 profesionalci? | https://www.b92.net/esports/cs2/281551/koja-kola-voze-cs2-profesionalci/vest | tags: []
- Spojila horor i seksepil: Zgodna Albanka u svom najizazovnijem izdanju FOTO | https://superzena.b92.net/zivoti-poznatih/aktuelno/281554/dua-lipa-za-noc-vestica-bila-nikad-izazovnija/vest | tags: []
- Lepa milijarderka zabrinula ljude: "Sama kost i koža, dajte joj nešto da jede" FOTO | https://superzena.b92.net/zivoti-poznatih/aktuelno/281561/nikola-pelc-ponovo-na-udaru-zbog-mrsavog-izgleda/vest | tags: []
- Da li znate šta je "teorija kutija"? Muškarci imaju ove tri kategorije za žene | https://superzena.b92.net/ljubav-i-strast/veze-i-odnosi/281658/sta-je-teorija-kutija/vest | tags: ["Najnovije"]
- Najseksi voditeljka opet mami uzdahe na terenu: "Kraljica se vratila" FOTO/VIDEO | https://superzena.b92.net/zivoti-poznatih/aktuelno/281640/dileta-leota-noc-vestica-proslavila-na-terenu-i-odusevila-izgledom/vest | tags: []

## Blic
Categories: {"zabava":25,"zdravlje":2,"hronika":6,"svet":8,"drustvo":5,"zivot":9,"politika":5,"ekonomija":8,"kultura":2}
- [zabava] PEVAČICA PROSLAVILA 45. ROĐENDAN Zbog ljubavi otišla iz Srbije, pa usledio razvod: "Nismo se razišli prijateljski"
- [zabava] (VIDEO) "OTKRIVAJU MI POČETAK KANCERA MATERICE, A JA BEBU U STOMAKU" Ivana Šašić u suzama o najtežim borbama: "Imala sam dva carska i jednu operaciju za 10 meseci"
- [zdravlje] Naučnici prvi put detaljno mapirali nerve klitorisa i došli do novog otkrića koje ih iznenadilo
- [zabava] SIN ODBIO DA BUDE UZ MELINU NA NJEN POSEBAN DAN Ovo je kap koja je prelila čašu između njih: "Meni je stvarno žao, imam grižu savesti", Harisova bivša je ovako pričala o deci
- [hronika] (FOTO) AKO JE VIDITE, ZOVITE POLICIJU - SLEDI I NAGRADA! Nišlijka sa misterioznim tetovažama krije tajnu plena od 40 MILIONA EVRA: Holandska policija nudi bogatstvo, a poslednji put je viđena u OVOM GRADU
- [svet] HOĆE LI UKRAJINA OSTATI BEZ AMERIČKE PODRŠKE? Tramp pojačava pritisak, izbori donose prekretnicu

## Politika
Categories: {"hronika":1,"svet":6,"ostalo":4,"sport":2,"politika":5,"kultura":2}
- [hronika] Komisija Vrhovnog tužilaštva preuzela predmete o postupanju Kričaka prema studentima
- [svet] AfD najavljuje veliki energetski samit sa Rusima i Amerikancima
- [ostalo] Stiže novo zahlađenje: u Srbiji sutra kiša, na planinama sneg
- [svet] Zaliv strahuje od novog američkog udara na Iran
- [svet] Cena dizela u Francuskoj niža 10 centi po litru
- [sport] Košarkaši Spartaka pobedili Megu posle produžetka u ABA ligi

Uncategorized sample (for tuning):
- Stiže novo zahlađenje: u Srbiji sutra kiša, na planinama sneg | https://www.politika.rs/scc/clanak/799185/stize-novo-zahladenje-u-srbiji-sutra-kisa-na-planinama-sneg | tags: []
- Savana Gatri ponovo moli za pomoć u pronalaženju majke: Ne možemo da nastavimo dalje | https://www.politika.rs/scc/clanak/799173/savana-gatri-ponovo-moli-za-pomoc-u-pronalazenju-majke-ne-mozemo-da-nastavimo-dalje | tags: []
- Otkriveno novo veliko nalazište cirkona u Kini | https://www.politika.rs/scc/clanak/799166/otkriveno-novo-veliko-nalaziste-cirkona-u-kini | tags: []
- Bivša saradnica Zelenskog govorila o zloupotrebama humanitarne pomoći | https://www.politika.rs/scc/clanak/799161/bivsa-saradnica-zelenskog-govorila-o-zloupotrebama-humanitarne-pomoci | tags: []

## RTS
Categories: {"hronika":6,"region":2,"drustvo":5,"ekonomija":3,"zivot":1,"politika":3}
- [hronika] Dijana Hrkalović među petoro pomilovanih Vučićevom odlukom - Viši sud u Beogradu objavio spisak
- [region] Mladić iz Srbije nestao tokom uspona na Triglav, spasioci pronašli njegove stvari u snegu
- [region] BiH: Šestorica Srba osuđena za ubistvo i deportaciju meštana iz Novoseoca 1992. godine
- [hronika] Saslušan načelnik Službe za suzbijanje kriminala Boško Sekulović, tužilaštvo traži pritvor
- [drustvo] Nikolina Sinđelić za RTS: Više od godinu dana nisam saslušana po prijavi protiv Marka Krička
- [ekonomija] OKO o krahu Alta banke – kako je trezor postao "kasica-prasica" i ko je morao da zna šta se dešava
