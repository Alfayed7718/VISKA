(function () {
  'use strict';

  const usersKey = 'viska-users';
  const activeUserKey = 'viska-active-user-id';
  const defaultUser = { xp: 0, coins: 0, avatar: 'batik', avatarBorder: 'nila', ownedAvatars: ['batik'], ownedBorders: ['nila'], unlockedLessons: [0], spinSkipCount: 0, spinShieldCount: 0 };
  const shopItems = {
    avatar_kris: { kind: 'avatar', value: 'kris', price: 35 }, avatar_wayang: { kind: 'avatar', value: 'wayang', price: 70 },
    border_emas: { kind: 'border', value: 'emas', price: 30 }, border_jade: { kind: 'border', value: 'jade', price: 55 },
    skip_item: { kind: 'spin', value: 'skip', price: 15 }, shield_item: { kind: 'spin', value: 'shield', price: 25 }
  };
  const demoUsers = [
    { id: 'demo-raja-jawa?', name: 'Raja Jawa?', xp: 5000, coins: 320, avatar: 'wayang', avatarBorder: 'emas' },
    { id: 'demo-agus-setyabudi', name: 'Agus Setyabudi', xp: 2500, coins: 275, avatar: 'kris', avatarBorder: 'jade' },
    { id: 'demo-agustinus', name: 'Agustinus', xp: 1040, coins: 210, avatar: 'batik', avatarBorder: 'emas' },
    { id: 'demo-raka-meilana', name: 'Raka Meilana', xp: 920, coins: 180, avatar: 'kris', avatarBorder: 'nila' },
    { id: 'demo-sucipto', name: 'Sucipto', xp: 745, coins: 155, avatar: 'wayang', avatarBorder: 'jade' },
    { id: 'demo-andre-wibowo', name: 'Andre Wibowo', xp: 540, coins: 125, avatar: 'batik', avatarBorder: 'nila' },
    { id: 'demo-sinta-kirana', name: 'Sinta Kirana', xp: 480, coins: 95, avatar: 'wayang', avatarBorder: 'nila' },
    { id: 'demo-aditya-pratama', name: 'Aditya Pratama', xp: 285, coins: 70, avatar: 'kris', avatarBorder: 'emas' },
    { id: 'demo-sativa-lativa', name: 'Sativa lativa', xp: 120, coins: 45, avatar: 'batik', avatarBorder: 'jade' }
  ];

  function rankFor(xp) { return xp >= 1001 ? { name: 'Raja Jawa', level: 3 } : xp >= 501 ? { name: 'Prajurit', level: 2 } : { name: 'Mangarah Tari', level: 1 }; }
  function readUsers() { try { const users = JSON.parse(localStorage.getItem(usersKey)); return Array.isArray(users) ? users : []; } catch { return []; } }
  function writeUsers(users) { localStorage.setItem(usersKey, JSON.stringify(users)); }
  function normalizeUser(user) { return { ...defaultUser, ...user, ownedAvatars: Array.isArray(user.ownedAvatars) ? user.ownedAvatars : ['batik'], ownedBorders: Array.isArray(user.ownedBorders) ? user.ownedBorders : ['nila'], unlockedLessons: Array.isArray(user.unlockedLessons) ? user.unlockedLessons : [0] }; }
  function seedDemoUsers() {
    const users = readUsers();
    // Selalu sinkronkan data demo dari daftar di atas agar perubahan nama/XP
    // langsung menggantikan demo lama yang sudah tersimpan di localStorage.
    const realUsers = users.filter(user => !user.isDemo);
    const seededUsers = demoUsers.map(demo => normalizeUser({
      ...demo,
      isDemo: true,
      ownedAvatars: ['batik', 'kris', 'wayang'],
      ownedBorders: ['nila', 'emas', 'jade']
    }));
    writeUsers([...realUsers, ...seededUsers]);
  }
  function getUser() { const id = localStorage.getItem(activeUserKey); const user = readUsers().find(item => item.id === id); return user ? normalizeUser(user) : null; }
  function saveUser(user) {
    if (!user || !user.id) return null;
    const users = readUsers(), index = users.findIndex(item => item.id === user.id), saved = normalizeUser(user);
    if (index === -1) users.push(saved); else users[index] = saved;
    writeUsers(users); return saved;
  }
  function register({ name = '', email = '', password = '' }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || password.length < 8) throw Error('Nama minimal 2 karakter, email valid, dan kata sandi minimal 8 karakter.');
    const users = readUsers(); if (users.some(user => user.email === normalizedEmail)) throw Error('Email tersebut sudah terdaftar.');
    const user = normalizeUser({ ...defaultUser, id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name: name.trim(), email: normalizedEmail, password });
    users.push(user); writeUsers(users); localStorage.setItem(activeUserKey, user.id); return user;
  }
  function login({ email = '', password = '' }) { const user = readUsers().find(item => item.email === email.trim().toLowerCase() && item.password === password); if (!user) throw Error('Email atau kata sandi tidak tepat.'); localStorage.setItem(activeUserKey, user.id); return normalizeUser(user); }
  function signOut() { localStorage.removeItem(activeUserKey); }
  // Area belajar hanya dapat dibuka setelah pengguna memiliki sesi aktif.
  // Pengunjung baru kembali ke dashboard sebagai halaman awal.
  function requireAuth() { const user = getUser(); if (!user) { window.location.replace('dashboard.html'); return false; } window.dispatchEvent(new CustomEvent('viska-auth-ready', { detail: user })); return true; }
  function getRankings() { seedDemoUsers(); return readUsers().map(normalizeUser).sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name)); }
  function updateProfile(changes) {
    const user = getUser(); if (!user) throw Error('Sesi tidak ditemukan.');
    const next = normalizeUser({ ...user, ...changes }); next.xp = Number.isInteger(next.xp) && next.xp >= 0 ? next.xp : user.xp; next.coins = Number.isInteger(next.coins) && next.coins >= 0 ? next.coins : user.coins;
    next.unlockedLessons = [...new Set([0, ...next.unlockedLessons.filter(level => Number.isInteger(level) && level >= 0 && level < 5)])].sort((a, b) => a - b);
    if (!next.ownedAvatars.includes(next.avatar)) next.avatar = user.avatar; if (!next.ownedBorders.includes(next.avatarBorder)) next.avatarBorder = user.avatarBorder;
    next.rank = rankFor(next.xp); return saveUser(next);
  }
  function purchase(itemId) {
    const item = shopItems[itemId]; if (!item) throw Error('Item toko tidak valid.'); const user = getUser(); if (!user) throw Error('Sesi tidak ditemukan.'); if (user.coins < item.price) throw Error('Koinmu tidak cukup.');
    const next = normalizeUser(user); if (item.kind === 'spin') item.value === 'skip' ? next.spinSkipCount++ : next.spinShieldCount++;
    else { const field = item.kind === 'avatar' ? 'ownedAvatars' : 'ownedBorders'; if (next[field].includes(item.value)) throw Error('Item ini sudah dimiliki.'); next[field].push(item.value); item.kind === 'avatar' ? next.avatar = item.value : next.avatarBorder = item.value; }
    next.coins -= item.price; next.rank = rankFor(next.xp); return saveUser(next);
  }
  function useSpinItem(item) { const user = getUser(); if (!user) throw Error('Sesi tidak ditemukan.'); const field = item === 'skip' ? 'spinSkipCount' : item === 'shield' ? 'spinShieldCount' : null; if (!field || user[field] < 1) throw Error('Item tersebut tidak tersedia.'); return saveUser({ ...user, [field]: user[field] - 1 }); }

  window.ViskaAuth = { getUser, saveUser, register, login, signOut, requireAuth, getRankings, updateProfile, purchase, useSpinItem };
}());
