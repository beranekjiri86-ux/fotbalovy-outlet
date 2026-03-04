import Link from "next/link";

function env(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export default function Home() {
  const phone = env("SHOP_PHONE", "+420605171216");
  const email = env("SHOP_EMAIL_TO", "objednavky@fotbalovyoutletcz.cz");
  const ig = env("SHOP_IG", "fotbalovy_outlet_cz");
  const fb = env("SHOP_FB", "");
  const bank = env("SHOP_BANK_ACCOUNT", "36493003/5500");
return (
  <>
    <div style={{ marginTop: 20 }}>
      <Link href="/produkty">
        <img
          src="/baner.png"
          alt="Fotbalový Outlet CZ"
          style={{
            width: "100%",
            borderRadius: 12,
            display: "block",
            cursor: "pointer",
          }}
        />
      </Link>
    </div>

    <div className="grid" style={{ gap: 16, paddingTop: 16 }}>
      {/* zbytek už nech jak máš */}
    style={{
      position: "absolute",
      left: 30,
      bottom: 30,
      background: "rgba(0,0,0,0.6)",
      padding: "20px 24px",
      borderRadius: 10,
      color: "white",
      maxWidth: 320
    }}
  >
    <div style={{ fontSize: 22, fontWeight: 800 }}>
      Fotbalový Outlet CZ
    </div>

    <div style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>
      nové i použité kopačky za outlet ceny
    </div>

    <Link
      href="/produkty"
      style={{
        display: "inline-block",
        marginTop: 12,
        background: "#16a34a",
        padding: "10px 16px",
        borderRadius: 8,
        fontWeight: 700,
        color: "white",
        textDecoration: "none"
      }}
    >
      Prohlédnout nabídku
    </Link>
  </div>

      <div className="grid" style={{ gap: 16, paddingTop: 16 }}>
        <div className="card">
          <h1 className="h1">Kopačky, běžecké boty a tenisky – nové i použité</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            Rychlé filtrování podle kategorie, stavu, velikosti (EU), značky a typu
            kopaček (FG/AG/SG/TF/IC).
          </p>

         <div className="row" style={{ marginTop: 12 }}>
  <Link className="btn btnPrimary" href="/produkty">Prohlédnout nabídku</Link>
</div>
          <div className="hr" />

          <div className="kpis">
            <div className="kpi">
              <strong>Platba</strong>
              <span>Dobírka / převod / domluva</span>
            </div>
            <div className="kpi">
              <strong>Převod</strong>
              <span>{bank}</span>
            </div>
            <div className="kpi">
              <strong>Kontakt</strong>
              <span>
                {phone} • {email}
              </span>
            </div>
          </div>
        </div>

        <div className="grid2 grid">
          <div className="card">
            <h2 className="h2">Rychlý start</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Nejrychlejší cesta je přidat položky do košíku a odeslat objednávku
              (dobírka/převod), nebo zvolit „Domluva“ a napsat nám přes IG/FB.
            </p>

            <div className="row">
              <a className="btn" href={`https://instagram.com/${ig}`} target="_blank" rel="noreferrer">
                Napsat na Instagram
              </a>
              {fb ? (
                <a className="btn" href={fb} target="_blank" rel="noreferrer">
                  Messenger (FB)
                </a>
              ) : null}
              <a className="btn" href={`tel:${phone.replaceAll(" ", "")}`}>
                Zavolat
              </a>
            </div>
          </div>

          <div className="card">
            <h2 className="h2">Doprava</h2>
            <ul className="muted" style={{ marginTop: 0, paddingLeft: 18 }}>
              <li>Zásilkovna</li>
              <li>PPL/DPD</li>
              <li>Osobní předání</li>
              <li>Dle domluvy</li>
            </ul>

            <div className="notice">
              <div style={{ fontWeight: 700 }}>Rezervace</div>
              <div className="small">
                Po odeslání objednávky se položky automaticky rezervují na 24 hodin.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
