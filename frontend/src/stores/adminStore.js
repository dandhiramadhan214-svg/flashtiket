import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAdminStore = defineStore('admin', () => {
  const isAdminModalOpen = ref(false);
  const activeTab = ref('overview'); // 'overview' | 'events' | 'queue' | 'benchmark'

  // Live Metrics (simulated high-concurrency stream)
  const activeVisitors = ref(142850);
  const waitingRoomCount = ref(124850);
  const reservedTickets = ref(3840);
  const soldOutTickets = ref(2160);
  const serverThroughput = ref(1912); // Req/s
  const avgLatency = ref(24.5); // ms
  const redisLockCount = ref(3840);

  // Live traffic stream history for charts
  const trafficHistory = ref([
    { time: '10:00:00', rps: 340, queue: 15200 },
    { time: '10:00:01', rps: 1820, queue: 45000 },
    { time: '10:00:02', rps: 2450, queue: 98000 },
    { time: '10:00:03', rps: 2100, queue: 115000 },
    { time: '10:00:04', rps: 1912, queue: 124850 },
  ]);

  // System Nodes Health
  const nodes = ref({
    gateway: { name: 'Nginx API Gateway', status: 'healthy', latency: '1.2ms', rps: '1.9k' },
    redis: { name: 'Redis In-Memory Engine (v7)', status: 'healthy', memory: '142 MB', ops: '15.4k/s' },
    apiCluster: { name: 'Node.js Core API Cluster (4 Nodes)', status: 'healthy', cpu: '28%', heap: '86 MB' },
    database: { name: 'PostgreSQL Relational DB (v16)', status: 'healthy', pool: '24/100', tx: '120/s' },
    worker: { name: 'Background Rollback Worker (BullMQ)', status: 'healthy', jobs: '0 pending', activeTimers: '3.8k' },
  });

  function openAdmin() {
    isAdminModalOpen.value = true;
  }

  function closeAdmin() {
    isAdminModalOpen.value = false;
  }

  function simulateTrafficSpike() {
    activeVisitors.value += Math.floor(Math.random() * 5000) + 2000;
    waitingRoomCount.value += Math.floor(Math.random() * 3000) + 1500;
    serverThroughput.value = Math.floor(Math.random() * 800) + 1800;
    avgLatency.value = +(Math.random() * 15 + 20).toFixed(1);

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    trafficHistory.value.push({
      time: timeStr,
      rps: serverThroughput.value,
      queue: waitingRoomCount.value,
    });
    if (trafficHistory.value.length > 8) trafficHistory.value.shift();
  }

  return {
    isAdminModalOpen,
    activeTab,
    activeVisitors,
    waitingRoomCount,
    reservedTickets,
    soldOutTickets,
    serverThroughput,
    avgLatency,
    redisLockCount,
    trafficHistory,
    nodes,
    openAdmin,
    closeAdmin,
    simulateTrafficSpike,
  };
});
