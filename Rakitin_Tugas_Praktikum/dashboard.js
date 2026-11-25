// =====================================
// RAKITIN - DASHBOARD (3 CRUD: Barang, Pesanan, Pengguna)
// showToast, getUsers, saveUsers, hashPassword, dll. ada di auth.js
// =====================================

// ---------- Helper ----------
function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
}
function rupiah(v) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
}
function esc(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
}
function $(id) { return document.getElementById(id); }
function closeModal(id) { $(id).classList.remove("show"); }

// ---------- Data awal ----------
let barang = load("rakitin_barang", [
    { id: 1, nama: "Proyektor Epson", kategori: "Elektronik", harga: 75000, status: "Tersedia" },
    { id: 2, nama: "Speaker Portable", kategori: "Audio", harga: 50000, status: "Disewa" },
    { id: 3, nama: "Kamera Digital", kategori: "Kamera", harga: 100000, status: "Tersedia" }
]);
let pesanan = load("rakitin_pesanan", [
    { id: 1, pelanggan: "Budi", barangId: 1, tanggal: "2026-09-20", durasi: 2, status: "Aktif" },
    { id: 2, pelanggan: "Sinta", barangId: 2, tanggal: "2026-09-15", durasi: 1, status: "Selesai" }
]);
let pelanggan = load("rakitin_pelanggan", [
    { id: 1, nama: "Budi", email: "budi@email.com", telepon: "081234567890", alamat: "Malang" },
    { id: 2, nama: "Sinta", email: "sinta@email.com", telepon: "082345678901", alamat: "Batu" }
]);

function saveData() {
    localStorage.setItem("rakitin_barang", JSON.stringify(barang));
    localStorage.setItem("rakitin_pesanan", JSON.stringify(pesanan));
    localStorage.setItem("rakitin_pelanggan", JSON.stringify(pelanggan));
}

// =====================================
// CRUD 1: BARANG
// =====================================
function renderBarang() {
    $("barangTable").innerHTML = barang.length ? barang.map((b, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><b>${esc(b.nama)}</b></td>
            <td>${esc(b.kategori)}</td>
            <td>${rupiah(b.harga)}</td>
            <td><span class="status ${b.status.toLowerCase()}">${b.status}</span></td>
            <td><div class="action">
                <button class="btn-small edit" onclick="openBarangModal(${b.id})">Edit</button>
                <button class="btn-small delete" onclick="hapusBarang(${b.id})">Hapus</button>
            </div></td>
        </tr>`).join("")
        : `<tr><td colspan="6" class="empty">Belum ada data barang.</td></tr>`;

    $("pesananBarang").innerHTML = barang.map(b => `<option value="${b.id}">${esc(b.nama)}</option>`).join("");
}

function openBarangModal(id = null) {
    $("barangForm").reset();
    $("barangId").value = id || "";
    $("barangModalTitle").textContent = id ? "Edit Barang" : "Tambah Barang";
    if (id) {
        const b = barang.find(x => x.id === id);
        $("barangNama").value = b.nama;
        $("barangKategori").value = b.kategori;
        $("barangHarga").value = b.harga;
        $("barangStatus").value = b.status;
    }
    $("barangModal").classList.add("show");
}

function hapusBarang(id) {
    if (pesanan.some(p => Number(p.barangId) === id)) {
        showToast("Barang masih dipakai pada data pesanan, tidak bisa dihapus.", "error");
        return;
    }
    if (confirm("Yakin ingin menghapus barang ini?")) {
        barang = barang.filter(b => b.id !== id);
        saveData();
        renderAll();
        showToast("Barang berhasil dihapus.");
    }
}

$("barangForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = Number($("barangId").value);
    const data = {
        id: id || Date.now(),
        nama: $("barangNama").value.trim(),
        kategori: $("barangKategori").value.trim(),
        harga: Number($("barangHarga").value),
        status: $("barangStatus").value
    };
    if (id) barang = barang.map(b => b.id === id ? data : b);
    else barang.push(data);
    saveData();
    renderAll();
    closeModal("barangModal");
    showToast(id ? "Data barang berhasil diperbarui." : "Barang berhasil ditambahkan.");
});

// =====================================
// CRUD 2: PESANAN
// =====================================
function totalPesanan(p) {
    const b = barang.find(x => x.id === Number(p.barangId));
    return b ? b.harga * Number(p.durasi) : 0;
}

function renderPesanan() {
    $("pesananTable").innerHTML = pesanan.length ? pesanan.map((p, i) => {
        const b = barang.find(x => x.id === Number(p.barangId));
        return `
        <tr>
            <td>${i + 1}</td>
            <td><b>${esc(p.pelanggan)}</b></td>
            <td>${b ? esc(b.nama) : "-"}</td>
            <td>${p.tanggal}</td>
            <td>${p.durasi} hari</td>
            <td>${rupiah(totalPesanan(p))}</td>
            <td><span class="status ${p.status.toLowerCase()}">${p.status}</span></td>
            <td><div class="action">
                <button class="btn-small edit" onclick="openPesananModal(${p.id})">Edit</button>
                <button class="btn-small delete" onclick="hapusPesanan(${p.id})">Hapus</button>
            </div></td>
        </tr>`;
    }).join("")
        : `<tr><td colspan="8" class="empty">Belum ada data pesanan.</td></tr>`;

    $("statAktif").textContent = pesanan.filter(p => p.status === "Aktif").length;
    $("statTotal").textContent = rupiah(pesanan.reduce((s, p) => s + totalPesanan(p), 0));
    updateWidgets();
}

function updateWidgets() {
    $("statBarang").textContent = barang.length;
    $("statPesanan").textContent = pesanan.length;
    $("statPelanggan").textContent = pelanggan.length;
    $("statPengguna").textContent = getUsers().length;
}

function openPesananModal(id = null) {
    if (!id && barang.length === 0) {
        showToast("Tambahkan data barang terlebih dahulu.", "error");
        return;
    }
    $("pesananForm").reset();
    $("pesananId").value = id || "";
    $("pesananModalTitle").textContent = id ? "Edit Pesanan" : "Tambah Pesanan";
    if (id) {
        const p = pesanan.find(x => x.id === id);
        $("pesananPelanggan").value = p.pelanggan;
        $("pesananBarang").value = p.barangId;
        $("pesananTanggal").value = p.tanggal;
        $("pesananDurasi").value = p.durasi;
        $("pesananStatus").value = p.status;
    }
    $("pesananModal").classList.add("show");
}

function hapusPesanan(id) {
    if (confirm("Yakin ingin menghapus pesanan ini?")) {
        pesanan = pesanan.filter(p => p.id !== id);
        saveData();
        renderAll();
        showToast("Pesanan berhasil dihapus.");
    }
}

$("pesananForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = Number($("pesananId").value);
    const data = {
        id: id || Date.now(),
        pelanggan: $("pesananPelanggan").value.trim(),
        barangId: Number($("pesananBarang").value),
        tanggal: $("pesananTanggal").value,
        durasi: Number($("pesananDurasi").value),
        status: $("pesananStatus").value
    };
    if (id) pesanan = pesanan.map(p => p.id === id ? data : p);
    else pesanan.push(data);
    saveData();
    renderAll();
    closeModal("pesananModal");
    showToast(id ? "Pesanan berhasil diperbarui." : "Pesanan berhasil ditambahkan.");
});

// =====================================
// CRUD 3: PELANGGAN (data baru)
// =====================================
function renderPelanggan() {
    $("pelangganTable").innerHTML = pelanggan.length ? pelanggan.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><b>${esc(p.nama)}</b></td>
            <td>${esc(p.email)}</td>
            <td>${esc(p.telepon)}</td>
            <td>${esc(p.alamat)}</td>
            <td><div class="action">
                <button class="btn-small edit" onclick="openPelangganModal(${p.id})">Edit</button>
                <button class="btn-small delete" onclick="hapusPelanggan(${p.id})">Hapus</button>
            </div></td>
        </tr>`).join("")
        : `<tr><td colspan="6" class="empty">Belum ada data pelanggan.</td></tr>`;
    $("statPelanggan").textContent = pelanggan.length;
}

function openPelangganModal(id = null) {
    $("pelangganForm").reset();
    $("pelangganId").value = id || "";
    $("pelangganModalTitle").textContent = id ? "Edit Pelanggan" : "Tambah Pelanggan";
    if (id) {
        const p = pelanggan.find(x => x.id === id);
        if (!p) return;
        $("pelangganNama").value = p.nama;
        $("pelangganEmail").value = p.email;
        $("pelangganTelepon").value = p.telepon;
        $("pelangganAlamat").value = p.alamat;
    }
    $("pelangganModal").classList.add("show");
}

function hapusPelanggan(id) {
    if (confirm("Yakin ingin menghapus data pelanggan ini?")) {
        pelanggan = pelanggan.filter(p => p.id !== id);
        saveData();
        renderAll();
        showToast("Data pelanggan berhasil dihapus.");
    }
}

$("pelangganForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = Number($("pelangganId").value);
    const data = {
        id: id || Date.now(),
        nama: $("pelangganNama").value.trim(),
        email: $("pelangganEmail").value.trim().toLowerCase(),
        telepon: $("pelangganTelepon").value.trim(),
        alamat: $("pelangganAlamat").value.trim()
    };
    const emailDipakai = pelanggan.some(p => p.id !== id && p.email === data.email);
    if (emailDipakai) return showToast("Email pelanggan sudah terdaftar.", "error");
    if (id) pelanggan = pelanggan.map(p => p.id === id ? data : p);
    else pelanggan.push(data);
    saveData();
    renderAll();
    closeModal("pelangganModal");
    showToast(id ? "Data pelanggan berhasil diperbarui." : "Pelanggan berhasil ditambahkan.");
});

// =====================================
// CETAK LAPORAN PESANAN KE PDF
// =====================================
function cetakPesananPDF() {
    const rows = pesanan.map((p, i) => {
        const b = barang.find(x => x.id === Number(p.barangId));
        return `<tr>
            <td>${i + 1}</td>
            <td>${esc(p.pelanggan)}</td>
            <td>${esc(b ? b.nama : "-")}</td>
            <td>${esc(p.tanggal)}</td>
            <td>${Number(p.durasi)} hari</td>
            <td>${rupiah(totalPesanan(p))}</td>
            <td>${esc(p.status)}</td>
        </tr>`;
    }).join("");
    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) {
        showToast("Izinkan pop-up browser untuk mencetak PDF.", "error");
        return;
    }
    win.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
        <title>Laporan Data Pesanan Rakitin</title>
        <style>
            body{font-family:Arial,sans-serif;padding:28px;color:#222}
            h1{text-align:center;margin:0 0 6px;font-size:22px}
            p{text-align:center;margin:0 0 24px;color:#555}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #999;padding:9px;text-align:left;font-size:12px}
            th{background:#eee}
            .date{text-align:right;margin-top:20px;font-size:12px}
            @media print{body{padding:0}}
        </style></head><body>
        <h1>LAPORAN DATA PESANAN</h1><p>RAKITIN - SISTEM PENYEWAAN ALAT</p>
        <table><thead><tr><th>No</th><th>Pelanggan</th><th>Barang</th><th>Tanggal</th><th>Durasi</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7" style="text-align:center">Belum ada data pesanan</td></tr>'}</tbody></table>
        <div class="date">Dicetak pada: ${new Date().toLocaleDateString("id-ID")}</div>
        <script>window.onload = () => { window.print(); };</script>
        </body></html>`);
    win.document.close();
}

// =====================================
// CRUD 3: PENGGUNA (khusus admin)
// =====================================
function renderUsers() {
    const me = getSession();
    $("userTable").innerHTML = getUsers().map((u, i) => {
        const locked = u.username === "admin" || (me && me.id === u.id);
        return `
        <tr>
            <td>${i + 1}</td>
            <td><b>${esc(u.username)}</b></td>
            <td>${esc(u.email)}</td>
            <td><span class="status ${u.role === "admin" ? "" : "selesai"}">${u.role}</span></td>
            <td><div class="action">
                <button class="btn-small edit" onclick="openUserModal(${u.id})">Edit</button>
                <button class="btn-small delete" onclick="hapusUser(${u.id})" ${locked ? 'disabled title="Akun ini tidak bisa dihapus"' : ""}>Hapus</button>
            </div></td>
        </tr>`;
    }).join("");
}

function openUserModal(id = null) {
    $("userForm").reset();
    $("userId").value = id || "";
    $("userModalTitle").textContent = id ? "Edit Pengguna" : "Tambah Pengguna";
    $("userPassword").required = !id;
    $("userPassword").placeholder = id ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter";
    if (id) {
        const u = getUsers().find(x => x.id === id);
        $("userUsername").value = u.username;
        $("userEmail").value = u.email;
        $("userRole").value = u.role;
    }
    $("userModal").classList.add("show");
}

function hapusUser(id) {
    const me = getSession();
    const u = getUsers().find(x => x.id === id);
    if (!u) return;
    if (u.username === "admin" || (me && me.id === id)) {
        showToast("Akun ini tidak dapat dihapus.", "error");
        return;
    }
    if (confirm(`Yakin ingin menghapus pengguna "${u.username}"?`)) {
        saveUsers(getUsers().filter(x => x.id !== id));
        renderUsers();
        updateWidgets();
        showToast("Pengguna berhasil dihapus.");
    }
}

$("userForm").addEventListener("submit", async e => {
    e.preventDefault();
    const id = Number($("userId").value);
    const username = $("userUsername").value.trim();
    const email = $("userEmail").value.trim().toLowerCase();
    const role = $("userRole").value;
    const password = $("userPassword").value;
    const users = getUsers();

    if (username.length < 3 || /\s/.test(username)) return showToast("Username minimal 3 karakter tanpa spasi.", "error");
    if (password && password.length < 6) return showToast("Password minimal 6 karakter.", "error");
    if (users.some(u => u.id !== id && u.username.toLowerCase() === username.toLowerCase())) return showToast("Username sudah digunakan.", "error");
    if (users.some(u => u.id !== id && u.email === email)) return showToast("Email sudah terdaftar.", "error");

    if (id) {
        const u = users.find(x => x.id === id);
        u.username = username; u.email = email; u.role = role;
        if (password) { u.salt = randomSalt(); u.passwordHash = await hashPassword(password, u.salt); }
        const me = getSession();
        if (me && me.id === id) localStorage.setItem(SESSION_KEY, JSON.stringify({ ...me, username, email, role }));
    } else {
        const salt = randomSalt();
        users.push({ id: Date.now(), username, email, role, salt, passwordHash: await hashPassword(password, salt) });
    }
    saveUsers(users);
    renderUsers();
    updateWidgets();
    closeModal("userModal");
    showToast(id ? "Data pengguna berhasil diperbarui." : "Pengguna berhasil ditambahkan.");
});

// =====================================
// Modal: klik area gelap untuk menutup
// =====================================
window.addEventListener("click", e => {
    if (e.target.classList.contains("modal")) e.target.classList.remove("show");
});

// =====================================
// Mulai
// =====================================
function renderAll() {
    renderBarang();
    renderPesanan();
    renderPelanggan();
    updateWidgets();
}

renderAll();

// Bagian Pengguna hanya untuk admin
(async function initUsers() {
    await ensureAdmin();
    const me = getSession();
    if (!me || me.role !== "admin") {
        $("pengguna").remove();
        $("navPengguna").remove();
        return;
    }
    renderUsers();
    updateWidgets();
})();
