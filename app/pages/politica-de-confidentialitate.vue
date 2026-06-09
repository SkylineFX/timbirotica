<script setup lang="ts">
useSeoMeta({
  title: 'Politica de Confidentialitate',
  description: 'Politica de confidentialitate si utilizare a datelor cu caracter personal.',
  ogTitle: 'Politica de Confidentialitate · Timbirotica',
  ogDescription: 'Politica de confidentialitate si utilizare a datelor cu caracter personal.',
})
</script>

<template>
  <UContainer class="py-8 lg:py-12 max-w-5xl">
    <!-- Header -->
    <div class="mb-8 lg:mb-12">
      <h1 class="text-2xl lg:text-3xl font-bold mb-2 md:mb-4">Politica de Confidentialitate</h1>
      <p class="text-gray-600">Ultima actualizare: Aprilie 2026</p>
    </div>

    <!-- Content -->
    <UCard :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
      <div class="space-y-6 text-gray-700 leading-relaxed text-sm lg:text-base divide-y divide-gray-100">

        <!-- Operator Data -->
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">I. Operatorul responsabil</h2>
          <p class="mb-2">In relatia cu datele dumneavoastra cu caracter personal, responsabilul este societatea comerciala <strong>Eurotimalex SRL</strong>, cu sediul in <strong>Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, Bucuresti</strong>. Compania noastra functioneaza pe teritoriul Romaniei, fiind inregistrata la Registrul Comertului sub numarul <strong>J2005017160400</strong>, cu Codul Unic de Inregistrare <strong>RO18034200</strong>.</p>
          <p class="mb-2">Ne angajam sa implementam masuri tehnice si organizatorice adecvate pentru a proteja datele personale ale tuturor utilizatorilor nostri impotriva distrugerii accidentale sau ilegale, a pierderii, modificarii, dezvaluirii sau accesului neautorizat.</p>
          <p class="mb-2">Acest document are rolul de a va informa detaliat cu privire la prelucrarea datelor dumneavoastra cu caracter personal, in contextul utilizarii acestui site web si a plasarii de comenzi pentru produsele pe care le comercializam. Aceasta politica functioneaza cumulativ cu sectiunea de <NuxtLink to="/termeni-si-conditii" class="text-primary hover:underline">Termeni si Conditii</NuxtLink>.</p>
          <p>Pentru orice intrebari sau pentru exercitarea drepturilor descrise mai jos, ne puteti contacta la <a href="mailto:eurotimalex@yahoo.com" class="text-primary hover:underline">eurotimalex@yahoo.com</a>.</p>
        </section>

        <!-- Cookie Policy Section -->
        <section id="cookies" class="pb-8 scroll-mt-24">
          <h2 class="text-2xl font-semibold mb-4 font-serif">II. Politica de Cookies</h2>
          <p>Un modul cookie este un fisier text de mici dimensiuni salvat pe computerul dumneavoastra. Platforma noastra utilizeaza exclusiv cookie-uri <strong>strict necesare</strong> pentru functionarea site-ului, fara a crea profile personalizate sau a colecta date pentru publicitate.</p>
          <ul class="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Cookie de sesiune (autentificare):</strong> un cookie HTTP-only criptat, setat dupa autentificarea in cont. Permite mentinerea conectarii intre pagini. Expira la inchiderea browserului sau, daca bifati &quot;Tine-ma minte&quot;, dupa 30 de zile.</li>
            <li><strong>Cookie de confirmare (&bdquo;cookie-consent&quot;):</strong> retine faptul ca ati luat la cunostinta utilizarea cookie-urilor, pentru a nu va mai afisa banner-ul informativ. Valabilitate 1 an.</li>
          </ul>
          <p class="mt-4 text-sm">Nu folosim cookie-uri de analiza, urmarire publicitara sau retele sociale. Puteti gestiona acceptul cookie-urilor din setarile oricarui browser standard, insa respingerea cookie-ului de sesiune va bloca autentificarea in cont si plasarea comenzilor.</p>
        </section>

        <!-- Data Categories Section -->
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">III. Categoriile de date supuse prelucrarii</h2>
          <p>Prelucram doar datele pe care ni le furnizati direct prin formularele site-ului. <strong>Nu colectam si nu stocam adresa IP, sau alti identificatori tehnici ai dispozitivului.</strong></p>

          <p class="mt-4"><strong>A. Date de cont si identificare</strong></p>
          <ul class="list-disc pl-5 mt-2 space-y-1 mb-4">
            <li><strong>La inregistrare:</strong> prenume, nume, adresa de e-mail, parola (stocata sub forma de hash).</li>
          </ul>

          <p><strong>B. Date de comanda, livrare si facturare</strong></p>
          <ul class="list-disc pl-5 mt-2 space-y-1 mb-4">
            <li><strong>Adrese salvate:</strong> nume, prenume, telefon, judet, localitate, strada si cod postal.</li>
            <li><strong>Date de facturare pentru persoane juridice:</strong> denumire companie, CUI, ONRC, optional banca si IBAN, adresa fiscala.</li>
            <li><strong>Detalii comanda:</strong> numar comanda, produse, cantitati, pret la momentul achizitiei, metoda de livrare, metoda de plata, status.</li>
          </ul>

          <p><strong>C. Activitate de cumparare</strong></p>
          <ul class="list-disc pl-5 mt-2 space-y-1 mb-4">
            <li><strong>Cos de cumparaturi:</strong> produsele si cantitatile retinute in cosul curent, asociate contului.</li>
            <li><strong>Favorite:</strong> produsele pe care le-ati marcat ca favorite, asociate contului.</li>
          </ul>
        </section>

        <!-- Perioada Retentie -->
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">IV. Durata de retentie</h2>
          <p>Datele cu caracter personal sunt pastrate doar pe durata necesara scopului prelucrarii si a obligatiilor legale aplicabile in Romania:</p>
          <ul class="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Cont de utilizator:</strong> pana la solicitarea expresa de stergere (&quot;dreptul de a fi uitat&quot;) sau dezactivarea contului.</li>
            <li><strong>Date privind comenzile si documentele fiscale:</strong> 10 ani, conform obligatiilor de arhivare din legislatia fiscala romana.</li>
            <li><strong>Cos de cumparaturi:</strong> continutul cosului este sters automat la finalizarea comenzii. Cosurile abandonate sunt sterse dupa 90 de zile de inactivitate.</li>
            <li><strong>Token-uri de resetare a parolei:</strong> maxim 1 ora; sterse imediat dupa utilizare.</li>
            <li><strong>Cookie de sesiune:</strong> 30 de zile (cu &quot;Tine-ma minte&quot;) sau pana la inchiderea browser-ului.</li>
            <li><strong>Cookie &bdquo;cookie-consent&quot;:</strong> 1 an de la confirmare.</li>
          </ul>
        </section>

        <!-- Terte parti si transferuri -->
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">V. Destinatari si transferuri catre terti</h2>
          <p>Nu vindem si nu inchiriem datele dumneavoastra. Impartasim strict informatiile necesare, in scopul functionarii optime a magazinului online:</p>
          <ul class="list-disc pl-5 mt-2 space-y-3">
            <li><strong>Resend</strong> (furnizor servicii e-mail).</li>
            <li><strong>Agentii de curierat</strong>, atunci cand alegeti livrarea prin curier: numele, telefonul si adresa de livrare necesare expedierii.</li>
          </ul>
          <p class="mt-4 text-sm">Toti acesti furnizori proceseaza datele exclusiv pentru a ne ajuta sa prestam serviciul, in baza unor masuri de securitate adecvate.</p>
        </section>

        <!-- Drepturile utilizatorului -->
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">VI. Drepturile dumneavoastra</h2>
          <p>Conform Regulamentului UE 2016/679 (GDPR) si legislatiei romane, aveti urmatoarele drepturi cu privire la datele dumneavoastra:</p>

          <ul class="list-disc pl-5 mt-4 space-y-3">
            <li><strong>Dreptul la informare:</strong> de a primi detalii privind activitatile de prelucrare efectuate de Eurotimalex SRL, conform celor descrise in prezentul document.</li>
            <li><strong>Dreptul de acces la date:</strong> de a obtine confirmarea prelucrarii si o copie a datelor pe care le detinem despre dumneavoastra.</li>
            <li><strong>Dreptul la rectificare:</strong> de a corecta datele inexacte sau de a completa datele incomplete.</li>
            <li><strong>Dreptul la stergerea datelor („dreptul de a fi uitat"):</strong> in conditiile prevazute de GDPR. Anumite date (ex. comenzile si documentele fiscale) trebuie pastrate conform obligatiilor legale de arhivare.</li>
            <li><strong>Dreptul la portabilitatea datelor:</strong> de a primi datele intr-un format structurat, uzual si care poate fi citit automat, sau de a le transmite altui operator.</li>
            <li><strong>Dreptul la opozitie:</strong> de a va opune prelucrarii datelor pe baza interesului legitim al operatorului.</li>
            <li><strong>Dreptul de a nu fi supus unei decizii individuale automate:</strong> nu folosim profilare sau decizii automate care produc efecte juridice.</li>
            <li><strong>Dreptul de a va adresa</strong> Autoritatii Nationale de Supraveghere a Prelucrarii Datelor cu Caracter Personal (<a href="https://www.dataprotection.ro/" target="_blank" class="text-primary font-medium hover:underline">ANSPDCP</a>) sau instantelor competente.</li>
          </ul>

          <p class="mt-4">Pentru exercitarea oricaruia dintre drepturile de mai sus, ne puteti contacta la <a href="mailto:eurotimalex@yahoo.com" class="text-primary hover:underline">eurotimalex@yahoo.com</a> sau prin <a href="/contact" class="text-primary hover:underline">formularul de contact</a>. Raspundem solicitarilor in maximum 30 de zile.</p>
        </section>

      </div>
    </UCard>
  </UContainer>
</template>
