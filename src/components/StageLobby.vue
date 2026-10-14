<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useQueueStore } from '../stores/queueStore';
import { useTicketStore } from '../stores/ticketStore';
import { useEventsStore } from '../stores/eventsStore';
import SvgIcon from './SvgIcon.vue';

const queueStore = useQueueStore();
const ticketStore = useTicketStore();
const eventsStore = useEventsStore();

const currentEvent = computed(() => eventsStore.selectedEvent);

const secondsLeft = ref(272);
const msFraction = ref(48);
let timerInterval = null;

onMounted(() => {
  timerInterval = setInterval(() => {
    if (msFraction.value > 0) {
      msFraction.value -= 3;
    } else {
      msFraction.value = 99;
      if (secondsLeft.value > 0) secondsLeft.value--;
    }
  }, 30);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

function formatCountdown() {
  const m = Math.floor(secondsLeft.value / 60);
  const s = secondsLeft.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const tierCategories = computed(() => [
  { 
    key: 'vip', 
    label: ticketStore.categoryDetails.vip.name, 
    desc: ticketStore.categoryDetails.vip.sub, 
    price: ticketStore.prices.vip, 
    fee: ticketStore.bookingFees.vip, 
  },
  { 
    key: 'cat1', 
    label: ticketStore.categoryDetails.cat1.name, 
    desc: ticketStore.categoryDetails.cat1.sub, 
    price: ticketStore.prices.cat1, 
    fee: ticketStore.bookingFees.cat1, 
  },
  { 
    key: 'cat2', 
    label: ticketStore.categoryDetails.cat2.name, 
    desc: ticketStore.categoryDetails.cat2.sub, 
    price: ticketStore.prices.cat2, 
    fee: ticketStore.bookingFees.cat2, 
  },
]);
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-12">

    <!-- Top Navigation / Back Link -->
    <div class="flex items-center justify-between border-b-2 border-black pb-4">
      <button 
        @click="queueStore.setStage('home')"
        class="font-mono text-xs uppercase tracking-wider text-black hover:underline cursor-pointer flex items-center gap-2"
      >
        <span>← Kembali ke Katalog Acara</span>
      </button>

      <span class="font-mono text-[11px] uppercase tracking-widest text-[#525252]">
        KATEGORI: [{{ currentEvent.category }}]
      </span>
    </div>

    <!-- Hero Event Details Card (Editorial Print Style) -->
    <div class="border-2 border-black bg-white p-8 sm:p-10 space-y-6">
      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
        <div class="space-y-4 max-w-2xl">
          <div class="font-mono text-xs uppercase tracking-widest text-[#525252]">
            RUANG TUNGGU PRA-PENJUALAN RESMI
          </div>
          <h1 class="text-3xl sm:text-5xl font-serif font-black tracking-tight leading-tight text-black">
            {{ currentEvent.title }}
          </h1>
          <p class="font-body text-base text-[#525252] leading-relaxed">
            {{ currentEvent.subtitle }}
          </p>

          <div class="pt-4 border-t border-black font-mono text-xs space-y-1">
            <div class="text-[#525252] text-[10px] uppercase">Jadwal &amp; Lokasi:</div>
            <div class="font-bold text-black">{{ currentEvent.date }} · {{ currentEvent.time }}</div>
            <div class="text-[#525252]">{{ currentEvent.venue }}, {{ currentEvent.city }}</div>
          </div>
        </div>

        <!-- Live Traffic Inverted Counter Box -->
        <div class="bg-black text-white p-6 border-2 border-black min-w-[240px] text-center font-mono uppercase space-y-2">
          <div class="text-[10px] tracking-widest text-white/70">Peminat di Waiting Room</div>
          <div class="text-4xl sm:text-5xl font-serif font-black text-white">
            {{ queueStore.totalWaiting.toLocaleString('id-ID') }}
          </div>
          <div class="text-[10px] text-white/60">Antrean Siap Mengalir</div>
        </div>
      </div>
    </div>

    <!-- Countdown Timer Section -->
    <div class="border-4 border-black p-8 sm:p-12 text-center space-y-6 bg-white">
      <div class="font-mono text-xs uppercase tracking-widest text-[#525252]">
        [HITUNG MUNDUR BUKA PENJUALAN TIKET]
      </div>

      <div class="text-6xl sm:text-8xl font-serif font-black text-black tracking-tight leading-none">
        {{ formatCountdown() }}<span class="text-3xl sm:text-4xl font-mono text-[#525252]">.{{ String(msFraction).padStart(2, '0') }}</span>
      </div>

      <p class="font-body text-xs sm:text-sm text-[#525252] max-w-lg mx-auto leading-relaxed">
        Pintu antrean virtual dibuka tepat waktu. Setiap pengunjung mendapatkan giliran adil berdasar timestamp kedatangan milidetik di cluster Redis.
      </p>

      <div>
        <button
          @click="queueStore.startQueue()"
          class="btn-mono-primary text-sm px-10 py-4"
        >
          <span>Masuk Ruang Antrean Sekarang →</span>
        </button>
      </div>
    </div>

    <!-- Two Column: Rules + Account Readiness -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
      <!-- Rules -->
      <div class="md:col-span-7 border-2 border-black p-6 sm:p-8 space-y-6">
        <h2 class="font-serif font-bold text-xl text-black">
          Ketentuan Masuk Antrean
        </h2>
        <div class="space-y-4 font-body text-xs text-[#525252]">
          <div class="border-b border-black pb-3">
            <span class="font-mono font-bold text-black uppercase block mb-1">01. DILARANG REFRESH HALAMAN</span>
            Melakukan refresh peramban dapat membatalkan token antrean Anda dan mengembalikan posisi ke urutan paling belakang.
          </div>
          <div class="border-b border-black pb-3">
            <span class="font-mono font-bold text-black uppercase block mb-1">02. PEMBATASAN KUOTA MAKSIMAL</span>
            Setiap akun dibatasi maksimal 2 tiket per transaksi guna mencegah tindakan penimbunan tiket oleh calo.
          </div>
          <div>
            <span class="font-mono font-bold text-black uppercase block mb-1">03. BATAS WAKTU TRANSAKSI 10 MENIT</span>
            Saat nomor antrean Anda tiba, sistem mengunci kursi selama 10 menit (600 detik) untuk menyelesaikan konfirmasi pembayaran.
          </div>
        </div>
      </div>

      <!-- Readiness Check -->
      <div class="md:col-span-5 border-2 border-black p-6 sm:p-8 space-y-6">
        <div class="flex items-center justify-between border-b border-black pb-3">
          <h2 class="font-serif font-bold text-lg text-black">Verifikasi Akun</h2>
          <span class="font-mono text-xs font-bold">[4/4 LENGKAP]</span>
        </div>
        <div class="space-y-3 font-mono text-xs uppercase">
          <div v-for="item in ['Akun Terverifikasi', 'Nomor KTP/NIK Valid', 'Koneksi Browser Stabil', 'Virtual Account Siap']" :key="item"
            class="flex items-center justify-between p-3 border border-black bg-white">
            <span>{{ item }}</span>
            <span class="font-bold">✓ READY</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Seat Tiers Preview -->
    <div class="border-2 border-black p-6 sm:p-8 space-y-6">
      <div class="flex items-center justify-between border-b-2 border-black pb-4">
        <h2 class="font-serif font-bold text-2xl text-black">Kategori Kursi &amp; Tarif Resmi</h2>
        <span class="font-mono text-xs uppercase text-[#525252]">DENAH GBK STADIUM</span>
      </div>

      <div class="space-y-4">
        <div 
          v-for="cat in tierCategories" 
          :key="cat.key"
          class="border-2 border-black p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors card-mono-hover"
        >
          <div class="space-y-1">
            <div class="font-mono text-[10px] uppercase tracking-widest opacity-70">KATEGORI TIKET</div>
            <h3 class="font-serif font-bold text-xl">{{ cat.label }}</h3>
            <p class="font-body text-xs opacity-80 max-w-xl">{{ cat.desc }}</p>
          </div>

          <div class="text-left md:text-right pt-4 md:pt-0 border-t md:border-t-0 border-current font-mono">
            <div class="text-xl font-bold">
              {{ ticketStore.formatMoney(cat.price) }}
            </div>
            <div class="text-[10px] opacity-70">+ {{ ticketStore.formatMoney(cat.fee) }} Booking Fee</div>
            <div class="mt-2 inline-block px-2 py-0.5 border border-current text-[10px] font-bold uppercase">
              {{ ticketStore.stock[cat.key] > 0 ? 'KUOTA TERSEDIA' : 'HABIS' }}
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
