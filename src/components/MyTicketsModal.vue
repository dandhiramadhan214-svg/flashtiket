<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useQueueStore } from '../stores/queueStore';
import { useTicketStore } from '../stores/ticketStore';
import { useEventsStore } from '../stores/eventsStore';
import { useNotifStore } from '../stores/notifStore';
import { downloadOfficialTicketPdf } from '../services/pdfTicketService';
import SvgIcon from './SvgIcon.vue';

const authStore = useAuthStore();
const queueStore = useQueueStore();
const ticketStore = useTicketStore();
const eventsStore = useEventsStore();
const notifStore = useNotifStore();

const downloadingOrderId = ref(null);

async function handleDownloadTicketPdf(ticketItem) {
  if (downloadingOrderId.value) return;
  downloadingOrderId.value = ticketItem.orderId;

  try {
    const matchedEvent = eventsStore.events.find(e => e.title === ticketItem.eventTitle) || eventsStore.selectedEvent;
    const filename = await downloadOfficialTicketPdf({
      ticket: {
        orderId: ticketItem.orderId,
        seatNo: ticketItem.seatNo,
        categoryName: ticketItem.categoryName,
        holderName: authStore.currentUser?.name || 'Kevin Pratama',
        totalPaid: ticketItem.totalPaid || 5500000,
        issuedAt: ticketItem.issuedAt,
        qty: ticketItem.qty || 1,
      },
      event: matchedEvent,
      customer: authStore.currentUser,
      formatMoney: ticketStore.formatMoney,
    });

    notifStore.push(
      'success',
      'E-Tiket PDF Diunduh',
      `File ${filename} berhasil diunduh ke perangkat Anda.`
    );
  } catch (err) {
    console.error('Download ticket error:', err);
    notifStore.push('error', 'Gagal Mengunduh PDF', err.message || 'Terjadi kesalahan sistem.');
  } finally {
    downloadingOrderId.value = null;
  }
}
</script>

<template>
  <div v-if="authStore.isMyTicketsOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0"
      @click="authStore.isMyTicketsOpen = false"
    ></div>

    <!-- Modal Box (Minimalist Monochrome) -->
    <div class="relative w-full max-w-lg bg-white border-4 border-black p-6 space-y-6 z-10 max-h-[85vh] flex flex-col font-mono">
      <!-- Header -->
      <div class="flex items-center justify-between border-b-2 border-black pb-3">
        <div>
          <span class="text-[10px] text-[#525252] uppercase tracking-widest">DOMPET TIKET</span>
          <h2 class="font-serif font-black text-2xl text-black">Tiket Saya</h2>
        </div>
        <button 
          @click="authStore.isMyTicketsOpen = false"
          class="font-mono text-xs uppercase underline text-[#525252] hover:text-black cursor-pointer"
        >
          [Tutup]
        </button>
      </div>

      <!-- Ticket List -->
      <div class="overflow-y-auto space-y-4 flex-1">
        <!-- If empty -->
        <div v-if="!authStore.currentUser.myTickets || authStore.currentUser.myTickets.length === 0" class="text-center py-12 space-y-4 border-2 border-black p-6">
          <div class="font-serif font-bold text-lg text-black">Belum Ada Tiket yang Dipesan</div>
          <p class="font-body text-xs text-[#525252] max-w-xs mx-auto">
            Tiket resmi konser yang Anda amankan di antrean war tiket akan otomatis tercatat di sini.
          </p>
          <button 
            @click="authStore.isMyTicketsOpen = false; queueStore.setStage('home');"
            class="btn-mono-primary text-xs"
          >
            Lihat Katalog Acara →
          </button>
        </div>

        <!-- If has tickets -->
        <div 
          v-else 
          v-for="t in authStore.currentUser.myTickets" 
          :key="t.orderId"
          class="border-2 border-black p-5 space-y-4 bg-white transition-colors hover:bg-[#FAFAFA]"
        >
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">
                  {{ t.categoryName }}
                </span>
                <span v-if="t.qty && t.qty > 1" class="text-[10px] font-bold uppercase border border-black px-1.5 py-0.5 bg-[#F5F5F5]">
                  {{ t.qty }} TIKET ROMBONGAN
                </span>
              </div>
              <h3 class="font-serif font-bold text-black text-lg mt-1">{{ t.eventTitle }}</h3>
              <p class="text-xs text-[#525252]">{{ t.venue }}</p>
            </div>
            <div class="text-right">
              <span class="px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase">
                LUNAS (SETTLED)
              </span>
              <div class="text-[9px] text-[#525252] font-mono mt-1">{{ t.invoiceNo || 'INV/OFFICIAL' }}</div>
            </div>
          </div>

          <div class="space-y-2 text-xs border border-black p-3 bg-[#F5F5F5]">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-[#525252] block text-[10px] uppercase">ID PEMESANAN</span>
                <span class="font-bold text-black font-mono">{{ t.orderId }}</span>
              </div>
              <div>
                <span class="text-[#525252] block text-[10px] uppercase">ALOKASI KURSI</span>
                <span class="font-bold text-black font-mono">
                  {{ t.seats && t.seats.length ? t.seats.join(', ') : t.seatNo }}
                </span>
              </div>
            </div>

            <!-- Attendee Friends List for Group Bookings -->
            <div v-if="t.attendees && t.attendees.length > 1" class="pt-2 border-t border-[#E5E5E5] space-y-1">
              <span class="text-[9px] text-[#525252] uppercase font-bold block">
                Peserta Rombongan Terdaftar (1 Tiket 1 NIK):
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]">
                <div 
                  v-for="att in t.attendees" 
                  :key="att.index"
                  class="bg-white border border-[#E5E5E5] px-2 py-1 flex justify-between"
                >
                  <span class="font-bold text-black">#{{ att.index }}. {{ att.name }}</span>
                  <span class="font-mono text-[9px] text-[#525252]">{{ att.seat }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-black text-xs">
            <span class="text-[10px] text-[#525252]">{{ t.issuedAt }}</span>
            
            <div class="flex items-center gap-3">
              <!-- Download PDF button -->
              <button 
                @click="handleDownloadTicketPdf(t)"
                :disabled="downloadingOrderId === t.orderId"
                class="px-3 py-1.5 border border-black text-xs font-bold hover:bg-black hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <span v-if="downloadingOrderId === t.orderId">Membuat...</span>
                <span v-else>Unduh PDF ↓</span>
              </button>

              <!-- View QR code & Nota -->
              <button 
                @click="authStore.isMyTicketsOpen = false; queueStore.setStage('ticket');"
                class="px-3 py-1.5 bg-black text-white border border-black text-xs font-bold hover:bg-white hover:text-black transition-colors cursor-pointer"
              >
                Buka E-Tiket &amp; Nota →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
