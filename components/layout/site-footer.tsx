import Link from "next/link";

const links = [
  { href: "/methodology", label: "Methodology" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/request", label: "Request a test" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)]">
      <div className="site-wrap flex flex-col gap-4 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <p>We test real work so you don’t have to guess.</p>
        <div className="flex flex-wrap gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[var(--ink)]">
              {link.label}
            </Link>
          ))}
          <a href="https://github.com/heyitschien/can-ai-yet" className="hover:text-[var(--ink)]">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
