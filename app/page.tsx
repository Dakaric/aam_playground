const highlights = [
  {
    title: "Grüne Oasen",
    description:
      "Über 40 Parks, Gartenanlagen und der Fluss Harmonica laden zum Entspannen und Flanieren ein.",
  },
  {
    title: "Kultur erleben",
    description:
      "Vom Theater Harmonia bis zu modernen Kunstgalerien – jeden Monat warten neue Highlights.",
  },
  {
    title: "Lebendige Stadtteile",
    description:
      "Bunte Wochenmärkte, lokale Manufakturen und ein starkes Vereinsleben prägen das Stadtbild.",
  },
];

const events = [
  {
    title: "Sommerlicht Festival",
    date: "21. Juni",
    description:
      "Open-Air-Konzerte am Flussufer, Lichtinstallationen und Kulinarik aus der Region.",
  },
  {
    title: "Tag der offenen Werkstätten",
    date: "5. Juli",
    description:
      "Lokale Kreative geben Einblick in ihre Ateliers und bieten Workshops für Groß und Klein.",
  },
  {
    title: "Harmonia Marathon",
    date: "18. August",
    description:
      "Strecken entlang der historischen Altstadt mit Begleitprogramm für die ganze Familie.",
  },
];

export default function Home() {
  return (
    <div className="space-y-24">
      <section
        id="start"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-sky-400 to-sky-600 px-8 py-16 text-white shadow-lg"
      >
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-sm font-medium">
            Willkommen in Harmonia
          </span>
          <h1 className="text-4xl font-semibold md:text-5xl">Eine Stadt voller Klang, Licht und Gemeinschaft</h1>
          <p className="text-lg text-sky-50">
            Harmonia verbindet historische Altstadt, nachhaltige Mobilität und pulsierendes Kulturleben.
            Entdecken Sie moderne Quartiere, grüne Freiräume und Menschen, die ihre Stadt lieben.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#stadt"
              className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Die Stadt entdecken
            </a>
            <a
              href="#kontakt"
              className="rounded-full border border-white/70 px-6 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              Kontakt aufnehmen
            </a>
          </div>
        </div>
      </section>

      <section id="stadt" className="space-y-10">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-3xl font-semibold text-sky-800 dark:text-sky-200">
            Die Stadt Harmonia auf einen Blick
          </h2>
          <p className="text-lg text-zinc-700 dark:text-zinc-300">
            Harmonia liegt am Zusammenfluss von Harmonica und Aurinbach. Innovative Stadtentwicklung,
            klimaneutrale Mobilitätsangebote und eine vielfältige Kulturszene machen Harmonia zu einem
            lebenswerten Zuhause für über 250.000 Menschen.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.title}
              className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              <h3 className="text-xl font-semibold text-sky-700 dark:text-sky-300">
                {highlight.title}
              </h3>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="ueber-uns"
        className="grid gap-10 rounded-3xl border border-sky-100 bg-white/90 p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 md:grid-cols-[1.2fr,0.8fr]"
      >
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-sky-800 dark:text-sky-200">
            Über uns
          </h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            Die Stadtverwaltung Harmonia versteht sich als Partnerin der Bürgerinnen und Bürger. Wir setzen uns
            für eine transparente, digitale und bürgernahe Verwaltung ein. Nachhaltigkeit, soziale Gerechtigkeit und
            Bildung stehen im Mittelpunkt unserer Arbeit.
          </p>
          <p className="text-zinc-700 dark:text-zinc-300">
            Gemeinsam mit Unternehmen, Initiativen und Hochschulen gestalten wir Zukunftsprojekte: vom Ausbau des
            Radwegenetzes über smarte Energieversorgung bis hin zu kulturellen Co-Creation-Spaces.
          </p>
          <div className="rounded-2xl bg-sky-50 p-5 text-sm text-sky-900 shadow-inner dark:bg-zinc-800/60 dark:text-sky-200">
            "Unser Ziel ist es, Harmonia lebenswerter, grüner und vernetzter zu machen – mit starken Allianzen und
            einer Verwaltung, die zuhört." – Lea Sommer, Oberbürgermeisterin
          </div>
        </div>
        <div className="space-y-4 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-500 p-6 text-white shadow-lg">
          <h3 className="text-xl font-semibold">Zahlen & Fakten</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <strong className="block text-lg">253.000</strong>
              Einwohnerinnen und Einwohner
            </li>
            <li>
              <strong className="block text-lg">48 %</strong>
              Fläche aus Grün- und Wasserzonen
            </li>
            <li>
              <strong className="block text-lg">32</strong>
              Stadtteil-Initiativen mit städtischer Förderung
            </li>
            <li>
              <strong className="block text-lg">100 %</strong>
              Ökostromversorgung in öffentlichen Gebäuden
            </li>
          </ul>
        </div>
      </section>

      <section id="erleben" className="space-y-10">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-3xl font-semibold text-sky-800 dark:text-sky-200">
            Veranstaltungen & Highlights
          </h2>
          <p className="text-lg text-zinc-700 dark:text-zinc-300">
            Das ganze Jahr über finden in Harmonia Festivals, Märkte und Sportevents statt. Unsere Eventhighlights
            sind klimafreundlich konzipiert und bringen Menschen aus allen Stadtteilen zusammen.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.title}
              className="flex flex-col rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
                {event.date}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {event.title}
              </h3>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                {event.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="kontakt"
        className="grid gap-8 rounded-3xl border border-sky-100 bg-white/90 p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 md:grid-cols-2"
      >
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-sky-800 dark:text-sky-200">
            Kontakt
          </h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            Sie haben Fragen, Ideen oder möchten einen Termin vereinbaren? Melden Sie sich bei unserem Bürgerservice
            – wir freuen uns auf Ihre Nachricht.
          </p>
          <div className="rounded-2xl bg-sky-50 p-6 text-sm text-sky-900 shadow-inner dark:bg-zinc-800/60 dark:text-sky-200">
            <p className="font-semibold">Bürgerservice Harmonia</p>
            <p>Rathausplatz 1 · 12345 Harmonia</p>
            <p>Telefon: <a className="hover:underline" href="tel:+491234567890">+49 123 456 789 0</a></p>
            <p>E-Mail: <a className="hover:underline" href="mailto:buergerservice@harmonia.de">buergerservice@harmonia.de</a></p>
          </div>
        </div>
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ihr Name"
              className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@harmonia.de"
              className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nachricht
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Wie können wir helfen?"
              className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            Nachricht senden
          </button>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Daten gemäß unserer Datenschutzrichtlinie zu.
          </p>
        </form>
      </section>
    </div>
  );
}
