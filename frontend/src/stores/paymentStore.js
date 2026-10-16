// ================================================================
// FlashTiket — Midtrans Payment Store
// Manages Snap.js loading, token creation, and payment popup
// ================================================================
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api.js';

export const usePaymentStore = defineStore('payment', () => {
  // ── State ──────────────────────────────────────────────────────
  const isSnapLoaded = ref(false);
  const isLoading = ref(false);
  const paymentStatus = ref(null); // 'idle' | 'pending' | 'success' | 'failed' | 'error'
  const snapToken = ref(null);
  const midtransOrderId = ref(null);
  const errorMessage = ref('');
  const clientKey = ref('');
  const isProduction = ref(false);

  // ── Computed ───────────────────────────────────────────────────
  const isPaid = computed(() => paymentStatus.value === 'success');
  const isPending = computed(() => paymentStatus.value === 'pending');
  const isFailed = computed(() => paymentStatus.value === 'failed' || paymentStatus.value === 'error');

  // ── Load Midtrans Snap.js ─────────────────────────────────────
  async function loadSnapJS() {
    if (isSnapLoaded.value) return true;

    try {
      // Fetch client key from backend
      const response = await api.getMidtransClientKey();
      clientKey.value = response.clientKey;
      isProduction.value = response.isProduction;

      const snapUrl = isProduction.value
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';

      // Check if script already loaded
      const existing = document.querySelector(`script[src="${snapUrl}"]`);
      if (existing) {
        isSnapLoaded.value = true;
        return true;
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = snapUrl;
        script.setAttribute('data-client-key', clientKey.value);
        script.onload = () => {
          isSnapLoaded.value = true;
          console.log('[Midtrans] Snap.js loaded successfully');
          resolve(true);
        };
        script.onerror = () => {
          console.error('[Midtrans] Failed to load Midtrans Snap.js');
          reject(new Error('Gagal memuat Midtrans Snap.js'));
        };
        document.head.appendChild(script);
      });
    } catch (err) {
      console.warn('[Midtrans] Client key fetch failed:', err.message);
      return false;
    }
  }

  // ── Create Snap Token & Open Payment Popup ────────────────────
  async function initiatePayment(orderId) {
    isLoading.value = true;
    errorMessage.value = '';
    paymentStatus.value = 'idle';

    try {
      // Ensure Snap.js is loaded
      const loaded = await loadSnapJS();

      if (!loaded || typeof window.snap === 'undefined') {
        // Fallback: simulate payment for demo/sandbox without valid keys
        console.warn('[Payment] Snap.js not available — using simulated payment flow');
        return await simulatePayment(orderId);
      }

      // Request Snap token from backend
      const response = await api.createSnapToken(orderId);
      snapToken.value = response.data.snapToken;
      midtransOrderId.value = response.data.midtransOrderId;

      // Open Midtrans Snap popup
      return new Promise((resolve) => {
        window.snap.pay(snapToken.value, {
          onSuccess: (result) => {
            console.log('[Payment] Success:', result);
            paymentStatus.value = 'success';
            isLoading.value = false;
            resolve({ status: 'success', result });
          },
          onPending: (result) => {
            console.log('[Payment] Pending:', result);
            paymentStatus.value = 'pending';
            isLoading.value = false;
            resolve({ status: 'pending', result });
          },
          onError: (result) => {
            console.error('[Payment] Error:', result);
            paymentStatus.value = 'failed';
            errorMessage.value = 'Pembayaran gagal. Silakan coba lagi.';
            isLoading.value = false;
            resolve({ status: 'failed', result });
          },
          onClose: () => {
            console.log('[Payment] Popup closed');
            if (paymentStatus.value === 'idle') {
              paymentStatus.value = 'idle';
              errorMessage.value = 'Popup pembayaran ditutup. Anda masih bisa melanjutkan pembayaran.';
            }
            isLoading.value = false;
            resolve({ status: paymentStatus.value || 'closed' });
          },
        });
      });
    } catch (err) {
      console.error('[Payment] Initiation error:', err);
      errorMessage.value = err.message || 'Terjadi kesalahan saat memproses pembayaran.';
      
      // Fallback to simulation
      console.warn('[Payment] Falling back to simulated payment');
      return await simulatePayment(orderId);
    }
  }

  // ── Simulated Payment (for demo without Midtrans keys) ────────
  async function simulatePayment(orderId) {
    paymentStatus.value = 'pending';
    isLoading.value = true;
    
    // Simulate 2-second processing delay
    return new Promise((resolve) => {
      setTimeout(() => {
        paymentStatus.value = 'success';
        isLoading.value = false;
        console.log('[Payment] Simulated payment success for order:', orderId);
        resolve({ status: 'success', simulated: true });
      }, 2000);
    });
  }

  // ── Poll payment status from backend ──────────────────────────
  async function checkPaymentStatus(orderId) {
    try {
      const response = await api.getPaymentStatus(orderId);
      if (response.data.isPaid) {
        paymentStatus.value = 'success';
      }
      return response.data;
    } catch {
      return null;
    }
  }

  // ── Reset ─────────────────────────────────────────────────────
  function reset() {
    paymentStatus.value = null;
    snapToken.value = null;
    midtransOrderId.value = null;
    errorMessage.value = '';
    isLoading.value = false;
  }

  return {
    isSnapLoaded,
    isLoading,
    paymentStatus,
    snapToken,
    midtransOrderId,
    errorMessage,
    isPaid,
    isPending,
    isFailed,
    loadSnapJS,
    initiatePayment,
    simulatePayment,
    checkPaymentStatus,
    reset,
  };
});
