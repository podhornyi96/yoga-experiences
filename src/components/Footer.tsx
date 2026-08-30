import Link from "next/link";
import { siteConfig, whatsappLink } from "@/config/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-sand-dark/60 bg-forest text-cream/90">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl text-cream">{siteConfig.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream/70">
            {siteConfig.tagline}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cream/60">
            Explore
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/experiences/" className="hover:text-clay">
                Experiences
              </Link>
            </li>
            <li>
              <Link href="/private/" className="hover:text-clay">
                Private
              </Link>
            </li>
            <li>
              <Link href="/corporate/" className="hover:text-clay">
                Corporate
              </Link>
            </li>
            <li>
              <Link href="/about/" className="hover:text-clay">
                About
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cream/60">
            Get in touch
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href={whatsappLink(
                  `Hi ${siteConfig.teacher.name}! I'd like to know more about your yoga experiences.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-clay"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-clay">
                {siteConfig.contact.email}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-clay"
              >
                {siteConfig.contact.instagramHandle}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {year} {siteConfig.name}. Yoga in {siteConfig.geo.city},{" "}
            {siteConfig.geo.country}.
          </p>
          <p>Made with calm in Lisbon.</p>
        </div>
      </div>
    </footer>
  );
}
