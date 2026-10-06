# Stan prac

Stan na 2026-10-05, koniec trzeciej sesji tego dnia — pierwszej na drugim komputerze (Windows, `E:\work\saintseiya`). Plik do aktualizowania na koniec każdej sesji. Zasady projektu są w `CLAUDE.md`, opis starej strony i importu w `docs/legacy.md`, obsługa w `README.md`.

## Gdzie jesteśmy

Aplikacja jest zbudowana od początku do końca i działa lokalnie na zaimportowanych danych. Przegląd działów panelu i moderacji jest prawie domknięty — w tej sesji scenariuszami e2e zamiast ręcznego klikania. Nie była jeszcze przeglądana przez Mateusza, nie ma podpiętego prawdziwego logowania Google ani hostingu.

| Kontrola | Wynik | Kiedy |
|---|---|---|
| `pnpm check` (lint, format, typy, Vitest) | zielone, 334 testy w 32 plikach | 2026-10-06, macOS, po usunięciu przycisku „Więcej newsów” i poprawce `BaseDialog` |
| `pnpm test:e2e` (Playwright) | zielone, 43 testy | 2026-10-06, macOS, pełny przebieg po poprawce `BaseDialog`; testy wyszukiwarki dodatkowo 12 razy z rzędu |
| `pnpm build` | nie ponawiany w tej sesji | ostatnio przechodził w poprzedniej sesji (macOS) |

- **Git**: zdalne repozytorium `origin` to `https://github.com/m-wyka/saintseiya` (**publiczne**). Cały kod jest na gałęzi `staging`. `main` ma tylko początkowy commit z pustym README i na razie go nie ruszamy; `staging` wyrasta z niego, więc da się je później scalić. `legacy/`, `.data/`, `.env` są ignorowane.
- **Niezacommitowane**: zmiany z tej sesji (lista w „Zrobione w ostatniej sesji”) leżą w katalogu roboczym na `staging` — czekają na decyzję Mateusza o commicie. Do tego nieśledzony `pnpm-workspace.yaml` (zgoda na skrypty instalacyjne `esbuild` i `unrs-resolver`, wymagana przez pnpm 12 na tym komputerze) — nie mój, do decyzji, czy trafia do repozytorium.
- **Niezacommitowane na macOS (2026-10-05)**: przebudowa nagłówka (sekcja „Przebudowa nagłówka” niżej) — czeka na decyzję o commicie. W tym samym drzewie leżą zmiany gwiezdnego tła (`StarrySky.vue`, `app/utils/sky*.ts`, `starfield.ts`, `constellations.ts`, `main.css`, `layouts/default.vue`, `tests/unit/starfield.test.ts`, scenariusz w `public.spec.ts`) z równoległej sesji — opis w sekcji „Gwiezdne tło” niżej, też czekają na decyzję o commicie.
- **Niezacommitowane na macOS, wieczór 2026-10-05**: siatka newsów i przebudowa sekcji strony głównej (obie opisane w „Zrobione w ostatniej sesji”) — czekają na decyzję o commicie.
- **Dostęp do GitHuba**: na pierwszym komputerze `origin` używa aliasu SSH `git@github-m-wyka:m-wyka/saintseiya.git` (jak `dot-sport-shop`), bo domyślne dane GitHuba należą tam do innego konta, bez prawa zapisu. Na drugim komputerze do wypychania potrzebny jest dostęp konta `m-wyka`.
- **Procesy**: nic z projektu nie działa w tle (serwer dev i pomocniczy MySQL na porcie 3399 zatrzymane).
- **Baza**: `.data/saintseiya.db` z importu 2026-10-05, obrazki zewnętrzne sprawdzone. Przegląd jej nie dotknął — 339 kont archiwalnych, żadnych kont testowych. Na tym komputerze są baza i `.data/uploads`; nie ma `legacy/` ani pomocniczego MySQL.
- **Baza na pierwszym komputerze (macOS)**: 2026-10-05 podmieniona na eksport z Windows, pobrany z Dysku Google (`saintseiya/saintseiya-export-2026-10-05/`: `saintseiya.db` + `uploads.zip`), z migracjami 0000–0004. Względem poprzedniej ma moduł FAQ (4 kategorie, 72 pytania; bez podstrony „Faq”), zmienione menu górne, poprawioną `/redakcja`, 10 wpisów dziennika i 3 konta nie-archiwalne (id 340–342, dwa z rolą administratora) — do usunięcia przed wdrożeniem. Wgrane pliki bez zmian (1677). Poprzednie dane leżą w `.data/backup-before-import-2026-10-05/` (190 MB) — można usunąć, gdy niepotrzebne.
- **Kopia do przeglądu**: na tym komputerze jej nie ma (tymczasową usunąłem po zrzutach ekranu). Ta na pierwszym komputerze (`.data/review/`) jest jednorazowa — komendy odtworzenia na końcu pliku.
- **`.env` na tym komputerze**: ma `NUXT_SESSION_PASSWORD` i `DATA_SYNC_DIR` (tej zmiennej kod nie używa), nie ma `NUXT_E2E_LOGIN=true` — do logowania testowego w `pnpm dev` trzeba ją dopisać albo podać w powłoce.

## Przeniesienie na inny komputer

Kod przenosi git (gałąź `staging`). Treści portalu są celowo poza gitem i trzeba je skopiować osobno.

| Co | Rozmiar | Po co | Jak przenieść |
|---|---|---|---|
| Kod | mały | praca | `git clone https://github.com/m-wyka/saintseiya.git`, potem `git switch staging` |
| `.data/saintseiya.db` | 25 MB | treści portalu | skopiować przy zatrzymanym serwerze; bez niej strona jest pusta |
| `.data/uploads/` | 165 MB | grafiki i pliki z legacy | skopiować razem z bazą |
| `.env` | 2 linie | sesja, logowanie testowe | skopiować albo `cp .env.example .env` i dopisać `NUXT_E2E_LOGIN=true` |
| `legacy/` | 1,0 GB, z czego 653 MB to zbędny `php-cgi53.core` | tylko ponowny import i zaglądanie do starej strony | opcjonalnie; plik `.core` pominąć |
| `.data/legacy-mysql/` | 231 MB | tylko ponowny import | nie kopiować — odtworzyć ze zrzutu według `docs/legacy.md` |
| `node_modules`, `.nuxt`, `.output`, `.data/e2e`, `.data/review`, `test-results` | — | — | nie kopiować, powstają na miejscu |

Paczka z tym, czego nie ma w gicie (baza, wgrane pliki, `.env`; ok. 190 MB) — spakować tutaj przy zatrzymanym serwerze, rozpakować w katalogu sklonowanego repozytorium:

```sh
tar czf saintseiya-dane.tgz .env .data/saintseiya.db .data/uploads    # pierwszy komputer
tar xzf saintseiya-dane.tgz                                           # drugi komputer, w katalogu repozytorium
```

Na drugim komputerze:

- Node 22.19 lub nowszy (`.nvmrc`; tutaj 22.22.1) i pnpm 9 (tutaj 9.15.3), potem `pnpm install` — `better-sqlite3` i `sharp` budują się pod daną maszynę, dlatego `node_modules` się nie kopiuje.
- Testy e2e lokalnie uruchamiają zainstalowanego Google Chrome (`channel: 'chrome'` w `playwright.config.ts`). Bez Chrome: `pnpm exec playwright install chromium` i start z `CI=1`.
- Ponowny import wymaga MySQL 8.0 (tutaj binaria z MAMP w `/Applications/MAMP/Library/bin/mysql80/`) i katalogu `legacy/`. Do zwykłej pracy niepotrzebny.
- Ręczny przegląd przez Claude wymaga rozszerzenia Claude in Chrome.
- `CLAUDE.md` wskazuje `/Users/mwyka/Work/dot-sport-shop/` jako wzorzec reguł ESLint/Prettier — ten katalog jest tylko na pierwszym komputerze. Reguły są już skopiowane, więc nie blokuje to pracy.
- Pamięć Claude dla projektu jest pusta — nie ma czego przenosić.

## Zrobione w ostatniej sesji

**Animacja `reveal` na wysokich blokach** (macOS, 2026-10-06; niezacommitowane):

- Błąd: na stronie głównej przewiniętej do góry duży kafel newsa stał kilka pikseli niżej niż mały obok i był przygaszony. `reveal` kończył animację po wjechaniu 55% wysokości elementu, więc kafel 563 px potrzebował 310 px, a kafel 272 px tylko 150 px.
- Poprawka w `main.css`: zasięg `entry min(55%, 8rem)` — najwyżej 128 px, niezależnie od wysokości. Dotyczy wszystkich użyć `reveal`, także długich postów na forum i sekcji `stage`, które wcześniej długo zostawały półprzezroczyste.
- Sprawdzone: `pnpm check`; pomiar w Chrome przez Playwright przy 1456×1201, 1456×1100 i 2560×1300 — oba kafle mają teraz to samo przesunięcie i krycie.
- Nie sprawdzone: `pnpm test:e2e`, Safari i Firefox, pozostałe strony z `reveal` na żywo.

**Sekcje strony głównej: komentarze, grafiki, video** (macOS, 2026-10-05; niezacommitowane):

- Powód: „Rycerze komentują”, „Najnowsze grafiki” i „Najnowsze video” leżały wprost na gwiezdnym niebie i zlewały się z nim. Każda sekcja ma teraz własną nieprzezroczystą „scenę” (`stage` w `main.css`) razem z nagłówkiem. Grafiki i video nie stoją już obok siebie — każda sekcja zajmuje całą szerokość kolumny treści; strona główna jest przez to dłuższa o ok. 700 px na komputerze.
- **Rycerze komentują** (`LatestComments`): zamiast karuzeli lista sześciu rycerzy (awatar z inicjałów, nick, tytuł komentowanej treści) i obok duży cytat. Głos przełącza najechanie myszą, kliknięcie i klawiatura (zakładki ARIA: strzałki, Home, End). Zaznaczenie przesuwa się pod aktywny wiersz (`sliding-thumb-x` / `sliding-thumb-y`), a przy cytacie rysuje się na złoto gwiazdozbiór znaku zodiaku z dnia komentarza, podpisany znakiem i datą — jak w kaflach newsów. Poniżej 576 px szerokości sceny lista zamienia się w rząd awatarów nad cytatem.
- **Najnowsze grafiki** (`LatestPhotos`): skośne pasy (`roster` w `main.css`). Gdzie jest mysz i co najmniej 576 px szerokości sceny, osiem pasów wypełnia rząd, a najechany lub wybrany klawiaturą rozsuwa się i pokazuje tytuł z albumem; ostatnio otwarty zostaje otwarty. Na ekranach dotykowych i w wąskiej kolumnie ten sam rząd jest przewijanym paskiem scroll-snap z podpisem na każdym pasie.
- **Najnowsze video** (`LatestVideos`): duży ekran i playlista czterech filmów. Kliknięcie w pozycję playlisty albo w ekran odtwarza film na miejscu (ramka `youtube-nocookie`), wcześniej kafle prowadziły tylko na `/video`.
- **Filmy usunięte z YouTube**: YouTube zamiast błędu odsyła szarą miniaturę 120×90 — `VideoPoster` rozpoznaje ją po rozmiarze (`isRemovedVideoPoster` w `app/utils/youtube.ts`). Taki film dostaje zaślepkę z gwiazdami, podpis „Niedostępny” i komunikat „Tego filmu nie ma już na YouTube.” zamiast przycisku odtwarzania; ekran sam ustawia się na najnowszym filmie, który jeszcze istnieje.
- **Stan danych**: z 74 filmów w bazie 36 nie ma już miniatury na YouTube (sprawdzone 2026-10-05 zapytaniami o `mqdefault.jpg`), w tym wszystkie cztery najnowsze — sekcja video na stronie głównej pokazuje więc teraz cztery zaślepki. Patrz „Decyzje dla Mateusza”, punkt 12.
- Cytat komentarza jest ucinany na granicy słowa z wielokropkiem (wcześniej twardo po 160 znakach, co ukrywało obcinanie CSS w karuzeli). Ucinanie wyszło z `news.ts` do `truncateAtWord` w `server/utils/html.ts`; zajawki newsów działają jak dotąd.
- Usunięte: `LatestMedia.vue`, narzędzie `carousel-arrows` w `main.css` (używała go tylko stara karuzela komentarzy) oraz zmienne `--carousel-*-label` w `NewsCenter` i klucze `HOME_PANELS.CAROUSEL_PREVIOUS` / `CAROUSEL_NEXT`, które służyły wyłącznie temu narzędziu. `VideoCard` bierze adresy z `app/utils/youtube.ts`, bez zmiany działania.
- Testy: `tests/unit/youtube.test.ts`, test cytatu w `translatedContent.test.ts`, dwa scenariusze e2e w `public.spec.ts` (przełączanie komentarzy myszą i strzałkami, przejście do grafiki, odtworzenie filmu; film usunięty z YouTube — miniatura podstawiona w teście). Dane e2e mają drugi komentarz, pod zdjęciem „Złota zbroja”.
- Obejrzane na zrzutach Playwright na zaimportowanej bazie: 1440, 1100, 800, 600, 390 i 360 px, `/en`, stan po najechaniu, fokus z klawiatury, dotyk, sekcje z jednym elementem, video z żywymi miniaturami (podstawionymi w przeglądarce) i z samym najnowszym filmem usuniętym.
- Nie sprawdzone: Safari i Firefox (zapytania kontenerowe, `tan()` w CSS, przejście `flex-grow`), prawdziwy telefon, płynność animacji na żywo (widziałem stany końcowe i jedną klatkę w trakcie), odtwarzanie filmu w ramce YouTube (sprawdzony jest tylko adres ramki), czytnik ekranu.
- Znane ograniczenia: miniatury grafik mają 480 px szerokości, więc rozsunięty pas (do ok. 410 px) jest na ekranie Retina lekko miękki, a panorama „12 Złotych Rycerzy” wyraźnie rozmyta — zniknie po podmianie grafik albo przy większych miniaturach. Lista filmów `/video` (`VideoCard`) nadal pokazuje szarą miniaturę YouTube przy usuniętych filmach.

**Siatka newsów** (macOS, 2026-10-05; niezacommitowane):

- Newsy to siatka zamiast szerokich kafli jeden pod drugim (`NewsGrid` — sam układ, bez pobierania danych). Liczba kolumn zależy od szerokości kolumny treści, nie okna (zapytania kontenerowe): 1 kolumna do 576 px, 2 do 896 px, 3 powyżej. Pierwszy news jest duży: 2×2 w trzech kolumnach; w dwóch zajmuje cały wiersz tylko wtedy, gdy pod nim zostaje parzysta liczba kafli, więc ostatni wiersz nigdy nie jest w połowie pusty.
- Strona główna pokazuje 6 najnowszych newsów (`latestNews` w `/api/home`, `LATEST_NEWS_COUNT`) bez paginacji; do pełnej listy prowadzi odnośnik „Wszystkie newsy” w nagłówku sekcji (przycisk „Więcej newsów” pod siatką Mateusz uznał za zbędny — usunięty). Paginacja jest tylko na liście wszystkich newsów, w kategorii i w tagu (`NewsListing`, 9 na stronę — bez zmian).
- Kafel (`NewsCard`, prop `featured`): na górze „wycinek nieba” (`star-chart` w `main.css`) z okładką kategorii i gwiazdozbiorem znaku zodiaku z dnia publikacji, podpisanym nazwą znaku i datą; niżej kategoria, tytuł (najwyżej 3 linie), zajawka (2 linie, w dużym kaflu 3), autor i liczba komentarzy. „Czytaj więcej” zniknęło — klikalny jest cały kafel; klucz `NEWS_LIST.READ_MORE` usunięty. Duży kafel ma przy 1440 px ok. 563 px wysokości (pierwsza wersja ok. 690 px — Mateusz uznał ją za za wysoką), mały 272–296 px. Wygląd „duży” włącza się dopiero, gdy kafel ma co najmniej 448 px szerokości, więc na telefonie i w jednej kolumnie pierwszy news wygląda jak pozostałe.
- Okładka kategorii jest pokazywana mała (80 px wysokości, w dużym kaflu 176 px), a za nią leży jej rozmyta, podbita kopia — poświata w kolorach grafiki. Dzięki temu grafiki 150×200 z legacy nie są rozciągane; po podmianie na lepsze układ się nie zmieni (proporcje 3:4, `object-cover`).
- Newsy bez kategorii (89 z 378) nie mają okładki — gwiazdozbiór stoi wtedy na środku.
- Znak zodiaku: `app/utils/zodiac.ts` (`zodiacSignOf`), dzień liczony w strefie `Europe/Warsaw` (`siteMonthAndDay` w `dates.ts`), nazwy w kluczach `ZODIAC.*`. News bez daty dostaje Pegaza bez podpisu.
- Po najechaniu lub fokusie z klawiatury: okładka się prostuje i raz błyska (`prism-glint`), poświata rośnie, linie gwiazdozbioru rysują się na złoto. Na ekranach dotykowych i przy `prefers-reduced-motion` kafel zostaje w stanie spoczynku albo zmienia się bez animacji.
- Geometria gwiazdozbioru w SVG wyszła z `PanelHeading` do `constellationFigure` w `app/utils/constellations.ts` — korzystają z niej oba komponenty; wygląd nagłówków paneli bez zmian.
- Testy: `tests/unit/zodiac.test.ts` (granice znaków, przełom roku, strefa czasowa), test `constellationFigure` w `starfield.test.ts`, test integracyjny sześciu najnowszych newsów w `homeContent`, w e2e kafel pokazuje datę i znak, a strona główna ma odnośnik „Wszystkie newsy” do `/newsy`.
- Obejrzane na zrzutach Playwright na zaimportowanej bazie: pierwsza wersja w 1440, 1100, 800 i 390 px (strona główna, `/newsy` strony 1, 2 i 40 — bez okładek, kategorie z jednym i dwoma newsami, `/en/news`, stan po najechaniu; fokus sprawdzony odczytem stylów); po zmniejszeniu kafli strona główna w 1440 i 1100 px, reszta tylko pomiarem rozmiarów kafli i brakiem poziomego przewijania (390 px, `/newsy` w 1440 i 1100 px, strona 40).
- **Poprawiony błąd w `BaseDialog`**: przeglądarka wysyła zdarzenie `close` ok. 40 ms po zamknięciu okna, a komponent ustawiał wtedy „zamknięte” bez sprawdzania stanu — okno otwarte ponownie w tym czasie (np. skrótem Ctrl/⌘+K tuż po „Zamknij”) od razu się zamykało. Teraz spóźnione zdarzenie jest pomijane, gdy okno jest już znów otwarte (`followNativeClose`). Objawem był test e2e „the search opens from the keyboard”, który padał w mniej więcej co trzecim przebiegu (wcześniejsze przypuszczenie o przeładowaniu strony przez równoległą sesję było błędne). Dotyczyło wszystkich okien dialogowych, nie tylko wyszukiwarki.
- Serwer dev po zmianie pliku serwera potrafi utknąć na błędzie 500 („Could not load virtual:#nitro-internal-virtual/public-assets-data … `.nuxt/dev/migrations/0001_blue_bucky.sql`”) do następnej zmiany pliku serwera; zdarzyło się raz, po dopisaniu `latestNews` w `server/utils/home.ts`. Wygląda na wyścig kopiowania migracji w haku `compiled` (`nuxt.config.ts`) z przebudową Nitro — nie badałem. Po dodaniu nowego pliku komponentu (`NewsGrid.vue`) przeglądarka nie widziała go, dopóki nie zapisałem ponownie stron, które go używają.
- Nie sprawdzone: Safari i Firefox (rozmycie, maski, zapytania kontenerowe), prawdziwy telefon, płynność animacji na żywo (widziałem tylko stan końcowy), bardzo długie nazwy znaku lub daty po angielsku w wąskim kaflu.
- Do decyzji: strona newsa (`/newsy/<slug>`) pokazuje okładkę kategorii po staremu, pływającą po prawej — nie ruszałem.

**Przebudowa nagłówka** (macOS, 2026-10-05; niezacommitowane):

- Pasek górny nad banerem zniknął. Statystyki (Rycerzy, postów, komentarzy) są zaparkowane w `app/components/layout/SiteStatistics.vue` — komponent nie jest nigdzie podpięty; `/api/layout` nadal je zwraca.
- Menu konta siedzi po prawej stronie paska menu głównego (`UserMenu` na nowym `BaseDropdown`). Zalogowany: awatar z inicjałów (`initialsOf`, pierwsze dwa słowa nicku) + nick, w środku nick i rola, Profil, Twoje konto, Panel administratora (role inne niż `user`), język PL/EN, Wyloguj. Gość: przycisk „Zaloguj”, w środku język i „Zaloguj przez Google”. Poniżej `sm` w pasku zostaje sam awatar.
- Zdjęcie z Google nie jest już pokazywane w nagłówku (zostaje w profilu i postach).
- Odnośniki paska mają `text-xs`; „Newsy” wypadły z `MAIN_NAVIGATION` (czyli także z menu mobilnego i skrótów wyszukiwarki) — lista newsów jest pod „Wszystkie newsy” na stronie głównej.
- `LanguageSwitcher` to teraz `role="group"` zamiast `<nav>`; `routes.account()`; klucze `LAYOUT.PROFILE`, `LAYOUT.SIGN_IN`, `LAYOUT.PANEL` = „Panel administratora”.
- Testy: e2e przepisane pod menu (`openAccountMenu` w `tests/e2e/helpers.ts`), strona 404 sprawdza menu boczne zamiast statystyk, nowy test jednostkowy `tests/unit/initials.test.ts`. Obejrzane na zrzutach 1280, 1024, 768, 390 i 360 px (gość i zalogowany, PL i EN), bez przewijania paska.
- Wyszukiwarka w pasku to teraz „pole” (`SearchTrigger.vue`): ikona, „Szukaj” i podpowiedź skrótu — `⌘K` na Apple, `Ctrl K` gdzie indziej (rozpoznanie po `user-agent`, wartość z serwera przez `useState`); na telefonie sama ikona w kółku. Okno otwiera też `/`, o ile fokus nie jest w polu tekstowym ani edytorze. Nowy scenariusz e2e „the search opens from the keyboard”.
- Nie sprawdzone: animacja otwierania na żywo (tylko stan końcowy na zrzutach), Safari i Firefox, obsługa klawiaturą poza Escape w kodzie.

**Nagłówki paneli** (macOS, 2026-10-05; niezacommitowane):

- Nowy `PanelHeading` (`app/components/content/PanelHeading.vue`): tytuł na skośnej złotej płycie, obok pasek nocnego nieba z gwiazdozbiorem. Zastąpił płaski pomarańczowy pasek w menu bocznym (`NavigationSections`, więc także w menu mobilnym), w News Center i w kategoriach na `/forum`. Style w `main.css`: `star-banner`, `star-banner-plate`, `star-banner-sky` (dolna złota linia, gasnąca od stopy skosu ku gwiazdozbiorowi), `constellation-trace`; nowy kolor `gold-100`. Płyta i niebo mają tylko łagodne przejście w poziomie — pionowy gradient „jasna góra, ciemny dół” i wytłoczony cień tekstu Mateusz odrzucił jako staroświeckie.
- Gwiazdozbiory pochodzą z `app/utils/constellations.ts` — pliku z równoległej pracy nad niebem gwiezdnym. `PanelHeading` od niego zależy, więc oba muszą trafić do repozytorium razem. Menu boczne dostaje po kolei Pegaza, Smoka, Łabędzia, Andromedę i Feniksa; News Center i forum idą zodiakiem od Barana.
- Przy wejściu na stronę płyta raz błyska, a linie gwiazdozbioru się rysują (w menu bocznym kaskadowo, przez `--banner-order`). Przy `prefers-reduced-motion` animacji nie ma.
- Pozostałe użycia `cosmo-bar` (okna dialogowe, przyciski, zakładki, panel administratora) bez zmian.
- Sprawdzone: lint całości, format zmienionych plików, typy, Vitest (324 testy). Pełne `pnpm check` staje na formacie czterech plików nieba gwiezdnego (`StarrySky.vue`, `constellations.ts`, `skyPainter.ts`, `skyShow.ts`), których tu nie ruszałem. Obejrzane w Chrome (strona główna, forum) i na zrzutach Playwright (menu mobilne 390 px, ograniczony ruch).
- Nie sprawdzone: `pnpm test:e2e`, Safari i Firefox, tytuł sekcji dłuższy niż dwie linie w menu bocznym (przy czterech liniach skos płyty dochodzi do gwiazdozbioru).

**Nagłówki sekcji** (macOS, 2026-10-05; niezacommitowane):

- `SectionHeading` (`app/components/content/SectionHeading.vue`) jest wyraźniejszy: tytuł 24 px pogrubiony (było 20 px), wyrównany do lewej krawędzi treści, a pod nim na całą szerokość „meteor” — czteroramienna gwiazda z poświatą i zwężająca się, gasnąca w prawo złota smuga. Zastąpił mały pomarańczowy pasek przed tytułem. Odnośnik „Zobacz wszystko” zostaje po prawej, w wierszu tytułu. Propsy bez zmian, więc żadne z 11 użyć nie wymagało poprawek.
- Style w `main.css`: `meteor-head`, `meteor-trail`. Smuga rysuje się od gwiazdy przy wjeżdżaniu nagłówka w ekran (`animation-timeline: view()`, jak `reveal`); bez wsparcia przeglądarki i przy `prefers-reduced-motion` jest od razu cała.
- Odrzucony wariant: gwiazda, tytuł i smuga w jednym wierszu. W kolumnach 460 px („Najnowsze grafiki / video”) tytuł się łamał, smuga kurczyła się do kikuta wyglądającego jak strzałka, a w „Rycerze komentują” wchodziła pod strzałki karuzeli.
- Sprawdzone: `pnpm check`, `pnpm test:e2e`, zrzuty Playwright 1440 i 390 px (strona główna, `/linki`, `/faq`), przebieg animacji zmierzony przy przewijaniu w Chrome.
- Nie sprawdzone: Safari i Firefox, pozostałe miejsca użycia na żywo (komentarze pod treścią, mapy, tagi, profil użytkownika) — ten sam komponent, ale nie oglądane.

**Gwiezdne tło** (macOS, 2026-10-05, równolegle z przebudową nagłówka; niezacommitowane):

- Stare tło (`starfield`: osiem kropek w CSS migających razem) zastąpił komponent `StarrySky` (`app/components/layout/StarrySky.vue`) w `layouts/default.vue`. Panel administratora bez zmian. Z `main.css` wypadły `starfield`, `--animate-twinkle` i klatki `twinkle`.
- Dwie warstwy canvas pod treścią. Nieruchoma: mgławica wzdłuż ukośnego pasa i gwiazdy (jedna na 700 px², najwyżej 6000; dużo słabych i niewiele jasnych, jak na prawdziwym niebie; sześć odcieni; poświata i krzyżowy błysk przy najjaśniejszych). Żywa: migotanie, gwiazdozbiory i meteory. Niebo jest za każdym razem takie samo (ziarno 1986).
- Gwiazdozbiory w `app/utils/constellations.ts`: dwanaście znaków zodiaku oraz Pegaz, Smok, Łabędź, Andromeda i Feniks, z prawdziwych pozycji gwiazd (J2000, współrzędne z danych d3-celestial, zrzutowane na płasko). Co kilka sekund jeden rysuje się w marginesie obok treści, na zmianę z lewej i z prawej: gwiazdy zapalają się po kolei, linie się dorysowują, całość gaśnie po ok. 15 s. Figura obraca się tak, żeby jak najlepiej wypełnić margines.
- Meteory co 8–20 s, wszystkie w tym samym kierunku; mniej więcej co ósmy raz leci seria 4–7 (ukłon w stronę Pegasus Ryūsei Ken).
- Bez bibliotek. Phaser (ok. 345 kB po gzipie) i anime.js (silnik animacji wartości — rysowanie na canvasie i tak trzeba napisać samemu) odpadły; własny kod ma 10 kB po minifikacji, 4,6 kB po gzipie.
- Obie warstwy są rysowane w gęstości ekranu (najwyżej 2, najwyżej 6 mln pikseli na warstwę). Żywa była początkowo w gęstości 1 i linie gwiazdozbiorów wychodziły na Retinie schodkowe — poprawione po uwadze Mateusza; linia to teraz ostry rdzeń 1 px i dwa coraz słabsze, szersze przejścia zamiast jednej płaskiej poświaty.
- Obciążenie zmierzone w Chrome bez okna, 1920×1080 przy gęstości 2, przez 20 s: animacja dokłada ok. 520 ms pracy głównego wątku (ok. 2,6%), strona trzyma 60 kl./s. Pętla rysuje każdą klatkę, gdy gwiazdozbiór się rysuje lub gaśnie i gdy leci meteor, a poza tym ok. 20 kl./s (samo migotanie). Początkowo rysowanie linii też szło w ok. 20 kl./s i wyglądało na przycinające — poprawione po uwadze Mateusza. Na ekranie 120 Hz nie mierzone.
- Animacja nie działa przy `prefers-reduced-motion` (zostaje nieruchome niebo i po jednym gotowym gwiazdozbiorze w każdym marginesie) oraz poniżej ok. 1344 px szerokości, gdzie treść zasłania niebo. Gwiazdozbiory pojawiają się od ok. 1408 px. Decyzja Mateusza: na telefonach (poniżej `md`) ma zostać samo nieruchome niebo, bez animacji — tak działa od początku, bo próg 1344 px jest ostrzejszy; zmierzone przy 390, 767, 768, 1024, 1280 i 1343 px (warstwa z animacją ma 0×0, zero odświeżeń) i pilnowane testem w `mobile.spec.ts`. Między 768 a 1343 px animacji też nie ma, bo strona nie ma tam marginesów.
- `PanelHeading` z równoległej pracy korzysta z `fitConstellation(constellation, box, turn)`; przy `turn = 0` wynik jest zawsze ten sam, więc serwer i przeglądarka rysują to samo.
- Testy: `tests/unit/starfield.test.ts` (12 testów) i scenariusz e2e w `public.spec.ts`. `pnpm check` zielone (324 testy w 30 plikach) i `pnpm test:e2e` zielone (40 testów) — oba puszczone ze zmianami nagłówka leżącymi w tym samym drzewie. Format czterech plików nieba, na którym wcześniej stawało `pnpm check`, jest poprawiony.
- Obejrzane na zrzutach Playwright: 1440, 1512, 1920 i 2560 px, telefon 390 px, ograniczony ruch; przebieg rysowania gwiazdozbioru na serii klatek.
- Nie sprawdzone: Safari i Firefox, prawdziwy telefon, zużycie GPU i baterii (mierzony był tylko główny wątek), `pnpm build`. Płynność oceniona z klatek i pomiaru, nie na żywo w oknie przeglądarki.

Pierwsza sesja na Windows. Bez sterowanej przeglądarki (brak rozszerzenia Claude in Chrome), więc przegląd szedł scenariuszami Playwright i zrzutami ekranu.

**Uruchomienie na Windows** — `pnpm check` padało na dwóch testach, oba poprawione:

1. `tests/unit/serverRules.test.ts` — oczekiwana ścieżka była wpisana z ukośnikami POSIX; teraz liczona przez `resolve`.
2. `server/utils/imageProcessing.ts` — `sharp.cache({ files: 0 })`. libvips trzymał otwarte pliki, które wcześniej czytał, i Windows nie pozwalał ich potem usunąć (`EBUSY` przy sprzątaniu w `tests/unit/legacy/maps.test.ts`; to samo groziło przy usuwaniu zdjęć w panelu).

**Nowe testy e2e** (26 → 33):

- `admin.spec.ts` — **odświeżanie roli w sesji**: zalogowany użytkownik po nadaniu roli moderatora widzi „Panel” i tylko przyznane działy już po przeładowaniu strony; po blokadzie jest wylogowany. Przy okazji wyszukiwanie i filtr „Zablokowani” w Użytkownikach, blokada i odblokowanie.
- `moderation.spec.ts` (nowy plik):
  - moderacja forum: edycja cudzego posta, usunięcie posta, przyklejenie, przeniesienie do działu redakcji (zwykły użytkownik dostaje 404), usunięcie tematu;
  - komentarze: ukrycie znika ze strony publicznej, przywrócenie wraca;
  - ankiety: dodanie z trzema odpowiedziami, zakończenie (brak przycisków głosowania), usunięcie;
  - nawigacja: dodanie odnośnika, zmiana kolejności, widok w menu portalu, zmiana nazwy, usunięcie;
  - video: dodanie z adresu YouTube, edycja, usunięcie;
  - galeria: wgranie dwóch zdjęć, edycja tytułu, okładka, zmiana kolejności, widok publiczny, usunięcie.
- `public.spec.ts` — strona 404 pokazuje statystyki w pasku górnym.

**Wygląd na telefonie** — zrzuty 390 px na prawdziwych danych (strona główna, newsy, forum, galeria, mapy, szukaj, linki, ankiety, video, pliki, shoutbox, dwie podstrony). Obejrzałem stronę główną, forum, newsy i galerię; pozostałe sprawdzone tylko na brak poziomego przewijania.

**Znalezione i poprawione błędy**:

1. `app/pages/index.vue` — strona główna na telefonie wychodziła 85 px poza ekran (kolumna siatki bez `minmax(0, 1fr)` rozpychana przez treść News Center). Test e2e tego nie łapał, bo dane testowe są za skromne.
2. `app/assets/css/main.css`, `carousel-tabs` — przeglądarka wymusza `contain: size` na pasku zakładek, więc miał wysokość 0, a zakładki wylewały się na treść; gdy zawijały się do drugiego rzędu (telefon), nachodziły na nagłówek. Pasek ma teraz jawną wysokość i jeden przewijany rząd.

**Poprawione uwagi z poprzedniego przeglądu** (dawne punkty 1–5):

- News Center — poziomy pasek przewijania pod treścią ukryty tam, gdzie działają zakładki.
- Pasek górny — „Rycerzy” nie pokazuje się, dopóki licznik wynosi 0; strona błędu ładuje dane układu, więc ma statystyki i menu.
- Panel → Użytkownicy — „Na portalu od” przy kontach archiwalnych pokazuje „—”.
- Panel → Obrazki — komunikat o odrzuconym pliku znika przy następnej akcji.
- Tabele panelu — akcje wiersza są grupą z etykietą „Akcje: <nazwa wiersza>” (`AdminTable`).
- `UserRoleForm` — podpowiedź mówiła o ponownym zalogowaniu; zmiana roli działa od najbliższego wczytania strony.

**Angielska struktura plików** (czwarta sesja 2026-10-05) — pliki i katalogi w `app/pages` przemianowane na angielskie (`newsy/` → `news/`, `forum/dzial` → `forum/section`, `admin/uzytkownicy.vue` → `admin/users.vue` itd.). Polskie adresy URL zostały.

**i18n, etap 1 — teksty statyczne** (ta sama sesja; niezacommitowane):

- `@nuxtjs/i18n` 10: `pl` domyślny bez prefiksu, `en` pod `/en` z angielskimi adresami (`/en/news`, `/en/forum/thread/1`, `/en/admin/users`). Przełącznik PL/EN w pasku górnym, `lang` i `hreflang` w nagłówku strony. Bez automatycznego przekierowania według języka przeglądarki.
- 736 kluczy w `i18n/locales/pl.json` i `en.json` (płaskie `SEKCJA.NAZWA`), wyniesione ze stron, komponentów, panelu administratora i komunikatów serwera (serwer zwraca klucze `ERRORS.*` / `VALIDATION.*`). Daty i liczby formatowane według języka.
- Typowane trasy (`experimental.typedPages`) wyłączone — kłóciły się z trasami i18n; parametry trasy czyta `useRouteParam()`.
- Angielskie tłumaczenia napisał Claude — do przejrzenia przez Mateusza.

**i18n, etap 2 — treści z bazy i grafiki PL/EN** (ta sama sesja; niezacommitowane):

- Nowa tabela `translations` (migracja `0001_blue_bucky.sql`) — wersja polska zostaje w dotychczasowych tabelach, angielska jest nakładką z powrotem do polskiej, gdy tłumaczenia brak.
- Tłumaczalne: newsy (tytuł, zajawka, treść), kategorie newsów (nazwa, obrazek), tagi, podstrony (tytuł, treść), mapy (tytuł, opis, obraz, zajawka graficzna) i ich obszary (etykieta, treść okienka), albumy (tytuł, opis, okładka), zdjęcia (tytuł, opis), kategorie video i filmy, kategorie i działy forum, ankiety i odpowiedzi, linki i ich kategorie, pliki (tytuł, opis), menu boczne, News Center.
- Panel: przełącznik „Język treści” PL/EN nad każdą stroną panelu. W trybie EN formularz pokazuje tłumaczenie (albo polską treść do przetłumaczenia), zapis trafia do wersji angielskiej; pola wspólne (status, kategoria, kolejność, geometria obszarów mapy) zapisują się dla obu języków. Listy w panelu pokazują wersję polską.
- Strona: `/en/...` pokazuje tłumaczenia (także w wyszukiwarce), odnośniki w treści i permalinki postów zostają w wersji EN.
- Testy: 16 nowych testów integracyjnych i scenariusz e2e (tłumaczenie newsa w panelu → widoczne tylko pod `/en`).

Świadomie poza zakresem etapu 2:

- **Slugi i adresy treści** są wspólne dla obu języków (`/en/news/powrot-brazowych-rycerzy`, `/en/mitologia/grecka`).
- **Treści użytkowników** (forum, komentarze, shoutbox) nie mają wersji językowych — założenie przyjęte bez odpowiedzi Mateusza, do potwierdzenia.
- **Pliki zdjęć w galerii i pliki do pobrania** są jedne dla obu języków (tłumaczą się tylko podpisy). **Grafiki motywu** z `public/theme` (baner, przyciski partnerów) nie są zarządzane w panelu.
- **Obraz mapy per język** musi mieć te same proporcje co polski — obszary są wspólne.
- **Nowy rekord** powstaje zawsze jako wersja polska; tłumaczenie dodaje się przy edycji.
- Edytor potrafi przeformatować stary HTML z legacy przy samym otwarciu — zapis w trybie EN utrwali wtedy polską treść jako „tłumaczenie” tego pola (późniejsze zmiany wersji polskiej nie przejdą do EN, dopóki pole EN nie zostanie wyczyszczone).
- Po logowaniu Google użytkownik wraca na polską stronę główną; tytuł `Film YouTube` w osadzonych filmach i domyślne komunikaty Zod nie są tłumaczone.
- Ponowny `pnpm legacy:import --force` kasuje tłumaczenia razem z bazą.

**Przegląd błędów w całym kodzie** (piąta sesja 2026-10-05; niezacommitowane) — trzy równoległe przeglądy (serwer publiczny, panel, front publiczny), każde zgłoszenie sprawdzone w kodzie przed poprawką:

- Wyszukiwarka dopasowywała znaczniki HTML (`lazy`, `strong`, `href`) i nie znajdowała tekstu z `&`; teraz szuka w widocznym tekście (funkcja SQLite `searchable_text`).
- Edycja posta zapisywała zaślepkę martwego obrazka zamiast oryginalnego `<img>` — formularz pobiera surową treść z `GET /api/forum/posts/:id`.
- Autor mógł edytować post w zamkniętym temacie i w dziale redakcji po utracie roli; przycisk „Edytuj” znika w zamkniętym temacie.
- Shoutbox nie wysyłał tokenu captcha (po włączeniu Turnstile każdy wpis by padał); wpis z dalszej strony wraca na pierwszą.
- Sesja: `setUserSession` sklejał tablicę uprawnień przy każdym odświeżeniu (rosnące ciasteczko moderatora) — zapis przez `storeSessionUser` / `replaceUserSession`.
- Komentarze szkiców i okruszki ze szkicami przodków były publicznie czytelne; statystyki w pasku liczyły szkice, ukryte komentarze i dział redakcji.
- Panel w trybie EN: formularze nawigacji i plików pokazywały polski tekst i kasowały tłumaczenie przy zapisie; szkice newsów lądowały na końcu listy; lista zostawała na nieistniejącej stronie po usunięciu ostatniego wiersza; `SimpleCrud` pokazywał stary błąd.
- Front: „Pełny rozmiar” zdjęcia dawał 404 pod `/en`; menu mobilne blokowało przewijanie po poszerzeniu okna i nie zamykało się po kliknięciu odnośnika do bieżącej strony; odnośniki w treści pod `/en` otwierane w nowej karcie prowadziły do wersji polskiej; okno dialogowe zamykało się przy zaznaczaniu tekstu; `reveal` i płynne przewijanie ignorowały `prefers-reduced-motion`.
- Drobne: captcha i limit zużywane przed walidacją treści, permalink posta jako 302, nick z numerem ponad 30 znaków, wymiary zdjęć z orientacją EXIF, adresy `constructor` w panelu i starych odnośnikach, `usePageQuery` zamiast siedmiu kopii, usunięty martwy kod i nieużywane klucze tłumaczeń.

- Po decyzjach Mateusza: Panel → Obrazki ostrzega przed usunięciem używanego obrazka (`isMediaImageUsed`); obrazy map mają własny adres wgrywania (`/api/admin/map-image`) i są usuwane z dysku przy podmianie i usunięciu mapy, a wgrane i nigdy niezapisane po 24 h (`cleaningUpMapImages`); okładkę albumu da się ustawić osobno dla EN; numer strony poza zakresem przekierowuje na ostatnią stronę; usunięte martwe kolumny `forums.last_post_at` i `media_images.alt` (migracja `0002_brief_revanche.sql`, zastosuje się przy starcie).

**Wygląd podstrony `/redakcja`** (niezacommitowane) — tabele profili z legacy (nick, kontakt, awatar z `rowspan`, stanowisko, opis) są pokazywane jako karty, nagłówki grup jako nagłówki szeryfowe, a „Byli członkowie” jako równa siatka awatarów. Sam CSS w `rich-content` (`app/assets/css/main.css`), dopasowany do struktury tabeli — treść w bazie bez zmian; wzorzec pasuje tylko do tej strony. Obejrzane na zrzutach 1280 i 390 px. Decyzje Mateusza: prywatnych wiadomości na razie nie robimy, numer GG wylatuje, adresy e-mail redakcji zostają — odnośniki „Prywatna Wiadomość” i numer GG usunięte z treści strony w lokalnej bazie (`pages.id = 1`); ponowny import z legacy je przywróci, importer nie był zmieniany. Trzy awatary nie istnieją w plikach (zaślepka).

**Dziennik zmian** (szósta sesja 2026-10-05; niezacommitowane):

- Tabela `audit_logs` (migracja `0003_true_skaar.sql`, zastosuje się przy starcie): kto (id, nick i rola w chwili zdarzenia), kiedy, akcja (dodanie, zmiana, usunięcie, logowanie, rejestracja), dział, id i nazwa pozycji, język treści oraz lista pól „było → jest”. Długie teksty zapisują się jako wycinek 400 znaków wokół miejsca zmiany.
- Logowane: wszystkie zasoby panelu (wspólne handlery), pliki, zdjęcia i okładki albumów, obrazki, kolejność (podstrony, zdjęcia, menu), ukrywanie i usuwanie komentarzy i wpisów shoutboksa, blokady i role użytkowników, News Center, moderacja forum (zamknięcie, przyklejenie, przeniesienie, usunięcie tematu, edycja i usunięcie posta — także edycja własnego posta przez autora), zmiana nicku, usunięcie konta, rejestracja, logowanie i rola nadana z `NUXT_ADMIN_EMAILS`.
- Nie logowane: nowe posty, komentarze, wpisy shoutboksa i głosy w ankietach (mają własnego autora i datę; głosy są tajne), wgranie obrazu mapy przed zapisem mapy, logowanie testowe nadające rolę.
- Dziennik nie przechowuje e-maili, identyfikatorów Google, awatarów ani adresów IP. Nie ma też automatycznego czyszczenia starych wpisów.
- Panel → Portal → „Dziennik zmian” (`/admin/dziennik`, tylko administrator): filtr akcji i działu, szukanie po nicku lub nazwie pozycji, rozwijane szczegóły zmian. Nazwy pól pokazują się tak jak w kodzie (`bodyHtml`, `isHidden`).
- Testy: 12 nowych testów integracyjnych (`tests/integration/auditLog.test.ts`) i scenariusz e2e w `admin.spec.ts`. `pnpm lint`, `pnpm typecheck` i Vitest (299 testów) zielone; z e2e uruchomione `admin`, `moderation` i `community` (22 testy, zielone), `public` i `mobile` nie.
- `app/assets/css/main.css` ma niezacommitowane zmiany spoza tej pracy (plik zmieniał się równolegle w trakcie sesji) — nie ruszałem ich. `pnpm format:check` na koniec zielone.
- `pnpm legacy:import --force` kasuje dziennik razem z bazą.

## Co jest zrobione

**Dane**
- Importer `scripts/legacy/` (powtarzalny, ok. 10 s): konta archiwalne, newsy, podstrony w drzewie, forum, komentarze, galeria, video, shoutbox, ankiety, linki, pliki, menu, News Center, 4 mapy interaktywne.
- Konwersja treści: kodowanie ISO-8859-2, czyszczenie HTML, BBCode → HTML, emotikony → emoji, przepisanie starych odnośników na nowe adresy.
- Sprawdzanie obrazków zewnętrznych (`pnpm images:check`): 1701 działa, 852 martwe.

**Strona publiczna**
- Strona główna, newsy (kategorie, tagi), podstrony z okruszkami i hubami, forum, galeria, video, mapy z okienkami treści, linki, pliki, ankiety, shoutbox, wyszukiwarka w oknie modalnym (przycisk „Szukaj” lub Ctrl+K; `/szukaj` przekierowuje na stronę główną), profile.
- Logowanie Google, konto (zmiana nicku, usunięcie konta → „Konto nieaktywne”), pisanie na forum, komentarze, shoutbox, głosowanie; captcha Turnstile i limit częstotliwości.
- Przekierowania 301 ze starych adresów (`viewpage.php`, `news.php`, `forum/viewthread.php`, `kr/index.html` itd.).
- Zaślepka „Nie znaleziono zdjęcia” dla martwych obrazków.

**Panel administratora** (`/admin`)
- Dashboard ze statystykami i wykresami.
- Newsy, kategorie, tagi, podstrony (drzewo), mapy (edytor obszarów), obrazki, galeria, video, pliki, linki, forum (struktura), komentarze, shoutbox, ankiety, użytkownicy i role, nawigacja, ustawienia (News Center).
- Moderacja forum na stronie tematu: zamknięcie, przyklejenie, przeniesienie, usuwanie, edycja postów.

## Czego nie sprawdziłem

- **Panel: Podstrony** — w e2e tylko dodanie strony pod hubem; przenoszenie w drzewie, zmiana rodzica i usuwanie tylko w testach integracyjnych.
- **Panel: Forum (struktura)** — działy i kategorie obejrzane po załadowaniu, akcje tylko w testach integracyjnych.
- **Panel: Użytkownicy** — nadanie roli i blokada przeszły w e2e; odebranie roli i komunikaty odmowy (ostatni administrator, własne konto) tylko w testach integracyjnych.
- **Nowe scenariusze e2e działają na skromnych danych testowych**, nie na zaimportowanej bazie — błąd szerokości strony głównej pokazał, że to robi różnicę. Działów panelu z tej sesji nikt nie oglądał na prawdziwych danych.
- **Wygląd na telefonie** — widziałem cztery strony na zrzutach 390 px; panelu administratora, tematu forum, mapy i formularzy na telefonie nikt nie oglądał. Brak testu regresji dla błędu szerokości strony głównej (wymagałby szerszej treści w danych testowych).
- **Zakładki News Center w przeglądarkach bez `::scroll-marker`** (Firefox, Safari) — tam zostaje samo przewijanie w poziomie z widocznym paskiem; nie sprawdzałem.
- **`pnpm build` i start `.output`** — nie uruchamiane na Windows.
- **Prawdziwe logowanie Google i prawdziwa captcha** — brak kluczy, testowane tylko logowanie testowe.

## Uwagi z przeglądu (niepoprawione)

1. **Strona główna, News Center** — pod krótką treścią zakładki zostaje duża pusta przestrzeń (panel rozciąga się do wysokości prawej kolumny). Kwestia wyglądu, do decyzji.
2. **Statystyki** — nie są teraz nigdzie pokazywane (`SiteStatistics.vue` czeka na miejsce). „Rycerzy” jest w nim ukryte przy zerze; do decyzji, czy zamiast tego liczyć też konta archiwalne (339).
3. **Listy poza `AdminTable`** (zdjęcia w albumie, nawigacja, zakładki ustawień) — przyciski „Edytuj” i „Usuń” nadal bez nazwy z kontekstem pozycji.
4. **Emotikony** — w nowych wpisach `:)` zostaje tekstem; zamiana na emoji działała tylko przy imporcie.
5. **Pliki do pobrania** — trzy pozycje z konkursu z 2013 r. i regulamin „konta VIP”, w opisach adres e-mail konkursu. Do decyzji, czy zostają publicznie.
6. **`i18n.baseUrl`** czyta `NUXT_PUBLIC_SITE_URL` przy budowaniu — zmienna musi być ustawiona już podczas `pnpm build`, inaczej `hreflang` wskaże `localhost`. Do ustawienia przy wdrożeniu dev/prod.

## Decyzje dla Mateusza

1. **Wygląd** — do obejrzenia i uwag. Grafiki z legacy czekają na wersje w lepszej jakości.
2. **Pobranie działających obrazków zewnętrznych na własny serwer** (1701 adresów). Chroni przed ich zniknięciem i przed blokowaniem obrazków `http://` na stronie `https://`. Nie robiłem bez zgody.
3. **Sekcja Multimedia** (odcinki, skany, soundtracki). Strony są publiczne zgodnie z decyzją, ale nie ma ich w menu — w legacy te odnośniki widział tylko właściciel. Dodać do menu czy zostawić?
4. **Hosting**: VPS czy Render, domena, kopie zapasowe. Pomiary i zalecane parametry VPS w sekcji „Wymagania serwera” niżej.
5. **Klucze**: Google OAuth, Cloudflare Turnstile, `NUXT_ADMIN_EMAILS`.
6. **`legacy/php-cgi53.core`** (653 MB zrzutu pamięci) — można usunąć.
7. **Repozytorium na GitHubie jest publiczne** — zostaje publiczne czy przełączyć na prywatne? W `docs/legacy.md` są wymienione nazwy prywatnych plików z `legacy/` (same nazwy, bez treści).
8. **Stare pliki konkursowe** w „Plikach do pobrania” (uwaga 5 wyżej).
9. **Commit zmian z sesji na Windows** i los `pnpm-workspace.yaml` (patrz „Gdzie jesteśmy”).
10. **Statystyki portalu** — gdzie mają wrócić (stopka, strona główna?) i czy „Rycerzy” ukrywać przy zerze, czy liczyć też konta archiwalne (uwaga 2 wyżej).
11. **Nagłówek** — gość ma język schowany w menu „Zaloguj” (dwa kliknięcia do EN); alternatywa to przełącznik PL/EN na wierzchu paska. Rozmiar odnośników (`text-xs`) do oceny — przy 1024 px zmieściłby się też poprzedni `text-sm`.
12. **Usunięte filmy** — 36 z 74 filmów nie istnieje już na YouTube, w tym cztery najnowsze, które trafiają na stronę główną. Do wyboru: sprawdzać filmy skryptem (jak `pnpm images:check` dla obrazków) i pomijać usunięte na stronie głównej, usunąć je z bazy w panelu albo podmienić adresy na działające kopie. Do tego czasu strona główna pokazuje zaślepki.

## Wymagania serwera

Pomiar z 2026-10-05 na kopii projektu poza repozytorium (macOS, M2 Max, Node 22.22.1, zaimportowana baza); na Linuksie nie mierzone. Te same pomiary zrobione dla `dot-sport-shop`; zalecenie niżej zakłada oba projekty na jednym VPS (założenie, nie decyzja Mateusza).

| | Portal | Sklep (`dot-sport-shop`) |
|---|---|---|
| Proces bezczynny | 100–130 MB | ok. 145 MB |
| Pod obciążeniem (25 połączeń naraz) | do 634 MB | do 368 MB |
| To samo z `--max-old-space-size=256` | do 319 MB | do 211 MB |
| Szczyt przy `nuxt build` | 1,8 GB (1,3 GB przy stercie 640 MB) | 2,2–2,5 GB (1,6 GB przy stercie 1024 MB; przy 640 MB build pada) |
| Strony SSR na jednym rdzeniu | 55–85 na sekundę | 70–105 na sekundę |
| `.output` | 52 MB | 59 MB |

- O pamięci decyduje build, nie działająca aplikacja. Zalecane: 2 vCPU, 4 GB RAM, 40 GB NVMe, x64, publiczny IPv4, plik wymiany 2 GB. Przy 2 GB RAM build tylko poza serwerem (CI), a na serwer sam `.output`.
- Wariant rozszerzony (pytanie Mateusza z 2026-10-05): trzy aplikacje (portal, sklep, landing page z własnym CMS i wideo) × środowiska dev i prod = sześć procesów na jednym VPS. Zalecane wtedy: 4 vCPU, 8 GB RAM, 80 GB NVMe; 4 GB wystarczy tylko z buildem poza serwerem. Landing page nie był mierzony — przyjęty jak sklep (ten sam stack). Dev na serwerze to build produkcyjny, nie `nuxt dev` (lokalny `nuxt dev` portalu zajmuje ok. 860 MB). Wideo ma podawać reverse proxy z dysku, nie Node.
- Wariant bez środowisk dev (same trzy produkcje): ok. 1,1 GB bez buildu, 2,7–3,6 GB z buildem na serwerze — wystarcza 2 vCPU, 4 GB RAM, 40 GB NVMe (80 GB przy większej ilości wideo), z plikiem wymiany 2 GB.
- OVH (strona ovhcloud.com/pl, sprawdzone 2026-10-05, ceny netto przy opłacie za 12 miesięcy): VPS-1 to 2 vCore / 4 GB / 40 GB NVMe od 16,32 zł miesięcznie, VPS-2 to 4 vCore / 8 GB / 75 GB od 30,77 zł. Oba z IPv4, codzienną kopią i nielimitowanym transferem. Na same trzy produkcje wystarcza VPS-1.
- Mikrus (mikr.us, sprawdzone 2026-10-05): planu 3.1 nie ma; 3.0 to 2 GB / 25 GB, 3.5 to 4 GB / 40 GB. Kontener LXC bez pliku wymiany, bez własnego IPv4 (domena tylko przez Cloudflare albo ich proxy), bez gwarancji CPU i SLA. Na 3.0 build wyłącznie poza serwerem; 3.5 mieści build na miejscu.
- Wyszukiwarka (`/api/search`) liczy się 170–200 ms na zapytanie i na ten czas wstrzymuje serwer; nie ma limitu częstotliwości.
- `server/routes/media` wczytuje cały plik do pamięci przed wysłaniem; największy dziś ma 3 MB, limit wgrywania to 50 MB.

## Znane ograniczenia

- Tytuły podstron są wyliczone automatycznie ze starych nazw („Faq”, „Grecka”) — wymagają przejrzenia w panelu.
- FAQ to osobny moduł (`faq_categories`, `faq_items`, panel „FAQ”, `/api/faq`, strona `/faq`), nie podstrona. Import z legacy dzieli starą stronę „MENU - FAQ” na kategorie i pytania (`scripts/legacy/faq.ts`) — ta ścieżka importu ma tylko testy jednostkowe, pełnego importu po zmianie nie puszczałem. Stary adres `viewpage.php?page_id=761` przekierowuje na stronę główną zamiast na `/faq`.
- Zmiana adresu lub rodzica podstrony nie poprawia odnośników do niej w treściach innych stron ani w menu.
- Edytor przy edycji starych treści gubi `<small>`, `<details>` i opakowania `<div>`; tabele, wyrównanie, kolory, obrazki i YouTube zachowuje.
- Komentarze do filmów (2 z legacy) nie są nigdzie wyświetlane; filmy nie mają własnych stron.
- Photobucket potrafi zwrócić obrazek ze znakiem wodnym zamiast oryginału — sprawdzanie tego nie wykrywa.
- 40 zdjęć albumu „Sygnatury” i końcówka strony „Posejdon” (id 367) nie istnieją w legacy — nie do odzyskania.
- Wiele starych filmów z YouTube już nie istnieje (szare miniatury).
- Brak: mapy strony (sitemap), RSS, CI, audytu dostępności i wydajności.

## Następne kroki

1. Commit poprawek z przeglądu błędów na `staging` (po zgodzie Mateusza), potem `pnpm build` na Windows.
2. Reszta z „Czego nie sprawdziłem”: Podstrony i struktura forum w e2e, telefon na pozostałych stronach (temat forum, mapa, panel), zakładki News Center w Firefoksie.
3. Scalenie `staging` do `main`, gdy Mateusz zdecyduje. Do tego czasu commity tylko na `staging`.
4. Przegląd wyglądu z Mateuszem i poprawki, w tym telefon.
5. Klucze Google i Turnstile, test prawdziwego logowania.
6. Decyzje 2–4 i wdrożenie.

## Jak wznowić pracę

```sh
nvm use                 # Node z .nvmrc; na pierwszym komputerze domyślny w powłoce to 18,
                        # tam: export PATH="$HOME/.nvm/versions/node/v22.22.1/bin:$PATH"
pnpm install
pnpm dev                # http://localhost:3000
```

- **Windows**: Node 22.23 i pnpm 12 są domyślne w powłoce, `nvm use` niepotrzebne. Komendy z tego pliku pisane pod macOS trzeba przełożyć na PowerShell (zmienne przez `$env:NAZWA = '...'`).
- **Logowanie lokalne**: `/logowanie-testowe`, wybór roli w formularzu. Wymaga `NUXT_E2E_LOGIN=true` — jest w `.env` na pierwszym komputerze, na Windows trzeba dopisać.
- **Ponowny import**: najpierw start pomocniczego MySQL (komenda w `docs/legacy.md`), potem `pnpm legacy:import --force` i `pnpm images:check`. Import kasuje bazę i katalog wgranych plików.

**Przegląd na kopii bazy** — żeby klikanie w panelu nie zmieniało zaimportowanych danych:

```sh
mkdir -p .data/review
rm -rf .data/review/saintseiya.db .data/review/uploads
sqlite3 .data/saintseiya.db ".backup .data/review/saintseiya.db"
cp -cR .data/uploads .data/review/uploads     # -c działa na macOS (APFS); gdzie indziej samo cp -R
NUXT_DB_PATH=.data/review/saintseiya.db NUXT_UPLOADS_DIR=.data/review/uploads pnpm dev
```

Na Windows bez `sqlite3` (przy zatrzymanym serwerze): `Copy-Item .data/saintseiya.db* .data/review/`, potem `$env:NUXT_DB_PATH = '.data/review/saintseiya.db'; pnpm dev`. Do samego oglądania `NUXT_UPLOADS_DIR` może zostać domyślny.

**Zrzuty ekranu zamiast sterowanej przeglądarki**: krótki skrypt Node z `chromium.launch({ channel: 'chrome' })` z `@playwright/test`, widok 390 px, `page.screenshot`; przy okazji `document.documentElement.scrollWidth - window.innerWidth` wykrywa wychodzenie poza ekran. Skrypt musi leżeć w katalogu projektu, żeby znalazł `node_modules` — po użyciu usunąć.

**Uwagi do przeglądarki sterowanej przez Claude**:

- Karta działa w tle, więc animacje przejść między stronami się nie kończą i po kliknięciu odnośnika strona wygląda na „wygaszoną”. To nie błąd aplikacji — sprawdzać przez pełne przeładowanie adresu.
- Pierwsze kliknięcie po przeładowaniu strony potrafi zginąć (do strony nie dociera żadne zdarzenie). Po przeładowaniu zrobić zrzut ekranu i neutralne kliknięcie, np. w nagłówek, a efekt każdej akcji potwierdzać.
- Przycisk „Usuń” wymaga potwierdzenia w ciągu 4 s — oba kliknięcia wysyłać w jednej paczce.
- Pliki do pól wgrywania da się podać skryptem na stronie (`DataTransfer` i zdarzenie `change`).
- Drugie konto testowe bez utraty własnej sesji: `POST /api/auth/e2e-login` z `credentials: 'omit'`.
