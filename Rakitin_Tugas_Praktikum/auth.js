// =====================================
// RAKITIN - AUTENTIKASI + TOAST (dipakai semua halaman)
// Data disimpan di localStorage browser.
// =====================================
const USERS_KEY = "rakitin_users";
const SESSION_KEY = "rakitin_session";

// ---------- Toast ----------
function showToast(message, type = "success") {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "toast show " + type;
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// ---------- Hash password ----------
function randomSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return [...arr].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
    const text = salt + password;
    try {
        if (window.crypto && crypto.subtle) {
            const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
            return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
        }
    } catch (e) { /* lanjut ke cadangan */ }
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    return "fb-" + h.toString(16);
}

// ---------- Data user ----------
function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
}
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Akun admin bawaan: admin / admin123
async function ensureAdmin() {
    try {
        const users = getUsers();
        if (users.some(u => u.username === "admin")) return;
        const salt = randomSalt();
        users.push({
            id: Date.now(), email: "admin@rakitin.com", username: "admin",
            salt, passwordHash: await hashPassword("admin123", salt), role: "admin"
        });
        saveUsers(users);
    } catch (e) { console.error("Gagal membuat admin:", e); }
}

// ---------- Register ----------
async function registerUser(email, username, password) {
    email = email.trim().toLowerCase();
    username = username.trim();
    if (username.length < 3) return { ok: false, message: "Username minimal 3 karakter." };
    if (/\s/.test(username)) return { ok: false, message: "Username tidak boleh mengandung spasi." };
    if (password.length < 6) return { ok: false, message: "Password minimal 6 karakter." };

    await ensureAdmin();
    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase()))
        return { ok: false, message: "Username sudah digunakan." };
    if (users.some(u => u.email === email))
        return { ok: false, message: "Email sudah terdaftar." };

    const salt = randomSalt();
    users.push({
        id: Date.now(), email, username, salt,
        passwordHash: await hashPassword(password, salt), role: "user"
    });
    saveUsers(users);
    return { ok: true };
}

// ---------- Login ----------
async function loginUser(username, password) {
    await ensureAdmin();
    const user = getUsers().find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) return { ok: false, message: "Username atau password salah." };
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) return { ok: false, message: "Username atau password salah." };

    localStorage.setItem(SESSION_KEY, JSON.stringify({
        id: user.id, username: user.username, email: user.email, role: user.role
    }));
    return { ok: true };
}

// ---------- Session ----------
function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch (e) { return null; }
}
function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
}
function requireLogin() {
    if (!getSession()) window.location.replace("login.html");
}

// ---------- Pasang event (listener dipasang lebih dulu agar form selalu merespons) ----------
document.addEventListener("DOMContentLoaded", () => {
    const session = getSession();

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        if (session) { window.location.replace("dashboard.html"); return; }
        const error = document.getElementById("formError");
        loginForm.addEventListener("submit", async e => {
            e.preventDefault();
            error.textContent = "";
            const r = await loginUser(
                document.getElementById("loginUsername").value,
                document.getElementById("loginPassword").value
            );
            if (!r.ok) { error.textContent = r.message; showToast(r.message, "error"); return; }
            showToast("Login berhasil. Mengalihkan...");
            setTimeout(() => window.location.href = "dashboard.html", 800);
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        const error = document.getElementById("formError");
        registerForm.addEventListener("submit", async e => {
            e.preventDefault();
            error.textContent = "";
            const r = await registerUser(
                document.getElementById("regEmail").value,
                document.getElementById("regUsername").value,
                document.getElementById("regPassword").value
            );
            if (!r.ok) { error.textContent = r.message; showToast(r.message, "error"); return; }
            showToast("Registrasi berhasil. Silakan login.");
            setTimeout(() => window.location.href = "login.html", 1200);
        });
    }

    const userName = document.getElementById("userName");
    if (userName && session) userName.textContent = session.username;

    document.getElementById("logoutLink")?.addEventListener("click", e => {
        e.preventDefault();
        logout();
    });

    ensureAdmin();
});
