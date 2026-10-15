<script setup>
import { computed } from 'vue';
import { useQueueStore } from '../stores/queueStore';
import { useTicketStore } from '../stores/ticketStore';
import { useEventsStore } from '../stores/eventsStore';
import { useAuthStore } from '../stores/authStore';
import SvgIcon from './SvgIcon.vue';

const queueStore = useQueueStore();
const ticketStore = useTicketStore();
const eventsStore = useEventsStore();
const authStore = useAuthStore();

const currentEvent = computed(() => eventsStore.selectedEvent);
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-8">

    <!-- Event Banner Notice (Stark Monochrome) -->
    <div class="border-2 border-black p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white font-mono text-xs uppercase">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 bg-black"></span>
        <div>
          <span class="font-bold text-black">ANTREAN AKTIF: {{ currentEvent.title }}</span>
          <p class="text-[10px] text-[#525252] normal-case mt-0.5">
            Sistem FIFO (First-In, First-Out). Jangan menutup atau merefresh halaman ini.
          </p>
        </div>
      </div>
      <div class="text-[11px] font-bold text-black">
        [SESI VALID: SEC-ZSET]
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Main Queue Card -->
      <div class="lg:col-span-8 border-4 border-black p-8 sm:p-12 text-center space-y-8 bg-white">
        <div class="font-mono text-xs uppercase tracking-widest text-[#525252] flex items-center justify-center gap-2">
          <span class="w-2 h-2 bg-black"></span>
          <span>URUTAN ANTREAN RESMI ANDA</span>
        </div>

        <!-- Big Queue Number in Playfair Serif -->
        <div class="text-7xl sm:text-9xl font-serif font-black tracking-tighter text-black leading-none">
          #{{ queueStore.queueNumber.toLocaleString('id-ID') }}
        </div>

        <!-- Sharp Progress Bar -->
        <div class="w-full max-w-md mx-auto space-y-2">
          <div class="w-full h-3 border-2 border-black bg-white p-0.5">
            <div
              class="bg-black h-full transition-all duration-100"
              :style="{ width: queueStore.progressPct + '%' }"
            ></div>
          </div>
          <div class="flex justify-between font-mono text-[10px] uppercase text-[#525252]">
            <span>KEMAJUAN: {{ queueStore.progressPct }}%</span>
            <span>THROUGHPUT: 120 REQ/DETIK</span>
          </div>
        </div>

        <!-- Stats Boxes (Sharp Borders) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto font-mono text-xs uppercase pt-2">
          <div class="border-2 border-black p-4 text-center">
            <div class="text-[10px] text-[#525252]">DI DEPAN ANDA</div>
            <div class="text-xl font-bold text-black mt-1">
              {{ Math.max(0, queueStore.queueNumber - 1).toLocaleString('id-ID') }}
            </div>
          </div>

          <div class="border-2 border-black bg-black text-white p-4 text-center">
            <div class="text-[10px] text-white/70">ESTIMASI GILIRAN</div>
            <div class="text-xl font-bold text-white mt-1">
              {{ queueStore.etaFormatted }}
            </div>
          </div>

          <div class="border-2 border-black p-4 text-center">
            <div class="text-[10px] text-[#525252]">ID SESI TOKEN</div>
            <div class="text-xl font-bold text-black mt-1">
              JWT-88A9
            </div>
          </div>
        </div>

        <!-- Fast Track Bypass Button (Khusus Admin / Developer) -->
        <div v-if="authStore.isAdmin" class="pt-4 border-t border-black flex flex-col items-center gap-1.5">
          <span class="text-[10px] font-mono text-[#525252] uppercase">[Akses Administrator Khusus]</span>
          <button
            @click="queueStore.skipQueue()"
            class="btn-mono-secondary text-xs"
          >
            <span>[Admin Bypass Antrean / Fast Track] →</span>
          </button>
        </div>
      </div>

      <!-- Sidebar: Live Stock Monitor -->
      <div class="lg:col-span-4 border-2 border-black p-6 space-y-6 bg-white">
        <div class="border-b-2 border-black pb-3">
          <div class="font-mono text-[10px] uppercase tracking-widest text-[#525252]">IN-MEMORY TELEMETRY</div>
          <h3 class="font-serif font-bold text-xl text-black">Pantauan Stok Redis</h3>
        </div>

        <div class="space-y-4 font-mono text-xs">
          <div 
            v-for="(count, catKey) in ticketStore.stock" 
            :key="catKey"
            class="border border-black p-4 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold uppercase">{{ ticketStore.categoryDetails[catKey].name.split(' ')[0] }}</span>
              <span 
                class="px-2 py-0.5 text-[10px] font-bold uppercase border border-black"
                :class="count > 0 ? 'bg-black text-white' : 'bg-[#F5F5F5] text-[#525252]'"
              >
                {{ count > 0 ? 'TERSEDIA' : 'HABIS' }}
              </span>
            </div>

            <div class="flex items-baseline justify-between pt-1">
              <span class="text-[10px] text-[#525252] uppercase">Sisa Kuota:</span>
              <span class="text-xl font-bold text-black">{{ count }} Tiket</span>
            </div>
          </div>
        </div>

        <div class="border-t border-black pt-4 font-body text-xs text-[#525252] leading-relaxed">
          Kuata tiket diperbarui otomatis via streaming Redis Streams. Tidak perlu menyegarkan jendela browser.
        </div>
      </div>
    </div>

  </div>
</template>
