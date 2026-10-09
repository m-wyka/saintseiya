# Saint Seiya Revolution

Portal fanowski o Saint Seiya (Rycerze Zodiaku): podstrony, newsy, forum, galeria, video, mapy interaktywne i panel administratora. Nuxt 4 + Nitro + SQLite. Treści pochodzą z migracji starej strony na PHP-Fusion.

## Wymagania

- Node 22.19 lub nowszy (`.nvmrc`)
- pnpm 9

## Start lokalny

```sh
pnpm install
cp .env.example .env        # uzupełnij według opisu poniżej
pnpm db:migrate             # pusta baza; albo import z legacy (niżej)
pnpm dev
```

Strona działa pod `http://localhost:3000`.

## Zmienne środowiskowe

| Zmienna | Do czego służy |
|---|---|
| `NUXT_SESSION_PASSWORD` | Klucz szyfrowania sesji, co najmniej 32 znaki. W trybie dev tworzy się sam. |
| `NUXT_OAUTH_GOOGLE_CLIENT_ID`, `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` | Logowanie przez Google. Adres zwrotny w konsoli Google: `<adres strony>/auth/google`. |
| `NUXT_ADMIN_EMAILS` | Adresy e-mail (po przecinku), które po zalogowaniu dostają rolę administratora. |
| `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, `NUXT_TURNSTILE_SECRET_KEY` | Captcha Cloudflare Turnstile na forum, w komentarzach i shoutboxie. Puste = captcha wyłączona. |
| `NUXT_PUBLIC_SITE_URL` | Publiczny adres strony. |
| `NUXT_DB_PATH` | Plik bazy SQLite (domyślnie `.data/saintseiya.db`). |
| `NUXT_UPLOADS_DIR` | Katalog wgranych plików (domyślnie `.data/uploads`). |
| `NUXT_E2E_LOGIN` | `true` włącza logowanie testowe pod `/logowanie-testowe`. Tylko lokalnie i w testach — nigdy na produkcji. |

## Logowanie

- Jedyny sposób logowania to Google. Pierwszego administratora wyznacza `NUXT_ADMIN_EMAILS`.
- Bez kluczy Google można pracować lokalnie przez `/logowanie-testowe` (wymaga `NUXT_E2E_LOGIN=true`).
- Role: użytkownik, moderator z wybranymi uprawnieniami, administrator. Nadaje je administrator w panelu (`/admin/uzytkownicy`).

## Komendy

| Komenda | Działanie |
|---|---|
| `pnpm dev` | Serwer deweloperski |
| `pnpm build`, `pnpm preview` | Wersja produkcyjna i jej podgląd |
| `pnpm check` | Lint, format, typy i testy jednostkowe/integracyjne — uruchamiać przed każdym commitem |
| `pnpm test` | Testy Vitest |
| `pnpm test:e2e` | Testy Playwright (same stawiają serwer i bazę testową w `.data/e2e`); z `E2E_SERVER=build` testują gotowy build z `.output` zamiast serwera deweloperskiego |
| `pnpm lint:fix`, `pnpm format` | Automatyczne poprawki stylu |
| `pnpm db:generate` | Nowa migracja SQL po zmianie `server/db/schema.ts` |
| `pnpm db:migrate` | Zastosowanie migracji (serwer robi to też sam przy starcie) |
| `pnpm legacy:import` | Import treści ze starej bazy (opis niżej) |
| `pnpm images:check` | Sprawdzenie, które zewnętrzne obrazki w treściach jeszcze działają |

Te same kroki wykonuje GitHub Actions (`.github/workflows/ci.yml`) przy każdym wypchnięciu na `staging` i `main` oraz w pull requestach: `pnpm check`, a osobno `pnpm build` i testy Playwright na buildzie.

`pnpm build` czyści katalog `.nuxt`, więc nie uruchamiać go obok działającego `pnpm dev` w tym samym katalogu.

## Import ze starej strony

Wymaga katalogu `legacy/` (kod, pliki i zrzut SQL starej strony — poza repozytorium) oraz uruchomionej pomocniczej bazy MySQL ze zrzutem. Szczegóły, komendy startu bazy i opis danych: [docs/legacy.md](docs/legacy.md).

```sh
pnpm legacy:import --force   # buduje .data/saintseiya.db i .data/uploads od zera
pnpm images:check            # oznacza martwe obrazki zewnętrzne
```

Import jest powtarzalny: `--force` zastępuje bazę, więc uruchamiać go tylko przed startem produkcyjnym, nigdy na bazie z nowymi treściami użytkowników.

## Struktura

| Katalog | Zawartość |
|---|---|
| `app/` | Frontend: strony, komponenty (`base/` to kontrolki bazowe), układy, store'y Pinia |
| `server/api/`, `server/routes/` | Endpointy Nitro; `server/routes/media` serwuje wgrane pliki, a `sitemap.xml`, `rss.xml` (także `/en/rss.xml`) i `robots.txt` powstają z bazy |
| `server/utils/` | Logika odczytu i zapisu (auto-importowana w Nitro) |
| `server/admin/` | Zasoby panelu administratora — jeden plik na zasób |
| `server/db/` | Schemat Drizzle i migracje |
| `shared/utils/` | Kod wspólny dla frontu i serwera (role, adresy, slugi) |
| `scripts/legacy/` | Importer starej strony |
| `tests/unit`, `tests/integration`, `tests/e2e` | Testy |
| `public/theme/` | Grafiki motywu, które zostają obrazkami |
| `.data/` | Baza, wgrane pliki, dane testów — poza repozytorium |

## Wdrożenie

- Serwer z trwałym dyskiem (VPS lub Render). `NUXT_DB_PATH` i `NUXT_UPLOADS_DIR` muszą wskazywać na ten dysk.
- `pnpm build`, potem `node .output/server/index.mjs` ze zmiennymi środowiskowymi z tabeli wyżej.
- Kopia zapasowa to plik bazy i katalog wgranych plików.
