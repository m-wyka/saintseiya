# Historia sesji

Zapis wyjęty ze `STATUS.md` 2026-10-09, żeby tamten plik dało się przeczytać jednym odczytem. Każdy rozdział opisuje stan z dnia swojej sesji: listy „Nie sprawdzone” i „Do decyzji” bywały później zamykane, a liczby testów rosły. Aktualny stan jest w `STATUS.md`. Nowe sesje dopisywać na górze.

## Trzecia sesja 2026-10-09 (Windows)

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

## Druga sesja 2026-10-09 (Windows)

**Decyzje Mateusza z tej sesji**: klucze Google i Turnstile później; Render odpada, zostaje VPS; kont testowych w bazie jeszcze nie czyścić; obrazki z Photobucketu i usunięte filmy z YouTube zostają, jak są; repozytorium na prywatne przełączy sam; Multimedia w menu, miejsce na statystyki i przełącznik języka dla gościa — odłożone; ponowny import z legacy raczej nie będzie potrzebny.

**Bezpieczeństwo i wdrożenie**:

- **Nagłówki bezpieczeństwa**: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` i `Strict-Transport-Security` idą z każdą odpowiedzią (`routeRules` w `nuxt.config.ts`). `Content-Security-Policy` dokłada `server/plugins/contentSecurityPolicy.ts`, tylko w buildzie: skrypty wyłącznie z własnej domeny i Turnstile, skrypty inline Nuxta dopuszczone po skrócie (liczonym z fragmentów, które Nuxt pisze sam — skrypt wstrzyknięty w treść zostaje zablokowany), ramki tylko z YouTube i Turnstile. Style inline są dozwolone, bo treść z legacy ich używa.
- **Limit wyszukiwarki**: adres odwiedzającego bierze `clientAddressOf` (`server/utils/clientAddress.ts`) — pozycję z `X-Forwarded-For` dopisaną przez własne proxy, nie pierwszą, którą może podać klient. Liczbę proxy podaje `NUXT_TRUSTED_PROXY_HOPS` (domyślnie 1; 0 = nagłówek ignorowany). Ten sam adres idzie do Turnstile.
- **Render usunięty**: `render.yaml`, sekcja w `README.md`, wzmianka w `CLAUDE.md`. `README.md` opisuje wdrożenie na VPS (proxy, kompresja, nagłówki, wgranie bazy).
- **Adres strony przy starcie**: `canonical`, `hreflang` i `og:url` powstają z `NUXT_PUBLIC_SITE_URL` czytanego przy starcie serwera — `server/plugins/siteUrl.ts` podaje go modułowi i18n przy każdym żądaniu, a `i18n.baseUrl` zniknęło z konfiguracji. Build nie musi już znać adresu (sprawdzone: build bez zmiennej, start z innym adresem).
- **pnpm**: `packageManager: pnpm@12.9.1` w `package.json`, `README.md` podaje pnpm 12, CI bierze wersję z `package.json`. Na Macu jest pnpm 9 — przed `pnpm install` trzeba go tam podnieść.
- **Podatności**: nadpisania w `pnpm-workspace.yaml` (`simple-git` ^4.0.1 dla `@nuxt/devtools`, `esbuild` dla `drizzle-kit` i `@nuxt/fonts`). `pnpm audit`: 8 → 2. `pnpm db:generate` po zmianie działa („No schema changes”).

**Treść** — poprawki są w `scripts/legacy/corrections.ts`, nałożone na lokalną bazę przez `pnpm legacy:corrections`; importer nakłada je sam na końcu, więc ponowny import ich nie cofnie:

- **Tytuły podstron**: przejrzane wszystkie 806, poprawionych 89 — same przymiotniki („Grecka” → „Mitologia grecka”), same cyfry („1” → „Zew krwi 1”, „Akt 1, część 1”), literówki („Wężę”, „Bramia Piekła”, „Plajedy”, „Hallowen”, „rezenzja”), wersaliki, zdublowane tytuły rozdziałów („Atena! Jej wielka miłość” 3 i 4), strona „Jowisz” opisująca Marsa. Adresy stron się nie zmieniły. Pisownię nazw własnych poprawiałem tylko tam, gdzie treść strony używa poprawnej formy.
- **Kategoria newsów**: „Aktuzlizacje dotyczące zawartości strony!” → „Aktualizacje strony”, adres `/newsy/kategoria/aktualizacje-strony`. Stary adres z literówką daje 404 — w treściach i menu nie było do niego odnośników.
- **FAQ**: kategoria „REJESTRACJA I LOGOWANIE” to teraz „LOGOWANIE I KONTO”, jej 12 pytań przepisanych pod logowanie Google, zmianę nicku i usuwanie konta. Trzy odpowiedzi o przesyłaniu materiałów nie odsyłają już do panelu profilu. Usuniętych 9 pytań o funkcje, których nie ma (prywatne wiadomości, oceny artykułów, rangi, podpisy, powiadomienia) i jedno bez odpowiedzi. Zostają 63 pytania.
- **„Home”** w menu i okruszkach to po polsku „Strona główna”.

**Wygląd** (numery z dawnej listy „Uwagi z przeglądu”):

- 1 — menu boczne jest przyklejone i przewija się we własnej kolumnie; krótka strona (`/pliki`) ma 1490 px zamiast 3048. Na głębokiej podstronie menu samo przewija się do bieżącej pozycji.
- 2 — duży kafel newsa: okładka 224 px (było 176), gwiazdozbiór 192 px (było 160), więc „niebo” nie stoi puste.
- 3, 4 — treść z legacy dostaje przy wysyłce klasy (`server/utils/layoutHints.ts`, baza bez zmian): akapit z jednym pogrubionym zdaniem to nagłówek motywu, tabela z samych grafik jest albo jednym pociętym obrazem (bez odstępów i zaokrągleń), albo siatką kafelków (wyśrodkowaną). Obrazki-odstępy o wysokości 1 px nie rozciągają się już na 390 px. Etykieta w pierwszej kolumnie tabeli dwukolumnowej nie łamie się od 640 px szerokości.
- 5 — stopka „Rewolucyjne projekty”: cztery jednakowe ramki; Angelologia pokazuje wycinek własnej mapy.
- 6 — zdjęcie bez tytułu ma nagłówek „Grafika 12 z 80”; scenę wypełnia rozmyta kopia zdjęcia.
- 7 — tematy forum mają stronicowanie także nad postami; strona kategorii newsów ma pasek kategorii (`NewsCategoryBar`) z zaznaczoną bieżącą.
- 8 — wyłączone przyciski są szare, nie brudnobrązowe.
- 9 — panel na telefonie: wiersze tabel to karty z podpisanymi polami (`admin-table` w `main.css`), menu otwiera się jako warstwa pod przyklejonym paskiem, pasek narzędzi edytora to jeden przewijany rząd.
- 10 — obszary map mają na ekranach dotykowych cel co najmniej 32 px, próbki kolorów 32 px, okruszki 32 px wysokości.
- 11 — tekst 10,4 px podniesiony do 11,2 px (8 plików).
- 12 — strzałka okruszków zamyka poprzednią pozycję, więc linia nie zaczyna się od strzałki.
- 17 — trzy brakujące awatary na `/redakcja`: importer nie gubi plików z nawiasami (10 innych awatarów z `[` i `]` w nazwie leży w `.data/uploads`), więc tych trzech najpewniej nie ma w legacy. Do potwierdzenia na Macu.
- 19 — dwa słabo widoczne kolory legendy (`#8b4513`, `#993366`) są rozjaśnione z zachowaniem odcienia.
- 20 — okładki kategorii newsów i trzy banery zapisane bez metadanych (okładka ok. 75 kB → 17 kB, baner 100 kB → 68 kB); obrazki w stopce mają stałe ramki albo wymiary. Pierwszy przebieg skryptu przez błąd w ścieżce nie zrobił kopii okładek — oryginały odzyskałem z kopii `uploads` zrobionej godzinę wcześniej do przeglądu panelu; wszystkie 22 leżą w kopii zapasowej.
- 21 — przeskok układu po doczytaniu fontów: czcionki zastępcze mają teraz dopasowane metryki (`fonts` w `nuxt.config.ts`). CLS na emulowanym wolnym telefonie: lista newsów 0,118 → 0,000, strona główna 0,061 → 0,000.

**Przegląd panelu na kopii prawdziwych danych** — osobna sesja Claude przeklikała cały panel w przeglądarce (build produkcyjny, kopia bazy i plików, 1280–1440 px). Znalezione błędy potwierdziłem w kodzie, poprawiłem i sprawdziłem ponownie:

- **Kolor tekstu z edytora nigdy się nie zapisywał, a każda edycja starej treści kasowała w tym polu wszystkie kolory** (kolorowy tekst ma 673 z 1532 pól z legacy). Edytor zapisuje kolor jako `rgb()`, serwer przyjmował tylko zapis szesnastkowy — teraz go zamienia (`server/utils/html.ts`).
- **Każda edycja zdejmowała odnośniki z obrazków** (272 obrazki w 90 polach, m.in. cała nawigacja strony `saint-seiya/charakterystyki-postaci`). Obrazek jest w edytorze elementem wierszowym i zachowuje odnośnik (`app/utils/editorExtensions.ts`).
- **Samo „Zapisz” bez zmian usuwało obrazek w odnośniku owinięty w `<span>`** (`mapa-gwiazd`, `fan-arty/komiksy-korin2b`). Puste odnośniki są teraz wycinane po oczyszczeniu całej treści, nie po bezpośrednich dzieciach.
- **Mapa „Królestwo Umarłych” nie dawała się zapisać** — cztery obszary z legacy są cieńsze niż wymagane 0,1%; próg to teraz 0,01%.
- **Tłumaczenie samego tytułu zapisywało polską treść jako „tłumaczenie”** (dotyczyło 160 podstron i 37 newsów) — porównanie uwzględnia oryginał po oczyszczeniu.
- **Wstawiony obrazek lub film zostawał zaznaczony** i znikał przy pierwszym naciśnięciu klawisza — kursor staje teraz za nim.
- **Wyszukiwarki w panelu rozróżniały wielkość polskich liter** („Świąt” ≠ „świąt”) i traktowały `%` oraz `_` jak symbole wieloznaczne — wspólny `containsText` w `server/utils/sqlHelpers.ts`.
- **Przy 1280–1366 px przyciski akcji chowały się** za poziomym przewijaniem tabeli — kolumna akcji jest przyklejona do prawej krawędzi.
- Ostrzeżenie o używanym obrazku nie widziało odpowiedzi FAQ; limity długości i zakresu bez własnego komunikatu wychodziły po angielsku prosto z walidatora (`VALIDATION.TEXT_TOO_LONG` i trzy podobne).

Sprawdzenie poprawek na buildzie ze świeżą kopią bazy (`.data/review/editor-check.mjs`, `colour-check.mjs`): edycja stron 30, 7 i 4 — obrazki z odnośnikami 26 → 26, kolory bez zmian; zapis bez zmian stron 510 i 725 — nic nie znika; mapa 2 się zapisuje; obrazek, film i kolor z paska narzędzi zostają po pisaniu i zapisie. Reszta ma testy.

Bez zastrzeżeń według przeglądu (nie powtarzałem): wszystkie strony panelu ładują się bez błędów, dashboard zgadza się z bazą, menu i API zgadzają się z uprawnieniami dla 12 moderatorów z jednym uprawnieniem, odmowy usunięcia działają, log serwera bez ani jednego błędu 500, `Content-Security-Policy` nie zablokowała niczego na 30 stronach panelu i ok. 30 publicznych (z filmem YouTube, mapami, edytorem i wyszukiwarką). To, czego nie poprawiałem, jest w „Uwagi z przeglądu”.

**E2E**: scenariusz „an administrator takes a role away…” czekał na kliknięcie w nieodświeżony wiersz i na obciążonym komputerze przegrywał wyścig z odświeżeniem listy; teraz najpierw czeka na przefiltrowaną listę.

**Nowe testy**: adres klienta i CSP (`serverRules.test.ts`), znaczniki układu, kolory `rgb()` i obrazki w odnośnikach (`html.test.ts`), poprawki treści (`corrections.test.ts`), pozycja zdjęcia w albumie, wyszukiwanie bez względu na wielkość polskich liter, tłumaczenie samego tytułu, obrazek użyty w FAQ; e2e: pasek kategorii oraz nagłówki bezpieczeństwa, pełne adresy `canonical`/`hreflang` i brak komunikatów CSP w konsoli.

**Sprawdzone**: `pnpm check` (363 testy), `pnpm build` i 51 testów e2e na buildzie — po ostatniej zmianie kodu. Nagłówki odczytane `curl` z builda (strona, 404, panel, API, pliki statyczne). Poprawki wyglądu obejrzane na zrzutach z kopii zaimportowanej bazy albo potwierdzone pomiarem. 13 stron w trzech silnikach (Chrome, Firefox i WebKit z Playwrighta; komputer 1440 px i telefon, WebKit z profilem iPhone 15): wszystkie się ożywiają, bez poziomego przewijania, wysokości stron na komputerze zgodne co do kilku pikseli, przyklejone menu trzyma się w każdym silniku.

**Nie sprawdzone**:

- **Prawdziwe Safari, iPhone i prawdziwy Firefox** — na tym komputerze ich nie ma i być nie może (Safari), Firefox nie jest zainstalowany. Sprawdzone są tylko silniki z Playwrighta. Nie malują one rozmycia tła, więc pasek menu jest w nich przezroczysty i treść prześwituje — do obejrzenia w prawdziwych przeglądarkach.
- **CSP w prawdziwym użyciu**: logowanie Google i Turnstile (brak kluczy), odtwarzanie filmu w ramce YouTube poza testami.
- **Limit wyszukiwarki za prawdziwym proxy** — tylko testy jednostkowe.
- **CLS na Androidzie** — pomiar był w Chrome na Windows, gdzie są Times New Roman i Arial; na Androidzie zastępują je Noto Serif i Roboto (też mają dopasowane metryki, niezmierzone).
- **Ponowny import z legacy** z nowym krokiem poprawek — nie ma tu `legacy/`; krok ma testy integracyjne i przeszedł na lokalnej bazie.
- **Tryb dev e2e** — nie puszczany.

## Pierwsza sesja 2026-10-09 (Windows)

Sesja 2026-10-09 na Windows. Wszystko niżej jest w commicie `5d876ce`, poza sekcją „Porządki w bazie”, która powstała po nim (commit `7292250`).

**Porządki w bazie** (po commicie, na polecenie Mateusza; baza zmieniona bezpośrednio, bez wpisów w dzienniku zmian):

- Z „Plików do pobrania” usunięte „Karta zadań”, „Karta odpowiedzi” (konkurs z 2013 r., z adresem e-mail w opisach) i „Regulamin konta VIP” — wiersze w bazie i pliki z `.data/uploads/legacy/downloads/`. Zostały trzy pliki: oba tomy Gigantomachii i napisy do „Legend of Sanctuary”. Importer pomija te trzy pozycje (`RETIRED_DOWNLOAD_IDS` w `scripts/legacy/write.ts`), więc ponowny import ich nie przywróci.
- Puste odnośniki: 113 odnośników bez tekstu i obrazka w 55 wierszach (63 w podstronach, 34 w treści newsów, 16 w zajawkach) zostało rozpakowanych — znacznik `<a>` zniknął, to, co miał w środku (spacja, `<br>`), zostało. W postach, komentarzach, shoutboksie, mapach, FAQ i tłumaczeniach nie było żadnego.
- Sprawdzone na działającej stronie: `/api/downloads` zwraca trzy pliki, stary adres pliku i pobranie nr 1 dają 404, w wyrenderowanej `/redakcja` nie ma pustych odnośników, `PRAGMA integrity_check` zwraca `ok`. Wyjątek w importerze sprawdzony tylko typami — importu nie da się tu uruchomić.
- Skrypt jednorazowy: `.data/review/cleanup.mjs` (bez `--apply` tylko liczy). Na Macu nie trzeba go powtarzać, jeśli baza zostanie przeniesiona stąd.

**Brakujące scenariusze e2e** (nowy plik `tests/e2e/structure.spec.ts`; pomocnik `confirmRemoval` przeniesiony do `helpers.ts`, `signIn` zwraca konto):

- Podstrony: dodanie huba i dwóch podstron, zmiana kolejności (widoczna też na stronie publicznej), zmiana rodzica przez wyszukiwarkę, przeniesienie na poziom główny, odmowa usunięcia strony z podstronami, usunięcie.
- Struktura forum: kategoria i dział, widok publiczny, dział „tylko dla redakcji” (gość dostaje 404), odmowy usunięcia działu z tematami i kategorii z działami, zmiana nazwy, usunięcie.
- Użytkownicy: odebranie roli moderatora (panel znika po przeładowaniu), odmowa zmiany własnej roli i blokady własnego konta (przyciski ukryte, serwer odpowiada 409), odmowa zmiany konta, które w międzyczasie zostało usunięte, odmowa blokady administratora przez moderatora.
- „Ostatni administrator”: tej odmowy nie da się wywołać z panelu — zmieniać role może tylko administrator, a własnej roli sobie nie odbierze, więc administratorów jest zawsze co najmniej dwóch. Zostaje w testach integracyjnych.
- Telefon (`mobile.spec.ts`): brak poziomego przewijania sprawdzany na 19 stronach publicznych, 4 formularzach zalogowanego użytkownika i 13 stronach panelu; edytor map (przycisk „Dodaj obszar”, przewijanie palcem).
- Test regresji szerokości strony głównej: dane testowe mają temat z długim tytułem. Z przywróconym błędem test pada. Winne były obcinane tytuły w listach tematów, nie News Center, jak zapisałem wcześniej.

**Drobne poprawki**:

- Emotikony (`:)`, `;)`, `:D` itd.) zamieniają się na emoji także w nowych postach, komentarzach i wpisach shoutboksa (`server/utils/smileys.ts`, wspólne z importerem). W blokach kodu zostają tekstem. Małe `b)` nie jest już emotikoną ani tu, ani w importerze (to zwykle punkt wyliczenia); `B)` działa jak dotąd.
- Wyszukiwarka: najwyżej 30 zapytań na minutę z jednego adresu (`SEARCH_RATE_LIMIT`), okno wyszukiwania pokazuje komunikat o limicie. Limiter zapomina adresy bez ruchu, więc mapa nie rośnie bez końca.
- `viewpage.php?page_id=761` przekierowuje na `/faq`. Numer 761 pochodzi z poprzednich notatek — w bazie nie ma strony z tym identyfikatorem, ale ze zrzutem legacy tego nie porównałem (nie ma go na tym komputerze).
- Lista `/video`: film usunięty z YouTube ma zaślepkę i podpis „Niedostępny” zamiast szarej miniatury i przycisku odtwarzania (ten sam `VideoPoster` co na stronie głównej; klucze przeniesione do `VIDEO_LIST.REMOVED*`).
- Panel: przyciski w listach poza `AdminTable` (nawigacja, zdjęcia w albumie, zakładki ustawień) są w grupach „Akcje: <nazwa pozycji>”.

**Mapa strony, RSS, robots, CI**:

- `/sitemap.xml` (`server/utils/feeds.ts`): strony stałe, opublikowane newsy i podstrony, kategorie, tagi, publiczne działy i tematy forum, albumy, zdjęcia, kategorie video, mapy — w obu językach, z `hreflang`. Na zaimportowanej bazie ok. 1950 adresów × 2 języki, 1,2 MB.
- `/rss.xml` i `/en/rss.xml`: 20 najnowszych newsów; odnośnik w `<head>` i w stopce.
- `/robots.txt`: wskazuje mapę strony, zamyka panel i API.
- `.github/workflows/ci.yml`: `pnpm check` oraz osobno `pnpm build` i Playwright na buildzie (`E2E_SERVER=build`), dla `staging`, `main` i pull requestów. Pierwszy przebieg na GitHubie (2026-10-09, `main`, commit `7292250`) jest zielony. Wcześniej te same kroki przeszły lokalnie w czystej kopii projektu (instalacja z zamrożonym lockfile, pnpm 12).

**Strona główna i strona newsa**:

- News Center zajmuje całą szerokość kolumny treści, a „Najnowsze tematy” i „Najciekawsze tematy” stoją pod nim obok siebie — nie ma już pustej przestrzeni pod krótką zakładką.
- Zakładki News Center to zwykłe przyciski nad przewijanym paskiem slajdów (wcześniej `::scroll-marker`, którego nie mają Firefox ani Safari — tam trzech z czterech zakładek nie dało się znaleźć).
- Strona newsa ma na górze ten sam „wycinek nieba” co kafle (okładka kategorii, gwiazdozbiór znaku z dnia publikacji, data) zamiast okładki pływającej w treści. Wspólny komponent `NewsSky`.

**Przegląd wyglądu** — trzy równoległe przeglądy na kopii zaimportowanej bazy (zrzuty Playwright; poprawki sprawdzałem sam na zrzutach albo pomiarem):

- Telefon (390 i 360 px, Chrome): poprawione rzeczy opisane niżej; pozostałe w „Uwagi z przeglądu”.
  - Tabele z legacy (96 podstron) ściskały kolumny do jednej litery i miniatur po kilka pikseli. Teraz słowa zostają całe, obrazki mają rozsądną szerokość, a za szeroka tabela przewija się we własnej ramce. Zmierzone na wszystkich 188 tabelach: przy 390 px ściśnięty tekst w 78 → 0, zmniejszone obrazki w 51 → 0; przy 1440 px przewija się tylko kilka najszerszych (np. zestawienie rycerzy z 11 kolumnami).
  - Czarny i ciemnoszary tekst z legacy (415 miejsc) dziedziczy kolor motywu; sanitizer odrzuca takie kolory przy zapisie.
  - Edytor map w panelu: palec przewija obraz, obszary da się przesuwać dotykiem, nowy obszar dodaje przycisk „Dodaj obszar” (rysowanie zostaje dla myszy).
  - Tabele panelu: pierwsza kolumna jest przyklejona, więc przy przyciskach akcji widać, którego wiersza dotyczą.
  - Ściśnięte wiersze w Ustawieniach i Nawigacji, nagłówek profilu użytkownika, lista plików, `/linki` przy 360 px (5 px poza ekran), rozmiar podpisu „Konto nieaktywne”, większe cele dotyku (numer posta, przełącznik języka, etykiety miejsc na mapie), podpowiedź o przesuwaniu mapy.
- Firefox i WebKit (wersje z Playwrighta, 1440, 1024 i 390 px) wobec Chrome:
  - Nagłówki: usunięte `font-variant-caps: small-caps`. Cinzel ma małe litery narysowane jako kapitaliki, a syntetyczne kapitaliki każda przeglądarka skalowała inaczej (Firefox o 13% większe), WebKit pokazywał w nich kwadraty zamiast „ł”, „ż”, „ę”. Teraz wszystkie trzy rysują to samo; w Chrome nagłówki są przez to odrobinę większe niż dotąd.
  - Posty forum w Firefoksie były o ok. 15% wyższe (margines akapitu trafiał też na `<br>`) — poprawione.
  - Bez różnic: niebo, kafle newsów, sekcje strony głównej, nagłówki paneli i sekcji, mapy, menu, okna dialogowe. W Firefoksie nie ma animacji przewijania (`animation-timeline`) i płynnego otwierania FAQ — treść jest od razu widoczna.
- Komputer (1440, 1024, 768 px): poprawione: powtórzona zajawka (w 246 z 302 newsów z treścią treść z legacy zaczyna się od zajawki — strona newsa pokazuje ją wtedy raz), zaślepki martwych obrazków nie rozpychają już kolumn tabel, szerokie tabele mają cienki pasek przewijania i poświatę na krawędzi, za którą są jeszcze kolumny, mapa mieści się w kolumnie przy 1024 px (minimalna szerokość została tylko na telefonie), okruszek „Home” nie stoi już sam na stronach najwyższego poziomu, „Pobierz” i „Zaloguj przez Google” mają kształt pozostałych przycisków, czerwony tekst z legacy ma czerwień motywu, puste kategorie video nie pokazują się w pasku. Reszta w „Uwagi z przeglądu”.

**Dostępność** (axe-core na 21 stronach publicznych, 15 stronach panelu i formularzy oraz 5 stronach przy 390 px):

- Poprawione: brak `h1` na stronie głównej, przeskok z `h1` na `h3` na listach newsów i video, `role="tabpanel"` na `<article>`, powtórzone opisy obrazków map, drugi nieopisany `<aside>` w formularzach panelu.
- Po poprawkach axe nie zgłasza nic na stronach głównej, newsów, video i map. Puste odnośniki w treści z legacy zostały potem usunięte z bazy (patrz „Porządki w bazie”).
- Lighthouse: dostępność 100 na stronie głównej, newsie, temacie forum i podstronie z tabelami (lista newsów miała 98 przed poprawką nagłówków; po niej nie mierzona), SEO 100.

**Wydajność** (Lighthouse na buildzie produkcyjnym z zaimportowaną bazą). Liczby są zaniżone z dwóch powodów: komputer był w tym czasie obciążony, a przeglądarka dostawała tu pliki statyczne bez kompresji (patrz „Kilka serwerów naraz” na końcu pliku).

- Wynik po poprawkach: telefon (symulowane wolne 4G) 55–61, komputer 89; odpowiedź serwera 160–370 ms, CLS 0–0,05 (lista newsów 0,115 — przeskok po doczytaniu fontów).
- Poprawione: edytor TipTap (456 kB) ładował się gościom na stronach z komentarzami i w tematach forum — teraz doczytuje się dopiero z formularzem (`LazyRichTextEditor`); grafiki motywu (`/theme/**`) mają nagłówek cache; `/media` wysyła pliki strumieniem zamiast wczytywać je do pamięci.
- Nie poprawione, do wdrożenia: HTML nie jest kompresowany (pliki statyczne są — gzip i brotli) — kompresję stron musi włączyć reverse proxy. Okładki kategorii newsów 150×200 ważą 60–80 kB przez metadane, baner 100 kB — do zrobienia przy podmianie grafik.

**Sprawdzone**: `pnpm check` (345 testów), `pnpm build` i 50 testów e2e na buildzie — w czystej kopii projektu po ostatniej zmianie; kopia była identyczna z katalogiem roboczym poza tym plikiem. Poprawki wyglądu obejrzane na zrzutach z builda produkcyjnego na kopii zaimportowanej bazy albo potwierdzone pomiarem (tabele, wysokości stron w trzech silnikach, axe, Lighthouse).

**Nie sprawdzone**:

- Prawdziwe Safari (macOS, iPhone) i prawdziwy Firefox — WebKit z Playwrighta na Windows to nie Safari (m.in. rysuje fonty zmienne zawsze w zwykłej grubości). Do obejrzenia na Macu: nagłówki z polskimi znakami, rozmycie pod przyklejonym paskiem menu, płynność gwiezdnego tła (w przeglądarkach testowych bez karty graficznej Firefox i WebKit miały 22–41 kl./s przy animowanym niebie).
- Prawdziwy telefon; edytor map sprawdzony tylko syntetycznymi zdarzeniami dotyku i testem właściwości CSS.
- Captcha i logowanie Google — bez zmian, brak kluczy.

## Sesje 2026-10-05 i 2026-10-06

**Animacja `reveal` na wysokich blokach** (macOS, 2026-10-06):

- Błąd: na stronie głównej przewiniętej do góry duży kafel newsa stał kilka pikseli niżej niż mały obok i był przygaszony. `reveal` kończył animację po wjechaniu 55% wysokości elementu, więc kafel 563 px potrzebował 310 px, a kafel 272 px tylko 150 px.
- Poprawka w `main.css`: zasięg `entry min(55%, 8rem)` — najwyżej 128 px, niezależnie od wysokości. Dotyczy wszystkich użyć `reveal`, także długich postów na forum i sekcji `stage`, które wcześniej długo zostawały półprzezroczyste.
- Sprawdzone: `pnpm check`; pomiar w Chrome przez Playwright przy 1456×1201, 1456×1100 i 2560×1300 — oba kafle mają teraz to samo przesunięcie i krycie.
- Nie sprawdzone: `pnpm test:e2e`, Safari i Firefox, pozostałe strony z `reveal` na żywo.

**Sekcje strony głównej: komentarze, grafiki, video** (macOS, 2026-10-05):

- Powód: „Rycerze komentują”, „Najnowsze grafiki” i „Najnowsze video” leżały wprost na gwiezdnym niebie i zlewały się z nim. Każda sekcja ma teraz własną nieprzezroczystą „scenę” (`stage` w `main.css`) razem z nagłówkiem. Grafiki i video nie stoją już obok siebie — każda sekcja zajmuje całą szerokość kolumny treści; strona główna jest przez to dłuższa o ok. 700 px na komputerze.
- **Rycerze komentują** (`LatestComments`): zamiast karuzeli lista sześciu rycerzy (awatar z inicjałów, nick, tytuł komentowanej treści) i obok duży cytat. Głos przełącza najechanie myszą, kliknięcie i klawiatura (zakładki ARIA: strzałki, Home, End). Zaznaczenie przesuwa się pod aktywny wiersz (`sliding-thumb-x` / `sliding-thumb-y`), a przy cytacie rysuje się na złoto gwiazdozbiór znaku zodiaku z dnia komentarza, podpisany znakiem i datą — jak w kaflach newsów. Poniżej 576 px szerokości sceny lista zamienia się w rząd awatarów nad cytatem.
- **Najnowsze grafiki** (`LatestPhotos`): skośne pasy (`roster` w `main.css`). Gdzie jest mysz i co najmniej 576 px szerokości sceny, osiem pasów wypełnia rząd, a najechany lub wybrany klawiaturą rozsuwa się i pokazuje tytuł z albumem; ostatnio otwarty zostaje otwarty. Na ekranach dotykowych i w wąskiej kolumnie ten sam rząd jest przewijanym paskiem scroll-snap z podpisem na każdym pasie.
- **Najnowsze video** (`LatestVideos`): duży ekran i playlista czterech filmów. Kliknięcie w pozycję playlisty albo w ekran odtwarza film na miejscu (ramka `youtube-nocookie`), wcześniej kafle prowadziły tylko na `/video`.
- **Filmy usunięte z YouTube**: YouTube zamiast błędu odsyła szarą miniaturę 120×90 — `VideoPoster` rozpoznaje ją po rozmiarze (`isRemovedVideoPoster` w `app/utils/youtube.ts`). Taki film dostaje zaślepkę z gwiazdami, podpis „Niedostępny” i komunikat „Tego filmu nie ma już na YouTube.” zamiast przycisku odtwarzania; ekran sam ustawia się na najnowszym filmie, który jeszcze istnieje.
- **Stan danych**: z 74 filmów w bazie 36 nie ma już miniatury na YouTube (sprawdzone 2026-10-05 zapytaniami o `mqdefault.jpg`), w tym wszystkie cztery najnowsze — sekcja video na stronie głównej pokazuje więc teraz cztery zaślepki. Patrz „Decyzje dla Mateusza”, punkt 9.
- Cytat komentarza jest ucinany na granicy słowa z wielokropkiem (wcześniej twardo po 160 znakach, co ukrywało obcinanie CSS w karuzeli). Ucinanie wyszło z `news.ts` do `truncateAtWord` w `server/utils/html.ts`; zajawki newsów działają jak dotąd.
- Usunięte: `LatestMedia.vue`, narzędzie `carousel-arrows` w `main.css` (używała go tylko stara karuzela komentarzy) oraz zmienne `--carousel-*-label` w `NewsCenter` i klucze `HOME_PANELS.CAROUSEL_PREVIOUS` / `CAROUSEL_NEXT`, które służyły wyłącznie temu narzędziu. `VideoCard` bierze adresy z `app/utils/youtube.ts`, bez zmiany działania.
- Testy: `tests/unit/youtube.test.ts`, test cytatu w `translatedContent.test.ts`, dwa scenariusze e2e w `public.spec.ts` (przełączanie komentarzy myszą i strzałkami, przejście do grafiki, odtworzenie filmu; film usunięty z YouTube — miniatura podstawiona w teście). Dane e2e mają drugi komentarz, pod zdjęciem „Złota zbroja”.
- Obejrzane na zrzutach Playwright na zaimportowanej bazie: 1440, 1100, 800, 600, 390 i 360 px, `/en`, stan po najechaniu, fokus z klawiatury, dotyk, sekcje z jednym elementem, video z żywymi miniaturami (podstawionymi w przeglądarce) i z samym najnowszym filmem usuniętym.
- Nie sprawdzone: Safari i Firefox (zapytania kontenerowe, `tan()` w CSS, przejście `flex-grow`), prawdziwy telefon, płynność animacji na żywo (widziałem stany końcowe i jedną klatkę w trakcie), odtwarzanie filmu w ramce YouTube (sprawdzony jest tylko adres ramki), czytnik ekranu.
- Znane ograniczenia: miniatury grafik mają 480 px szerokości, więc rozsunięty pas (do ok. 410 px) jest na ekranie Retina lekko miękki, a panorama „12 Złotych Rycerzy” wyraźnie rozmyta — zniknie po podmianie grafik albo przy większych miniaturach. Lista filmów `/video` (`VideoCard`) nadal pokazuje szarą miniaturę YouTube przy usuniętych filmach.

**Siatka newsów** (macOS, 2026-10-05):

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

**Przebudowa nagłówka** (macOS, 2026-10-05):

- Pasek górny nad banerem zniknął. Statystyki (Rycerzy, postów, komentarzy) są zaparkowane w `app/components/layout/SiteStatistics.vue` — komponent nie jest nigdzie podpięty; `/api/layout` nadal je zwraca.
- Menu konta siedzi po prawej stronie paska menu głównego (`UserMenu` na nowym `BaseDropdown`). Zalogowany: awatar z inicjałów (`initialsOf`, pierwsze dwa słowa nicku) + nick, w środku nick i rola, Profil, Twoje konto, Panel administratora (role inne niż `user`), język PL/EN, Wyloguj. Gość: przycisk „Zaloguj”, w środku język i „Zaloguj przez Google”. Poniżej `sm` w pasku zostaje sam awatar.
- Zdjęcie z Google nie jest już pokazywane w nagłówku (zostaje w profilu i postach).
- Odnośniki paska mają `text-xs`; „Newsy” wypadły z `MAIN_NAVIGATION` (czyli także z menu mobilnego i skrótów wyszukiwarki) — lista newsów jest pod „Wszystkie newsy” na stronie głównej.
- `LanguageSwitcher` to teraz `role="group"` zamiast `<nav>`; `routes.account()`; klucze `LAYOUT.PROFILE`, `LAYOUT.SIGN_IN`, `LAYOUT.PANEL` = „Panel administratora”.
- Testy: e2e przepisane pod menu (`openAccountMenu` w `tests/e2e/helpers.ts`), strona 404 sprawdza menu boczne zamiast statystyk, nowy test jednostkowy `tests/unit/initials.test.ts`. Obejrzane na zrzutach 1280, 1024, 768, 390 i 360 px (gość i zalogowany, PL i EN), bez przewijania paska.
- Wyszukiwarka w pasku to teraz „pole” (`SearchTrigger.vue`): ikona, „Szukaj” i podpowiedź skrótu — `⌘K` na Apple, `Ctrl K` gdzie indziej (rozpoznanie po `user-agent`, wartość z serwera przez `useState`); na telefonie sama ikona w kółku. Okno otwiera też `/`, o ile fokus nie jest w polu tekstowym ani edytorze. Nowy scenariusz e2e „the search opens from the keyboard”.
- Nie sprawdzone: animacja otwierania na żywo (tylko stan końcowy na zrzutach), Safari i Firefox, obsługa klawiaturą poza Escape w kodzie.

**Nagłówki paneli** (macOS, 2026-10-05):

- Nowy `PanelHeading` (`app/components/content/PanelHeading.vue`): tytuł na skośnej złotej płycie, obok pasek nocnego nieba z gwiazdozbiorem. Zastąpił płaski pomarańczowy pasek w menu bocznym (`NavigationSections`, więc także w menu mobilnym), w News Center i w kategoriach na `/forum`. Style w `main.css`: `star-banner`, `star-banner-plate`, `star-banner-sky` (dolna złota linia, gasnąca od stopy skosu ku gwiazdozbiorowi), `constellation-trace`; nowy kolor `gold-100`. Płyta i niebo mają tylko łagodne przejście w poziomie — pionowy gradient „jasna góra, ciemny dół” i wytłoczony cień tekstu Mateusz odrzucił jako staroświeckie.
- Gwiazdozbiory pochodzą z `app/utils/constellations.ts` — pliku z równoległej pracy nad niebem gwiezdnym. `PanelHeading` od niego zależy, więc oba muszą trafić do repozytorium razem. Menu boczne dostaje po kolei Pegaza, Smoka, Łabędzia, Andromedę i Feniksa; News Center i forum idą zodiakiem od Barana.
- Przy wejściu na stronę płyta raz błyska, a linie gwiazdozbioru się rysują (w menu bocznym kaskadowo, przez `--banner-order`). Przy `prefers-reduced-motion` animacji nie ma.
- Pozostałe użycia `cosmo-bar` (okna dialogowe, przyciski, zakładki, panel administratora) bez zmian.
- Sprawdzone: lint całości, format zmienionych plików, typy, Vitest (324 testy). Pełne `pnpm check` staje na formacie czterech plików nieba gwiezdnego (`StarrySky.vue`, `constellations.ts`, `skyPainter.ts`, `skyShow.ts`), których tu nie ruszałem. Obejrzane w Chrome (strona główna, forum) i na zrzutach Playwright (menu mobilne 390 px, ograniczony ruch).
- Nie sprawdzone: `pnpm test:e2e`, Safari i Firefox, tytuł sekcji dłuższy niż dwie linie w menu bocznym (przy czterech liniach skos płyty dochodzi do gwiazdozbioru).

**Nagłówki sekcji** (macOS, 2026-10-05):

- `SectionHeading` (`app/components/content/SectionHeading.vue`) jest wyraźniejszy: tytuł 24 px pogrubiony (było 20 px), wyrównany do lewej krawędzi treści, a pod nim na całą szerokość „meteor” — czteroramienna gwiazda z poświatą i zwężająca się, gasnąca w prawo złota smuga. Zastąpił mały pomarańczowy pasek przed tytułem. Odnośnik „Zobacz wszystko” zostaje po prawej, w wierszu tytułu. Propsy bez zmian, więc żadne z 11 użyć nie wymagało poprawek.
- Style w `main.css`: `meteor-head`, `meteor-trail`. Smuga rysuje się od gwiazdy przy wjeżdżaniu nagłówka w ekran (`animation-timeline: view()`, jak `reveal`); bez wsparcia przeglądarki i przy `prefers-reduced-motion` jest od razu cała.
- Odrzucony wariant: gwiazda, tytuł i smuga w jednym wierszu. W kolumnach 460 px („Najnowsze grafiki / video”) tytuł się łamał, smuga kurczyła się do kikuta wyglądającego jak strzałka, a w „Rycerze komentują” wchodziła pod strzałki karuzeli.
- Sprawdzone: `pnpm check`, `pnpm test:e2e`, zrzuty Playwright 1440 i 390 px (strona główna, `/linki`, `/faq`), przebieg animacji zmierzony przy przewijaniu w Chrome.
- Nie sprawdzone: Safari i Firefox, pozostałe miejsca użycia na żywo (komentarze pod treścią, mapy, tagi, profil użytkownika) — ten sam komponent, ale nie oglądane.

**Gwiezdne tło** (macOS, 2026-10-05, równolegle z przebudową nagłówka):

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

**Pierwsza sesja na Windows** (2026-10-05). Bez sterowanej przeglądarki (brak rozszerzenia Claude in Chrome), więc przegląd szedł scenariuszami Playwright i zrzutami ekranu.

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

**i18n, etap 1 — teksty statyczne** (ta sama sesja):

- `@nuxtjs/i18n` 10: `pl` domyślny bez prefiksu, `en` pod `/en` z angielskimi adresami (`/en/news`, `/en/forum/thread/1`, `/en/admin/users`). Przełącznik PL/EN w pasku górnym, `lang` i `hreflang` w nagłówku strony. Bez automatycznego przekierowania według języka przeglądarki.
- 736 kluczy w `i18n/locales/pl.json` i `en.json` (płaskie `SEKCJA.NAZWA`), wyniesione ze stron, komponentów, panelu administratora i komunikatów serwera (serwer zwraca klucze `ERRORS.*` / `VALIDATION.*`). Daty i liczby formatowane według języka.
- Typowane trasy (`experimental.typedPages`) wyłączone — kłóciły się z trasami i18n; parametry trasy czyta `useRouteParam()`.
- Angielskie tłumaczenia napisał Claude — do przejrzenia przez Mateusza.

**i18n, etap 2 — treści z bazy i grafiki PL/EN** (ta sama sesja):

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

**Przegląd błędów w całym kodzie** (piąta sesja 2026-10-05) — trzy równoległe przeglądy (serwer publiczny, panel, front publiczny), każde zgłoszenie sprawdzone w kodzie przed poprawką:

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

**Wygląd podstrony `/redakcja`** — tabele profili z legacy (nick, kontakt, awatar z `rowspan`, stanowisko, opis) są pokazywane jako karty, nagłówki grup jako nagłówki szeryfowe, a „Byli członkowie” jako równa siatka awatarów. Sam CSS w `rich-content` (`app/assets/css/main.css`), dopasowany do struktury tabeli — treść w bazie bez zmian; wzorzec pasuje tylko do tej strony. Obejrzane na zrzutach 1280 i 390 px. Decyzje Mateusza: prywatnych wiadomości na razie nie robimy, numer GG wylatuje, adresy e-mail redakcji zostają — odnośniki „Prywatna Wiadomość” i numer GG usunięte z treści strony w lokalnej bazie (`pages.id = 1`); ponowny import z legacy je przywróci, importer nie był zmieniany. Trzy awatary nie istnieją w plikach (zaślepka).

**Dziennik zmian** (szósta sesja 2026-10-05):

- Tabela `audit_logs` (migracja `0003_true_skaar.sql`, zastosuje się przy starcie): kto (id, nick i rola w chwili zdarzenia), kiedy, akcja (dodanie, zmiana, usunięcie, logowanie, rejestracja), dział, id i nazwa pozycji, język treści oraz lista pól „było → jest”. Długie teksty zapisują się jako wycinek 400 znaków wokół miejsca zmiany.
- Logowane: wszystkie zasoby panelu (wspólne handlery), pliki, zdjęcia i okładki albumów, obrazki, kolejność (podstrony, zdjęcia, menu), ukrywanie i usuwanie komentarzy i wpisów shoutboksa, blokady i role użytkowników, News Center, moderacja forum (zamknięcie, przyklejenie, przeniesienie, usunięcie tematu, edycja i usunięcie posta — także edycja własnego posta przez autora), zmiana nicku, usunięcie konta, rejestracja, logowanie i rola nadana z `NUXT_ADMIN_EMAILS`.
- Nie logowane: nowe posty, komentarze, wpisy shoutboksa i głosy w ankietach (mają własnego autora i datę; głosy są tajne), wgranie obrazu mapy przed zapisem mapy, logowanie testowe nadające rolę.
- Dziennik nie przechowuje e-maili, identyfikatorów Google, awatarów ani adresów IP. Nie ma też automatycznego czyszczenia starych wpisów.
- Panel → Portal → „Dziennik zmian” (`/admin/dziennik`, tylko administrator): filtr akcji i działu, szukanie po nicku lub nazwie pozycji, rozwijane szczegóły zmian. Nazwy pól pokazują się tak jak w kodzie (`bodyHtml`, `isHidden`).
- Testy: 12 nowych testów integracyjnych (`tests/integration/auditLog.test.ts`) i scenariusz e2e w `admin.spec.ts`. `pnpm lint`, `pnpm typecheck` i Vitest (299 testów) zielone; z e2e uruchomione `admin`, `moderation` i `community` (22 testy, zielone), `public` i `mobile` nie.
- `app/assets/css/main.css` ma niezacommitowane zmiany spoza tej pracy (plik zmieniał się równolegle w trakcie sesji) — nie ruszałem ich. `pnpm format:check` na koniec zielone.
- `pnpm legacy:import --force` kasuje dziennik razem z bazą.
