import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotifStore = defineStore('notif', () => {
  const notifications = ref([]);
  let idCounter = 0;

  /**
   * Push a toast notification.
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {string} title
   * @param {string} message
   * @param {number} duration - auto dismiss in ms (0 = manual close)
   */
  function push(type, title, message, duration = 4000) {
    const id = ++idCounter;
    notifications.value.push({ id, type, title, message, timestamp: Date.now() });

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }

    // Keep max 6 notifications visible
    if (notifications.value.length > 6) {
      notifications.value.shift();
    }
  }

  function dismiss(id) {
    const idx = notifications.value.findIndex(n => n.id === id);
    if (idx >= 0) notifications.value.splice(idx, 1);
  }

  function clearAll() {
    notifications.value = [];
  }

  return {
    notifications,
    push,
    dismiss,
    clearAll,
  };
});
