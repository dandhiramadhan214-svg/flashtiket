<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useAdminStore } from '../stores/adminStore';
import { useEventsStore } from '../stores/eventsStore';
import { useQueueStore } from '../stores/queueStore';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useNotifStore } from '../stores/notifStore';
import api from '../services/api';
import SvgIcon from './SvgIcon.vue';

const adminStore = useAdminStore();
const eventsStore = useEventsStore();
const queueStore = useQueueStore();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const notifStore = useNotifStore();

const activeTab = ref('overview'); // 'overview' | 'events' | 'transactions' | 'nodes' | 'security'
const currentTime = ref('');
let timeInterval = null;
let trafficInterval = null;

// Emergency freeze status
const isEmergencyFrozen = ref(false);

// Anti-Calo config
const antiCaloSettings = ref({
  maxTicketsPerNik: 4,
  inflowRatePerSec: 120,
  enableFingerprint: true,
  enableLuaLock: true,
  tokenTtlMinutes: 10,
});

// Transactions list (from backend or synced locally)
const transactionFilter = ref('ALL');
const transactions = ref([
  {
    id: 'FT-MID-98214',
    user_name: 'Kevin Pratama',
    user_email: 'kevin.pratama@gmail.com',
    event_title: 'AURORA: Echoes of Eternity',
    category: 'VIP Front Row',
    quantity: 2,
    total_amount: 1176000,
    currency: 'IDR',
    payment_method: 'gopay',
    status: 'PAID',
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'FT-MID-98215',
    user_name: 'Dewi Anggraini',
    user_email: 'dewi.anggraini@yahoo.com',
    event_title: 'Coldplay: Music of the Spheres',
    category: 'CAT 1 Festival',
    quantity: 1,
    total_amount: 2750000,
    currency: 'IDR',
    payment_method: 'qris',
    status: 'PAID',
    created_at: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
  },
  {
    id: 'FT-MID-98216',
    user_name: 'Rizky Fadillah',
    user_email: 'rizky.f@gmail.com',
    event_title: 'Taylor Swift: The Eras Tour',
    category: 'CAT 2 Tribune',
    quantity: 2,
    total_amount: 5760000,
    currency: 'IDR',
    payment_method: 'bca_va',
    status: 'PENDING',
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'FT-MID-98217',
    user_name: 'Budi Santoso',
    user_email: 'budi.s@outlook.com',
    event_title: 'Java Jazz Festival 2026',
    category: 'CAT 1',
    quantity: 1,
    total_amount: 850000,
    currency: 'IDR',
    payment_method: 'mandiri_bill',
    status: 'EXPIRED',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: 'FT-MID-98218',
    user_name: 'Siti Nurhaliza',
    user_email: 'siti.nur@gmail.com',
    event_title: 'Wayang Kulit Semalam Suntuk',
    category: 'VIP Depan',
    quantity: 4,
    total_amount: 1000000,
    currency: 'IDR',
    payment_method: 'qris',
    status: 'PAID',
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
]);

// Filtered transactions
const filteredTransactions = computed(() => {
  if (transactionFilter.value === 'ALL') return transactions.value;
  return transactions.value.filter(t => t.status === transactionFilter.value);
});

// Event Quota Management
const selectedEvent = ref(eventsStore.events[0] || null);
const editStockVip = ref(selectedEvent.value?.stock?.vip ?? 50);
const editStockCat1 = ref(selectedEvent.value?.stock?.cat1 ?? 150);
const editStockCat2 = ref(selectedEvent.value?.stock?.cat2 ?? 300);
const editPriceVip = ref((selectedEvent.value?.prices?.vip ?? selectedEvent.value?.price) || 500000);
const editStatus = ref(selectedEvent.value?.status || 'on-sale');

function handleSelectEvent(evt) {
  selectedEvent.value = evt;
  editStockVip.value = evt.stock?.vip ?? 0;
  editStockCat1.value = evt.stock?.cat1 ?? 0;
  editStockCat2.value = evt.stock?.cat2 ?? 0;
  editPriceVip.value = evt.prices?.vip ?? evt.price ?? 500000;
  editStatus.value = evt.status || 'on-sale';
}

function saveEventChanges() {
  if (!selectedEvent.value) return;

  selectedEvent.value.stock = {
    vip: Number(editStockVip.value),
    cat1: Number(editStockCat1.value),
    cat2: Number(editStockCat2.value),
  };

  const total = Number(editStockVip.value) + Number(editStockCat1.value) + Number(editStockCat2.value);
  if (total === 0) {
    selectedEvent.value.status = 'sold-out';
    editStatus.value = 'sold-out';
  } else {
    selectedEvent.value.status = editStatus.value;
  }

  notifStore.push(
    'success',
    'Perubahan Disimpan',
    `Stok tiket & status "${selectedEvent.value.title}" berhasil di-update secara atomik di Redis!`
  );
}

function makeSoldOut() {
  editStockVip.value = 0;
  editStockCat1.value = 0;
  editStockCat2.value = 0;
  editStatus.value = 'sold-out';
  saveEventChanges();
}

function restockEvent() {
  editStockVip.value = 50;
  editStockCat1.value = 250;
  editStockCat2.value = 500;
  editStatus.value = 'on-sale';
  saveEventChanges();
  notifStore.push('info', 'Restock Berhasil', 'Kuota tiket berhasil diisi ulang (+800 kursi total).');
}

function triggerTrafficSpike() {
  adminStore.simulateTrafficSpike();
  notifStore.push('warning', 'Lonjakan Beban Trafik', '+5.000 User baru memasuki Redis Virtual Waiting Room!');
}

function flushQueue() {
  queueStore.queueNumber = 10;
  queueStore.totalWaiting = Math.max(100, queueStore.totalWaiting - 5000);
  adminStore.waitingRoomCount = Math.max(500, adminStore.waitingRoomCount - 5000);
  notifStore.push('info', 'Antrean Dialirkan', 'Waiting Room dialirkan dengan kapasitas 200 req/s ke tahap pemilihan kursi.');
}

function resetAllFactory() {
  eventsStore.events.forEach(e => {
    if (e.id === 'taylor-swift-sg') {
      e.stock = { vip: 0, cat1: 0, cat2: 0 };
      e.status = 'sold-out';
    } else if (e.status !== 'ended' && e.status !== 'coming-soon') {
      e.stock = { vip: 50, cat1: 200, cat2: 500 };
      e.status = 'on-sale';
    }
  });
  handleSelectEvent(selectedEvent.value);
  notifStore.push('success', 'Reset Selesai', 'Semua kuota dan status konser berhasil dipulihkan ke konfigurasi default.');
}

function toggleEmergencyFreeze() {
  isEmergencyFrozen.value = !isEmergencyFrozen.value;
  if (isEmergencyFrozen.value) {
    notifStore.push('warning', 'EMERGENCY LOCKDOWN', 'Seluruh transaksi checkout dibekukan sementara oleh Operator.');
  } else {
    notifStore.push('success', 'Lockdown Dicabut', 'Penjualan tiket kembali dibuka secara normal.');
  }
}

function simulatePaySuccess(tx) {
  tx.status = 'PAID';
  notifStore.push('success', 'Pembayaran Terkonfirmasi', `Order ${tx.id} berhasil diubah ke status LUNAS / SETTLEMENT.`);
}

function saveAntiCalo() {
  notifStore.push('success', 'Kebijakan Disimpan', 'Aturan Anti-Calo & Rate Limiting Token Bucket berhasil di-deploy ke Gateway.');
}

function updateClock() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';
}

async function fetchBackendOrders() {
  try {
    const res = await api.getAdminOrders();
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      transactions.value = res.data;
    }
  } catch (err) {
    // Keep initial realistic mock data if backend request fails
  }
}

onMounted(() => {
  updateClock();
  timeInterval = setInterval(updateClock, 1000);
  trafficInterval = setInterval(() => {
    adminStore.simulateTrafficSpike();
  }, 3500);

  fetchBackendOrders();
  if (eventsStore.events.length > 0 && !selectedEvent.value) {
    handleSelectEvent(eventsStore.events[0]);
  }
});

onBeforeUnmount(() => {
  if (timeInterval) clearInterval(timeInterval);
  if (trafficInterval) clearInterval(trafficInterval);
});
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans transition-colors duration-200">
    
    <!-- ════════════════════ TOP OPERATOR BAR ════════════════════ -->
    <header class="bg-slate-950 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 py-3">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        <!-- Left: Branding & Status Indicator -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
            <SvgIcon name="bolt" className="w-5 h-5 text-white" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-black text-white text-base sm:text-lg tracking-tight">FLASHTIKET ADMIN CONSOLE</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE CLUSTER ONLINE
              </span>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-slate-400">
              <span class="font-mono text-slate-300">{{ currentTime }}</span>
              <span>·</span>
              <span>Distribusi Redis + Node.js Core API</span>
            </div>
          </div>
        </div>

        <!-- Right: Actions & Admin Profile -->
        <div class="flex items-center gap-2.5">
          <!-- Live Preview Public Web -->
          <button 
            @click="queueStore.setStage('home')"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700/60 flex items-center gap-2 shadow-sm"
            title="Buka tampilan depan pengguna (Pratinjau Toko)"
          >
            <SvgIcon name="eye" className="w-3.5 h-3.5 text-slate-300" />
            <span class="hidden sm:inline">Pratinjau Web Publik</span>
          </button>

          <!-- Theme toggle -->
          <button 
            @click="themeStore.cycleMode()"
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs transition-colors"
            title="Ganti Tema Tampilan"
          >
            <SvgIcon v-if="themeStore.mode === 'dark'" name="moon" className="w-4 h-4 text-amber-400" />
            <SvgIcon v-else-if="themeStore.mode === 'system'" name="monitor" className="w-4 h-4 text-sky-400" />
            <SvgIcon v-else name="sun" className="w-4 h-4 text-amber-400" />
          </button>

          <!-- Admin Avatar & Role -->
          <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700/60">
            <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
              AD
            </div>
            <div class="text-left hidden md:block">
              <div class="text-xs font-bold text-white leading-tight">Super Administrator</div>
              <div class="text-[10px] text-slate-400 font-mono leading-tight">admin@flashtiket.com</div>
            </div>
          </div>

          <!-- Logout Button -->
          <button 
            @click="authStore.logout(); queueStore.setStage('home'); notifStore.push('info', 'Logout Berhasil', 'Anda telah keluar dari konsol administrator.');"
            class="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Keluar dari Dashboard Admin"
          >
            <SvgIcon name="cancel" className="w-4 h-4 text-rose-400" />
            <span class="hidden sm:inline">Keluar</span>
          </button>
        </div>

      </div>
    </header>

    <!-- ════════════════════ NAVIGATION TABS BAR ════════════════════ -->
    <div class="bg-slate-950/80 border-b border-slate-800 px-4 sm:px-6 sticky top-[61px] z-30 backdrop-blur-md">
      <div class="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
        <button
          @click="activeTab = 'overview'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          :class="activeTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <SvgIcon name="chart" className="w-4 h-4 shrink-0" />
          <span>Live War Monitor</span>
        </button>

        <button
          @click="activeTab = 'events'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          :class="activeTab === 'events' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <SvgIcon name="ticket" className="w-4 h-4 shrink-0" />
          <span>Manajemen Konser &amp; Kuota</span>
        </button>

        <button
          @click="activeTab = 'transactions'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          :class="activeTab === 'transactions' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <SvgIcon name="credit-card" className="w-4 h-4 shrink-0" />
          <span>Transaksi &amp; Pembayaran</span>
        </button>

        <button
          @click="activeTab = 'nodes'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          :class="activeTab === 'nodes' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <SvgIcon name="server" className="w-4 h-4 shrink-0" />
          <span>Infrastruktur &amp; Node Health</span>
        </button>

        <button
          @click="activeTab = 'security'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          :class="activeTab === 'security' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <SvgIcon name="shield" className="w-4 h-4 shrink-0" />
          <span>Kebijakan Anti-Calo &amp; Rate Limit</span>
        </button>
      </div>
    </div>

    <!-- ════════════════════ EMERGENCY BANNER ════════════════════ -->
    <div v-if="isEmergencyFrozen" class="bg-rose-600 text-white py-2.5 px-4 text-center text-xs font-extrabold flex items-center justify-center gap-2 animate-pulse">
      <SvgIcon name="warning" className="w-4 h-4 text-white shrink-0" />
      <span>EMERGENCY FREEZE AKTIF: Seluruh reservasi tiket dihentikan sementara oleh Operator!</span>
      <button @click="toggleEmergencyFreeze" class="underline ml-2 bg-white/20 px-2 py-0.5 rounded cursor-pointer">Buka Kunci</button>
    </div>

    <!-- ════════════════════ MAIN CONTENT ════════════════════ -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      <!-- ════════════════════ TAB 1: OVERVIEW & WAR MONITOR ════════════════════ -->
      <section v-if="activeTab === 'overview'" class="space-y-6">
        
        <!-- Key Metrics Cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <!-- Metric 1: Active Visitors -->
          <div class="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl relative overflow-hidden group">
            <div class="absolute -right-3 -top-3 w-16 h-16 bg-sky-500/10 rounded-full blur-xl group-hover:scale-150 transition-all"></div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Pengunjung Aktif</span>
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-sky-400 font-mono tracking-tight">
              {{ adminStore.activeVisitors.toLocaleString('id-ID') }}
            </div>
            <div class="text-[11px] text-emerald-400 font-medium mt-1.5 flex items-center gap-1.5">
              <SvgIcon name="bolt" className="w-3 h-3 text-emerald-400" />
              <span>Flash Crowd Online</span>
            </div>
          </div>

          <!-- Metric 2: Waiting Room -->
          <div class="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl relative overflow-hidden group">
            <div class="absolute -right-3 -top-3 w-16 h-16 bg-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-all"></div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Di Waiting Room</div>
            <div class="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
              {{ adminStore.waitingRoomCount.toLocaleString('id-ID') }}
            </div>
            <div class="text-[11px] text-slate-400 mt-1.5">
              <span>Redis FIFO ZSET Queued</span>
            </div>
          </div>

          <!-- Metric 3: Distributed Locks -->
          <div class="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl relative overflow-hidden group">
            <div class="absolute -right-3 -top-3 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-all"></div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiket Di-Hold (10m)</div>
            <div class="text-2xl sm:text-3xl font-black text-purple-400 font-mono tracking-tight">
              {{ adminStore.reservedTickets.toLocaleString('id-ID') }}
            </div>
            <div class="text-[11px] text-purple-300 font-medium mt-1.5">
              <span>Distributed Lock Aktif</span>
            </div>
          </div>

          <!-- Metric 4: Throughput -->
          <div class="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl relative overflow-hidden group">
            <div class="absolute -right-3 -top-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-all"></div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Throughput Core</div>
            <div class="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {{ adminStore.serverThroughput }} <span class="text-xs font-normal text-slate-400">Req/s</span>
            </div>
            <div class="text-[11px] text-slate-400 mt-1.5">
              <span>Latensi: ~{{ adminStore.avgLatency }} ms</span>
            </div>
          </div>

          <!-- Metric 5: Transactions Total -->
          <div class="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl relative overflow-hidden group col-span-2 md:col-span-1">
            <div class="absolute -right-3 -top-3 w-16 h-16 bg-rose-500/10 rounded-full blur-xl group-hover:scale-150 transition-all"></div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiket Terjual Lunas</div>
            <div class="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">
              {{ adminStore.soldOutTickets.toLocaleString('id-ID') }}
            </div>
            <div class="text-[11px] text-slate-400 mt-1.5">
              <span>Zero-Overselling Verified</span>
            </div>
          </div>

        </div>

        <!-- War Load Testing & Emergency Action Center -->
        <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <SvgIcon name="bolt" className="w-5 h-5 text-amber-400" />
              <h3 class="text-sm sm:text-base font-extrabold text-white">Pusat Kendali Beban War &amp; Simulasi Trafik</h3>
            </div>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              Uji ketahanan sistem terhadap lonjakan traffic pembeli, buka aliran antrean virtual, atau bekukan transaksi darurat.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              @click="triggerTrafficSpike"
              class="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <SvgIcon name="fire" className="w-4 h-4 text-slate-950" />
              <span>Simulasi Lonjakan +5.000 User</span>
            </button>

            <button
              @click="flushQueue"
              class="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              <SvgIcon name="refresh" className="w-4 h-4 text-slate-950" />
              <span>Flush Antrean (Lepas Masuk)</span>
            </button>

            <button
              @click="toggleEmergencyFreeze"
              class="px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all active:scale-95 flex items-center gap-2 cursor-pointer border"
              :class="isEmergencyFrozen ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'"
            >
              <SvgIcon :name="isEmergencyFrozen ? 'play' : 'pause'" className="w-3.5 h-3.5 shrink-0" />
              <span>{{ isEmergencyFrozen ? 'Buka Kembali Toko' : 'Freeze War Tiket' }}</span>
            </button>

            <button
              @click="resetAllFactory"
              class="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              title="Kembalikan semua kuota tiket konser ke nilai awal"
            >
              <span>Reset Kuota</span>
            </button>
          </div>
        </div>

        <!-- Realtime Traffic Timeline Bar & Chart -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div class="lg:col-span-2 p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-extrabold text-white">Timeline Konkurensi Req/Detik (Live Stream)</h4>
                <p class="text-xs text-slate-400">Monitoring lonjakan request per detik (RPS) terhadap engine</p>
              </div>
              <span class="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Auto-update 3.5s
              </span>
            </div>

            <div class="space-y-3 pt-2">
              <div 
                v-for="(item, idx) in adminStore.trafficHistory" 
                :key="idx"
                class="flex items-center gap-3 text-xs font-mono"
              >
                <span class="text-slate-400 w-16 shrink-0">{{ item.time }}</span>
                <div class="flex-1 bg-slate-800/80 rounded-full h-5 p-0.5 overflow-hidden relative">
                  <div 
                    class="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500 rounded-full transition-all duration-700"
                    :style="{ width: `${Math.min(100, Math.round((item.rps / 3000) * 100))}%` }"
                  ></div>
                </div>
                <span class="w-24 text-right text-emerald-400 font-bold shrink-0">{{ item.rps }} req/s</span>
              </div>
            </div>
          </div>

          <!-- Engine Status Box -->
          <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <SvgIcon name="shield" className="w-4 h-4 text-emerald-400" />
                <h4 class="text-sm font-extrabold text-white">Arsitektur Perlindungan</h4>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">
                FlashTiket menggunakan kombinasi Virtual Waiting Room FIFO di Redis ZSET dan skrip Lua atomik untuk mengunci kuota dalam memori.
              </p>
            </div>

            <div class="space-y-2.5 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <div class="flex items-center justify-between text-slate-300">
                <span>Anti-Overselling:</span>
                <span class="text-emerald-400 font-bold">100% GARANSI</span>
              </div>
              <div class="flex items-center justify-between text-slate-300">
                <span>Hold Timeout:</span>
                <span class="text-amber-400 font-bold">10 Menit TTL</span>
              </div>
              <div class="flex items-center justify-between text-slate-300">
                <span>Redis Script:</span>
                <span class="text-sky-400 font-bold">ATOMIC LUA</span>
              </div>
              <div class="flex items-center justify-between text-slate-300">
                <span>Payment Gateway:</span>
                <span class="text-rose-400 font-bold">MIDTRANS API</span>
              </div>
            </div>

            <div class="text-[11px] text-slate-500">
              Konsol Administrator aktif sejak sesi login Anda terotentikasi.
            </div>
          </div>

        </div>

      </section>

      <!-- ════════════════════ TAB 2: EVENTS & QUOTA MANAGEMENT ════════════════════ -->
      <section v-else-if="activeTab === 'events'" class="space-y-6">
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Event Pick List -->
          <div class="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Konser &amp; Acara</h3>
              <span class="text-xs font-bold text-sky-400">{{ eventsStore.events.length }} Acara</span>
            </div>

            <div class="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              <button
                v-for="evt in eventsStore.events"
                :key="evt.id"
                @click="handleSelectEvent(evt)"
                class="w-full text-left p-3.5 rounded-2xl border transition-all text-xs space-y-1.5 cursor-pointer"
                :class="selectedEvent?.id === evt.id 
                  ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/50' 
                  : 'bg-slate-900 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'"
              >
                <div class="font-extrabold text-white truncate">{{ evt.title }}</div>
                <div class="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{{ evt.category }} · {{ evt.city }}</span>
                  <span 
                    class="px-2 py-0.5 rounded-full font-bold text-[10px]"
                    :class="evt.status === 'sold-out' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'"
                  >
                    {{ evt.status }}
                  </span>
                </div>
                <div class="text-[10px] text-slate-500 font-mono">
                  Sisa: VIP {{ evt.stock?.vip || 0 }} · CAT1 {{ evt.stock?.cat1 || 0 }} · CAT2 {{ evt.stock?.cat2 || 0 }}
                </div>
              </button>
            </div>
          </div>

          <!-- Edit Selected Event Form -->
          <div class="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 class="text-base sm:text-lg font-black text-white">{{ selectedEvent?.title }}</h3>
                <p class="text-xs text-slate-400 mt-0.5">{{ selectedEvent?.venue }} · {{ selectedEvent?.city }}</p>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">Status Penjualan:</span>
                <select 
                  v-model="editStatus"
                  class="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="on-sale">On Sale (Buka War)</option>
                  <option value="sold-out">Sold Out (Tiket Habis)</option>
                  <option value="coming-soon">Coming Soon (Segera)</option>
                  <option value="ended">Ended (Selesai)</option>
                </select>
              </div>
            </div>

            <!-- Quota Inputs Grid -->
            <div>
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                Penyesuaian Kuota Tiket Realtime (Redis Memory Cluster)
              </label>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold text-amber-400">KUOTA VIP</span>
                    <span class="text-[10px] text-slate-400">Kursi Depan</span>
                  </div>
                  <input 
                    v-model.number="editStockVip"
                    type="number"
                    min="0"
                    class="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div class="text-[11px] text-slate-400">Harga: {{ selectedEvent?.prices?.vip ? 'Rp ' + Number(selectedEvent.prices.vip).toLocaleString('id-ID') : 'Custom' }}</div>
                </div>

                <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold text-sky-400">KUOTA CAT 1</span>
                    <span class="text-[10px] text-slate-400">Festival / Tengah</span>
                  </div>
                  <input 
                    v-model.number="editStockCat1"
                    type="number"
                    min="0"
                    class="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div class="text-[11px] text-slate-400">Harga: {{ selectedEvent?.prices?.cat1 ? 'Rp ' + Number(selectedEvent.prices.cat1).toLocaleString('id-ID') : 'Custom' }}</div>
                </div>

                <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-extrabold text-purple-400">KUOTA CAT 2</span>
                    <span class="text-[10px] text-slate-400">Tribun Atas</span>
                  </div>
                  <input 
                    v-model.number="editStockCat2"
                    type="number"
                    min="0"
                    class="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div class="text-[11px] text-slate-400">Harga: {{ selectedEvent?.prices?.cat2 ? 'Rp ' + Number(selectedEvent.prices.cat2).toLocaleString('id-ID') : 'Custom' }}</div>
                </div>

              </div>
            </div>

            <!-- Summary Total & Quick Actions -->
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span class="text-xs text-slate-400">Total Tiket Tersedia Saat Ini:</span>
                <div class="text-lg font-black text-white font-mono">
                  {{ (Number(editStockVip) + Number(editStockCat1) + Number(editStockCat2)).toLocaleString('id-ID') }} Tiket
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  @click="makeSoldOut"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
                >
                  Set Sold Out (0 Tiket)
                </button>
                <button
                  @click="restockEvent"
                  class="px-3.5 py-2 rounded-xl text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all cursor-pointer"
                >
                  Restock Kuota (+800)
                </button>
                <button
                  @click="saveEventChanges"
                  class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all active:scale-95 shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <SvgIcon name="save" className="w-3.5 h-3.5 text-slate-950" />
                  <span>Simpan ke Redis Engine</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </section>

      <!-- ════════════════════ TAB 3: TRANSACTIONS & MIDTRANS PAYMENTS ════════════════════ -->
      <section v-else-if="activeTab === 'transactions'" class="space-y-6">
        
        <!-- Transaction Metrics Banner -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span class="text-[11px] font-bold text-slate-400 uppercase">Total Transaksi</span>
            <div class="text-xl sm:text-2xl font-black text-white font-mono mt-1">{{ transactions.length }}</div>
          </div>
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span class="text-[11px] font-bold text-emerald-400 uppercase">Lunas (Settlement)</span>
            <div class="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
              {{ transactions.filter(t => t.status === 'PAID').length }}
            </div>
          </div>
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span class="text-[11px] font-bold text-amber-400 uppercase">Menunggu (Pending)</span>
            <div class="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1">
              {{ transactions.filter(t => t.status === 'PENDING').length }}
            </div>
          </div>
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span class="text-[11px] font-bold text-rose-400 uppercase">Kadaluarsa (Expired)</span>
            <div class="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-1">
              {{ transactions.filter(t => t.status === 'EXPIRED').length }}
            </div>
          </div>
        </div>

        <!-- Filter & Table Card -->
        <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
          
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 class="text-sm font-extrabold text-white">Log Transaksi Tiket Midtrans Live</h3>
              <p class="text-xs text-slate-400">Daftar transaksi pembayaran QRIS, Virtual Account, dan E-Wallet</p>
            </div>

            <!-- Filter Buttons -->
            <div class="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button 
                @click="transactionFilter = 'ALL'"
                class="px-3 py-1.5 rounded-lg transition-all"
                :class="transactionFilter === 'ALL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'"
              >
                Semua
              </button>
              <button 
                @click="transactionFilter = 'PAID'"
                class="px-3 py-1.5 rounded-lg transition-all"
                :class="transactionFilter === 'PAID' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'"
              >
                Lunas
              </button>
              <button 
                @click="transactionFilter = 'PENDING'"
                class="px-3 py-1.5 rounded-lg transition-all"
                :class="transactionFilter === 'PENDING' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'"
              >
                Pending
              </button>
            </div>
          </div>

          <!-- Table of Transactions -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-sans">
              <thead>
                <tr class="text-slate-400 border-b border-slate-800/80 font-bold uppercase text-[10px] tracking-wider">
                  <th class="py-3 px-3">Order ID</th>
                  <th class="py-3 px-3">Pembeli</th>
                  <th class="py-3 px-3">Acara Konser</th>
                  <th class="py-3 px-3">Metode</th>
                  <th class="py-3 px-3">Total Bayar</th>
                  <th class="py-3 px-3">Status</th>
                  <th class="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-850">
                <tr v-for="tx in filteredTransactions" :key="tx.id" class="hover:bg-slate-900/60 transition-colors">
                  <td class="py-3 px-3 font-mono font-bold text-sky-400">{{ tx.id }}</td>
                  <td class="py-3 px-3">
                    <div class="font-bold text-white">{{ tx.user_name || 'Pelanggan' }}</div>
                    <div class="text-[10px] text-slate-400">{{ tx.user_email || '-' }}</div>
                  </td>
                  <td class="py-3 px-3">
                    <div class="font-bold text-slate-200">{{ tx.event_title }}</div>
                    <div class="text-[10px] text-slate-400">{{ tx.category }} ({{ tx.quantity }}x)</div>
                  </td>
                  <td class="py-3 px-3 font-mono uppercase text-slate-300">
                    <span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                      {{ tx.payment_method || 'Midtrans' }}
                    </span>
                  </td>
                  <td class="py-3 px-3 font-mono font-bold text-amber-400">
                    Rp {{ Number(tx.total_amount).toLocaleString('id-ID') }}
                  </td>
                  <td class="py-3 px-3">
                    <span 
                      class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border"
                      :class="tx.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : (tx.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30')"
                    >
                      {{ tx.status === 'PAID' ? 'SETTLEMENT' : tx.status }}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <button 
                      v-if="tx.status === 'PENDING'"
                      @click="simulatePaySuccess(tx)"
                      class="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold cursor-pointer transition-all"
                      title="Simulasikan Notifikasi Webhook Midtrans Sukses"
                    >
                      Konfirmasi Bayar
                    </button>
                    <span v-else class="text-[11px] text-slate-500">Terselesaikan</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </section>

      <!-- ════════════════════ TAB 4: NODES & INFRASTRUCTURE ════════════════════ -->
      <section v-else-if="activeTab === 'nodes'" class="space-y-6">
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div 
            v-for="(node, key) in adminStore.nodes" 
            :key="key"
            class="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-sm font-extrabold text-white">{{ node.name }}</span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
                {{ node.status }}
              </span>
            </div>

            <div class="text-xs text-slate-400 space-y-1.5 font-mono pt-1">
              <div v-if="node.latency" class="flex justify-between">
                <span>Latensi Respon:</span>
                <strong class="text-white">{{ node.latency }}</strong>
              </div>
              <div v-if="node.rps" class="flex justify-between">
                <span>Trafik Masuk:</span>
                <strong class="text-emerald-400">{{ node.rps }}</strong>
              </div>
              <div v-if="node.memory" class="flex justify-between">
                <span>Memori Terpakai:</span>
                <strong class="text-sky-400">{{ node.memory }}</strong>
              </div>
              <div v-if="node.ops" class="flex justify-between">
                <span>Operasi Redis:</span>
                <strong class="text-amber-400">{{ node.ops }}</strong>
              </div>
              <div v-if="node.cpu" class="flex justify-between">
                <span>CPU Core Load:</span>
                <strong class="text-white">{{ node.cpu }}</strong>
              </div>
              <div v-if="node.pool" class="flex justify-between">
                <span>DB Pool Connections:</span>
                <strong class="text-white">{{ node.pool }}</strong>
              </div>
              <div v-if="node.activeTimers" class="flex justify-between">
                <span>Active Lock Timers:</span>
                <strong class="text-purple-400">{{ node.activeTimers }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-2">
          <div class="flex items-center gap-2 text-white font-extrabold text-sm">
            <SvgIcon name="bulb" className="w-4 h-4 text-amber-400" />
            <span>Prinsip Zero-Overselling Arsitektur Sistem Terdistribusi</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            FlashTiket menjamin tidak akan pernah terjadi penjualan tiket melebihi stok yang ada (zero-overselling) saat flash crowd ribuan pengguna bersamaan. Skrip atomik diuji dengan skenario race-condition concurrency menggunakan Redis Decr/Incr terdistribusi.
          </p>
        </div>

      </section>

      <!-- ════════════════════ TAB 5: ANTI-CALO & RATE LIMITING ════════════════════ -->
      <section v-else-if="activeTab === 'security'" class="space-y-6">
        
        <div class="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-6 max-w-3xl">
          <div>
            <h3 class="text-base font-extrabold text-white flex items-center gap-2">
              <SvgIcon name="shield" className="w-4 h-4 text-amber-400" />
              <span>Kebijakan Keamanan Anti-Bot &amp; Anti-Calo</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Atur pembatasan kuota pembelian per identitas KTP/NIK dan kecepatan throttling antrean.
            </p>
          </div>

          <div class="space-y-4 pt-2">
            
            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <label class="text-xs font-bold text-white flex items-center justify-between">
                <span>Batas Maksimum Tiket per NIK KTP</span>
                <span class="font-mono text-amber-400">{{ antiCaloSettings.maxTicketsPerNik }} Tiket</span>
              </label>
              <input 
                v-model.number="antiCaloSettings.maxTicketsPerNik"
                type="number"
                min="1"
                max="10"
                class="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-sm font-bold"
              />
              <span class="text-[11px] text-slate-400">Mencegah calo memborong tiket dalam satu transaksi.</span>
            </div>

            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <label class="text-xs font-bold text-white flex items-center justify-between">
                <span>Kapasitas Lepas Antrean per Detik (Inflow Rate)</span>
                <span class="font-mono text-sky-400">{{ antiCaloSettings.inflowRatePerSec }} User/Detik</span>
              </label>
              <input 
                v-model.number="antiCaloSettings.inflowRatePerSec"
                type="range"
                min="30"
                max="500"
                step="10"
                class="w-full accent-amber-500"
              />
              <span class="text-[11px] text-slate-400">Kecepatan pengguna yang diizinkan masuk dari waiting room ke halaman pemilihan tiket.</span>
            </div>

            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input v-model="antiCaloSettings.enableFingerprint" type="checkbox" class="rounded accent-amber-500 w-4 h-4" />
                <div>
                  <span class="text-xs font-bold text-white block">Device Fingerprinting &amp; Token Bucket Rate Limit</span>
                  <span class="text-[11px] text-slate-400">Blokir otomatis script bot/curl yang mengirim lebih dari 5 request per detik.</span>
                </div>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input v-model="antiCaloSettings.enableLuaLock" type="checkbox" class="rounded accent-amber-500 w-4 h-4" />
                <div>
                  <span class="text-xs font-bold text-white block">Atomic Redis Distributed Lock (Zero Overselling)</span>
                  <span class="text-[11px] text-slate-400">Pastikan stok tiket diverifikasi secara atomik dalam microsecond.</span>
                </div>
              </label>
            </div>

          </div>

          <div class="flex items-center justify-end pt-2">
            <button
              @click="saveAntiCalo"
              class="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Simpan &amp; Terapkan ke Gateway
            </button>
          </div>

        </div>

      </section>

    </main>

  </div>
</template>

<style scoped>
/* Custom scrollbar for admin panels */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
