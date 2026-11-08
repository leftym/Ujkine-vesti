# Vesti health report

Run: 2026-11-08T20:17:23.308Z  |  items: 268  |  front-page clusters: 10 (10 multi-outlet)

## Recommendations (priority order)
1. **HIGH** [Politika] No working feed. Tried: https://www.politika.rs/rss (HTTP_403) | https://www.politika.rs/rss/ (HTTP_403) | https://www.politika.rs (HTTP_403). Find the current RSS URL (page source: link rel=alternate) and put it first in lib/sources.js.
2. **LOW** [B92] Possible ads NOT flagged: "Najpovoljnije destinacije za putovanja u 2027. godini: Avionske karte jeftinije i do 66 odsto FOTO"
3. **LOW** [Blic] Possible ads NOT flagged: "4 vrste povrća koja najbolje čuvaju srce: Jeftina su i svima dostupna, a kardiolog otkriva zašto čine čuda za krvne sudove"
4. **LOW** [Politika] Icon address returns HTTP 403 (text/html); the app shows a colored dot instead. Find the current icon (page source: link rel=icon / apple-touch-icon) and update icon in lib/sources.js.
5. **LOW** [Front page] Cluster "Požar u stanu u Ulici kneza Miloša, jedna osoba stradala" has 11 items: chained matches may have merged related but different stories.

## Outlet table
| Outlet | OK | Items | Newest | Images | Ostalo | Ads |
|---|---|---|---|---|---|---|
| N1 | yes | 48 | 0.1h | 100% | 10% | 5 |
| Nova.rs | yes | 50 | 0.1h | 100% | 2% | 0 |
| B92 | yes | 80 | 0.1h | 95% | 1% | 1 |
| Blic | yes | 70 | 0.2h | 100% | 0% | 0 |
| Politika | **NO** | 0 | - | 0% | 0% | 0 |
| RTS | yes | 20 | 0.2h | 100% | 0% | 0 |

## Front page right now
1. [multi, 5 outlets, score 59] Elektorske skupštine izabrale članove saveta ruske i goranske manjine, broje se glasovi na neposrednim izborima
   - also (nova): Završeni izbori za nacionalne savete 23 nacionalne manjine, RIK rezultate saopštava u roku od 96 sati
   - also (b92): Završeni izbori za članove nacionalnih saveta nacionalnih manjina
   - also (blic): Završeni izbori za članove nacionalnih saveta nacionalnih manjina
   - also (n1): Preliminarni rezultati izbora za nacionalne savete nacionalnih manjina sutra u 20 časova
2. [multi, 5 outlets, score 57.9] Stravična nesreća u Rio de Žaneiru; Poginulo 10 osoba, među njima 5 dece
   - also (b92): Najnovija saznanja o autobuskoj nesreći kod Zagreba: Poginule dve ženske osobe, jedna maloletna
   - also (n1): (BLOG) Među poginulima nisu državljani Srbije: Srpski autobus se prevrnuo u Hrvatskoj, dve osobe stradale, više od 30 povređenih
   - also (rts): Prevrnuo se autobus "Niš-ekspresa" kod Zagreba – dvoje poginulo, šestoro teže, a 27 lakše povređeno
   - also (blic): MALOLETNICA MEĐU ŽRTVAMA STRAVIČNE NESREĆE KOD ZAGREBA! Dve ženske osobe poginule u prevrtanju autobusa sa srpskim registracijama: Poznato i odakle su
   - also (nova): Otkriveno ko su poginuli u stravičnoj nesreći srpskog autobusa kod Zagreba: Oglasilo se hrvatsko ministarstvo
   - also (blic): OVO JE UZROK PREVRTANJA SRPSKOG AUTOBUSA KOD ZAGREBA?! Putnici otkrili kako su izgledali minuti strave nakon nesreće: "Ljudi su bili PRIKLJEŠTENI SEDIŠTIMA" (FOTO, VIDEO)
   - also (n1): Službenica Ambasade: Među poginulima u nesreći autobusa nisu državljani Srbije
   - also (b92): Poznato ko je nastradao u prevrtanju srpskog autobusa u Hrvatskoj
   - also (blic): POZNATO ODAKLE SU POGINULI U STRAVIČNOJ NESREĆI U ZAGREBU Oglasilo se hrvatsko ministarstvo, otkrivene i nove informacije o povređenima
3. [multi, 5 outlets, score 57.3] Požar u stanu u Ulici kneza Miloša, jedna osoba stradala
   - also (n1): Jedna osoba stradala u požaru u stanu u zgradi u Kneza Miloša
   - also (b92): Požar u ulici Kneza Miloša u Beogradu: Vatrogasci našli telo u stanu, saobraćaj bio obustavljen
   - also (blic): U STRAVIČNOM POŽARU U CENTRU BEOGRADA POVREĐENO I DETE! Detalji užasa u Kneza Miloša: Žena poginula, povrede zadobili vatrogasci i policajac
   - also (nova): Vatrogasci pronašli telo u stanu koji je goreo u Ulici kneza Miloša
   - also (b92): Veliki požar u Sarajevu; Gore vagoni VIDEO
   - also (nova): Požar izbio u zgradi u Kneza Miloša: Vatrogasci na terenu
   - also (blic): IMA MRTVIH U POŽARU U CENTRU BEOGRADA! Vatrogasci našli telo u stanu, dim prekrio Ulicu kneza Miloša, obustavljen saobraćaj u jednoj traci
   - also (blic): (VIDEO) VELIKI POŽAR U SARAJEVU, VATROGASCI NA TERENU! Vatra zahvatila nekoliko vagona u Rajlovcu, hitno upućene ekipe
   - also (blic): (VIDEO) DIM PREKRIO CENTAR BEOGRADA, KULJA VATRA! Požar buknuo u zgradi, na terenu hitne službe, zatvoren deo Ulice kneza Miloša
   - also (blic): (FOTO, VIDEO) VATROGASCI PODIGLI DIZALICU, BLOKIRAN SAOBRAĆAJ! Prve slike požara u Kneza Miloša: Gust dim se širi
4. [multi, 4 outlets, score 48.5] OVO SU KLJUČNI LJUDI PRVE SEDNICE SKUPŠTINE: "Spremni smo"
   - also (b92): Srbija dobija novi parlament; Ovo je proces konstituisanja Skupštine – nakon toga teče rok za formiranje Vlade
   - also (rts): Baucal: Studentska lista spremna za konstitutivnu sednicu, razgovori o predsedniku Skupštine pri kraju
   - also (rts): Kako će teći konstitutivna sednica Skupštine Srbije
   - also (rts): Konstitutivna sednica 17. novembra u 10 časova
   - also (nova): Baucal: Studentska lista spremna za konstitutivnu sednicu, razgovori o predsedniku Skupštine pri kraju
5. [multi, 4 outlets, score 47.9] RTS: Ronilačka jedinica pronašla u Bovanskom jezeru telo i automobil
   - also (rts): Bovansko jezero: Pronađeni telo i automobil koji je potonuo
   - also (nova): U Bovanskom jezeru pronađeni telo i automobil koji je potonuo
   - also (blic): ŽANDARMERIJA PRONAŠLA TELO U BOVANSKOM JEZERU! Ronioci uočili automobil u vodi, pa usledila DRAMA koja se tragično završila
6. [multi, 4 outlets, score 45.3] Predsednik opštine Inđija Marko Gašić i direktor "Inđija puta" među uhapšenima za zloupotrebu položaja
   - also (b92): Uhapšen predsednik opštine Inđija Marko Gašić; Privedeno još 5 osoba – evo šta im se stavlja na teret VIDEO
   - also (nova): Ko je uhapšeni predsednik Opštine Inđija Marko Gašić i zbog čega će ga pamtiti studenti i građani
   - also (n1): Marko Gašić: Funkcioner SNS-a, bivši direktor "Inđija puta" i predsednik opštine
7. [multi, 3 outlets, score 33.4] Saslušani uhapšeni policajci zbog smrti Dalibora Dragijevića
   - also (n1): Saslušani pripadnici UKP-a zbog smrti Dalibora Dragijevića: Tužilaštvo traži pritvor za osumnjičene
   - also (nova): Osam pripadnika UKP-a saslušano zbog smrti Dalibora Dragijevića, tužilaštvo traži pritvor za sve osumnjičene
8. [multi, 2 outlets, score 28.5] Tuga u Partizanu, preminula jedna od najvećih legendi - otišao čuveni Dževad Prekazi
   - also (b92): Umro Dževad Prekazi
9. [multi, 2 outlets, score 25.8] Predlog Vrhovnom javnom tužilaštvu - traži se poništaj odluka o pomilovanju 37 osoba koje je doneo Aleksandar Vučić
   - also (n1): Advokat Papić podneo tužilaštvu predlog da od Upravnog suda zatraži poništenje odluka o pomilovanju
10. [multi, 2 outlets, score 24.9] Dnevnik - Cela emisija - 7.11.2026.
   - also (n1): Dnevnik u 19 (7.11.2026)

## Details
### N1
Categories: {"zivot":8,"svet":6,"ekonomija":2,"ostalo":5,"drustvo":4,"politika":11,"hronika":7,"region":4,"kultura":1}
Flagged:
- (self) Gledajte UŽIVO "Utisak nedelje": Ivan Ninić, Vesna Mališić, Dejan Šoškić <https://n1info.rs/najave-emisija/utisak-nedelje-ivan-ninic-vesna-malisic-dejan-soskic/>
- (self) Gledajte Dnevnik u 19h <https://n1info.rs/najave-emisija/gledajte-uzivo-dnevnik-u-19-ponedeljak-19-maj/>
- (self) Global fokus, ponedeljak u 20h: Tramp i Netanjahu u problemu? <https://n1info.rs/najave-emisija/global-fokus-ponedeljak-u-20h-tramp-i-netanjahu-u-problemu/>
- (self) N1 Studio Live: Tužilaštvo se probudilo <https://n1info.rs/najave-emisija/n1-studio-live-tuzilastvo-se-probudilo/>
- (self) Novi dan: Transparentno o tehničkoj vladi <https://n1info.rs/najave-emisija/novi-dan-transparentno-o-tehnickoj-vladi/>
Uncategorized sample:
- Gledajte UŽIVO "Utisak nedelje": Ivan Ninić, Vesna Mališić, Dejan Šoškić <https://n1info.rs/najave-emisija/utisak-nedelje-ivan-ninic-vesna-malisic-dejan-soskic/> tags=["Najave emisija","najava emisije","utisak nedelje"]
- Dnevnik u 19 (7.11.2026) <https://n1info.rs/video/dnevnik/dnevnik-u-19-7112026/> tags=["Dnevnik","video","dnevnik"]
- Gledajte Dnevnik u 19h <https://n1info.rs/najave-emisija/gledajte-uzivo-dnevnik-u-19-ponedeljak-19-maj/> tags=["Najave emisija","najave emisija"]
- Putevi Srbije: Bez snega na prioritetnim putnim pravcima, moguća magla <https://n1info.rs/vesti/putevi-srbije-bez-snega-na-prioritetnim-putnim-pravcima-moguca-magla/> tags=["Vesti","magla","putevi srbije","jp putevi srbije","stanje na putevima","sneg"]
- Press: Aleksandar Ivanović (08.11.2026) <https://n1info.rs/video/novi-dan/press-aleksandar-ivanovic-08112026/> tags=["Novi dan","press","aleksandar ivanović","video"]

### Nova.rs
Categories: {"politika":7,"sport":13,"zabava":6,"drustvo":5,"hronika":9,"ostalo":1,"ekonomija":2,"svet":6,"zivot":1}
Uncategorized sample:
- Dnevnik - Cela emisija - 7.11.2026. <https://nova.rs/emisije/dnevnik-cela-emisija-7112026/> tags=["Emisije","dnevnik cela emisija"]

### B92
Categories: {"sport":11,"zabava":3,"kultura":3,"ekonomija":8,"svet":12,"region":6,"zivot":20,"hronika":4,"zdravlje":6,"politika":3,"ostalo":1,"tehnologija":3}
Flagged:
- (sponsored) Urasle dlake: Zašto nastaju i kako ih se rešiti trajno <https://www.b92.net/zdravlje/promo/282766/urasle-dlake-zasto-nastaju-i-kako-ih-se-resiti-trajno/vest>
Uncategorized sample:
- Emocionalno inteligentan muškarac je tako seksi <https://superzena.b92.net/superstav/jana/282895/emocionalno-inteligentan-muskarac-je-tako-seksi/vest> tags=[]

### Blic
Categories: {"zivot":7,"politika":6,"zabava":18,"zdravlje":3,"drustvo":2,"svet":15,"hronika":12,"ekonomija":5,"kultura":2}

### Politika
Categories: {}

### RTS
Categories: {"politika":5,"hronika":9,"zivot":1,"drustvo":2,"region":1,"svet":1,"ekonomija":1}
