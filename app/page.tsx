import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="homeHero">
        <Link href="/produkty" className="homeHeroBannerLink">
          <img
            src="/baner.png"
            alt="Fotbalový Outlet CZ"
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
            Kopačky, běžecké boty a tenisky
            <br />
            nové i použité
          </h1>

          <p className="homeHeroText">
            Značkové fotbalové kopačky, běžecké boty a tenisky za výhodné ceny.
            Rychlé filtrování podle značky, velikosti, stavu i typu podrážky.
          </p>

          <div className="homeHeroActions">
            <Link className="btn btnPrimary" href="/produkty">
              Prohlédnout nabídku
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
