import Link from "next/link";

const links = [
  { href: "/capabilities", label: "Capabilities" },
  { href: "/methodology", label: "Methodology" },
  { href: "/updates", label: "Updates" },
  { href: "/request", label: "Request a test" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)]">
      <div className="site-wrap flex h-16 items-center justify-between gap-6">
        <Link href="/" className="text-[13px] font-semibold tracking-[0.16em]">
          CAN AI YET
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[var(--ink)]">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
