# Feed check

Run: 2026-11-25T13:15:01.697Z

| Outlet | OK | Items | Feed used | With image | Ads flagged |
|---|---|---|---|---|---|
| N1 | yes | 44 | https://n1info.rs/feed/ | 44 | 2 |
| Nova.rs | yes | 50 | https://nova.rs/feed/ | 50 | 0 |
| B92 | yes | 80 | https://www.b92.net/feed/ + https://www.b92.net/info/rss/vesti.xml + https://www.b92.net (homepage, +76) | 76 | 1 |
| Blic | yes | 70 | https://www.blic.rs/rss/danasnje-vesti | 70 | 0 |
| Politika | yes | 20 | https://www.politika.rs/rss | 20 | 0 |
| RTS | yes | 20 | https://www.rts.rs/vesti/rss.html | 20 | 1 |

## N1
Categories: {"politika":18,"svet":3,"ostalo":6,"region":1,"hronika":4,"zivot":5,"drustvo":4,"ekonomija":2,"kultura":1}
- [politika] UNS: Vučić da prestane s izjavama kojima vređa RTS i novinare Javnog servisa
- [svet] Tramp: SAD obezbedile sredstva za rat protiv Irana do kraja januara
- [ostalo] N1 Studio Live (24.11.2026)
- [region] Srpski državljanin pokušao da prošvercuje 5.000 boksova cigareta na ulazu u Severnu Makedoniju
- [politika] Kovačević: Formiranje Skupštine važnije od odlaska na samit EU-Zapadni Balkan
- [hronika] Ivan Todorović (DS) podneo krivičnu prijavu protiv Bojovića i Repca
  - flagged (self): Slike života, nedelja u 15.15h: Braničevske noći https://n1info.rs/najave-emisija/slike-zivota-nedelja-u-1515h-branicevske-noci/
  - flagged (self): N1 Studio live: Bez Srbije na Samitu u Briselu https://n1info.rs/najave-emisija/n1-studio-live-bez-srbije-na-samitu-u-briselu/

Uncategorized sample (for tuning):
- N1 Studio Live (24.11.2026) | https://n1info.rs/video/n1-studio-live/n1-studio-live-24112026/ | tags: ["N1 Studio Live","video","emisija","studio live"]
- Slike života, nedelja u 15.15h: Braničevske noći | https://n1info.rs/najave-emisija/slike-zivota-nedelja-u-1515h-branicevske-noci/ | tags: ["Najave emisija","najava emisije","slike života"]
- Počinje projekat zaštite pataka ronilica | https://n1info.rs/zeleni-kutak/pocinje-projekat-zastite-pataka-ronilica/ | tags: ["Zeleni kutak","ugrožene vrste","vlažna staništa","zaštita prirode","patke","patke ronilice"]
- Ikea u Beogradu bila nakratko evakuisana: Nakon detaljne provere utvrđeno da nema opasnosti | https://n1info.rs/vesti/ikea-u-beogradu-bila-nakratko-evakuisana-nakon-detaljne-provere-utvrdjeno-da-nema-opasnosti/ | tags: ["Vesti","ikea","alarm","evakuacija"]
- U Srbiji manje rođenih i umrlih u odnosu na isti period u 2025. | https://n1info.rs/vesti/u-srbiji-manje-rodjenih-i-umrlih-u-odnosu-na-isti-period-u-2025/ | tags: ["Vesti","rsz","umrli","republički zavod za statistiku","rođeni"]
- Ekipa N1 ometana ispred kuće direktora Pro Tenta na koju je bačena bomba | https://n1info.rs/vesti/ekipa-n1-ometana-ispred-kuce-direktora-pro-tenta-na-koju-je-bacena-bomba/ | tags: ["Vesti","obrenovac","pro tent","ekipa n1","bomba","slobodan vujičić"]

## Nova.rs
Categories: {"drustvo":3,"ekonomija":2,"hronika":9,"sport":7,"politika":13,"zabava":5,"zivot":6,"svet":4,"kultura":1}
- [drustvo] ANEM ALARM: Nedopustivo posthumno targetiranje novinara Žig info Milana Jovanovića u Skupštini Srbije
- [ekonomija] Jevrosimović dobio od Microsofta nagradu Hall of Fame
- [hronika] Advokat otkriva kolika kazna preti vlasniku "Informera"
- [sport] "Kao partneri sa pažnjom pratimo dešavanja u OKS i očekujemo da budemo informisani o svim okolnostima - dalja saradnja u skladu sa razvojem okolnosti": Partneri OKS još nemaju odgovore, poslali jasnu poruku
- [politika] Dragana Đorđević imenovana za generalnog sekretara predsednika Republike
- [zabava] Udaje se Rada Manojlović? Pevačica otkrila planove sa partnerom

## B92
Categories: {"sport":14,"hronika":6,"svet":10,"ekonomija":10,"zdravlje":3,"ostalo":4,"tehnologija":4,"drustvo":4,"zivot":15,"zabava":4,"politika":4,"kultura":2}
- [sport] Hamilton tvrdi da nije imao podršku: "Mogao sam da budem prvak"
- [hronika] Oglasio se UKC Kragujevac: Ovo je stanje povređenih radnica Prve tehničke škole
- [svet] Novi napadi; Putine, gore "kindžali"; Bes u Kremlju: "Neprihvatljivo" FOTO/VIDEO
- [ekonomija] Jedan programer – četiri konobara: Ko sastavlja kraj s krajem, a ko u Srbiji zarađuje najviše
- [sport] Petrović: "Nema trzavica u upravi – nisam došao da kupujem vreme" VIDEO
- [svet] Ovaj potez bi mogao da dovede do sveopšteg haosa; Rizikuju direktan sukob sa Rusijom
  - flagged (sponsored): Jevrosimović dobio od Microsofta nagradu Hall of Fame https://www.b92.net/tehnopolis/promo/287995/jevrosimovic-dobio-od-microsofta-nagradu-hall-of-fame/vest

Uncategorized sample (for tuning):
- Mali trik za ukusniju palentu: Jedan dodatak tokom kuvanja učiniće je kremastom | https://superzena.b92.net/kuhinja/prakticni-saveti/287958/trik-kako-da-palenta-bude-kremasta-i-socna-dodajte-jedan-sastojak/vest | tags: ["Najnovije"]
- Od danas izmene saobraćaja na auto-putu kod Kruševca: Zatvaraju se dve trake | https://www.b92.net/lokal/krusevac/servisne-informacije/287969/radovi-na-auto-putu-kod-krusevca-izmene-saobracaja-do-1-decembra/vest | tags: []
- Ovo je jedino sigurno mesto za orhideju: Samo ovde neće uvenuti, čak ni zimi | https://superzena.b92.net/dom-i-porodica/prakticni-saveti/287968/ovo-je-jedino-mesto-u-stanu-na-kom-orhideja-nece-uvenuti/vest | tags: []
- Skratite sebi muke: Pet stvari koje perete na ruke, a mogu da idu u mašinu za veš | https://superzena.b92.net/dom-i-porodica/prakticni-saveti/287496/5-stvari-koje-perete-na-ruke-a-mogu-da-idu-u-masinu-za-ves/vest | tags: []

## Blic
Categories: {"zdravlje":2,"svet":7,"zivot":7,"zabava":14,"kultura":6,"drustvo":10,"hronika":5,"ekonomija":7,"tehnologija":2,"politika":9,"sport":1}
- [zdravlje] Podivljali virusi u Beogradu: Gradski zavod objavio najnoviji epidemiološki izveštaj
- [svet] Ukrajinsko ministarstvo: "Pogodili smo 5 aviona kojima Rusija granatira Ukrajinu, NEĆE MOĆI DA LETE NEKO VREME"
- [zivot] Reka duga samo 61 metar ušla je u Ginisovu knjigu rekorda, a onda je zbog spora dva grada ukinuta cela kategorija
- [zabava] KUHINJA PO MERI SVAKE DOMAĆICE Udala se za 15 godina starijeg, i napustila Srbiju, sad pokazala kako živi u Dubaiju: Poznata Srpkinja sa stomakom do zuba snima doručak i sređuje frizuru (Foto)
- [kultura] Ćerka Adama Sendlera igra ambicioznu glumicu u Netfliksovom hororu: Slavni otac producent filma
- [drustvo] (Video) Hitno evakuisana "Ikea", sa razglasa poručeno svima da izađu: "Deca iz igraonice već su na putu prema izlazu, čekaju vas"; Evo šta je bio razlog

## Politika
Categories: {"ostalo":10,"hronika":1,"ekonomija":1,"svet":5,"politika":3}
- [ostalo] Treća osoba preminula od malih boginja u Viskonsinu, zaraženo 920 ljudi
- [ostalo] Janković sa admiralom Vajkofom u Beogradu: Kfor jedina legitimna oružana formacija na KiM
- [ostalo] Prijatelj Aide Ćorović predložen za člana delegacije za saradnju sa Republikom Srpskom
- [hronika] Požar u srednjoj školi u Kragujevcu, evakuisani svi đaci i zaposleni
- [ekonomija] Tokom zimske sezone 23 kompanije leteće ka 92 destinacije iz Beograda
- [svet] Kanada poručila SAD da ne polaže račune Vašingtonu nakon kritika Pentagona

Uncategorized sample (for tuning):
- Treća osoba preminula od malih boginja u Viskonsinu, zaraženo 920 ljudi | https://www.politika.rs/scc/clanak/806057/treca-osoba-preminula-od-malih-boginja-u-viskonsinu-zarazeno-920-ljudi | tags: []
- Janković sa admiralom Vajkofom u Beogradu: Kfor jedina legitimna oružana formacija na KiM | https://www.politika.rs/scc/clanak/806056/jankovic-sa-admiralom-vajkofom-u-beogradu-kfor-jedina-legitimna-oruzana-formacija-na-kim | tags: []
- Prijatelj Aide Ćorović predložen za člana delegacije za saradnju sa Republikom Srpskom | https://www.politika.rs/scc/clanak/806058/prijatelj-aide-corovic-predlozen-za-clana-delegacije-za-saradnju-sa-republikom-srpskom | tags: []
- Trišić Babić odgovorila Bećiroviću: Dejtonom je potvrđena Srpska i uspostavljen mir | https://www.politika.rs/scc/clanak/806052/trisic-babic-odgovorila-becirovicu-dejtonom-je-potvrdena-srpska-i-uspostavljen-mir | tags: []
- U Novom Sadu održana konferencija posvećena manjinskim jezicima u Srbiji | https://www.politika.rs/scc/clanak/806049/u-novom-sadu-odrzana-konferencija-posvecena-manjinskim-jezicima-u-srbiji | tags: []
- RAF noću premešta avione u hangare zbog pretnji dronovima | https://www.politika.rs/scc/clanak/806048/raf-nocu-premesta-avione-u-hangare-zbog-pretnji-dronovima | tags: []
- Balet „Krcko Oraščić” 25. decembra ponovo pred beogradskom publikom | https://www.politika.rs/scc/clanak/806045/balet-krcko-orascic-25-decembra-ponovo-pred-beogradskom-publikom | tags: []
- Rubio čestitao Dan državnosti BiH i najavio saradnju sa novim liderima | https://www.politika.rs/scc/clanak/806042/rubio-cestitao-dan-drzavnosti-bih-i-najavio-saradnju-sa-novim-liderima | tags: []

## RTS
Categories: {"hronika":8,"politika":4,"ostalo":1,"ekonomija":2,"drustvo":4,"region":1}
- [hronika] Vlasniku Informera Draganu J. Vučićeviću određeno zadržavanje
- [politika] Srdanović: Očekuje nas raspisivanje predsedničkih izbora; Bakić: Hapšenje Vučićevića doživljavam kao blagu vest
- [politika] Brnabić: Studentska lista krši dostojanstvo Skupštine; Jovanov: Niz presedana tokom zasedanja
- [ostalo] Kako generacije Strnjavčevića žive od proizvodnje mleka
- [ekonomija] Studentski pokret: Institucije da odgovore šta se dogodilo sa dokumentacijom Alta banke
- [drustvo] Preminuo Aleksandar Crkvenjakov, novinar i nekadašnji generalni direktor RTS-a
  - flagged (promo): Šapić: Sutra kreće podela novogodišnjih vaučera deci do 19 godina i zaposlenima u obrazovnom sistemu https://www.rts.rs/vesti/politika/6092036/sapic-sutra-krece-podela-novogodisnjih-vaucera-deci-do-19-godina-i-zaposlenima-u-obrazovnom-sistemu.html

Uncategorized sample (for tuning):
- Kako generacije Strnjavčevića žive od proizvodnje mleka | https://www.rts.rs/vesti/srbija-danas/6076150/kako-generacije-strnjavcevica-zive-od-proizvodnje-mleka.html | tags: ["Srbija danas"]
