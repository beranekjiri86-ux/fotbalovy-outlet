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
  <div className="container" style={{
    display:"flex",
    alignItems:"center",
    justifyContent:"space-between",
    gap:20,
    padding:"10px 0"
  }}>

    {/* LOGO */}
    <Link href="/" style={{
      display:"flex",
      alignItems:"center",
      gap:10,
      textDecoration:"none",
      color:"inherit"
    }}>
      <img src="/logo.png" alt="Fotbalový Outlet CZ" style={{height:70}} />
      <div style={{lineHeight:1}}>
        <div style={{fontWeight:800,fontSize:18}}>
          Fotbalový Outlet CZ
        </div>
        <div style={{fontSize:12,opacity:0.6}}>
          nové i použité kopačky
        </div>
      </div>
    </Link>

    {/* MENU */}
    <nav style={{
      display:"flex",
      gap:10,
      alignItems:"center"
    }}>
      <Link className="btn" href="/produkty">Produkty</Link>
      <Link className="btn" href="/kosik">Košík</Link>
      <a className="btn" href={`https://instagram.com/${ig}`} target="_blank">
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
