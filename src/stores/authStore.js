import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // Check local storage for persistent login session
  const storedUser = localStorage.getItem('flashtiket_user');
  const currentUser = ref(
    storedUser
      ? JSON.parse(storedUser)
      : {
          id: 'USR-8921',
          name: 'Kevin Pratama',
          email: 'kevin.pratama@gmail.com',
          phone: '+62 812-3456-7890',
          nik: '31710482910002',
          avatarText: 'KP',
          role: 'user',
          isLoggedIn: false, // Start as logged out or guest unless user logs in
          myTickets: [],
        }
  );

  const isAuthModalOpen = ref(false);
  const authModalTab = ref('login'); // 'login' | 'register'
  const isMyTicketsOpen = ref(false);

  const isLoggedIn = computed(() => currentUser.value.isLoggedIn);
  const isAdmin = computed(() => currentUser.value.isLoggedIn && currentUser.value.role === 'admin');

  function openLogin() {
    authModalTab.value = 'login';
    isAuthModalOpen.value = true;
  }

  function openRegister() {
    authModalTab.value = 'register';
    isAuthModalOpen.value = true;
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false;
  }

  function login(email, password) {
    const isLoginAsAdmin = email && email.toLowerCase() === 'admin@flashtiket.com';

    if (isLoginAsAdmin) {
      currentUser.value = {
        id: 'ADM-001',
        name: 'Super Administrator',
        email: email || 'admin@flashtiket.com',
        phone: '+62 811-9988-7766',
        nik: '3171000000000001',
        avatarText: 'AD',
        role: 'admin',
        isLoggedIn: true,
        myTickets: currentUser.value.myTickets || [],
      };
      localStorage.setItem('flashtiket_user', JSON.stringify(currentUser.value));
      closeAuthModal();
      return { success: true, role: 'admin' };
    }

    currentUser.value = {
      id: currentUser.value.id || 'USR-8921',
      name: currentUser.value.name || 'Kevin Pratama',
      email: (email && email.includes('@')) ? email : 'kevin.pratama@gmail.com',
      phone: currentUser.value.phone || '+62 812-3456-7890',
      nik: currentUser.value.nik || '31710482910002',
      avatarText: currentUser.value.avatarText || 'KP',
      role: 'user',
      isLoggedIn: true,
      myTickets: currentUser.value.myTickets || [],
    };
    localStorage.setItem('flashtiket_user', JSON.stringify(currentUser.value));
    closeAuthModal();
    return { success: true, role: 'user' };
  }

  function register({ name, email, phone, nik, password }) {
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'KP';

    currentUser.value = {
      id: 'USR-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      name,
      email,
      phone,
      nik,
      avatarText: initials,
      role: 'user',
      isLoggedIn: true,
      myTickets: currentUser.value.myTickets || [],
    };

    localStorage.setItem('flashtiket_user', JSON.stringify(currentUser.value));
    closeAuthModal();
    return true;
  }

  function logout() {
    currentUser.value = {
      id: 'USR-8921',
      name: 'Kevin Pratama',
      email: 'kevin.pratama@gmail.com',
      phone: '+62 812-3456-7890',
      nik: '31710482910002',
      avatarText: 'KP',
      role: 'user',
      isLoggedIn: false,
      myTickets: [],
    };
    localStorage.removeItem('flashtiket_user');
  }

  function addPurchasedTicket(ticket) {
    if (!currentUser.value.myTickets) {
      currentUser.value.myTickets = [];
    }
    currentUser.value.myTickets.unshift(ticket);
    localStorage.setItem('flashtiket_user', JSON.stringify(currentUser.value));
  }

  return {
    currentUser,
    isLoggedIn,
    isAdmin,
    isAuthModalOpen,
    authModalTab,
    isMyTicketsOpen,
    openLogin,
    openRegister,
    closeAuthModal,
    login,
    register,
    logout,
    addPurchasedTicket,
  };
});
