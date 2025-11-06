export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-gradient-to-r from-sky-50 via-white to-sky-100 py-10 dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 text-sm text-zinc-700 dark:text-zinc-300 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-sky-800 dark:text-sky-300">
            Stadt Harmonia
          </h3>
          <p className="mt-2 max-w-xs">
            Rathausplatz 1
            <br />
            12345 Harmonia
            <br />
            Telefon: <a className="hover:underline" href="tel:+491234567890">+49 123 456 789 0</a>
            <br />
            E-Mail: <a className="hover:underline" href="mailto:stadt@harmonia.de">stadt@harmonia.de</a>
          </p>
        </div>
        <div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Kontakt & Öffnungszeiten
          </h4>
          <p className="mt-2 max-w-sm">
            Montag – Freitag: 8:00 – 18:00 Uhr
            <br />
            Samstag: 10:00 – 14:00 Uhr
            <br />
            Sonn- & Feiertage: geschlossen
          </p>
        </div>
        <div className="max-w-sm">
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Impressum
          </h4>
          <p className="mt-2">
            Stadt Harmonia wird vertreten durch die Oberbürgermeisterin Lea Sommer.
            Zuständige Aufsichtsbehörde: Regierungspräsidium Süd.
            Umsatzsteuer-ID: DE123456789.
          </p>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Stadt Harmonia. Alle Rechte vorbehalten.
      </div>
    </footer>
  );
}


