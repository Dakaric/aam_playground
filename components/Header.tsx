export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-sky-100 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <a href="#start" className="text-xl font-semibold text-sky-700 dark:text-sky-300">
          Stadt Harmonia
        </a>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <a href="#start" className="rounded-full px-3 py-1 transition hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-zinc-800">
            Start
          </a>
          <a href="#stadt" className="rounded-full px-3 py-1 transition hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-zinc-800">
            Die Stadt
          </a>
          <a href="#ueber-uns" className="rounded-full px-3 py-1 transition hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-zinc-800">
            Über uns
          </a>
          <a href="#erleben" className="rounded-full px-3 py-1 transition hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-zinc-800">
            Erleben
          </a>
          <a href="#kontakt" className="rounded-full px-3 py-1 transition hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-zinc-800">
            Kontakt
          </a>
        </nav>
      </div>
    </header>
  );
}


