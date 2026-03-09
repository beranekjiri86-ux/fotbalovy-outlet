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
            Výhodné ceny značkových fotbalových kopaček a sportovní obuvi.
            Nové i použité modely skladem a připravené k rychlému odeslání.
          </p>

          <div className="homeHeroActions">
            <Link className="btn btnPrimary" href="/produkty">
              Prohlédnout nabídku
            </Link>
          </div>
        </div>
      </section>

      <section className="homeBenefits">
        <div className="homeBenefitsGrid">
          <div className="homeBenefit card">
            <div className="homeBenefitTitle">Originální zboží</div>
            <p className="homeBenefitText">
              Nabídka značek Nike, adidas, Puma, Mizuno, Diadora a dalších.
            </p>
          </div>

          <div className="homeBenefit card">
            <div className="homeBenefitTitle">Výhodné ceny</div>
            <p className="homeBenefitText">
              Nové i použité produkty za outlet ceny bez zbytečných přirážek.
            </p>
          </div>

          <div className="homeBenefit card">
            <div className="homeBenefitTitle">Rychlý kontakt</div>
            <p className="homeBenefitText">
              Objednávky i dotazy vyřídíš jednoduše přes e-mail, Facebook nebo WhatsApp.
            </p>
          </div>
        </div>
      </section>

      <section className="homeSeoBlock">
        <h2 className="homeSeoTitle">Fotbalový outlet pro hráče i brankáře</h2>
        <p className="homeSeoText">
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
