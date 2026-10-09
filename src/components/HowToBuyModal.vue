<script setup>
import { useQueueStore } from '../stores/queueStore';
import SvgIcon from './SvgIcon.vue';

const queueStore = useQueueStore();

const steps = [
  {
    num: '01',
    title: 'Pilih Event & Kategori',
    desc: 'Telusuri katalog konser atau acara favorit Anda, lalu pilih kategori tiket (VIP, CAT 1 Festival, atau CAT 2 Tribun).',
    icon: 'ticket',
    badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
    dotColor: 'bg-purple-500',
  },
  {
    num: '02',
    title: 'Masuk Antrean Virtual (Fair Queue)',
    desc: 'Saat pintu penjualan dibuka, sistem Virtual Waiting Room mendistribusikan antrean secara adil anti-bot & calo.',
    icon: 'queue',
    badgeColor: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
    dotColor: 'bg-sky',
  },
  {
    num: '03',
    title: 'Pilih Nomor Kursi Interaktif',
    desc: 'Klik titik kursi impian Anda langsung pada peta stadion dinamis. Kursi akan terkunci aman selama 10 menit.',
    icon: 'seat',
    badgeColor: 'bg-mint-100 dark:bg-emerald-950/60 text-mint-700 dark:text-emerald-300',
    dotColor: 'bg-mint',
  },
  {
    num: '04',
    title: 'Bayar & E-Tiket Real QR Terbit',
    desc: 'Lakukan pembayaran instan. E-Tiket resmi dengan QR Code asli yang bisa dipindai kamera HP langsung diterbitkan.',
    icon: 'qr',
    badgeColor: 'bg-coral-100 dark:bg-rose-950/60 text-coral-700 dark:text-rose-300',
    dotColor: 'bg-coral',
  },
];

function handleStartBrowsing() {
  queueStore.isGuideModalOpen = false;
  queueStore.setStage('home');
  setTimeout(() => {
    const el = document.getElementById('kategori-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}
</script>

<template>
  <div 
    v-if="queueStore.isGuideModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
    @click.self="queueStore.isGuideModalOpen = false"
  >
    <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-colors">
      
      <!-- Modal Header -->
      <div class="bg-gradient-to-r from-navy via-navy to-indigo-950 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900 p-6 text-white relative border-b border-navy/20 dark:border-slate-800">
        <button 
          @click="queueStore.isGuideModalOpen = false"
          class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <SvgIcon name="cancel" className="w-4 h-4 text-white" />
        </button>

        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-0.5 rounded-full bg-mint/20 text-mint text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-mint"></span>
            Panduan Pembeli
          </span>
          <span class="text-white/60 text-xs">· Resmi FlashTiket</span>
        </div>

        <h3 class="text-xl sm:text-2xl font-extrabold tracking-tight">Cara Mudah Membeli Tiket</h3>
        <p class="text-xs sm:text-sm text-slate-200 mt-1">4 langkah praktis mengamankan tiket konser &amp; festival resmi tanpa ribet.</p>
      </div>

      <!-- Steps Content -->
      <div class="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
        <div 
          v-for="step in steps" 
          :key="step.num"
          class="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700/80"
        >
          <!-- Step Number & Icon -->
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" :class="step.badgeColor">
            <SvgIcon :name="step.icon" className="w-5 h-5" />
          </div>

          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                Langkah {{ step.num }}
              </span>
              <h4 class="text-sm font-bold text-slate-800 dark:text-white">{{ step.title }}</h4>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>

        <!-- Pro Tips Card -->
        <div class="p-4 rounded-2xl bg-amber-light dark:bg-amber-950/40 border border-amber/30 dark:border-amber-800/40 flex items-start gap-3">
          <div class="w-8 h-8 rounded-xl bg-amber/20 text-amber dark:text-amber-400 flex items-center justify-center shrink-0">
            <SvgIcon name="warning" className="w-4 h-4 text-amber dark:text-amber-400" />
          </div>
          <div class="text-xs">
            <div class="font-bold text-slate-800 dark:text-amber-200">Tips Penting:</div>
            <p class="text-slate-600 dark:text-amber-300/80 mt-0.5 leading-relaxed">
              Pastikan Anda sudah masuk/login akun dan tidak me-refresh browser saat di ruang antrean agar posisi tetap aman.
            </p>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          @click="queueStore.isGuideModalOpen = false"
          class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Tutup
        </button>

        <button
          @click="handleStartBrowsing"
          class="px-5 py-2.5 rounded-xl bg-navy dark:bg-sky text-white text-xs font-bold hover:bg-navy-light dark:hover:brightness-110 shadow-soft transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>Pilih Event Sekarang</span>
          <SvgIcon name="arrow-right" className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

    </div>
  </div>
</template>
