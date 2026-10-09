<script setup>
import { ref, computed } from 'vue';
import { useTicketStore } from '../stores/ticketStore';
import { useQueueStore } from '../stores/queueStore';
import { useEventsStore } from '../stores/eventsStore';
import SvgIcon from './SvgIcon.vue';

const ticketStore = useTicketStore();
const queueStore = useQueueStore();
const eventsStore = useEventsStore();

const currentEvent = computed(() => eventsStore.selectedEvent);

// Selected seat tracking
const selectedSeat = ref({
  id: 'VIP-A08',
  category: 'vip',
  name: 'Baris A No. 08',
  zone: 'VIP Royal Floor',
});

const hoveredSeat = ref(null);

// Generate VIP Seat dots (4 rows x 14 seats)
const vipSeats = computed(() => {
  const list = [];
  const rows = ['A', 'B', 'C', 'D'];
  // Pre-determined booked seats for realism
  const bookedIndices = [2, 5, 8, 12, 17, 21, 28, 33, 40, 47];

  for (let r = 0; r < rows.length; r++) {
    for (let c = 1; c <= 14; c++) {
      const idx = r * 14 + c;
      const id = `VIP-${rows[r]}${String(c).padStart(2, '0')}`;
      const isBooked = bookedIndices.includes(idx);
      const isSelected = selectedSeat.value.id === id;

      list.push({
        id,
        category: 'vip',
        label: `VIP ${rows[r]}-${c}`,
        row: rows[r],
        num: c,
        x: 232 + (c - 1) * 21.5,
        y: 198 + r * 19,
        isBooked,
        isSelected,
      });
    }
  }
  return list;
});

// Generate CAT 2 Tribune Left seats (Curved Sector)
const tribuneLeftSeats = computed(() => {
  const list = [];
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const count = 7;
    for (let c = 0; c < count; c++) {
      const id = `CAT2-W${r+1}-${c+1}`;
      const isBooked = (r * count + c) % 4 === 1;
      const isSelected = selectedSeat.value.id === id;
      list.push({
        id,
        category: 'cat2',
        label: `Tribun Barat R${r+1}-${c+1}`,
        x: 75 + r * 18 + c * 8,
        y: 160 + c * 26,
        isBooked,
        isSelected,
      });
    }
  }
  return list;
});

// Generate CAT 2 Tribune Right seats (Curved Sector)
const tribuneRightSeats = computed(() => {
  const list = [];
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const count = 7;
    for (let c = 0; c < count; c++) {
      const id = `CAT2-E${r+1}-${c+1}`;
      const isBooked = (r * count + c) % 5 === 2;
      const isSelected = selectedSeat.value.id === id;
      list.push({
        id,
        category: 'cat2',
        label: `Tribun Timur R${r+1}-${c+1}`,
        x: 645 - r * 18 - c * 8,
        y: 160 + c * 26,
        isBooked,
        isSelected,
      });
    }
  }
  return list;
});

// Generate CAT 2 Tribune Upper/Back Grandstand seats (Arch curves)
const tribuneBackSeats = computed(() => {
  const list = [];
  const rows = 3;
  for (let r = 0; r < rows; r++) {
    const count = 22;
    for (let c = 0; c < count; c++) {
      const id = `CAT2-B${r+1}-${c+1}`;
      const isBooked = (r * count + c) % 6 === 0 || (r * count + c) % 7 === 3;
      const isSelected = selectedSeat.value.id === id;
      list.push({
        id,
        category: 'cat2',
        label: `Grandstand R${r+1}-${c+1}`,
        x: 165 + c * 18.5,
        y: 350 + r * 20,
        isBooked,
        isSelected,
      });
    }
  }
  return list;
});

// Handle Seat Click
function selectIndividualSeat(seat) {
  if (seat.isBooked) return;

  selectedSeat.value = {
    id: seat.id,
    category: seat.category,
    name: seat.label,
    zone: seat.category === 'vip' ? 'VIP Royal Floor' : 'CAT 2 Reserved Tribune',
  };

  ticketStore.selectCategory(seat.category);
  ticketStore.setSelectedSeat(selectedSeat.value.name, selectedSeat.value.zone, seat.category);
}

// Handle Zone click (e.g. Festival CAT 1 Standing)
function selectCategoryZone(catKey) {
  ticketStore.selectCategory(catKey);
  if (catKey === 'cat1') {
    selectedSeat.value = {
      id: 'CAT1-FEST-A',
      category: 'cat1',
      name: 'Festival Standing Pen A',
      zone: 'CAT 1 Standing Zone',
    };
  } else if (catKey === 'vip') {
    selectedSeat.value = {
      id: 'VIP-A08',
      category: 'vip',
      name: 'Baris A No. 08',
      zone: 'VIP Royal Floor',
    };
  } else {
    selectedSeat.value = {
      id: 'CAT2-B1-12',
      category: 'cat2',
      name: 'Grandstand R1-12',
      zone: 'CAT 2 Reserved Tribune',
    };
  }
  ticketStore.setSelectedSeat(selectedSeat.value.name, selectedSeat.value.zone, catKey);
}

function handleLock() {
  const seatName = ticketStore.quantity === 2 && selectedSeat.value.category !== 'cat1'
    ? `${selectedSeat.value.name} & Berdampingan (2 Kursi)`
    : selectedSeat.value.name;
  ticketStore.setSelectedSeat(seatName, selectedSeat.value.zone, selectedSeat.value.category);
  const success = ticketStore.lockTickets();
  if (success) {
    queueStore.setStage('checkout');
  }
}

const cats = [
  { key: 'vip', label: 'VIP Royal Soundcheck', desc: 'Kursi berpenomoran barisan depan + soundcheck pass.', dot: 'bg-purple-500', ring: 'ring-purple-300 dark:ring-purple-500/50', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  { key: 'cat1', label: 'CAT 1 Standing Festival', desc: 'Area festival berdiri di depan panggung & catwalk.', dot: 'bg-sky', ring: 'ring-sky/40 dark:ring-sky/50', bg: 'bg-sky-light dark:bg-sky-950/40' },
  { key: 'cat2', label: 'CAT 2 Reserved Seating', desc: 'Tribun grandstand bernomor pandangan panoramik.', dot: 'bg-slate-400', ring: 'ring-slate-300 dark:ring-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' },
];
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

    <!-- Header bar with event title & countdown badge -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="text-xs font-semibold text-coral flex items-center gap-1.5">
          <SvgIcon name="fire" className="w-3.5 h-3.5 text-coral" />
          <span>{{ currentEvent.title }}</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-extrabold text-navy dark:text-white tracking-tight">Peta Stadion &amp; Pemilihan Kursi</h2>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
          <SvgIcon name="clock" className="w-3.5 h-3.5 text-slate-400" />
          Sesi Kunci Kursi: 15m
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left: Interactive Realistic Stadium Map (7 Cols) -->
      <div class="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-slate-100 dark:border-slate-800 p-4 sm:p-5 space-y-4 transition-colors">
        
        <!-- Stadium Header Info & Seat Selected Pin -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 class="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
              <SvgIcon name="stadium" className="w-4 h-4 text-navy dark:text-sky" />
              <span>{{ currentEvent.venue }} — Denah Interaktif</span>
            </h3>
            <p class="text-[11px] text-slate-400 dark:text-slate-500">Klik titik kursi untuk memilih nomor kursi impian Anda</p>
          </div>

          <!-- Dynamic Active Seat Chip -->
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-navy dark:text-sky">
            <span class="w-2.5 h-2.5 rounded-full bg-mint animate-pulse"></span>
            <span>Kursi Terpilih: <strong>{{ selectedSeat.name }}</strong></span>
          </div>
        </div>

        <!-- SVG Arena Map with Dots -->
        <div class="w-full aspect-[4/3] bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 rounded-2xl relative overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center">
          
          <svg viewBox="0 0 720 490" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <!-- Stadium Outer Wall Arc / Atmosphere Glow -->
            <ellipse cx="360" cy="280" rx="340" ry="200" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.4" />
            <ellipse cx="360" cy="275" rx="310" ry="180" fill="none" stroke="#475569" stroke-width="1" opacity="0.25" />

            <!-- Panggung Utama (MAIN STAGE) -->
            <g class="cursor-pointer" @click="selectCategoryZone('vip')">
              <!-- Stage Glow & Rig -->
              <rect x="230" y="20" width="260" height="52" rx="12" fill="#1e266d" stroke="#4f8cff" stroke-width="2" />
              <text x="360" y="45" fill="#ffffff" font-size="13" font-family="Poppins, sans-serif" font-weight="800" text-anchor="middle" letter-spacing="2">
                PANGGUNG UTAMA
              </text>
              <text x="360" y="60" fill="#93c5fd" font-size="9" font-family="Poppins, sans-serif" font-weight="600" text-anchor="middle">
                AUDIO RIGS &amp; LED WALL
              </text>

              <!-- Runway / Catwalk -->
              <rect x="338" y="72" width="44" height="65" rx="6" fill="#2d3a8c" stroke="#4f8cff" stroke-width="1.5" />
              <!-- Thrust circular stage tip -->
              <circle cx="360" cy="142" r="18" fill="#3730a3" stroke="#818cf8" stroke-width="2" />
              <text x="360" y="145" fill="#ffffff" font-size="8" font-family="Poppins" font-weight="700" text-anchor="middle">THRUST</text>
            </g>

            <!-- CAT 1 Standing Festival Pen Left & Right (Flanking Runway) -->
            <g class="cursor-pointer transition-opacity hover:opacity-95" @click="selectCategoryZone('cat1')">
              <!-- Left Festival Pen -->
              <rect x="175" y="85" width="145" height="85" rx="12" 
                :fill="ticketStore.selectedCategory === 'cat1' ? '#1e3a8a' : '#0f172a'" 
                :stroke="ticketStore.selectedCategory === 'cat1' ? '#38bdf8' : '#1e293b'" 
                stroke-width="1.5" />
              
              <!-- Subtle Festival Standing Crowd Dots Grid -->
              <g opacity="0.4" fill="#38bdf8">
                <circle v-for="n in 36" :key="'cL-'+n" :cx="190 + (n % 6) * 22" :cy="100 + Math.floor(n / 6) * 11" r="1.5" />
              </g>

              <text x="247" y="128" fill="#38bdf8" font-size="10" font-family="Poppins" font-weight="700" text-anchor="middle">
                CAT 1 STANDING (A)
              </text>
              <text x="247" y="142" fill="#94a3b8" font-size="8" font-family="Poppins" text-anchor="middle">
                Kuota: {{ ticketStore.stock.cat1 }}
              </text>

              <!-- Right Festival Pen -->
              <rect x="400" y="85" width="145" height="85" rx="12" 
                :fill="ticketStore.selectedCategory === 'cat1' ? '#1e3a8a' : '#0f172a'" 
                :stroke="ticketStore.selectedCategory === 'cat1' ? '#38bdf8' : '#1e293b'" 
                stroke-width="1.5" />
              
              <!-- Subtle Festival Standing Crowd Dots Grid -->
              <g opacity="0.4" fill="#38bdf8">
                <circle v-for="n in 36" :key="'cR-'+n" :cx="415 + (n % 6) * 22" :cy="100 + Math.floor(n / 6) * 11" r="1.5" />
              </g>

              <text x="472" y="128" fill="#38bdf8" font-size="10" font-family="Poppins" font-weight="700" text-anchor="middle">
                CAT 1 STANDING (B)
              </text>
              <text x="472" y="142" fill="#94a3b8" font-size="8" font-family="Poppins" text-anchor="middle">
                Bebas Berdiri Depan Stage
              </text>
            </g>

            <!-- VIP Royal Floor (Container Box + Dot Grid) -->
            <g>
              <rect x="210" y="178" width="300" height="106" rx="14" 
                :fill="ticketStore.selectedCategory === 'vip' ? 'rgba(88, 28, 135, 0.4)' : 'rgba(30, 27, 75, 0.3)'" 
                :stroke="ticketStore.selectedCategory === 'vip' ? '#c084fc' : '#475569'" 
                stroke-width="1.5" />

              <text x="360" y="193" fill="#d8b4fe" font-size="9" font-family="Poppins" font-weight="700" text-anchor="middle" letter-spacing="1">
                VIP ROYAL SEATING (BARIS A - D)
              </text>

              <!-- VIP Individual Seat Dots -->
              <g v-for="seat in vipSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 6.5 : (hoveredSeat === seat.id ? 5.5 : 4.5)"
                  :fill="seat.isBooked ? '#475569' : (seat.isSelected ? '#00c48c' : (ticketStore.selectedCategory === 'vip' ? '#c084fc' : '#a855f7'))"
                  :stroke="seat.isSelected ? '#ffffff' : (seat.isBooked ? '#334155' : (hoveredSeat === seat.id ? '#ffffff' : '#e9d5ff'))"
                  :stroke-width="seat.isSelected ? 2.5 : (hoveredSeat === seat.id ? 2 : 1)"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- Soundboard Mixer Booth (FOH) -->
            <rect x="325" y="292" width="70" height="20" rx="4" fill="#0f172a" stroke="#64748b" stroke-width="1" />
            <text x="360" y="305" fill="#94a3b8" font-size="8" font-family="Roboto Mono" font-weight="600" text-anchor="middle">FOH CONSOLE</text>

            <!-- CAT 2 Tribune Left (West Wing Curved Seat Dots) -->
            <g>
              <text x="110" y="152" fill="#94a3b8" font-size="8" font-family="Poppins" font-weight="700" text-anchor="middle">TRIBUN BARAT</text>
              <g v-for="seat in tribuneLeftSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 6 : (hoveredSeat === seat.id ? 5 : 3.8)"
                  :fill="seat.isBooked ? '#334155' : (seat.isSelected ? '#00c48c' : (ticketStore.selectedCategory === 'cat2' ? '#60a5fa' : '#94a3b8'))"
                  :stroke="seat.isSelected || hoveredSeat === seat.id ? '#ffffff' : 'none'"
                  :stroke-width="seat.isSelected ? 2 : 1"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- CAT 2 Tribune Right (East Wing Curved Seat Dots) -->
            <g>
              <text x="610" y="152" fill="#94a3b8" font-size="8" font-family="Poppins" font-weight="700" text-anchor="middle">TRIBUN TIMUR</text>
              <g v-for="seat in tribuneRightSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 6 : (hoveredSeat === seat.id ? 5 : 3.8)"
                  :fill="seat.isBooked ? '#334155' : (seat.isSelected ? '#00c48c' : (ticketStore.selectedCategory === 'cat2' ? '#60a5fa' : '#94a3b8'))"
                  :stroke="seat.isSelected || hoveredSeat === seat.id ? '#ffffff' : 'none'"
                  :stroke-width="seat.isSelected ? 2 : 1"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- CAT 2 Tribune Back (Upper Grandstand Dots Array) -->
            <g>
              <rect x="140" y="325" width="440" height="90" rx="14" 
                :fill="ticketStore.selectedCategory === 'cat2' ? 'rgba(30, 58, 138, 0.25)' : 'rgba(15, 23, 42, 0.4)'" 
                :stroke="ticketStore.selectedCategory === 'cat2' ? '#60a5fa' : '#334155'" 
                stroke-width="1.2" />

              <text x="360" y="342" fill="#94a3b8" font-size="9" font-family="Poppins" font-weight="700" text-anchor="middle">
                TRIBUN UTAMA GRANDSTAND (BARIS 1 - 3)
              </text>

              <!-- Grandstand Dots -->
              <g v-for="seat in tribuneBackSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 6 : (hoveredSeat === seat.id ? 5 : 3.8)"
                  :fill="seat.isBooked ? '#334155' : (seat.isSelected ? '#00c48c' : (ticketStore.selectedCategory === 'cat2' ? '#60a5fa' : '#94a3b8'))"
                  :stroke="seat.isSelected || hoveredSeat === seat.id ? '#ffffff' : 'none'"
                  :stroke-width="seat.isSelected ? 2 : 1"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- Floating Hover Tooltip (Inside SVG) -->
            <g v-if="hoveredSeat" pointer-events="none">
              <rect x="270" y="440" width="180" height="36" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1" />
              <text x="360" y="458" fill="#ffffff" font-size="10" font-family="Poppins" font-weight="700" text-anchor="middle">
                {{ hoveredSeat }}
              </text>
              <text x="360" y="469" fill="#00c48c" font-size="8" font-family="Poppins" text-anchor="middle">
                Klik untuk memilih kursi ini
              </text>
            </g>
          </svg>
        </div>

        <!-- Realistic Seat Status Legend -->
        <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs text-slate-600 dark:text-slate-300 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-mint ring-2 ring-mint/30"></span>
            <span class="font-bold text-slate-700 dark:text-white">Kursi Terpilih</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-purple-500"></span>
            <span>VIP Soundcheck</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-sky"></span>
            <span>CAT 1 Festival</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-slate-400"></span>
            <span>CAT 2 Tribune</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-slate-700 opacity-60"></span>
            <span class="text-slate-400 dark:text-slate-500">Terisi / Habis</span>
          </div>
        </div>
      </div>

      <!-- Right: Category Cards + Qty + Lock CTA (5 Cols) -->
      <div class="lg:col-span-5 space-y-4">
        
        <!-- Category Selector Cards -->
        <div v-for="cat in cats" :key="cat.key"
          @click="selectCategoryZone(cat.key)"
          class="p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200"
          :class="ticketStore.selectedCategory === cat.key
            ? `${cat.bg} ${cat.ring} ring-2 shadow-card-hover border-transparent`
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-card'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full shrink-0" :class="cat.dot"></span>
              <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">{{ cat.label }}</span>
            </div>
            <span class="font-bold font-mono text-navy dark:text-sky text-sm sm:text-base">
              {{ ticketStore.formatMoney(ticketStore.prices[cat.key]) }}
            </span>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-5 leading-relaxed">{{ cat.desc }}</p>

          <div class="flex items-center justify-between mt-2.5 ml-5 text-[11px] font-mono text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-1.5">
            <span>Sisa Kuota: {{ ticketStore.stock[cat.key] }}</span>
            <span :class="ticketStore.stock[cat.key] > 0 ? 'text-mint font-bold' : 'text-coral font-bold'">
              {{ ticketStore.stock[cat.key] > 0 ? '● Siap Dipesan' : '● Habis' }}
            </span>
          </div>
        </div>

        <!-- Selected Seat Detail & Quantity Box -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-5 space-y-4 transition-colors">
          
          <!-- Seat Assigned Preview -->
          <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div class="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase">
                {{ selectedSeat.category === 'cat1' ? 'Area Masuk' : (ticketStore.quantity === 2 ? 'Nomor Kursi (2 Kursi Berdampingan)' : 'Nomor Kursi Terpilih') }}
              </div>
              <div class="text-sm font-extrabold text-navy dark:text-sky font-mono">
                {{ selectedSeat.category === 'cat1' ? 'Festival Standing Entry' : (ticketStore.quantity === 2 ? `${selectedSeat.name} & Berdampingan` : selectedSeat.name) }}
              </div>
              <div class="text-[10px] text-slate-500 dark:text-slate-400">{{ selectedSeat.zone }}</div>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-mint-light dark:bg-emerald-950/40 text-mint dark:text-emerald-400 text-[11px] font-bold">
              {{ ticketStore.quantity === 2 ? '2 Kursi Terpilih' : 'Terkonfirmasi' }}
            </span>
          </div>

          <!-- Quantity Selector -->
          <div class="flex items-center justify-between pt-1">
            <div>
              <div class="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200">Jumlah Tiket</div>
              <div class="text-[11px] text-slate-400 dark:text-slate-500">Maks. 2 tiket per transaksi</div>
            </div>
            <div class="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <button 
                @click="ticketStore.decrementQty()" 
                class="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >-</button>
              <span class="font-bold text-base sm:text-lg font-mono w-6 text-center text-navy dark:text-sky">{{ ticketStore.quantity }}</span>
              <button 
                @click="ticketStore.incrementQty()" 
                class="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >+</button>
            </div>
          </div>

          <!-- Price Calculations -->
          <div class="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs sm:text-[13px] font-mono">
            <div class="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Harga Tiket</span>
              <span class="text-slate-700 dark:text-slate-300">{{ ticketStore.formatMoney(ticketStore.unitPrice) }} × {{ ticketStore.quantity }}</span>
            </div>
            <div class="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Biaya Layanan</span>
              <span class="text-slate-700 dark:text-slate-300">{{ ticketStore.formatMoney(ticketStore.bookingFee * ticketStore.quantity) }}</span>
            </div>
            <div class="flex justify-between font-bold text-navy dark:text-sky text-sm sm:text-base pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
              <span>Estimasi Subtotal</span>
              <span>{{ ticketStore.formatMoney(ticketStore.subtotal) }}</span>
            </div>
          </div>

          <!-- Lock Button CTA -->
          <button
            @click="handleLock()"
            class="w-full py-3.5 rounded-xl bg-navy dark:bg-sky text-white font-bold text-sm tracking-wide shadow-soft hover:bg-navy-light dark:hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <SvgIcon name="lock" className="w-4 h-4 text-white" />
            <span>Kunci Kursi &amp; Lanjut Bayar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
