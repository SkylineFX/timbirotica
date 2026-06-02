<script setup lang="ts">
useSeoMeta({
  title: 'Termeni si Conditii',
  description: 'Termenii si conditiile de utilizare a magazinului online.',
  ogTitle: 'Termeni si Conditii · Timbirotica',
  ogDescription: 'Termenii si conditiile de utilizare a magazinului online.',
})
</script>

<template>
  <UContainer class="py-8 lg:py-12 max-w-5xl">
    <!-- Header -->
    <div class="mb-8 lg:mb-12">
      <h1 class="text-2xl lg:text-3xl font-bold mb-2 md:mb-4">Termeni si Conditii de Utilizare</h1>
      <p class="text-gray-600">Ultima actualizare: Aprilie 2026</p>
    </div>

    <!-- Content -->
    <UCard :ui="{ root: 'rounded-md', body: 'p-6 sm:p-8' }">
      <div class="space-y-6 text-gray-700 leading-relaxed text-sm lg:text-base divide-y divide-gray-100">

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">I. Despre Noi</h2>
          <p><strong class="font-semibold">Timbirotica</strong> este numele comercial al serviciului de comert electronic oferit de <strong>Eurotimalex SRL</strong>, denumit in continuare "Vanzator", cu sediul in <strong>Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, Bucuresti</strong>, inmatriculata in Registrul Comertului sub nr. <strong>J40/17160/2005</strong>, avand cod unic de inregistrare <strong>RO18034200</strong>.</p>

          <div class="flex flex-col gap-4 mt-4">
            <p>Folosirea acestui site de catre orice persoana (atat fizica cat si juridica) in scopul de a se informa sau de a achizitiona produsele, denumit in continuare "Utilizator" / "Cumparator", reprezinta acordul acestuia fara limitari sau rezerve a prezentilor Termeni si Conditii.</p>

            <div>
              <p>Trimiterea unei comenzi se poate face prin una dintre urmatoarele metode:</p>
              <ul class="list-disc list-inside ml-2 mt-2 space-y-1">
                <li>direct de pe site-ul Vanzatorului</li>
                <li><strong>Prin e-mail la:</strong> <a class="text-primary hover:underline" href="mailto:eurotimalex@yahoo.com">eurotimalex@yahoo.com</a></li>
                <li><strong>Prin telefon la:</strong> <a class="text-primary hover:underline" href="tel:0751022882">0751 022 882</a>.</li>
              </ul>
            </div>

            <p>Vanzatorul va informa Cumparatorul preluarea comenzii, respectiv confirmarea comenzii. Daca Vanzatorul confirma explicit o comanda, acest lucru va implica o acceptare completa a termenilor comenzii. Acceptarea comenzii de catre Vanzator se considera finalizata atunci cand exista o confirmare scrisa (e-mail, SMS) din partea Vanzatorului catre Cumparator, fara a necesita o confirmare de primire din partea acestuia din urma. Comanda se considera valida numai dupa confirmarea de catre Vanzator a disponibilitatii stocului, a pretului precum si a caracteristicilor produselor respectiv a serviciilor solicitate de Cumparator.</p>
          </div>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">II. Datele dvs. cu caracter personal</h2>
          <p>Site-ul prelucreaza date cu caracter personal furnizate de dumneavoastra in conformitate cu Regulamentul UE 2016/679 (GDPR) si cu legislatia romana aplicabila. Pentru detalii privind categoriile de date colectate, scopurile prelucrarii, destinatarii, durata de pastrare si drepturile dumneavoastra, va rugam sa consultati <NuxtLink to="/politica-de-confidentialitate" class="text-primary hover:underline">Politica de Confidentialitate</NuxtLink>.</p>
          <p class="mt-2">Prin navigarea pe site, crearea unui cont sau plasarea unei comenzi, declarati ca ati citit si sunteti de acord cu Politica de Confidentialitate.</p>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">III. Inregistrarea ca utilizator</h2>
          <p>Site-ul poate fi accesat in mod gratuit, iar simpla navigare in paginile acestuia nu este conditionata de inregistrarea ca utilizator (crearea unui cont pe site). Pentru a beneficia insa de anumite servicii (precum achizitionarea produselor, verificarea situatiei comenzilor proprii), va trebui sa va creati un cont de utilizator.</p>
          <p>Inregistrarea ca utilizator presupune acceptarea prealabila de catre dvs. a Termenilor si Conditiilor de utilizare si a <a class="text-primary hover:underline" href="/politica-de-confidentialitate">Politicii de Confidentialitate</a>.</p>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">IV. Reguli privind utilizarea site-ului</h2>
          <p>Prin accesarea, vizitarea, plasarea unei comenzi sau desfasurarea oricarei alte activitati pe site, va obligati sa respectati urmatoarele reguli:</p>
          <ol class="list-decimal pl-5 mt-2 space-y-1">
            <li>Veti folosi acest site exclusiv pentru efectuarea de comenzi legitime sau pentru informare.</li>
            <li>Veti furniza informatii reale, exacte, complete si actualizate.</li>
            <li>Nu veti desfasura nicio actiune care ar putea aduce prejudicii site-ului, inclusiv tentative de acces neautorizat, supraincarcare a serverelor sau exploatarea unor vulnerabilitati.</li>
          </ol>
          <p class="mt-4">Ne rezervam dreptul de a bloca accesul oricarui utilizator care incalca regulile de mai sus, de a anula comenzile si de a sesiza autoritatile competente in cazul unor abuzuri.</p>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">V. Procedura de cumparare</h2>
          <p>Pentru a cumpara si intra in posesia produselor oferite spre vanzare este necesara parcurgerea urmatoarelor etape:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>Identificarea si alegerea produselor, finalizand adaugarea lor in Cos.</li>
            <li>Efectuarea platii produselor (transfer bancar pe baza facturii proforme sau numerar la livrare).</li>
            <li>Livrarea produselor comandate.</li>
          </ul>
          <p class="mt-4">Prin lansarea unei comenzi pe site, Cumparatorul este de acord cu forma de comunicare (e-mail, telefon) prin care Vanzatorul isi deruleaza operatiunile pe site si isi exprima acordul privind incheierea contractului.</p> 

          <p class="mt-2">Comanda poate fi anulata oricand de catre Cumparator inainte de confirmarea acesteia de catre Vanzator din sectiunea <NuxtLink to="/user/comenzi" class="text-primary hover:underline underline-offset-4">Comenzi</NuxtLink>. In cazul in care comanda a fost confirmata, Cumparatorul poate solicita anularea comenzii prin formularul de <NuxtLink href="/contact" class="text-primary hover:underline underline-offset-4">Contact</NuxtLink>, e-mail sau telefonic. </p>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">VI. Disponibilitatea produselor</h2>
          <p>Desi incercam sa mentinem informatiile despre disponibilitate actualizate in timp real, nu putem garanta ca un produs care s-a regasit la un moment dat pe site va fi disponibil in orice moment pentru achizitie.</p>
          <p class="mt-4"><strong>Indisponibilitate ulterioara plasarii comenzii.</strong> In cazul in care un produs din comanda dumneavoastra devine indisponibil dupa plasarea comenzii, va vom informa in cel mai scurt timp si va vom propune una dintre urmatoarele optiuni:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>inlocuirea produsului cu unul similar, la valoare egala sau apropiata;</li>
            <li>mentinerea comenzii pentru produsele disponibile si anularea celor indisponibile;</li>
            <li>anularea integrala a comenzii.</li>
          </ul>
          <p class="mt-4">In cazul in care ati achitat in avans produse care s-au dovedit indisponibile, vom proceda la rambursarea integrala a sumelor de bani aferente, in cel mai scurt timp posibil.</p>
        </section>

        <section id="plata" class="pb-8 scroll-mt-24">
          <h2 class="text-2xl font-semibold mb-4 font-serif">VII. Preturile si Plata</h2>
          <p>Cu exceptia cazurilor in care este specificat altfel, preturile produselor afisate reprezinta preturile finale de cumparare si <strong>includ TVA</strong>.</p>
          <p class="mt-2">Daca adresa de livrare difera de adresa de facturare, aveti posibilitatea de a le distinge direct in sectiunea de Checkout (Finalizare comanda). Informatiile transmise trebuie sa fie integral corecte, altfel comanda poate fi intarziata.</p>

          <p class="mt-4 font-semibold">Optiunile de plata acceptate sunt:</p>
          <ol class="list-decimal list-inside pl-5 mt-2 space-y-1">
            <li><strong>Plata ramburs:</strong> in numerar (maxim 5000 RON), pentru livrare la adresa, catre curier sau la ridicarea comenzii din sediul nostru.</li>
            <li><strong>Transfer bancar:</strong> In acest caz, se va emite o factura proforma care se va transmite la adresa de e-mail comunicata de catre client, iar dupa efectuarea platii comanda va fi pregatita pentru livrare.</li>
          </ol>
        </section>

        <section id="livrare" class="pb-8 scroll-mt-24">
          <h2 class="text-2xl font-semibold mb-4 font-serif">VIII. Livrare</h2>

          <div class="flex flex-col gap-2 mb-4">
            <p>Livrarea comenzilor se poate face in urmatoarele moduri:</p>
            <ol class="list-decimal pl-5 space-y-2">
              <li><strong>Ridicare de la <a href="/despre-noi/#locatie" class="text-primary hover:underline">sediul nostru:</a></strong> Strada Drumul Taberei Nr. 92, Bloc C7, Sc. F, Et. 4, Ap. 216, Sector 6, Bucuresti.</li>
              <li><strong>Cu masinile proprii</strong>: Momentan, livrarile se efectueaza doar in Bucuresti si Ilfov.</li>
            </ol>
          </div>

          <p class="mt-4 font-medium">Costuri de livrare:</p>
          <ul class="list-disc pl-5 mt-2 space-y-2">
            <li>Livrarea este <strong>GRATUITA</strong> pentru comenzi mai mari de 200 lei (TVA inclus) si care au maxim 40kg.</li>
            <li>Pentru comenzi mai mici de 200 lei si cu greutate sub 40kg, se va aplica o taxa de livrare de <strong>30.00 lei</strong> (TVA inclus).</li>
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
          <p class="font-medium">Dreptul de retragere (retur) este disponibil consumatorilor (persoane fizice), in termen de 14 zile calendaristice de la data primirii produsului, conform OUG nr. 34/2014 privind contractele incheiate la distanta. De asemenea, returul este disponibil si persoanelor juridice, conform politicii comerciale.</p>

          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-semibold">1. Conditii de acceptare a returului</h3>
            <p>Pentru a fi acceptat returul, produsul trebuie sa fie in aceeasi stare in care a fost livrat:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>nefolosit, fara urme de utilizare;</li>
              <li>fara lovituri, zgarieturi sau deteriorari;</li>
              <li>insotit de toate accesoriile cu care a fost livrat;</li>
              <li>in ambalajul original (acolo unde este cazul) si ambalat corespunzator pentru transport in siguranta. </li>
            </ul>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-semibold">2. Cum puteti solicita returul</h3>
            <p>Solicitarile de retur pentru comenzile se transmit telefonic sau prin completarea <NuxtLink to="/contact" class="text-primary">formularului de contact</NuxtLink>.</p>
            <p>Dupa primirea solicitarii dumneavoastra, va vom contacta in cel mai scurt timp pentru a stabili modalitatea de solutionare a acesteia.</p>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-semibold">3. Costul transportului pentru retur (suportat de client)</h3>
            <p>Costul transportului pentru retur este suportat de client si se aplica in functie de tipul produsului/categoriei din care face parte produsul returnat, astfel:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>30 lei pentru colete standard;</li>
            </ul>
            <p>Aceste tarife se aplica indiferent de motivul returului, in situatiile in care returul este solicitat de client si produsul este conform.</p>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-semibold">4. Rambursare / compensare</h3>
            <p>Dupa verificarea produsului returnat, contravaloarea acestuia va fi:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>restituita;</li>
              <li>compensata cu livrarea altor produse alese de dvs. (la solicitare).</li>
            </ul>
            <p>Termenul de solutionare a returului este de 14 zile de la data receptionarii produsului returnat.</p>
          </div>
        </section>

        <section class="pb-8">
          <h2 class="text-2xl font-semibold mb-4 font-serif">X. Modificari</h2>
          <p><strong>Modificarea Termenilor.</strong> Ne rezervam dreptul de a modifica oricand Termenii si Conditiile. Comenzii dumneavoastra i se vor aplica termenii care sunt in vigoare la momentul plasarii comenzii. Versiunea cea mai recenta va fi disponibila in permanenta pe site.</p>
          <p class="mt-2"><strong>Acuratetea detaliilor tehnice.</strong> Datele tehnice prezente pe site au un caracter strict informativ si pot suferi modificari fara o instiintare prealabila. Fotografiile produselor raman cu titlu orientativ.</p>
        </section>

      </div>
    </UCard>
  </UContainer>
</template>
