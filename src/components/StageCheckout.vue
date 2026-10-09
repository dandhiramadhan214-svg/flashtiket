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
const paymentMethod = ref('midtrans'); // 'midtrans' or 'instant'

onMounted(async () => {
  if (authStore.isLoggedIn) {
    ticketStore.customer.name = authStore.currentUser.name;
    ticketStore.customer.email = authStore.currentUser.email;
    ticketStore.customer.phone = authStore.currentUser.phone;
    ticketStore.customer.nik = authStore.currentUser.nik;
  }
  // Preload Midtrans Snap.js
  paymentStore.loadSnapJS();
});

async function handleMidtransPayment() {
  isProcessing.value = true;
  paymentStore.reset();

  try {
    const result = await paymentStore.initiatePayment(ticketStore.currentOrderId);

    if (result.status === 'success') {
      // Payment success — confirm and issue ticket
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
      // Show pending notice
      alert('Pembayaran sedang diproses. Anda akan menerima notifikasi setelah pembayaran terkonfirmasi.');
    }
    // 'failed' and 'closed' are handled via paymentStore.errorMessage
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
  if (confirm('Yakin membatalkan? Kursi akan dilepas kembali ke antrean publik.')) {
    ticketStore.autoRollback('USER_MANUAL_CANCEL');
    paymentStore.reset();
    queueStore.setStage('selection');
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

    <!-- Timer Alert (Responsive & Full Dark Mode Support) -->
    <div class="bg-coral-light dark:bg-rose-950/40 border border-coral/20 dark:border-rose-800/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-coral/10 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
          <SvgIcon name="alarm" className="w-5 h-5 text-coral dark:text-rose-400" />
        </div>
        <div>
          <div class="font-bold text-slate-800 dark:text-white text-sm sm:text-base">Kursi Berhasil Dikunci Sementara!</div>
          <p class="text-xs text-slate-500 dark:text-slate-400">Event: <strong class="text-slate-700 dark:text-slate-200">{{ currentEvent.title }}</strong></p>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-900 px-5 py-2.5 rounded-xl border border-coral/20 dark:border-rose-800/50 text-center shrink-0 w-full sm:w-auto shadow-sm">
        <div class="text-[10px] text-coral dark:text-rose-400 font-bold uppercase tracking-wider">Sisa Waktu Bayar</div>
        <div class="text-2xl font-extrabold text-coral dark:text-rose-400 font-mono">{{ ticketStore.lockTimerFormatted }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      <!-- Left: Customer Info Form -->
      <div class="md:col-span-7 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-5 transition-colors">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm sm:text-base">
            <SvgIcon name="badge" className="w-4 h-4 text-navy dark:text-sky" />
            Data Pemegang Tiket
          </h3>

          <button 
            v-if="!authStore.isLoggedIn"
            @click="authStore.openLogin()"
            class="text-xs font-bold text-navy dark:text-sky hover:text-coral dark:hover:text-coral underline underline-offset-2"
          >
            Sudah punya akun? Masuk
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nama Lengkap (Sesuai KTP/Paspor)</label>
            <input v-model="ticketStore.customer.name" type="text"
              class="w-full bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy/20 dark:focus:ring-sky/30 focus:border-navy dark:focus:border-sky transition-all" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">NIK / No. Identitas</label>
            <input v-model="ticketStore.customer.nik" type="text"
              class="w-full bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-navy/20 dark:focus:ring-sky/30 focus:border-navy dark:focus:border-sky transition-all" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Email E-Tiket</label>
              <input v-model="ticketStore.customer.email" type="email"
                class="w-full bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy/20 dark:focus:ring-sky/30 focus:border-navy dark:focus:border-sky transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">WhatsApp</label>
              <input v-model="ticketStore.customer.phone" type="text"
                class="w-full bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-navy/20 dark:focus:ring-sky/30 focus:border-navy dark:focus:border-sky transition-all" />
            </div>
          </div>
        </div>

        <!-- Payment Method Selector -->
        <div class="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Pilih Metode Pembayaran</div>
          
          <!-- Option 1: Midtrans -->
          <label 
            @click="paymentMethod = 'midtrans'"
            class="block p-3 rounded-xl border-2 cursor-pointer transition-all"
            :class="paymentMethod === 'midtrans' 
              ? 'border-navy dark:border-sky bg-navy/5 dark:bg-sky-500/10' 
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" 
                  :class="paymentMethod === 'midtrans' ? 'bg-navy/10 dark:bg-sky-500/20' : 'bg-slate-100 dark:bg-slate-800'">
                  <svg class="w-5 h-5" :class="paymentMethod === 'midtrans' ? 'text-navy dark:text-sky-400' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-xs sm:text-sm font-bold" :class="paymentMethod === 'midtrans' ? 'text-navy dark:text-sky-300' : 'text-slate-700 dark:text-slate-200'">
                    Midtrans Payment Gateway
                  </div>
                  <div class="text-[11px]" :class="paymentMethod === 'midtrans' ? 'text-navy/70 dark:text-sky-400/70' : 'text-slate-400 dark:text-slate-500'">
                    GoPay · OVO · VA Bank · Kartu Kredit · QRIS
                  </div>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                :class="paymentMethod === 'midtrans' ? 'border-navy dark:border-sky' : 'border-slate-300 dark:border-slate-600'">
                <div v-if="paymentMethod === 'midtrans'" class="w-2.5 h-2.5 rounded-full bg-navy dark:bg-sky-400"></div>
              </div>
            </div>
            <div v-if="paymentMethod === 'midtrans'" class="mt-2 flex flex-wrap gap-2 pl-13">
              <span class="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">QRIS</span>
              <span class="px-2 py-0.5 text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md">GoPay</span>
              <span class="px-2 py-0.5 text-[10px] font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md">OVO</span>
              <span class="px-2 py-0.5 text-[10px] font-bold bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-md">VA Bank</span>
              <span class="px-2 py-0.5 text-[10px] font-bold bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-md">Credit Card</span>
              <span class="px-2 py-0.5 text-[10px] font-bold bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-md">ShopeePay</span>
            </div>
          </label>

          <!-- Option 2: Instant (Simulated) -->
          <label 
            @click="paymentMethod = 'instant'"
            class="block p-3 rounded-xl border-2 cursor-pointer transition-all"
            :class="paymentMethod === 'instant' 
              ? 'border-mint dark:border-emerald-400 bg-mint/5 dark:bg-emerald-500/10' 
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" 
                  :class="paymentMethod === 'instant' ? 'bg-mint/10 dark:bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'">
                  <SvgIcon name="wallet" :className="paymentMethod === 'instant' ? 'w-5 h-5 text-mint dark:text-emerald-400' : 'w-5 h-5 text-slate-400'" />
                </div>
                <div>
                  <div class="text-xs sm:text-sm font-bold" :class="paymentMethod === 'instant' ? 'text-mint dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'">
                    Virtual Account / Instant Pay
                  </div>
                  <div class="text-[11px]" :class="paymentMethod === 'instant' ? 'text-mint/70 dark:text-emerald-400/70' : 'text-slate-400 dark:text-slate-500'">
                    Otomatis Terverifikasi · 0 Detik Delay (Demo Mode)
                  </div>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                :class="paymentMethod === 'instant' ? 'border-mint dark:border-emerald-400' : 'border-slate-300 dark:border-slate-600'">
                <div v-if="paymentMethod === 'instant'" class="w-2.5 h-2.5 rounded-full bg-mint dark:bg-emerald-400"></div>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Right: Order Summary -->
      <div class="md:col-span-5 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-5 transition-colors">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-slate-800 dark:text-white text-sm sm:text-base">Ringkasan Order</h3>
          <span class="text-[11px] font-mono text-slate-400 dark:text-slate-500">{{ ticketStore.currentOrderId }}</span>
        </div>

        <div class="space-y-2 text-xs sm:text-[13px] font-mono">
          <div class="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Kategori</span>
            <span class="font-semibold text-slate-700 dark:text-slate-200 text-right">{{ ticketStore.categoryDetails[ticketStore.selectedCategory].name }}</span>
          </div>
          <div class="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Nomor Kursi</span>
            <span class="font-bold text-navy dark:text-sky text-right">{{ ticketStore.selectedSeatName }}</span>
          </div>
          <div class="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Jumlah</span>
            <span class="text-slate-700 dark:text-slate-300">{{ ticketStore.quantity }} tiket</span>
          </div>
          <div class="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Harga</span>
            <span class="text-slate-700 dark:text-slate-300">{{ ticketStore.formatMoney(ticketStore.unitPrice) }} × {{ ticketStore.quantity }}</span>
          </div>
          <div class="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Biaya Layanan</span>
            <span class="text-slate-700 dark:text-slate-300">{{ ticketStore.formatMoney(ticketStore.bookingFee * ticketStore.quantity) }}</span>
          </div>
          <div class="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Pajak (PPN/GST)</span>
            <span class="text-slate-700 dark:text-slate-300">{{ ticketStore.formatMoney(ticketStore.taxAmount) }}</span>
          </div>
          <div class="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2 flex justify-between font-bold text-base sm:text-lg text-navy dark:text-sky">
            <span>Total Pembayaran</span>
            <span>{{ ticketStore.formatMoney(ticketStore.grandTotal) }}</span>
          </div>
        </div>

        <!-- Payment Method Badge -->
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          :class="paymentMethod === 'midtrans' 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'">
          <svg v-if="paymentMethod === 'midtrans'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <SvgIcon v-else name="check" className="w-3.5 h-3.5" />
          <span class="font-semibold">
            {{ paymentMethod === 'midtrans' ? 'Pembayaran via Midtrans (Aman & Terverifikasi)' : 'Demo Mode — Instant Pay' }}
          </span>
        </div>

        <!-- Error message -->
        <div v-if="paymentStore.errorMessage" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
          <SvgIcon name="warning" className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{{ paymentStore.errorMessage }}</span>
        </div>

        <!-- Pay Button -->
        <button
          @click="handleConfirmPayment()"
          :disabled="isProcessing || paymentStore.isLoading"
          class="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-soft hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          :class="paymentMethod === 'midtrans' ? 'bg-navy dark:bg-sky-600' : 'bg-mint dark:bg-emerald-500'"
        >
          <!-- Loading spinner -->
          <svg v-if="isProcessing || paymentStore.isLoading" class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <SvgIcon v-else name="check" className="w-4 h-4 text-white" />
          <span>
            {{ isProcessing || paymentStore.isLoading ? 'Memproses Pembayaran...' : (paymentMethod === 'midtrans' ? 'Bayar dengan Midtrans' : 'Bayar & Terbitkan E-Tiket') }}
          </span>
        </button>

        <button @click="handleCancel()"
          :disabled="isProcessing || paymentStore.isLoading"
          class="w-full text-center text-xs text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-semibold transition-colors py-1 cursor-pointer disabled:opacity-40">
          Batalkan Pemesanan &amp; Lepas Kursi
        </button>
      </div>
    </div>
  </div>
</template>
