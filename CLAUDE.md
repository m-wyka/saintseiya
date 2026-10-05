# Saint Seiya Revolution — nowa aplikacja

Przepisanie portalu fanowskiego o anime Saint Seiya (Rycerze Zodiaku) ze starego PHP-Fusion 7.02.05 na Nuxt 4 + Nitro, z nowym wyglądem opartym na motywie z legacy. Treści i historia forum są migrowane ze starej bazy; konta użytkowników nie.

## Źródła informacji

| Źródło | Co z niego biorę |
|---|---|
| `legacy/` | Kod starej strony, grafiki, pliki treści. Tylko do odczytu, poza gitem. |
| `legacy/wwyka_saintseiya_1791133520.sql` | Zrzut bazy MySQL — jedyne źródło treści do migracji. |
| `legacy/themes/saintseiya-g-angeltheme3/` | Aktywny motyw — baza nowego wyglądu. Pozostałe katalogi w `themes/` ignoruję. |
| `STATUS.md` | Aktualny stan prac, rzeczy niesprawdzone, otwarte decyzje i następne kroki. Czytać na początku sesji, aktualizować na końcu. |
| `docs/legacy.md` | Wyniki analizy legacy: tabele, liczby, kodowanie, mapa plików, paleta, stare adresy. Czytać przed pracą nad migracją lub wyglądem. |
| `/Users/mwyka/Work/dot-sport-shop/` | Wzorzec reguł Prettier i ESLint oraz układu testów. Kopiować reguły, nie logikę sklepu. |
| Bieżąca dokumentacja Nuxt, Nitro, Tailwind, Pinia | Wersje i API sprawdzać w aktualnych źródłach, nie z pamięci. |
| Apple, Revolut | Inspiracja: czystość układu, typografia, animacje. Klimat zostaje anime / Saint Seiya. |

## Zakres

- **Portal**: podstrony, newsy, kategorie, tagi, forum, galerie i zdjęcia, komentarze, mapy interaktywne.
- **Moduły dodatkowe przenoszone z legacy**: galeria video (YouTube), shoutbox, ankiety, katalog linków, pliki do pobrania.
- **Widoczność**: wszystkie migrowane podstrony są publiczne, także dawne „tylko dla zalogowanych” (Multimedia). Wyjątek: strony redakcyjne (z treścią są 2) trafiają do bazy jako ukryte szkice.
- **Logowanie**: wyłącznie Google. Bez rejestracji e-mail/hasło.
- **Starzy użytkownicy**: nie migrujemy kont. Autorzy starych treści zostają jako „ghost” — sam nick i podpis „Konto usunięte”.
- **Role**: `user`, `moderator` (z osobno nadawanymi uprawnieniami), `administrator`.
- **Panel administratora**:
  - dodawanie, edycja i usuwanie treści (newsy, podstrony, mapy, galerie),
  - kategorie, tagi, obrazki,
  - zarządzanie użytkownikami i rolami,
  - dashboard ze statystykami (posty, komentarze, użytkownicy itd.).
- **Podstrony**: w legacy jest ich ok. 740 w kilku typach (artykuły, strony-huby z listami odnośników, mapy). Zarządzanie w panelu ma odpowiadać tym typom.
- **Mapy interaktywne**: obraz z klikalnymi obszarami prowadzącymi do treści. Mapę da się stworzyć i edytować w panelu (obraz, obszary, odnośniki, treść pod odnośnikiem).
- **Captcha** na formularzach forum i komentarzy. Lokalnie może nie działać.
- **BBCode** ze starych postów konwertowany przy migracji; oryginał zachowany.
- **Martwe obrazki zewnętrzne**: zostaje odnośnik i czytelna zaślepka „Nie znaleziono zdjęcia”.

## Stack

**Frontend**
- Nuxt 4, Vue 3, TypeScript strict
- Pinia (store)
- VueUse — tylko gdy realnie potrzebne
- Tailwind CSS 4
- Karuzele w czystym CSS (scroll-snap), bez bibliotek JS

**Backend**
- Nitro (wbudowany w Nuxt), bez osobnego serwera API
- SQLite (`better-sqlite3`) + Drizzle ORM
- Hosting: VPS lub Render z trwałym dyskiem; baza i wgrane pliki leżą na dysku serwera
- Sesja i Google OAuth przez `nuxt-auth-utils`

**Jakość**
- Testy backendu: Vitest (jednostkowe i integracyjne)
- Testy e2e: Playwright
- ESLint + Prettier z regułami z `dot-sport-shop`
- Node 22, pnpm

## Komendy

- `pnpm check` — lint, format, typy, testy Vitest. Musi przejść przed uznaniem zmiany za gotową.
- `pnpm test:e2e` — testy Playwright; same stawiają serwer i bazę w `.data/e2e`.
- `pnpm db:generate` — po każdej zmianie `server/db/schema.ts`.
- `pnpm legacy:import --force`, potem `pnpm images:check` — odtworzenie bazy z legacy (wymaga pomocniczego MySQL, patrz `docs/legacy.md`). Nigdy na bazie z treściami nowych użytkowników.
- Node 22: przed komendami ustawić `PATH` na Node 22 z nvm (domyślny w powłoce to 18).

## Wzorce w kodzie

- **Odczyt publiczny**: funkcja w `server/utils/<obszar>.ts`, cienki handler w `server/api/`. Treść HTML wychodząca na stronę przechodzi przez `markMissingImages`.
- **Zapis od użytkownika**: `requireAccount`, limit `assertWithinRateLimit`, `verifyCaptcha`, czyszczenie przez `cleanUserHtml`.
- **Panel administratora**: zasób = plik w `server/admin/` zbudowany przez `defineAdminResource` (walidacja Zod, `list/find/create/update/remove`), zarejestrowany w `server/admin/index.ts` lub `server/admin/groups/*`. Obsługują go wspólne handlery `server/api/admin/[resource]/`. Strony panelu używają `useAdminList`, `useAdminForm`, `SimpleCrud`, `AdminTable`.
- **Uprawnienia**: `canAccess` / `hasPermission` z `shared/utils/roles.ts`; serwer zawsze sprawdza je sam (`requireAdminAccess`), front tylko ukrywa elementy.
- **Adresy**: budować przez `routes` z `shared/utils/routes.ts`. Nowy segment na poziomie głównym dopisać do `RESERVED_ROOT_SEGMENTS`.
- **Pliki stron po angielsku, adresy w dwóch językach**: pliki w `app/pages` mają angielskie nazwy (`news/`, `admin/users.vue`). Angielski adres (`/en/news`) wynika z nazwy pliku, polski (`/newsy`) ze słownika `PAGE_FILE_SEGMENT_URLS` w `shared/utils/routes.ts`; `nuxt.config.ts` składa z tego `i18n.pages`. Nowy plik strony = nowy wpis w słowniku.
- **Tłumaczenia (i18n)**: `@nuxtjs/i18n`, domyślny `pl` bez prefiksu, `en` pod `/en`. Teksty leżą w `i18n/locales/pl.json` i `en.json` jako płaskie klucze `SEKCJA.NAZWA` wielkimi literami (np. `GENERAL.HOME`), bez głębszych zagnieżdżeń; oba pliki mają ten sam zestaw kluczy (pilnuje tego `tests/unit/messages.test.ts`). W komponencie `const { t } = useI18n()`, liczba mnoga przez `t(klucz, { count: formatNumber(n) }, n)` z formami `jeden | kilka | wiele`.
- **Odnośniki i nawigacja**: `routes.*` zwraca polskie ścieżki; na język przekłada je `<NuxtLinkLocale>` (także w `BaseButton`), a w kodzie `navigateTo(localePath(...))`. Porównania z bieżącym adresem przez `useCurrentSitePath()`, parametry trasy przez `useRouteParam()`.
- **Komunikaty z serwera**: serwer nie tłumaczy — w `statusMessage` i komunikatach Zod zwraca klucz (`ERRORS.*`, `VALIDATION.*`), z parametrami przez `messageKey()` z `shared/utils/messages.ts`. Front tłumaczy je w `apiErrorMessage` / `translateMessage`.
- **Podzapytania skorelowane w Drizzle**: kolumny przez `qualified()` z `server/utils/sqlHelpers.ts`, inaczej nazwa tabeli znika i warunek porównuje kolumnę samą ze sobą.
- **Testy**: logika serwera w `tests/integration` na tymczasowej bazie (`tests/setup.ts`, `fixtures.ts`); nowy plik w `server/utils/` dopisać do listy w `tests/setup.ts`. Ścieżki użytkownika w `tests/e2e`, strony otwierać przez `visit()`.

## Zasady kodu

- Kod samokomentujący: nazwy zmiennych i funkcji mówią, co robią. Komentarz tylko gdy bez niego nie da się zrozumieć „dlaczego”.
- Proste, lekkie rozwiązania. Bez zbędnych abstrakcji, bez ciężkich obliczeń tam, gdzie wystarczy prosta funkcja.
- Bez błędów: każda zmiana przechodzi lint, typecheck i testy, zanim uznam ją za skończoną.
- Identyfikatory w kodzie po angielsku. Tekstów interfejsu nie wpisuję w kod — każdy trafia do `i18n/locales/pl.json` i `en.json`.

## Zasady frontu

- Maksymalna szerokość strony i kontenerów: `xl` (1280 px).
- Podstawowe kontrolki jako komponenty bazowe: `BaseButton`, `BaseInput`, `BaseSelect` (kolejne w tej samej konwencji `Base*`).
- Wygląd czysty i przejrzysty, wizualnie podobny do motywu `saintseiya-g-angeltheme3`: czarne tło, ciemny turkus, pomarańczowo-złote akcenty, nagłówki kapitalikami szeryfowymi.
- Grafiki z legacy zostają i są skalowane CSS-em. Zostaną później podmienione na wersje w lepszej jakości, więc układ nie może zależeć od ich dokładnych wymiarów.
- Grafiki, które są samym tekstem (przyciski menu, nagłówki paneli), zastępuję czystym CSS.
- Animacje i interaktywność mile widziane, z poszanowaniem `prefers-reduced-motion`.
- Elementy tematyczne Saint Seiya (zodiak, konstelacje, cosmo) mogę proponować sam, w stylistyce motywu.

## Legacy — czego nie wolno

- Katalog `legacy/` nigdy nie trafia do repozytorium ani do katalogu publicznego w całości. Kopiuję z niego tylko konkretne, sprawdzone pliki.
- W `legacy/` leżą pliki prywatne i niezwiązane z portalem (lista w `docs/legacy.md`). Nie publikuję ich i nie cytuję ich zawartości.
- Nie migruję e-maili, haseł, adresów IP ani prywatnych wiadomości.
