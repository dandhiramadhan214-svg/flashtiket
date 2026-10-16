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

const wishlistedEvents = computed(() => {
  return eventsStore.events.filter(e => wishlistStore.isWishlisted(e.id));
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
  notifStore.push('info', 'Wishlist', `"${event.title}" dihapus dari favorit.`);
}

function clearAllWishlist() {
  if (wishlistedEvents.value.length === 0) return;
  const count = wishlistedEvents.value.length;
  wishlistStore.clear();
  notifStore.push('info', 'Wishlist', `${count} event dihapus dari wishlist.`);
}

function goHome() {
  queueStore.setStage('home');
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-8 font-mono">

    <!-- Header bar -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-black pb-4">
      <div>
        <button 
          @click="goHome"
          class="font-mono text-xs uppercase text-[#525252] hover:text-black mb-2 flex items-center gap-1 cursor-pointer"
        >
          <span>← Kembali ke Katalog</span>
        </button>
        <h1 class="text-3xl sm:text-4xl font-serif font-black text-black">
          Daftar Acara Favorit
        </h1>
        <p class="font-body text-xs text-[#525252]">
          Koleksi acara pilihan yang Anda simpan untuk reservasi mendatang.
        </p>
      </div>

      <div v-if="wishlistedEvents.length > 0">
        <button 
          @click="clearAllWishlist"
          class="font-mono text-xs uppercase underline text-[#525252] hover:text-black cursor-pointer"
        >
          [Kosongkan Semua]
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="wishlistedEvents.length === 0" class="border-2 border-black p-12 text-center space-y-4 bg-white">
      <div class="font-serif font-bold text-xl text-black">Belum Ada Acara di Favorit</div>
      <p class="font-body text-xs text-[#525252] max-w-sm mx-auto">
        Jelajahi konser atau festival di katalog utama dan klik tanda bintang/favorit untuk menyimpannya di sini.
      </p>
      <button 
        @click="goHome"
        class="btn-mono-primary text-xs"
      >
        <span>Jelajahi Katalog Acara →</span>
      </button>
    </div>

    <!-- Grid of Wishlisted Events -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="event in wishlistedEvents" 
        :key="event.id"
        @click="handleEventClick(event)"
        class="border-2 border-black bg-white flex flex-col justify-between group cursor-pointer transition-all duration-100 hover:border-4 relative"
      >
        <div class="h-48 border-b-2 border-black overflow-hidden relative bg-black">
          <div 
            class="w-full h-full bg-cover bg-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
            :style="{ backgroundImage: event.image ? `url('${event.image}')` : 'none' }"
          ></div>

          <div class="absolute top-3 left-3 text-[10px] uppercase tracking-widest bg-black text-white px-2 py-0.5 border border-white">
            {{ event.category }}
          </div>

          <button
            type="button"
            @click="removeFromWishlist($event, event)"
            class="absolute top-3 right-3 w-7 h-7 bg-white text-black border border-black flex items-center justify-center font-mono text-xs hover:bg-black hover:text-white transition-colors"
            title="Hapus dari Favorit"
          >
            ✕
          </button>
        </div>

        <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
          <div class="space-y-1">
            <h3 class="text-lg font-serif font-bold text-black tracking-tight leading-snug group-hover:underline">
              {{ event.title }}
            </h3>
            <div class="text-[11px] text-[#525252]">{{ event.date }} · {{ event.venue }}</div>
          </div>

          <div class="pt-3 border-t border-black flex items-center justify-between text-xs">
            <div>
              <span class="text-[10px] text-[#525252] block">Mulai Dari</span>
              <span class="font-bold text-black">{{ eventsStore.formatPrice(event.priceFrom, event.currency) }}</span>
            </div>
            <span class="px-3 py-1.5 bg-black text-white text-[10px] uppercase font-bold group-hover:bg-white group-hover:text-black border border-black transition-colors">
              Pesan →
            </span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
