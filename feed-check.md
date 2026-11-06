# Feed check

Run: 2026-11-06T11:13:03.390Z

| Outlet | OK | Items | Feed used | With image | Ads flagged |
|---|---|---|---|---|---|
| N1 | yes | 48 | https://n1info.rs/feed/ | 48 | 4 |
| Nova.rs | yes | 50 | https://nova.rs/feed/ | 50 | 1 |
| B92 | yes | 80 | https://www.b92.net/feed/ + https://www.b92.net/info/rss/vesti.xml + https://www.b92.net (homepage, +77) | 76 | 0 |
| Blic | yes | 70 | https://www.blic.rs/rss/danasnje-vesti | 70 | 0 |
| Politika | **NO** | 0 | - | 0 | 0 |
| RTS | yes | 20 | https://www.rts.rs/vesti/rss.html | 20 | 0 |

## N1
Categories: {"hronika":9,"ekonomija":11,"ostalo":6,"region":2,"kultura":1,"zivot":8,"svet":5,"politika":4,"drustvo":2}
- [hronika] VJT u Kraljevu formiralo predmet u slučaju vođenja paralelnih biračkih spiskova u Kostolcu
- [ekonomija] MAT: Privredni rast Srbije u prvih devet meseci ove godine oko 3,6 odsto
- [ostalo / AD:self] Gledajte UŽIVO N1 Studio live: Hajde grade
- [region] Izrečena maksimalna kazna od 45 godina zatvora za ubicu Aldine Jahić u Mostaru
- [hronika / AD:self] Dan uživo: Ka policiji u službi građana
- [kultura] Fondacija "Mira Banjac" uspostavlja dve godišnje nagrade
  - flagged (self): Gledajte UŽIVO N1 Studio live: Hajde grade https://n1info.rs/najave-emisija/n1-studio-live-hajde-grade/
  - flagged (self): Dan uživo: Ka policiji u službi građana https://n1info.rs/najave-emisija/dan-uzivo-ka-policiji-u-sluzbi-gradjana/
  - flagged (self): Gosti "Utiska nedelje": Ivan Ninić, Vesna Mališić, Dejan Šoškić https://n1info.rs/najave-emisija/utisak-nedelje-ivan-ninic-vesna-malisic-dejan-soskic/
  - flagged (self): Novi dan: Šta je vlast ostavila iza sebe? https://n1info.rs/najave-emisija/novi-dan/

Uncategorized sample (for tuning):
- Gledajte UŽIVO N1 Studio live: Hajde grade | https://n1info.rs/najave-emisija/n1-studio-live-hajde-grade/ | tags: ["Najave emisija","najave emisija"]
- Gosti "Utiska nedelje": Ivan Ninić, Vesna Mališić, Dejan Šoškić | https://n1info.rs/najave-emisija/utisak-nedelje-ivan-ninic-vesna-malisic-dejan-soskic/ | tags: ["Najave emisija","najava emisije","utisak nedelje"]
- CLS: Odustalo se od uvođenja gradskih linija do Expo, Beograđani neće plaćati prazne autobuse | https://n1info.rs/vesti/cls-odustalo-se-od-linija-gradskog-prevoza-do-kompleksa-ekspo/ | tags: ["Vesti","gradski prevoz","gsp","ekspo","2027 expo","strela"]
- Objavljen konkurs za direktora PIO fonda, Relji Ognjenoviću ističe mandat | https://n1info.rs/vesti/objavljen-konkurs-za-direktora-pio-fonda-umesto-ognjenovica/ | tags: ["Vesti","konkurs","pio fond","direktor","relja ognjenović"]
- Vasiliju je potrebna pomoć za transplantaciju koštane srži i lečenje | https://n1info.rs/vesti/vasiliju-je-potrebna-pomoc-za-transplantaciju-kostane-srzi-i-lecenje/ | tags: ["Vesti","humanitarna akcija"]
- Novi dan: Šta je vlast ostavila iza sebe? | https://n1info.rs/najave-emisija/novi-dan/ | tags: ["Najave emisija","najave emisija","novi dan"]

## Nova.rs
Categories: {"drustvo":7,"politika":4,"sport":8,"zivot":2,"zabava":8,"hronika":7,"kultura":2,"ekonomija":6,"svet":5,"ostalo":1}
- [drustvo] Zvučni zid uznemirio Kragujevčane
- [politika] Bravo: SNS planira da u Novom Sadu zaposli 1.290 ljudi
- [sport] Jovanović objavio spisak, evo ko će igrati protiv Srbije
- [zivot] "Stručnjak sam za automobile – ovo je pravi razlog zašto električni automobili imaju veće gume"
- [zabava] Predrag Sarapa se javno izvinio RTS-u nakon skandalozne uvrede: Evo šta im je poručio
- [hronika] Doktorka KPZ Padinska Skela i vođa smene osuđeni na zatvorske kazne zbog smrti zatvorenika, komandiri oslobođeni
  - flagged (sponsored): Gorki List na velikoj svečanosti dodelio Nagradu za ljudskost „Sve je u nama“: petoro izuzetnih ljudi dobilo priznanja za vrednosti koje inspirišu https://nova.rs/vesti/biznis/gorki-list-na-velikoj-svecanosti-dodelio-nagradu-za-ljudskost-sve-je-u-nama-petoro-izuzetnih-ljudi-dobilo-priznanja-za-vrednosti-koje-inspirisu/

Uncategorized sample (for tuning):
- Mentalno razgibavanje: Ne brukaj se više! | https://nova.rs/emisije/mentalno-razgibavanje-ne-brukaj-se-vise/ | tags: ["Emisije","mentalno razgibavanje cela emisija"]

## B92
Categories: {"svet":17,"zivot":18,"sport":13,"zabava":2,"ekonomija":9,"ostalo":3,"hronika":3,"kultura":2,"tehnologija":4,"zdravlje":3,"drustvo":2,"region":1,"politika":3}
- [svet] Opšta pometnja – nakon aviona, dojave o bombama počele da stižu i u medijske kuće
- [zivot] Ronioci se potukli 18 metara pod morem: Snimak bizarnog incidenta šokirao svet VIDEO
- [sport] Partizan i Crvena zvezda i dalje imaju šanse za status franšize u Evroligi
- [svet] Novo razaranje uskoro počinje? Otkriven mogući datum
- [svet] Jasno i glasno: "Ne povlačim se"
- [zabava] Ups, gole grudi za nju nisu nikakav skandal: Dua Lipa u bombastičnom izdanju FOTO

Uncategorized sample (for tuning):
- Detention ordered for nine Interior Ministry Officers suspected of abuse | https://www.b92.net/english/crime/282707/detention-ordered-for-nine-interior-ministry-officers-suspected-of-abuse/vest | tags: ["Najnovije"]
- Oprez na Milošu Velikom: Zbog ulegnuća na mostu između Pakovraća i Lučana radovi | https://www.b92.net/lokal/cacak/servisne-informacije/282672/oprez-na-milosu-velikom-zbog-ulegnuca-na-mostu-izmedju-pakovraca-i-lucana-radovi/vest | tags: []
- Sedam rečenica koje deci pomažu da izrastu u srećne i samopouzdane ljude | https://superzena.b92.net/dom-i-porodica/roditeljstvo/282648/7-recenica-roditelja-da-deca-izrastu-u-srecne-i-samopouzdane-ljude/vest | tags: []

## Blic
Categories: {"zivot":7,"drustvo":9,"ekonomija":19,"svet":8,"zabava":14,"hronika":5,"politika":4,"kultura":3,"zdravlje":1}
- [zivot] Kineski naučnici napravili četkicu za zube sprečava nastanak kamenca: Evo kako zapravo funkcioniše
- [drustvo] MISTERIJA! Građani Šumadije masovno prijavljuju da su čuli JAK ZVUK EKSPLOZIJE: Oglasili se iz Uprave za vanredne situacije
- [ekonomija] Učionica budućnosti u Valjevskoj gimnaziji: Otvoren 53. Mejkers lab u Srbiji, đaci dobili prostor za eksperimente, robotiku i programiranje
- [svet] AVION "VIZ ERA" HITNO PREUSMEREN U VENECIJU! Dojava o bombi upućena telefonom: Pretnje stigle i za više aviona u Češkoj
- [zivot] "VREME ĆE SE POTPUNO PROMENITI!" Poznati meteorolog objavio prognozu za novembar: Jak minus, pa iznenadna promena, a evo kada će SNEG
- [zabava] (FOTO) IMANJE PLATILI 30.000 EVRA, A OVAKO IDU U OBILAZAK Veljko i Bogdana seli u stari auto, ona na licu ni trunku šminke

## Politika
FAILED: no working feed
Tried: https://www.politika.rs/rss (HTTP_403) | https://www.politika.rs/rss/ (HTTP_403) | https://www.politika.rs (HTTP_403)
Categories: {}

## RTS
Categories: {"drustvo":4,"hronika":4,"svet":3,"ekonomija":7,"zivot":2}
- [drustvo] REM pokrenuo novi postupak protiv "Informera"
- [hronika] Presuda za smrt zatvorenika u Padinskoj Skeli, doktorka i vođa smene osuđeni za nesavestan rad
- [hronika] Osam policajaca uhapšeno zbog smrti Dalibora Dragijevića u policijskoj stanici u Boru
- [svet] Tramp o mirovnom planu za Ukrajinu: Mogao bi da obuhvati celu Evropu, svi će biti oduševljeni
- [ekonomija] NBS: Svakodnevno nadziremo rad Poštanske štedionice, finansijski sistem stabilan
- [ekonomija] Vasić: Slučaj Alta banke poljuljao poverenje građana, ali nema razloga za paniku
