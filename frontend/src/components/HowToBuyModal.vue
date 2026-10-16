<script setup>
import { useQueueStore } from '../stores/queueStore';

const queueStore = useQueueStore();

const steps = [
  {
    num: '01',
    title: 'Pilih Acara & Kategori',
    desc: 'Telusuri katalog konser resmi dan tentukan kategori tiket yang diinginkan (VIP, CAT 1 Festival, atau CAT 2 Tribun).',
  },
  {
    num: '02',
    title: 'Masuk Antrean Virtual FIFO',
    desc: 'Saat pintu penjualan dibuka, sistem Virtual Waiting Room mengantrekan pengunjung secara adil berbasis milidetik Redis.',
  },
  {
    num: '03',
    title: 'Kunci Nomor Kursi 10 Menit',
    desc: 'Pilih nomor kursi pada denah arsitektur. Kuota otomatis terkunci aman selama 600 detik via Distributed Lock.',
  },
  {
    num: '04',
    title: 'Konfirmasi Bayar & Unduh PDF',
    desc: 'Selesaikan transaksi dan e-tiket resmi lengkap dengan Barcode Code-128 dan QR Code dinamis langsung terbit.',
  },
];

function handleStartBrowsing() {
  queueStore.isGuideModalOpen = false;
  queueStore.setStage('home');
}
</script>

<template>
  <div 
    v-if="queueStore.isGuideModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
    @click.self="queueStore.isGuideModalOpen = false"
  >
    <div class="bg-white max-w-xl w-full border-4 border-black p-6 sm:p-8 space-y-6 relative font-mono">
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b-2 border-black pb-3">
        <div>
          <span class="text-[10px] text-[#525252] uppercase tracking-widest">PROTOKOL RESMI</span>
          <h3 class="font-serif font-black text-2xl text-black">Panduan Pemesanan</h3>
        </div>
        <button 
          @click="queueStore.isGuideModalOpen = false"
          class="font-mono text-xs uppercase underline text-[#525252] hover:text-black cursor-pointer"
        >
          [Tutup]
        </button>
      </div>

      <!-- Steps Content -->
      <div class="space-y-4 max-h-[60vh] overflow-y-auto">
        <div 
          v-for="step in steps" 
          :key="step.num"
          class="border-2 border-black p-4 space-y-2 hover:bg-black hover:text-white transition-colors group cursor-default"
        >
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold font-mono px-2 py-0.5 border border-current">
              LANGKAH {{ step.num }}
            </span>
            <h4 class="font-serif font-bold text-base">{{ step.title }}</h4>
          </div>
          <p class="font-body text-xs opacity-80 leading-relaxed pl-1">{{ step.desc }}</p>
        </div>
      </div>

      <!-- CTA Footer -->
      <div class="pt-2 border-t-2 border-black">
        <button 
          @click="handleStartBrowsing"
          class="btn-mono-primary w-full py-4 text-xs font-bold"
        >
          <span>Mulai Telusuri Katalog Acara →</span>
        </button>
      </div>
    </div>
  </div>
</template>
