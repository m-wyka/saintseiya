# Stan prac

Stan na 2026-10-05, koniec trzeciej sesji tego dnia — pierwszej na drugim komputerze (Windows, `E:\work\saintseiya`). Plik do aktualizowania na koniec każdej sesji. Zasady projektu są w `CLAUDE.md`, opis starej strony i importu w `docs/legacy.md`, obsługa w `README.md`.

## Gdzie jesteśmy

Aplikacja jest zbudowana od początku do końca i działa lokalnie na zaimportowanych danych. Przegląd działów panelu i moderacji jest prawie domknięty — w tej sesji scenariuszami e2e zamiast ręcznego klikania. Nie była jeszcze przeglądana przez Mateusza, nie ma podpiętego prawdziwego logowania Google ani hostingu.

| Kontrola | Wynik | Kiedy |
|---|---|---|
| `pnpm check` (lint, format, typy, Vitest) | zielone, 287 testów w 25 plikach | po ostatniej zmianie kodu, na Windows |
| `pnpm test:e2e` (Playwright) | zielone, 36 testów | po ostatniej zmianie kodu, na Windows |
| `pnpm build` | nie ponawiany w tej sesji | ostatnio przechodził w poprzedniej sesji (macOS) |

- **Git**: zdalne repozytorium `origin` to `https://github.com/m-wyka/saintseiya` (**publiczne**). Cały kod jest na gałęzi `staging`. `main` ma tylko początkowy commit z pustym README i na razie go nie ruszamy; `staging` wyrasta z niego, więc da się je później scalić. `legacy/`, `.data/`, `.env` są ignorowane.
- **Niezacommitowane**: zmiany z tej sesji (lista w „Zrobione w ostatniej sesji”) leżą w katalogu roboczym na `staging` — czekają na decyzję Mateusza o commicie. Do tego nieśledzony `pnpm-workspace.yaml` (zgoda na skrypty instalacyjne `esbuild` i `unrs-resolver`, wymagana przez pnpm 12 na tym komputerze) — nie mój, do decyzji, czy trafia do repozytorium.
- **Dostęp do GitHuba**: na pierwszym komputerze `origin` używa aliasu SSH `git@github-m-wyka:m-wyka/saintseiya.git` (jak `dot-sport-shop`), bo domyślne dane GitHuba należą tam do innego konta, bez prawa zapisu. Na drugim komputerze do wypychania potrzebny jest dostęp konta `m-wyka`.
- **Procesy**: nic z projektu nie działa w tle (serwer dev i pomocniczy MySQL na porcie 3399 zatrzymane).
- **Baza**: `.data/saintseiya.db` z importu 2026-10-05, obrazki zewnętrzne sprawdzone. Przegląd jej nie dotknął — 339 kont archiwalnych, żadnych kont testowych. Na tym komputerze są baza i `.data/uploads`; nie ma `legacy/` ani pomocniczego MySQL.
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
2. **Pasek górny** — „Rycerzy” jest ukryte przy zerze. Do decyzji, czy zamiast tego liczyć też konta archiwalne (339).
3. **Listy poza `AdminTable`** (zdjęcia w albumie, nawigacja, zakładki ustawień) — przyciski „Edytuj” i „Usuń” nadal bez nazwy z kontekstem pozycji.
4. **Emotikony** — w nowych wpisach `:)` zostaje tekstem; zamiana na emoji działała tylko przy imporcie.
5. **Pliki do pobrania** — trzy pozycje z konkursu z 2013 r. i regulamin „konta VIP”, w opisach adres e-mail konkursu. Do decyzji, czy zostają publicznie.
6. **`i18n.baseUrl`** czyta `NUXT_PUBLIC_SITE_URL` przy budowaniu — zmienna musi być ustawiona już podczas `pnpm build`, inaczej `hreflang` wskaże `localhost`. Do ustawienia przy wdrożeniu dev/prod.

## Decyzje dla Mateusza

1. **Wygląd** — do obejrzenia i uwag. Grafiki z legacy czekają na wersje w lepszej jakości.
2. **Pobranie działających obrazków zewnętrznych na własny serwer** (1701 adresów). Chroni przed ich zniknięciem i przed blokowaniem obrazków `http://` na stronie `https://`. Nie robiłem bez zgody.
3. **Sekcja Multimedia** (odcinki, skany, soundtracki). Strony są publiczne zgodnie z decyzją, ale nie ma ich w menu — w legacy te odnośniki widział tylko właściciel. Dodać do menu czy zostawić?
4. **Hosting**: VPS czy Render, domena, kopie zapasowe.
5. **Klucze**: Google OAuth, Cloudflare Turnstile, `NUXT_ADMIN_EMAILS`.
6. **`legacy/php-cgi53.core`** (653 MB zrzutu pamięci) — można usunąć.
7. **Repozytorium na GitHubie jest publiczne** — zostaje publiczne czy przełączyć na prywatne? W `docs/legacy.md` są wymienione nazwy prywatnych plików z `legacy/` (same nazwy, bez treści).
8. **Stare pliki konkursowe** w „Plikach do pobrania” (uwaga 5 wyżej).
9. **Commit zmian z sesji na Windows** i los `pnpm-workspace.yaml` (patrz „Gdzie jesteśmy”).
10. **„Rycerzy” w pasku górnym** — ukrywać przy zerze (jak teraz) czy liczyć też konta archiwalne (uwaga 2 wyżej).

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
