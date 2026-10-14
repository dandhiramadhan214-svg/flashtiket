<script setup>
import { computed, onMounted, ref } from 'vue';
import { useTicketStore } from '../stores/ticketStore';
import { useQueueStore } from '../stores/queueStore';
import { useEventsStore } from '../stores/eventsStore';
import { useAuthStore } from '../stores/authStore';
import { usePaymentStore } from '../stores/paymentStore';
import SvgIcon from './SvgIcon.vue';

const ticketStore = useTicketStore();
const queueStore = useQueueStore();
const eventsStore = useEventsStore();
const authStore = useAuthStore();
const paymentStore = usePaymentStore();

const currentEvent = computed(() => eventsStore.selectedEvent);
const isProcessing = ref(false);
const paymentMethod = ref('instant'); // 'midtrans' or 'instant'

onMounted(async () => {
  if (authStore.isLoggedIn) {
    ticketStore.customer.name = authStore.currentUser.name;
    ticketStore.customer.email = authStore.currentUser.email;
    ticketStore.customer.phone = authStore.currentUser.phone;
    ticketStore.customer.nik = authStore.currentUser.nik;
  }
  paymentStore.loadSnapJS();
});

async function handleMidtransPayment() {
  isProcessing.value = true;
  paymentStore.reset();

  try {
    const result = await paymentStore.initiatePayment(ticketStore.currentOrderId);

    if (result.status === 'success') {
      const success = ticketStore.confirmPayment();
      if (success) {
        authStore.addPurchasedTicket({
          orderId: ticketStore.issuedTicket.orderId,
          eventTitle: currentEvent.value.title,
          venue: `${currentEvent.value.venue}, ${currentEvent.value.city}`,
          date: currentEvent.value.date,
          seatNo: ticketStore.issuedTicket.seatNo,
          categoryName: ticketStore.issuedTicket.categoryName,
          totalPaid: ticketStore.issuedTicket.totalPaid,
          issuedAt: ticketStore.issuedTicket.issuedAt,
          paymentMethod: result.simulated ? 'Simulated' : 'Midtrans',
          transactionId: result.result?.transaction_id || null,
        });
        queueStore.setStage('ticket');
      }
    } else if (result.status === 'pending') {
      alert('Pembayaran sedang diproses di gateway.');
    }
  } catch (err) {
    console.error('Payment error:', err);
  } finally {
    isProcessing.value = false;
  }
}

function handleInstantPayment() {
  const success = ticketStore.confirmPayment();
  if (success) {
    authStore.addPurchasedTicket({
      orderId: ticketStore.issuedTicket.orderId,
      eventTitle: currentEvent.value.title,
      venue: `${currentEvent.value.venue}, ${currentEvent.value.city}`,
      date: currentEvent.value.date,
      seatNo: ticketStore.issuedTicket.seatNo,
      categoryName: ticketStore.issuedTicket.categoryName,
      totalPaid: ticketStore.issuedTicket.totalPaid,
      issuedAt: ticketStore.issuedTicket.issuedAt,
      paymentMethod: 'Instant Simulated',
    });
    queueStore.setStage('ticket');
  }
}

function handleConfirmPayment() {
  if (paymentMethod.value === 'midtrans') {
    handleMidtransPayment();
  } else {
    handleInstantPayment();
  }
}

function handleCancel() {
  if (confirm('Yakin membatalkan? Kuota tiket akan otomatis dikembalikan ke publik.')) {
    ticketStore.autoRollback('USER_MANUAL_CANCEL');
    paymentStore.reset();
    queueStore.setStage('selection');
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-8">

    <!-- Timer Countdown Inverted Alert (Pure Black) -->
    <div class="bg-black text-white border-2 border-black p-6 flex flex-col sm:flex-row items-center justify-between gap-6 font-mono pattern-lines-inverted">
      <div class="space-y-1 text-center sm:text-left">
        <div class="text-[10px] tracking-widest text-white/70 uppercase">DISTRIBUTED LOCK AKTIF (TTL: 600s)</div>
        <div class="font-serif font-bold text-xl text-white">Kursi Telah Dikunci di Memori Redis</div>
        <p class="text-xs text-white/60 normal-case">
          Event: <strong class="text-white">{{ currentEvent.title }}</strong>
        </p>
      </div>

      <div class="border-2 border-white px-6 py-3 text-center shrink-0 w-full sm:w-auto">
        <div class="text-[10px] text-white/70 uppercase tracking-widest">Sisa Waktu Bayar</div>
        <div class="text-3xl font-serif font-black text-white">{{ ticketStore.lockTimerFormatted }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      <!-- Left: Customer Info Form (Bottom-Border-Only Inputs) -->
      <div class="md:col-span-7 border-2 border-black p-8 space-y-6 bg-white">
        <div class="flex items-center justify-between border-b-2 border-black pb-3">
          <h3 class="font-serif font-bold text-xl text-black">
            Data Pemegang Tiket
          </h3>

          <button 
            v-if="!authStore.isLoggedIn"
            @click="authStore.openLogin()"
            class="font-mono text-xs text-black underline uppercase"
          >
            [Sudah punya akun? Masuk]
          </button>
        </div>

        <div class="space-y-5 font-mono text-xs">
          <div>
            <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">
              Nama Lengkap (Sesuai KTP / Paspor)
            </label>
            <input 
              v-model="ticketStore.customer.name" 
              type="text"
              class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-serif font-semibold focus:border-b-4 focus:outline-none transition-all" 
            />
          </div>

          <div>
            <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">
              Nomor Induk Kependudukan (NIK)
            </label>
            <input 
              v-model="ticketStore.customer.nik" 
              type="text"
              class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-mono focus:border-b-4 focus:outline-none transition-all" 
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">
                Alamat Email E-Tiket
              </label>
              <input 
                v-model="ticketStore.customer.email" 
                type="email"
                class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-mono focus:border-b-4 focus:outline-none transition-all" 
              />
            </div>
            <div>
              <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">
                Nomor WhatsApp
              </label>
              <input 
                v-model="ticketStore.customer.phone" 
                type="text"
                class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-mono focus:border-b-4 focus:outline-none transition-all" 
              />
            </div>
          </div>

          <!-- Multi-Attendee Friends Form (Anti-Scalping 1 Tiket 1 NIK) -->
          <div v-if="ticketStore.quantity > 1" class="border-t-2 border-black pt-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-serif font-bold text-base text-black flex items-center gap-2">
                  <span>Data Teman Rombongan (Tiket #2 - #{{ ticketStore.quantity }})</span>
                </div>
                <div class="text-[10px] text-[#525252] mt-0.5">
                  🛡️ Aturan Anti-Calo Resmi: Tiap lembar tiket terikat dengan nama &amp; NIK KTP teman.
                </div>
              </div>
              <span class="border border-black px-2 py-0.5 text-[10px] font-bold bg-black text-white">
                {{ ticketStore.quantity - 1 }} TEMAN
              </span>
            </div>

            <!-- Dynamic Form for each friend -->
            <div class="space-y-4 max-h-80 overflow-y-auto pr-1">
              <div 
                v-for="(att, idx) in ticketStore.attendees.slice(1)" 
                :key="att.index"
                class="border border-black p-3 bg-[#F9F9F9] space-y-3"
              >
                <div class="flex items-center justify-between text-[11px] font-bold border-b border-[#E5E5E5] pb-1">
                  <span>TIKET #{{ att.index }} (KURSI: {{ ticketStore.selectedSeats[att.index - 1] || 'FESTIVAL' }})</span>
                  <span class="text-[10px] text-[#525252]">TERVERIFIKASI ID</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[9px] uppercase tracking-wider text-[#525252] mb-0.5">
                      Nama Teman #{{ att.index }}
                    </label>
                    <input 
                      v-model="att.name"
                      type="text" 
                      placeholder="Nama Lengkap KTP"
                      class="w-full bg-transparent border-b border-black py-1 text-xs text-black font-serif focus:border-b-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label class="block text-[9px] uppercase tracking-wider text-[#525252] mb-0.5">
                      NIK KTP Teman #{{ att.index }}
                    </label>
                    <input 
                      v-model="att.nik"
                      type="text" 
                      placeholder="3171xxxxxxxxxxxx"
                      class="w-full bg-transparent border-b border-black py-1 text-xs text-black font-mono focus:border-b-2 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Method Selector (Sharp Monochrome) -->
        <div class="border-t-2 border-black pt-6 space-y-4">
          <div class="font-mono text-[10px] uppercase tracking-widest text-[#525252]">METODE TRANSAKSI</div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <!-- Option 1: Instant Pay (Recommended for Demo) -->
            <div 
              @click="paymentMethod = 'instant'"
              class="border-2 p-4 cursor-pointer transition-colors"
              :class="paymentMethod === 'instant' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:border-4'"
            >
              <div class="font-bold uppercase">Instant Pay / VA</div>
              <div class="text-[10px] opacity-70 mt-1">Otomatis Terverifikasi · 0 Detik Delay</div>
              <div class="mt-3 text-[10px] font-bold">
                {{ paymentMethod === 'instant' ? '[● TERPILIH]' : '[○ PILIH]' }}
              </div>
            </div>

            <!-- Option 2: Midtrans Gateway -->
            <div 
              @click="paymentMethod = 'midtrans'"
              class="border-2 p-4 cursor-pointer transition-colors"
              :class="paymentMethod === 'midtrans' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:border-4'"
            >
              <div class="font-bold uppercase">Midtrans Gateway</div>
              <div class="text-[10px] opacity-70 mt-1">QRIS · GoPay · Kartu Kredit</div>
              <div class="mt-3 text-[10px] font-bold">
                {{ paymentMethod === 'midtrans' ? '[● TERPILIH]' : '[○ PILIH]' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Editorial Order Invoice -->
      <div class="md:col-span-5 border-2 border-black p-8 space-y-6 bg-white font-mono">
        <div class="flex items-center justify-between border-b-2 border-black pb-3">
          <h3 class="font-serif font-bold text-xl text-black">Faktur Pesanan</h3>
          <span class="text-[10px] text-[#525252]">{{ ticketStore.currentOrderId }}</span>
        </div>

        <div class="space-y-3 text-xs">
          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">KATEGORI:</span>
            <span class="font-bold text-black text-right">{{ ticketStore.categoryDetails[ticketStore.selectedCategory].name }}</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">NOMOR KURSI:</span>
            <span class="font-bold text-black text-right">{{ ticketStore.selectedSeatName }}</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">JUMLAH:</span>
            <span class="text-black">{{ ticketStore.quantity }} Tiket</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">TARIF TIKET:</span>
            <span class="text-black">{{ ticketStore.formatMoney(ticketStore.unitPrice) }} × {{ ticketStore.quantity }}</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">BOOKING FEE:</span>
            <span class="text-black">{{ ticketStore.formatMoney(ticketStore.bookingFee * ticketStore.quantity) }}</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">PAJAK PPN (11%):</span>
            <span class="text-black">{{ ticketStore.formatMoney(ticketStore.taxAmount) }}</span>
          </div>

          <div class="pt-2 flex justify-between font-serif font-bold text-xl text-black border-t-2 border-black">
            <span>TOTAL:</span>
            <span>{{ ticketStore.formatMoney(ticketStore.grandTotal) }}</span>
          </div>
        </div>

        <!-- Pay Button CTA -->
        <button
          @click="handleConfirmPayment()"
          :disabled="isProcessing || paymentStore.isLoading"
          class="btn-mono-primary w-full py-4 text-xs font-bold"
        >
          <span v-if="isProcessing || paymentStore.isLoading">Memproses Transaksi...</span>
          <span v-else>Konfirmasi Bayar &amp; Terbitkan E-Tiket →</span>
        </button>

        <button 
          @click="handleCancel()"
          :disabled="isProcessing || paymentStore.isLoading"
          class="w-full text-center text-[11px] text-[#525252] hover:text-black font-mono uppercase underline cursor-pointer"
        >
          Batalkan Pesanan &amp; Kembalikan Kuota
        </button>
      </div>
    </div>
  </div>
</template>
