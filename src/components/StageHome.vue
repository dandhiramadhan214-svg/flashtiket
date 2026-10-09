<script setup>
import { computed } from 'vue';
import { useEventsStore } from '../stores/eventsStore';
import { useQueueStore } from '../stores/queueStore';
import { useTicketStore } from '../stores/ticketStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useNotifStore } from '../stores/notifStore';
import { useReviewStore } from '../stores/reviewStore';
import SvgIcon from './SvgIcon.vue';

const eventsStore = useEventsStore();
const queueStore = useQueueStore();
const ticketStore = useTicketStore();
const wishlistStore = useWishlistStore();
const notifStore = useNotifStore();
const reviewStore = useReviewStore();

function handleEventClick(event) {
  if (event.status === 'ended') {
    // Open review modal for ended event
    reviewStore.openReviewModal(event);
    return;
  }
  if (event.status === 'sold-out') {
    notifStore.push('error', 'Tiket Habis', `Seluruh kuota tiket "${event.title}" telah habis terjual (Sold Out).`);
    return;
  }
  if (event.status === 'coming-soon') {
    notifStore.push('info', 'Segera Dibuka', `Tiket "${event.title}" akan segera dibuka! Pantau jadwal berkala.`);
    return;
  }
  eventsStore.selectEvent(event.id);
  ticketStore.resetAll();
  queueStore.setStage('lobby');
}

function toggleWishlist(e, event) {
  e.stopPropagation();
  const already = wishlistStore.isWishlisted(event.id);
  wishlistStore.toggle(event.id);
  if (already) {
    notifStore.push('info', 'Dihapus dari Wishlist', `"${event.title}" dihapus dari favorit.`);
  } else {
    notifStore.push('success', 'Ditambahkan ke Wishlist', `"${event.title}" berhasil disimpan ke favorit!`);
  }
}

const bannerEvent = computed(() => {
  return eventsStore.events.find(e => e.hot && e.status === 'on-sale') || eventsStore.events[0];
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
    


    <!-- Featured Hero Banner (Yesplis Style) -->
    <div 
      @click="handleEventClick(bannerEvent)"
      class="group relative rounded-3xl overflow-hidden shadow-elevated cursor-pointer bg-slate-900 transition-all duration-300 hover:shadow-2xl"
    >
      <!-- Background Image / Gradient -->
      <div 
        class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        :style="{ backgroundImage: bannerEvent.image ? `url('${bannerEvent.image}')` : 'none' }"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-navy/70 to-black/30"></div>

      <!-- Banner Content -->
      <div class="relative p-6 sm:p-10 lg:p-12 min-h-[340px] sm:min-h-[400px] flex flex-col justify-end text-white">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="px-3 py-1 rounded-full bg-coral text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <SvgIcon name="fire" className="w-3.5 h-3.5" />
            Trending Event
          </span>
          <span class="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium text-white">
            {{ bannerEvent.category }}
          </span>
          <span class="px-3 py-1 rounded-full bg-mint/30 backdrop-blur-md text-mint text-xs font-bold">
            Tiket Tersedia
          </span>
        </div>

        <h1 class="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 leading-tight text-white drop-shadow-sm">
          {{ bannerEvent.title }}
        </h1>
        <p class="text-sm sm:text-base text-slate-200 font-medium max-w-2xl mb-4">
          {{ bannerEvent.subtitle }}
        </p>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/20">
          <div class="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-200">
            <div class="flex items-center gap-1.5">
              <SvgIcon name="calendar" className="w-4 h-4 text-coral" />
              <span>{{ bannerEvent.date }} · {{ bannerEvent.time }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <SvgIcon name="location" className="w-4 h-4 text-sky" />
              <span>{{ bannerEvent.venue }}, {{ bannerEvent.city }}</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-right">
              <div class="text-[11px] text-white/70">Mulai dari</div>
              <div class="text-lg sm:text-xl font-extrabold text-white font-mono">
                {{ eventsStore.formatPrice(bannerEvent.priceFrom, bannerEvent.currency) }}
              </div>
            </div>
            <!-- High-contrast button that never vanishes on hover -->
            <button 
              class="px-5 py-2.5 rounded-xl bg-coral text-white font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shrink-0"
            >
              <span>Beli Tiket Sekarang</span>
              <SvgIcon name="arrow-right" className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Search & Filter Bar Section (Yesplis Minimalist Design) -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-4 sm:p-6 space-y-4 transition-colors">
      
      <!-- Search Input Box with SVG -->
      <div class="relative">
        <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <SvgIcon name="search" className="w-5 h-5 text-slate-400" />
        </span>
        <input 
          v-model="eventsStore.searchQuery"
          type="text"
          placeholder="Cari konser, festival, artis, atau lokasi venue..."
          class="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky focus:bg-white dark:focus:bg-slate-800 transition-all"
        />
        <button 
          v-if="eventsStore.searchQuery"
          @click="eventsStore.searchQuery = ''"
          class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <SvgIcon name="cancel" className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <!-- Horizontal Scrollable Category Filter Chips -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2">
        <button
          v-for="cat in eventsStore.categories"
          :key="cat"
          @click="eventsStore.activeCategory = cat"
          class="shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
          :class="eventsStore.activeCategory === cat
            ? 'bg-navy dark:bg-sky text-white shadow-soft ring-2 ring-navy/20 dark:ring-sky/30'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-navy dark:hover:text-sky'"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Events Grid Section -->
    <div class="space-y-4">
      <!-- Section Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-navy dark:text-sky tracking-tight flex items-center gap-2">
            <span>Daftar Event &amp; Tiket</span>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {{ eventsStore.filteredEvents.length }} Acara
            </span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Pilih event untuk masuk ke ruang tunggu dan amankan tiket Anda.</p>
        </div>

        <div v-if="eventsStore.activeCategory !== 'Semua' || eventsStore.searchQuery" class="flex items-center gap-2">
          <button 
            @click="eventsStore.activeCategory = 'Semua'; eventsStore.searchQuery = '';"
            class="text-xs text-coral hover:underline font-semibold flex items-center gap-1.5"
          >
            <SvgIcon name="refresh" className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="eventsStore.filteredEvents.length === 0" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center space-y-3">
        <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <SvgIcon name="calendar" className="w-8 h-8 text-slate-400" />
        </div>
        <h3 class="text-base font-bold text-slate-700 dark:text-slate-200">Tidak ada event yang ditemukan</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">Coba gunakan kata kunci pencarian lain atau pilih kategori "Semua".</p>
        <button 
          @click="eventsStore.activeCategory = 'Semua'; eventsStore.searchQuery = '';"
          class="px-4 py-2 rounded-xl bg-navy dark:bg-sky text-white text-xs font-bold hover:brightness-110"
        >
          Lihat Semua Event
        </button>
      </div>

      <!-- Responsive Grid: 1 col on mobile, 2 on tablet, 3 on laptop, 4 on desktop -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div 
          v-for="(event, idx) in eventsStore.filteredEvents" 
          :key="event.id"
          @click="handleEventClick(event)"
          class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer relative"
          :class="{
            'opacity-85': event.status === 'sold-out',
            'opacity-85 grayscale-[30%]': event.status === 'ended'
          }"
        >
          <!-- Card Image / Header Gradient -->
          <div class="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
            <!-- If image exists use it, else sleek gradient -->
            <div 
              v-if="event.image" 
              class="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
              :style="{ backgroundImage: `url('${event.image}')` }"
            ></div>
            <div 
              v-else 
              class="w-full h-full bg-gradient-to-br flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
              :class="eventsStore.eventGradient(idx)"
            >
              <div class="text-center p-4">
                <SvgIcon name="ticket" className="w-10 h-10 text-white/50 mx-auto mb-1" />
                <span class="block text-white/90 text-xs font-bold uppercase tracking-wider">{{ event.category }}</span>
              </div>
            </div>

            <!-- Visual Overlay Stamp for Sold-Out and Ended -->
            <div 
              v-if="event.status === 'sold-out'" 
              class="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px] flex items-center justify-center pointer-events-none"
            >
              <span class="px-3.5 py-1.5 rounded-full bg-rose-600/95 text-white text-xs font-black uppercase tracking-widest shadow-xl border border-white/30 backdrop-blur-md">
                Tiket Habis
              </span>
            </div>

            <div 
              v-else-if="event.status === 'ended'" 
              class="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
            >
              <div class="text-center space-y-1">
                <span class="px-3.5 py-1.5 rounded-full bg-slate-800/95 text-slate-200 text-xs font-bold uppercase tracking-wider shadow-lg border border-slate-600 inline-block">
                  Acara Selesai
                </span>
                <span class="inline-flex items-center justify-center gap-1 text-[11px] text-amber-300 font-semibold">
                  <SvgIcon name="star" className="w-3 h-3 text-amber-400" />
                  <span>Klik untuk lihat ulasan</span>
                </span>
              </div>
            </div>

            <!-- Badges Overlay (Top Bar: Status on Left, Category + Wishlist on Right) -->
            <div class="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span 
                class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide backdrop-blur-md shadow-sm inline-flex items-center gap-1"
                :class="{
                  'bg-rose-600 text-white': event.status === 'sold-out',
                  'bg-slate-700 text-slate-200': event.status === 'ended',
                  'bg-amber text-white': event.status === 'coming-soon',
                  'bg-coral text-white': event.status === 'on-sale' && event.hot,
                  'bg-mint text-white': event.status === 'on-sale' && !event.hot,
                }"
              >
                <SvgIcon v-if="event.status === 'on-sale' && event.hot" name="fire" className="w-3 h-3 text-white" />
                <span>{{ event.status === 'sold-out' ? 'Tiket Habis' : (event.status === 'ended' ? 'Selesai' : (event.status === 'coming-soon' ? 'Segera' : (event.hot ? 'Populer' : 'Tersedia'))) }}</span>
              </span>

              <div class="flex items-center gap-1.5 pointer-events-auto">
                <span 
                  class="px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-sm"
                  :class="eventsStore.categoryColor(event.category).bg + ' ' + eventsStore.categoryColor(event.category).text"
                >
                  {{ event.category }}
                </span>

                <!-- Wishlist Heart Button -->
                <button
                  type="button"
                  @click="toggleWishlist($event, event)"
                  class="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                  :title="wishlistStore.isWishlisted(event.id) ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'"
                >
                  <SvgIcon 
                    name="heart" 
                    className="w-3.5 h-3.5 transition-colors"
                    :class="wishlistStore.isWishlisted(event.id) ? 'text-coral fill-coral' : 'text-white'" 
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Card Body -->
          <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
            
            <div class="space-y-2">
              <!-- Date & Time & Rating if any -->
              <div class="flex items-center justify-between text-xs font-semibold">
                <div class="flex items-center gap-1.5 text-coral">
                  <SvgIcon name="calendar" className="w-3.5 h-3.5 text-coral shrink-0" />
                  <span>{{ event.date }} · {{ event.time }}</span>
                </div>
                
                <!-- Rating pill if reviews exist -->
                <div 
                  v-if="reviewStore.getAverageRating(event.id)"
                  class="flex items-center gap-1 text-[11px] font-bold text-amber px-1.5 py-0.5 rounded-md bg-amber/10"
                >
                  <SvgIcon name="star" className="w-3 h-3 text-amber" />
                  <span>{{ reviewStore.getAverageRating(event.id) }}</span>
                </div>
              </div>

              <!-- Title -->
              <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-navy dark:group-hover:text-sky transition-colors">
                {{ event.title }}
              </h3>

              <!-- Venue -->
              <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                <SvgIcon name="location" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{{ event.venue }}, {{ event.city }}</span>
              </div>
            </div>

            <!-- Card Bottom Divider & Price -->
            <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block">Harga Mulai</span>
                <span class="text-sm sm:text-base font-extrabold text-navy dark:text-sky font-mono">
                  {{ eventsStore.formatPrice(event.priceFrom, event.currency) }}
                </span>
              </div>

              <button 
                :disabled="event.status === 'sold-out' || event.status === 'coming-soon'"
                class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                :class="{
                  'bg-navy dark:bg-sky text-white hover:brightness-110 shadow-soft': event.status === 'on-sale',
                  'bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-900 cursor-not-allowed': event.status === 'sold-out',
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700': event.status === 'ended',
                  'bg-amber-light dark:bg-amber/10 text-amber border border-amber/30 cursor-not-allowed': event.status === 'coming-soon',
                }"
              >
                <span>
                  {{ event.status === 'sold-out' ? 'Tiket Habis' : (event.status === 'ended' ? 'Lihat Ulasan' : (event.status === 'coming-soon' ? 'Segera Hadir' : 'Beli Tiket')) }}
                </span>
                <SvgIcon v-if="event.status === 'on-sale'" name="arrow-right" className="w-3.5 h-3.5" />
                <SvgIcon v-else-if="event.status === 'ended'" name="star" className="w-3.5 h-3.5 text-amber" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trust Badges Info Section -->
    <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 shadow-card transition-colors">
      <div class="text-center max-w-xl mx-auto mb-6">
        <h3 class="text-lg sm:text-xl font-bold text-navy dark:text-sky">Keamanan &amp; Kemudahan Pembelian Tiket</h3>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">Sistem transaksi terproteksi dengan enkripsi resmi dan jaminan keaslian tiket 100%.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
            <SvgIcon name="bolt" className="w-5 h-5 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">Virtual Waiting Room</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Antrean acak fair play saat pintu tiket dibuka.</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-sky-light dark:bg-sky/20 text-sky flex items-center justify-center shrink-0">
            <SvgIcon name="clock" className="w-5 h-5 text-sky" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">10-Min Temporary Lock</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Kursi aman selama proses isi biodata &amp; bayar.</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-coral-light dark:bg-coral/20 text-coral flex items-center justify-center shrink-0">
            <SvgIcon name="bot" className="w-5 h-5 text-coral" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">Anti-Bot &amp; Anti-Scalper</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Maksimal 2 tiket/akun untuk mencegah calo.</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-mint-light dark:bg-mint/20 text-mint flex items-center justify-center shrink-0">
            <SvgIcon name="qr" className="w-5 h-5 text-mint" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">E-Tiket Real QR Code</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">QR Code dinamis asli bisa dipindai kamera HP.</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
