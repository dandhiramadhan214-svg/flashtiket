<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { useTicketStore } from '../stores/ticketStore';
import { useQueueStore } from '../stores/queueStore';
import { useEventsStore } from '../stores/eventsStore';
import { useAuthStore } from '../stores/authStore';
import { useNotifStore } from '../stores/notifStore';
import { downloadOfficialTicketPdf } from '../services/pdfTicketService';
import SvgIcon from './SvgIcon.vue';

const ticketStore = useTicketStore();
const queueStore = useQueueStore();
const eventsStore = useEventsStore();
const authStore = useAuthStore();
const notifStore = useNotifStore();

const currentEvent = computed(() => eventsStore.selectedEvent);
const qrDataUrl = ref('');
const barcodeDataUrl = ref('');
const isScanningModalOpen = ref(false);
const isDownloadingPdf = ref(false);

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
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating QR Code:', err);
  }
}

function generateBarcode() {
  try {
    const canvas = document.createElement('canvas');
    const cleanId = (activeTicket.value?.orderId || 'ORD98212026').replace(/[^A-Z0-9]/g, '');
    const barcodeCode = `${cleanId}${Math.floor(1000 + Math.random() * 9000)}`;
    JsBarcode(canvas, barcodeCode, {
      format: 'CODE128',
      lineColor: '#000000',
      width: 1.8,
      height: 38,
      displayValue: true,
      font: 'monospace',
      fontSize: 10,
      textMargin: 2,
      background: '#ffffff',
    });
    barcodeDataUrl.value = canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Error generating Barcode:', err);
  }
}

async function handleDownloadPdf() {
  if (isDownloadingPdf.value) return;
  isDownloadingPdf.value = true;
  try {
    const filename = await downloadOfficialTicketPdf({
      ticket: activeTicket.value,
      event: currentEvent.value,
      customer: ticketStore.customer,
      formatMoney: ticketStore.formatMoney,
    });
    notifStore.push(
      'success',
      'E-Tiket PDF Berhasil Diunduh!',
      `File resmi ${filename} telah tersimpan di perangkat Anda lengkap dengan QR Code, Barcode Code-128, dan watermark keaslian.`
    );
  } catch (err) {
    console.error('Download PDF error:', err);
    notifStore.push('error', 'Gagal Mengunduh PDF', err.message || 'Terjadi kesalahan saat memproses tiket.');
  } finally {
    isDownloadingPdf.value = false;
  }
}

onMounted(() => {
  generateRealQrCode();
  generateBarcode();
});

watch(() => [ticketStore.issuedTicket, activeTicket.value], () => {
  generateRealQrCode();
  generateBarcode();
}, { deep: true });

function handlePrint() { window.print(); }
function handleBackHome() {
  ticketStore.resetAll();
  queueStore.setStage('home');
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 md:px-8 py-8 space-y-8">

    <!-- Success Editorial Statement -->
    <div class="text-center space-y-3 border-b-2 border-black pb-8">
      <div class="inline-block px-3 py-1 bg-black text-white font-mono text-[10px] uppercase tracking-widest">
        VERIFIKASI BERHASIL · TRANSAKSI SELESAI
      </div>
      <h2 class="text-4xl sm:text-5xl font-serif font-black text-black tracking-tight">
        E-Tiket Resmi Telah Terbit
      </h2>
      <p class="font-body text-xs sm:text-sm text-[#525252] max-w-lg mx-auto">
        Dokumen ini sah sebagai akses masuk resmi gerbang konser. Unduh dokumen PDF cetak atau simpan kode QR dinamis di bawah ini.
      </p>
    </div>

    <!-- E-Ticket Perforated Concert Pass (Minimalist Monochrome) -->
    <div class="border-4 border-black bg-white relative overflow-hidden">
      
      <!-- Watermark Background Texture -->
      <div class="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center select-none overflow-hidden">
        <div class="text-6xl font-black rotate-[-30deg] tracking-widest uppercase">
          FLASHTIKET OFFICIAL AUTHENTIC PASS
        </div>
      </div>

      <!-- Header Strip (Pure Black) -->
      <div class="bg-black text-white px-8 py-5 flex items-center justify-between border-b-2 border-black relative z-10 font-mono text-xs uppercase">
        <div class="flex items-center gap-3">
          <span class="w-2.5 h-2.5 bg-white"></span>
          <div>
            <div class="font-bold text-sm tracking-wider">FLASHTIKET PASS</div>
            <div class="text-[10px] text-white/70">100% SCANNABLE REAL QR CODE</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[10px] text-white/70">ID ORDER</div>
          <div class="font-bold text-sm text-white">{{ activeTicket.orderId }}</div>
        </div>
      </div>

      <!-- Ticket Body -->
      <div class="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
        <!-- Event Details (8 cols) -->
        <div class="md:col-span-8 space-y-6">
          <div class="space-y-1">
            <div class="font-mono text-[10px] uppercase tracking-widest text-[#525252]">
              {{ currentEvent.category }} · {{ currentEvent.city }}
            </div>
            <h1 class="text-2xl sm:text-3xl font-serif font-bold text-black tracking-tight leading-snug">
              {{ currentEvent.title }}
            </h1>
            <p class="font-body text-xs text-[#525252]">{{ currentEvent.subtitle }}</p>
          </div>

          <!-- 3 Grid Boxes (Sharp Borders) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div class="border border-black p-3 space-y-1">
              <div class="text-[#525252] text-[10px] uppercase">Jadwal Acara:</div>
              <div class="font-bold text-black">{{ currentEvent.date }}</div>
              <div class="text-[10px] text-[#525252]">{{ currentEvent.time }}</div>
            </div>

            <div class="border border-black p-3 space-y-1">
              <div class="text-[#525252] text-[10px] uppercase">Lokasi Venue:</div>
              <div class="font-bold text-black truncate">{{ currentEvent.venue }}</div>
              <div class="text-[10px] text-[#525252]">{{ currentEvent.city }}</div>
            </div>

            <div class="col-span-2 sm:col-span-1 border border-black p-3 space-y-1">
              <div class="text-[#525252] text-[10px] uppercase">Kursi &amp; Kategori:</div>
              <div class="font-bold text-black truncate">{{ activeTicket.seatNo }}</div>
              <div class="text-[10px] text-[#525252]">{{ activeTicket.qty }} Tiket Terkonfirmasi</div>
            </div>
          </div>

          <!-- Customer Identity Box -->
          <div class="border-2 border-black p-4 flex items-center justify-between font-mono text-xs uppercase">
            <div>
              <div class="text-[10px] text-[#525252]">Nama Pemegang:</div>
              <div class="font-bold text-sm text-black">{{ activeTicket.holderName }}</div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-[#525252]">Status:</div>
              <div class="font-bold text-black">[LUNAS / VERIFIED]</div>
            </div>
          </div>

          <!-- Barcode Display -->
          <div v-if="barcodeDataUrl" class="border border-black p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div>
              <div class="text-[10px] uppercase text-[#525252]">Code-128 Gate Barcode</div>
              <img :src="barcodeDataUrl" alt="Barcode Code-128" class="h-9 max-w-full object-contain filter" />
            </div>
            <div class="text-right text-[10px] text-[#525252]">
              DITERBITKAN: {{ activeTicket.issuedAt }}
            </div>
          </div>
        </div>

        <!-- Perforation & QR Code Section (4 cols) -->
        <div class="md:col-span-4 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-black pt-6 md:pt-0 md:pl-8 flex flex-col items-center justify-center text-center space-y-4">
          <div class="font-mono text-[10px] uppercase tracking-widest text-[#525252]">
            GERBANG SCANNING
          </div>

          <div class="border-2 border-black p-2 bg-white inline-block">
            <img 
              v-if="qrDataUrl" 
              :src="qrDataUrl" 
              alt="Scan QR Tiket" 
              class="w-36 h-36 object-contain"
            />
          </div>

          <div class="font-mono text-[10px] uppercase tracking-widest text-black font-bold">
            100% VALID PASS
          </div>

          <button 
            @click="isScanningModalOpen = !isScanningModalOpen"
            class="font-mono text-xs uppercase underline text-[#525252] hover:text-black cursor-pointer"
          >
            [Lihat Data Payload]
          </button>
        </div>
      </div>
    </div>

    <!-- Data Details Box -->
    <div 
      v-if="isScanningModalOpen" 
      class="border-2 border-black p-6 bg-white space-y-4 font-mono"
    >
      <div class="flex items-center justify-between border-b border-black pb-2 text-xs uppercase">
        <span class="font-bold text-black">Detail Enkripsi Digital Tiket:</span>
        <button 
          @click="isScanningModalOpen = false"
          class="underline text-[#525252] hover:text-black cursor-pointer"
        >
          [Tutup]
        </button>
      </div>

      <pre class="bg-black text-white p-4 text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed">{{ qrPayloadText }}</pre>
    </div>

    <!-- Actions (Minimalist Monochrome Buttons) -->
    <div class="flex flex-wrap items-center justify-center gap-4 pt-4 print:hidden">
      <!-- 1. Download E-Ticket (PDF) -->
      <button 
        @click="handleDownloadPdf" 
        :disabled="isDownloadingPdf"
        class="btn-mono-primary px-8 py-4 text-xs font-bold"
      >
        <span v-if="isDownloadingPdf">Membuat Dokumen PDF...</span>
        <span v-else>Download E-Ticket (PDF) ↓</span>
      </button>

      <!-- 2. Cetak Langsung -->
      <button 
        @click="handlePrint()"
        class="btn-mono-secondary px-6 py-4 text-xs font-bold"
      >
        <span>Cetak Dokumen</span>
      </button>

      <!-- 3. Tiket Saya -->
      <button 
        @click="authStore.isMyTicketsOpen = true"
        class="btn-mono-secondary px-6 py-4 text-xs font-bold"
      >
        <span>Tiket Saya</span>
      </button>

      <!-- 4. Beranda -->
      <button 
        @click="handleBackHome()"
        class="btn-mono-secondary px-6 py-4 text-xs font-bold"
      >
        <span>Kembali ke Beranda</span>
      </button>
    </div>

  </div>
</template>
