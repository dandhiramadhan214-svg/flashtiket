import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  // Modes: 'system' | 'light' | 'dark'
  const savedMode = localStorage.getItem('flashtiket_theme_mode') || 'system';
  const mode = ref(savedMode);

  // Detect system preference
  const systemPrefersDark = ref(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  // Compute effective dark state
  const isDark = computed(() => {
    if (mode.value === 'dark') return true;
    if (mode.value === 'light') return false;
    return systemPrefersDark.value; // 'system' (netral)
  });

  // Apply class to <html>
  function applyTheme() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDark.value) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  // Set specific mode
  function setMode(newMode) {
    mode.value = newMode;
    localStorage.setItem('flashtiket_theme_mode', newMode);
    applyTheme();
  }

  // Cycle: system -> dark -> light -> system
  function cycleMode() {
    if (mode.value === 'system') {
      setMode('dark');
    } else if (mode.value === 'dark') {
      setMode('light');
    } else {
      setMode('system');
    }
  }

  // Listen to system OS preference changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches;
      if (mode.value === 'system') {
        applyTheme();
      }
    });
  }

  // Initial apply
  applyTheme();

  return {
    mode,
    isDark,
    setMode,
    cycleMode,
    applyTheme,
  };
});
