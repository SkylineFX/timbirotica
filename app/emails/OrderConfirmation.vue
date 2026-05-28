<script setup lang="ts">
import { computed } from 'vue'
import { shippingMethodLabel, paymentMethodLabel } from '~~/shared/constants/order'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Address {
  fullName: string
  address: string
  city: string
  county: string
  phone: string
}

interface BillingAddress {
  companyName: string
  cui: string
  onrc: string
  bankName?: string
  iban?: string
  address: string
  city: string
  county: string
}

interface Props {
  orderNumber: string
  customerName: string
  total: number
  shippingCost: number
  items: OrderItem[]
  shippingAddress?: Address
  billingAddress?: BillingAddress
  orderDate: string
  paymentMethod: string
  shippingMethod: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => []
})

const formattedDate = computed(() => {
  if (!props.orderDate) return ''
  return new Date(props.orderDate).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' })
})

const formattedShippingMethod = computed(() => shippingMethodLabel(props.shippingMethod))
const formattedPaymentMethod = computed(() => paymentMethodLabel(props.paymentMethod))
</script>

<template>
  <EHtml>
    <EHead />
    <EPreview>Timbirotica - Îți mulțumim pentru comandă! Detaliile și statusul comenzii sunt în acest email.</EPreview>
    <EBody style="background-color: #f6f9fc; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;">
      <EContainer style="background-color: #ffffff; margin: 0 auto; padding: 10px 0 12px; margin-bottom: 32px; max-width: 600px;">
        <ESection style="padding: 0 24px;">
          <img src="https://cdn.timbirotica.ro/uploads/logo.png" alt="Timbirotica" width="213" height="40" style="height: 40px; width: 213px; display: block; border: 0; outline: none; text-decoration: none;" />

          <EHeading style="font-size: 24px; line-height: 1.3; font-weight: 700; color: #484848; margin-top: 48px;">
            Îți mulțumim pentru comandă!
          </EHeading>

          <EText style="font-size: 16px; line-height: 24px; color: #525f7f;">
            Salut {{ customerName }},
          </EText>
          <EText style="font-size: 16px; line-height: 24px; color: #525f7f;">
            Am înregistrat comanda ta cu numărul <strong>#{{ orderNumber }}</strong>.
            <span v-if="shippingMethod === 'courier'">
              În curând o vom pregăti pentru expediere.
            </span>
            <span v-else>
              Vei fi notificat pe email când coletul va fi gata de ridicare.
            </span>
          </EText>

          <ESection style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 16px; margin-top: 24px;">
            <EText style="font-size: 14px; line-height: 24px; margin: 0; color: #475569;">
              <strong>Data:</strong> {{ formattedDate }}<br />
              <strong>Metoda de livrare:</strong> {{ formattedShippingMethod }}<br />
              <strong>Metoda de plată:</strong> {{ formattedPaymentMethod }}
            </EText>
          </ESection>

          <!-- Order Summary -->
          <EHeading style="font-size: 18px; line-height: 1.3; font-weight: 700; color: #484848; margin-top: 32px;">
            Detalii comandă
          </EHeading>

          <EHr style="border-color: #e6ebf1; margin: 20px 0;" />

          <ESection v-for="(item, index) in items" :key="index" style="margin-bottom: 16px;">
            <ERow>
              <EColumn style="width: 70%;">
                <EText style="font-size: 16px; margin: 0; color: #525f7f; font-weight: 500;">
                  {{ item.name }}
                </EText>
                <EText style="font-size: 14px; margin: 4px 0 0; color: #8898aa;">
                  Cantitate: {{ item.quantity }}
                </EText>
              </EColumn>
              <EColumn style="width: 30%; text-align: right;">
                <EText style="font-size: 16px; margin: 0; color: #525f7f; font-weight: 500;">
                  {{ Number(item.price.toFixed(2)) }} RON
                </EText>
              </EColumn>
            </ERow>
          </ESection>

          <EHr style="border-color: #e6ebf1; margin: 20px 0;" />

          <ERow>
            <EColumn style="width: 70%;">
              <EText style="font-size: 16px; margin: 0; color: #525f7f;">Subtotal</EText>
            </EColumn>
            <EColumn style="width: 30%; text-align: right;">
              <EText style="font-size: 16px; margin: 0; color: #525f7f;">{{ Number((total - shippingCost).toFixed(2)) }} RON</EText>
            </EColumn>
          </ERow>

          <ERow v-if="shippingCost >= 0" style="margin-top: 12px;">
            <EColumn style="width: 70%;">
              <EText style="font-size: 16px; margin: 0; color: #525f7f;">Cost livrare</EText>
            </EColumn>
            <EColumn style="width: 30%; text-align: right;">
              <EText style="font-size: 16px; margin: 0; color: #525f7f;">{{ Number(shippingCost.toFixed(2)) }} RON</EText>
            </EColumn>
          </ERow>

          <ERow style="margin-top: 12px;">
            <EColumn style="width: 70%;">
              <EText style="font-size: 18px; margin: 0; font-weight: 700; color: #484848;">Total</EText>
            </EColumn>
            <EColumn style="width: 30%; text-align: right;">
              <EText style="font-size: 18px; margin: 0; font-weight: 700; color: #484848;">{{ Number(total.toFixed(2)) }} RON</EText>
            </EColumn>
          </ERow>

          <!-- Shipping Details -->
          <template v-if="shippingAddress">
            <EHeading style="font-size: 18px; line-height: 1.3; font-weight: 700; color: #484848; margin-top: 48px;">
              Adresa de livrare
            </EHeading>
            <EText style="font-size: 16px; line-height: 24px; color: #525f7f; margin-top: 12px;">
              {{ shippingAddress.fullName }}<br />
              {{ shippingAddress.address }}<br />
              {{ shippingAddress.city }}, {{ shippingAddress.county }}<br />
              Telefon: {{ shippingAddress.phone }}
            </EText>
          </template>

          <!-- Billing Details -->
          <template v-if="billingAddress">
            <EHeading style="font-size: 18px; line-height: 1.3; font-weight: 700; color: #484848; margin-top: 32px;">
              Date de facturare
            </EHeading>
            <EText style="font-size: 16px; line-height: 24px; color: #525f7f; margin-top: 12px;">
              <strong>{{ billingAddress.companyName }}</strong><br />
              CUI: {{ billingAddress.cui }}<br />
              Reg. Com.: {{ billingAddress.onrc }}<br />
              <template v-if="billingAddress.bankName">Banca: {{ billingAddress.bankName }}<br /></template>
              <template v-if="billingAddress.iban">IBAN: {{ billingAddress.iban }}<br /></template>
              {{ billingAddress.address }}<br />
              {{ billingAddress.city }}, {{ billingAddress.county }}
            </EText>
          </template>

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
