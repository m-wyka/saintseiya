import { and, asc, eq, inArray, isNull, like, sql } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { schema } from '../../server/db';
import type { Db, Tx } from '../../server/db';

// Editorial fixes on top of the legacy content. The importer applies them as its last step and
// `pnpm legacy:corrections` applies them to a database that already exists; running them twice changes nothing.

const series = (pathPrefix: string, titlePrefix: string, numbers: number[]): [string, string][] =>
  numbers.map((number) => [`${pathPrefix}${number}`, `${titlePrefix}${number}`]);

const numbersUpTo = (last: number): number[] => Array.from({ length: last }, (_, index) => index + 1);

interface PageMove {
  from: string;
  to: string;
  after?: string;
}

// The importer built the tree from legacy names. A typo or another word order ("CHARAKTERYSTYKII POSTACI",
// "RZYMSKA- BOGOWIE", "CHARAKTERYSTYKI POSTACI - FILM 3") made a second hub beside the right one, a sequel landed
// under the previous part and some addresses carry the typo of their title. `after` names the sibling the page
// follows in its new place; without it a page keeps its position, or goes last under a new parent.
export const PAGE_MOVES: PageMove[] = [
  {
    from: 'lost-canvas/charakterystyki-postaci/charakterystykii-postaci/bogowie',
    to: 'lost-canvas/charakterystyki-postaci/bogowie',
    after: 'lost-canvas/charakterystyki-postaci/zloci-rycerze-2',
  },
  {
    from: 'saint-seiya/charakterystyki-postaci/srebrni-rycerze/charekterystyki-postaci/inni-srebrni-rycerze',
    to: 'saint-seiya/charakterystyki-postaci/srebrni-rycerze/inni-srebrni-rycerze',
  },
  {
    from: 'mitologia/rzymska/rzymska-bogowie/pluton',
    to: 'mitologia/rzymska/bogowie/pluton',
    after: 'mitologia/rzymska/bogowie/boginie-rzymskie',
  },
  { from: 'mitologia/rzymska/bogowie/jowisz-2', to: 'mitologia/rzymska/bogowie/mars' },
  { from: 'mitologia/grecka/miejsca-kraina-umarlych', to: 'mitologia/grecka/miejsca/kraina-umarlych' },
  {
    from: 'fan-fiction/lamia/zew-krwi/2/3',
    to: 'fan-fiction/lamia/zew-krwi/3',
    after: 'fan-fiction/lamia/zew-krwi/2',
  },
  {
    from: 'fan-fiction/misscath/skrzywiona-perfekcyjnosc/skrzywiona-perfekcyjnosc-cz-2',
    to: 'fan-fiction/misscath/skrzywiona-perfekcyjnosc-cz-2',
  },
  { from: 'fan-fiction/shen-arshenik/run-away-1/run-away-2', to: 'fan-fiction/shen-arshenik/run-away-2' },
  ...[3, 4, 5].map((film) => ({
    from: `filmy-kinowe/charakterystyki-postaci/film-${film}`,
    to: `filmy-kinowe/film-${film}/charakterystyki-postaci`,
    after: `filmy-kinowe/film-${film}/recenzja`,
  })),
  {
    from: 'filmy-kinowe/saint-seiya/charakterystyki-postaci/film-6',
    to: 'filmy-kinowe/film-6/charakterystyki-postaci',
  },
  {
    from: 'mitologia/grecka/krolestwo-piekiel/bramia-piekla',
    to: 'mitologia/grecka/krolestwo-piekiel/brama-piekla',
  },
  { from: 'mitologia/grecka/postacie/plajedy', to: 'mitologia/grecka/postacie/plejady' },
  { from: 'mitologia/grecka/postacie/ehidna', to: 'mitologia/grecka/postacie/echidna' },
  { from: 'mitologia/kultura/jak-powstalo-hallowen', to: 'mitologia/kultura/jak-powstalo-halloween' },
  { from: 'saint-seiya/anime/seria-hades/elizjum-rezenzja', to: 'saint-seiya/anime/seria-hades/elizjum-recenzja' },
  {
    from: 'saint-seiya/historie-poboczne/atena-jej-wielka-milosc-1-2',
    to: 'saint-seiya/historie-poboczne/atena-jej-wielka-milosc-3',
  },
  {
    from: 'saint-seiya/historie-poboczne/atena-jej-wielka-milosc-1-3',
    to: 'saint-seiya/historie-poboczne/atena-jej-wielka-milosc-4',
  },
];

// Hubs the moves leave without pages. A hub that still has pages or text of its own stays.
export const EMPTIED_HUB_PATHS = [
  'lost-canvas/charakterystyki-postaci/charakterystykii-postaci',
  'saint-seiya/charakterystyki-postaci/srebrni-rycerze/charekterystyki-postaci',
  'mitologia/rzymska/rzymska-bogowie',
  'filmy-kinowe/charakterystyki-postaci',
  'filmy-kinowe/saint-seiya/charakterystyki-postaci',
  'filmy-kinowe/saint-seiya',
];

// Two pages called "Literatura" that hold a section banner and not a word of text. They become drafts.
export const BANNER_ONLY_PAGE_PATHS = ['mitologia/grecka/literatura', 'mitologia/grecka/literatura-2'];

// Titles were cut out of names such as "MITOLOGIA - GRECKA", which left bare adjectives, bare numbers and typos.
// The paths are the ones the pages have after the moves above.
export const PAGE_TITLE_CORRECTIONS: Record<string, string> = Object.fromEntries<string>([
  ['kolejnosc', 'Kolejność poznawania Saint Seiya'],
  ['fan-arty/komiksy-korin2b', 'Komiksy Korin2b'],

  ...series('fan-fiction/lamia/zew-krwi/', 'Zew krwi ', numbersUpTo(22)),
  ['fan-fiction/lamia/zew-krwi/prolog', 'Zew krwi – prolog'],
  ...series('fan-fiction/nox/saintlladyna/akt-1/', 'Akt 1, część ', numbersUpTo(3)),
  ...series('fan-fiction/nox/saintlladyna/akt-2/', 'Akt 2, część ', numbersUpTo(2)),
  ...series('fan-fiction/nox/saintlladyna/akt-3/', 'Akt 3, część ', numbersUpTo(5)),
  ...series('fan-fiction/nox/saintlladyna/akt-4/', 'Akt 4, część ', numbersUpTo(1)),
  ...series('fan-fiction/paulpolska/zeus-revenge/dodona/', 'Dodona ', [1, 2]),
  ['fan-fiction/misscath/skrzywiona-perfekcyjnosc-cz-2', 'Skrzywiona perfekcyjność, cz. 2'],
  ['fan-fiction/bodzian/wyprawa-po-zlote-runo-prolog', 'Wyprawa po złote runo – prolog'],
  ['fan-fiction/bodzian/wyprawa-po-zlote-runo-epilog', 'Wyprawa po złote runo – epilog'],
  ['fan-fiction/bodzian/sharaku/rycerz-andromedy-dodatek-1', 'Rycerz Andromedy – dodatek 1'],
  ...series('fan-fiction/bodzian/sharaku/rycerz-andromedy-podrozdzial-', 'Rycerz Andromedy – podrozdział ', [1, 2]),

  ['saint-seiya/anime/seria-asgard-recenzja', 'Seria Asgard – recenzja'],
  ...series('saint-seiya/anime/seria-asgard-streszczenia-', 'Seria Asgard – streszczenia ', [1, 2]),
  ['saint-seiya/anime/seria-posejdon-streszczenia', 'Seria Posejdon – streszczenia'],
  ['saint-seiya/anime/seria-sanktuarium-recenzja', 'Seria Sanktuarium – recenzja'],
  ...series('saint-seiya/anime/seria-sanktuarium-streszczenia-', 'Seria Sanktuarium – streszczenia ', [1, 2, 3]),
  ['saint-seiya/anime/seria-hades/elizjum-recenzja', 'Elizjum – recenzja'],
  ['saint-seiya/anime/seria-hades/elizjum-streszczenia', 'Elizjum – streszczenia'],
  ['saint-seiya/anime/seria-hades/inferno-recenzja', 'Inferno – recenzja'],
  ['saint-seiya/anime/seria-hades/inferno-streszczenia', 'Inferno – streszczenia'],
  ['saint-seiya/anime/seria-hades/sanktuarium-recenzja', 'Sanktuarium – recenzja'],
  ['saint-seiya/anime/seria-hades/sanktuarium-streszczenia', 'Sanktuarium – streszczenia'],
  // The legacy site gave chapters III and IV the title of chapter I.
  ['saint-seiya/historie-poboczne/atena-jej-wielka-milosc-3', 'Atena! Jej wielka miłość 3'],
  ['saint-seiya/historie-poboczne/atena-jej-wielka-milosc-4', 'Atena! Jej wielka miłość 4'],
  // Filed in legacy as "CHARAKTERYSTYKI POSTACI - FILM 3", the other way round than the first two films.
  ...[3, 4, 5, 6].map((film): [string, string] => [
    `filmy-kinowe/film-${film}/charakterystyki-postaci`,
    'Charakterystyki Postaci',
  ]),
  ['lost-canvas/manga/streszczenia-1', 'Streszczenia I'],

  ['mitologia/wstep-ogolny', 'Wstęp ogólny'],
  ['mitologia/grecka', 'Mitologia grecka'],
  ['mitologia/rzymska', 'Mitologia rzymska'],
  ['mitologia/skandynawska', 'Mitologia skandynawska'],
  ['mitologia/inne', 'Inne mitologie'],
  ['mitologia/inne/aztecka', 'Mitologia aztecka'],
  ['mitologia/inne/biblijne', 'Motywy biblijne'],
  ['mitologia/inne/celtycka', 'Mitologia celtycka'],
  ['mitologia/inne/egipska', 'Mitologia egipska'],
  ['mitologia/inne/slowianska', 'Mitologia słowiańska'],
  ['mitologia/inne/sumeryjska', 'Mitologia sumeryjska'],
  ['mitologia/inne/demonologia/slowianska', 'Demonologia słowiańska'],
  ['mitologia/kultura/jak-powstalo-halloween', 'Jak powstało Halloween?'],
  ['mitologia/angelologia/archaniol-michal', 'Archanioł Michał'],
  ['mitologia/grecka/bogowie-greccy-i-rzymscy', 'Bogowie greccy i rzymscy'],
  ['mitologia/grecka/miejsca/kraina-umarlych', 'Kraina Umarłych'],
  ['mitologia/grecka/kultura/eleuzyjskie', 'Misteria eleuzyjskie'],
  ['mitologia/grecka/krolestwo-piekiel/brama-piekla', 'Brama Piekła'],
  ['mitologia/grecka/postacie/atena-vs-hades', 'Atena vs. Hades'],
  ['mitologia/grecka/postacie/plejady', 'Plejady'],
  ['mitologia/grecka/postacie/echidna', 'Echidna'],
  ['mitologia/rzymska/wstep-ogolny', 'Wstęp ogólny'],
  ['mitologia/rzymska/bogowie/mars', 'Mars'],
  ['mitologia/skandynawska/wstep-ogolny', 'Wstęp ogólny'],
  ['mitologia/skandynawska/bogowie-wykaz', 'Wykaz bogów'],
  ['mitologia/skandynawska/postacie/weze', 'Węże'],
]);

export const NEWS_CATEGORY_CORRECTIONS = [
  {
    legacySlug: 'aktuzlizacje-dotyczace-zawartosci-strony',
    slug: 'aktualizacje-strony',
    name: 'Aktualizacje strony',
  },
];

interface FaqRewrite {
  legacyTitle: string;
  title: string;
  descriptionHtml: string;
}

// The legacy answers describe e-mail registration, manual activation, passwords and profile forms.
export const FAQ_ACCOUNT_CATEGORY = { legacyName: 'REJESTRACJA I LOGOWANIE', name: 'LOGOWANIE I KONTO' };

export const FAQ_ACCOUNT_QUESTIONS: FaqRewrite[] = [
  {
    legacyTitle: 'Dlaczego muszę się rejestrować, żeby mieć pełny dostęp do strony?',
    title: 'Czy muszę mieć konto, żeby korzystać ze strony?',
    descriptionHtml:
      '<p>Nie. Wszystkie artykuły, newsy, galerie, multimedia i forum możesz przeglądać bez logowania. Konto jest potrzebne dopiero wtedy, gdy chcesz coś napisać: post na forum, komentarz, wpis w shoutboksie albo oddać głos w ankiecie. No i zawsze mamy nadzieję, że zostaniesz z nami na dłużej :)</p>',
  },
  {
    legacyTitle: 'Czy rejestracja/posiadanie konta wiąże się z jakimiś kosztami?',
    title: 'Czy posiadanie konta wiąże się z jakimiś kosztami?',
    descriptionHtml:
      '<p>Nie, konto jest całkowicie darmowe. Wszelkie koszty utrzymania strony ponosi Redakcja. Ewentualne wspieranie jej jest całkowicie dobrowolne.</p>',
  },
  {
    legacyTitle: 'Dlaczego muszę czekać na aktywowanie konta? Dlaczego tak długo to trwa?',
    title: 'Jak założyć konto?',
    descriptionHtml:
      '<p>Kliknij „Zaloguj” w górnym menu, a potem „Zaloguj przez Google”. Konto powstaje samo przy pierwszym logowaniu i od razu jest aktywne – nie ma formularza rejestracji, maila aktywacyjnego ani czekania, aż Administrator Cię „przyklepie”.</p>',
  },
  {
    legacyTitle: 'Nie doszedł do mnie mail rejestracyjny. Co robić?',
    title: 'Dlaczego mogę zalogować się tylko przez Google?',
    descriptionHtml:
      '<p>Bo dzięki temu nie przechowujemy żadnych haseł, a boty mają z nami pod górkę. Nie musisz też pamiętać kolejnego loginu – wystarczy konto Google.</p>',
  },
  {
    legacyTitle: 'Dlaczego skasowano mi konto zamiast je aktywować?',
    title: 'Miałem konto na starej wersji strony. Gdzie ono jest?',
    descriptionHtml:
      '<p>Konta ze starej wersji strony nie zostały przeniesione. Twoje dawne posty, komentarze i wpisy zostały na swoim miejscu, podpisane dawnym nickiem z dopiskiem „Konto nieaktywne”. Żeby pisać dalej, zaloguj się przez Google – powstanie nowe konto, niepowiązane ze starym.</p>',
  },
  {
    legacyTitle: 'Nie mogę się zalogować.',
    title: 'Nie mogę się zalogować.',
    descriptionHtml:
      '<p>Upewnij się, że jesteś zalogowany na swoje konto Google i że przeglądarka nie blokuje ciasteczek naszej strony, a potem spróbuj jeszcze raz. Komunikat o zablokowanym koncie oznacza blokadę nałożoną przez Administrację. Jeżeli nadal masz problemy, zgłoś się w tej sprawie do Administracji.</p>',
  },
  {
    legacyTitle: 'Zapomniałem hasła.',
    title: 'Zapomniałem hasła.',
    descriptionHtml:
      '<p>Na naszej stronie nie ma haseł – logujesz się kontem Google. Jeżeli nie pamiętasz hasła do Google, odzyskasz je na stronie logowania Google.</p>',
  },
  {
    legacyTitle: 'Dlaczego muszę podawać tyle danych w swoim profilu?',
    title: 'Jakie dane o mnie przechowuje strona?',
    descriptionHtml:
      '<p>Tylko to, co przy logowaniu przekazuje Google: nazwę, adres e-mail i zdjęcie profilowe. Adres e-mail widzi wyłącznie Administracja. Nick widoczny na stronie możesz zmienić w dowolnej chwili, a żadnych dodatkowych danych w profilu podawać nie trzeba.</p>',
  },
  {
    legacyTitle: 'Do czego służą przyciski w panelu profilu?',
    title: 'Jak zmienić nick?',
    descriptionHtml:
      '<p>Po zalogowaniu rozwiń menu pod swoim nickiem i wejdź w „Twoje konto”. Nick może mieć od 3 do 30 znaków (litery, cyfry, spacje oraz . _ -) i nie może powtarzać nicku innego użytkownika. Pamiętaj, że nie wolno używać nazw uznanych za wulgarne, obraźliwe bądź dyskusyjne ideologicznie czy moralnie.</p>',
  },
  {
    legacyTitle: 'Nie mogę załadować avatara.',
    title: 'Czy mogę ustawić własny awatar albo podpis?',
    descriptionHtml:
      '<p>Nie. Przy Twoich postach i w profilu pokazujemy zdjęcie z konta Google – jeśli chcesz je zmienić, zrób to w ustawieniach Google, a na stronie pojawi się po następnym logowaniu. Podpisów pod postami nie ma.</p>',
  },
  {
    legacyTitle: 'Nie znam odpowiedzi na pytanie kontrolne. I co teraz?',
    title: 'Do czego służy weryfikacja przy pisaniu?',
    descriptionHtml:
      '<p>Przy wysyłaniu posta, komentarza albo wpisu w shoutboksie może pojawić się pole weryfikacji. To nie żaden test na wiedzę czy Twoją „prawdziwość” jako fana, tylko zabezpieczenie przed botami. Zwykle zaznacza się samo – jeżeli nie, odśwież stronę.</p>',
  },
  {
    legacyTitle: 'Chcę usunąć konto.',
    title: 'Chcę usunąć konto.',
    descriptionHtml:
      '<p>Możesz to zrobić samodzielnie w zakładce „Twoje konto”. Twoje posty i komentarze zostaną na stronie, żeby nie rozwalić przebiegu rozmów, ale będą podpisane nickiem z dopiskiem „Konto nieaktywne”. Dane logowania i adres e-mail usuwamy trwale. Tej operacji nie da się cofnąć.</p>',
  },
];

// Answers elsewhere that pointed to the profile panel of the legacy site.
export const FAQ_REWRITES: FaqRewrite[] = [
  {
    legacyTitle: 'Jakie materiały mogę wrzucić na stronę? Jak to zrobić?',
    title: 'Jakie materiały mogę wrzucić na stronę? Jak to zrobić?',
    descriptionHtml: [
      '<p>Gama materiałów, które możesz wrzucić na naszą stronę jest bardzo szeroka. Najmilej widziana jest twórczość własna, ale znalezione w internecie materiały z podanym autorem również mogą zostać przez nas opublikowane. Co publikujemy?</p>',
      '<p>- AMV, trailery, fanmixy i inne powiązane z StS filmiki,</p>',
      '<p>- plakaty, okładki, tapety, bannery, avatary itp.,</p>',
      '<p>- fan arty, komiksy,</p>',
      '<p>- fanfiki.</p>',
      '<p>Pamiętaj, że zabroniona jest publikacja materiałów +18!</p>',
      '<p>Materiały publikuje Redakcja – prześlij je bezpośrednio do niej, podając kategorię i dobry opis.</p>',
    ].join(''),
  },
  {
    legacyTitle: 'Gdzie mogę podzielić się interesującymi linkami/newsem?',
    title: 'Gdzie mogę podzielić się interesującymi linkami/newsem?',
    descriptionHtml:
      '<p>Gorące newsy i interesujące linki podsuwaj bezpośrednio Redakcji albo wrzucaj na shoutboxa.</p>',
  },
  {
    legacyTitle: 'Dlaczego mój dodany materiał został zignorowany?',
    title: 'Dlaczego mój przesłany materiał został zignorowany?',
    descriptionHtml:
      '<p>Redakcja nie zawsze od razu zagląda do skrzynki. Musisz uzbroić się w cierpliwość – albo przypomnij się Redakcji, będzie szybciej.</p>',
  },
];

interface FaqAnswerFix {
  title: string;
  replacements: [string, string][];
}

// Details that stopped being true: the old host, private messages, bans by address, the place of the newest
// comments and references to questions by a number they no longer have. The rest of each answer stays as written.
export const FAQ_ANSWER_FIXES: FaqAnswerFix[] = [
  {
    title: 'Strona nie działa. Co robić?',
    replacements: [['błędy na serwerze Netswerer,', 'błędy na serwerze,']],
  },
  {
    title: 'Dlaczego mój komentarz został zignorowany?',
    replacements: [['wyświetlane są u dołu strony,', 'wyświetlane są na stronie głównej,']],
  },
  {
    title: 'Czym są ostrzeżenia?',
    replacements: [
      [', czasem poparte stosownym PW w stosunku do zainteresowanego.', '.'],
      ['banicja na zawsze, czyli ban na IP.', 'banicja na zawsze, czyli trwała blokada konta.'],
    ],
  },
  {
    title: 'Jakich treści unikać na forum?',
    replacements: [['(strona, pytanie 24)', '(dział „Strona”, pytanie „Czy muszę tagować materiał?”)']],
  },
  {
    title: 'Komu zgłosić nękanie przez innego Użytkownika/Admina/Moderatora?',
    replacements: [['zasada z pytania nr 15', 'zasada z pytania „Jakich treści unikać na forum?”']],
  },
];

// Questions about features the new site does not have: private messages, article ratings, forum ranks,
// signatures and reply notifications, plus one question that never had an answer.
export const FAQ_RETIRED_QUESTIONS = [
  'Do czego służy opcja PW?',
  'Czy mogę zablokować możliwość otrzymywania wiadomości od pewnych użytkowników?',
  'Dlaczego jedne artykuły mogę oceniać, a inne nie?',
  'Jakie są rangi na forum?',
  'Jak mogę zdobyć rangę specjalną?',
  'Jak obsłużyć panel edycji posta?',
  'Jak wstawić podpis pod postem?',
  'Jakie są wymagania dotyczące podpisu?',
  'Czy istnieje opcja powiadomienia o odpowiedzi?',
];

const SORT_ORDER_STEP = 10;

export interface CorrectionReport {
  movedPages: number;
  rewrittenLinks: number;
  removedHubs: number;
  hiddenPages: number;
  pageTitles: number;
  unknownPagePaths: string[];
  newsCategories: number;
  faqQuestions: number;
  faqAnswerFixes: number;
  retiredFaqQuestions: number;
}

const total = (changes: number[]): number => changes.reduce((sum, changed) => sum + changed, 0);

// Every column that can hold the address of a page: markup first, then the bare addresses of map areas and menus.
const LINKING_COLUMNS: SQLiteColumn[] = [
  schema.pages.bodyHtml,
  schema.news.excerptHtml,
  schema.news.bodyHtml,
  schema.posts.bodyHtml,
  schema.comments.bodyHtml,
  schema.shouts.bodyHtml,
  schema.faqItems.descriptionHtml,
  schema.mapAreas.contentHtml,
  schema.translations.value,
  schema.settings.value,
  schema.mapAreas.url,
  schema.navigationLinks.url,
];

const MARKUP_PATTERN = /<[^>]*>|&nbsp;/g;

const hasVisibleText = (html: string): boolean => Boolean(html.replace(MARKUP_PATTERN, '').trim());

const parentPathOf = (path: string): string | null =>
  path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : null;

const pageAt = (tx: Tx, path: string) =>
  tx
    .select({
      id: schema.pages.id,
      parentId: schema.pages.parentId,
      kind: schema.pages.kind,
      status: schema.pages.status,
      bodyHtml: schema.pages.bodyHtml,
    })
    .from(schema.pages)
    .where(eq(schema.pages.path, path))
    .get();

const childrenOf = (parentId: number | null) =>
  parentId === null ? isNull(schema.pages.parentId) : eq(schema.pages.parentId, parentId);

const orderChildren = (tx: Tx, parentId: number | null, placed?: { id: number; afterId?: number }) => {
  const orderedIds = tx
    .select({ id: schema.pages.id })
    .from(schema.pages)
    .where(childrenOf(parentId))
    .orderBy(asc(schema.pages.sortOrder), asc(schema.pages.id))
    .all()
    .map((child) => child.id)
    .filter((id) => id !== placed?.id);
  if (placed) {
    const followedAt = placed.afterId === undefined ? -1 : orderedIds.indexOf(placed.afterId);
    orderedIds.splice(followedAt < 0 ? orderedIds.length : followedAt + 1, 0, placed.id);
  }
  orderedIds.forEach((id, sortOrder) => {
    tx.update(schema.pages).set({ sortOrder }).where(eq(schema.pages.id, id)).run();
  });
};

// In markup an address follows a quote, a bare one starts the value; what comes after must end the last segment,
// so "/saga-1" is not taken for the beginning of "/saga-1-2".
const linkPattern = (path: string): RegExp => new RegExp(`(?<=^|["'])/${path}(?![\\w-])`, 'g');

const rewriteLinks = (tx: Tx, from: string, to: string): number => {
  let rewrittenRows = 0;
  for (const column of LINKING_COLUMNS) {
    const name = sql.identifier(column.name);
    const rows = tx.all<{ id: number; value: string }>(
      sql`SELECT rowid AS id, ${name} AS value FROM ${column.table} WHERE ${name} LIKE ${`%/${from}%`}`,
    );
    for (const row of rows) {
      const value = row.value.replace(linkPattern(from), `/${to}`);
      if (value !== row.value) {
        tx.run(sql`UPDATE ${column.table} SET ${name} = ${value} WHERE rowid = ${row.id}`);
        rewrittenRows += 1;
      }
    }
  }
  return rewrittenRows;
};

const movePage = (tx: Tx, move: PageMove): number | null => {
  const page = pageAt(tx, move.from);
  const parentPath = parentPathOf(move.to);
  const parent = parentPath === null ? null : pageAt(tx, parentPath);
  if (!page || parent === undefined || pageAt(tx, move.to)) {
    return null;
  }
  const parentId = parent?.id ?? null;
  tx.update(schema.pages)
    .set({ parentId, slug: move.to.slice(move.to.lastIndexOf('/') + 1), path: move.to })
    .where(eq(schema.pages.id, page.id))
    .run();
  tx.update(schema.pages)
    .set({ path: sql`${move.to} || substr(${schema.pages.path}, ${move.from.length + 1})` })
    .where(like(schema.pages.path, `${move.from}/%`))
    .run();
  if (parentId !== page.parentId || move.after) {
    orderChildren(tx, parentId, { id: page.id, afterId: move.after ? pageAt(tx, move.after)?.id : undefined });
    orderChildren(tx, page.parentId);
  }
  return rewriteLinks(tx, move.from, move.to);
};

const removeEmptiedHubs = (tx: Tx): number =>
  EMPTIED_HUB_PATHS.filter((path) => {
    const hub = pageAt(tx, path);
    const firstChild = hub && tx.select({ id: schema.pages.id }).from(schema.pages).where(childrenOf(hub.id)).get();
    if (!hub || hub.kind !== 'hub' || hub.bodyHtml.trim() || firstChild) {
      return false;
    }
    tx.delete(schema.comments)
      .where(and(eq(schema.comments.targetKind, 'page'), eq(schema.comments.targetId, hub.id)))
      .run();
    tx.delete(schema.translations)
      .where(and(eq(schema.translations.entity, 'pages'), eq(schema.translations.entityId, hub.id)))
      .run();
    tx.delete(schema.pages).where(eq(schema.pages.id, hub.id)).run();
    orderChildren(tx, hub.parentId);
    return true;
  }).length;

const hideBannerOnlyPages = (tx: Tx): number =>
  BANNER_ONLY_PAGE_PATHS.filter((path) => {
    const page = pageAt(tx, path);
    if (!page || page.status !== 'published' || hasVisibleText(page.bodyHtml)) {
      return false;
    }
    tx.update(schema.pages).set({ status: 'draft' }).where(eq(schema.pages.id, page.id)).run();
    return true;
  }).length;

const correctPageTitles = (tx: Tx): string[] =>
  Object.entries(PAGE_TITLE_CORRECTIONS)
    .filter(([path, title]) => !tx.update(schema.pages).set({ title }).where(eq(schema.pages.path, path)).run().changes)
    .map(([path]) => path);

const correctNewsCategories = (tx: Tx): number =>
  total(
    NEWS_CATEGORY_CORRECTIONS.map(
      ({ legacySlug, slug, name }) =>
        tx
          .update(schema.newsCategories)
          .set({ slug, name })
          .where(inArray(schema.newsCategories.slug, [legacySlug, slug]))
          .run().changes,
    ),
  );

const rewriteFaqQuestion = (tx: Tx, rewrite: FaqRewrite, sortOrder?: number): number =>
  tx
    .update(schema.faqItems)
    .set({
      title: rewrite.title,
      descriptionHtml: rewrite.descriptionHtml,
      ...(sortOrder === undefined ? {} : { sortOrder }),
    })
    .where(inArray(schema.faqItems.title, [rewrite.legacyTitle, rewrite.title]))
    .run().changes;

const correctFaq = (tx: Tx): number => {
  tx.update(schema.faqCategories)
    .set({ name: FAQ_ACCOUNT_CATEGORY.name })
    .where(eq(schema.faqCategories.name, FAQ_ACCOUNT_CATEGORY.legacyName))
    .run();
  const accountQuestions = FAQ_ACCOUNT_QUESTIONS.map((rewrite, index) =>
    rewriteFaqQuestion(tx, rewrite, index * SORT_ORDER_STEP),
  );
  const otherQuestions = FAQ_REWRITES.map((rewrite) => rewriteFaqQuestion(tx, rewrite));
  return total([...accountQuestions, ...otherQuestions]);
};

const fixFaqAnswers = (tx: Tx): number =>
  FAQ_ANSWER_FIXES.filter(({ title, replacements }) => {
    const question = tx
      .select({ id: schema.faqItems.id, descriptionHtml: schema.faqItems.descriptionHtml })
      .from(schema.faqItems)
      .where(eq(schema.faqItems.title, title))
      .get();
    const fixedHtml = replacements.reduce(
      (html, [outdated, current]) => html.replaceAll(outdated, current),
      question?.descriptionHtml ?? '',
    );
    if (!question || fixedHtml === question.descriptionHtml) {
      return false;
    }
    tx.update(schema.faqItems).set({ descriptionHtml: fixedHtml }).where(eq(schema.faqItems.id, question.id)).run();
    return true;
  }).length;

const retireFaqQuestions = (tx: Tx): number => {
  const retired = tx
    .delete(schema.faqItems)
    .where(inArray(schema.faqItems.title, FAQ_RETIRED_QUESTIONS))
    .returning({ id: schema.faqItems.id })
    .all();
  if (retired.length) {
    tx.delete(schema.translations)
      .where(
        and(
          eq(schema.translations.entity, 'faq_items'),
          inArray(
            schema.translations.entityId,
            retired.map((item) => item.id),
          ),
        ),
      )
      .run();
  }
  return retired.length;
};

export const applyContentCorrections = (db: Db): CorrectionReport =>
  db.transaction((tx) => {
    const rewrittenLinksOfMoves = PAGE_MOVES.map((move) => movePage(tx, move)).filter((links) => links !== null);
    const removedHubs = removeEmptiedHubs(tx);
    const hiddenPages = hideBannerOnlyPages(tx);
    const unknownPagePaths = correctPageTitles(tx);
    return {
      movedPages: rewrittenLinksOfMoves.length,
      rewrittenLinks: total(rewrittenLinksOfMoves),
      removedHubs,
      hiddenPages,
      pageTitles: Object.keys(PAGE_TITLE_CORRECTIONS).length - unknownPagePaths.length,
      unknownPagePaths,
      newsCategories: correctNewsCategories(tx),
      faqQuestions: correctFaq(tx),
      faqAnswerFixes: fixFaqAnswers(tx),
      retiredFaqQuestions: retireFaqQuestions(tx),
    };
  });
