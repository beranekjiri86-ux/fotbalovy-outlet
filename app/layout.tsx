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
  const domain = getEnv("SHOP_DOMAIN", "fotbalovyoutletcz.cz");
  return (
    <html lang="cs">
      <body>
        <header className="header">
  <div className="container nav">
    <Link href="/" className="brand" style={{display:"flex",alignItems:"center",gap:10}}>
      <img
        src="/logo.png"
        alt="Fotbalový Outlet CZ"
        style={{height:50}}
      />
    </Link>

    <nav className="links">
      <Link className="btn" href="/produkty">Produkty</Link>
      <Link className="btn" href="/kosik">Košík</Link>
      <a className="btn" href={`https://instagram.com/${ig}`} target="_blank" rel="noreferrer">
        Instagram
      </a>
    </nav>
  </div>
</header>
        <main className="container">{children}</main>
        <footer className="container" style={{paddingTop:24, paddingBottom:40}}>
          <div className="small">
            © {new Date().getFullYear()} Fotbalový Outlet CZ • Dotazy/objednávky:{" "}
            <a href={`mailto:${getEnv("SHOP_EMAIL_TO","objednavky@fotbalovyoutletcz.cz")}`}>{getEnv("SHOP_EMAIL_TO","objednavky@fotbalovyoutletcz.cz")}</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
