import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useWishlistStore = defineStore('wishlist', () => {
  // Load from localStorage
  const stored = localStorage.getItem('flashtiket_wishlist');
  const wishlistIds = ref(stored ? JSON.parse(stored) : []);

  function toggle(eventId) {
    const idx = wishlistIds.value.indexOf(eventId);
    if (idx >= 0) {
      wishlistIds.value.splice(idx, 1);
    } else {
      wishlistIds.value.push(eventId);
    }
    localStorage.setItem('flashtiket_wishlist', JSON.stringify(wishlistIds.value));
  }

  function isWishlisted(eventId) {
    return wishlistIds.value.includes(eventId);
  }

  const count = computed(() => wishlistIds.value.length);

  function clear() {
    wishlistIds.value = [];
    localStorage.removeItem('flashtiket_wishlist');
  }

  return {
    wishlistIds,
    toggle,
    isWishlisted,
    count,
    clear,
  };
});
