<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import { useEventsStore } from '../stores/eventsStore';
import { useQueueStore } from '../stores/queueStore';
import { useNotifStore } from '../stores/notifStore';
import SvgIcon from './SvgIcon.vue';

const adminStore = useAdminStore();
const eventsStore = useEventsStore();
const queueStore = useQueueStore();
const notifStore = useNotifStore();

let spikeInterval = null;

onMounted(() => {
  spikeInterval = setInterval(() => {
    if (adminStore.isAdminModalOpen) {
      adminStore.simulateTrafficSpike();
    }
  }, 2500);
});

onBeforeUnmount(() => {
  if (spikeInterval) clearInterval(spikeInterval);
});

// Edit Event Quota in Realtime
const selectedEvent = ref(eventsStore.events[0]);
const editStockVip = ref(selectedEvent.value?.stock?.vip || 50);
const editStockCat1 = ref(selectedEvent.value?.stock?.cat1 || 150);
const editStockCat2 = ref(selectedEvent.value?.stock?.cat2 || 300);

function handleSelectEventToEdit(evt) {
  selectedEvent.value = evt;
  editStockVip.value = evt.stock.vip;
  editStockCat1.value = evt.stock.cat1;
  editStockCat2.value = evt.stock.cat2;
}

function saveQuota() {
  selectedEvent.value.stock.vip = Number(editStockVip.value);
  selectedEvent.value.stock.cat1 = Number(editStockCat1.value);
  selectedEvent.value.stock.cat2 = Number(editStockCat2.value);

  // If all 0 set sold out, else if currently sold out restore to on-sale
  const total = selectedEvent.value.stock.vip + selectedEvent.value.stock.cat1 + selectedEvent.value.stock.cat2;
  if (total === 0) {
    selectedEvent.value.status = 'sold-out';
  } else if (selectedEvent.value.status === 'sold-out') {
    selectedEvent.value.status = 'on-sale';
  }

  notifStore.push('success', 'Kuota Disimpan', `Stok tiket untuk "${selectedEvent.value.title}" berhasil diperbarui di memori Redis!`);
}

function resetAllEvents() {
  eventsStore.events.forEach(e => {
    if (e.id === 'taylor-swift-sg') {
      e.stock = { vip: 0, cat1: 0, cat2: 0 };
      e.status = 'sold-out';
    } else if (e.status !== 'ended' && e.status !== 'coming-soon') {
      e.stock = { vip: 50, cat1: 200, cat2: 500 };
      e.status = 'on-sale';
    }
  });
  handleSelectEventToEdit(selectedEvent.value);
  notifStore.push('info', 'Reset Selesai', 'Seluruh kuota tiket konser telah direset ke setelan awal pabrik.');
}

function flushWaitingQueue() {
  queueStore.queueNumber = 12;
  queueStore.totalWaiting = 450;
  notifStore.push('warning', 'Antrean Dikuras', 'Waiting room dialirkan serentak (120 req/detik dilepas ke checkout).');
}
</script>

<template>
  <div 
    v-if="adminStore.isAdminModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md transition-all animate-in fade-in"
    @click.self="adminStore.closeAdmin()"
  >
    <div class="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
      
      <!-- Top Bar Header -->
      <div class="p-5 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-coral flex items-center justify-center text-white shadow-lg">
            <SvgIcon name="bolt" className="w-5 h-5 text-white" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-black tracking-tight text-white">FLASHTIKET ADMIN MONITOR</h2>
              <span class="px-2 py-0.5 rounded-full bg-mint/20 text-mint text-[10px] font-bold border border-mint/30 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-mint animate-pulse"></span>
                LIVE CLUSTER
              </span>
            </div>
            <p class="text-xs text-slate-400">Pusat Kendali Sistem Terdistribusi &amp; Monitoring War Tiket</p>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
          <button
            @click="adminStore.activeTab = 'overview'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="adminStore.activeTab === 'overview' ? 'bg-navy text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            Metrik Live
          </button>
          <button
            @click="adminStore.activeTab = 'events'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="adminStore.activeTab === 'events' ? 'bg-navy text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            Kelola Kuota
          </button>
          <button
            @click="adminStore.activeTab = 'nodes'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            :class="adminStore.activeTab === 'nodes' ? 'bg-navy text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            Status Server
          </button>
        </div>

        <!-- Close Button -->
        <button 
          @click="adminStore.closeAdmin()"
          class="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <SvgIcon name="cancel" className="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body Content -->
      <div class="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 dark:bg-slate-950/40">
        
        <!-- ══════════════ TAB 1: OVERVIEW METRICS ══════════════ -->
        <div v-if="adminStore.activeTab === 'overview'" class="space-y-6">
          
          <!-- Key Metric Cards Grid -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-1">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pengunjung Aktif</span>
              <div class="text-xl sm:text-2xl font-black text-navy dark:text-sky font-mono">
                {{ adminStore.activeVisitors.toLocaleString('id-ID') }}
              </div>
              <span class="text-[10px] text-mint font-semibold flex items-center gap-1">
                <SvgIcon name="fire" className="w-3 h-3 text-mint" />
                Lonjakan Trafik Flash Crowd
              </span>
            </div>

            <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-1">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Di Waiting Room</span>
              <div class="text-xl sm:text-2xl font-black text-amber font-mono">
                {{ adminStore.waitingRoomCount.toLocaleString('id-ID') }}
              </div>
              <span class="text-[10px] text-slate-400">Tertahan di Redis ZSET FIFO</span>
            </div>

            <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-1">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tiket Dikunci (10m)</span>
              <div class="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {{ adminStore.reservedTickets.toLocaleString('id-ID') }}
              </div>
              <span class="text-[10px] text-purple-500">Distributed Lock Aktif</span>
            </div>

            <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-1">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Throughput Cluster</span>
              <div class="text-xl sm:text-2xl font-black text-mint font-mono">
                {{ adminStore.serverThroughput }} <span class="text-xs font-normal text-slate-400">Req/s</span>
              </div>
              <span class="text-[10px] text-slate-400">Latensi rata-rata {{ adminStore.avgLatency }} ms</span>
            </div>

          </div>

          <!-- Quick Action Buttons -->
          <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 class="text-xs font-bold text-slate-800 dark:text-white">Aksi Cepat Pengujian Beban</h4>
              <p class="text-[11px] text-slate-400">Trigger manual untuk simulasi konkurensi di hadapan audiens penguji.</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                @click="adminStore.simulateTrafficSpike(); notifStore.push('warning', 'Lonjakan Trafik', '+5.000 User baru masuk ke antrean!');"
                class="px-3.5 py-2 rounded-xl bg-amber text-slate-900 text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <SvgIcon name="fire" className="w-3.5 h-3.5 text-slate-900" />
                Simulasi Lonjakan +5k User
              </button>
              <button
                @click="flushWaitingQueue"
                class="px-3.5 py-2 rounded-xl bg-sky text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <SvgIcon name="refresh" className="w-3.5 h-3.5 text-white" />
                Buka Pintu Antrean (Flush)
              </button>
              <button
                @click="resetAllEvents"
                class="px-3.5 py-2 rounded-xl bg-coral text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <SvgIcon name="cancel" className="w-3.5 h-3.5 text-white" />
                Reset Kuota Pabrik
              </button>
            </div>
          </div>

          <!-- Traffic History Timeline Bar -->
          <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Log Realtime Trafik Lonjakan (Flash Crowds Timeline)</span>
              <span class="text-[10px] text-slate-400">Auto-update setiap 2.5 detik</span>
            </div>
            
            <div class="space-y-2">
              <div 
                v-for="(item, idx) in adminStore.trafficHistory" 
                :key="idx"
                class="flex items-center gap-3 text-xs font-mono"
              >
                <span class="text-slate-400 w-16 shrink-0">{{ item.time }}</span>
                <div class="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden relative">
                  <div 
                    class="h-full bg-gradient-to-r from-sky to-coral rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min(100, Math.round((item.rps / 3000) * 100))}%` }"
                  ></div>
                </div>
                <span class="w-24 text-right text-slate-700 dark:text-slate-200 font-bold shrink-0">{{ item.rps }} req/s</span>
              </div>
            </div>
          </div>

        </div>

        <!-- ══════════════ TAB 2: QUOTA & EVENTS MANAGEMENT ══════════════ -->
        <div v-else-if="adminStore.activeTab === 'events'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- List of events to pick -->
            <div class="space-y-2 lg:col-span-1">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pilih Acara Konser</label>
              <div class="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                <button
                  v-for="evt in eventsStore.events"
                  :key="evt.id"
                  @click="handleSelectEventToEdit(evt)"
                  class="w-full text-left p-3 rounded-2xl border transition-all text-xs space-y-1"
                  :class="selectedEvent?.id === evt.id 
                    ? 'bg-navy/5 dark:bg-sky/10 border-navy dark:border-sky ring-1 ring-navy dark:ring-sky' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'"
                >
                  <div class="font-bold text-slate-800 dark:text-white truncate">{{ evt.title }}</div>
                  <div class="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{{ evt.category }}</span>
                    <span 
                      class="px-2 py-0.5 rounded-full font-bold text-[10px]"
                      :class="evt.status === 'sold-out' ? 'bg-rose-100 text-rose-600' : 'bg-mint/20 text-mint'"
                    >
                      {{ evt.status }}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Edit Form for Selected Event -->
            <div class="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h3 class="text-sm font-bold text-slate-800 dark:text-white">{{ selectedEvent?.title }}</h3>
                <p class="text-xs text-slate-400">{{ selectedEvent?.venue }} · Status: {{ selectedEvent?.status }}</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">Kuota VIP</label>
                  <input 
                    v-model.number="editStockVip"
                    type="number"
                    min="0"
                    class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky"
                  />
                  <span class="text-[10px] text-slate-400">Kapasitas kursi depan</span>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">Kuota CAT 1</label>
                  <input 
                    v-model.number="editStockCat1"
                    type="number"
                    min="0"
                    class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky"
                  />
                  <span class="text-[10px] text-slate-400">Tribun tengah festival</span>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">Kuota CAT 2</label>
                  <input 
                    v-model.number="editStockCat2"
                    type="number"
                    min="0"
                    class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky"
                  />
                  <span class="text-[10px] text-slate-400">Tribun atas</span>
                </div>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                <div class="font-semibold text-slate-700 dark:text-slate-300">Total Tiket Tersedia: <span class="font-mono font-bold text-navy dark:text-sky">{{ editStockVip + editStockCat1 + editStockCat2 }} Kursi</span></div>
                <p class="text-[11px] text-slate-400 leading-relaxed">
                  Jika total kuota diisi 0, kartu event di beranda otomatis berubah status menjadi <strong>Tiket Habis (Sold Out)</strong>.
                </p>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  @click="editStockVip = 0; editStockCat1 = 0; editStockCat2 = 0; saveQuota();"
                  class="px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-rose-200 dark:border-rose-900"
                >
                  Jadikan Sold Out
                </button>
                <button
                  @click="saveQuota"
                  class="px-5 py-2.5 rounded-xl bg-navy dark:bg-sky text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
                >
                  Simpan Kuota ke Redis
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- ══════════════ TAB 3: SYSTEM TOPOLOGY & NODES ══════════════ -->
        <div v-else-if="adminStore.activeTab === 'nodes'" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div 
              v-for="(node, key) in adminStore.nodes" 
              :key="key"
              class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-mint animate-pulse"></span>
                  <span class="text-xs font-bold text-slate-800 dark:text-white">{{ node.name }}</span>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-mint/20 text-mint text-[10px] font-bold">
                  {{ node.status }}
                </span>
              </div>

              <div class="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                <div v-if="node.latency">Latensi Respon: <strong>{{ node.latency }}</strong></div>
                <div v-if="node.rps">Trafik Masuk: <strong>{{ node.rps }}</strong></div>
                <div v-if="node.memory">Memori Terpakai: <strong>{{ node.memory }}</strong></div>
                <div v-if="node.ops">Operasi Redis: <strong>{{ node.ops }}</strong></div>
                <div v-if="node.cpu">CPU Core Load: <strong>{{ node.cpu }}</strong></div>
                <div v-if="node.pool">Database Connection Pool: <strong>{{ node.pool }}</strong></div>
                <div v-if="node.activeTimers">Active Lock TTL (10m): <strong>{{ node.activeTimers }}</strong></div>
              </div>
            </div>

          </div>

          <div class="p-4 rounded-2xl bg-navy/5 dark:bg-sky/10 border border-navy/20 dark:border-sky/20 text-xs text-navy dark:text-sky space-y-1">
            <strong class="flex items-center gap-1.5">
              <SvgIcon name="shield" className="w-3.5 h-3.5" />
              <span>Garansi Zero-Overselling &amp; Anti-Calo:</span>
            </strong>
            <p class="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              Setiap request diverifikasi melalui skrip Lua atomik di Redis cluster. Kuota tidak dapat berkurang melebihi batas 0 tiket berapapun jumlah request bersamaan yang dikirim.
            </p>
          </div>
        </div>

      </div>

      <!-- Footer Action -->
      <div class="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>FlashTiket Terdistribusi Engine v2.0 • Sesuai SRS SRS-REQ-F-09 s/d F-11</span>
        <button
          @click="adminStore.closeAdmin()"
          class="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition-all"
        >
          Tutup Konsol
        </button>
      </div>

    </div>
  </div>
</template>
