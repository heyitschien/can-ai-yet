import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const links = [
  { href: "/capabilities", label: "Capabilities" },
  { href: "/methodology", label: "Methodology" },
  { href: "/updates", label: "Updates" },
  { href: "/request", label: "Request a test" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="site-wrap flex min-h-16 items-center justify-between gap-4 py-3">
        <Link href="/" className="shrink-0 text-[13px] font-semibold tracking-[0.16em]">
          CAN AI YET
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-5">
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-[var(--muted)] sm:gap-x-5">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[var(--ink)]">
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
