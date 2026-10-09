# Stan prac

Stan na 2026-10-09, koniec trzeciej sesji tego dnia na drugim komputerze (Windows, `E:\work\saintseiya`). Plik do aktualizowania na koniec każdej sesji. Zasady projektu są w `CLAUDE.md`, opis starej strony i importu w `docs/legacy.md`, obsługa w `README.md`, zapis wcześniejszych sesji w `docs/historia-sesji.md`.

## Gdzie jesteśmy

Aplikacja jest zbudowana od początku do końca i działa lokalnie na zaimportowanych danych. Trzecia sesja 2026-10-09 zamknęła listę „czego nie sprawdziłem” z drugiej: `Content-Security-Policy` przeszła próbę z prawdziwą captchą Turnstile, wszystkie pola z legacy przeszły przez edytor (i edytor przestał gubić wyśrodkowanie oraz kolor), drzewo podstron jest uporządkowane, a panel ma poprawione uwagi z przeglądu. Nie ma podpiętego prawdziwego logowania Google ani hostingu (zostaje VPS).

| Kontrola | Wynik | Kiedy |
|---|---|---|
| `pnpm check` (lint, format, typy, Vitest) | zielone, 374 testy w 33 plikach | 2026-10-09, Windows, w katalogu projektu, po ostatniej zmianie kodu |
| `pnpm build` | przechodzi | 2026-10-09, Windows, w kopii projektu poza repozytorium, identycznej z katalogiem roboczym (poza tym plikiem i `docs/historia-sesji.md`) |
| `pnpm test:e2e` (Playwright) | zielone, 55 testów | 2026-10-09, Windows, na buildzie produkcyjnym (`E2E_SERVER=build`) w tej samej kopii; w trybie dev nie puszczane |
| `pnpm audit` | 2 pozycje | 2026-10-09, druga sesja; w trzeciej nie powtarzane. Zostały `node-forge` i `braces`, bez poprawionej wersji |
| CI (`.github/workflows/ci.yml`) | zielone dla `9ee8dde` na `staging` i `main` | 2026-10-09. Zmian z drugiej i trzeciej sesji CI nie widziało — nie są wypchnięte. W `ci.yml` zniknęło `version: 12` (wersję pnpm podaje `packageManager` w `package.json`); czy `pnpm/action-setup@v6` to przyjmuje, pokaże pierwszy przebieg po wypchnięciu |

- **Git**: zdalne repozytorium `origin` to `https://github.com/m-wyka/saintseiya` (**publiczne**; Mateusz przełączy je na prywatne sam, później). `staging` i `main` wskazują na commit `9ee8dde`, lokalnie i na `origin`; gałąź robocza to `staging`. `legacy/`, `.data/`, `.env` są ignorowane.
- **Niezacommitowane**: druga i trzecia sesja 2026-10-09 razem — 88 zmienionych i 13 nowych plików oraz usunięty `render.yaml`. Niczego nie commitowałem ani nie wypychałem.
- **Dostęp do GitHuba**: na pierwszym komputerze `origin` używa aliasu SSH `git@github-m-wyka:m-wyka/saintseiya.git` (jak `dot-sport-shop`), bo domyślne dane GitHuba należą tam do innego konta, bez prawa zapisu. Na drugim komputerze do wypychania potrzebny jest dostęp konta `m-wyka`; nie ma tu `gh`.
- **Procesy**: `pnpm dev` Mateusza na porcie 3000 działa (uruchomiony ponownie o 21:02, przed trzecią sesją); nie ruszałem go i po sesji odpowiada poprawnie. Z moich procesów nic nie zostało, kopię roboczą `E:\work\saintseiya-build` usunąłem.
- **Baza**: `.data/saintseiya.db` z importu 2026-10-05 (migracje 0000–0004), obrazki zewnętrzne sprawdzone. Zmieniana ręcznie trzy razy 2026-10-09, bez wpisów w dzienniku zmian: rano porządki (trzy pliki do pobrania, puste odnośniki), w drugiej sesji `pnpm legacy:corrections` (tytuły podstron, kategoria newsów, FAQ), w trzeciej to samo polecenie z nowymi poprawkami (przenosiny w drzewie podstron, drobiazgi w FAQ). Jest teraz 800 podstron (796 opublikowanych) i 63 pytania FAQ. Kopie: `.data/backup-2026-10-09/` (sprzed porządków), `.data/backup-2026-10-09-przed-poprawkami/` (sprzed poprawek treści, z oryginałami 22 okładek kategorii newsów) i `.data/backup-2026-10-09-przed-drzewem/` (sprzed przenosin) — można usunąć, gdy niepotrzebne. Zostają 3 konta testowe (id 340–342, dwa z rolą administratora) i 10 wpisów konta testowego w dzienniku zmian — **decyzja Mateusza: na razie nie czyścić**; do usunięcia przed wdrożeniem. Sprawdzenia trzeciej sesji szły wyłącznie na kopiach bazy, kont testowych nie przybyło. Tłumaczeń nie ma żadnych. Na tym komputerze nie ma `legacy/` ani pomocniczego MySQL.
- **Baza na pierwszym komputerze (macOS)**: eksport z Windows z 2026-10-05 — **starszy niż baza tutaj** (bez porządków i poprawek z 2026-10-09). Przed dalszą pracą na Macu przenieść stąd świeży eksport bazy i `.data/uploads` albo puścić tam `pnpm legacy:corrections` (poprawki treści i drzewa; porządków z rana nie obejmuje). Poprzednie dane leżą tam w `.data/backup-before-import-2026-10-05/` (190 MB) — można usunąć.
- **`.data/uploads`**: 22 okładki kategorii newsów (`legacy/images/news_cats`) są zapisane bez metadanych (1,7 MB → 0,3 MB). Sprawdzone w trzeciej sesji: wszystkie 22 oryginały leżą w kopii zapasowej, wymiary obu wersji są takie same.
- **Skrypty do przeglądu**: `.data/review/` (poza repozytorium, tylko na tym komputerze) — opis w „Jak wznowić pracę”. Leży tam też `.data/review/saintseiya.db`, kopia bazy z rana 2026-10-09; można usunąć.
- **`.env` na tym komputerze**: ma zmienne z `.env.example` sprzed drugiej sesji oraz `NUXT_E2E_LOGIN`; klucze Google, Turnstile i `NUXT_ADMIN_EMAILS` są puste. `NUXT_TRUSTED_PROXY_HOPS` lokalnie nie jest potrzebna.

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

- Node 22.19 lub nowszy (`.nvmrc`) i pnpm 12.9.1 (przypięty polem `packageManager`; na Macu było dotąd 9.15.3 — podnieść), potem `pnpm install` — `better-sqlite3` i `sharp` budują się pod daną maszynę, dlatego `node_modules` się nie kopiuje.
- Testy e2e lokalnie uruchamiają zainstalowanego Google Chrome (`channel: 'chrome'` w `playwright.config.ts`). Bez Chrome: `pnpm exec playwright install chromium` i start z `CI=1`.
- Ponowny import wymaga MySQL 8.0 (na Macu binaria z MAMP w `/Applications/MAMP/Library/bin/mysql80/`) i katalogu `legacy/`. Do zwykłej pracy niepotrzebny.
- Ręczny przegląd przez Claude wymaga rozszerzenia Claude in Chrome.
- `CLAUDE.md` wskazuje `/Users/mwyka/Work/dot-sport-shop/` jako wzorzec reguł ESLint/Prettier — ten katalog jest tylko na pierwszym komputerze. Reguły są już skopiowane, więc nie blokuje to pracy.
- Pamięć Claude dla projektu jest pusta — nie ma czego przenosić.

## Zrobione w ostatniej sesji

Trzecia sesja 2026-10-09 na Windows. Mateusz wkleił listę „czego nie sprawdziłem i co zostało” z drugiej sesji z poleceniem „Ogarnij to”. Wszystko niżej jest niezacommitowane. Opis drugiej sesji przeszedł do `docs/historia-sesji.md`.

**Rozstrzygnąłem sam w ramach tego polecenia** (każde da się cofnąć; jeśli Mateusz woli inaczej — powiedzieć):

- Sekcja „Wcześniejsze sesje” jest przeniesiona do `docs/historia-sesji.md`, nie wycięta. Ten plik ma teraz ok. 320 linii zamiast 576 (39 kB zamiast 95 kB) i mieści się w jednym odczycie.
- Podstrony w dziwnych miejscach drzewa dostały właściwe miejsca i adresy, razem z odnośnikami w treściach (wcześniej adresów nie ruszałem).
- Dwie strony „Literatura” w mitologii greckiej, zawierające sam baner, są szkicami.
- Pasek menu ma tło kryjące w 80% zamiast 55%.
- Obrazek wgrywany w panelu może mieć najwyżej 50 megapikseli; wznowienie zakończonej ankiety pyta o potwierdzenie.

**1. Rozmycie pod paskiem menu.** Prawdziwy Chrome i prawdziwy Edge malują rozmycie (zrzuty paska nad przewiniętą treścią: `.data/review/blur/`). Firefox i WebKit z Playwrighta go nie malują — Firefox także w zwykłym oknie — i przy tle 55% etykiety menu zlewały się z treścią pod spodem. Przy 80% menu jest czytelne także bez rozmycia, treść prześwituje tylko jako słaby cień (`.data/review/blur-after/`); w Chrome pasek wygląda prawie tak samo jak przedtem. Prawdziwego Safari i prawdziwego Firefoksa nadal nie widziałem.

**2. `Content-Security-Policy` z Turnstile, Google i YouTube** — build uruchomiony z publicznymi kluczami testowymi Cloudflare, prawdziwy Chrome (`.data/review/csp-check.mjs`):

- Widżet Turnstile ładuje się (skrypt i ramka z `challenges.cloudflare.com`), wydaje token, a shoutbox, komentarz i odpowiedź na forum zapisują się z kodem 201 po weryfikacji tokenu przez serwer w Cloudflare. Konsola bez ani jednej blokady.
- Z kluczem „zawsze odrzuca” serwer odpowiada 400 `ERRORS.CAPTCHA_REQUIRED`, z tokenem i bez (`captcha-reject.mjs`) — weryfikacja naprawdę działa.
- „Zaloguj przez Google” wychodzi na `accounts.google.com` (z wymyślonym identyfikatorem klienta Google pokazuje tam błąd), a powrót pod `/auth/google` kończy na stronie głównej z komunikatem o nieudanym logowaniu. Polityka nie bierze w tym udziału — to zwykłe przekierowania.
- Film z listy `/video` odtwarza się w ramce `youtube-nocookie.com` (odtwarzacz załadowany).

**3. Edytor na wszystkich polach z legacy** — każde z 1532 pól (806 podstron, zajawki i treści newsów, FAQ, okienka map) przeszło na kopii bazy przez prawdziwy komponent edytora i prawdziwy zapis w panelu (`.data/review/roundtrip.mjs`, porównanie `roundtrip-inspect.mjs`). Zapisało się 1175 z 1175 rekordów.

- Bez strat w żadnym polu: tekst, obrazki i ich wymiary, odnośniki z obrazków, filmy, opływanie, pogrubienie, kursywa, podkreślenie, przekreślenie.
- Pierwszy przebieg pokazał prawdziwe straty, teraz poprawione:
  - wyśrodkowanie zrobione przez `<div>` (jest w 43 polach) znikało — z tekstu w 16 polach, z obrazków w 25 — teraz przed edycją przechodzi na akapity w środku (`app/utils/editorContent.ts`);
  - kolor ustawiony na `<div>` znikał w 6 polach — przechodzi na tekst;
  - `<sup>` i `<small>` znikały (3 pola) — edytor zna je teraz razem z `<sub>` (`editorExtensions.ts`), bez przycisków w pasku;
  - pusta lista (`<ol> </ol>`, 88 sztuk w 48 polach) wracała jako lista z jednym pustym punktem — jest usuwana.
- Po poprawkach zostają: pomarańczowy kolor podpisu na stronie „Prozerpina” (id 387; `<hr>` wstawione w środek kolorowego tekstu) i wyrównanie wpisane na `<span>` w jednej zajawce (news 7), które i tak niczego nie wyrównywało.
- Nieszkodliwe różnice, których nie ruszałem: sąsiednie identyczne znaczniki i odnośniki sklejają się w jeden, czarny kolor tekstu znika (celowo), tabele dostają brakujące komórki, a na `/redakcja` znika `rowspan` wystający poza ostatni wiersz tabeli (komórki z awatarami, od których zależy układ kart, zostają bez zmian).

**4. Okładki kategorii newsów** — kopia zapasowa sprawdzona: 22 z 22 oryginałów, te same wymiary co pliki w użyciu.

**5. Drzewo podstron i FAQ** — poprawki w `scripts/legacy/corrections.ts`, nałożone na lokalną bazę przez `pnpm legacy:corrections` (najpierw na kopii, potem na bazie; kopia sprzed zmiany w `.data/backup-2026-10-09-przed-drzewem/`):

- 19 podstron przeniesionych, odnośniki do nich przepisane w 48 treściach (podstrony, newsy, posty, komentarz), 6 pustych hubów usuniętych:
  - `lost-canvas/charakterystyki-postaci/bogowie` i `saint-seiya/charakterystyki-postaci/srebrni-rycerze/inni-srebrni-rycerze` wyszły z hubów powstałych z literówki;
  - `mitologia/rzymska/bogowie/pluton` trafił do właściwego huba, `jowisz-2` to teraz `mars`, „Kraina Umarłych” jest w hubie „Miejsca”;
  - „Zew krwi 3”, „Skrzywiona perfekcyjność, cz. 2” i „Run Away 2” stoją obok poprzedniej części, nie pod nią;
  - charakterystyki postaci filmów 3–6 są pod swoim filmem (`filmy-kinowe/film-3/charakterystyki-postaci`), jak przy filmach 1 i 2;
  - adresy z literówką tytułu: `brama-piekla`, `plejady`, `echidna`, `jak-powstalo-halloween`, `elizjum-recenzja`, `atena-jej-wielka-milosc-3` i `-4`.
- Stare adresy tych stron dają 404 (nowa strona nie była jeszcze publiczna, więc nikt do nich nie linkuje); adresy ze starej strony (`viewpage.php?page_id=…`) przekierowują na nowe miejsca — sprawdzone na działającej stronie.
- `mitologia/grecka/literatura` i `literatura-2` (sam baner sekcji, zero tekstu, zero odnośników do nich) są szkicami.
- FAQ: pięć odpowiedzi straciło nieaktualne szczegóły — nazwę dawnego hostingu, prywatną wiadomość i „bana na IP” przy ostrzeżeniach, „u dołu strony” przy najnowszych komentarzach oraz dwa odesłania do pytań po numerze, którego już nie mają. Reszta odpowiedzi bez zmian.
- Po zmianie: 800 podstron, 0 osieroconych, adresy zgodne z drzewem, `PRAGMA integrity_check` zwraca `ok`.

**6. Panel** (numery z dawnej listy „Uwagi z przeglądu”):

- 9 — tryb EN: wyczyszczone pole tłumaczenia znaczy „użyj polskiego” także dla pól wymaganych (tytuł, etykieta obszaru mapy, odpowiedź ankiety); dodanie pozycji przy włączonym EN pyta, czy zapisać ją jako polską; przełączenie PL/EN przy niezapisanych zmianach pyta o zgodę (formularze stron, newsów, map, ankiet, proste listy, nawigacja, ustawienia).
- 10 — kategorii newsów z newsami nie da się usunąć; drugi tag o tej samej nazwie (bez względu na wielkość liter) jest odrzucany.
- 11 — podtytuł drzewa stron pokazuje liczbę stron bieżącego poziomu (łączną tylko na poziomie głównym); adres spoza YouTube wpisany jako film daje komunikat; wyśrodkowanie z `<div>` oraz `<sub>`/`<sup>` zostają (punkt 3).
- 12 — obrazek ponad 50 megapikseli jest odrzucany (plik 12000×9000 już nie przejdzie); „Wznów” przy zakończonej ankiecie pokazuje datę jej zakończenia i pyta o potwierdzenie. Uprawnienia do „Obrazków” bez zmian — to decyzja Mateusza.
- 15 — pasek narzędzi edytora na telefonie ma przy prawej krawędzi gasnący brzeg, który ustępuje na końcu przewijania.
- 19 — `/logowanie-testowe` bez `NUXT_E2E_LOGIN` odpowiada 404 (sprawdzone na buildzie, także `/en/test-login`).

**Nowe testy**: przenosiny podstron, przepisywanie odnośników, usuwanie pustych hubów, szkice z samych banerów i poprawki odpowiedzi FAQ (`corrections.test.ts`), odmowa usunięcia kategorii z newsami, tag o zajętej nazwie, wyczyszczony tytuł i etykieta obszaru w tłumaczeniu, obrazek o zbyt dużych wymiarach; e2e: edycja strony z legacy zachowuje wyśrodkowanie i kolor bloków, komunikat o adresie spoza YouTube, strażniki tłumaczeń (niezapisane zmiany, nowa pozycja w EN, wyczyszczony tytuł), odmowy w kategoriach i tagach, liczba stron na poziomie drzewa.

**Sprawdzone**: `pnpm check` (374 testy) w katalogu projektu; `pnpm build` i 55 testów e2e na buildzie w kopii identycznej z katalogiem roboczym — wszystko po ostatniej zmianie kodu. Pierwszy przebieg e2e pokazał błąd w moim nowym teście (obrazek spod `/theme` jest odrzucany przez czyszczenie treści), nie w aplikacji.

**Nie sprawdzone**:

- Prawdziwe Safari, iPhone i prawdziwy Firefox — bez zmian, nie ma ich tutaj.
- Pełne logowanie prawdziwym kontem Google (brak kluczy); sprawdzone jest wyjście do Google i powrót z błędem.
- Okna z pytaniem o niezapisane zmiany w formularzu plików do pobrania i przy zdjęciach albumu — te formularze nie zgłaszają niezapisanych zmian.
- Gasnący brzeg paska edytora obejrzany tylko w emulacji telefonu w Chrome.
- Ponowny import z legacy z nowymi poprawkami drzewa — nie ma tu `legacy/`; krok ma testy integracyjne i przeszedł na kopii oraz na lokalnej bazie.

## Co jest zrobione

**Dane**
- Importer `scripts/legacy/` (powtarzalny, ok. 10 s): konta archiwalne, newsy, podstrony w drzewie, forum, komentarze, galeria, video, shoutbox, ankiety, linki, pliki, menu, News Center, 4 mapy interaktywne.
- Konwersja treści: kodowanie ISO-8859-2, czyszczenie HTML, BBCode → HTML, emotikony → emoji, przepisanie starych odnośników na nowe adresy.
- Sprawdzanie obrazków zewnętrznych (`pnpm images:check`): 1701 działa, 852 martwe.
- Poprawki redakcyjne treści z legacy (`scripts/legacy/corrections.ts`, `pnpm legacy:corrections`): miejsca i adresy podstron w drzewie, tytuły podstron, FAQ, nazwa kategorii newsów.

**Strona publiczna**
- Strona główna, newsy (kategorie, tagi), podstrony z okruszkami i hubami, forum, galeria, video, mapy z okienkami treści, linki, pliki, ankiety, shoutbox, wyszukiwarka w oknie modalnym (przycisk „Szukaj” lub Ctrl+K; `/szukaj` przekierowuje na stronę główną), profile.
- Logowanie Google, konto (zmiana nicku, usunięcie konta → „Konto nieaktywne”), pisanie na forum, komentarze, shoutbox, głosowanie; captcha Turnstile i limit częstotliwości.
- Przekierowania 301 ze starych adresów (`viewpage.php`, `news.php`, `forum/viewthread.php`, `kr/index.html` itd.).
- Zaślepka „Nie znaleziono zdjęcia” dla martwych obrazków.
- Mapa strony, RSS, `robots.txt`, nagłówki bezpieczeństwa i `Content-Security-Policy`.

**Panel administratora** (`/admin`)
- Dashboard ze statystykami i wykresami.
- Newsy, kategorie, tagi, podstrony (drzewo), mapy (edytor obszarów), obrazki, galeria, video, pliki, linki, forum (struktura), komentarze, shoutbox, ankiety, użytkownicy i role, nawigacja, ustawienia (News Center).
- Moderacja forum na stronie tematu: zamknięcie, przyklejenie, przeniesienie, usuwanie, edycja postów.

## Czego nie sprawdziłem

- **Prawdziwe Safari, iPhone i prawdziwy Firefox** — wygląd porównany tylko w silnikach z Playwrighta (Firefox, WebKit na Windows, WebKit z profilem iPhone 15) oraz w prawdziwym Chrome i Edge. Do obejrzenia na Macu i telefonie: nagłówki z polskimi znakami, rozmycie pod przyklejonym paskiem menu i pod oknami dialogowymi, płynność gwiezdnego tła, przyklejone menu boczne z własnym przewijaniem, karty tabel w panelu.
- **Prawdziwy telefon** — wszystko w emulacji; edytor map i powiększone cele dotyku tylko zdarzeniami syntetycznymi albo odczytem CSS.
- **Logowanie prawdziwym kontem Google** — brak kluczy. Captcha przeszła na kluczach testowych Cloudflare; z prawdziwymi kluczami zmienia się tylko to, że widżet może pokazać wyzwanie.
- **Aplikacja za reverse proxy** — kompresja HTML, `X-Forwarded-For` i `NUXT_TRUSTED_PROXY_HOPS` nie były uruchomione razem; limit wyszukiwarki za proxy ma tylko testy jednostkowe.
- **CLS na Androidzie** — pomiar był w Chrome na Windows; na Androidzie czcionki zastępcze to Noto Serif i Roboto (mają dopasowane metryki, niezmierzone).
- **Scenariusze e2e działają na skromnych danych testowych.** Przegląd panelu na prawdziwych danych (druga sesja) i przejście wszystkich pól przez edytor (trzecia) to skrypty z `.data/review/`, nie część `pnpm test:e2e`.
- **Ponowny import z legacy** po zmianach w importerze i w poprawkach — na tym komputerze nie ma `legacy/` ani pomocniczego MySQL. Mateusz ocenia, że ponowny import raczej nie będzie potrzebny.
- **Tryb dev e2e** — nie puszczany.

## Uwagi z przeglądu (niepoprawione)

Zostało to, czego nie da się poprawić bez decyzji, bez redakcji albo bez nowych grafik.

**Treść** (do poprawienia w panelu)

1. **FAQ wymaga oka redakcji** — skład Redakcji w „Kto zarządza stroną?”, zapowiedź newslettera, grupa i fanpage na Facebooku, lista tłumaczy, rady o kodekach i odtwarzaczach, „Postać Miesiąca”. Tego nie da się sprawdzić w kodzie.
2. **Strony z legacy złożone z pociętych grafik** składają się bez odstępów, ale tam, gdzie redakcja zmieszała dwa zestawy kawałków (`saint-seiya/charakterystyki-postaci`), zostają drobne przesunięcia — to cecha samych grafik.
3. **Wersja `/en`** miesza języki: interfejs po angielsku, treści z bazy po polsku — do czasu tłumaczenia treści (plan w „Następne kroki”).
4. **Zdjęcia bez tytułu** (69 z 319) mają nagłówek z numerem w albumie; prawdziwe tytuły może nadać tylko redakcja.
5. **Dwie strony „Literatura”** (szkice z samym banerem) — redakcja może je uzupełnić albo usunąć.

**Obrazki**

6. Znak wodny Photobucketu na obrazkach, które jeszcze się ładują (115 podstron, 33 newsy, 39 postów) i 1571 działających obrazków po `http://` (928 z Photobucketu) — **decyzja Mateusza: zostają, jak są**. Na stronie `https://` przeglądarka może część z nich zablokować.
7. Trzy awatary na `/redakcja` — najpewniej nie ma ich w legacy; sprawdzić na Macu w `legacy/images/avatars`.
8. Miniatury grafik mają 480 px, więc rozsunięty pas na stronie głównej jest na ekranie Retina lekko miękki; okładka w dużym kaflu newsa jest powiększona z 200 do 224 px. Zniknie po podmianie grafik.

**Panel**

9. **Do decyzji**: każdy moderator może wgrywać i usuwać w „Obrazkach” (wystarcza rola redakcji).
10. Przyklejona kolumna akcji zasłania fragment sąsiedniej kolumny, dopóki szerokiej tabeli się nie przewinie — tak działa przyklejenie; alternatywą jest powrót do chowania przycisków za przewijaniem.
11. Listy panelu poza `AdminTable` (nawigacja, zdjęcia w albumie, drzewo podstron) nie mają na telefonie układu kart.
12. Formularz plików do pobrania i edycja zdjęć w albumie nie pytają o niezapisane zmiany przy przełączeniu PL/EN; pytanie o zapis nowej pozycji jako polskiej też ich nie obejmuje.

**Wydajność i wdrożenie**

13. Wyszukiwarka i limity zapisów liczą w pamięci jednego procesu (patrz „Znane ograniczenia”).
14. `Content-Security-Policy` dopuszcza style inline i obrazki z dowolnego adresu (`http:` i `https:`) — tego wymaga treść z legacy.
15. Dziennik zmian w lokalnej bazie ma 10 wpisów konta testowego — do wyczyszczenia razem z kontami testowymi.

## Decyzje dla Mateusza

1. **Klucze**: Google OAuth, Cloudflare Turnstile, `NUXT_ADMIN_EMAILS` — Mateusz zajmie się później. Po wpisaniu kluczy wystarczy przejść jedno prawdziwe logowanie; captcha i polityka bezpieczeństwa są sprawdzone na kluczach testowych.
2. **Repozytorium publiczne → prywatne** — Mateusz przełączy sam (GitHub: Settings → General → Danger Zone → Change repository visibility).
3. **Hosting**: VPS. Do wyboru dostawca, domena i kopie zapasowe; pomiary i zalecane parametry w „Wymagania serwera”.
4. **Sekcja Multimedia** (odcinki, skany, soundtracki) — odłożone. Strony są publiczne, ale nie ma ich w menu; w legacy te odnośniki widział tylko właściciel. Dodać do menu czy zostawić?
5. **Statystyki portalu** — odłożone. Nie są nigdzie pokazywane (`SiteStatistics.vue` czeka na miejsce). Gdzie mają wrócić (stopka, strona główna?) i czy „Rycerzy” ukrywać przy zerze, czy liczyć też konta archiwalne (339)?
6. **Przełącznik języka dla gościa** — odłożone. Jest schowany w menu „Zaloguj” (dwa kliknięcia do EN); alternatywa to przełącznik PL/EN na wierzchu paska. Rozmiar odnośników paska (`text-xs`) też do oceny.
7. **`node-forge` i `braces`** — dwie pozostałe pozycje `pnpm audit` (wysokie), obie w narzędziach deweloperskich i budujących, bez poprawionej wersji w rejestrze. Sprawdzić ponownie przy następnej aktualizacji Nuxta.
8. **Uprawnienia do „Obrazków”** — osobne uprawnienie moderatora czy zostaje, jak jest (punkt 9 w „Uwagi z przeglądu”)?
9. **Rozstrzygnięcia z trzeciej sesji** (lista na górze „Zrobione w ostatniej sesji”) — do potwierdzenia albo cofnięcia, zwłaszcza tło paska menu i dwie strony „Literatura” jako szkice.

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
- Wyszukiwarka (`/api/search`) liczy się 170–200 ms na zapytanie i na ten czas wstrzymuje serwer. Ma limit 30 zapytań na minutę z jednego adresu. Adres bierze z `X-Forwarded-For` — tę pozycję, którą dopisało własne proxy; liczbę proxy przed aplikacją podaje `NUXT_TRUSTED_PROXY_HOPS` (nginx = 1, Cloudflare + nginx = 2). Przy złej wartości wszyscy odwiedzający dzielą jeden limit albo limit da się obejść.
- `server/routes/media` wysyła pliki strumieniem. Zmniejszanie wgranego obrazka zajmuje pamięć proporcjonalną do liczby pikseli — stąd limit 50 megapikseli.
- Strony HTML wychodzą z Node bez kompresji (strona główna 142 kB); pliki statyczne mają gotowe wersje gzip i brotli. Kompresję HTML ma włączyć reverse proxy. Nagłówki bezpieczeństwa ustawia aplikacja — w proxy ich nie powtarzać.
- Mapa strony (`/sitemap.xml`) to 1,2 MB generowane z bazy przy każdym żądaniu (ok. 90 ms), z nagłówkiem cache na godzinę.

## Znane ograniczenia

- Poprawki z `scripts/legacy/corrections.ts` dopasowują podstrony po adresie, a pytania FAQ po treści pytania. Jeśli redakcja zmieni w panelu poprawiony tytuł podstrony albo odpowiedź na przepisane pytanie, kolejne `pnpm legacy:corrections` przywróci wersję z listy. Przenosiny wykonują się tylko wtedy, gdy strona jest jeszcze pod starym adresem; strona „Literatura” wróci do szkiców, dopóki nie ma w niej tekstu.
- Klasy układu (`subheading`, `sliced-image`, `image-grid`) dokłada serwer przy wysyłce podstron i newsów. Akapit, który jest jednym krótkim pogrubionym zdaniem, zawsze wygląda jak nagłówek — także wtedy, gdy autor chciał tylko coś podkreślić.
- FAQ to osobny moduł (`faq_categories`, `faq_items`, panel „FAQ”, `/api/faq`, strona `/faq`), nie podstrona. Import z legacy dzieli starą stronę „MENU - FAQ” na kategorie i pytania (`scripts/legacy/faq.ts`) — ta ścieżka importu ma tylko testy jednostkowe.
- Zmiana adresu lub rodzica podstrony w panelu nie poprawia odnośników do niej w treściach innych stron ani w menu (robi to tylko skrypt poprawek, dla stron ze swojej listy).
- Edytor przy edycji starych treści zdejmuje opakowania `<div>` (ich wyśrodkowanie i kolor przenosi na akapity i tekst) oraz `<details>` (w obecnych treściach go nie ma); usuwa puste listy. Tabele, wyrównanie, kolory, `<sub>`, `<sup>`, `<small>`, obrazki z odnośnikami i YouTube zachowuje. Obrazki są w edytorze elementami wierszowymi — kliknięty obrazek jest zaznaczony i pisanie go zastąpi.
- Obrazek w treści zapisywanej w panelu musi mieć adres `http(s)://` albo `/media/…`; inny (np. `/theme/…`) jest przy zapisie wycinany razem ze znacznikiem.
- Komentarze do filmów (2 z legacy) nie są nigdzie wyświetlane; filmy nie mają własnych stron.
- Photobucket potrafi zwrócić obrazek ze znakiem wodnym zamiast oryginału — sprawdzanie tego nie wykrywa.
- 40 zdjęć albumu „Sygnatury” i końcówka strony „Posejdon” (id 367) nie istnieją w legacy — nie do odzyskania.
- 36 z 74 filmów nie istnieje już na YouTube, w tym cztery najnowsze — strona główna i `/video` pokazują zaślepki „Niedostępny” (decyzja Mateusza: zostaje).
- Treści użytkowników (forum, komentarze, shoutbox) nie mają i nie będą mieć wersji językowych — potwierdzone przez Mateusza 2026-10-09.
- Nowy rekord w panelu powstaje zawsze jako wersja polska; tłumaczenie dodaje się przy edycji (panel o tym uprzedza).
- Za szerokie tabele z legacy przewijają się we własnej ramce; na telefonie dotyczy to ponad połowy tabel.
- Mapa strony ma listę typów treści wpisaną w `listSitemapEntries` (`server/utils/feeds.ts`) — nowy publiczny typ strony trzeba tam dopisać ręcznie.
- Limit wyszukiwarki i limit zapisów trzymają liczniki w pamięci procesu — po restarcie serwera zaczynają od zera, a przy kilku procesach każdy liczy osobno.
- `Content-Security-Policy` działa tylko w buildzie; `pnpm dev` jej nie wysyła, więc skrypt z nowego zewnętrznego źródła zadziała lokalnie, a na produkcji zostanie zablokowany, dopóki źródło nie trafi do `server/utils/contentSecurityPolicy.ts`.
- `/logowanie-testowe` otwarte przejściem wewnątrz aplikacji (bez przeładowania strony) nie wie, czy logowanie testowe jest włączone, i pokazuje 404; adres wpisany w przeglądarce działa. Do tej strony nie prowadzi żaden odnośnik. Wniosek z kodu, nie z próby.

## Następne kroki

1. **Mateusz**: przejrzeć zmiany z drugiej i trzeciej sesji i zdecydować o commicie. Po wypchnięciu sprawdzić pierwszy przebieg CI (zmiana w `ci.yml`).
2. Na Macu: podnieść pnpm do 12, przenieść stąd bazę i `.data/uploads`, obejrzeć stronę w prawdziwym Safari i na iPhonie (lista w „Czego nie sprawdziłem”), sprawdzić trzy awatary w `legacy/images/avatars` oraz usunąć `legacy/php-cgi53.core` (653 MB zrzutu pamięci; decyzja Mateusza z 2026-10-09).
3. Klucze Google i Turnstile, potem jedno prawdziwe logowanie na buildzie.
4. Hosting na VPS: reverse proxy z HTTPS, kompresją HTML i `X-Forwarded-For`, `NUXT_TRUSTED_PROXY_HOPS` zgodne z liczbą proxy, usunięcie kont testowych i ich wpisów z dziennika zmian.
5. Redakcja w panelu: FAQ i dwie strony „Literatura” (punkty 1 i 5 w „Uwagi z przeglądu”).
6. Pozostałe uwagi do panelu: punkty 9–12 w „Uwagi z przeglądu”.

**Zaplanowane na później — tłumaczenie treści przez AI** (polecenie Mateusza z 2026-10-09: zapisać, nie robić teraz):

- Cel: przetłumaczyć na angielski całą treść portalu za jednym razem, modelem językowym, i zapisać jako wersję EN w tabeli `translations`.
- Zakres: wszystko, co panel pozwala tłumaczyć — newsy (tytuł, zajawka, treść), kategorie newsów, tagi, podstrony, mapy i ich obszary, albumy i zdjęcia (tytuły, opisy), kategorie video i filmy, kategorie i działy forum, ankiety i odpowiedzi, linki i ich kategorie, pliki, FAQ, menu boczne, News Center.
- Poza zakresem: komentarze, wpisy shoutboksa i posty forum — tych nie tłumaczymy.
- Do ustalenia przed startem: który model i z jakim budżetem (ok. 800 podstron i 380 newsów), czy tłumaczenie ma nadpisywać istniejące wpisy EN, jak zachować HTML i odnośniki w treści (slugi i adresy zostają wspólne) oraz kto przegląda wynik. Skrypt powinien dać się wznowić i pomijać rekordy już przetłumaczone.
- Uwaga: `pnpm legacy:import --force` kasuje tabelę `translations` — tłumaczenie robić po ostatnim imporcie.

## Jak wznowić pracę

```sh
nvm use                 # Node z .nvmrc; na pierwszym komputerze domyślny w powłoce to 18,
                        # tam: export PATH="$HOME/.nvm/versions/node/v22.22.1/bin:$PATH"
pnpm install
pnpm dev                # http://localhost:3000
```

- **Windows**: Node 22.23 i pnpm 12 są domyślne w powłoce, `nvm use` niepotrzebne. Komendy z tego pliku pisane pod macOS trzeba przełożyć na PowerShell (zmienne przez `$env:NAZWA = '...'`).
- **Logowanie lokalne**: `/logowanie-testowe`, wybór roli w formularzu. Wymaga `NUXT_E2E_LOGIN=true` w `.env`.
- **Ponowny import**: najpierw start pomocniczego MySQL (komenda w `docs/legacy.md`), potem `pnpm legacy:import --force` i `pnpm images:check`. Import kasuje bazę i katalog wgranych plików.

**Przegląd na kopii bazy** — żeby klikanie w panelu nie zmieniało zaimportowanych danych:

```sh
mkdir -p .data/review
rm -rf .data/review/saintseiya.db .data/review/uploads
sqlite3 .data/saintseiya.db ".backup .data/review/saintseiya.db"
cp -cR .data/uploads .data/review/uploads     # -c działa na macOS (APFS); gdzie indziej samo cp -R
NUXT_DB_PATH=.data/review/saintseiya.db NUXT_UPLOADS_DIR=.data/review/uploads pnpm dev
```

Na Windows bez `sqlite3`: `node .data/review/copy-db.mjs <cel>` robi spójną kopię także przy działającym serwerze.

**Build i testy obok działającego `pnpm dev`** (na tym komputerze, Git Bash):

```sh
bash .data/review/sync-copy.sh                     # kopia plików projektu do E:\work\saintseiya-build
cd /e/work/saintseiya-build
pnpm install --frozen-lockfile --offline --store-dir 'E:\.pnpm-store'   # tylko za pierwszym razem
pnpm build
E2E_SERVER=build pnpm test:e2e                     # zarazem próba generalna CI
bash /e/work/saintseiya/.data/review/restart-copy.sh 3400 [ZMIENNA=wartość …]   # build na świeżej kopii bazy
```

- `pnpm build` czyści `.nuxt` i psuje działający w tym samym katalogu serwer dev; `pnpm install` też (`nuxt prepare` z `postinstall` nadpisuje `.nuxt`). `pnpm check` w katalogu projektu serwerowi dev nie szkodzi.
- Drugi `nuxt dev` w tym samym katalogu dzieli z pierwszym pamięć podręczną Vite; gdy jeden przebuduje zależności, drugi odpowiada `504 Outdated Optimize Dep`, dopóki się go nie zrestartuje.
- Przed przebudową kopii zatrzymać działający w niej serwer (`restart-copy.sh` robi to sam) — Windows nie pozwoli nadpisać otwartej bazy ani modułu `better-sqlite3`.
- Zatrzymanie zadania w tle nie zawsze zabija proces `node` na Windows — sprawdzić port (`Get-NetTCPConnection -State Listen -LocalPort 3400`) i zabić po numerze procesu.
- Coś na tym komputerze rozpakowuje odpowiedzi HTTP dla przeglądarek (nagłówek `X-Content-Encoding-Over-Network: br`; najpewniej ochrona sieci w antywirusie). Lighthouse i Chrome widzą przez to pliki statyczne bez kompresji, choć serwer wysyła brotli. `curl` pokazuje stan faktyczny.

**Skrypty do przeglądu** w `.data/review/` (poza repozytorium, tylko na tym komputerze; korzystają z `node_modules` projektu, domyślny adres to `http://localhost:3400` albo `3200` — opis na górze każdego pliku):

- Zrzuty i pomiary: `shots.mjs` (strony w trzech silnikach, z logowaniem testowym), `el.mjs`, `clip.mjs`, `measure.mjs`, `failed.mjs`, `engines.mjs`, `heights.mjs`, `tables.mjs`, `cls.mjs`, `axe.mjs` (z `axe.min.js`), `blur.mjs` (pasek menu nad przewiniętą treścią w pięciu silnikach), `toolbar-phone.mjs`.
- Edytor: `roundtrip.mjs` (wszystkie pola przez edytor i zapis w panelu), `roundtrip-inspect.mjs` (co naprawdę ubyło: tekst w pogrubieniu, kolory, wyrównanie, odnośniki), `field-grep.mjs` (jedno pole przed i po), `editor-check.mjs`, `colour-check.mjs`. **Zmieniają bazę — uruchamiać wyłącznie na kopii**; `roundtrip.mjs` odmawia pracy na innej ścieżce.
- Bezpieczeństwo: `csp-check.mjs` (Turnstile, Google i YouTube pod `Content-Security-Policy`; build z kluczami testowymi Cloudflare `1x00000000000000000000AA` i `1x0000000000000000000000000000000AA`), `captcha-reject.mjs` (klucz `2x0000000000000000000000000000000AA` — serwer ma odmówić), `captcha-debug.mjs`.
- Treść: `tree.mjs` (dziwne miejsca drzewa podstron), `links.mjs` (gdzie są odnośniki do podanych adresów), `faq.mjs` (całe FAQ tekstem).
- Jednorazowe, już wykonane: `cleanup.mjs`, `optimize-images.mjs`.
- Lighthouse instalowałem osobno poza projektem (`npm install lighthouse`).

**Uwagi do poleceń Bash pisanych przez Claude**:

- Skrypt wklejany przez heredoc potrafi się nie wykonać albo zgubić ukośniki odwrotne i znaki `${…}`, gdy zawiera cudzysłowy, grawisy lub wyrażenia regularne. Skrypt zapisać jako plik i dopiero uruchomić.
- Git Bash przepisuje argumenty zaczynające się od ukośnika na ścieżki Windows — wzorzec `href="/"` podany w wierszu poleceń nie dotrze do skryptu w tej postaci.
- Widżet Turnstile siedzi w zamkniętym shadow DOM i stale coś dosyła: nie czekać na `networkidle` i nie szukać jego ramki selektorem, tylko w `page.frames()`.

**Uwagi do przeglądarki sterowanej przez Claude**:

- Karta działa w tle, więc animacje przejść między stronami się nie kończą i po kliknięciu odnośnika strona wygląda na „wygaszoną”. To nie błąd aplikacji — sprawdzać przez pełne przeładowanie adresu.
- Pierwsze kliknięcie po przeładowaniu strony potrafi zginąć (do strony nie dociera żadne zdarzenie). Po przeładowaniu zrobić zrzut ekranu i neutralne kliknięcie, np. w nagłówek, a efekt każdej akcji potwierdzać.
- Przycisk „Usuń” wymaga potwierdzenia w ciągu 4 s — oba kliknięcia wysyłać w jednej paczce.
- Pliki do pól wgrywania da się podać skryptem na stronie (`DataTransfer` i zdarzenie `change`).
- Drugie konto testowe bez utraty własnej sesji: `POST /api/auth/e2e-login` z `credentials: 'omit'`.
