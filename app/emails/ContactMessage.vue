<script setup lang="ts">
interface Props {
  name: string
  email: string
  subject: string
  message: string
}

defineProps<Props>()
</script>

<template>
  <EHtml>
    <EHead />
    <EPreview>Mesaj nou din formularul de contact: {{ subject }}</EPreview>
    <EBody style="background-color: #f6f9fc; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;">
      <EContainer style="background-color: #ffffff; margin: 0 auto; padding: 10px 0 48px; max-width: 600px;">
        <ESection style="padding: 0 24px;">
          <img src="https://timbirotica.ro/logo.png" alt="Timbirotica" width="213" height="40" style="height: 40px; width: 213px; display: block; border: 0; outline: none; text-decoration: none;" />

          <EHeading style="font-size: 24px; line-height: 1.3; font-weight: 700; color: #484848; margin-top: 48px;">
            Mesaj nou din formularul de contact
          </EHeading>

          <EText style="font-size: 14px; line-height: 22px; color: #8898aa; margin-bottom: 4px;">
            Nume
          </EText>
          <EText style="font-size: 16px; line-height: 24px; color: #525f7f; margin-top: 0;">
            {{ name }}
          </EText>

          <EText style="font-size: 14px; line-height: 22px; color: #8898aa; margin-bottom: 4px;">
            Email
          </EText>
          <EText style="font-size: 16px; line-height: 24px; color: #525f7f; margin-top: 0;">
            {{ email }}
          </EText>

          <EText style="font-size: 14px; line-height: 22px; color: #8898aa; margin-bottom: 4px;">
            Subiect
          </EText>
          <EText style="font-size: 16px; line-height: 24px; color: #525f7f; margin-top: 0;">
            {{ subject }}
          </EText>

          <EHr style="border-color: #e6ebf1; margin: 24px 0;" />

          <EText style="font-size: 14px; line-height: 22px; color: #8898aa; margin-bottom: 4px;">
            Mesaj
          </EText>
          <EText style="font-size: 16px; line-height: 24px; color: #525f7f; margin-top: 0; white-space: pre-wrap;">{{ message }}</EText>

          <EHr style="border-color: #e6ebf1; margin: 48px 0 24px;" />

          <EText style="font-size: 14px; line-height: 24px; color: #8898aa;">
            Poti raspunde direct la acest email pentru a-i scrie expeditorului.
          </EText>
        </ESection>
      </EContainer>
    </EBody>
  </EHtml>
</template>
