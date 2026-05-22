<script setup lang="ts">
interface Props {
  firstName: string
  resetLink: string
}

defineProps<Props>()
</script>

<template>
  <EHtml>
    <EHead />
    <EPreview>Timbirotica - Resetare parolă. Folosește linkul din email pentru a-ți seta o nouă parolă.</EPreview>
    <EBody style="background-color: #f6f9fc; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;">
      <EContainer style="background-color: #ffffff; margin: 0 auto; padding: 10px 0 48px; max-width: 600px;">
        <ESection style="padding: 0 24px;">
          <img src="https://timbirotica.ro/logo.png" alt="Timbirotica" width="213" height="40" style="height: 40px; width: 213px; display: block; border: 0; outline: none; text-decoration: none;" />

          <EHeading style="font-size: 24px; line-height: 1.3; font-weight: 700; color: #484848; margin-top: 48px;">
            Resetare parolă
          </EHeading>

          <EText style="font-size: 16px; line-height: 24px; color: #525f7f;">
            Salut {{ firstName }},
          </EText>
          <EText style="font-size: 16px; line-height: 24px; color: #525f7f;">
            Am primit o solicitare de resetare a parolei pentru contul tău. Apasă butonul de mai jos pentru a seta o parolă nouă. Link-ul este valabil timp de <strong>1 oră</strong>.
          </EText>

          <ESection style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
            <EButton :href="resetLink" style="background-color: #000000; border-radius: 4px; color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; padding: 12px 32px; display: inline-block;">
              Resetează parola
            </EButton>
          </ESection>

          <EText style="font-size: 14px; line-height: 24px; color: #8898aa;">
            Dacă nu ai solicitat resetarea parolei, poți ignora acest email în siguranță.
          </EText>

          <EText style="font-size: 13px; line-height: 22px; color: #aab7c4; word-break: break-all;">
            Sau copiază și lipește acest link în browser:<br />
            {{ resetLink }}
          </EText>

          <EHr style="border-color: #e6ebf1; margin: 48px 0 24px;" />

          <EText style="font-size: 14px; line-height: 24px; color: #8898aa;">
            Eurotimalex SRL<br />
            Strada Drumul Taberei Nr. 92, București<br />
            J40/17160/2005
          </EText>
        </ESection>
      </EContainer>
    </EBody>
  </EHtml>
</template>
