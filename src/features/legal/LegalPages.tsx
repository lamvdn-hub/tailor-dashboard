// Legal texts for a Swedish/EU deployment. These are a sound starting point
// written against GDPR, the Swedish Data Protection Act (2018:218) and the
// Electronic Communications Act (2022:482); have them reviewed before launch.

import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { PublicFrame } from '@/app/PublicFrame';
import { PageSpinner } from '@/ui/Spinner';
import { APP_NAME, OPERATOR_EMAIL, OPERATOR_NAME } from '@/lib/config';
import { fetchPublicShop } from '@/features/public/api';
import type { PublicShop } from '@/lib/types';

const UPDATED = '2026-11-17';
const IMY = 'Integritetsskyddsmyndigheten (IMY), www.imy.se';

function Doc({ title, children }: { title: string; children: ReactNode }) {
  const { t, fmt } = useI18n();
  return (
    <PublicFrame title={title} narrow={false}>
      <article className="mt-4 flex max-w-2xl flex-col gap-6 text-[0.9375rem] leading-relaxed text-ink-2 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-3">{t.legal.lastUpdated(fmt.date(UPDATED))}</p>
        </header>
        {children}
      </article>
    </PublicFrame>
  );
}

const operator = () => OPERATOR_NAME || APP_NAME;
const operatorEmail = () => OPERATOR_EMAIL || '—';

// ---------------------------------------------------------------------------
// Privacy policy for people who use the app (shop owners and staff)
// ---------------------------------------------------------------------------

export function AppPrivacyPage() {
  const { t, locale } = useI18n();
  return <Doc title={t.legal.appPrivacyTitle}>{locale === 'sv' ? <AppPrivacySv /> : <AppPrivacyEn />}</Doc>;
}

function AppPrivacySv() {
  return (
    <>
      <section>
        <h2>Vem ansvarar?</h2>
        <p>
          {operator()} är personuppgiftsansvarig för uppgifter om dig som användare av {APP_NAME}. Kontakt: {operatorEmail()}.
        </p>
        <p className="mt-2">
          Uppgifter om butikernas kunder (namn, mått, ordrar, foton) behandlas för butikens räkning. Där är butiken
          personuppgiftsansvarig och {operator()} personuppgiftsbiträde, se <a className="text-accent underline" href="/terms#dpa">biträdesavtalet</a>.
        </p>
      </section>
      <section>
        <h2>Vilka uppgifter och varför</h2>
        <ul>
          <li><strong>Konto:</strong> e-post, lösenord (lagras endast som hash), namn och språkval – för att du ska kunna logga in och använda tjänsten (avtal, art. 6.1 b).</li>
          <li><strong>Medlemskap:</strong> vilka butiker du tillhör och din roll – för behörighetsstyrning (avtal).</li>
          <li><strong>Aktivitetslogg:</strong> vem som skapade, ändrade eller raderade poster och när, utan själva innehållet – för säkerhet och spårbarhet (berättigat intresse, art. 6.1 f).</li>
          <li><strong>Tekniska loggar</strong> hos vår driftleverantör, t.ex. IP-adress vid inloggning – för säkerhet och felsökning (berättigat intresse).</li>
        </ul>
      </section>
      <section>
        <h2>Kakor och lagring i webbläsaren</h2>
        <p>
          Vi använder inga spårningskakor och ingen analys eller reklam. Webbläsarens lagring används bara för det som är
          nödvändigt för tjänsten: din inloggning, valt språk, tema, vald butik och tillfälliga utkast. Enligt lagen
          (2022:482) om elektronisk kommunikation krävs inget samtycke för sådan nödvändig lagring. Du kan rensa den under
          Mitt konto.
        </p>
      </section>
      <section>
        <h2>Var lagras uppgifterna?</h2>
        <p>
          Databas, inloggning och filer driftas av Supabase i ett datacenter inom EU/EES. Teckensnitt och all kod levereras
          från vår egen server; inga uppgifter skickas till tredje part för att visa sidorna. Om en underleverantör ändå
          skulle behandla uppgifter utanför EU/EES sker det med stöd av EU-kommissionens standardavtalsklausuler eller
          ett beslut om adekvat skyddsnivå.
        </p>
      </section>
      <section>
        <h2>Hur länge</h2>
        <ul>
          <li>Kontouppgifter: tills du raderar kontot.</li>
          <li>Aktivitetslogg: 12 månader.</li>
          <li>Obesvarade inbjudningar: en månad efter att de gått ut.</li>
        </ul>
      </section>
      <section>
        <h2>Dina rättigheter</h2>
        <p>
          Du har rätt till tillgång, rättelse, radering, begränsning, dataportabilitet och att invända mot behandling som
          grundar sig på berättigat intresse. Under Mitt konto kan du själv ladda ner dina uppgifter och radera kontot.
          Kontakta oss för övriga frågor. Du kan också klaga hos {IMY}.
        </p>
      </section>
      <section>
        <h2>Säkerhet</h2>
        <p>
          All trafik krypteras (TLS). Varje butiks data är åtskild på databasnivå med radbaserad behörighet, foton lagras
          privat och visas via tidsbegränsade länkar, och platsdata tas bort ur foton innan uppladdning.
        </p>
      </section>
    </>
  );
}

function AppPrivacyEn() {
  return (
    <>
      <section>
        <h2>Who is responsible?</h2>
        <p>
          {operator()} is the controller of data about you as a user of {APP_NAME}. Contact: {operatorEmail()}.
        </p>
        <p className="mt-2">
          Data about the shops’ customers (names, measurements, orders, photos) is processed on behalf of each shop. There,
          the shop is the controller and {operator()} the processor; see the <a className="text-accent underline" href="/terms#dpa">processing agreement</a>.
        </p>
      </section>
      <section>
        <h2>What data and why</h2>
        <ul>
          <li><strong>Account:</strong> email, password (stored only as a hash), name and language – so you can sign in and use the service (contract, Art. 6(1)(b)).</li>
          <li><strong>Memberships:</strong> which shops you belong to and your role – for access control (contract).</li>
          <li><strong>Activity log:</strong> who created, changed or deleted records and when, without the content itself – for security and accountability (legitimate interest, Art. 6(1)(f)).</li>
          <li><strong>Technical logs</strong> at our hosting provider, e.g. IP address at sign-in – for security and troubleshooting (legitimate interest).</li>
        </ul>
      </section>
      <section>
        <h2>Cookies and browser storage</h2>
        <p>
          We use no tracking cookies, no analytics and no advertising. Browser storage is used only for what the service
          strictly needs: your sign-in, chosen language, theme, selected shop and temporary drafts. Under the Swedish
          Electronic Communications Act (2022:482) such strictly necessary storage does not require consent. You can clear
          it under My account.
        </p>
      </section>
      <section>
        <h2>Where is data stored?</h2>
        <p>
          Database, authentication and files are hosted by Supabase in a data centre within the EU/EEA. Fonts and all code
          are served from our own server; no data is sent to third parties to display the pages. Should a sub-processor
          nevertheless process data outside the EU/EEA, this relies on the European Commission’s standard contractual
          clauses or an adequacy decision.
        </p>
      </section>
      <section>
        <h2>How long</h2>
        <ul>
          <li>Account data: until you delete your account.</li>
          <li>Activity log: 12 months.</li>
          <li>Unaccepted invitations: one month after they expire.</li>
        </ul>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          You have the right to access, rectification, erasure, restriction, data portability and to object to processing
          based on legitimate interest. Under My account you can download your data and delete your account yourself.
          Contact us for anything else. You may also lodge a complaint with {IMY}.
        </p>
      </section>
      <section>
        <h2>Security</h2>
        <p>
          All traffic is encrypted (TLS). Each shop’s data is separated at database level with row-level access control,
          photos are stored privately and shown through time-limited links, and location data is removed from photos
          before upload.
        </p>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Terms of use incl. data processing agreement (GDPR Art. 28)
// ---------------------------------------------------------------------------

export function TermsPage() {
  const { t, locale } = useI18n();
  return <Doc title={t.legal.termsTitle}>{locale === 'sv' ? <TermsSv /> : <TermsEn />}</Doc>;
}

function TermsSv() {
  return (
    <>
      <section>
        <h2>1. Tjänsten</h2>
        <p>
          {APP_NAME} är ett verktyg för att hantera kunder, mått, ordrar, tyger och uppgifter i en skrädderiverksamhet.
          Tjänsten tillhandahålls av {operator()}. Den som skapar en butik (”Kunden”) ansvarar för butikens användare och
          för att uppgifter i butiken behandlas lagligt.
        </p>
      </section>
      <section>
        <h2>2. Konton och behörighet</h2>
        <p>
          Konton är personliga. Ägare kan bjuda in personal och tilldela roller. Kunden ansvarar för att ta bort
          användare som inte längre ska ha åtkomst.
        </p>
      </section>
      <section>
        <h2>3. Kundens data</h2>
        <p>
          Kunden äger all data i sin butik och kan när som helst exportera den eller radera butiken. Vid radering tas all
          data och alla foton bort permanent.
        </p>
      </section>
      <section id="dpa">
        <h2>4. Personuppgiftsbiträdesavtal</h2>
        <p>Detta avsnitt utgör personuppgiftsbiträdesavtal enligt artikel 28 i dataskyddsförordningen.</p>
        <ul>
          <li><strong>Roller:</strong> Kunden är personuppgiftsansvarig för uppgifter om sina kunder, och {operator()} är personuppgiftsbiträde.</li>
          <li><strong>Ändamål och instruktion:</strong> Biträdet behandlar uppgifterna endast för att tillhandahålla tjänsten och enligt Kundens dokumenterade instruktioner, som utgörs av dessa villkor och Kundens användning av tjänsten.</li>
          <li><strong>Kategorier:</strong> Registrerade är Kundens kunder och förfrågare. Uppgifterna är kontaktuppgifter, kroppsmått, orderuppgifter, priser, anteckningar och foton på plagg. Tjänsten är inte avsedd för känsliga personuppgifter enligt artikel 9.</li>
          <li><strong>Sekretess:</strong> Personer hos biträdet som har åtkomst omfattas av tystnadsplikt.</li>
          <li><strong>Säkerhet (art. 32):</strong> kryptering under överföring, åtskillnad mellan butiker på databasnivå, privat fillagring med tidsbegränsade länkar, behörighetsstyrning, aktivitetslogg utan innehåll och automatisk gallring.</li>
          <li><strong>Underbiträden:</strong> Supabase (databas, inloggning och fillagring, EU/EES) samt leverantören av webbhotell för de statiska sidorna. Kunden informeras i förväg om nya underbiträden och kan invända.</li>
          <li><strong>Bistånd:</strong> Tjänsten har inbyggda verktyg för registerutdrag, export och radering per kund. Biträdet bistår i övrigt Kunden vid begäranden från registrerade och vid konsekvensbedömningar.</li>
          <li><strong>Incidenter:</strong> Biträdet underrättar Kunden utan onödigt dröjsmål efter att ha fått vetskap om en personuppgiftsincident.</li>
          <li><strong>Upphörande:</strong> När Kunden raderar butiken raderas alla personuppgifter. Säkerhetskopior skrivs över inom leverantörens ordinarie cykel.</li>
          <li><strong>Granskning:</strong> Biträdet tillhandahåller den information som behövs för att visa att skyldigheterna fullgörs.</li>
        </ul>
      </section>
      <section>
        <h2>5. Ansvar</h2>
        <p>
          Tjänsten tillhandahålls i befintligt skick. {operator()} ansvarar inte för indirekta skador. Ansvarsbegränsningen
          gäller inte vid uppsåt eller grov vårdslöshet.
        </p>
      </section>
      <section>
        <h2>6. Tillämplig lag</h2>
        <p>Svensk lag tillämpas. Tvister avgörs av svensk allmän domstol.</p>
      </section>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <section>
        <h2>1. The service</h2>
        <p>
          {APP_NAME} is a tool for managing clients, measurements, orders, fabrics and tasks in a tailoring business. It is
          provided by {operator()}. Whoever creates a shop (“the Customer”) is responsible for the shop’s users and for the
          lawful processing of data in the shop.
        </p>
      </section>
      <section>
        <h2>2. Accounts and access</h2>
        <p>Accounts are personal. Owners can invite staff and assign roles. The Customer is responsible for removing users who should no longer have access.</p>
      </section>
      <section>
        <h2>3. Customer data</h2>
        <p>The Customer owns all data in its shop and can export it or delete the shop at any time. Deleting a shop permanently removes all data and photos.</p>
      </section>
      <section id="dpa">
        <h2>4. Data processing agreement</h2>
        <p>This section constitutes a data processing agreement under Article 28 GDPR.</p>
        <ul>
          <li><strong>Roles:</strong> The Customer is the controller of data about its clients, and {operator()} is the processor.</li>
          <li><strong>Purpose and instructions:</strong> The processor processes the data only to provide the service and on the Customer’s documented instructions, which are these terms and the Customer’s use of the service.</li>
          <li><strong>Categories:</strong> Data subjects are the Customer’s clients and enquirers. Data comprises contact details, body measurements, order details, prices, notes and photos of garments. The service is not intended for special categories of data under Article 9.</li>
          <li><strong>Confidentiality:</strong> Persons at the processor with access are bound by confidentiality.</li>
          <li><strong>Security (Art. 32):</strong> encryption in transit, database-level separation between shops, private file storage with time-limited links, access control, a content-free activity log and automatic deletion.</li>
          <li><strong>Sub-processors:</strong> Supabase (database, authentication and file storage, EU/EEA) and the web host for the static pages. The Customer is informed in advance of new sub-processors and may object.</li>
          <li><strong>Assistance:</strong> The service has built-in tools for access, export and erasure per client. The processor otherwise assists the Customer with data subject requests and impact assessments.</li>
          <li><strong>Incidents:</strong> The processor notifies the Customer without undue delay after becoming aware of a personal data breach.</li>
          <li><strong>Termination:</strong> When the Customer deletes the shop, all personal data is deleted. Backups are overwritten within the provider’s regular cycle.</li>
          <li><strong>Audits:</strong> The processor makes available the information necessary to demonstrate compliance.</li>
        </ul>
      </section>
      <section>
        <h2>5. Liability</h2>
        <p>The service is provided as is. {operator()} is not liable for indirect damage. This limitation does not apply in case of intent or gross negligence.</p>
      </section>
      <section>
        <h2>6. Governing law</h2>
        <p>Swedish law applies. Disputes are settled by Swedish general courts.</p>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Per-shop privacy notice for the shop's own customers (GDPR Art. 13)
// ---------------------------------------------------------------------------

export function ShopPrivacyNoticePage() {
  const { slug = '' } = useParams();
  const { t, locale } = useI18n();
  const shop = useQuery({ queryKey: ['public-shop', slug], queryFn: () => fetchPublicShop(slug) });
  if (shop.isPending) return <PageSpinner label={t.common.loading} />;
  if (!shop.data)
    return (
      <PublicFrame title={t.shopPage.notFound}>
        <h1 className="mt-16 text-center text-xl font-semibold">{t.shopPage.notFound}</h1>
      </PublicFrame>
    );
  return (
    <Doc title={t.legal.clientNoticeTitle(shop.data.name)}>
      {locale === 'sv' ? <ShopNoticeSv shop={shop.data} /> : <ShopNoticeEn shop={shop.data} />}
    </Doc>
  );
}

function controllerLine(s: PublicShop) {
  return [s.legal_name ?? s.name, s.org_number, s.address].filter(Boolean).join(', ');
}

function ShopNoticeSv({ shop: s }: { shop: PublicShop }) {
  const contact = s.privacy_contact_email ?? s.email ?? s.phone ?? '—';
  return (
    <>
      <section>
        <h2>Personuppgiftsansvarig</h2>
        <p>{controllerLine(s)}. Kontakt i dataskyddsfrågor: {contact}.</p>
      </section>
      <section>
        <h2>Vad vi sparar och varför</h2>
        <ul>
          <li><strong>Namn och kontaktuppgifter</strong> – för att genomföra din beställning och nå dig om den (avtal, art. 6.1 b).</li>
          <li><strong>Kroppsmått, modellval och anteckningar</strong> – för att sy ditt plagg (avtal) och för att kunna använda måtten vid framtida beställningar (berättigat intresse, art. 6.1 f).</li>
          <li><strong>Foton på plagget</strong>, ibland vid provning – för att dokumentera arbetet (avtal).</li>
          <li><strong>Pris och handpenning</strong> – för att hålla ordning på betalningen (avtal). Kvitton och bokföring hanteras separat enligt bokföringslagen.</li>
          {s.inquiries_enabled && <li><strong>Meddelanden via kontaktformuläret</strong> – för att besvara din förfrågan (berättigat intresse).</li>}
        </ul>
      </section>
      <section>
        <h2>Hur länge</h2>
        <p>
          Uppgifterna raderas automatiskt när det gått {s.client_retention_months} månader utan aktivitet och du inte har
          någon pågående beställning. Meddelanden via kontaktformuläret raderas 12 månader efter att de hanterats och
          senast efter 24 månader.
        </p>
      </section>
      <section>
        <h2>Mottagare</h2>
        <p>
          Uppgifterna lagras i ett system som drivs av ett personuppgiftsbiträde inom EU/EES. Vi säljer inte och lämnar inte
          ut dina uppgifter för marknadsföring. Vi använder inga spårningskakor.
        </p>
      </section>
      <section>
        <h2>Dina rättigheter</h2>
        <p>
          Du kan begära ett utdrag av dina uppgifter, få dem rättade eller raderade, begränsa behandlingen, få ut dem i ett
          maskinläsbart format och invända mot att vi sparar dina mått för framtida beställningar. Kontakta oss på {contact}.
          Du har också rätt att klaga hos {IMY}.
        </p>
      </section>
    </>
  );
}

function ShopNoticeEn({ shop: s }: { shop: PublicShop }) {
  const contact = s.privacy_contact_email ?? s.email ?? s.phone ?? '—';
  return (
    <>
      <section>
        <h2>Controller</h2>
        <p>{controllerLine(s)}. Data protection contact: {contact}.</p>
      </section>
      <section>
        <h2>What we keep and why</h2>
        <ul>
          <li><strong>Name and contact details</strong> – to carry out your order and reach you about it (contract, Art. 6(1)(b)).</li>
          <li><strong>Body measurements, style choices and notes</strong> – to make your garment (contract) and to reuse your measurements for future orders (legitimate interest, Art. 6(1)(f)).</li>
          <li><strong>Photos of the garment</strong>, sometimes during a fitting – to document the work (contract).</li>
          <li><strong>Price and deposit</strong> – to keep track of payment (contract). Receipts and bookkeeping are handled separately under the Swedish Bookkeeping Act.</li>
          {s.inquiries_enabled && <li><strong>Messages via the contact form</strong> – to answer your enquiry (legitimate interest).</li>}
        </ul>
      </section>
      <section>
        <h2>How long</h2>
        <p>
          Your data is deleted automatically after {s.client_retention_months} months without activity, provided you have
          no ongoing order. Contact form messages are deleted 12 months after they have been handled and at the latest
          after 24 months.
        </p>
      </section>
      <section>
        <h2>Recipients</h2>
        <p>
          Data is stored in a system run by a processor within the EU/EEA. We do not sell or disclose your data for
          marketing. We use no tracking cookies.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          You can request a copy of your data, have it corrected or erased, restrict processing, receive it in a
          machine-readable format and object to us keeping your measurements for future orders. Contact us at {contact}.
          You also have the right to lodge a complaint with {IMY}.
        </p>
      </section>
    </>
  );
}
