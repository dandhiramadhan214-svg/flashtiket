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
const isDownloadingPdf = ref(false);
const activeTab = ref('ticket'); // 'ticket' or 'invoice'

const activeTicket = computed(() => {
  return ticketStore.issuedTicket || {
    orderId: ticketStore.currentOrderId || 'ORD-9821-2026',
    invoiceNo: ticketStore.paymentDetails?.invoiceNo || 'INV/2026/FT/982103',
    referenceNo: ticketStore.paymentDetails?.referenceNo || 'TRX-9821BCA-SETTLED',
    paymentMethod: ticketStore.paymentDetails?.method || 'BCA Virtual Account',
    accountNumber: ticketStore.paymentDetails?.accountNumber || '8801 0812 3456 7890',
    holderName: ticketStore.customer?.name || authStore.currentUser?.name || 'Kevin Pratama',
    holderNik: ticketStore.customer?.nik || '31710482910002',
    holderEmail: ticketStore.customer?.email || 'kevin.pratama@war-tiket.com',
    holderPhone: ticketStore.customer?.phone || '+62 812-3456-7890',
    categoryName: ticketStore.categoryDetails[ticketStore.selectedCategory]?.name || 'VIP Royal Floor',
    qty: ticketStore.quantity || 1,
    seatNo: `${ticketStore.selectedSeatName} (${ticketStore.selectedSeatZone})`,
    seats: [...ticketStore.selectedSeats],
    attendees: [...ticketStore.attendees],
    totalPaid: ticketStore.grandTotal || 387,
    issuedAt: new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }),
    qrHash: 'SEC-SHA256-AUTH-PASS',
  };
});

const qrPayloadText = computed(() => {
  const t = activeTicket.value;
  return JSON.stringify({
    system: 'FlashTiket Official Pass',
    status: 'AUTHENTIC_VERIFIED',
    invoiceNo: t.invoiceNo,
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
      `File resmi ${filename} telah tersimpan lengkap dengan QR Code, Barcode Code-128, dan watermark keaslian.`
    );
  } catch (err) {
    console.error('Download PDF error:', err);
    notifStore.push('error', 'Gagal Mengunduh PDF', err.message || 'Terjadi kesalahan saat memproses tiket.');
  } finally {
    isDownloadingPdf.value = false;
  }
}

function handlePrintInvoice() {
  window.print();
}

onMounted(() => {
  generateRealQrCode();
  generateBarcode();
});

watch(() => [ticketStore.issuedTicket, activeTicket.value], () => {
  generateRealQrCode();
  generateBarcode();
}, { deep: true });

function handleBackHome() {
  ticketStore.resetAll();
  queueStore.setStage('home');
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 md:px-8 py-8 space-y-8">

    <!-- Success Editorial Statement -->
    <div class="text-center space-y-3 border-b-2 border-black pb-6">
      <div class="inline-block px-3 py-1 bg-black text-white font-mono text-[10px] uppercase tracking-widest">
        PEMBAYARAN TERVERIFIKASI · DOKUMEN RESMI TERBIT
      </div>
      <h2 class="text-4xl sm:text-5xl font-serif font-black text-black tracking-tight">
        Transaksi Berhasil Diselesaikan
      </h2>
      <p class="font-body text-xs sm:text-sm text-[#525252] max-w-lg mx-auto">
        Dana telah diselesaikan secara sah. Anda dapat melihat <strong>E-Tiket Akses Masuk Konser</strong> atau mencetak <strong>Nota &amp; Faktur Pembayaran Resmi (Tax Invoice)</strong> di bawah ini.
      </p>

      <!-- Document Switcher Tabs (Minimalist Monochrome) -->
      <div class="flex items-center justify-center gap-3 pt-4 font-mono text-xs">
        <button
          @click="activeTab = 'ticket'"
          class="border-2 px-6 py-2.5 font-bold uppercase cursor-pointer transition-all"
          :class="activeTab === 'ticket' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-[#F5F5F5]'"
        >
          🎟️ 1. E-Tiket Gate Pass
        </button>

        <button
          @click="activeTab = 'invoice'"
          class="border-2 px-6 py-2.5 font-bold uppercase cursor-pointer transition-all"
          :class="activeTab === 'invoice' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-[#F5F5F5]'"
        >
          🧾 2. Nota &amp; Faktur Pajak Resmi
        </button>
      </div>
    </div>

    <!-- Celebration / MyTickets Sync Confirmation Alert -->
    <div class="border-2 border-black p-4 bg-[#F5F5F5] font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">✓</span>
        <div>
          <div class="font-bold text-black uppercase">PEMBAYARAN SUKSES &amp; TIKET RESMI TERBIT!</div>
          <div class="text-[11px] text-[#525252]">
            E-Tiket resmi telah otomatis ditambahkan ke akun Anda di menu "Tiket Saya".
          </div>
        </div>
      </div>
      <button 
        @click="authStore.isMyTicketsOpen = true"
        class="w-full sm:w-auto px-4 py-2 bg-black text-white hover:bg-neutral-800 border border-black font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer shrink-0"
      >
        🎟️ Buka &amp; Cek di "Tiket Saya" →
      </button>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 1: E-TICKET PERFORATED CONCERT PASS                      -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'ticket'" class="border-4 border-black bg-white relative overflow-hidden">
      
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
            <div class="font-bold text-sm tracking-wider">FLASHTIKET CONCERT PASS</div>
            <div class="text-[10px] text-white/70">100% SCANNABLE REAL GATE QR CODE</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[10px] text-white/70">NO. PESANAN</div>
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
              <div class="text-[10px] text-[#525252]">{{ activeTicket.qty }} Tiket Sah</div>
            </div>
          </div>

          <!-- Customer Identity Box -->
          <div class="border-2 border-black p-4 flex items-center justify-between font-mono text-xs uppercase">
            <div>
              <div class="text-[10px] text-[#525252]">Nama Pemesan Utama:</div>
              <div class="font-bold text-sm text-black">{{ activeTicket.holderName }}</div>
              <div class="text-[10px] text-[#525252]">NIK: {{ activeTicket.holderNik }}</div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-[#525252]">Status Transaksi:</div>
              <div class="font-bold text-black bg-black text-white px-2 py-0.5 inline-block">[LUNAS / SETTLED]</div>
            </div>
          </div>

          <!-- Group Attendee Roster (1 Tiket 1 NIK) -->
          <div v-if="activeTicket.attendees && activeTicket.attendees.length > 1" class="border border-black p-3 space-y-2 font-mono text-xs">
            <div class="flex items-center justify-between border-b border-[#E5E5E5] pb-1.5">
              <span class="font-bold text-[10px] uppercase text-black">
                Daftar Rombongan Tiket (Anti-Calo Verified · {{ activeTicket.attendees.length }} Peserta)
              </span>
              <span class="text-[9px] bg-black text-white px-1.5 py-0.5 font-mono">1 TIKET 1 ID</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              <div 
                v-for="att in activeTicket.attendees" 
                :key="att.index"
                class="border border-[#E5E5E5] bg-[#F9F9F9] p-2 text-[10px] flex flex-col justify-between"
              >
                <div class="flex justify-between font-bold text-black">
                  <span>#{{ att.index }}. {{ att.name }}</span>
                  <span class="font-mono text-[9px] border border-black px-1">{{ att.seat || ('Kursi ' + att.index) }}</span>
                </div>
                <div class="text-[#525252] text-[9px] mt-1 font-mono">
                  NIK: {{ att.nik }}
                </div>
              </div>
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
            GERBANG SCANNING VENUE
          </div>

          <div class="border-2 border-black p-2 bg-white inline-block">
            <img 
              v-if="qrDataUrl" 
              :src="qrDataUrl" 
              alt="QR Code Tiket" 
              class="w-44 h-44 object-contain filter contrast-125" 
            />
            <div v-else class="w-44 h-44 bg-[#F5F5F5] flex items-center justify-center text-xs font-mono text-[#525252]">
              Membuat QR Resmi...
            </div>
          </div>

          <div class="font-mono text-[10px] text-[#525252] space-y-1">
            <div class="font-bold text-black">SCAN PADA PINTU MASUK</div>
            <div>Tunjukkan barcode ini beserta KTP asli di gerbang konser.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 2: OFFICIAL TAX INVOICE & NOTA PEMBAYARAN RESMI          -->
    <!-- ============================================================ -->
    <div v-else class="border-4 border-black bg-white p-8 space-y-6 font-mono text-xs">
      
      <!-- Invoice Header: Corporate & Tax Identity -->
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-4 border-black pb-6">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 bg-black"></span>
            <span class="font-serif font-black text-xl text-black">PT FLASHTIKET INDONESIA TERDISTRIBUSI</span>
          </div>
          <div class="text-[10px] text-[#525252] mt-1 space-y-0.5">
            <div>NPWP Perusahaan: 01.829.391.0-021.000 (Pengusaha Kena Pajak)</div>
            <div>Gedung Bursa Efek Indonesia / Menara Sudirman Lt. 28, Jakarta Selatan 12190</div>
            <div>Surat Izin Usaha Penyelenggaraan Tiket Terdistribusi: No. 8921/KEMENPAREKRAF/2026</div>
          </div>
        </div>

        <div class="text-left sm:text-right border-2 border-black p-3 bg-[#F5F5F5] shrink-0">
          <div class="text-[9px] uppercase tracking-widest text-[#525252]">FAKTUR PEMBAYARAN RESMI</div>
          <div class="text-base font-bold text-black font-mono">{{ activeTicket.invoiceNo }}</div>
          <div class="text-[10px] text-[#525252]">NO. TRX: {{ activeTicket.referenceNo }}</div>
        </div>
      </div>

      <!-- Customer & Transaction Metadata 2-Column Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b-2 border-black pb-6">
        <div class="space-y-1.5">
          <div class="text-[10px] uppercase font-bold text-[#525252] border-b border-[#E5E5E5] pb-1">DITAGIHKAN KEPADA:</div>
          <div class="text-sm font-bold text-black font-serif">{{ activeTicket.holderName }}</div>
          <div class="text-[11px] text-[#525252]">NIK (KTP): <strong class="text-black">{{ activeTicket.holderNik }}</strong></div>
          <div class="text-[11px] text-[#525252]">Email: {{ activeTicket.holderEmail }}</div>
          <div class="text-[11px] text-[#525252]">WhatsApp: {{ activeTicket.holderPhone }}</div>
        </div>

        <div class="space-y-1.5 sm:text-right">
          <div class="text-[10px] uppercase font-bold text-[#525252] border-b border-[#E5E5E5] pb-1">INFORMASI TRANSAKSI:</div>
          <div class="text-[11px]">Waktu Bayar: <strong class="text-black">{{ activeTicket.issuedAt }}</strong></div>
          <div class="text-[11px]">Metode Bayar: <strong class="text-black">{{ activeTicket.paymentMethod }}</strong></div>
          <div class="text-[11px]">No. Rekening / VA: <span class="font-mono">{{ activeTicket.accountNumber }}</span></div>
          <div class="text-[11px]">ID Pemesanan: <span class="font-mono">{{ activeTicket.orderId }}</span></div>
        </div>
      </div>

      <!-- Detailed Itemized Financial Table -->
      <div class="space-y-2">
        <div class="font-bold text-[11px] uppercase tracking-wider text-[#525252]">RINCIAN TAGIHAN &amp; ALOKASI TIKET:</div>
        
        <table class="w-full border-collapse border border-black text-left text-xs">
          <thead>
            <tr class="bg-black text-white uppercase text-[10px]">
              <th class="p-2.5 border border-black text-center w-10">No</th>
              <th class="p-2.5 border border-black">Deskripsi Layanan / Tiket</th>
              <th class="p-2.5 border border-black text-center w-20">Qty</th>
              <th class="p-2.5 border border-black text-right w-32">Harga Satuan</th>
              <th class="p-2.5 border border-black text-right w-36">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-[#E5E5E5]">
              <td class="p-2.5 border border-black text-center font-bold">1</td>
              <td class="p-2.5 border border-black">
                <div class="font-bold text-black">{{ currentEvent.title }}</div>
                <div class="text-[10px] text-[#525252]">
                  Kategori: {{ activeTicket.categoryName }} · Kursi: {{ activeTicket.seatNo }}
                </div>
              </td>
              <td class="p-2.5 border border-black text-center font-bold">{{ activeTicket.qty }}</td>
              <td class="p-2.5 border border-black text-right">{{ ticketStore.formatMoney(ticketStore.unitPrice) }}</td>
              <td class="p-2.5 border border-black text-right font-bold">{{ ticketStore.formatMoney(ticketStore.unitPrice * activeTicket.qty) }}</td>
            </tr>

            <tr class="border-b border-[#E5E5E5] bg-[#FDFDFD]">
              <td class="p-2.5 border border-black text-center font-bold">2</td>
              <td class="p-2.5 border border-black">
                <div class="font-bold text-black">Biaya Pemrosesan Sistem &amp; Layanan Gerbang (Platform Fee)</div>
                <div class="text-[10px] text-[#525252]">Termasuk jaminan alokasi antrean real-time &amp; verifikasi barcode</div>
              </td>
              <td class="p-2.5 border border-black text-center font-bold">{{ activeTicket.qty }}</td>
              <td class="p-2.5 border border-black text-right">{{ ticketStore.formatMoney(ticketStore.bookingFee) }}</td>
              <td class="p-2.5 border border-black text-right font-bold">{{ ticketStore.formatMoney(ticketStore.bookingFee * activeTicket.qty) }}</td>
            </tr>

            <tr class="border-b border-black bg-[#FDFDFD]">
              <td class="p-2.5 border border-black text-center font-bold">3</td>
              <td class="p-2.5 border border-black">
                <div class="font-bold text-black">Pajak Pertambahan Nilai (PPN 11%)</div>
                <div class="text-[10px] text-[#525252]">Sesuai regulasi UU Harmonisasi Peraturan Perpajakan (HPP)</div>
              </td>
              <td class="p-2.5 border border-black text-center font-bold">1</td>
              <td class="p-2.5 border border-black text-right">{{ ticketStore.formatMoney(ticketStore.taxAmount) }}</td>
              <td class="p-2.5 border border-black text-right font-bold">{{ ticketStore.formatMoney(ticketStore.taxAmount) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-[#F5F5F5] font-bold text-sm">
              <td colspan="4" class="p-3 border border-black text-right uppercase">
                TOTAL PEMBAYARAN LUNAS (PAID):
              </td>
              <td class="p-3 border border-black text-right font-serif text-base text-black">
                {{ ticketStore.formatMoney(activeTicket.totalPaid) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Verified Attendee Friends Table in Invoice -->
      <div v-if="activeTicket.attendees && activeTicket.attendees.length > 1" class="border border-black p-4 space-y-2 bg-[#FAFAFA]">
        <div class="font-bold text-[10px] uppercase text-black flex items-center justify-between border-b border-[#E5E5E5] pb-1">
          <span>Daftar Peserta Rombongan Terdaftar (Anti-Calo Verified):</span>
          <span>{{ activeTicket.attendees.length }} PESERTA RESMI</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
          <div v-for="att in activeTicket.attendees" :key="att.index" class="p-1.5 border border-[#E5E5E5] bg-white flex justify-between">
            <div>
              <strong class="text-black">#{{ att.index }} {{ att.name }}</strong>
              <div class="text-[#525252] text-[9px]">NIK: {{ att.nik }}</div>
            </div>
            <span class="font-bold font-mono border border-black px-1.5 py-0.5 h-fit text-[9px]">{{ att.seat }}</span>
          </div>
        </div>
      </div>

      <!-- Legal Stamp & Security Disclaimer -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-6 border-t-2 border-black pt-6">
        <div class="text-[10px] text-[#525252] space-y-1">
          <div class="font-bold text-black uppercase">Pemberitahuan Pajak &amp; Keabsahan:</div>
          <div>Faktur ini diterbitkan secara elektronik dan sah sebagai bukti pemotongan pajak serta pembayaran resmi tiket konser.</div>
          <div class="font-mono text-[9px]">Hash Integritas: {{ activeTicket.qrHash }} · Settled via BI-FAST</div>
        </div>

        <!-- Official Wet Stamp Digital Badge -->
        <div class="border-4 border-black p-3 text-center rotate-[-2deg] select-none shrink-0 bg-white">
          <div class="text-[9px] uppercase tracking-widest font-black text-black">PT FLASHTIKET INDONESIA</div>
          <div class="text-lg font-serif font-black text-black tracking-wider my-0.5">★ LUNAS (PAID) ★</div>
          <div class="text-[8px] uppercase tracking-wider font-mono text-[#525252]">TERVERIFIKASI SISTEM RESMI</div>
        </div>
      </div>

      <!-- Print Invoice Button -->
      <div class="pt-4 border-t border-black flex flex-wrap gap-4 justify-end">
        <button
          @click="handlePrintInvoice()"
          class="btn-mono-secondary px-6 py-3 text-xs font-bold cursor-pointer flex items-center gap-2"
        >
          <span>🖨️ Cetak / Unduh Nota Pembayaran (PDF)</span>
        </button>
      </div>

    </div>

    <!-- Action Toolbar at Bottom -->
    <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-black font-mono text-xs">
      <button
        @click="handleBackHome()"
        class="border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors cursor-pointer uppercase"
      >
        ← Kembali ke Katalog Acara
      </button>

      <div class="flex flex-wrap gap-3">
        <button
          @click="authStore.isMyTicketsOpen = true"
          class="border-2 border-black px-5 py-3 font-bold hover:bg-black hover:text-white transition-colors cursor-pointer uppercase flex items-center gap-2"
        >
          <span>🎟️ Lihat di "Tiket Saya"</span>
        </button>

        <button
          @click="handleDownloadPdf()"
          :disabled="isDownloadingPdf"
          class="btn-mono-primary px-6 py-3 cursor-pointer flex items-center gap-2"
        >
          <span v-if="isDownloadingPdf">Memproses PDF...</span>
          <span v-else>Unduh E-Tiket Masuk (PDF Resmi) →</span>
        </button>
      </div>
    </div>

  </div>
</template>
