# Stan prac

Stan na 2026-10-05, koniec drugiej sesji tego dnia. Plik do aktualizowania na koniec każdej sesji. Zasady projektu są w `CLAUDE.md`, opis starej strony i importu w `docs/legacy.md`, obsługa w `README.md`.

## Gdzie jesteśmy

Aplikacja jest zbudowana od początku do końca i działa lokalnie na zaimportowanych danych. Trwa ręczny przegląd w przeglądarce — mniej więcej połowa listy za nami, znalazł trzy błędy (poprawione). Nie była jeszcze przeglądana przez Mateusza, nie ma podpiętego prawdziwego logowania Google ani hostingu.

| Kontrola | Wynik | Kiedy |
|---|---|---|
| `pnpm check` (lint, format, typy, Vitest) | zielone, 256 testów w 21 plikach | po ostatniej zmianie kodu |
| `pnpm test:e2e` (Playwright) | zielone, 26 testów | po ostatniej zmianie kodu |
| `pnpm build` | przechodzi | po ostatniej zmianie kodu; startu `.output` nie ponawiałem |

- **Git**: zdalne repozytorium `origin` to `https://github.com/m-wyka/saintseiya` (**publiczne**). Cały kod jest na gałęzi `staging`, wypchniętej na GitHuba. `main` ma tylko początkowy commit z pustym README i na razie go nie ruszamy; `staging` wyrasta z niego, więc da się je później scalić. `legacy/`, `.data/`, `.env` są ignorowane.
- **Dostęp do GitHuba**: na pierwszym komputerze `origin` używa aliasu SSH `git@github-m-wyka:m-wyka/saintseiya.git` (jak `dot-sport-shop`), bo domyślne dane GitHuba należą tam do innego konta, bez prawa zapisu. Na drugim komputerze do wypychania potrzebny jest dostęp konta `m-wyka`.
- **Procesy**: nic z projektu nie działa w tle (serwer dev i pomocniczy MySQL na porcie 3399 zatrzymane).
- **Baza**: `.data/saintseiya.db` z importu 2026-10-05, obrazki zewnętrzne sprawdzone. Przegląd jej nie dotknął — 339 kont archiwalnych, żadnych kont testowych.
- **Kopia do przeglądu**: `.data/review/` (baza + wgrane pliki, 190 MB). Na niej klikałem w panelu. Zawiera konta testowe „Rycerz Testowy” (admin) i „Drugi Rycerz” (user) oraz zmieniony tytuł pierwszej zakładki News Center. Jednorazowa — można usunąć i odtworzyć (komendy na końcu pliku).

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

**Kontrole**: `pnpm test:e2e` potwierdzone po wcześniejszych zmianach.

**Przegląd ręczny w przeglądarce** (na kopii bazy, każda pozycja sprawdzona także w bazie lub na stronie publicznej):

- **Ustawienia** — edycja tytułu zakładki, zmiana kolejności, dodanie, usunięcie, zapis, widok na stronie głównej. Nietknięte treści zakładek po zapisie zostają bajt w bajt.
- **Profil użytkownika** — konto archiwalne z postami, prawdziwe konto bez postów, 404 dla nieistniejącego i błędnego identyfikatora.
- **Edytor map** — rysowanie, zaznaczanie, etykieta, trzy rodzaje celu (podstrona z wyszukiwarką, adres, okienko z treścią), komunikat walidacji, przesuwanie, zmiana rozmiaru, usuwanie obszaru, zapis. Na mapie publicznej okienko się otwiera, odnośnik prowadzi pod adres. 17 pierwotnych obszarów mapy bez zmian.
- **Pliki** — wgranie, edycja, lista publiczna, pobranie z licznikiem, usunięcie (także pliku z dysku).
- **Linki** — dodanie, wyszukiwanie, edycja, usunięcie, lista publiczna.
- **Obrazki** — wgranie dwóch naraz, miniatury, kopiowanie adresu, odrzucenie pliku udającego obrazek, usunięcie (także z dysku).
- **Shoutbox w panelu** — ukrycie (wpis znika ze strony publicznej), filtr, przywrócenie, wyszukiwanie, usunięcie; do tego napisanie wpisu na stronie publicznej.

**Znalezione i poprawione błędy**:

1. `server/utils/html.ts` — `htmlToPlainText` sklejał wyrazy w miejscu `<br>` i granic akapitów („świat?Isko25”). Dotyczyło skrótów w profilu, wyszukiwarce, ostatnich komentarzach i liście komentarzy w panelu. Test jednostkowy dopisany.
2. `app/components/admin/MapAreaCanvas.vue` — po narysowaniu nowego obszaru zaznaczał się poprzedni, więc etykieta i cel trafiałyby do złego obszaru. Przyczyna: `defineModel` nie odświeża wartości synchronicznie, a indeks był liczony ze starej długości listy. Test e2e dopisany.
3. `app/components/admin/MapAreaCanvas.vue` — zaznaczenie zmieniało się przy wciśnięciu przycisku myszy, formularz obszaru pod mapą zmieniał wysokość i strona „podskakiwała” pod kursorem: nowy obszar wychodził zniekształcony, a kliknięty mógł się przesunąć. Zaznaczenie zmienia się teraz po zakończeniu gestu. Płótno mapy dostało `role="group"` i etykietę „Obszary mapy”.

## Co jest zrobione

**Dane**
- Importer `scripts/legacy/` (powtarzalny, ok. 10 s): konta archiwalne, newsy, podstrony w drzewie, forum, komentarze, galeria, video, shoutbox, ankiety, linki, pliki, menu, News Center, 4 mapy interaktywne.
- Konwersja treści: kodowanie ISO-8859-2, czyszczenie HTML, BBCode → HTML, emotikony → emoji, przepisanie starych odnośników na nowe adresy.
- Sprawdzanie obrazków zewnętrznych (`pnpm images:check`): 1701 działa, 852 martwe.

**Strona publiczna**
- Strona główna, newsy (kategorie, tagi), podstrony z okruszkami i hubami, forum, galeria, video, mapy z okienkami treści, linki, pliki, ankiety, shoutbox, wyszukiwarka, profile.
- Logowanie Google, konto (zmiana nicku, usunięcie konta → „Konto usunięte”), pisanie na forum, komentarze, shoutbox, głosowanie; captcha Turnstile i limit częstotliwości.
- Przekierowania 301 ze starych adresów (`viewpage.php`, `news.php`, `forum/viewthread.php`, `kr/index.html` itd.).
- Zaślepka „Nie znaleziono zdjęcia” dla martwych obrazków.

**Panel administratora** (`/admin`)
- Dashboard ze statystykami i wykresami.
- Newsy, kategorie, tagi, podstrony (drzewo), mapy (edytor obszarów), obrazki, galeria, video, pliki, linki, forum (struktura), komentarze, shoutbox, ankiety, użytkownicy i role, nawigacja, ustawienia (News Center).
- Moderacja forum na stronie tematu: zamknięcie, przyklejenie, przeniesienie, usuwanie, edycja postów.

## Czego nie sprawdziłem

Napisane i przechodzą kontrole automatyczne, ale nie były klikane w przeglądarce:

- **Panel: Użytkownicy** — tu przerwałem. Strona się ładuje; w kopii do przeglądu czeka konto „Drugi Rycerz”. Do sprawdzenia: nadanie roli moderatora z uprawnieniami, blokada i odblokowanie, filtr, wyszukiwanie.
- **Odświeżanie roli w sesji** (`server/plugins/freshSession.ts`) — nadal bez testu. Plan: test e2e na dwóch kontekstach przeglądarki — użytkownik zalogowany, administrator nadaje mu rolę moderatora, użytkownik po przeładowaniu widzi „Panel”; po blokadzie jest wylogowany.
- **Panel: Podstrony, Galeria, Komentarze, Forum, Ankiety, Nawigacja, Video** — obejrzane po załadowaniu, bez klikania akcji.
- **Moderacja forum** — w e2e tylko zamknięcie i otwarcie tematu; przyklejenie, przeniesienie, usuwanie i edycja posta tylko w testach integracyjnych.
- **Prawdziwe logowanie Google i prawdziwa captcha** — brak kluczy, testowane tylko logowanie testowe.
- **Wygląd na telefonie** — e2e sprawdza menu i brak poziomego przewijania, nikt nie oglądał. Okna sterowanej przeglądarki nie dało się zwęzić, więc potrzebny telefon, narzędzia deweloperskie albo zrzuty z Playwright w wąskim oknie.

## Uwagi z przeglądu (niepoprawione)

Drobiazgi zauważone po drodze, do poprawienia przy okazji albo do decyzji:

1. **Strona główna, News Center** — pod treścią zakładki widać poziomy pasek przewijania, a pod krótką treścią zostaje duża pusta przestrzeń (panel rozciąga się do wysokości prawej kolumny).
2. **Pasek górny** — „Rycerzy” liczy tylko prawdziwe konta, więc na starcie pokaże 0. Na stronie błędu 404 pasek nie pokazuje statystyk.
3. **Panel → Użytkownicy** — „Na portalu od” przy kontach archiwalnych pokazuje datę importu; profil publiczny ją ukrywa. Lepiej „—”.
4. **Panel → Obrazki** — komunikat o odrzuconym pliku zostaje na ekranie po kolejnych udanych akcjach.
5. **Tabele panelu** — przyciski „Edytuj” i „Usuń” nie mają nazwy z kontekstem wiersza (dostępność).
6. **Emotikony** — w nowych wpisach `:)` zostaje tekstem; zamiana na emoji działała tylko przy imporcie.
7. **Pliki do pobrania** — trzy pozycje z konkursu z 2013 r. i regulamin „konta VIP”, w opisach adres e-mail konkursu. Do decyzji, czy zostają publicznie.

## Decyzje dla Mateusza

1. **Wygląd** — do obejrzenia i uwag. Grafiki z legacy czekają na wersje w lepszej jakości.
2. **Pobranie działających obrazków zewnętrznych na własny serwer** (1701 adresów). Chroni przed ich zniknięciem i przed blokowaniem obrazków `http://` na stronie `https://`. Nie robiłem bez zgody.
3. **Sekcja Multimedia** (odcinki, skany, soundtracki). Strony są publiczne zgodnie z decyzją, ale nie ma ich w menu — w legacy te odnośniki widział tylko właściciel. Dodać do menu czy zostawić?
4. **Hosting**: VPS czy Render, domena, kopie zapasowe.
5. **Klucze**: Google OAuth, Cloudflare Turnstile, `NUXT_ADMIN_EMAILS`.
6. **`legacy/php-cgi53.core`** (653 MB zrzutu pamięci) — można usunąć.
7. **Repozytorium na GitHubie jest publiczne** — zostaje publiczne czy przełączyć na prywatne? W `docs/legacy.md` są wymienione nazwy prywatnych plików z `legacy/` (same nazwy, bez treści).
8. **Stare pliki konkursowe** w „Plikach do pobrania” (uwaga 7 wyżej).

## Znane ograniczenia

- Tytuły podstron są wyliczone automatycznie ze starych nazw („Faq”, „Grecka”) — wymagają przejrzenia w panelu.
- Zmiana adresu lub rodzica podstrony nie poprawia odnośników do niej w treściach innych stron ani w menu.
- Edytor przy edycji starych treści gubi `<small>`, `<details>` i opakowania `<div>`; tabele, wyrównanie, kolory, obrazki i YouTube zachowuje.
- Komentarze do filmów (2 z legacy) nie są nigdzie wyświetlane; filmy nie mają własnych stron.
- Photobucket potrafi zwrócić obrazek ze znakiem wodnym zamiast oryginału — sprawdzanie tego nie wykrywa.
- 40 zdjęć albumu „Sygnatury” i końcówka strony „Posejdon” (id 367) nie istnieją w legacy — nie do odzyskania.
- Wiele starych filmów z YouTube już nie istnieje (szare miniatury).
- Brak: mapy strony (sitemap), RSS, CI, audytu dostępności i wydajności.

## Następne kroki

1. Dokończyć przegląd z „Czego nie sprawdziłem”, zaczynając od Użytkowników i testu e2e dla odświeżania roli w sesji.
2. Poprawić drobiazgi z „Uwag z przeglądu” (punkty 1–5 nie wymagają decyzji).
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

- **Logowanie lokalne**: `/logowanie-testowe` (w `.env` jest `NUXT_E2E_LOGIN=true`), wybór roli w formularzu.
- **Ponowny import**: najpierw start pomocniczego MySQL (komenda w `docs/legacy.md`), potem `pnpm legacy:import --force` i `pnpm images:check`. Import kasuje bazę i katalog wgranych plików.

**Przegląd na kopii bazy** — żeby klikanie w panelu nie zmieniało zaimportowanych danych:

```sh
mkdir -p .data/review
rm -rf .data/review/saintseiya.db .data/review/uploads
sqlite3 .data/saintseiya.db ".backup .data/review/saintseiya.db"
cp -cR .data/uploads .data/review/uploads     # -c działa na macOS (APFS); gdzie indziej samo cp -R
NUXT_DB_PATH=.data/review/saintseiya.db NUXT_UPLOADS_DIR=.data/review/uploads pnpm dev
```

**Uwagi do przeglądarki sterowanej przez Claude**:

- Karta działa w tle, więc animacje przejść między stronami się nie kończą i po kliknięciu odnośnika strona wygląda na „wygaszoną”. To nie błąd aplikacji — sprawdzać przez pełne przeładowanie adresu.
- Pierwsze kliknięcie po przeładowaniu strony potrafi zginąć (do strony nie dociera żadne zdarzenie). Po przeładowaniu zrobić zrzut ekranu i neutralne kliknięcie, np. w nagłówek, a efekt każdej akcji potwierdzać.
- Przycisk „Usuń” wymaga potwierdzenia w ciągu 4 s — oba kliknięcia wysyłać w jednej paczce.
- Pliki do pól wgrywania da się podać skryptem na stronie (`DataTransfer` i zdarzenie `change`).
- Drugie konto testowe bez utraty własnej sesji: `POST /api/auth/e2e-login` z `credentials: 'omit'`.
