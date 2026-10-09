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

// Get full event objects for wishlisted IDs
const wishlistedEvents = computed(() => {
  return eventsStore.events.filter(e => wishlistStore.isWishlisted(e.id));
});

const totalSavedValue = computed(() => {
  return wishlistedEvents.value.reduce((sum, e) => {
    if (e.currency === 'IDR') return sum + e.priceFrom;
    // Convert SGD to IDR roughly for display
    return sum + (e.priceFrom * 11500);
  }, 0);
});

function handleEventClick(event) {
  if (event.status === 'ended') {
    reviewStore.openReviewModal(event);
    return;
  }
  if (event.status === 'sold-out') {
    notifStore.push('error', 'Tiket Habis', `Seluruh kuota tiket "${event.title}" telah habis terjual.`);
    return;
  }
  if (event.status === 'coming-soon') {
    notifStore.push('info', 'Segera Dibuka', `Tiket "${event.title}" akan segera dibuka!`);
    return;
  }
  eventsStore.selectEvent(event.id);
  ticketStore.resetAll();
  queueStore.setStage('lobby');
}

function removeFromWishlist(e, event) {
  e.stopPropagation();
  wishlistStore.toggle(event.id);
  notifStore.push('info', 'Dihapus dari Wishlist', `"${event.title}" dihapus dari favorit.`);
}

function clearAllWishlist() {
  if (wishlistedEvents.value.length === 0) return;
  const count = wishlistedEvents.value.length;
  wishlistStore.clear();
  notifStore.push('info', 'Wishlist Dikosongkan', `${count} event dihapus dari wishlist.`);
}

function goHome() {
  queueStore.setStage('home');
}

function getStatusConfig(status) {
  const map = {
    'on-sale': { label: 'On Sale', bg: 'bg-mint/10', text: 'text-mint', dot: 'bg-mint', ringColor: 'ring-mint/30' },
    'sold-out': { label: 'Sold Out', bg: 'bg-coral/10', text: 'text-coral', dot: 'bg-coral', ringColor: 'ring-coral/30' },
    'coming-soon': { label: 'Coming Soon', bg: 'bg-amber/10', text: 'text-amber', dot: 'bg-amber', ringColor: 'ring-amber/30' },
    'ended': { label: 'Selesai', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500', dot: 'bg-slate-400', ringColor: 'ring-slate-300' },
  };
  return map[status] || map['on-sale'];
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">

    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <button 
            @click="goHome"
            class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors"
          >
            <SvgIcon name="arrow-left" className="w-4 h-4" />
          </button>
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-coral to-pink-600 flex items-center justify-center shadow-lg">
            <SvgIcon name="heart" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Wishlist Saya
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Event yang Anda simpan untuk nanti
            </p>
          </div>
        </div>
      </div>

      <!-- Stats & Actions -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-4 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div class="text-center">
            <div class="text-lg font-extrabold text-navy dark:text-sky">{{ wishlistedEvents.length }}</div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Event</div>
          </div>
          <div class="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
          <div class="text-center">
            <div class="text-sm font-bold text-slate-700 dark:text-slate-200">
              {{ totalSavedValue > 0 ? 'Rp ' + totalSavedValue.toLocaleString('id-ID') : '-' }}
            </div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Est. Nilai</div>
          </div>
        </div>
        <button
          v-if="wishlistedEvents.length > 0"
          @click="clearAllWishlist"
          class="px-4 py-2.5 rounded-xl text-xs font-bold text-coral bg-coral/5 hover:bg-coral/10 border border-coral/20 transition-all flex items-center gap-1.5"
        >
          <SvgIcon name="cancel" className="w-3.5 h-3.5" />
          Hapus Semua
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div 
      v-if="wishlistedEvents.length === 0"
      class="flex flex-col items-center justify-center py-20 sm:py-28"
    >
      <div class="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-6 animate-pulse">
        <SvgIcon name="heart" className="w-10 h-10 text-slate-300 dark:text-slate-500" />
      </div>
      <h3 class="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Belum Ada Event Tersimpan</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 max-w-md text-center mb-6 flex items-center justify-center gap-1.5 flex-wrap">
        <span>Ketuk ikon</span>
        <SvgIcon name="heart" className="w-4 h-4 text-coral inline-block" />
        <span>pada kartu event di beranda untuk menyimpannya ke daftar ini.</span>
      </p>
      <button 
        @click="goHome"
        class="px-6 py-3 rounded-xl bg-navy dark:bg-sky text-white font-bold text-sm shadow-soft hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
      >
        <SvgIcon name="search" className="w-4 h-4" />
        Jelajah Event
      </button>
    </div>

    <!-- Wishlist Grid -->
    <div 
      v-else 
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      <div
        v-for="(event, idx) in wishlistedEvents"
        :key="event.id"
        @click="handleEventClick(event)"
        class="group relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
      >
        <!-- Card Image -->
        <div class="relative h-44 sm:h-48 overflow-hidden">
          <div 
            v-if="event.image"
            class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            :style="{ backgroundImage: `url('${event.image}')` }"
          ></div>
          <div 
            v-else 
            class="absolute inset-0 bg-gradient-to-br"
            :class="eventsStore.eventGradient(idx)"
          ></div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          <!-- Status Badge -->
          <div class="absolute top-3 left-3">
            <span 
              :class="[getStatusConfig(event.status).bg, getStatusConfig(event.status).text]"
              class="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-sm ring-1"
              :style="{ '--tw-ring-color': 'currentColor', '--tw-ring-opacity': '0.2' }"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="getStatusConfig(event.status).dot"></span>
              {{ getStatusConfig(event.status).label }}
            </span>
          </div>

          <!-- Remove Wishlist Button -->
          <button
            @click="removeFromWishlist($event, event)"
            class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-md flex items-center justify-center text-coral hover:bg-coral hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 group/heart"
            title="Hapus dari Wishlist"
          >
            <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          <!-- Category Badge (bottom-left) -->
          <div class="absolute bottom-3 left-3">
            <span 
              class="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold"
            >
              {{ event.category }}
            </span>
          </div>

          <!-- Hot Badge -->
          <div v-if="event.hot && event.status === 'on-sale'" class="absolute bottom-3 right-3">
            <span class="px-2 py-1 rounded-full bg-coral/90 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
              <SvgIcon name="fire" className="w-3 h-3" />
              HOT
            </span>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-4 sm:p-5 space-y-3">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-800 dark:text-white leading-snug group-hover:text-navy dark:group-hover:text-sky transition-colors line-clamp-2">
              {{ event.title }}
            </h3>
            <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {{ event.subtitle }}
            </p>
          </div>

          <!-- Event Details -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <SvgIcon name="calendar" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{{ event.date }} · {{ event.time }}</span>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <SvgIcon name="location" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span class="truncate">{{ event.venue }}, {{ event.city }}</span>
            </div>
          </div>

          <!-- Price & CTA -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Mulai dari</div>
              <div class="text-sm font-extrabold text-navy dark:text-sky">
                {{ eventsStore.formatPrice(event.priceFrom, event.currency) }}
              </div>
            </div>
            <div
              v-if="event.status === 'on-sale'"
              class="px-3.5 py-2 rounded-xl bg-navy dark:bg-sky text-white text-xs font-bold shadow-sm group-hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <SvgIcon name="bolt" className="w-3.5 h-3.5" />
              Beli Tiket
            </div>
            <div
              v-else-if="event.status === 'sold-out'"
              class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold"
            >
              Habis Terjual
            </div>
            <div
              v-else-if="event.status === 'coming-soon'"
              class="px-3.5 py-2 rounded-xl bg-amber/10 text-amber text-xs font-bold flex items-center gap-1.5"
            >
              <SvgIcon name="alarm" className="w-3.5 h-3.5" />
              Segera
            </div>
            <div
              v-else
              class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold"
            >
              Selesai
            </div>
          </div>
        </div>

        <!-- Shimmer hover effect -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </div>
    </div>

    <!-- Bottom CTA -->
    <div v-if="wishlistedEvents.length > 0" class="flex justify-center pt-4">
      <button 
        @click="goHome"
        class="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 border border-slate-200/80 dark:border-slate-700"
      >
        <SvgIcon name="search" className="w-4 h-4" />
        Tambah Event Lainnya
      </button>
    </div>

  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
