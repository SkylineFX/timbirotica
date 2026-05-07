<script setup lang="ts">
useHead({
  title: 'Politica de Confidențialitate',
  meta: [
    { name: 'description', content: 'Politica de confidențialitate și utilizare a datelor cu caracter personal pentru Eurotimalex, conform normelor GDPR.' }
  ]
})
</script>

<template>
  <UContainer class="py-8 lg:py-12 max-w-5xl">
    <!-- Header -->
    <div class="mb-8 lg:mb-12">
      <h1 class="text-2xl lg:text-3xl font-bold mb-2 md:mb-4">Politica de Confidențialitate</h1>
      <p class="text-gray-600">Ultima actualizare: Aprilie 2026</p>
    </div>

    <!-- Content -->
    <UCard :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
      <div class="space-y-6 text-gray-700 leading-relaxed text-sm lg:text-base divide-y divide-gray-100">

        <!-- Operator Data -->
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">I. Operatorul responsabil</h2>
          <p class="mb-2">În relația cu datele dumneavoastră cu caracter personal, responsabilul este societatea comercială <strong>Eurotimalex SRL</strong>, cu sediul în <strong>Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, București</strong>. Compania noastră funcționează legal pe teritoriul României, fiind înregistrată la Registrul Comerțului sub numărul <strong>J40/17160/2005</strong>, cu Codul Unic de Înregistrare <strong>RO18034200</strong>.</p>
          <p class="mb-2">Ne angajăm să implementăm măsuri tehnice și organizatorice adecvate pentru a proteja datele personale ale tuturor utilizatorilor noștri împotriva distrugerii accidentale sau ilegale, a pierderii, modificării, dezvăluirii sau accesului neautorizat.</p>
          <p class="mb-2">Acest document are rolul de a vă informa detaliat cu privire la prelucrarea datelor dumneavoastră cu caracter personal, în contextul utilizării acestui site web și a plasării de comenzi pentru produsele pe care le comercializăm. Această politică funcționează cumulativ cu secțiunea de <NuxtLink to="/termeni-si-conditii" class="text-primary hover:underline">Termeni și Condiții</NuxtLink>.</p>
          <p>Pentru orice întrebări sau pentru exercitarea drepturilor descrise mai jos, ne puteți contacta la <a href="mailto:eurotimalex@yahoo.com" class="text-primary hover:underline">eurotimalex@yahoo.com</a>.</p>
        </section>

        <!-- Cookie Policy Section -->
        <section id="cookies" class="pb-8 scroll-mt-24">
          <h2 class="text-2xl font-semibold mb-4 font-serif">II. Politica de Cookies</h2>
          <p>Un modul cookie este un fișier text de mici dimensiuni salvat pe computerul dumneavoastră. Platforma noastră utilizează exclusiv cookie-uri <strong>strict necesare</strong> pentru funcționarea site-ului, fără a elabora profile sau a colecta date pentru publicitate.</p>
          <ul class="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Cookie de sesiune (autentificare):</strong> un cookie HTTP-only criptat, setat după autentificarea în cont. Permite menținerea conectării între pagini. Expiră la închiderea browserului sau, dacă bifați &quot;Ține-mă minte&quot;, după 30 de zile.</li>
            <li><strong>Cookie de confirmare (&bdquo;cookie-consent&quot;):</strong> reține faptul că ați luat la cunoștință utilizarea cookie-urilor, pentru a nu vă mai afișa banner-ul informativ. Valabilitate 1 an.</li>
          </ul>
          <p class="mt-4 text-sm">Nu folosim cookie-uri de analiză, urmărire publicitară sau rețele sociale. Puteți gestiona acceptul cookie-urilor din setările oricărui browser standard, însă respingerea cookie-ului de sesiune va bloca autentificarea în cont și plasarea comenzilor.</p>
        </section>

        <!-- Data Categories Section -->
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">III. Categoriile de date supuse prelucrării</h2>
          <p>Prelucrăm doar datele pe care ni le furnizați direct prin formularele site-ului. <strong>Nu colectăm și nu stocăm adresa IP, sau alți identificatori tehnici ai dispozitivului.</strong></p>

          <p class="mt-4"><strong>A. Date de cont și identificare</strong></p>
          <ul class="list-disc pl-5 mt-2 space-y-1 mb-4">
            <li><strong>La înregistrare:</strong> prenume, nume, adresă de e-mail, parolă (stocată sub formă de hash).</li>
          </ul>

          <p><strong>B. Date de comandă, livrare și facturare</strong></p>
          <ul class="list-disc pl-5 mt-2 space-y-1 mb-4">
            <li><strong>Adrese salvate:</strong> nume, prenume, telefon, județ, localitate, stradă și cod poștal.</li>
            <li><strong>Date de facturare pentru persoane juridice:</strong> denumire companie, CUI, ONRC, opțional bancă și IBAN, adresa fiscală.</li>
            <li><strong>Detalii comandă:</strong> număr comandă, produse, cantități, preț la momentul achiziției, metodă de livrare, metodă de plată, status.</li>
          </ul>

          <p><strong>C. Activitate de cumpărare</strong></p>
          <ul class="list-disc pl-5 mt-2 space-y-1 mb-4">
            <li><strong>Coș de cumpărături:</strong> produsele și cantitățile reținute în coșul curent, asociate contului.</li>
            <li><strong>Favorite:</strong> produsele pe care le-ați marcat ca favorite, asociate contului.</li>
          </ul>
        </section>

        <!-- Perioada Retentie -->
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">IV. Durata de retenție</h2>
          <p>Datele cu caracter personal sunt păstrate doar pe durata necesară scopului prelucrării și a obligațiilor legale aplicabile în România:</p>
          <ul class="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Cont de utilizator:</strong> până la solicitarea expresă de ștergere (&quot;dreptul de a fi uitat&quot;) sau dezactivarea contului.</li>
            <li><strong>Date privind comenzile și documentele fiscale:</strong> 10 ani, conform obligațiilor de arhivare din legislația fiscală română.</li>
            <li><strong>Coș de cumpărături:</strong> conținutul coșului este șters automat la finalizarea comenzii. Coșurile abandonate sunt șterse după 90 de zile de inactivitate.</li>
            <li><strong>Token-uri de resetare a parolei:</strong> maxim 1 oră; șterse imediat după utilizare.</li>
            <li><strong>Cookie de sesiune:</strong> 30 de zile (cu &quot;Ține-mă minte&quot;) sau până la închiderea browser-ului.</li>
            <li><strong>Cookie &bdquo;cookie-consent&quot;:</strong> 1 an de la confirmare.</li>
          </ul>
        </section>

        <!-- Terte parti si transferuri -->
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">V. Destinatari și transferuri către terți</h2>
          <p>Nu vindem și nu închiriem datele dumneavoastră. Le împărtășim exclusiv cu furnizorii care fac posibilă funcționarea magazinului online:</p>
          <ul class="list-disc pl-5 mt-2 space-y-3">
            <li><strong>Resend</strong> (furnizor servicii e-mail).</li>
            <li><strong>Agentii de curierat</strong>, atunci când alegeți livrarea prin curier: numele, telefonul și adresa de livrare necesare expedierii.</li>
          </ul>
          <p class="mt-4 text-sm">Toți acești furnizori procesează datele exclusiv pentru a ne ajuta să prestăm serviciul, în baza unor măsuri de securitate adecvate.</p>
        </section>

        <!-- Drepturile utilizatorului -->
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">VI. Drepturile dumneavoastră</h2>
          <p>Conform Regulamentului UE 2016/679 (GDPR) și legislației române, aveți următoarele drepturi cu privire la datele dumneavoastră:</p>

          <ul class="list-disc pl-5 mt-4 space-y-3">
            <li><strong>Dreptul la informare:</strong> de a primi detalii privind activitățile de prelucrare efectuate de Eurotimalex SRL, conform celor descrise în prezentul document.</li>
            <li><strong>Dreptul de acces la date:</strong> de a obține confirmarea prelucrării și o copie a datelor pe care le deținem despre dumneavoastră.</li>
            <li><strong>Dreptul la rectificare:</strong> de a corecta datele inexacte sau de a completa datele incomplete.</li>
            <li><strong>Dreptul la ștergerea datelor („dreptul de a fi uitat"):</strong> în condițiile prevăzute de GDPR. Anumite date (ex. comenzile și documentele fiscale) trebuie păstrate conform obligațiilor legale de arhivare.</li>
            <li><strong>Dreptul la portabilitatea datelor:</strong> de a primi datele într-un format structurat, uzual și care poate fi citit automat, sau de a le transmite altui operator.</li>
            <li><strong>Dreptul la opoziție:</strong> de a vă opune prelucrării datelor pe baza interesului legitim al operatorului.</li>
            <li><strong>Dreptul de a nu fi supus unei decizii individuale automate:</strong> nu folosim profilare sau decizii automate care produc efecte juridice.</li>
            <li><strong>Dreptul de a vă adresa</strong> Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (<a href="https://www.dataprotection.ro/" target="_blank" class="text-primary font-medium hover:underline">ANSPDCP</a>) sau instanțelor competente.</li>
          </ul>

          <p class="mt-4">Pentru exercitarea oricăruia dintre drepturile de mai sus, ne puteți contacta la <a href="mailto:eurotimalex@yahoo.com" class="text-primary hover:underline">eurotimalex@yahoo.com</a>. Răspundem solicitărilor în maximum 30 de zile.</p>
        </section>

      </div>
    </UCard>
  </UContainer>
</template>
