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
    color: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40', 
    accent: 'text-purple-600 dark:text-purple-400', 
    dot: 'bg-purple-500' 
  },
  { 
    key: 'cat1', 
    label: ticketStore.categoryDetails.cat1.name, 
    desc: ticketStore.categoryDetails.cat1.sub, 
    price: ticketStore.prices.cat1, 
    fee: ticketStore.bookingFees.cat1, 
    color: 'bg-sky-light dark:bg-sky-950/40 border-sky/30 dark:border-sky-800/40', 
    accent: 'text-sky dark:text-sky-400', 
    dot: 'bg-sky' 
  },
  { 
    key: 'cat2', 
    label: ticketStore.categoryDetails.cat2.name, 
    desc: ticketStore.categoryDetails.cat2.sub, 
    price: ticketStore.prices.cat2, 
    fee: ticketStore.bookingFees.cat2, 
    color: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700', 
    accent: 'text-slate-600 dark:text-slate-300', 
    dot: 'bg-slate-400' 
  },
]);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

    <!-- Top Navigation / Back Link -->
    <div class="flex items-center justify-between">
      <button 
        @click="queueStore.setStage('home')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-sky hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
      >
        <SvgIcon name="arrow-left" className="w-3.5 h-3.5" />
        <span>Kembali ke Semua Event</span>
      </button>

      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700">
        Kategori: {{ currentEvent.category }}
      </span>
    </div>

    <!-- Hero Event Card -->
    <div class="relative rounded-3xl overflow-hidden shadow-elevated">
      <div 
        v-if="currentEvent.image"
        class="absolute inset-0 bg-cover bg-center" 
        :style="{ backgroundImage: `url('${currentEvent.image}')` }"
      ></div>
      <div 
        v-else
        class="absolute inset-0 bg-gradient-to-br from-navy via-indigo-950 to-slate-900"
      ></div>
      
      <div class="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/40 dark:from-slate-950/95 dark:via-slate-950/80 dark:to-slate-950/50"></div>

      <div class="relative p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
        <div class="text-white max-w-xl space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wide backdrop-blur-md">
              Waiting Room Open
            </span>
            <span class="px-3 py-1 rounded-full bg-mint/20 text-mint text-xs font-bold tracking-wide">
              Official Ticket Drop
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            {{ currentEvent.title }}
          </h1>
          <p class="text-white/70 text-xs sm:text-sm font-medium">
            {{ currentEvent.subtitle }}
          </p>

          <div class="flex flex-wrap gap-4 mt-2 text-xs sm:text-sm text-white/80">
            <div class="flex items-center gap-1.5">
              <SvgIcon name="calendar" className="w-4 h-4 text-coral" />
              <span>{{ currentEvent.date }} · {{ currentEvent.time }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <SvgIcon name="location" className="w-4 h-4 text-sky" />
              <span>{{ currentEvent.venue }}, {{ currentEvent.city }}</span>
            </div>
          </div>
        </div>

        <!-- Live Traffic Counter Card -->
        <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-5 min-w-[220px] sm:min-w-[240px] border border-white/20">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="w-2 h-2 rounded-full bg-mint animate-pulse"></span>
            <span class="text-[11px] font-semibold text-white/80 tracking-wide uppercase">Live Antrean</span>
          </div>
          <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {{ queueStore.totalWaiting.toLocaleString('id-ID') }}
          </div>
          <span class="text-xs text-white/60">fans di waiting room</span>
        </div>
      </div>
    </div>

    <!-- Sold-Out Card -->
    <div v-if="currentEvent.status === 'sold-out'" class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-card">
      <div class="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
        <SvgIcon name="cancel" className="w-7 h-7 text-rose-600 dark:text-rose-400" />
      </div>
      <h2 class="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white">Tiket Telah Habis Terjual (Sold Out)</h2>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
        Seluruh alokasi tiket resmi untuk event ini telah habis dipesan penonton. Silakan pantau pengumuman resmi promotor untuk info rilis tiket tambahan.
      </p>
      <button
        @click="queueStore.setStage('home')"
        class="px-6 py-3 rounded-xl bg-navy dark:bg-sky text-white font-bold text-xs sm:text-sm hover:bg-navy-light dark:hover:brightness-110 shadow-soft transition-all cursor-pointer"
      >
        Jelajahi Event Lainnya
      </button>
    </div>

    <!-- Ended Event Card -->
    <div v-else-if="currentEvent.status === 'ended'" class="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-card">
      <div class="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
        <SvgIcon name="calendar" className="w-7 h-7 text-slate-500 dark:text-slate-400" />
      </div>
      <h2 class="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white">Acara Telah Selesai Diselenggarakan</h2>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
        Event ini telah selesai berlangsung pada {{ currentEvent.date }}. Penjualan tiket resmi telah ditutup.
      </p>
      <button
        @click="queueStore.setStage('home')"
        class="px-6 py-3 rounded-xl bg-navy dark:bg-sky text-white font-bold text-xs sm:text-sm hover:bg-navy-light dark:hover:brightness-110 shadow-soft transition-all cursor-pointer"
      >
        Kembali ke Katalog Event
      </button>
    </div>

    <!-- Countdown Timer Card (Active On-Sale / Coming-Soon) -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-6 sm:p-8 text-center space-y-5 border border-slate-100 dark:border-slate-800 transition-colors">
      <div class="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-coral">
        <SvgIcon name="alarm" className="w-4 h-4 text-coral" />
        <span>Ticket Drop Countdown</span>
      </div>

      <div class="text-5xl sm:text-7xl font-extrabold text-navy dark:text-sky font-mono tracking-tight">
        {{ formatCountdown() }}<span class="text-2xl sm:text-3xl text-slate-300 dark:text-slate-600">.{{ String(msFraction).padStart(2, '0') }}</span>
      </div>

      <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
        Pintu antrean akan dibuka secara acak &amp; adil. Sistem Fair Play menjamin kesempatan sama untuk semua akun.
      </p>

      <button
        @click="queueStore.startQueue()"
        class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-navy dark:bg-sky text-white font-bold text-sm tracking-wide shadow-soft hover:shadow-card-hover hover:bg-navy-light dark:hover:brightness-110 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Masuk Antrean Langsung</span>
        <SvgIcon name="arrow-right" className="w-4 h-4" />
      </button>
    </div>

    <!-- Two Column: Rules + Readiness Check -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Rules -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4 transition-colors">
        <h2 class="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <SvgIcon name="shield" className="w-5 h-5 text-coral" />
          Ketentuan &amp; Panduan Pembelian
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-4 bg-coral-light dark:bg-rose-950/40 border border-coral/20 dark:border-rose-900/30 rounded-xl space-y-1.5">
            <div class="w-6 h-6 rounded-lg bg-coral/10 text-coral flex items-center justify-center font-bold text-xs">1</div>
            <h3 class="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-rose-200">Jangan Refresh</h3>
            <p class="text-[11px] text-slate-500 dark:text-rose-300/80 leading-relaxed">Refresh browser akan mereset token sesi dan posisi antrean Anda.</p>
          </div>
          <div class="p-4 bg-sky-light dark:bg-sky-950/40 border border-sky/20 dark:border-sky-900/30 rounded-xl space-y-1.5">
            <div class="w-6 h-6 rounded-lg bg-sky/10 text-sky flex items-center justify-center font-bold text-xs">2</div>
            <h3 class="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-sky-200">Fair Queue</h3>
            <p class="text-[11px] text-slate-500 dark:text-sky-300/80 leading-relaxed">Antrean diacak server menggunakan algoritma ZSET Redis.</p>
          </div>
          <div class="p-4 bg-mint-light dark:bg-emerald-950/40 border border-mint/20 dark:border-emerald-900/30 rounded-xl space-y-1.5">
            <div class="w-6 h-6 rounded-lg bg-mint/10 text-mint flex items-center justify-center font-bold text-xs">3</div>
            <h3 class="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-emerald-200">Waktu 10 Menit</h3>
            <p class="text-[11px] text-slate-500 dark:text-emerald-300/80 leading-relaxed">Setelah giliran tiba, Anda punya waktu 10 menit untuk bayar.</p>
          </div>
        </div>
      </div>

      <!-- Readiness Check -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4 transition-colors">
        <div class="flex items-center justify-between">
          <h2 class="text-sm sm:text-base font-bold text-slate-800 dark:text-white">Status Kesiapan Akun</h2>
          <span class="px-2 py-0.5 rounded-full bg-mint-light dark:bg-emerald-950/40 text-mint dark:text-emerald-400 text-[11px] font-bold">4/4 Siap</span>
        </div>
        <div class="space-y-2">
          <div v-for="item in ['Akun Terverifikasi', 'Identitas Terisi (NIK)', 'Sesi Browser Aktif', 'Virtual Account Siap']" :key="item"
            class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs sm:text-[13px]">
            <div class="flex items-center gap-2">
              <SvgIcon name="check" className="w-4 h-4 text-mint shrink-0" />
              <span class="text-slate-600 dark:text-slate-300 font-medium">{{ item }}</span>
            </div>
            <span class="text-mint text-[11px] font-bold">OK</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Seat Tiers Preview -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-4 transition-colors">
      <div class="flex items-center justify-between">
        <h2 class="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Kategori Tiket &amp; Estimasi Harga</h2>
        <span class="text-xs text-slate-400 dark:text-slate-500 font-mono">{{ ticketStore.currentCurrency }}</span>
      </div>
      <div class="space-y-3">
        <div v-for="cat in tierCategories" :key="cat.key"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors"
          :class="cat.color"
        >
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-2.5 rounded-full shrink-0" :class="cat.dot"></div>
            <div>
              <h3 class="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200">{{ cat.label }}</h3>
              <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{{ cat.desc }}</p>
            </div>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/50 dark:border-slate-700">
            <div class="text-left sm:text-right">
              <span class="font-bold font-mono text-base sm:text-lg" :class="cat.accent">
                {{ ticketStore.formatMoney(cat.price) }}
              </span>
              <span class="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 block">+ {{ ticketStore.formatMoney(cat.fee) }} fee</span>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[11px] font-bold"
              :class="ticketStore.stock[cat.key] > 0 ? 'bg-mint-light dark:bg-emerald-950/40 text-mint dark:text-emerald-400' : 'bg-coral-light dark:bg-rose-950/40 text-coral dark:text-rose-400'"
            >
              {{ ticketStore.stock[cat.key] > 0 ? 'Tersedia' : 'Habis' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
