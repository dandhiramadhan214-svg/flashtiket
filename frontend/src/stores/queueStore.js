import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useInspectorStore } from './inspectorStore';

export const useQueueStore = defineStore('queue', () => {
  const inspector = useInspectorStore();

  const currentStage = ref('home'); // 'home' | 'lobby' | 'queue' | 'selection' | 'checkout' | 'ticket'
  const isGuideModalOpen = ref(false);
  const queueNumber = ref(1420);
  const initialQueueNumber = ref(1420);
  const totalWaiting = ref(124850);
  let queueIntervalId = null;

  const progressPct = computed(() => {
    if (initialQueueNumber.value <= 0) return 100;
    const current = Math.max(0, queueNumber.value);
    const pct = Math.round(((initialQueueNumber.value - current) / initialQueueNumber.value) * 100);
    return Math.min(100, Math.max(5, pct));
  });

  const etaFormatted = computed(() => {
    const current = Math.max(0, queueNumber.value);
    const secs = Math.ceil(current / 120); // approx 120 users/sec throughput
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}s`;
  });

  function setStage(stage) {
    if (stage !== 'queue' && queueIntervalId) {
      clearInterval(queueIntervalId);
      queueIntervalId = null;
    }
    currentStage.value = stage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    inspector.appendLog('GATEWAY', `Stage transition -> ${stage.toUpperCase()}`);
  }

  function startQueue() {
    setStage('queue');

    const randomQueue = Math.floor(Math.random() * 500) + 1200;
    queueNumber.value = randomQueue;
    initialQueueNumber.value = randomQueue;

    inspector.appendLog('GATEWAY', `Client IP 182.1.20.4 passed rate-limit (Token Bucket: 1/5 req)`);
    inspector.appendLog('REDIS', `ZADD waiting_room:queue ${Date.now()} "user_${Math.random().toString(36).substring(7)}"`);
    inspector.appendLog('REDIS', `ZRANK waiting_room:queue -> Your queue position is #${queueNumber.value}`);

    if (queueIntervalId) clearInterval(queueIntervalId);

    queueIntervalId = setInterval(() => {
      if (currentStage.value !== 'queue') {
        clearInterval(queueIntervalId);
        queueIntervalId = null;
        return;
      }

      const step = Math.floor(Math.random() * 50) + 70;
      queueNumber.value -= step;

      if (queueNumber.value <= 0) {
        queueNumber.value = 0;
        clearInterval(queueIntervalId);
        queueIntervalId = null;

        inspector.appendLog('REDIS', `ZPOPMIN waiting_room:queue -> User turn reached! Generated secure booking token.`);
        inspector.appendLog('GATEWAY', `Access granted to /api/tickets/selection (Session TTL: 15m)`);

        setTimeout(() => {
          if (currentStage.value === 'queue') {
            setStage('selection');
          }
        }, 800);
      }
    }, 450);
  }

  function skipQueue() {
    if (queueIntervalId) clearInterval(queueIntervalId);
    queueNumber.value = 0;
    inspector.appendLog('GATEWAY', '[TEST SPEEDUP] Waiting room queue bypassed.');
    setStage('selection');
  }

  function simulateTrafficSpike() {
    totalWaiting.value += 10000;
    inspector.appendLog('GATEWAY', `[TRAFFIC SURGE DETECTED] Incoming burst of 10,000 users!`);
    inspector.appendLog('REDIS', `Virtual Waiting Room absorbing load. Redis memory healthy.`);
    alert('Simulasi Lonjakan Trafik: 10.000 pengantre tambahan masuk antrean. Sistem antrean menahan lonjakan dengan aman.');
  }

  function resetQueue() {
    if (queueIntervalId) clearInterval(queueIntervalId);
    queueNumber.value = 1420;
    initialQueueNumber.value = 1420;
    setStage('lobby');
  }

  return {
    currentStage,
    isGuideModalOpen,
    queueNumber,
    initialQueueNumber,
    totalWaiting,
    progressPct,
    etaFormatted,
    setStage,
    startQueue,
    skipQueue,
    simulateTrafficSpike,
    resetQueue,
  };
});
