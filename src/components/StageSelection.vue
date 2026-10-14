<script setup>
import { ref, computed, watch } from 'vue';
import { useTicketStore } from '../stores/ticketStore';
import { useQueueStore } from '../stores/queueStore';
import { useEventsStore } from '../stores/eventsStore';

const ticketStore = useTicketStore();
const queueStore = useQueueStore();
const eventsStore = useEventsStore();

const currentEvent = computed(() => eventsStore.selectedEvent);

// Multi-seat selection (supports 1 to 10 seats)
const selectedSeatsList = ref(['VIP-A08']);
const hoveredSeat = ref(null);

// VIP Seat dots (4 rows x 14 seats)
const vipSeats = computed(() => {
  const list = [];
  const rows = ['A', 'B', 'C', 'D'];
  const bookedIndices = [2, 5, 8, 12, 17, 21, 28, 33, 40, 47];

  for (let r = 0; r < rows.length; r++) {
    for (let c = 1; c <= 14; c++) {
      const idx = r * 14 + c;
      const id = `VIP-${rows[r]}${String(c).padStart(2, '0')}`;
      const isBooked = bookedIndices.includes(idx);
      const isSelected = selectedSeatsList.value.includes(id);

      list.push({
        id,
        category: 'vip',
        label: `VIP ${rows[r]}-${c}`,
        row: rows[r],
        num: c,
        x: 236 + (c - 1) * 22,
        y: 190 + r * 16,
        isBooked,
        isSelected,
      });
    }
  }
  return list;
});

// CAT 2 Tribune Left seats
const tribuneLeftSeats = computed(() => {
  const list = [];
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const count = 7;
    for (let c = 0; c < count; c++) {
      const id = `CAT2-W${r+1}-${c+1}`;
      const isBooked = (r * count + c) % 4 === 1;
      const isSelected = selectedSeatsList.value.includes(id);
      list.push({
        id,
        category: 'cat2',
        label: `Tribun Barat R${r+1}-${c+1}`,
        x: 75 + r * 18 + c * 8,
        y: 170 + c * 24,
        isBooked,
        isSelected,
      });
    }
  }
  return list;
});

// CAT 2 Tribune Right seats
const tribuneRightSeats = computed(() => {
  const list = [];
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const count = 7;
    for (let c = 0; c < count; c++) {
      const id = `CAT2-E${r+1}-${c+1}`;
      const isBooked = (r * count + c) % 5 === 2;
      const isSelected = selectedSeatsList.value.includes(id);
      list.push({
        id,
        category: 'cat2',
        label: `Tribun Timur R${r+1}-${c+1}`,
        x: 685 - r * 18 - c * 8,
        y: 170 + c * 24,
        isBooked,
        isSelected,
      });
    }
  }
  return list;
});

// CAT 2 Tribune Back (Grandstand)
const tribuneBackSeats = computed(() => {
  const list = [];
  const rows = 3;
  for (let r = 0; r < rows; r++) {
    const count = 22;
    for (let c = 0; c < count; c++) {
      const id = `CAT2-B${r+1}-${c+1}`;
      const isBooked = (r * count + c) % 6 === 0 || (r * count + c) % 7 === 3;
      const isSelected = selectedSeatsList.value.includes(id);
      list.push({
        id,
        category: 'cat2',
        label: `Grandstand R${r+1}-${c+1}`,
        x: 175 + c * 19,
        y: 395 + r * 18,
        isBooked,
        isSelected,
      });
    }
  }
  return list;
});

// Click individual seat (multi-select up to 10)
function selectIndividualSeat(seat) {
  if (seat.isBooked) return;

  // If selecting a seat from another category, reset list to this new category
  if (ticketStore.selectedCategory !== seat.category) {
    ticketStore.selectCategory(seat.category);
    selectedSeatsList.value = [seat.id];
  } else {
    const idx = selectedSeatsList.value.indexOf(seat.id);
    if (idx !== -1) {
      // Toggle off (if more than 1 seat)
      if (selectedSeatsList.value.length > 1) {
        selectedSeatsList.value.splice(idx, 1);
      }
    } else {
      // Add seat if under 10 limit
      if (selectedSeatsList.value.length < 10) {
        selectedSeatsList.value.push(seat.id);
      } else {
        alert('Maksimal 10 kursi per transaksi (Sesuai ketentuan batas rombongan).');
        return;
      }
    }
  }

  ticketStore.setSelectedSeats(selectedSeatsList.value);
}

// Select zone/category
function selectCategoryZone(catKey) {
  ticketStore.selectCategory(catKey);
  if (catKey === 'cat1') {
    selectedSeatsList.value = Array.from({ length: ticketStore.quantity }, (_, i) => `CAT1-FEST-${String.fromCharCode(65 + i)}`);
    ticketStore.setSelectedSeat(`Festival Standing (${ticketStore.quantity} Tiket)`, 'CAT 1 Standing Zone', 'cat1');
  } else if (catKey === 'vip') {
    autoPickAdjacentSeats('vip', ticketStore.quantity);
  } else {
    autoPickAdjacentSeats('cat2', ticketStore.quantity);
  }
}

// Helper to auto-pick adjacent available seats
function autoPickAdjacentSeats(category, count) {
  const targetSeats = category === 'vip' ? vipSeats.value : tribuneBackSeats.value;
  const available = targetSeats.filter(s => !s.isBooked);
  const picked = available.slice(0, Math.min(count, available.length)).map(s => s.id);

  if (picked.length > 0) {
    selectedSeatsList.value = picked;
    ticketStore.setSelectedSeats(picked);
  }
}

// Quantity increment with adjacent auto-select
function handleIncrement() {
  if (ticketStore.quantity < 10) {
    const nextQty = ticketStore.quantity + 1;
    if (ticketStore.selectedCategory === 'cat1') {
      ticketStore.incrementQty();
      selectedSeatsList.value = Array.from({ length: ticketStore.quantity }, (_, i) => `CAT1-FEST-${String.fromCharCode(65 + i)}`);
    } else {
      autoPickAdjacentSeats(ticketStore.selectedCategory, nextQty);
      ticketStore.setQuantity(selectedSeatsList.value.length);
    }
  } else {
    alert('Maksimal pemesanan adalah 10 tiket per transaksi.');
  }
}

// Quantity decrement
function handleDecrement() {
  if (ticketStore.quantity > 1) {
    const nextQty = ticketStore.quantity - 1;
    if (ticketStore.selectedCategory === 'cat1') {
      ticketStore.decrementQty();
      selectedSeatsList.value = Array.from({ length: ticketStore.quantity }, (_, i) => `CAT1-FEST-${String.fromCharCode(65 + i)}`);
    } else {
      if (selectedSeatsList.value.length > 1) {
        selectedSeatsList.value.pop();
        ticketStore.setSelectedSeats(selectedSeatsList.value);
      }
    }
  }
}

function handleLock() {
  const seatSummary = ticketStore.selectedCategory === 'cat1'
    ? `CAT 1 Festival Standing (${ticketStore.quantity} Tiket)`
    : `${selectedSeatsList.value.join(', ')} (${ticketStore.quantity} Kursi)`;

  const zoneName = ticketStore.selectedCategory === 'vip' 
    ? 'VIP Royal Floor' 
    : (ticketStore.selectedCategory === 'cat1' ? 'CAT 1 Standing Zone' : 'CAT 2 Reserved Tribune');

  ticketStore.setSelectedSeat(seatSummary, zoneName, ticketStore.selectedCategory);
  const success = ticketStore.lockTickets();
  if (success) {
    queueStore.setStage('checkout');
  }
}

const cats = [
  { key: 'vip', label: 'VIP Royal Floor (Seated)', color: '#F59E0B', desc: 'Kursi berpenomoran barisan depan + soundcheck pass eksklusif.' },
  { key: 'cat1', label: 'CAT 1 Standing Festival', color: '#06B6D4', desc: 'Area festival berdiri tepat di depan panggung & catwalk.' },
  { key: 'cat2', label: 'CAT 2 Reserved Tribune', color: '#8B5CF6', desc: 'Tribun grandstand bernomor pandangan panoramik panggung.' },
];
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-8">

    <!-- Header bar with event title & countdown badge -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-black pb-4">
      <div>
        <div class="font-mono text-xs uppercase tracking-widest text-[#525252]">
          {{ currentEvent.title }} · PETA ARSITEKTURAL STADION
        </div>
        <h2 class="text-3xl sm:text-4xl font-serif font-black tracking-tight text-black">
          Peta Stadion &amp; Pemilihan Kursi (1–10 Tiket)
        </h2>
      </div>
      <div class="font-mono text-xs uppercase flex items-center gap-2">
        <span class="border border-black px-3 py-1 bg-black text-white font-bold">
          SESI KUNCI: 10 MENIT
        </span>
      </div>
    </div>

    <!-- Anti-Scalping & Multi-Seat Info Alert -->
    <div class="border-2 border-black p-4 bg-[#F5F5F5] font-mono text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-black font-bold">
        <span class="bg-black text-white px-2 py-0.5 text-[10px]">ANTI-CALO SYSTEM</span>
        <span>Pemesanan Rombongan (Bisa memilih hingga 10 kursi kosong sekaligus)</span>
      </div>
      <div class="text-[#525252] text-[11px]">
        1 Tiket = 1 Identitas NIK KTP (Nama teman diinput pada form checkout berikutnya)
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left: Interactive Colorful Stadium CAD Map (7 Cols) -->
      <div class="lg:col-span-7 border-2 border-black p-6 space-y-4 bg-white">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black pb-3 font-mono text-xs">
          <div>
            <div class="font-bold text-black uppercase">{{ currentEvent.venue }}</div>
            <div class="text-[10px] text-[#525252]">Klik titik kursi untuk memilih/membatalkan kursi kosong (Maks. 10)</div>
          </div>

          <div class="bg-black text-white px-3 py-1 font-bold text-[11px] uppercase border border-black flex items-center gap-2">
            <span>{{ selectedSeatsList.length }} KURSI TERPILIH</span>
          </div>
        </div>

        <!-- SVG Arena Map with Official Category Colors & Clear Separation -->
        <div class="w-full aspect-[4/3] bg-black border-2 border-black relative overflow-hidden flex items-center justify-center">
          
          <svg viewBox="0 0 760 520" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <!-- Stadium Boundary Lines -->
            <ellipse cx="380" cy="270" rx="360" ry="220" fill="none" stroke="#333333" stroke-width="1.5" stroke-dasharray="4 4" />
            <ellipse cx="380" cy="270" rx="335" ry="195" fill="none" stroke="#222222" stroke-width="1" />

            <!-- PANGGUNG UTAMA (MAIN STAGE) -->
            <g class="cursor-pointer" @click="selectCategoryZone('vip')">
              <rect x="250" y="20" width="260" height="48" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2" />
              <text x="380" y="44" fill="#000000" font-size="12" font-family="'JetBrains Mono', monospace" font-weight="900" text-anchor="middle" letter-spacing="2">
                PANGGUNG UTAMA
              </text>
              <text x="380" y="58" fill="#000000" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">
                MAIN PERFORMANCE STAGE
              </text>

              <!-- Runway / Catwalk -->
              <rect x="358" y="68" width="44" height="60" fill="#FFFFFF" stroke="#000000" stroke-width="1" />
              <circle cx="380" cy="132" r="16" fill="#F59E0B" stroke="#000000" stroke-width="1" />
              <text x="380" y="136" fill="#000000" font-size="7" font-family="'JetBrains Mono', monospace" font-weight="900" text-anchor="middle">CATWALK</text>
            </g>

            <!-- 1. VIP ROYAL FLOOR (GOLD ZONE #F59E0B) - Seated in front of stage -->
            <g>
              <rect x="220" y="155" width="320" height="95" fill="#f59e0b08" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="4 4" />
              
              <text x="380" y="172" fill="#F59E0B" font-size="10" font-family="'JetBrains Mono', monospace" font-weight="900" text-anchor="middle" letter-spacing="1">
                VIP ROYAL FLOOR (SEATED) · EMAS
              </text>

              <g v-for="seat in vipSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 6 : 4"
                  :fill="seat.isBooked ? '#222222' : (seat.isSelected ? '#FFFFFF' : '#F59E0B')"
                  :stroke="seat.isSelected ? '#F59E0B' : 'none'"
                  :stroke-width="seat.isSelected ? 2.5 : 0"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer transition-transform duration-100 hover:scale-125'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- 2. CAT 1 FESTIVAL STANDING (CYAN ZONE #06B6D4) - Completely separated below VIP -->
            <g class="cursor-pointer" @click="selectCategoryZone('cat1')">
              <rect x="180" y="260" width="400" height="75" 
                fill="#06b6d412" 
                :stroke="ticketStore.selectedCategory === 'cat1' ? '#06B6D4' : '#0891b2'" 
                :stroke-width="ticketStore.selectedCategory === 'cat1' ? 2.5 : 1" 
                stroke-dasharray="5 3" 
              />
              
              <text x="380" y="292" 
                fill="#06B6D4" 
                font-size="11" font-family="'JetBrains Mono', monospace" font-weight="900" text-anchor="middle" letter-spacing="1.5">
                CAT 1: FESTIVAL STANDING AREA · CYAN
              </text>
              <text x="380" y="310" fill="#67e8f9" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">
                Area Berdiri Bebas · Kapasitas Luas &amp; Dekat Catwalk
              </text>
            </g>

            <!-- 3. CAT 2 TRIBUN TIMUR & BARAT (PURPLE ZONE #8B5CF6) -->
            <g>
              <text x="95" y="152" fill="#8B5CF6" font-size="9" font-family="'JetBrains Mono', monospace" font-weight="800">TRIBUN BARAT (CAT 2)</text>
              <g v-for="seat in tribuneLeftSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 6 : 4"
                  :fill="seat.isBooked ? '#222222' : (seat.isSelected ? '#FFFFFF' : '#8B5CF6')"
                  :stroke="seat.isSelected ? '#8B5CF6' : 'none'"
                  :stroke-width="seat.isSelected ? 2.5 : 0"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer transition-transform duration-100 hover:scale-125'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <g>
              <text x="610" y="152" fill="#8B5CF6" font-size="9" font-family="'JetBrains Mono', monospace" font-weight="800">TRIBUN TIMUR (CAT 2)</text>
              <g v-for="seat in tribuneRightSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 6 : 4"
                  :fill="seat.isBooked ? '#222222' : (seat.isSelected ? '#FFFFFF' : '#8B5CF6')"
                  :stroke="seat.isSelected ? '#8B5CF6' : 'none'"
                  :stroke-width="seat.isSelected ? 2.5 : 0"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer transition-transform duration-100 hover:scale-125'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- 4. CAT 2 TRIBUN UTAMA GRANDSTAND (PURPLE ZONE #8B5CF6) -->
            <g>
              <rect x="150" y="350" width="460" height="98" fill="#8b5cf60a" stroke="#8B5CF6" stroke-width="1.5" stroke-dasharray="4 4" />
              <text x="380" y="372" fill="#8B5CF6" font-size="9" font-family="'JetBrains Mono', monospace" font-weight="800" text-anchor="middle">
                TRIBUN UTAMA GRANDSTAND (CAT 2) · UNGU
              </text>

              <g v-for="seat in tribuneBackSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 6 : 4"
                  :fill="seat.isBooked ? '#222222' : (seat.isSelected ? '#FFFFFF' : '#8B5CF6')"
                  :stroke="seat.isSelected ? '#8B5CF6' : 'none'"
                  :stroke-width="seat.isSelected ? 2.5 : 0"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer transition-transform duration-100 hover:scale-125'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- Floating Hover Tooltip -->
            <g v-if="hoveredSeat" pointer-events="none">
              <rect x="290" y="465" width="180" height="30" fill="#000000" stroke="#FFFFFF" stroke-width="1" />
              <text x="380" y="484" fill="#FFFFFF" font-size="10" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">
                {{ hoveredSeat }} (Klik untuk memilih)
              </text>
            </g>
          </svg>
        </div>

        <!-- Official Concert Color Legend Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-[#525252] pt-3 border-t border-black uppercase">
          <div class="flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 bg-[#F59E0B] inline-block border border-black"></span>
            <span class="text-black font-bold">VIP (Emas)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 bg-[#06B6D4] inline-block border border-black"></span>
            <span class="text-black font-bold">CAT 1 (Cyan)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 bg-[#8B5CF6] inline-block border border-black"></span>
            <span class="text-black font-bold">CAT 2 (Ungu)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 bg-white border-2 border-black inline-block"></span>
            <span class="text-black font-bold">Terpilih (1-10)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 bg-[#222222] inline-block"></span>
            <span>Terisi (Booked)</span>
          </div>
        </div>
      </div>

      <!-- Right: Category Cards + Multi-Seat Qty + Lock CTA (5 Cols) -->
      <div class="lg:col-span-5 space-y-6">
        
        <!-- Category Selector Cards -->
        <div class="space-y-3 font-mono">
          <div v-for="cat in cats" :key="cat.key"
            @click="selectCategoryZone(cat.key)"
            class="border-2 p-5 cursor-pointer transition-all duration-100"
            :class="ticketStore.selectedCategory === cat.key
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-black hover:border-4'"
          >
            <div class="flex items-start justify-between">
              <div>
                <div class="text-[10px] uppercase opacity-70 flex items-center gap-2">
                  <span class="w-2 h-2 inline-block" :style="{ backgroundColor: cat.color }"></span>
                  <span>KATEGORI</span>
                </div>
                <div class="font-bold text-sm uppercase">{{ cat.label }}</div>
              </div>
              <div class="text-right">
                <div class="text-base font-bold">
                  {{ ticketStore.formatMoney(ticketStore.prices[cat.key]) }}
                </div>
              </div>
            </div>

            <p class="font-body text-xs opacity-80 mt-2">{{ cat.desc }}</p>

            <div class="flex items-center justify-between mt-3 text-[10px] border-t border-current pt-2 uppercase">
              <span>Sisa Kuota: {{ ticketStore.stock[cat.key] }}</span>
              <span class="font-bold">
                {{ ticketStore.stock[cat.key] > 0 ? '[Siap Kunci]' : '[Habis]' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Selected Seats Detail & Quantity Selector -->
        <div class="border-2 border-black p-6 space-y-4 bg-white font-mono">
          
          <!-- Selected Seats Badge Box -->
          <div class="border border-black p-3 space-y-2 text-xs uppercase">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-[#525252]">Alokasi Kursi Kosong:</span>
              <span class="border border-black px-2 py-0.5 text-[10px] font-bold bg-black text-white">
                {{ ticketStore.quantity }} TIKET TERPILIH
              </span>
            </div>
            
            <!-- List of seat badges -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span 
                v-for="seatId in selectedSeatsList" 
                :key="seatId"
                class="border border-black bg-[#F5F5F5] px-2 py-0.5 text-[10px] font-bold text-black"
              >
                {{ seatId }}
              </span>
            </div>
          </div>

          <!-- Quantity Selector (1 to 10) -->
          <div class="flex items-center justify-between pt-2">
            <div>
              <div class="font-bold text-xs uppercase">Jumlah Tiket Rombongan</div>
              <div class="text-[10px] text-[#525252]">Maksimal 10 tiket per transaksi</div>
            </div>
            <div class="flex items-center border-2 border-black">
              <button 
                @click="handleDecrement()" 
                class="w-9 h-9 flex items-center justify-center font-bold text-base text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                title="Kurangi 1 Tiket"
              >-</button>
              <span class="font-bold text-base w-10 text-center">{{ ticketStore.quantity }}</span>
              <button 
                @click="handleIncrement()" 
                class="w-9 h-9 flex items-center justify-center font-bold text-base text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                title="Tambah 1 Tiket (Auto-Alokasi Berdampingan)"
              >+</button>
            </div>
          </div>

          <!-- Price Calculations -->
          <div class="border-t border-black pt-3 space-y-1.5 text-xs">
            <div class="flex justify-between text-[#525252]">
              <span>Tarif Tiket:</span>
              <span class="text-black">{{ ticketStore.formatMoney(ticketStore.unitPrice) }} × {{ ticketStore.quantity }}</span>
            </div>
            <div class="flex justify-between text-[#525252]">
              <span>Booking Fee:</span>
              <span class="text-black">{{ ticketStore.formatMoney(ticketStore.bookingFee * ticketStore.quantity) }}</span>
            </div>
            <div class="flex justify-between font-bold text-black text-sm pt-2 border-t border-black mt-2">
              <span>Total Tagihan ({{ ticketStore.quantity }} Tiket):</span>
              <span>{{ ticketStore.formatMoney(ticketStore.subtotal) }}</span>
            </div>
          </div>

          <!-- Lock Button CTA -->
          <button
            @click="handleLock()"
            class="btn-mono-primary w-full py-4 text-center text-xs cursor-pointer"
          >
            <span>Kunci {{ ticketStore.quantity }} Kursi &amp; Lanjut Form NIK →</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
