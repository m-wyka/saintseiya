# Analiza legacy

Stan na 2026-10-04. Źródła: katalog `legacy/` i zrzut `legacy/wwyka_saintseiya_1791133520.sql`.

## Co to jest

- **Silnik**: PHP-Fusion 7.02.05, język polski, edytor TinyMCE.
- **Nazwa**: Saint Seiya Revolution (SSR) — „Rycerze Zodiaku Polska”.
- **Stary adres**: `http://saintseiya.netserwer.pl/`
- **Aktywny motyw**: `saintseiya-g-angeltheme3`
- **Aktywność**: newsy 2010-08 → 2019-12, forum 2010-09 → 2023-07, komentarze do 2022-12.

## Jak czytać bazę

Zrzut jest zaimportowany do prywatnej instancji MySQL 8.0 (binaria z MAMP), z danymi w `.data/legacy-mysql/` (poza gitem). Baza: `saintseiya_legacy`, użytkownik `root` bez hasła, port `3399`, tylko `127.0.0.1`.

Start (z katalogu projektu):

```sh
D="$PWD/.data/legacy-mysql"
/Applications/MAMP/Library/bin/mysql80/bin/mysqld --no-defaults \
  --datadir="$D/data" --port=3399 --bind-address=127.0.0.1 \
  --socket="$D/mysql.sock" --pid-file="$D/mysql.pid" \
  --mysqlx=OFF --log-error="$D/error.log"
```

Zapytanie z poprawnymi polskimi znakami:

```sh
/Applications/MAMP/Library/bin/mysql80/bin/mysql --no-defaults -uroot \
  -S "$PWD/.data/legacy-mysql/mysql.sock" --default-character-set=latin1 \
  saintseiya_legacy -e "SELECT news_subject FROM fusion_news LIMIT 3" \
  | iconv -f ISO-8859-2 -t UTF-8
```

Stop: `mysqladmin --no-defaults -uroot -S "$PWD/.data/legacy-mysql/mysql.sock" shutdown`

Odtworzenie od zera: `mysqld --no-defaults --initialize-insecure --datadir=...`, potem `CREATE DATABASE saintseiya_legacy CHARACTER SET latin1` i import zrzutu z `--default-character-set=utf8mb4`.

## Import do nowej bazy

Z uruchomioną instancją MySQL (wyżej):

```sh
pnpm legacy:import --force   # .data/saintseiya.db + .data/uploads od zera, ok. 10 s
pnpm images:check            # sprawdza zewnętrzne obrazki, ok. 4 min, wymaga sieci
```

Wynik importu z 2026-10-05: 339 kont archiwalnych, 379 newsów, 807 podstron (w tym 73 węzły grupujące), 4 mapy ze 166 obszarami, 348 tematów, 11 258 postów, 2 259 komentarzy, 319 zdjęć, 74 filmy, 3 680 wpisów shoutboxa, 80 ankiet, 58 linków, 6 plików. Pominięte: 74 puste podstrony, 5 postów bez tematu, 41 zdjęć bez pliku, 44 komentarze do treści, których nie ma.

Obrazki zewnętrzne: 2 553 adresy, z czego 1 701 odpowiada, a 852 jest martwych (najwięcej z Photobucket, ImageShack i Dropbox). Martwe wyświetlają się jako zaślepka „Nie znaleziono zdjęcia” z odnośnikiem do oryginalnego adresu. Photobucket może zwracać obrazek ze znakiem wodnym zamiast oryginału — tego sprawdzanie nie odróżnia.

## Kodowanie i escapowanie

- **Kodowanie**: wszystkie 59 tabel to `latin1`, ale bajty w środku to ISO-8859-2. Sprawdzone na podstronach, postach, newsach i komentarzach: zero bajtów typowych dla Windows-1250 i zero UTF-8. Reguła odczytu: połączenie `latin1`, dekodowanie bajtów jako ISO-8859-2.
- **Pliki HTML poza CMS** (`mapa/`, `kr/`, `posejdon.html`) są w Windows-1250.
- **Ukośniki**: treść HTML podstron i newsów jest zapisana z jednym poziomem `addslashes` (`\"`, `\'`). Przy migracji wystarczy jednokrotne `stripslashes`. Posty, komentarze, shoutbox i tytuły nie zawierają ukośników.
- **Nowe linie**: prawdziwe znaki `\r\n`. Klient `mysql` w trybie wsadowym pokazuje je jako `\n` i podwaja ukośniki — nie sugerować się jego wyjściem.
- **Encje**: tekst wpisywany w formularzach (tytuły, posty, komentarze) ma encje HTML (`&quot;`, `&amp;`, `&#937;`).
- **`news_breaks = 'y'`** (64 newsy): przy wyświetlaniu stosowane `nl2br`.

## Inwentarz danych

| Tabela | Wiersze | Migracja | Uwagi |
|---|---:|---|---|
| `fusion_custom_pages` | 808 | tak | 737 z treścią, 71 pustych zaślepek „00 Pusta” do pominięcia |
| `fusion_news` | 379 | tak | 308 z rozwinięciem, 89 bez kategorii |
| `fusion_news_cats` | 22 | tak | każda z grafiką 150×200 w `images/news_cats/` |
| `fusion_forums` | 41 | tak | 5 kategorii + 36 działów |
| `fusion_threads` | 348 | tak | 6 przyklejonych, 14 zamkniętych, bez ankiet |
| `fusion_posts` | 11 263 | tak | 213 autorów, BBCode |
| `fusion_comments` | 2 303 | tak | newsy 1673, podstrony 539, zdjęcia 89, video 2 |
| `fusion_photo_albums` | 9 | tak | |
| `fusion_photos` | 360 | tak | pliki głównie luzem w `images/photoalbum/`, część w `album_N/`; 40 wpisów bez pliku |
| `fusion_users` | 3 915 | tylko ghost | treści ma 338 kont; reszta do pominięcia |
| `fusion_videos` / `_cats` | 74 / 7 | tak | same identyfikatory YouTube (infuzja FusionTube) |
| `fusion_shoutbox` | 3 680 | tak | |
| `fusion_polls` / `_votes` | 80 / 2 327 | tak | ostatnia ankieta 2016 |
| `fusion_weblinks` / `_cats` | 58 / 4 | tak | |
| `fusion_downloads` | 6 | tak | pliki w `downloads/` |
| `fusion_site_links` | 83 | jako wzór menu | struktura nawigacji, patrz niżej |
| `fusion_fp_tabs` | 1 | jako wzór | zakładki „News Center” na stronie głównej |
| `fusion_ratings` | 214 | nie | oceny wyłączone w ustawieniach |
| `fusion_messages` | 5 726 | nie | prywatne wiadomości |
| `fusion_articles` | 1 | nie | moduł nieużywany, treści są w podstronach |
| pozostałe | — | nie | sesje, logi, blacklisty, ustawienia silnika |

## Podstrony

Główna treść portalu. Brak kodu PHP, skryptów, iframe'ów i Flasha w treści — sam HTML z TinyMCE.

**Hierarchia jest w tytule**, rozdzielona przez ` - `, np. `MITOLOGIA GRECKA - BOGOWIE - Posejdon`. Główne gałęzie:

| Prefiks tytułu | Stron |
|---|---:|
| FAN FICTION | 187 |
| MITOLOGIA GRECKA | 170 |
| INFORMACJE | 117 |
| MITOLOGIA (inne, wstępy, angelologia, kultura) | 84 |
| MITOLOGIA SKANDYNAWSKA | 49 |
| Fan Arty | 59 |
| MITOLOGIA RZYMSKA | 36 |
| MULTIMEDIA | 17 |
| INNE | 8 |
| MENU (Regulamin, Redakcja, FAQ, Reklama, Postać Miesiąca) | 5 |

**Typy stron**:
- **Artykuł** — zwykła treść z obrazkami.
- **Hub** — tabela z listą odnośników do innych podstron (434 strony linkują do innych przez `viewpage.php?page_id=N`). Odnośniki trzeba przepisać na nowe adresy.
- **Mapa** — pocięty obraz w tabeli, komórki są odnośnikami (strona 388 Angelologia).

**Rzeczy do obsłużenia**:
- 83 strony mają ograniczony dostęp: 73 tylko dla zalogowanych (głównie MULTIMEDIA: odcinki, skany, soundtracki), 10 tylko dla redakcji. Decyzja: 73 strony stają się publiczne, redakcyjne migruję jako ukryte szkice — treść mają tylko 2 z nich (40 „Ataki” i 315), pozostałe 8 to puste zaślepki.
- 566 stron ma włączone komentarze.
- 388 stron odwołuje się do obrazków w `/img/...`, 168 ma obrazki z zewnętrznych hostingów.
- 99 stron zawiera tabele układu ze stałymi szerokościami w pikselach.
- 1 strona jest ucięta na limicie kolumny TEXT (65 535 bajtów): 367 „MITOLOGIA GRECKA - BOGOWIE - Posejdon” urywa się w połowie znacznika. Końcówki nie ma w bazie. Strona 670 (65 146 bajtów) jest kompletna.
- Część treści była wklejana z MS Word (klasy `MsoNormal`, `MsoListParagraph`, style `mso-*`). Przy migracji usuwać ten balast, zostawiając samą strukturę.

## Newsy

- Treść w `news_news` (zajawka) i `news_extended` (rozwinięcie), HTML z TinyMCE.
- 253 z obrazkami w treści, w tym 230 z zewnętrznych hostingów; 48 z YouTube, 36 z osadzonym `iframe`/`object`.
- Pole `news_image` praktycznie nieużywane (2 newsy) — ilustracją newsa jest grafika kategorii.
- Tagów w legacy nie ma. To nowa funkcja; na start można je zasilić z kategorii.

## Forum

- 5 kategorii: Saint Seiya Revolution, Saint Seiya, Fan Works, Manga & Anime, Inne.
- Dział „Redakcja” (id 9) tylko dla redakcji; „Kosz” (id 38) to śmietnik.
- **BBCode w użyciu**: `url`, `b`, `quote`, `i`, `img`, `small`, `u`, `center`, `code`, rzadko `size`, `color`, `spoiler`, `mail`. Do tego 9 emotikon tekstowych (`:)`, `;)`, `:(`, `:|`, `:o`, `:P`, `B)`, `:D`, `:@`) z plikami w `images/smiley/`.
- **Obrazki zewnętrzne**: 641 w postach. Najczęstsze hosty: tumblr, photobucket, imageshack, iv.pl, deviantart, blogspot, wrzucaj.net, tinypic. Duża część zapewne martwa.
- Załączników na forum brak.

## Galeria

- 9 albumów, 360 zdjęć: Avatary 89, Tapety 72, Komiksy 64, Sygnatury 43, Fan Arty 43, Okładki DVD/VCD 36, Konwenty 7, Gify 3, Screeny 3.
- Każde zdjęcie ma oryginał i miniatury `_t1` / `_t2`. Miniatury wygeneruję na nowo z oryginałów.
- Katalog `images/photoalbum/` ma 1482 pliki (116 MB) — więcej niż wpisów w bazie, część to osierocone pliki.
- Plik zdjęcia szukać najpierw w `album_N/`, potem luzem w `images/photoalbum/`: 308 zdjęć leży luzem, 12 w podkatalogu albumu.
- 40 wpisów albumu „Sygnatury” wskazuje ten sam nieistniejący plik `sygna_5b22.jpg` — nie do odzyskania, w albumie zostają 3 zdjęcia.

## Mapy interaktywne

Pocięte w Photoshopie obrazy złożone w tabelę HTML; wybrane kawałki są odnośnikami.

| Mapa | Gdzie | Dokąd prowadzą obszary |
|---|---|---|
| Mapa Nieba | `mapa/index.html` + 44 pliki `.htm` | okienko z opisem gwiazdozbioru i powiązanymi rycerzami (`mapa/rycerze/`, `mapa/mapki/`) |
| Królestwo Umarłych | `kr/index.html` | podstrony (`viewpage.php?page_id=N`) |
| Królestwo Posejdona | `posejdon.html` | podstrony |
| Angelologia | podstrona 388, obrazy w `an/images/` | podstrony |
| Interaktywne Sanktuarium | tylko grafika zapowiedzi w motywie | nigdy nie powstało |

Do nowej aplikacji: z każdej mapy potrzebny jest jeden scalony obraz oraz lista obszarów (pozycja, rozmiar, etykieta, cel). Pozycje da się wyliczyć z szerokości i wysokości komórek tabeli.

## Nawigacja

Menu boczne z `fusion_site_links` to sekcje z nagłówkiem-grafiką i listą odnośników:

- **Informacje**: Saint Seiya (Manga, Anime, Hades Chapter, Kinówki, Twórcy, Bohaterowie, Muzyka, Seiyuu), Lost Canvas (Manga, Anime, Gaideny, Autorka, Bohaterowie, Seiyuu), Omega (Anime, Bohaterowie, Muzyka), Inne (Kolejność, Kanon a niekanon, Chronologia, Historie Poboczne, Gigantomachia, Gry, Ataki, Zbroje, Cenzura, Historia fandomu, Sacred Saga, Kosmos, Cosmo vs Fizyka)
- **Mitologia**: Wstęp, Grecka, Rzymska, Skandynawska, Inne, Angelologia, Kultura
- **Astronomia**: Mapa Nieba
- **Multimedia** (tylko zalogowani): odcinki i mangi poszczególnych serii, Skany, Soundtracki
- **Galeria**: Avatary, Okładki, Tapety, Galeria Video
- **Fans**: Fan Fiction, Fan arty, komiksy
- **Partnerzy**: 3 odnośniki zewnętrzne

Menu górne: Główna, Galeria, Redakcja, Szukaj, Forum, Reklama.

## Użytkownicy

- 3 915 kont: 3 841 aktywnych, 41 zbanowanych, 30 nieaktywowanych; 2 superadminów, 1 admin.
- Treści (posty, komentarze, newsy, zdjęcia, shoutbox, video) ma 338 kont — tylko one stają się ghostami.
- Każdy autor posta istnieje w tabeli użytkowników (brak osieroconych autorów).
- Do ghosta przenoszę wyłącznie identyfikator i nick.

## Katalogi i pliki

| Ścieżka | Zawartość | Użycie |
|---|---|---|
| `img/` | 2168 plików, 174 MB — ilustracje podstron w podkatalogach tematycznych | kopiować pliki, do których odwołuje się treść |
| `images/photoalbum/` | zdjęcia galerii | kopiować oryginały wskazane w bazie |
| `images/news_cats/` | grafiki kategorii newsów | kopiować |
| `images/smiley/` | emotikony | kopiować |
| `images/avatars/` | awatary użytkowników | pominąć |
| `newscenter/` | bannery zakładek News Center | kopiować |
| `mapa/`, `kr/`, `an/`, `posejdon.html`, `images/posejdon/` | mapy interaktywne | scalić obrazy, wyliczyć obszary |
| `slides/`, `thumbs/`, `slides.xml` | 71 slajdów starego pokazu Flash | do sprawdzenia, czy warte użycia |
| `downloads/` | 6 plików do pobrania | kopiować |
| `themes/saintseiya-g-angeltheme3/` | motyw | baza wyglądu |
| `infusions/`, `administration/`, `includes/`, `locale/`, `forum/`, `*.php` | silnik PHP-Fusion i wtyczki | tylko jako opis zachowania |
| `test/` | druga kopia całego silnika | pominąć |
| `sw/` | inna, niezwiązana strona | pominąć |
| `php-cgi53.core` | zrzut pamięci procesu PHP, 653 MB | pominąć, można usunąć |
| `faktura.pdf`, `PKO.pdf`, `potwierdzenie.jpg`, `config.php` | pliki prywatne i dane dostępowe | nigdy nie kopiować |
| `*.swf` | Flash | pominąć |

## Motyw `saintseiya-g-angeltheme3`

**Układ**: stała szerokość 1100 px na tabelach. Od góry:
1. pasek użytkownika (logowanie albo awatar z ikonami) i licznik zarejestrowanych,
2. baner „Saint Seiya Revolution — Rycerze Zodiaku Polska” z grafikami Złotych Rycerzy (część tła `images/tlo.jpg`),
3. rozwijany shoutbox,
4. pomarańczowy pasek menu,
5. blok: zakładki „News Center” | najnowsze i najciekawsze tematy forum | przewijane przyciski,
6. pasek partnerów i fanpage,
7. lewa kolumna z menu (204 px) + treść (874 px),
8. pasek „Rycerze komentują”,
9. stopka: Najnowsze Video, Najnowsze Grafiki, „Revolucyjne projekty” (mapy), ostatnio widziani, prawa autorskie.

**Paleta** (ze `styles.css`):

| Rola | Kolor |
|---|---|
| tło strony | `#000000` |
| tła paneli | `#06171e`, `#0e1819`, `#111e23`, `#2d3c43`, `#033142` |
| akcent pomarańczowy | `#ff9b0d`, `#ff7a01`, `#e58907` |
| odnośnik | `#ffdf89` |
| odnośnik po najechaniu | `#24c4ff` |
| tekst pomocniczy | `#518da3`, `#74b6ce` |
| tekst na panelach | `#ffffff`, `#f8ffd1` |
| nagłówki w treści | `#ffcc99` |

**Typografia**: nagłówki na grafikach to kapitaliki szeryfowe w stylu Trajan; treść Verdana/Arial 10–11 px. W nowej wersji: wolny krój o tym samym charakterze na nagłówki, czytelny bezszeryfowy na treść, w normalnym rozmiarze.

**Grafiki do zachowania** (ilustracje, nie tekst):
- `images/tlo.jpg` — baner nagłówka z logotypem i postaciami; warianty sezonowe `tloswieta.jpg`, `tlohallowen.jpg`, `tlod.jpg`
- `images/kp.png`, `kpp.png`, `is.png`, `mapagwiazd.png` — kafle map („Revolucyjne projekty”), z wersjami czarno-białymi `*bw.png`
- `images/ryu.png`, `legends.png`, `banzai.png`, `iotaku.png` — przyciski partnerów
- `images/stopka_04.png` — sygnatura autora motywu
- `legacy/images/news_cats/*.jpg` — karty kategorii newsów
- `legacy/newscenter/*.png` — bannery News Center

**Grafiki-teksty do zastąpienia CSS-em**:
- przyciski menu `images/index_05…14.png` (Główna, Galeria, Redakcja, Szukaj, Forum, Reklama, Wymiana)
- nagłówki paneli `otra.jpg`, `informacje.jpg`, `galeria.jpg`, `fans.jpg`, `multimedia.jpg`, `ankieta.jpg`, `sbc.jpg`, `nawigacjapaneli.jpg`, `paneladmina.jpg`
- nagłówki sekcji menu w katalogu głównym: `ss.jpg`, `lc.jpg`, `omega.jpg`, `inne.jpg`, `mitologia.jpg`, `astronomia.jpg`, `partnerzy.jpg`, `manga.jpg`, `episodeg.jpg`, `next.jpg`
- ramki i belki treści `sb.jpg`, `tabledol.jpg`, `tlosrodka.jpg`, `nf.jpg`, `komenty.jpg`, `stopka_01…07.png`
- `czytajwiecej.png`, `witaj.png`, `haslo.png`, `rejestracja.png`, `panel/*.png`, `forum/*.png|gif` (ikony i przyciski — zastąpić ikonami wektorowymi)

## Stare adresy do przekierowań

| Stary adres | Treść |
|---|---|
| `news.php?readmore=N` | news |
| `news_cats.php?cat_id=N` | kategoria newsów |
| `viewpage.php?page_id=N` | podstrona |
| `forum/index.php` | forum |
| `forum/viewforum.php?forum_id=N` | dział forum |
| `forum/viewthread.php?thread_id=N` (opcjonalnie `&pid=M#post_M`) | temat |
| `photogallery.php`, `?album_id=N`, `?photo_id=N` | galeria, album, zdjęcie |
| `infusions/fusion_tube/videos.php` | galeria video |
| `profile.php?lookup=N` | profil użytkownika |
| `mapa/index.html`, `kr/index.html`, `posejdon.html` | mapy |
| `weblinks.php`, `downloads.php`, `search.php`, `contact.php` | linki, pliki, szukaj, kontakt |

Te same adresy występują wewnątrz treści (podstrony, newsy, posty), także w wersji bezwzględnej z `http://saintseiya.netserwer.pl/`. Przy migracji przepisuję je na nowe ścieżki.
