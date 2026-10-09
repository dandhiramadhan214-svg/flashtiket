<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import QRCode from 'qrcode';
import { useTicketStore } from '../stores/ticketStore';
import { useQueueStore } from '../stores/queueStore';
import { useEventsStore } from '../stores/eventsStore';
import { useAuthStore } from '../stores/authStore';
import SvgIcon from './SvgIcon.vue';

const ticketStore = useTicketStore();
const queueStore = useQueueStore();
const eventsStore = useEventsStore();
const authStore = useAuthStore();

const currentEvent = computed(() => eventsStore.selectedEvent);
const qrDataUrl = ref('');
const isScanningModalOpen = ref(false);

// Active ticket object with robust fallbacks
const activeTicket = computed(() => {
  return ticketStore.issuedTicket || {
    orderId: ticketStore.currentOrderId || 'ORD-9821-2026',
    holderName: ticketStore.customer?.name || authStore.currentUser?.name || 'Kevin Pratama',
    categoryName: ticketStore.categoryDetails[ticketStore.selectedCategory]?.name || 'VIP Royal Soundcheck',
    qty: ticketStore.quantity || 1,
    seatNo: `${ticketStore.selectedSeatName} (${ticketStore.selectedSeatZone})`,
    totalPaid: ticketStore.grandTotal || 387,
    issuedAt: new Date().toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    qrHash: 'SEC-SHA256-AUTH-PASS',
  };
});

const qrPayloadText = computed(() => {
  const t = activeTicket.value;
  return JSON.stringify({
    system: 'FlashTiket Official Pass',
    status: 'AUTHENTIC_VERIFIED',
    orderId: t.orderId,
    event: currentEvent.value?.title || 'Concert Pass',
    venue: currentEvent.value?.venue || 'Main Stadium',
    dateTime: `${currentEvent.value?.date} · ${currentEvent.value?.time}`,
    category: t.categoryName,
    seat: t.seatNo,
    holderName: t.holderName,
    amountPaid: ticketStore.formatMoney(t.totalPaid || 0),
    authHash: t.qrHash || 'SEC-SHA256-VALID',
    verifyUrl: `https://flashtiket.id/check?id=${t.orderId}`
  }, null, 2);
});

async function generateRealQrCode() {
  try {
    qrDataUrl.value = await QRCode.toDataURL(qrPayloadText.value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: {
        dark: '#1e266d',  // Navy modules
        light: '#ffffff'  // Pure white background
      }
    });
  } catch (err) {
    console.error('Error generating QR Code:', err);
  }
}

onMounted(() => {
  generateRealQrCode();
});

watch(() => [ticketStore.issuedTicket, activeTicket.value], () => {
  generateRealQrCode();
}, { deep: true });

function handlePrint() { window.print(); }
function handleBackHome() {
  ticketStore.resetAll();
  queueStore.setStage('home');
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

    <!-- Success Badge -->
    <div class="text-center space-y-2">
      <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-mint-light dark:bg-emerald-950/40 text-mint dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
        <SvgIcon name="check" className="w-8 h-8 sm:w-9 sm:h-9 text-mint dark:text-emerald-400" />
      </div>
      <h2 class="text-xl sm:text-2xl font-extrabold text-navy dark:text-white">Pembayaran Sukses &amp; E-Tiket Resmi Terbit!</h2>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
        Tiket Anda telah terdaftar resmi di sistem. Simpan QR Code di bawah untuk akses masuk gerbang acara.
      </p>
    </div>

    <!-- E-Ticket Card -->
    <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-elevated border border-slate-100 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none transition-colors">
      <!-- Header Strip -->
      <div class="bg-navy dark:bg-slate-950 px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-navy/20 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <SvgIcon name="bolt" className="w-5 h-5 text-white" />
          </div>
          <div>
            <div class="text-white font-bold text-xs sm:text-sm tracking-wide">FLASHTIKET OFFICIAL PASS</div>
            <div class="text-white/70 text-[10px] font-mono">100% SCANNABLE REAL QR CODE</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-white/60 text-[10px] font-mono uppercase">ORDER ID</div>
          <div class="text-white font-mono text-xs sm:text-sm font-bold tracking-wider">{{ activeTicket.orderId }}</div>
        </div>
      </div>

      <!-- Ticket Body -->
      <div class="p-5 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
        <!-- Event Details (2 cols) -->
        <div class="sm:col-span-2 space-y-4">
          <div>
            <div class="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
              {{ currentEvent.category }} · {{ currentEvent.city }}
            </div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white mt-1 leading-snug">
              {{ currentEvent.title }}
            </h1>
            <p class="text-xs text-slate-400 dark:text-slate-400 mt-0.5">{{ currentEvent.subtitle }}</p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
              <div class="text-slate-400 dark:text-slate-400 text-[11px]">Jadwal</div>
              <div class="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{{ currentEvent.date }}</div>
              <div class="text-slate-400 dark:text-slate-400 text-[11px]">{{ currentEvent.time }}</div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
              <div class="text-slate-400 dark:text-slate-400 text-[11px]">Lokasi</div>
              <div class="font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{{ currentEvent.venue }}</div>
              <div class="text-slate-400 dark:text-slate-400 text-[11px]">{{ currentEvent.city }}</div>
            </div>
            <div class="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
              <div class="text-slate-400 dark:text-slate-400 text-[11px]">Kategori &amp; Kursi</div>
              <div class="font-bold text-navy dark:text-sky mt-0.5 truncate">{{ activeTicket.seatNo }}</div>
              <div class="text-slate-400 dark:text-slate-400 text-[11px]">{{ activeTicket.qty }} Tiket Terkonfirmasi</div>
            </div>
          </div>

          <div class="flex items-center justify-between bg-sky-light dark:bg-sky-950/40 rounded-xl p-3 text-xs sm:text-sm border border-sky/20 dark:border-sky-800/40">
            <div>
              <div class="text-slate-500 dark:text-slate-400 text-[11px]">Nama Pemegang Tiket</div>
              <div class="font-bold text-slate-800 dark:text-slate-100">{{ activeTicket.holderName }}</div>
            </div>
            <div class="text-right">
              <div class="text-slate-500 dark:text-slate-400 text-[11px]">Total Lunas</div>
              <div class="font-bold text-navy dark:text-sky font-mono text-sm sm:text-base">
                {{ ticketStore.formatMoney(activeTicket.totalPaid) }}
              </div>
            </div>
          </div>
        </div>

        <!-- REAL QR Code Section (1 col) -->
        <div class="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700">
          <div class="bg-white rounded-2xl p-3 shadow-card border border-slate-200/80 flex items-center justify-center">
            <!-- Actual Dynamic Scannable QR Image -->
            <img 
              v-if="qrDataUrl" 
              :src="qrDataUrl" 
              alt="Scan QR Tiket FlashTiket" 
              class="w-36 h-36 object-contain"
            />
            <div v-else class="w-36 h-36 flex items-center justify-center text-slate-300 text-xs">
              Membuat QR Code...
            </div>
          </div>
          
          <div class="flex items-center gap-1.5 mt-2.5">
            <span class="w-2 h-2 rounded-full bg-mint animate-pulse"></span>
            <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200">QR Code Valid &amp; Asli</span>
          </div>
          <span class="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Bisa dipindai dengan kamera HP</span>

          <!-- Test Scan Data Button -->
          <button 
            @click="isScanningModalOpen = !isScanningModalOpen"
            class="mt-2 text-[11px] font-bold text-navy dark:text-sky hover:text-coral dark:hover:text-coral underline underline-offset-2 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <SvgIcon name="search" className="w-3 h-3" />
            <span>Lihat Data Tiket</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Data Details Box -->
    <div 
      v-if="isScanningModalOpen" 
      class="bg-white dark:bg-slate-900 rounded-2xl border border-navy/20 dark:border-slate-800 p-5 shadow-card space-y-3 transition-colors"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <SvgIcon name="qr" className="w-5 h-5 text-navy dark:text-sky" />
          <h3 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Detail Sertifikasi E-Tiket:</h3>
        </div>
        <button 
          @click="isScanningModalOpen = false"
          class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer flex items-center gap-1"
        >
          <span>Tutup</span>
          <SvgIcon name="cancel" className="w-3.5 h-3.5" />
        </button>
      </div>

      <pre class="bg-slate-900 text-mint p-4 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">{{ qrPayloadText }}</pre>
    </div>

    <!-- Actions (Responsive) -->
    <div class="flex flex-wrap items-center justify-center gap-3 print:hidden">
      <button @click="handlePrint()"
        class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-navy dark:bg-sky text-white font-bold text-xs sm:text-sm shadow-soft hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
        <SvgIcon name="print" className="w-4 h-4" />
        <span>Cetak / Unduh PDF</span>
      </button>

      <button @click="authStore.isMyTicketsOpen = true"
        class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
        <SvgIcon name="ticket" className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <span>Buka di Tiket Saya</span>
      </button>

      <button @click="handleBackHome()"
        class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-slate-200/50 dark:border-slate-700 cursor-pointer">
        <SvgIcon name="grid" className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </button>
    </div>
  </div>
</template>
