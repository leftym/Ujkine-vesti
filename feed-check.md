# Feed check

Run: 2026-11-27T12:49:53.712Z

| Outlet | OK | Items | Feed used | With image | Ads flagged |
|---|---|---|---|---|---|
| N1 | yes | 46 | https://n1info.rs/feed/ | 46 | 3 |
| Nova.rs | yes | 50 | https://nova.rs/feed/ | 50 | 0 |
| B92 | yes | 80 | https://www.b92.net/feed/ + https://www.b92.net/info/rss/vesti.xml + https://www.b92.net (homepage, +73) | 76 | 1 |
| Blic | yes | 70 | https://www.blic.rs/rss/danasnje-vesti | 70 | 2 |
| Politika | yes | 20 | https://www.politika.rs/rss | 20 | 0 |
| RTS | yes | 20 | https://www.rts.rs/vesti/rss.html | 20 | 0 |

## N1
Categories: {"politika":17,"ostalo":5,"ekonomija":7,"zivot":7,"kultura":1,"hronika":2,"region":5,"sport":1,"drustvo":1}
- [politika] Milošević: Studentska lista će evropske integracije ostaviti za kasnije, prioritet uspostavljanje demokratskih standarda
- [politika] Lazović: Smatram da ZLF treba da podrži predsedničkog kandidata SL
- [ostalo] Na Horgošu zaplenjen sat vredan više od 184.000 švajcarskih franaka i 20 dukata
- [politika] "Ta televizija je funkcionisala kao servis SNS-a": Opozicija na sednici Skupštine zahtevala preispitivanje finansiranja RTV Kragujevac
- [politika] Opozicija na sednici Skupštine Kraljeva pozvala predstavnike vladajuće većine da podnesu ostavke
- [ekonomija] DRI: Uprava za veterinu godinama kupovala vakcine za svinje koje se ne koriste od 2019. godine
  - flagged (self): Gledajte UŽIVO Studio Live: Ko (ne)će u trku za predsednika? https://n1info.rs/najave-emisija/studio-live-ko-nece-u-trku-za-predsednika/
  - flagged (self): Dan uživo u 16.30h: Ponovo na birališta https://n1info.rs/najave-emisija/novi-dan-ponovo-na-biralista/
  - flagged (self): Crvena linija u 20h: Bezbednost dece u školama u zemljama regiona https://n1info.rs/najave-emisija/crvena-linija-u-20h-bezbednost-dece-u-skolama-u-zemljama-regiona/

Uncategorized sample (for tuning):
- Na Horgošu zaplenjen sat vredan više od 184.000 švajcarskih franaka i 20 dukata | https://n1info.rs/vesti/na-horgosu-zaplenjen-sat-vredan-vise-od-184000-svajcarskih-franaka-i-20-dukata/ | tags: ["Vesti","sat","horgoš","dukati","uprava carina"]
- RSE: Panoramski točak, novo šetalište i pešačko-biciklistički most grade se bez dozvola, radnici povučeni s gradilišta | https://n1info.rs/vesti/rse-panoramski-tocak-novo-setaliste-i-pesacko-biciklisticki-most-grade-se-bez-dozvola-radnici-povuceni-s-gradilista/ | tags: ["Vesti","panoramski točak","beograd na vodi","šetalište","dozvole","radnici"]
- Na Božić slučajno snimljen Saičić kako donosi hranu beskućniku u beogradskom prolazu | https://n1info.rs/vesti/na-bozic-slucajno-snimljen-saicic-kako-donosi-hranu-beskucniku-u-beogradskom-prolazu/ | tags: ["Vesti","radomir saičić","beskućnici","pomoć"]
- Kako da vas ne prevare na Crni petak: MUP izdao uputstva - šta da izbegavate | https://n1info.rs/vesti/kako-da-vas-ne-prevare-na-crni-petak-mup-izdao-uputstva-sta-da-izbegavate/ | tags: ["Vesti","crni petak","mup","mup srbije","upozorenje","šoping"]
- U Srbiji 44 "dece leptira" - U UKC Srbije otvoren Centar za njihovo lečenje | https://n1info.rs/vesti/u-srbiji-44-dece-leptira-u-ukc-srbije-otvoren-centar-za-njihovo-lecenje/ | tags: ["Vesti","lečenje","centar","deca leptiri","debra"]

## Nova.rs
Categories: {"zivot":5,"svet":8,"zabava":8,"politika":12,"sport":8,"ekonomija":3,"drustvo":1,"kultura":2,"hronika":3}
- [zivot] Rizik od srčanog i moždanog udara može prepoznati čak 30 godina unapred: Ovo su prvi znakovi koji se pojave
- [svet] Napadači ubili 13 ljudi u Nigeriji
- [zabava] "Sve je rasprodala, uvek se ponašala kao zvezda": Komšije Nede Ukraden iz Sarajeva oštro o pevačici
- [zabava] Cvija napustio Srbiju? Srpski reper se preselio u Hrvatsku i započeo biznis sa poznatim fudbalerom
- [politika] Profesor Jovančićević: Za razliku od Vučića, Saičić će poštovati zakone i ustavna ovlašćenja
- [sport] "Nedostaju nam igrači koji su postigli 130 golova": Kompani otvorio dušu o velikim problemima Bajerna

## B92
Categories: {"sport":13,"hronika":5,"zivot":18,"svet":5,"ekonomija":10,"politika":8,"region":3,"kultura":4,"drustvo":5,"zdravlje":3,"tehnologija":2,"zabava":3,"ostalo":1}
- [sport] Ataman (ne)namerno otkrio dva nova kluba u Evroligi
- [sport] Srbija protiv prvaka Južne Amerike – za prvo mesto u grupi
- [hronika] Pronađeno telo muškarca koji je stradao od udara voza
- [zivot] Nije želela da završi u ručku: Ćurka izazvala haos na auto-putu, policija je jurila pod rotacijom VIDEO
- [svet] Vratio se i poručio: "Ako Francuska padne, pada Evropa"
- [sport] "Kenguri" maksimalni – imamo novog učesnika Mundobasketa
  - flagged (sponsored): 44 dana, 48 događaja: Najduža praznična sezona u Portonovom kao idealan povod za zimski beg na more https://www.b92.net/putovanja/promo/promo/288402/44-dana-48-dogadjaja-najduza-praznicna-sezona-u-portonovom-kao-idealan-povod-za-zimski-beg-na-more/vest

Uncategorized sample (for tuning):
- Šminka koja će obeležiti prazničnu sezonu: Četiri detalja koja prave ogromnu razliku VIDEO | https://superzena.b92.net/lepa-i-zdrava/lepota-zene/288368/nekoliko-trikova-za-savrsenu-praznicnu-sminku/vest | tags: []

## Blic
Categories: {"hronika":8,"zivot":7,"politika":8,"zabava":13,"kultura":4,"svet":6,"ekonomija":15,"drustvo":6,"zdravlje":1,"ostalo":1,"tehnologija":1}
- [hronika] Jedan automobil uništen, saobraćaj blokiran: Teška nesreća na starom novosadskom putu
- [zivot] WhatsApp uvodi opciju koja menja putovanja u inostranstvo: Recite zbogom skupom romingu i jurenju lokalnih kartica
- [politika] Vučić razgovarao sa novim članovima SNS, prokomentarisao i Saičićevu kandidaturu
- [zabava] NEBOJŠU TUBIĆA ŽAPCA UDARIO AUTOMOBIL NA PEŠAČKOM Hitna pomoć odmah stigla
- [zabava] (FOTO) JELISAVETA KRIŠOM SLIKALA PAVLA U KUPATILU Stala iza njega, ne odvajaju se jedno od drugog
- [kultura] Međunarodni festival etnološkog filma od 4. do 7. decembra u Etnografskom muzeju
  - flagged (betting): Saopštenje kompanije Mozzart https://www.blic.rs/vesti/saopstenje-kompanije-mozzart/p1wtpl6
  - flagged (promo): CRNI PETAK KAKAV JOŠ NISTE VIDELI: Dok svi jure popuste u radnjama, čitaoce Blica čeka DUPLI BONUS uz ovaj promo kod! https://www.blic.rs/slobodno-vreme/crni-petak-kakav-jos-niste-videli-dok-svi-jure-popuste-u-radnjama-citaoce-blica-ceka/bdgwsqy

Uncategorized sample (for tuning):
- Šta vam je potrebno da priuštite dom tamo gde živite: BBC istraživanje | https://www.blic.rs/bbc/sta-vam-je-potrebno-da-priustite-dom-tamo-gde-zivite-bbc-istrazivanje/c463sgw | tags: []

## Politika
Categories: {"ekonomija":1,"ostalo":7,"svet":1,"sport":2,"drustvo":2,"politika":3,"hronika":2,"region":1,"kultura":1}
- [ekonomija] Godišnja inflacija u Francuskoj preliminarno usporila na 2,9 odsto
- [ostalo] Lajko Feliks pred beogradskom publikom 5. decembra
- [svet] Vajdel: Mirovni sporazum nije moguć bez teritorijalnih ustupaka Kijeva
- [sport] Srpske bokserke pred velikim izazovom u Taškentu
- [drustvo] Roditelji đaka zatvorene OŠ „Branko Radičević” protestovali ispred Gradske kuće
- [politika] Uganda povlači vojsku iz grada na istoku DR Konga usred diplomatskog spora

Uncategorized sample (for tuning):
- Lajko Feliks pred beogradskom publikom 5. decembra | https://www.politika.rs/scc/clanak/806729/lajko-feliks-pred-beogradskom-publikom-5-decembra | tags: []
- Vučević: Novi Sad, Bačka i srpski narod pamtiće mitropolita Irineja s ljubavlju | https://www.politika.rs/scc/clanak/806723/vucevic-novi-sad-backa-i-srpski-narod-pamtice-mitropolita-irineja-s-ljubavlju | tags: []
- PKS: Srpsko-češki poslovni i investicioni forum 30. novembra u Beogradu | https://www.politika.rs/scc/clanak/806722/pks-srpsko-ceski-poslovni-i-investicioni-forum-30-novembra-u-beogradu | tags: []
- Uliks Fehmiu: Porodica je podržala priznanje da bi živele vrednosti koje je moj otac zastupao | https://www.politika.rs/scc/clanak/806720/uliks-fehmiu-porodica-je-podrzala-priznanje-da-bi-zivele-vrednosti-koje-je-moj-otac-zastupao | tags: []
- Afrička kuga svinja za tri godine odnela 100.000 grla | https://www.politika.rs/scc/clanak/806718/africka-kuga-svinja-za-tri-godine-odnela-100-000-grla | tags: []
- Orban pokreće međunarodno okupljanje suverenista i otvara pitanje reforme EU | https://www.politika.rs/scc/clanak/806719/orban-pokrece-medunarodno-okupljanje-suverenista-i-otvara-pitanje-reforme-eu | tags: []
- Praznični meni najpoznatijih zatvorenica u SAD | https://www.politika.rs/scc/clanak/806716/praznicni-meni-najpoznatijih-zatvorenica-u-sad | tags: []

## RTS
Categories: {"drustvo":6,"politika":3,"ekonomija":5,"hronika":3,"svet":1,"ostalo":1,"zivot":1}
- [drustvo] Održan skup podrške Draganu J. Vučićeviću ispred Centralnog zatvora, advokati najavljuju žalbu na pritvor
- [politika] Brnabić: Nema uslova za fer izbore, odluka o učešću na Skupštini SNS-a 13. decembra
- [politika] Radomir Saičić kandidat Studentskog pokreta: Vreme je da funkciji predsednika Republike vratimo dostojanstvo
- [drustvo] Patrijarh Porfirije služi pomen mitropolitu Irineju u Sabornom hramu u Novom Sadu
- [ekonomija] Gorivo jeftinije za tri dinara, produžena odluka o smanjenju akciza
- [hronika] Pronađeno telo žene iz Priboja koja se utopila u reci Lim

Uncategorized sample (for tuning):
- Porodične firme u Srbiji: Kako obezbediti dugovečnost i prenos poslovanja na nove generacije | https://www.rts.rs/vesti/srbija-danas/6092119/porodicne-firme-u-srbiji-kako-obezbediti-dugovecnost-i-prenos-poslovanja-na-nove-generacije.html | tags: ["Srbija danas"]
