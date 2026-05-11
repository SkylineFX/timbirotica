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
      <h1 class="text-2xl lg:text-3xl font-bold mb-2 md:mb-4">Termeni și Condiții de Utilizare</h1>
      <p class="text-gray-600">Ultima actualizare: Aprilie 2026</p>
    </div>

    <!-- Content -->
    <UCard :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
      <div class="space-y-6 text-gray-700 leading-relaxed text-sm lg:text-base divide-y divide-gray-100">

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">I. Despre Noi</h2>
          <p>Serviciul de comert electronic este oferit de <strong>Eurotimalex SRL</strong>, denumit in continuare "Vanzator", cu sediul în <strong>Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, București</strong>, înmatriculată în Registrul Comerțului sub nr. <strong>J40/17160/2005</strong>, având cod unic de înregistrare <strong>RO18034200</strong>.</p>

          <div class="flex flex-col gap-4 mt-4">
            <p>Folosirea acestui site de către orice persoană (atât fizică cât și juridică) în scopul de a se informa sau de a achiziționa produsele, denumit în continuare "Utilizator" / "Cumpărător", reprezintă acordul acestuia fără limitări sau rezerve a prezenților Termeni și Condiții.</p>

            <div>
              <p>Trimiterea unei comenzi se poate face prin una dintre următoarele metode:</p>
              <ul class="list-disc list-inside ml-2 mt-2 space-y-1">
                <li>direct de pe site-ul Vânzătorului</li>
                <li><strong>Prin e-mail la:</strong> <a class="text-primary hover:underline" href="mailto:eurotimalex@yahoo.com">eurotimalex@yahoo.com</a></li>
                <li><strong>Prin telefon la:</strong> <a class="text-primary hover:underline" href="tel:+40751022882">+40 751 022 882</a>.</li>
              </ul>
            </div>

            <p>Prin lansarea unei comenzi pe site, Cumpărătorul este de acord cu forma de comunicare (e-mail, SMS, telefon) prin care Vânzătorul își derulează operațiunile pe site și își exprimă acordul privind încheierea contractului.</p>
            <p>Vânzătorul va informa Cumpărătorul preluarea comenzii, respectiv confirmarea comenzii. Dacă Vânzătorul confirmă explicit o comandă, acest lucru va implica o acceptare completă a termenilor comenzii. Acceptarea comenzii de către Vânzător se consideră finalizată atunci când există o confirmare scrisă (e-mail, SMS) din partea Vânzătorului către Cumpărător, fără a necesita o confirmare de primire din partea acestuia din urmă. Comanda se consideră validă numai după confirmarea de către Vânzător a disponibilității stocului, a prețului precum și a caracteristicilor produselor respectiv a serviciilor solicitate de Cumpărător.</p>
          </div>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">II. Datele dvs. cu caracter personal</h2>
          <p>Site-ul prelucrează date cu caracter personal furnizate de dumneavoastră în conformitate cu Regulamentul UE 2016/679 (GDPR) și cu legislația română aplicabilă. Pentru detalii privind categoriile de date colectate, scopurile prelucrării, destinatarii, durata de păstrare și drepturile dumneavoastră, vă rugăm să consultați <NuxtLink to="/politica-de-confidentialitate" class="text-primary hover:underline">Politica de Confidențialitate</NuxtLink>.</p>
          <p class="mt-2">Prin navigarea pe site, crearea unui cont sau plasarea unei comenzi, declarați că ați citit și sunteți de acord cu Politica de Confidențialitate.</p>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">III. Înregistrarea ca utilizator</h2>
          <p>Site-ul poate fi accesat în mod gratuit, iar simpla navigare în paginile acestuia nu este condiționată de înregistrarea ca utilizator (crearea unui cont pe site). Pentru a beneficia însă de anumite servicii (precum achiziționarea produselor, verificarea situației comenzilor proprii), va trebui să vă creați un cont de utilizator.</p>
          <p>Înregistrarea ca utilizator presupune acceptarea prealabilă de către dvs. a Termenilor și Condițiilor de utilizare și a <a class="text-primary hover:underline" href="/politica-de-confidentialitate">Politicii de Confidențialitate</a>.</p>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">IV. Reguli privind utilizarea site-ului</h2>
          <p>Prin accesarea, vizitarea, plasarea unei comenzi sau desfășurarea oricărei alte activități pe site, vă obligați să respectați următoarele reguli:</p>
          <ol class="list-decimal pl-5 mt-2 space-y-1">
            <li>Veți folosi acest site exclusiv pentru efectuarea de comenzi legitime sau pentru informare.</li>
            <li>Veți furniza informații reale, exacte, complete și actualizate.</li>
            <li>Nu veți desfășura nicio acțiune care ar putea aduce prejudicii site-ului, inclusiv tentative de acces neautorizat, supraîncărcare a serverelor sau exploatarea unor vulnerabilități.</li>
          </ol>
          <p class="mt-4">Ne rezervăm dreptul de a bloca accesul oricărui utilizator care încalcă regulile de mai sus, de a anula comenzile si de a sesiza autoritățile competente in cazul unor abuzuri.</p>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">V. Procedura de cumpărare</h2>
          <p>Pentru a cumpăra și intra în posesia produselor oferite spre vânzare este necesară parcurgerea următoarelor etape:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>Identificarea și alegerea produselor, finalizând adăugarea lor in Coș.</li>
            <li>Efectuarea plății produselor (transfer bancar pe baza facturii sau numerar la livrare).</li>
            <li>Livrarea produselor comandate.</li>
          </ul>
          <p class="mt-4">Prin lansarea unei comenzi electronice, sunteți de acord cu forma de comunicare prin care Site-ul își derulează operațiunile.</p>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">VI. Disponibilitatea produselor</h2>
          <p>Deși încercăm să menținem informațiile despre disponibilitate actualizate în timp real, nu putem garanta că un produs care s-a regăsit la un moment dat pe site va fi disponibil în orice moment pentru achiziție.</p>
          <p class="mt-4"><strong>Indisponibilitate ulterioară plasării comenzii.</strong> În cazul în care un produs din comanda dumneavoastră devine indisponibil după plasarea comenzii, vă vom informa în cel mai scurt timp și vă vom propune una dintre următoarele opțiuni:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>înlocuirea produsului cu unul similar, la valoare egală sau apropiată;</li>
            <li>menținerea comenzii pentru produsele disponibile și anularea celor indisponibile;</li>
            <li>anularea integrală a comenzii.</li>
          </ul>
          <p class="mt-4">În cazul în care ați achitat în avans produse care s-au dovedit indisponibile, vom proceda la rambursarea integrală a sumelor de bani aferente, în cel mai scurt timp posibil.</p>
        </section>

        <section id="plata" class="pb-8 scroll-mt-24">
          <h2 class="text-2xl font-semibold mb-4 font-serif">VII. Prețurile și Plata</h2>
          <p>Cu excepția cazurilor în care este prevăzut altfel, prețurile produselor afișate reprezintă prețurile finale de cumpărare și <strong>includ TVA</strong> (taxa pe valoare adăugată valabilă în România conform codului fiscal curent).</p>
          <p>Dacă adresa de livrare nu este aceeași cu adresa de facturare, aveți posibilitatea de a le distinge direct în secțiunea de Checkout (Finalizare comandă). Informațiile transmise trebuie să fie integral corecte, altfel comanda poate fi întârziată sau neonorată.</p>

          <p class="mt-4 font-semibold">Opțiunile de plată acceptate sunt:</p>
          <ol class="list-decimal list-inside pl-5 mt-2 space-y-1">
            <li><strong>Plata ramburs:</strong> in numerar (maxim 5000 RON), pentru livrare la adresa, catre curier sau la ridicarea comenzii din sediul nostru.</li>
            <li><strong>Ordin de plata / virament bancar.</strong> In acest caz, se va emite o factura proforma care se va transmite la adresa de e-mail comunicata de catre client, iar dupa efectuarea platii comanda va fi pregatita pentru livrare.</li>
          </ol>
        </section>

        <section id="livrare" class="pb-8 scroll-mt-24">
          <h2 class="text-2xl font-semibold mb-4 font-serif">VIII. Livrare</h2>

          <div class="flex flex-col gap-2 mb-4">
            <p>Livrarea comenzilor se poate face în următoarele moduri:</p>
            <ol class="list-decimal pl-5 space-y-2">
              <li><strong>Ridicare de la <a href="/despre-noi/#locatie" class="text-primary hover:underline">sediul nostru:</a></strong> Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, București.</li>
              <li><strong>Cu mașinile proprii</strong>: Momentan, livrările se efectuează doar în București și Ilfov.</li>
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
            <li>24 - 48 de ore, pentru comenzile plasate in zile lucratoare (poate fi influentat de durata expedierii de catre curier).</li>
          </ul>

          <p class="mt-4 font-semibold">Transport GRATUIT pentru comenzile eligibile:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>Transport gratuit pentru comenzile de peste 200 lei, livrate in Bucuresti si Ilfov. </li>
          </ul>
        </section>

        <section id="retur" class="pb-8 flex flex-col gap-4 scroll-mt-24">
          <h2 class="text-2xl font-semibold font-serif">IX. Retur</h2>
          <p class="font-medium">Dreptul de retragere (retur) este disponibil consumatorilor (persoane fizice), în termen de 14 zile calendaristice de la data primirii produsului, conform OUG nr. 34/2014 privind contractele încheiate la distanță. De asemenea, returul este disponibil și persoanelor juridice, conform politicii comerciale.</p>

          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-semibold">1. Condiții de acceptare a returului</h3>
            <p>Pentru a fi acceptat returul, produsul trebuie să fie în aceeași stare în care a fost livrat:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>nefolosit, fără urme de utilizare;</li>
              <li>fără lovituri, zgârieturi sau deteriorări;</li>
              <li>însoțit de toate accesoriile cu care a fost livrat;</li>
              <li>în ambalajul original (acolo unde este cazul) și ambalat corespunzător pentru transport în siguranță. </li>
            </ul>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-semibold">2. Cum puteți solicita returul</h3>
            <p>Solicitările de retur pentru comenzile se transmit telefonic sau prin completarea <NuxtLink to="/contact" class="text-primary">formularului de contact</NuxtLink>.</p>
            <p>După primirea solicitării dumneavoastră, vă vom contacta în cel mai scurt timp pentru a stabili modalitatea de soluționare a acesteia.</p>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-semibold">3. Costul transportului pentru retur (suportat de client)</h3>
            <p>Costul transportului pentru retur este suportat de client și se aplică în funcție de tipul produsului/categoriei din care face parte produsul returnat, astfel:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>30 lei pentru colete standard;</li>
            </ul>
            <p>Aceste tarife se aplică indiferent de motivul returului, în situațiile în care returul este solicitat de client și produsul este conform.</p>
          </div>

          <div class="flex flex-col gap-2">
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
          <h2 class="text-2xl font-semibold mb-4 font-serif">X. Modificări</h2>
          <p><strong>Modificarea Termenilor.</strong> Ne rezervăm dreptul de a modifica oricând Termenii și Condițiile. Comenzii dumneavoastră i se vor aplica termenii care sunt în vigoare la momentul plasării comenzii. Versiunea cea mai recentă va fi disponibilă în permanență pe site.</p>
          <p class="mt-2"><strong>Acuratețea detaliilor tehnice.</strong> Datele tehnice prezente pe site au un caracter strict informativ și pot suferi modificări fără o înștiințare prealabilă. Fotografiile produselor rămân cu titlu orientativ.</p>
        </section>

      </div>
    </UCard>
  </UContainer>
</template>
