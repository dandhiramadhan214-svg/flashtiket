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
  <div v-if="authStore.isMyTicketsOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop Blur -->
    <div 
      class="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
      @click="authStore.isMyTicketsOpen = false"
    ></div>

    <!-- Modal Box -->
    <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 max-h-[85vh] flex flex-col transition-colors">
      <!-- Header -->
      <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <SvgIcon name="ticket" className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 class="font-bold text-slate-800 dark:text-white text-sm">Tiket Saya</h2>
            <p class="text-[11px] text-slate-400 dark:text-slate-400">E-Tiket resmi yang telah terkonfirmasi</p>
          </div>
        </div>
        <button 
          @click="authStore.isMyTicketsOpen = false"
          class="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-xs font-bold cursor-pointer"
        >
          <SvgIcon name="cancel" className="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Ticket List -->
      <div class="p-5 overflow-y-auto space-y-4 flex-1">
        <!-- If empty -->
        <div v-if="!authStore.currentUser.myTickets || authStore.currentUser.myTickets.length === 0" class="text-center py-10 space-y-3">
          <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <SvgIcon name="ticket" className="w-7 h-7 text-slate-400" />
          </div>
          <h3 class="font-bold text-slate-700 dark:text-slate-200 text-sm">Belum Ada Tiket yang Dibeli</h3>
          <p class="text-xs text-slate-400 dark:text-slate-400 max-w-xs mx-auto">Tiket yang Anda pesan untuk konser atau acara akan otomatis tersimpan di sini.</p>
          <button 
            @click="authStore.isMyTicketsOpen = false; queueStore.setStage('home');"
            class="px-4 py-2 rounded-xl bg-navy dark:bg-sky text-white text-xs font-bold shadow-soft hover:bg-navy-light dark:hover:brightness-110 cursor-pointer"
          >
            Jelajahi Event Sekarang
          </button>
        </div>

        <!-- If has tickets -->
        <div 
          v-else 
          v-for="t in authStore.currentUser.myTickets" 
          :key="t.orderId"
          class="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all"
        >
          <div class="flex items-start justify-between">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                {{ t.categoryName }}
              </span>
              <h3 class="font-extrabold text-slate-800 dark:text-white text-sm mt-1">{{ t.eventTitle }}</h3>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ t.venue }}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-mint-light dark:bg-emerald-950/40 text-mint dark:text-emerald-400 text-[10px] font-bold">
              Lunas &amp; Aktif
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <span class="text-slate-400 block text-[10px]">KODE ORDER</span>
              <span class="font-bold text-navy dark:text-sky">{{ t.orderId }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">NOMOR KURSI</span>
              <span class="font-bold text-slate-700 dark:text-slate-200 truncate block">{{ t.seatNo }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <span class="text-[11px] text-slate-400">{{ t.issuedAt }}</span>
            
            <div class="flex items-center gap-3">
              <!-- Download PDF button -->
              <button 
                @click="handleDownloadTicketPdf(t)"
                :disabled="downloadingOrderId === t.orderId"
                class="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Download Official PDF Pass"
              >
                <SvgIcon v-if="downloadingOrderId !== t.orderId" name="download" className="w-3.5 h-3.5" />
                <span v-else class="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></span>
                <span>PDF</span>
              </button>

              <!-- View QR code -->
              <button 
                @click="authStore.isMyTicketsOpen = false; queueStore.setStage('ticket');"
                class="text-xs text-navy dark:text-sky hover:text-coral dark:hover:text-coral font-bold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
              >
                <span>Buka QR</span>
                <SvgIcon name="arrow-right" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
