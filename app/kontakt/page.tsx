import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontaktujte Fotbalový Outlet CZ. E-mail, Facebook a základní informace o e-shopu s fotbalovými kopačkami a vybavením.",
  alternates: {
    canonical: "/kontakt",
  },
};

export default function ContactPage() {
  return (
    <section className="contactPage">
      <div className="contactCard card">
        <div className="contactEyebrow">Kontakt</div>
        <h1 className="contactTitle">Spojte se s námi</h1>

        <p className="contactText">
          Máte dotaz k produktu, velikosti, dostupnosti nebo objednávce? Napište nám
          a rádi se ozveme zpět.
        </p>

        <div className="contactList">
          <div className="contactItem">
            <strong>E-mail:</strong>{" "}
            <a href="mailto:objednavky@fotbalovyoutletcz.cz">
              objednavky@fotbalovyoutletcz.cz
            </a>
          </div>

          <div className="contactItem">
            <strong>Facebook:</strong>{" "}
            <a
              href="https://www.facebook.com/profile.php?id=61581311155200"
              target="_blank"
              rel="noreferrer"
            >
              Fotbalový Outlet CZ
            </a>
          </div>

          <div className="contactItem">
            <strong>WhatsApp:</strong>{" "}
            <a href="https://wa.me/420605171216" target="_blank" rel="noreferrer">
              +420 605 171 216
            </a>
          </div>
        </div>

        <div className="contactActions">
          <Link href="/produkty" className="btn btnPrimary">
            Prohlédnout nabídku
          </Link>
        </div>
      </div>
    </section>
  );
}
