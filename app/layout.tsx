import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Fotbalový Outlet CZ",
  description: "Kopačky, běžecké boty a tenisky – nové i použité.",
};

function getEnv(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ig = getEnv("SHOP_IG", "fotbalovy_outlet_cz");
  const fb = getEnv(
    "SHOP_FB",
    "https://www.facebook.com/profile.php?id=61581311155200"
  );

  return (
    <html lang="cs">
      <body>
        <header className="siteHeader">
          <div className="container siteHeaderInner">
            <Link href="/" className="siteLogoWrap">
              <img src="/logo.png" alt="Fotbalový Outlet CZ" className="siteLogoImg" />
              <div className="siteLogoText">
                <div className="siteLogoTitle">Fotbalový Outlet CZ</div>
                <div className="siteLogoSub">nové i použité kopačky</div>
              </div>
            </Link>

            <form action="/produkty" method="GET" className="siteHeaderSearchWrap">
              <input
                name="q"
                className="headerSearch"
                placeholder="Hledej (Nike, Mercurial, DJ4977, 44...)"
              />
            </form>

            <nav className="siteHeaderNav">
              

              <Link className="btn iconBtn" href="/kosik" aria-label="Košík" title="Košík">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </Link>

              <a
                className="btn iconBtn"
                href={`https://instagram.com/${ig}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              <a
                className="btn iconBtn"
                href={fb}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                title="Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
                </svg>
              </a>
            </nav>
          </div>
        </header>

        <main className="container" style={{ paddingTop: 14 }}>
          {children}
        </main>

        <footer className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
          <div className="small">
            © {new Date().getFullYear()} Fotbalový Outlet CZ • Dotazy/objednávky:{" "}
            <a href={`mailto:${getEnv("SHOP_EMAIL_TO", "objednavky@fotbalovyoutletcz.cz")}`}>
              {getEnv("SHOP_EMAIL_TO", "objednavky@fotbalovyoutletcz.cz")}
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
