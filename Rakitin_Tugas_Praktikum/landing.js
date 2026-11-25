// Rakitin - interaksi DOM halaman utama (showToast ada di auth.js)
document.addEventListener("DOMContentLoaded", () => {
    const session = getSession();

    // Jika sudah login, ubah menu
    if (session) {
        const navLogin = document.getElementById("navLogin");
        navLogin.textContent = "Dashboard";
        navLogin.href = "dashboard.html";
        document.getElementById("navRegister").remove();
    }

    // DOM 1: ubah teks sapaan
    const greetingButton = document.getElementById("greetingToggle");
    const heroDescription = document.getElementById("heroDescription");
    let friendly = false;
    greetingButton.addEventListener("click", () => {
        friendly = !friendly;
        heroDescription.textContent = friendly
            ? "Hai! Temukan alat yang kamu butuhkan, pesan dengan mudah, dan gunakan tanpa harus membeli."
            : "Sewa berbagai perlengkapan untuk acara, tugas, proyek, dan kebutuhan sehari-hari tanpa harus membeli.";
        greetingButton.textContent = friendly ? "Kembalikan Sapaan" : "Ubah Sapaan";
        showToast("Teks halaman berhasil diperbarui.");
    });

    // DOM 2: filter kartu layanan
    const searchInput = document.getElementById("serviceSearch");
    const cards = [...document.querySelectorAll("#serviceCards .card")];
    const feedback = document.getElementById("searchFeedback");
    searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLocaleLowerCase("id");
        let visible = 0;
        cards.forEach(card => {
            const match = card.textContent.toLocaleLowerCase("id").includes(q);
            card.hidden = !match;
            if (match) visible++;
        });
        feedback.textContent = visible
            ? `Menampilkan ${visible} layanan.`
            : "Layanan tidak ditemukan. Coba kata kunci lain.";
    });

    // DOM 3: tombol pesan dibuat dengan createElement()
    cards.forEach(card => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "card-book-button";
        btn.textContent = "Pesan layanan";
        btn.addEventListener("click", () => {
            const name = card.querySelector("h3").textContent;
            showToast(session
                ? `${name} dipilih. Kelola pesananmu di Dashboard.`
                : `${name} dipilih. Silakan login untuk melanjutkan.`);
        });
        card.appendChild(btn);
    });

    // Mode gelap
    const themeButton = document.getElementById("themeToggle");
    themeButton.addEventListener("click", () => {
        const on = document.body.classList.toggle("dark-mode");
        themeButton.textContent = on ? "Mode Terang" : "Mode Gelap";
        themeButton.setAttribute("aria-pressed", String(on));
        showToast(on ? "Mode gelap diaktifkan." : "Mode terang diaktifkan.");
    });
});
