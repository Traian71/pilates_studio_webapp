// src/app/terms/page.tsx
import React from 'react';

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-[#E57F84] mb-8 pt-10 text-center font-inter">Termeni și Condiții</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[#E57F84] mb-4">1. Introducere</h2>
        <p className="text-gray-700 mb-4">
          Bun venit la Balance Studio! Acești Termeni și Condiții reglementează utilizarea serviciilor noastre de Pilates. Prin accesarea și utilizarea site-ului nostru web și a serviciilor noastre, sunteți de acord să respectați și să fiți obligat de acești termeni.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[#E57F84] mb-4">2. Servicii</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Oferim clase de Pilates Reformer și Mat pentru toți nivelurile de pregătire.</li>
          <li>Clasele sunt conduse de instructori profesioniști și calificați.</li>
          <li>Rezervările se fac online prin intermediul platformei noastre.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[#E57F84] mb-4">3. Abonamente și Plăți</h2>
        <p className="text-gray-700 mb-4">
          <strong>3.1 Tipuri de Abonamente</strong><br />
          Oferim mai multe tipuri de abonamente: 4, 8 și 12 ședințe lunare pentru Pilates Reformer și Mat.
        </p>
        <p className="text-gray-700 mb-4">
          <strong>3.2 Politica de Plată</strong><br />
          Plata se poate face online sau cash la studio. Prețurile sunt afișate în RON și includ taxa pentru ședințele de Pilates.
        </p>
        <p className="text-gray-700 mb-4">
          <strong>3.3 Rambursări</strong><br />
          Nu oferim rambursări pentru abonamentele achiziționate. Ședințele neutilizate pot fi transferate sau prelungite conform politicii noastre.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[#E57F84] mb-4">4. Rezervări și Anulări</h2>
        <p className="text-gray-700 mb-4">
          <strong>4.1 Rezervări</strong><br />
          Rezervările se fac online cu cel puțin 12 ore înainte de începerea ședinței. Locurile sunt limitate și se ocupă în ordinea rezervărilor.
        </p>
        <p className="text-gray-700 mb-4">
          <strong>4.2 Politica de Anulare</strong><br />
          Puteți anula o ședință cu minimum 6 ore înainte fără penalizare. Anulările tardive sau neprezentările vor fi considerate ședințe consumate.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[#E57F84] mb-4">5. Conduită și Siguranță</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Vă rugăm să purtați îmbrăcăminte comodă și potrivită pentru exerciții.</li>
          <li>Informați instructorul despre orice condiție medicală sau limitare fizică.</li>
          <li>Respectați regulile și instrucțiunile instructorilor pentru siguranța dumneavoastră.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[#E57F84] mb-4">6. Politica de Confidențialitate</h2>
        <p className="text-gray-700 mb-4">
          Datele personale sunt tratate confidențial și sunt utilizate doar în scopul furnizării serviciilor noastre, conform legislației în vigoare privind protecția datelor cu caracter personal.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[#E57F84] mb-4">7. Modificări ale Termenilor</h2>
        <p className="text-gray-700 mb-4">
          Balance Studio își rezervă dreptul de a modifica acești Termeni și Condiții în orice moment. Modificările vor fi comunicate prin intermediul site-ului web.
        </p>
      </section>

      <section className="text-center mt-12">
        <p className="text-gray-600 italic">
          Ultima actualizare: Mai 2025<br />
          © 2025 Balance Studio. Toate drepturile rezervate.
        </p>
      </section>
    </div>
  );
};

export default TermsPage;
