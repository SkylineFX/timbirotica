<script setup lang="ts">
useHead({
  title: 'Termeni și Condiții',
  meta: [
    { name: 'description', content: 'Termenii și condițiile de utilizare a magazinului online Eurotimalex.' }
  ]
})
</script>

<template>
  <UContainer class="py-8 lg:py-12 max-w-5xl">
    <!-- Header -->
    <div class="mb-8 lg:mb-12">
      <h1 class="text-3xl lg:text-4xl font-bold mb-4">Termeni și Condiții de Utilizare</h1>
      <p class="text-gray-600">Ultima actualizare: Aprilie 2026</p>
    </div>

    <!-- Content -->
    <UCard :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
      <div class="space-y-6 text-gray-700 leading-relaxed text-sm lg:text-base divide-y divide-gray-100">
        
        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">I. Despre Noi</h2>
          <p>Serviciul de comert electronic este oferit de <strong>Eurotimalex SRL</strong>, cu sediul în <strong>Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, București</strong>, înmatriculată în Registrul Comerțului sub nr. <strong>J40/17160/2005</strong>, având cod unic de înregistrare <strong>RO18034200</strong>.</p>

          <div class="flex flex-col gap-4 my-4">
            <p>Folosirea acestui site de către orice persoană (atât fizică cât și juridică) în scopul de a se informa sau de a achiziționa produsele, denumit în continuare “utilizator”, reprezintă acordul acestuia fără limitări sau rezerve a prezenților Termeni și Condiții. Numai persoanele cu vârsta peste 18 ani se pot înregistra pe site.</p>

            <div>
              <p>Trimiterea unei comenzi se poate face prin una dintre următoarele metode:</p>
              <ul class="list-disc list-inside ml-2 mt-2 space-y-1">
                <li>direct de pe site-ul Vânzătorului</li>
                <li>prin e-mail la <a href="mailto:eurotimalex@yahoo.com">eurotimalex@yahoo.com</a></li>
                <li>telefonic la numărul de telefon <a href="tel:+40751022882">+40 751 022 882</a></li>
              </ul>
            </div>

            <p>În momentul confirmării unei comenzi, cumpărătorul își exprimă acordul privind încheierea contractului și își asumă obligațiile ce-i revin.</p>
            <p>Prin lansarea unei comenzi pe site, Cumpărătorul este de acord cu forma de comunicare (e-mail, SMS, telefon) prin care Vânzătorul își derulează operațiunile pe site.</p>
            <p>Deși încercăm să evităm publicarea datelor eronate pe cât posibil, ne rezervăm dreptul de a exista erori la publicarea automată a detaliilor produselor existente pe site: descrieri, fotografii, preț etc. În cazul unor erori, vă rugăm să ne contactați.</p>
            <p>Vânzătorul va informa Cumpărătorul înregistrarea (preluarea) comenzii, respectiv confirmarea comenzii. Înregistrarea unei comenzi online de către Vânzător, discuțiile telefonice sau prin alte mijloace de comunicare nu constituie o validare și confirmare ferme ale comenzii și, în consecință, nu semnifică încheierea contractului la distanță. Dacă Vânzătorul confirmă explicit o comandă, acest lucru va implica o acceptare completă a termenilor comenzii. Acceptarea comenzii de către Vânzător se consideră finalizată atunci când există o confirmare scrisă (e-mail, SMS) din partea Vânzătorului către Cumpărător, fără a necesita o confirmare de primire din partea acestuia din urmă. Comanda se consideră validă numai după confirmarea de către Vânzător a disponibilității stocului, a prețului precum și a caracteristicilor produselor respectiv a serviciilor solicitate de Cumpărător.</p>
            <p>În lipsa unei confirmări exprese din partea Vânzătorului, prezentele termene și condiții generale de vânzare vor sta la baza Contractului încheiat, în completarea acestora fiind Certificatul de Garanție emis de către Vânzător, și documentele fiscale. Certificatul de garanție tehnică (sau comercială) precum și certificatul de garanție pentru montaj, dacă acesta a fost realizat de echipa Eurotimalex SRL, se găsesc în coletul de livrare sau cutia Produsului. Eventuala lipsă a certificatului de garanție trebuie semnalată în cel mai scurt timp de la recepția comenzii la adresa de e-mail eurotimalex@yahoo.com ori telefonic la 0751022882.</p>
          </div>



          <p>Ne puteți contacta prin următoarele mijloace:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Prin e-mail la:</strong> <a class="hover:text-primary transition-colors" href="mailto:eurotimalex@yahoo.com">eurotimalex@yahoo.com</a></li>
            <li><strong>Prin telefon la:</strong> <a class="hover:text-primary transition-colors" href="tel:+40751022882">+40 751 022 882</a>.</li>
          </ul>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">II. Înregistrarea ca utilizator</h2>
          <p>Site-ul poate fi accesat în mod gratuit, iar simpla navigare în paginile acestuia nu este condiționată de înregistrarea ca utilizator (crearea unui cont pe site). Pentru a beneficia însă de anumite servicii (precum achiziționarea produselor, verificarea situației comenzilor proprii), va trebui să vă creați un cont de utilizator.</p>
          <p>Înregistrarea ca utilizator presupune acceptarea prealabilă de către dvs. a Termenilor și Condițiilor de utilizare și a <strong>Politicii de Confidențialitate</strong>.</p>
          <p>Ne rezervăm dreptul de a închide conturi de utilizatori sau de a refuza vânzarea de produse, la propria discreție, în cazul unor abuzuri.</p>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">III. Procedura de cumpărare</h2>
          <p>Pentru a cumpăra și intra în posesia produselor oferite spre vânzare este necesară parcurgerea următoarelor etape:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>Identificarea și alegerea produselor, finalizând adăugarea lor in Coș.</li>
            <li>Efectuarea plății produselor (transfer bancar pe baza facturii sau numerar la livrare).</li>
            <li>Livrarea produselor comandate care va fi însoțită, dacă este cazul, de manuale sau alte certificate conform legislației.</li>
          </ul>
          <p class="mt-4">Prin lansarea unei comenzi electronice, sunteți de acord cu forma de comunicare prin care Site-ul își derulează operațiunile.</p>
        </section>

        <section id="plata" class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">IV. Prețurile și Plata</h2>
          <p>Cu excepția cazurilor în care este prevăzut altfel, prețurile produselor afișate reprezintă prețurile finale de cumpărare și <strong>includ TVA</strong> (taxa pe valoare adăugată valabilă în România conform codului fiscal curent).</p>
          <p>Dacă adresa de livrare nu este aceeași cu adresa de facturare, aveți posibilitatea de a le distinge direct în secțiunea de Checkout (Finalizare comandă). Informațiile transmise trebuie să fie integral corecte, altfel comanda poate fi întârziată sau neonorată.</p>

          <p class="mt-4 font-semibold">Opțiunile de plată acceptate sunt:</p>
          <ol class="list-decimal list-inside pl-5 mt-2 space-y-1">
            <li><strong>Plata ramburs:</strong> in numerar (lei - maxim 5000 ron), pentru livrare la adresa (clienti persoane juridice sau persoane fizice), catre comisionarul care efectueaza livrarea. Pentru plata ramburs se aplica o taxa suplimentara de 15 lei.</li>
            <li><strong>Ordin de plata / virament bancar</strong> (clienti persoane juridice sau persoane fizice). In acest caz, se va emite o factura proforma care se va transmite la adresa de e-mail comunicata de catre comparator si dupa efectuarea platii, comanda se va livra.</li>
            <li><strong>Plata online cu card bancar.</strong> Tranzactiile se realizeaza in conditii de maxima siguranta, prin intermediul ING WebPay.</li>
          </ol>
        </section>

        <section id="livrare" class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">V. Livrare</h2>

          <div class="flex flex-col gap-2 mb-4">
            <p>Livrarea comenzilor se poate face în următoarele moduri:</p>
            <ol class="list-decimal pl-5 space-y-2">
              <li><strong>Ridicare de la sediul nostru:</strong> Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, București.</li>
              <li><strong>Cu mașinile proprii</strong>: Momentan, livrările se efectuează doar în București.</li>
            </ol>
          </div>

          <p class="mt-4 font-medium">Costuri de livrare:</p>
          <ul class="list-disc pl-5 mt-2 space-y-2">
            <li>Livrarea este <strong>GRATUITĂ</strong> pentru comenzi mai mari de 200 lei (TVA inclus) și care au maxim 40kg.</li>
            <li>Pentru comenzi mai mici de 200 lei și cu greutate sub 40kg, se va aplica o taxă de livrare de <strong>30.00 lei</strong> (TVA inclus).</li>
            <li>La comenzile mai grele de 40 kg se vor taxa kilogramele suplimentare cu <strong>2 lei/kg</strong> (TVA inclus).</li>
          </ul>

          <p class="mt-4 font-semibold">Termenul standard de expediere este:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>24 - 48 de ore, pentru comenzile plasate in zile lucratoare.</li>
          </ul>

          <p class="mt-4 font-semibold">Transport GRATUIT pentru comenzile eligibile:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>Transport gratuit pentru comenzile de peste 200 lei, livrate in Bucuresti si Ilfov. </li>
          </ul>
          
          <p class="mt-4 font-semibold">Pentru comenzile sub aceste praguri, costurile de livrare sunt următoarele:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>42,95 lei pentru comenzile mai mici de 50 lei;</li>
            <li>17,95 lei pentru comenzile peste 50 lei;</li>
          </ul>

          <p class="mt-4 font-semibold">Termenii și Condițiile de livrare:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>Termenul efectiv de livrare poate fi influentat de durata expedierii de catre curier.</li>
            <li>Acest magazin online este destinat exclusiv livrarii de produse catre clienti persoane juridice, persoane fizice, persoane fizice autorizate, intreprinderi individuale sau intreprinderi familiale, numai la adrese de pe teritoriul Romaniei. In momentul livrarii, o persoana cu varsta de minim 18 ani, reprezentand persoana fizica sau juridica, va semna pentru toate produsele expediate.</li>
            <li>În cazul în care Vânzătorul nu poate executa Contractul din motivul indisponibilității produsului sau serviciului, Vânzătorul va informa Cumpărătorul despre aceasta indisponibilitate, urmând ca sumele de bani achitate de către Cumpărător pentru produsul sau serviciul indisponibil să fie rambursate.</li>
            <li>În cazul în care Vânzătorul primește informații eronate legate de facturarea sau livrarea produselor, a respingerii de către banca emitentă a cardului sau a tranzacției, a invalidării tranzacției de către procesatorul de carduri, a amânării de către Cumpărător a termenului de livrare stabilit, Vânzătorul își rezervă dreptul de a denunța unilateral contractul, fără ca acest lucru să se considere o încălcare a Contractului.</li>
            <li>Dreptul de retragere (retur) este disponibil consumatorilor (persoane fizice), în termen de 14 zile calendaristice de la data primirii produsului, conform OUG nr. 34/2014 privind contractele încheiate la distanță. De asemenea, returul este disponibil și persoanelor juridice, conform politicii comerciale.</li>
          </ul>
        </section>

        <section id="retur" class="pb-8 scroll-mt-24">
          <h2 class="text-2xl font-semibold mb-4 font-serif">VI. Retur</h2>
          <p class="mb-4 font-medium">Dreptul de retragere (retur) este disponibil consumatorilor (persoane fizice), în termen de 14 zile calendaristice de la data primirii produsului, conform OUG nr. 34/2014 privind contractele încheiate la distanță. De asemenea, returul este disponibil și persoanelor juridice, conform politicii comerciale.</p>

          <div class="flex flex-col gap-2 mb-4">
            <h3 class="text-lg font-semibold">1. Condiții de acceptare a returului</h3>
            <p>Pentru a fi acceptat returul, produsul trebuie să fie în aceeași stare în care a fost livrat:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>nefolosit, fără urme de utilizare;</li>
              <li>fără lovituri, zgârieturi sau deteriorări;</li>
              <li>însoțit de toate accesoriile cu care a fost livrat;</li>
              <li>în ambalajul original (acolo unde este cazul) și ambalat corespunzător pentru transport în siguranță. </li>
            </ul>
          </div>

          <div class="flex flex-col gap-2 mb-4">
            <h3 class="text-lg font-semibold">2. Cum puteți solicita returul</h3>
            <p>Solicitările de retur pentru comenzile se transmit exclusiv prin completarea formularului de retur disponibil la următorul link:</p>
            <p>După înregistrarea cererii de retur, aveți două opțiuni:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Preluare prin Eurotimalex SRL de la adresa comunicată; sau</li>
              <li>Expediere directă către sediul nostru din: Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, București</li>
              <li>Destinatar: Eurotimalex SRL</li>
              <li>(cu menționarea numelui/denumirii clientului și a numărului cererii de retur)</li>
            </ul>
          </div>

          <div class="flex flex-col gap-2 mb-4">
            <h3 class="text-lg font-semibold">3. Costul transportului pentru retur (suportat de client)</h3>
            <p>Costul transportului pentru retur este suportat de client și se aplică în funcție de tipul produsului/categoriei din care face parte produsul returnat, astfel:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>30 lei pentru colete standard (majoritatea produselor);</li>
              <li>Aceste tarife se aplică indiferent de motivul returului, în situațiile în care returul este solicitat de client și produsul este conform.</li> 
            </ul>
          </div>

          <div class="flex flex-col gap-2 mb-4">
            <h3 class="text-lg font-semibold">4. Rambursare / compensare</h3>
            <p>După verificarea produsului returnat, contravaloarea acestuia va fi:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>restituită;</li>
              <li>compensată cu livrarea altor produse alese de dvs. (la solicitare).</li> 
            </ul>
            <p>Termenul de soluționare a returului este de 14 zile de la data recepționării produsului returnat.</p>
          </div>
          
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">VII. Modificări și Litigii</h2>
          <p><strong>Legislația aplicabilă:</strong> Serviciile oferite sunt guvernate de dispozițiile legilor române (incluzând OUG nr. 34/2014 privind drepturile consumatorilor). În caz de litigiu, se va încerca mai întâi o rezolvare pe cale amiabilă. În eventualitatea unor excepții legale nerezolvate amiabil, litigiile se vor supune instanțelor judecătorești competente de pe raza municipiului București.</p>
          <p class="mt-4"><strong>Acuratețea detaliilor tehnice:</strong> Datele tehnice prezente pe site au un caracter strict informativ și pot suferi modificări fără o înștiințare prealabilă. Fotografiile produselor rămân cu titlu orientativ.</p>
        </section>

      </div>
    </UCard>
  </UContainer>
</template>
