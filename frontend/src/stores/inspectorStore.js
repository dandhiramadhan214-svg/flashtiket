import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useInspectorStore = defineStore('inspector', () => {
  const isDrawerOpen = ref(false);
  const logs = ref([]);
  const nodes = ref({
    gateway: true,
    redis: true,
    worker: true,
    postgres: true,
  });

  function toggleDrawer() {
    isDrawerOpen.value = !isDrawerOpen.value;
  }

  function appendLog(tag, message) {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    logs.value.push({
      id: Math.random().toString(36).substring(2, 9),
      time: timeStr,
      tag: tag.toUpperCase(),
      message,
    });

    // Keep max 150 logs in buffer
    if (logs.value.length > 150) {
      logs.value.shift();
    }
  }

  function clearLogs() {
    logs.value = [];
  }

  function toggleWorkerHealth() {
    nodes.value.worker = !nodes.value.worker;
    if (!nodes.value.worker) {
      appendLog('ERROR', '[FAULT TOLERANCE TEST] Background Worker daemon SIMULATED FAILURE!');
      appendLog('GATEWAY', 'API Gateway & Redis Cluster remain 100% OPERATIONAL. Users still queued safely.');
    } else {
      appendLog('WORKER', '[WORKER RECOVERED] Background Worker daemon RESTARTED & healthy.');
    }
  }

  return {
    isDrawerOpen,
    logs,
    nodes,
    toggleDrawer,
    appendLog,
    clearLogs,
    toggleWorkerHealth,
  };
});
