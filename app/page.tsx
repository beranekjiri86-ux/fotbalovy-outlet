import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fotbalové kopačky a vybavení – nové i použité",
  description:
    "Nakupujte nové i použité fotbalové kopačky, běžecké boty, tenisky, brankářské rukavice, dresy a sportovní oblečení za výhodné ceny na Fotbalový Outlet CZ.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <section className="homeHero">
        <Link href="/produkty" className="homeHeroBannerLink">
          <img
            src="/baner.png"
            alt="Fotbalové kopačky a fotbalové vybavení – Fotbalový Outlet CZ"
            className="homeHeroBanner"
          />
        </Link>

        <div className="homeCategories">
          <Link href="/produkty?cat=kopačky" className="homeCategory">
            ⚽
            <span>Kopačky</span>
          </Link>

          <Link href="/produkty?cat=běžecké boty" className="homeCategory">
            🏃
            <span>Běžecké boty</span>
          </Link>

          <Link href="/produkty?cat=tenisky" className="homeCategory">
            👟
            <span>Tenisky</span>
          </Link>

          <Link href="/produkty?cat=rukavice" className="homeCategory">
            🧤
            <span>Rukavice</span>
          </Link>

          <Link href="/produkty?cat=dresy" className="homeCategory">
            👕
            <span>Dresy</span>
          </Link>

          <Link href="/produkty?cat=oblečení" className="homeCategory">
            🧥
            <span>Oblečení</span>
          </Link>
        </div>

        <div className="homeHeroCard">
          <div className="homeHeroEyebrow">Fotbalový outlet</div>

          <h1 className="homeHeroTitle">
            Fotbalové kopačky a vybavení
            <br />
            nové i použité
          </h1>

          <p className="homeHeroText">
            Značkové fotbalové kopačky, běžecké boty, tenisky, rukavice, dresy i
            sportovní oblečení za výhodné ceny. Rychlé filtrování podle značky,
            velikosti, stavu i typu podrážky.
          </p>

          <div className="homeHeroActions">
            <Link className="btn btnPrimary" href="/produkty">
              Prohlédnout nabídku
            </Link>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingTop: 16, paddingBottom: 12 }}>
        <h2 style={{ marginBottom: 12 }}>Fotbalový outlet pro hráče i brankáře</h2>
        <p style={{ lineHeight: 1.7, margin: 0 }}>
          Fotbalový Outlet CZ nabízí nové i použité fotbalové kopačky, běžecké boty,
          tenisky, brankářské rukavice, dresy i sportovní oblečení za výhodné ceny.
          V nabídce najdete originální produkty značek Nike, adidas, Puma, Mizuno,
          Diadora a dalších. Díky přehlednému filtrování podle velikosti, značky,
          kategorie a stavu snadno najdete ideální vybavení pro trénink, zápas i
          volný čas.
        </p>
      </section>
    </>
  );
}
