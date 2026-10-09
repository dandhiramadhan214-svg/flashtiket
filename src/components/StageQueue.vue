<script setup>
import { computed } from 'vue';
import { useQueueStore } from '../stores/queueStore';
import { useTicketStore } from '../stores/ticketStore';
import { useEventsStore } from '../stores/eventsStore';
import SvgIcon from './SvgIcon.vue';

const queueStore = useQueueStore();
const ticketStore = useTicketStore();
const eventsStore = useEventsStore();

const currentEvent = computed(() => eventsStore.selectedEvent);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

    <!-- Event indicator & Notice Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-light dark:bg-amber-950/40 border border-amber/30 dark:border-amber-800/40 rounded-2xl p-4 transition-colors">
      <div class="flex items-center gap-3">
        <SvgIcon name="warning" className="w-6 h-6 text-amber dark:text-amber-400 shrink-0" />
        <div>
          <div class="text-xs font-bold text-slate-800 dark:text-amber-200">Ruang Tunggu Antrean Resmi: {{ currentEvent.title }}</div>
          <p class="text-[11px] sm:text-xs text-slate-600 dark:text-amber-300/80">
            Harap tetap berada di halaman ini. Anda akan otomatis dialihkan ke pemilihan kursi saat giliran tiba.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <span class="w-2 h-2 rounded-full bg-mint animate-ping"></span>
        <span class="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-semibold uppercase">{{ currentEvent.city }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Queue Card -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-6 sm:p-8 text-center space-y-6 transition-colors">
        <div class="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-medium">
          <span class="w-2.5 h-2.5 rounded-full bg-navy dark:bg-sky animate-pulse"></span>
          <span>Nomor Antrean Anda Saat Ini</span>
        </div>

        <!-- Big Queue Number -->
        <div class="text-6xl sm:text-8xl font-extrabold text-navy dark:text-sky font-mono tracking-tighter">
          #{{ queueStore.queueNumber.toLocaleString('id-ID') }}
        </div>

        <!-- Progress Bar -->
        <div class="w-full max-w-lg mx-auto">
          <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              class="bg-gradient-to-r from-navy to-sky dark:from-sky dark:to-teal-400 h-full rounded-full transition-all duration-500"
              :style="{ width: queueStore.progressPct + '%' }"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-slate-400 dark:text-slate-400 mt-2 font-mono">
            <span>Kemajuan {{ queueStore.progressPct }}%</span>
            <span>Kapasitas Server: ~120 tiket/dtk</span>
          </div>
        </div>

        <!-- Stats (Responsive: 1 col on mobile, 3 on sm+) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
          <div class="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
            <div class="text-[11px] text-slate-400 dark:text-slate-400 font-medium">Pengantre di Depan Anda</div>
            <div class="font-bold text-slate-700 dark:text-slate-200 font-mono mt-0.5 text-sm sm:text-base">
              {{ Math.max(0, queueStore.queueNumber - 1).toLocaleString('id-ID') }}
            </div>
          </div>
          <div class="bg-sky-light dark:bg-sky-950/40 rounded-xl p-3 text-center border border-sky/20 dark:border-sky-800/40">
            <div class="text-[11px] text-slate-400 dark:text-slate-300 font-medium">Estimasi Giliran Tiba</div>
            <div class="font-bold text-sky dark:text-sky-300 font-mono mt-0.5 text-sm sm:text-base">
              {{ queueStore.etaFormatted }}
            </div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
            <div class="text-[11px] text-slate-400 dark:text-slate-400 font-medium">Token Sesi Resmi</div>
            <div class="font-bold text-slate-700 dark:text-slate-200 font-mono mt-0.5 text-sm sm:text-base">
              JWT-88A9
            </div>
          </div>
        </div>

        <!-- Fast Track Action -->
        <div class="pt-2">
          <button
            @click="queueStore.skipQueue()"
            class="text-xs text-slate-400 dark:text-slate-400 hover:text-navy dark:hover:text-sky font-semibold underline underline-offset-4 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <SvgIcon name="bolt" className="w-3.5 h-3.5" />
            <span>Akselerasi Jalur Cepat (Express Pass)</span>
          </button>
        </div>
      </div>

      <!-- Sidebar: Live Stock -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-5 transition-colors">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm sm:text-base">
            <SvgIcon name="ticket" className="w-5 h-5 text-navy dark:text-sky" />
            Ketersediaan Kuota
          </h3>
          <span class="text-[11px] text-mint font-bold flex items-center gap-1 font-mono">
            <span class="w-1.5 h-1.5 rounded-full bg-mint animate-pulse"></span>
            Terhubung Langsung
          </span>
        </div>

        <div class="space-y-4">
          <!-- VIP -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs sm:text-[13px]">
              <span class="font-semibold text-purple-600 dark:text-purple-400">VIP Soundcheck</span>
              <span class="font-mono text-slate-600 dark:text-slate-300 font-bold">{{ ticketStore.stock.vip }} / {{ ticketStore.initialStock.vip }}</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-purple-500 h-full rounded-full transition-all" :style="{ width: (ticketStore.stock.vip / ticketStore.initialStock.vip * 100) + '%' }"></div>
            </div>
          </div>

          <!-- CAT 1 -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs sm:text-[13px]">
              <span class="font-semibold text-sky dark:text-sky-400">CAT 1 Standing</span>
              <span class="font-mono text-slate-600 dark:text-slate-300 font-bold">{{ ticketStore.stock.cat1 }} / {{ ticketStore.initialStock.cat1 }}</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-sky h-full rounded-full transition-all" :style="{ width: (ticketStore.stock.cat1 / ticketStore.initialStock.cat1 * 100) + '%' }"></div>
            </div>
          </div>

          <!-- CAT 2 -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs sm:text-[13px]">
              <span class="font-semibold text-slate-600 dark:text-slate-400">CAT 2 Seated</span>
              <span class="font-mono text-slate-600 dark:text-slate-300 font-bold">{{ ticketStore.stock.cat2 }} / {{ ticketStore.initialStock.cat2 }}</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-slate-400 h-full rounded-full transition-all" :style="{ width: (ticketStore.stock.cat2 / ticketStore.initialStock.cat2 * 100) + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="p-3 bg-sky-light dark:bg-sky-950/40 border border-sky/20 dark:border-sky-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
          <SvgIcon name="bulb" className="w-4 h-4 text-sky shrink-0 mt-0.5" />
          <span>Kuota berkurang otomatis secara real-time seiring pembeli lain yang menyelesaikan pembayaran.</span>
        </div>
      </div>
    </div>
  </div>
</template>
