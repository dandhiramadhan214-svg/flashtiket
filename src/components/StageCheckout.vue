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
const isPaymentModalOpen = ref(false);
const isVerifyingTransfer = ref(false);
const copiedField = ref('');

// Payment Channels (Virtual Accounts, QRIS, Credit Card)
const channels = [
  { id: 'bca_va', name: 'BCA Virtual Account', bank: 'BCA', va: '8801 0812 3456 7890', badge: 'Instan · 0 Detik' },
  { id: 'mandiri_va', name: 'Mandiri Virtual Account', bank: 'MANDIRI', va: '8910 2812 3456 7890', badge: 'Livin by Mandiri' },
  { id: 'bri_va', name: 'BRI Virtual Account (BRIVA)', bank: 'BRI', va: '1280 0812 3456 7890', badge: 'BRImo' },
  { id: 'bni_va', name: 'BNI Virtual Account', bank: 'BNI', va: '9881 0812 3456 7890', badge: 'BNI Mobile' },
  { id: 'qris', name: 'QRIS Dinamis 2026', bank: 'QRIS', va: 'NMID: ID102003891023', badge: 'Semua e-Wallet & m-Banking' },
];

const selectedChannel = ref(channels[0]);

onMounted(async () => {
  if (authStore.isLoggedIn) {
    ticketStore.customer.name = authStore.currentUser.name;
    ticketStore.customer.email = authStore.currentUser.email;
    ticketStore.customer.phone = authStore.currentUser.phone;
    ticketStore.customer.nik = authStore.currentUser.nik;
  }
  paymentStore.loadSnapJS();
});

function handleOpenPaymentModal() {
  if (!ticketStore.customer.name || !ticketStore.customer.nik || !ticketStore.customer.email) {
    alert('Mohon lengkapi Data Pemesan Utama terlebih dahulu.');
    return;
  }
  isPaymentModalOpen.value = true;
}

function handleCopy(text, field) {
  navigator.clipboard.writeText(text);
  copiedField.value = field;
  setTimeout(() => {
    copiedField.value = '';
  }, 2000);
}

function handleSimulatePayment() {
  isVerifyingTransfer.value = true;

  setTimeout(() => {
    isVerifyingTransfer.value = false;
    isPaymentModalOpen.value = false;

    try {
      ticketStore.confirmPayment(selectedChannel.value.name, selectedChannel.value.va);
      
      const evt = currentEvent.value || {
        title: 'Coldplay: Music of the Spheres Tour 2026',
        venue: 'Stadion Utama Gelora Bung Karno',
        city: 'Jakarta',
        date: '15 November 2026'
      };

      authStore.addPurchasedTicket({
        orderId: ticketStore.issuedTicket?.orderId || 'ORD-9821-2026',
        invoiceNo: ticketStore.paymentDetails?.invoiceNo || 'INV/2026/FT/982103',
        eventTitle: evt.title,
        venue: `${evt.venue}, ${evt.city}`,
        date: evt.date,
        seatNo: ticketStore.issuedTicket?.seatNo || 'SEAT-1',
        categoryName: ticketStore.issuedTicket?.categoryName || 'VIP',
        totalPaid: ticketStore.issuedTicket?.totalPaid || ticketStore.grandTotal,
        issuedAt: ticketStore.issuedTicket?.issuedAt || new Date().toLocaleString('id-ID'),
        paymentMethod: selectedChannel.value.name,
        qty: ticketStore.quantity || 1,
        seats: [...ticketStore.selectedSeats],
        attendees: [...ticketStore.attendees],
      });
    } catch (e) {
      console.error('Payment confirmation error:', e);
    }

    queueStore.setStage('ticket');
  }, 900);
}

function handleCancel() {
  if (confirm('Yakin membatalkan pesanan ini? Kuota kursi akan otomatis dikembalikan ke antrean publik.')) {
    ticketStore.autoRollback('USER_MANUAL_CANCEL');
    paymentStore.reset();
    isPaymentModalOpen.value = false;
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
          <div>
            <h3 class="font-serif font-bold text-xl text-black">
              Data Pemesan Utama (Lead Booker)
            </h3>
            <div class="font-mono text-[10px] text-[#525252] mt-0.5">Penanggung jawab pesanan &amp; penerima faktur resmi</div>
          </div>

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
              Nama Lengkap Pemesan (Sesuai KTP / Paspor)
            </label>
            <input 
              v-model="ticketStore.customer.name" 
              type="text"
              class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-serif font-semibold focus:border-b-4 focus:outline-none transition-all" 
            />
          </div>

          <div>
            <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">
              Nomor Induk Kependudukan (NIK Pemesan)
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
                Alamat Email Pengiriman Nota &amp; E-Tiket
              </label>
              <input 
                v-model="ticketStore.customer.email" 
                type="email"
                class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-mono focus:border-b-4 focus:outline-none transition-all" 
              />
            </div>
            <div>
              <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">
                Nomor WhatsApp Konfirmasi
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
            <div class="space-y-4 max-h-72 overflow-y-auto pr-1">
              <div 
                v-for="(att, idx) in ticketStore.attendees.slice(1)" 
                :key="att.index"
                class="border border-black p-3 bg-[#F9F9F9] space-y-3"
              >
                <div class="flex items-center justify-between text-[11px] font-bold border-b border-[#E5E5E5] pb-1">
                  <span>TIKET #{{ att.index }} (ALOKASI: {{ ticketStore.selectedSeats[att.index - 1] || 'FESTIVAL' }})</span>
                  <span class="text-[9px] bg-black text-white px-1.5 py-0.2">ID TERVERIFIKASI</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[9px] uppercase tracking-wider text-[#525252] mb-0.5">
                      Nama Lengkap Teman #{{ att.index }}
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

        <!-- Payment Method Selector (Professional Virtual Account & QRIS) -->
        <div class="border-t-2 border-black pt-6 space-y-4 font-mono">
          <div class="flex items-center justify-between">
            <div class="text-[10px] uppercase tracking-widest text-[#525252]">PILIH SALURAN PEMBAYARAN RESMI</div>
            <span class="text-[10px] text-black font-bold">OTOMATIS / VERIFIKASI INSTAN</span>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div 
              v-for="ch in channels" 
              :key="ch.id"
              @click="selectedChannel = ch"
              class="border-2 p-3.5 cursor-pointer transition-colors relative"
              :class="selectedChannel.id === ch.id ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:border-4'"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold uppercase text-[11px]">{{ ch.name }}</span>
                <span class="text-[9px] border px-1 border-current">{{ ch.bank }}</span>
              </div>
              <div class="text-[10px] opacity-70 mt-1 font-mono truncate">No. VA: {{ ch.va }}</div>
              <div class="mt-2 text-[9px] font-bold">
                {{ selectedChannel.id === ch.id ? '[● TERPILIH]' : '[○ PILIH]' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Editorial Order Invoice & Final Call-to-Action -->
      <div class="md:col-span-5 border-2 border-black p-8 space-y-6 bg-white font-mono">
        <div class="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <h3 class="font-serif font-bold text-xl text-black">Rincian Faktur</h3>
            <div class="text-[10px] text-[#525252]">KODE ORDER: {{ ticketStore.currentOrderId }}</div>
          </div>
          <span class="bg-black text-white text-[9px] px-2 py-0.5 font-bold uppercase">SIAP BAYAR</span>
        </div>

        <div class="space-y-3 text-xs">
          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">KONSORSIUM ACARA:</span>
            <span class="font-bold text-black text-right truncate max-w-[200px]">{{ currentEvent.title }}</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">KATEGORI TIKET:</span>
            <span class="font-bold text-black text-right">{{ ticketStore.categoryDetails[ticketStore.selectedCategory].name }}</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">NOMOR KURSI:</span>
            <span class="font-bold text-black text-right truncate max-w-[200px]">{{ ticketStore.selectedSeatName }}</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">JUMLAH TIKET:</span>
            <span class="text-black font-bold">{{ ticketStore.quantity }} Tiket (Rombongan)</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">TARIF DASAR TIKET:</span>
            <span class="text-black">{{ ticketStore.formatMoney(ticketStore.unitPrice) }} × {{ ticketStore.quantity }}</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">BIAYA LAYANAN / BOOKING:</span>
            <span class="text-black">{{ ticketStore.formatMoney(ticketStore.bookingFee * ticketStore.quantity) }}</span>
          </div>

          <div class="flex justify-between border-b border-[#E5E5E5] pb-2">
            <span class="text-[#525252]">PAJAK PERTAMBAHAN NILAI (11%):</span>
            <span class="text-black">{{ ticketStore.formatMoney(ticketStore.taxAmount) }}</span>
          </div>

          <div class="pt-2 flex justify-between font-serif font-bold text-xl text-black border-t-2 border-black">
            <span>TOTAL TAGIHAN:</span>
            <span>{{ ticketStore.formatMoney(ticketStore.grandTotal) }}</span>
          </div>
        </div>

        <!-- Open Payment Modal CTA -->
        <button
          @click="handleOpenPaymentModal()"
          class="btn-mono-primary w-full py-4 text-xs font-bold cursor-pointer text-center"
        >
          <span>Lanjut ke Pembayaran {{ selectedChannel.bank }} →</span>
        </button>

        <button 
          @click="handleCancel()"
          class="w-full text-center text-[11px] text-[#525252] hover:text-black font-mono uppercase underline cursor-pointer"
        >
          Batalkan Pesanan &amp; Kembalikan Kuota
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- PROFESSIONAL PAYMENT GATEWAY MODAL (BANK VA & QRIS SIMULATION) -->
    <!-- ============================================================ -->
    <div 
      v-if="isPaymentModalOpen" 
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <div class="bg-white border-4 border-black max-w-xl w-full p-6 md:p-8 space-y-6 font-mono text-xs relative max-h-[92vh] overflow-y-auto">
        
        <!-- Modal Top Bar -->
        <div class="flex items-center justify-between border-b-2 border-black pb-4">
          <div>
            <div class="text-[10px] uppercase tracking-widest text-[#525252]">PORTAL TRANSAKSI PEMBAYARAN RESMI</div>
            <h3 class="font-serif font-bold text-2xl text-black">
              {{ selectedChannel.name }}
            </h3>
          </div>
          <button 
            @click="isPaymentModalOpen = false" 
            class="w-8 h-8 border border-black flex items-center justify-center font-bold text-base hover:bg-black hover:text-white cursor-pointer"
          >✕</button>
        </div>

        <!-- Total Tagihan Box -->
        <div class="border-2 border-black p-4 bg-[#F5F5F5] flex items-center justify-between">
          <div>
            <div class="text-[10px] text-[#525252] uppercase">Total Jumlah Pembayaran</div>
            <div class="text-2xl font-serif font-black text-black">
              {{ ticketStore.formatMoney(ticketStore.grandTotal) }}
            </div>
          </div>
          <button 
            @click="handleCopy(ticketStore.grandTotal.toString(), 'amount')" 
            class="border border-black px-3 py-1 text-[10px] font-bold bg-white hover:bg-black hover:text-white cursor-pointer"
          >
            {{ copiedField === 'amount' ? '✓ TERSALIN' : 'SALIN NOMINAL' }}
          </button>
        </div>

        <!-- Virtual Account Box -->
        <div class="border-2 border-black p-5 space-y-3 bg-white">
          <div class="text-[10px] uppercase text-[#525252] flex items-center justify-between">
            <span>Nomor Virtual Account (VA)</span>
            <span class="text-black font-bold">Verifikasi Otomatis 24 Jam</span>
          </div>

          <div class="flex items-center justify-between bg-black text-white p-3 border border-black">
            <span class="text-lg sm:text-xl font-mono tracking-widest font-bold">
              {{ selectedChannel.va }}
            </span>
            <button 
              @click="handleCopy(selectedChannel.va.replace(/\s+/g, ''), 'va')" 
              class="border border-white bg-white text-black px-3 py-1 text-xs font-bold hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              {{ copiedField === 'va' ? '✓ TERSALIN' : 'SALIN' }}
            </button>
          </div>

          <div class="text-[10px] text-[#525252] flex justify-between">
            <span>Atas Nama Rekening:</span>
            <strong class="text-black font-bold">FLASHTIKET - {{ ticketStore.customer.name }}</strong>
          </div>
        </div>

        <!-- Interactive Bank Simulation CTA Button (Instant Access) -->
        <div class="space-y-2 pt-1">
          <button
            @click="handleSimulatePayment()"
            :disabled="isVerifyingTransfer"
            class="btn-mono-primary w-full py-4 text-xs font-bold text-center cursor-pointer flex items-center justify-center gap-2"
          >
            <span v-if="isVerifyingTransfer">⏳ Memeriksa Mutasi Bank di Sistem Real-Time...</span>
            <span v-else>⚡ Simulasikan Transfer m-Banking Selesai (Verifikasi Bayar) →</span>
          </button>
          <div class="text-[10px] text-[#525252] text-center">
            Sistem mendengarkan mutasi bank secara real-time. Klik tombol di atas untuk menyelesaikan pesanan.
          </div>
        </div>

        <!-- Transfer Instructions -->
        <div class="border border-black p-4 space-y-2 bg-[#FAFAFA]">
          <div class="font-bold text-[11px] uppercase border-b border-[#E5E5E5] pb-1">
            Petunjuk Pembayaran Melalui {{ selectedChannel.bank }}:
          </div>
          <ol class="list-decimal list-inside space-y-1 text-[11px] text-[#525252]">
            <li>Buka aplikasi m-Banking (Mobile Banking) atau ATM {{ selectedChannel.bank }}.</li>
            <li>Pilih menu <strong>Transfer / Pembayaran > Virtual Account</strong>.</li>
            <li>Masukkan nomor VA: <strong>{{ selectedChannel.va }}</strong>.</li>
            <li>Pastikan nama tagihan sesuai: <strong>FLASHTIKET - {{ ticketStore.customer.name }}</strong>.</li>
            <li>Konfirmasi PIN transaksi dan simpan bukti struk transfer.</li>
          </ol>
        </div>

        <div class="text-center">
          <button 
            @click="isPaymentModalOpen = false" 
            class="text-[10px] text-[#525252] hover:text-black uppercase underline cursor-pointer"
          >
            Tutup &amp; Pilih Saluran Lain
          </button>
        </div>

      </div>
    </div>

  </div>
</template>
