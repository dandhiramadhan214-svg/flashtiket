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

const selectedSeat = ref({
  id: 'VIP-A08',
  category: 'vip',
  name: 'Baris A No. 08',
  zone: 'VIP Royal Floor',
});

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

// CAT 2 Tribune Left seats
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

// CAT 2 Tribune Right seats
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

// CAT 2 Tribune Back
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
  { key: 'vip', label: 'VIP Royal Soundcheck', desc: 'Kursi berpenomoran barisan depan + soundcheck pass.' },
  { key: 'cat1', label: 'CAT 1 Standing Festival', desc: 'Area festival berdiri di depan panggung & catwalk.' },
  { key: 'cat2', label: 'CAT 2 Reserved Seating', desc: 'Tribun grandstand bernomor pandangan panoramik.' },
];
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-8">

    <!-- Header bar with event title & countdown badge -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-black pb-4">
      <div>
        <div class="font-mono text-xs uppercase tracking-widest text-[#525252]">
          {{ currentEvent.title }} · DENAH ARSITEKTURAL
        </div>
        <h2 class="text-3xl sm:text-4xl font-serif font-black tracking-tight text-black">
          Peta Stadion &amp; Pemilihan Kursi
        </h2>
      </div>
      <div class="font-mono text-xs uppercase">
        <span class="border border-black px-3 py-1 text-black">
          Sesi Reservasi: 10 Menit (600s)
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left: Interactive CAD Stadium Map (7 Cols) -->
      <div class="lg:col-span-7 border-2 border-black p-6 space-y-4 bg-white">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black pb-3 font-mono text-xs">
          <div>
            <div class="font-bold text-black uppercase">{{ currentEvent.venue }}</div>
            <div class="text-[10px] text-[#525252]">Pilih titik kursi pada peta untuk menentukan alokasi</div>
          </div>

          <div class="bg-black text-white px-3 py-1 font-bold text-[11px] uppercase border border-black">
            KURSI: {{ selectedSeat.name }}
          </div>
        </div>

        <!-- SVG Arena Map (Architectural Blueprint CAD) -->
        <div class="w-full aspect-[4/3] bg-black border-2 border-black relative overflow-hidden flex items-center justify-center">
          
          <svg viewBox="0 0 720 490" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <!-- Stadium Boundary Hairline Lines -->
            <ellipse cx="360" cy="280" rx="340" ry="200" fill="none" stroke="#525252" stroke-width="1" stroke-dasharray="3 3" />
            <ellipse cx="360" cy="275" rx="310" ry="180" fill="none" stroke="#333333" stroke-width="1" />

            <!-- Panggung Utama (MAIN STAGE) -->
            <g class="cursor-pointer" @click="selectCategoryZone('vip')">
              <rect x="230" y="20" width="260" height="52" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2" />
              <text x="360" y="45" fill="#000000" font-size="12" font-family="'JetBrains Mono', monospace" font-weight="800" text-anchor="middle" letter-spacing="2">
                PANGGUNG UTAMA
              </text>
              <text x="360" y="60" fill="#000000" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="600" text-anchor="middle">
                MAIN PERFORMANCE STAGE
              </text>

              <!-- Runway / Catwalk -->
              <rect x="338" y="72" width="44" height="65" fill="#FFFFFF" stroke="#000000" stroke-width="1" />
              <circle cx="360" cy="142" r="16" fill="#FFFFFF" stroke="#000000" stroke-width="1" />
              <text x="360" y="145" fill="#000000" font-size="7" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">CATWALK</text>
            </g>

            <!-- CAT 1 Standing Festival Zone -->
            <g class="cursor-pointer" @click="selectCategoryZone('cat1')">
              <rect x="200" y="160" width="320" height="150" fill="none" 
                :stroke="ticketStore.selectedCategory === 'cat1' ? '#FFFFFF' : '#525252'" 
                :stroke-width="ticketStore.selectedCategory === 'cat1' ? 2 : 1" 
                stroke-dasharray="4 4" />
              
              <text x="360" y="240" 
                :fill="ticketStore.selectedCategory === 'cat1' ? '#FFFFFF' : '#888888'" 
                font-size="11" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle" letter-spacing="1">
                CAT 1: FESTIVAL STANDING AREA
              </text>
              <text x="360" y="255" fill="#666666" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">
                Free Standing · Direct Stage Proximity
              </text>
            </g>

            <!-- VIP Floor Seats -->
            <g>
              <text x="360" y="185" fill="#FFFFFF" font-size="9" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">
                VIP ROYAL FLOOR (SEATED)
              </text>

              <g v-for="seat in vipSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 5.5 : 3.5"
                  :fill="seat.isBooked ? '#333333' : (seat.isSelected ? '#FFFFFF' : '#888888')"
                  :stroke="seat.isSelected ? '#FFFFFF' : 'none'"
                  :stroke-width="seat.isSelected ? 2 : 0"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- CAT 2 Tribune Left -->
            <g>
              <text x="95" y="145" fill="#888888" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="700">TRIBUN BARAT</text>
              <g v-for="seat in tribuneLeftSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 5.5 : 3.5"
                  :fill="seat.isBooked ? '#333333' : (seat.isSelected ? '#FFFFFF' : '#666666')"
                  :stroke="seat.isSelected ? '#FFFFFF' : 'none'"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- CAT 2 Tribune Right -->
            <g>
              <text x="590" y="145" fill="#888888" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="700">TRIBUN TIMUR</text>
              <g v-for="seat in tribuneRightSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 5.5 : 3.5"
                  :fill="seat.isBooked ? '#333333' : (seat.isSelected ? '#FFFFFF' : '#666666')"
                  :stroke="seat.isSelected ? '#FFFFFF' : 'none'"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- CAT 2 Tribune Back -->
            <g>
              <rect x="140" y="325" width="440" height="90" fill="none" stroke="#444444" stroke-width="1" />
              <text x="360" y="342" fill="#888888" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">
                TRIBUN UTAMA GRANDSTAND
              </text>

              <g v-for="seat in tribuneBackSeats" :key="seat.id">
                <circle
                  :cx="seat.x"
                  :cy="seat.y"
                  :r="seat.isSelected ? 5.5 : 3.5"
                  :fill="seat.isBooked ? '#333333' : (seat.isSelected ? '#FFFFFF' : '#666666')"
                  :stroke="seat.isSelected ? '#FFFFFF' : 'none'"
                  :class="seat.isBooked ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'"
                  @mouseenter="!seat.isBooked && (hoveredSeat = seat.id)"
                  @mouseleave="hoveredSeat === seat.id && (hoveredSeat = null)"
                  @click="selectIndividualSeat(seat)"
                />
              </g>
            </g>

            <!-- Floating Hover Tooltip -->
            <g v-if="hoveredSeat" pointer-events="none">
              <rect x="270" y="440" width="180" height="32" fill="#000000" stroke="#FFFFFF" stroke-width="1" />
              <text x="360" y="460" fill="#FFFFFF" font-size="9" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">
                {{ hoveredSeat }} (Klik untuk memilih)
              </text>
            </g>
          </svg>
        </div>

        <!-- Legend Bar (Sharp Monochrome) -->
        <div class="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] text-[#525252] pt-2 border-t border-black uppercase">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-white border border-black"></span>
            <span class="text-black font-bold">Terpilih</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-black"></span>
            <span>Tersedia</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-[#333333]"></span>
            <span>Terisi / Booked</span>
          </div>
        </div>
      </div>

      <!-- Right: Category Cards + Qty + Lock CTA (5 Cols) -->
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
                <div class="text-[10px] uppercase opacity-70">KATEGORI</div>
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

        <!-- Selected Seat Detail & Quantity Box -->
        <div class="border-2 border-black p-6 space-y-4 bg-white font-mono">
          
          <div class="border border-black p-3 flex items-center justify-between text-xs uppercase">
            <div>
              <div class="text-[10px] text-[#525252]">Alokasi Kursi:</div>
              <div class="font-bold text-black">{{ selectedSeat.name }}</div>
              <div class="text-[10px] text-[#525252]">{{ selectedSeat.zone }}</div>
            </div>
            <span class="border border-black px-2 py-0.5 text-[10px] font-bold">
              TERKONFIRMASI
            </span>
          </div>

          <!-- Quantity Selector -->
          <div class="flex items-center justify-between pt-2">
            <div>
              <div class="font-bold text-xs uppercase">Jumlah Tiket</div>
              <div class="text-[10px] text-[#525252]">Maks. 2 tiket per transaksi</div>
            </div>
            <div class="flex items-center border border-black">
              <button 
                @click="ticketStore.decrementQty()" 
                class="w-8 h-8 flex items-center justify-center font-bold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
              >-</button>
              <span class="font-bold text-sm w-8 text-center">{{ ticketStore.quantity }}</span>
              <button 
                @click="ticketStore.incrementQty()" 
                class="w-8 h-8 flex items-center justify-center font-bold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
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
              <span>Subtotal:</span>
              <span>{{ ticketStore.formatMoney(ticketStore.subtotal) }}</span>
            </div>
          </div>

          <!-- Lock Button CTA -->
          <button
            @click="handleLock()"
            class="btn-mono-primary w-full py-4 text-center text-xs"
          >
            <span>Kunci Kursi &amp; Lanjut Bayar →</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
