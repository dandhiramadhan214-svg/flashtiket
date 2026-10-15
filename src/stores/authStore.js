import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../services/supabaseClient';

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
  const isProfileModalOpen = ref(false);

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

  function openProfileModal() {
    isProfileModalOpen.value = true;
  }

  function closeProfileModal() {
    isProfileModalOpen.value = false;
  }

  async function login(email, password) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const isLoginAsAdmin = cleanEmail === 'admin@flashtiket.com';

    if (isLoginAsAdmin) {
      currentUser.value = {
        id: 'ADM-001',
        name: 'Super Administrator',
        email: cleanEmail,
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

    // 1. Check Supabase Cloud database first (cross-device login capability!)
    try {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbUser && !error) {
        // Validate password if user has a password in DB
        if (dbUser.password && password && dbUser.password !== password) {
          return { success: false, error: 'Kata sandi salah. Silakan coba lagi.' };
        }

        // Pull tickets belonging to this email from cloud
        let cloudTickets = [];
        try {
          const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .eq('customer_email', cleanEmail);

          if (orders && orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            const { data: tix } = await supabase
              .from('tickets')
              .select('*')
              .in('order_id', orderIds);

            if (tix && tix.length > 0) {
              cloudTickets = tix.map(t => ({
                ticketId: t.id,
                orderId: t.order_id,
                holderName: t.holder_name,
                nik: t.holder_nik,
                seatName: t.seat_number,
                categoryName: (t.category_id || 'VIP').toUpperCase(),
                qrHash: t.qr_code,
                status: t.status || 'ACTIVE',
                createdAt: t.created_at,
              }));
            }
          }
        } catch (ticketErr) {
          console.warn('Sync cloud tickets note:', ticketErr.message);
        }

        const initials = (dbUser.name || 'User')
          .split(' ')
          .slice(0, 2)
          .map(n => n[0])
          .join('')
          .toUpperCase() || 'KP';

        currentUser.value = {
          id: dbUser.id || 'USR-8921',
          name: dbUser.name || 'Pengguna FlashTiket',
          email: dbUser.email,
          phone: dbUser.phone || '',
          nik: dbUser.nik || '',
          avatarText: initials,
          role: dbUser.role || 'user',
          isLoggedIn: true,
          myTickets: cloudTickets.length > 0 ? cloudTickets : (currentUser.value.myTickets || []),
        };

        localStorage.setItem('flashtiket_user', JSON.stringify(currentUser.value));
        closeAuthModal();
        return { success: true, role: 'user', fromCloud: true };
      }
    } catch (e) {
      console.warn('Supabase login check note:', e.message);
    }

    // 2. Fallback to local session if database table is not yet created or offline
    currentUser.value = {
      id: currentUser.value.id || 'USR-8921',
      name: currentUser.value.name || 'Kevin Pratama',
      email: cleanEmail.includes('@') ? cleanEmail : 'kevin.pratama@gmail.com',
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

  async function register({ name, email, phone, nik, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'KP';

    const userId = 'USR-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    // 1. Try to sync to Supabase Cloud users table
    try {
      // Check if email already registered
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: 'Email ini sudah terdaftar di FlashTiket. Silakan masuk (login).' };
      }

      const { error: insErr } = await supabase.from('users').insert({
        id: userId,
        name,
        email: cleanEmail,
        phone,
        nik,
        password,
        role: 'user',
      });

      if (insErr) {
        console.warn('Supabase users insert note:', insErr.message);
      } else {
        console.log('✓ Akun berhasil disimpan ke Supabase Cloud PostgreSQL!');
      }
    } catch (e) {
      console.warn('Supabase offline or table missing:', e.message);
    }

    // 2. Set current user state & store in localStorage
    currentUser.value = {
      id: userId,
      name,
      email: cleanEmail,
      phone,
      nik,
      avatarText: initials,
      role: 'user',
      isLoggedIn: true,
      myTickets: [],
    };

    localStorage.setItem('flashtiket_user', JSON.stringify(currentUser.value));
    closeAuthModal();
    return { success: true };
  }

  async function updateProfile({ name, phone, nik }) {
    if (name) currentUser.value.name = name;
    if (phone) currentUser.value.phone = phone;
    if (nik) currentUser.value.nik = nik;

    const initials = (currentUser.value.name || '')
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'KP';
    currentUser.value.avatarText = initials;

    localStorage.setItem('flashtiket_user', JSON.stringify(currentUser.value));

    // Sync to Supabase
    try {
      if (currentUser.value.email) {
        await supabase
          .from('users')
          .update({
            name: currentUser.value.name,
            phone: currentUser.value.phone,
            nik: currentUser.value.nik,
          })
          .eq('email', currentUser.value.email);
      }
    } catch (e) {
      console.warn('Update profile cloud sync note:', e.message);
    }

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
    isProfileModalOpen,
    openLogin,
    openRegister,
    closeAuthModal,
    openProfileModal,
    closeProfileModal,
    login,
    register,
    updateProfile,
    logout,
    addPurchasedTicket,
  };
});
