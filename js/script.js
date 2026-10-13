/* =========================================================
   ANIMEVAULT — Final Frontend Script
   Backend: /AnimeVault/backend/...
   ========================================================= */

(function () {
    "use strict";

    const BASE = "/AnimeVault/backend";
    const API = {
        register:   BASE + "/auth/register.php",
        login:      BASE + "/auth/login.php",
        me:         BASE + "/auth/me.php",
        logout:     BASE + "/auth/logout.php",
        search:     BASE + "/anime/search.php",
        trending:   BASE + "/anime/trending.php",
        topRated:   BASE + "/anime/top-rated.php",
        details:    BASE + "/anime/details.php",
        wlAdd:      BASE + "/watchlist/add.php",
        wlGet:      BASE + "/watchlist/get.php",
        wlRemove:   BASE + "/watchlist/remove.php",
        wlClear:    BASE + "/watchlist/clear.php"
    };

    const TOKEN_KEY = "animevault_token";
    const USER_KEY  = "animevault_user";

    let token = localStorage.getItem(TOKEN_KEY) || null;
    let currentUser = null;
    let watchlist = [];
    let animeList = [];
    let currentView = "trending";
    let currentSearchQuery = "";
    let isLoading = false;

    const $ = (id) => document.getElementById(id);

    const pageLoader        = $("pageLoader");
    const mobileMenuButton  = $("mobileMenuButton");
    const mobileNavigation  = $("mobileNavigation");
    const headerSearchButton= $("headerSearchButton");
    const profileButton     = $("profileButton");

    const animeSearch       = $("animeSearch");
    const searchButton      = $("searchButton");
    const searchSuggestions = $("searchSuggestions");
    const searchWrapper     = $("searchWrapper");

    const exploreButton          = $("exploreButton");
    const heroWatchlistButton    = $("heroWatchlistButton");
    const emptyWatchlistButton   = $("emptyWatchlistButton");

    const resultsTitle   = $("resultsTitle");
    const resultsCount   = $("resultsCount");
    const trendingButton = $("trendingButton");
    const topRatedButton = $("topRatedButton");
    const errorMessage   = $("errorMessage");
    const loading        = $("loading");
    const animeGrid      = $("animeGrid");
    const loadMoreWrapper= $("loadMoreWrapper");
    const loadMoreButton = $("loadMoreButton");

    const watchlistGrid  = $("watchlistGrid");
    const watchlistCount = $("watchlistCount");
    const watchlistEmpty = $("watchlistEmpty");
    const clearWatchlistButton = $("clearWatchlistButton");

    const animeDetailsModal = $("animeDetailsModal");
    const modalBanner       = document.querySelector("[data-modal-banner]");
    const modalImage        = document.querySelector("[data-modal-image]");
    const modalTitle        = document.querySelector("[data-modal-title]");
    const modalScore        = document.querySelector("[data-modal-score]");
    const modalEpisodes     = document.querySelector("[data-modal-episodes]");
    const modalStatus       = document.querySelector("[data-modal-status]");
    const modalType         = document.querySelector("[data-modal-type]");
    const modalYear         = document.querySelector("[data-modal-year]");
    const modalGenres       = document.querySelector("[data-modal-genres]");
    const modalDescription  = document.querySelector("[data-modal-description]");
    const modalWatchlistBtn = document.querySelector("[data-modal-watchlist]");
    const modalLink         = document.querySelector("[data-modal-link]");
    const modalClose        = document.querySelector("[data-modal-close]");

    const authModal      = $("authModal");
    const authTabs       = document.querySelectorAll(".auth-tab");
    const loginForm      = $("loginForm");
    const signupForm     = $("signupForm");
    const loginMessage   = $("loginMessage");
    const signupMessage  = $("signupMessage");
    const authSwitchText = $("authSwitchText");
    const authModalTitle = $("authModalTitle");
    const authHeaderP    = document.querySelector(".auth-subtitle");

    const toast     = $("animeToast");
    const backToTop = $("backToTop");

    function showToast(msg, ms = 2600) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove("show"), ms);
    }

    function debounce(fn, ms) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    }

    function authHeaders() {
        const h = { "Content-Type": "application/json" };
        if (token) h["Authorization"] = "Bearer " + token;
        return h;
    }

    async function apiFetch(url, options = {}) {
        const res = await fetch(url, {
            ...options,
            headers: { ...authHeaders(), ...(options.headers || {}) }
        });
        let data = null;
        try { data = await res.json(); } catch { /* non-JSON */ }
        if (!res.ok) {
            const msg = (data && data.message) || `Request failed (${res.status})`;
            const err = new Error(msg);
            err.status = res.status;
            throw err;
        }
        return data;
    }

    function normalizeMedia(media) {
        if (!media) return null;
        const title = media.title?.english || media.title?.romaji || media.title?.native || "Untitled";
        const image = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium
                    || "https://placehold.co/400x600/11141d/ffffff?text=Anime";

        return {
            anilist_id:    media.id,
            title,
            english_title: media.title?.english || "",
            native_title:  media.title?.native || "",
            poster_url:    image,
            banner_url:    media.bannerImage || "",
            score:         media.averageScore ? (media.averageScore / 10).toFixed(1) : "N/A",
            episodes:      media.episodes || "?",
            status:        media.status || "Unknown",
            format:        media.format || "Anime",
            seasonYear:    media.seasonYear || "N/A",
            genres:        media.genres || [],
            description:   media.description
                ? media.description.replace(/<[^>]*>/g, "").slice(0, 600)
                : "No synopsis available.",
            siteUrl:       media.siteUrl || "#"
        };
    }

    function toAddPayload(a) {
        return {
            id: a.anilist_id,
            title: a.title,
            titleEnglish: a.english_title,
            titleJapanese: a.native_title,
            poster: a.poster_url,
            banner: a.banner_url,
            synopsis: a.description,
            score: a.score === "N/A" ? null : a.score,
            episodes: a.episodes === "?" ? 0 : a.episodes,
            status: a.status,
            type: a.format,
            year: a.seasonYear === "N/A" ? 0 : a.seasonYear,
            url: a.siteUrl
        };
    }

    function rowToNormalized(row) {
        return {
            anilist_id:    row.anilist_id,
            title:         row.title,
            english_title: row.english_title || "",
            native_title:  row.native_title || "",
            poster_url:    row.poster_url || "",
            banner_url:    row.banner_url || "",
            score:         row.score || "N/A",
            episodes:      row.episodes || "?",
            status:        row.status || "Unknown",
            format:        row.format || "Anime",
            seasonYear:    row.season_year || "N/A",
            genres:        [],
            description:   row.synopsis || "No synopsis available.",
            siteUrl:       row.site_url || "#"
        };
    }

    async function loadWatchlist() {
        if (token) {
            try {
                const res = await apiFetch(API.wlGet);
                watchlist = (res.watchlist || []).map(rowToNormalized);
            } catch (err) {
                if (err.status === 401) logoutLocal();
                watchlist = [];
            }
        } else {
            try { watchlist = JSON.parse(localStorage.getItem("animevault_watchlist") || "[]"); }
            catch { watchlist = []; }
        }
        renderWatchlist();
    }

    function saveGuestWatchlist() {
        if (!token) {
            localStorage.setItem("animevault_watchlist", JSON.stringify(watchlist));
        }
    }

    function isInWatchlist(id) {
        return watchlist.some((a) => String(a.anilist_id) === String(id));
    }

    async function addToWatchlist(anime) {
        if (isInWatchlist(anime.anilist_id)) {
            showToast("Already in your watchlist");
            return;
        }
        if (token) {
            try {
                await apiFetch(API.wlAdd, {
                    method: "POST",
                    body: JSON.stringify({ anime: toAddPayload(anime) })
                });
                watchlist.unshift(anime);
                renderWatchlist();
                showToast("Added to watchlist");
            } catch (err) {
                showToast("Could not save: " + err.message);
            }
        } else {
            watchlist.unshift(anime);
            saveGuestWatchlist();
            renderWatchlist();
            showToast("Saved locally (log in to sync)");
        }
    }

    async function removeFromWatchlist(id) {
        if (token) {
            try {
                await apiFetch(API.wlRemove, {
                    method: "POST",
                    body: JSON.stringify({ anilist_id: id })
                });
            } catch (err) {
                showToast("Could not remove: " + err.message);
                return;
            }
        }
        watchlist = watchlist.filter((a) => String(a.anilist_id) !== String(id));
        if (!token) saveGuestWatchlist();
        renderWatchlist();
        showToast("Removed from watchlist");
    }

    async function clearWatchlist() {
        if (token) {
            try { await apiFetch(API.wlClear, { method: "POST" }); }
            catch (err) { showToast("Could not clear: " + err.message); return; }
        }
        watchlist = [];
        if (!token) saveGuestWatchlist();
        renderWatchlist();
        showToast("Watchlist cleared");
    }

    function renderAnimeCards(list, append = false) {
        if (!animeGrid) return;

        const html = list.map((anime) => {
            const inList = isInWatchlist(anime.anilist_id);
            return `
            <article class="anime-card" data-anime-id="${anime.anilist_id}">
                <div class="anime-card-image">
                    <img src="${anime.poster_url}" alt="${anime.title}" loading="lazy">
                    <span class="score-badge">★ ${anime.score}</span>
                    <button type="button" class="card-watchlist ${inList ? 'saved' : ''}" data-add-id="${anime.anilist_id}">
                        ${inList ? '✓ Saved' : '+ Add'}
                    </button>
                </div>
                <div class="anime-card-content">
                    <h3>${anime.title}</h3>
                    <div class="anime-meta">
                        <span>${anime.format}</span>
                        <span>${anime.episodes} eps</span>
                    </div>
                    <div class="anime-status">${anime.status}</div>
                </div>
            </article>`;
        }).join("");

        if (append) animeGrid.insertAdjacentHTML("beforeend", html);
        else        animeGrid.innerHTML = html;

        animeGrid.querySelectorAll(".anime-card").forEach((card) => {
            card.addEventListener("click", (e) => {
                if (e.target.closest(".card-watchlist")) return;
                const id = card.dataset.animeId;
                const anime = animeList.find((a) => String(a.anilist_id) === String(id));
                if (anime) openAnimeModal(anime);
            });
        });

        animeGrid.querySelectorAll(".card-watchlist").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const id = btn.dataset.addId;
                const anime = animeList.find((a) => String(a.anilist_id) === String(id));
                if (!anime) return;
                if (isInWatchlist(anime.anilist_id)) {
                    await removeFromWatchlist(anime.anilist_id);
                } else {
                    await addToWatchlist(anime);
                }
                const nowIn = isInWatchlist(anime.anilist_id);
                btn.textContent = nowIn ? "✓ Saved" : "+ Add";
                btn.classList.toggle("saved", nowIn);
            });
        });
    }

    function renderWatchlist() {
        if (!watchlistGrid) return;
        const count = watchlist.length;
        watchlistCount.textContent = count + " saved anime";
        watchlistEmpty.style.display = count === 0 ? "block" : "none";
        watchlistGrid.style.display = count === 0 ? "none" : "grid";

        if (count === 0) { watchlistGrid.innerHTML = ""; return; }

        watchlistGrid.innerHTML = watchlist.map((anime) => `
            <article class="anime-card" data-anime-id="${anime.anilist_id}">
                <div class="anime-card-image">
                    <img src="${anime.poster_url || 'https://placehold.co/400x600/11141d/ffffff?text=Anime'}"
                         alt="${anime.title}" loading="lazy">
                    <span class="score-badge">★ ${anime.score}</span>
                    <button type="button" class="card-watchlist saved" data-remove-id="${anime.anilist_id}">Remove</button>
                </div>
                <div class="anime-card-content">
                    <h3>${anime.title}</h3>
                    <div class="anime-meta">
                        <span>${anime.format}</span>
                        <span>${anime.episodes} eps</span>
                    </div>
                    <div class="anime-status">${anime.status}</div>
                </div>
            </article>
        `).join("");

        watchlistGrid.querySelectorAll("[data-remove-id]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                removeFromWatchlist(btn.dataset.removeId);
            });
        });

        watchlistGrid.querySelectorAll(".anime-card").forEach((card) => {
            card.addEventListener("click", (e) => {
                if (e.target.closest("[data-remove-id]")) return;
                const id = card.dataset.animeId;
                const item = watchlist.find((w) => String(w.anilist_id) === String(id));
                if (item) openAnimeModal(item);
            });
        });
    }

    async function loadAnime(append = false) {
        if (isLoading) return;
        isLoading = true;
        errorMessage.hidden = true;
        loading.hidden = false;
        if (!append) animeGrid.innerHTML = "";
        loadMoreWrapper.style.display = "none";

        try {
            let url, title;
            if (currentView === "search") {
                url = API.search + "?q=" + encodeURIComponent(currentSearchQuery);
                title = `Search: "${currentSearchQuery}"`;
            } else if (currentView === "topRated") {
                url = API.topRated;
                title = "Top Rated Anime";
            } else {
                url = API.trending;
                title = "Trending Anime";
            }

            const res = await apiFetch(url);
            const media = (res.data || []).map(normalizeMedia).filter(Boolean);

            if (append) animeList = animeList.concat(media);
            else        animeList = media;

            resultsTitle.textContent = title;
            resultsCount.textContent = media.length + " titles found";
            renderAnimeCards(media, append);
        } catch (err) {
            errorMessage.hidden = false;
            errorMessage.innerHTML = `<h3>Could not load anime</h3><p>${err.message}</p>`;
        } finally {
            loading.hidden = true;
            isLoading = false;
        }
    }

    function openAnimeModal(anime) {
        fillModal(anime);
        animeDetailsModal.classList.add("active");
        animeDetailsModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function fillModal(anime) {
        modalImage.src         = anime.poster_url || "";
        modalTitle.textContent = anime.title || "Anime";
        modalScore.textContent = anime.score || "N/A";
        modalEpisodes.textContent = anime.episodes || "?";
        modalStatus.textContent   = anime.status || "Unknown";
        modalType.textContent     = anime.format || "Anime";
        modalYear.textContent     = anime.seasonYear || "N/A";
        modalDescription.textContent = anime.description || "No synopsis.";

        if (modalBanner) {
            modalBanner.style.backgroundImage = anime.banner_url
                ? `url('${anime.banner_url}')`
                : `linear-gradient(120deg, #1a1e2b, #0d1017)`;
        }

        const genres = anime.genres || [];
        modalGenres.innerHTML = genres.map((g) => `<span>${g}</span>`).join("");

        modalLink.href = anime.siteUrl || "#";

        const inList = isInWatchlist(anime.anilist_id);
        modalWatchlistBtn.textContent = inList ? "✓ In Watchlist" : "+ Add to Watchlist";
        modalWatchlistBtn.dataset.animeId = anime.anilist_id;
        modalWatchlistBtn._animeData = anime;
    }

    function closeAnimeModal() {
        animeDetailsModal.classList.remove("active");
        animeDetailsModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    function logoutLocal() {
        token = null;
        currentUser = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        updateProfileButton();
    }

    async function loadCurrentUser() {
        if (!token) { updateProfileButton(); return; }
        try {
            const res = await apiFetch(API.me);
            currentUser = res.user || null;
        } catch { logoutLocal(); }
        updateProfileButton();
    }

    function updateProfileButton() {
        if (!profileButton) return;
        if (currentUser) {
            const name = currentUser.username || currentUser.email || "U";
            profileButton.textContent = name.charAt(0).toUpperCase();
            profileButton.title = "Logged in as " + name;
            profileButton.classList.remove("is-guest");
        } else {
            profileButton.textContent = "Login";
            profileButton.title = "Click to log in";
            profileButton.classList.add("is-guest");
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        clearAuthErrors("loginForm");
        const email = $("loginEmail").value.trim();
        const password = $("loginPassword").value;
        if (!email || !password) {
            setAuthMessage(loginMessage, "error", "Please fill in all fields.");
            return;
        }
        try {
            const res = await fetch(API.login, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setAuthMessage(loginMessage, "error", data.message || "Login failed.");
                return;
            }
            token = data.token;
            currentUser = data.user || { email };
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            updateProfileButton();
            setAuthMessage(loginMessage, "success", "Login successful!");
            showToast("Welcome back!");
            await mergeGuestWatchlist();
            await loadWatchlist();
            setTimeout(closeAuthModal, 700);
        } catch (err) {
            setAuthMessage(loginMessage, "error", "Network error: " + err.message);
        }
    }

    async function mergeGuestWatchlist() {
        let guest = [];
        try { guest = JSON.parse(localStorage.getItem("animevault_watchlist") || "[]"); }
        catch { guest = []; }
        if (!guest.length) return;
        for (const item of guest) {
            try {
                await apiFetch(API.wlAdd, {
                    method: "POST",
                    body: JSON.stringify({ anime: toAddPayload(item) })
                });
            } catch { /* skip */ }
        }
        localStorage.removeItem("animevault_watchlist");
    }

    async function handleSignup(e) {
        e.preventDefault();
        clearAuthErrors("signupForm");
        const username = $("signupName").value.trim();
        const email    = $("signupEmail").value.trim();
        const password = $("signupPassword").value;
        if (!username || !email || !password) {
            setAuthMessage(signupMessage, "error", "Please fill in all fields.");
            return;
        }
        if (password.length < 6) {
            setAuthMessage(signupMessage, "error", "Password must be at least 6 characters.");
            return;
        }
        try {
            const res = await fetch(API.register, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setAuthMessage(signupMessage, "error", data.message || "Registration failed.");
                return;
            }
            setAuthMessage(signupMessage, "success", "Account created! Logging in...");
            const loginRes = await fetch(API.login, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const loginData = await loginRes.json();
            if (loginRes.ok && loginData.success) {
                token = loginData.token;
                currentUser = loginData.user;
                localStorage.setItem(TOKEN_KEY, token);
                localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
                updateProfileButton();
                await mergeGuestWatchlist();
                await loadWatchlist();
            }
            showToast("Welcome to AnimeVault!");
            setTimeout(closeAuthModal, 800);
        } catch (err) {
            setAuthMessage(signupMessage, "error", "Network error: " + err.message);
        }
    }

    async function handleLogout() {
        try { await apiFetch(API.logout, { method: "POST" }); } catch { /* ignore */ }
        logoutLocal();
        watchlist = [];
        renderWatchlist();
        showToast("Logged out");
    }

    function setAuthMessage(el, type, msg) {
        el.className = "auth-message " + type;
        el.textContent = msg;
    }
    function clearAuthErrors(formId) {
        const form = document.getElementById(formId);
        form.querySelectorAll(".form-error").forEach((e) => (e.textContent = ""));
        const m = form.querySelector(".auth-message");
        if (m) { m.className = "auth-message"; m.textContent = ""; }
    }

    function openAuthModal(mode = "login") {
        authModal.classList.add("active");
        authModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        switchAuthTab(mode);
    }
    function closeAuthModal() {
        authModal.classList.remove("active");
        authModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }
    function switchAuthTab(mode) {
        authTabs.forEach((t) => t.classList.toggle("active", t.dataset.authTab === mode));
        if (mode === "login") {
            loginForm.style.display = "flex";
            signupForm.style.display = "none";
            authModalTitle.textContent = "Welcome back";
            authHeaderP.textContent = "Sign in to sync your watchlist";
            authSwitchText.innerHTML = 'Don\'t have an account? <button type="button" data-auth-switch="signup">Sign up</button>';
        } else {
            loginForm.style.display = "none";
            signupForm.style.display = "flex";
            authModalTitle.textContent = "Create account";
            authHeaderP.textContent = "Join AnimeVault to save your watchlist";
            authSwitchText.innerHTML = 'Already have an account? <button type="button" data-auth-switch="login">Log in</button>';
        }
        const btn = authSwitchText.querySelector("[data-auth-switch]");
        if (btn) btn.addEventListener("click", () => switchAuthTab(btn.dataset.authSwitch));
    }

    const fetchSuggestions = debounce(async (q) => {
        if (!q || q.length < 2) { searchSuggestions.classList.remove("active"); return; }
        try {
            const res = await apiFetch(API.search + "?q=" + encodeURIComponent(q));
            const items = (res.data || []).slice(0, 6).map(normalizeMedia).filter(Boolean);
            if (!items.length) { searchSuggestions.classList.remove("active"); return; }
            searchSuggestions.innerHTML = items.map((it) => `
                <button type="button" class="suggestion-item" data-suggestion-id="${it.anilist_id}">
                    <img src="${it.poster_url}" alt="${it.title}">
                    <span>${it.title}</span>
                </button>
            `).join("");
            searchSuggestions.classList.add("active");
            searchSuggestions.querySelectorAll(".suggestion-item").forEach((el) => {
                el.addEventListener("click", () => {
                    const id = el.dataset.suggestionId;
                    const anime = items.find((a) => String(a.anilist_id) === String(id));
                    if (anime) {
                        animeSearch.value = anime.title;
                        searchSuggestions.classList.remove("active");
                        openAnimeModal(anime);
                    }
                });
            });
        } catch { searchSuggestions.classList.remove("active"); }
    }, 300);

    function init() {
        window.addEventListener("load", () => {
            if (pageLoader) setTimeout(() => pageLoader.classList.add("hidden"), 500);
        });

        if (mobileMenuButton && mobileNavigation) {
            mobileMenuButton.addEventListener("click", () => {
                mobileNavigation.classList.toggle("active");
            });
            mobileNavigation.querySelectorAll("a").forEach((a) => {
                a.addEventListener("click", () => mobileNavigation.classList.remove("active"));
            });
        }

        if (headerSearchButton) {
            headerSearchButton.addEventListener("click", () => {
                $("home")?.scrollIntoView({ behavior: "smooth" });
                setTimeout(() => animeSearch?.focus(), 400);
            });
        }

        if (profileButton) {
            profileButton.addEventListener("click", () => {
                if (currentUser) {
                    if (confirm("Logged in as " + (currentUser.username || currentUser.email) + ".\n\nOK = Log out")) {
                        handleLogout();
                    }
                } else {
                    openAuthModal("login");
                }
            });
        }

        exploreButton        && exploreButton.addEventListener("click", () => $("discover")?.scrollIntoView({ behavior: "smooth" }));
        heroWatchlistButton  && heroWatchlistButton.addEventListener("click", () => $("watchlist")?.scrollIntoView({ behavior: "smooth" }));
        emptyWatchlistButton && emptyWatchlistButton.addEventListener("click", () => $("discover")?.scrollIntoView({ behavior: "smooth" }));

        trendingButton && trendingButton.addEventListener("click", () => {
            trendingButton.classList.add("active");
            topRatedButton.classList.remove("active");
            currentView = "trending";
            loadAnime(false);
        });
        topRatedButton && topRatedButton.addEventListener("click", () => {
            topRatedButton.classList.add("active");
            trendingButton.classList.remove("active");
            currentView = "topRated";
            loadAnime(false);
        });

        loadMoreButton && loadMoreButton.addEventListener("click", () => showToast("Pagination coming soon"));

        function performSearch() {
            const q = animeSearch.value.trim();
            if (!q) {
                currentView = "trending";
                trendingButton.classList.add("active");
                topRatedButton.classList.remove("active");
                loadAnime(false);
                return;
            }
            currentView = "search";
            currentSearchQuery = q;
            trendingButton.classList.remove("active");
            topRatedButton.classList.remove("active");
            loadAnime(false);
            $("discover")?.scrollIntoView({ behavior: "smooth" });
            searchSuggestions.classList.remove("active");
        }
        searchButton && searchButton.addEventListener("click", performSearch);
        animeSearch && animeSearch.addEventListener("keydown", (e) => {
            if (e.key === "Enter") { e.preventDefault(); performSearch(); }
        });
        animeSearch && animeSearch.addEventListener("input", (e) => fetchSuggestions(e.target.value.trim()));
        document.addEventListener("click", (e) => {
            if (searchWrapper && !searchWrapper.contains(e.target)) searchSuggestions.classList.remove("active");
        });

        clearWatchlistButton && clearWatchlistButton.addEventListener("click", () => {
            if (watchlist.length === 0) return;
            if (confirm("Clear all saved anime?")) clearWatchlist();
        });

        modalClose && modalClose.addEventListener("click", closeAnimeModal);
        animeDetailsModal && animeDetailsModal.querySelector(".anime-modal-backdrop").addEventListener("click", closeAnimeModal);

        modalWatchlistBtn && modalWatchlistBtn.addEventListener("click", async () => {
            const data = modalWatchlistBtn._animeData;
            if (!data) return;
            if (isInWatchlist(data.anilist_id)) {
                await removeFromWatchlist(data.anilist_id);
            } else {
                await addToWatchlist(data);
            }
            const nowIn = isInWatchlist(data.anilist_id);
            modalWatchlistBtn.textContent = nowIn ? "✓ In Watchlist" : "+ Add to Watchlist";
        });

        if (authModal) {
            authModal.querySelectorAll("[data-auth-close]").forEach((el) => {
                el.addEventListener("click", closeAuthModal);
            });
        }

        authTabs.forEach((t) => t.addEventListener("click", () => switchAuthTab(t.dataset.authTab)));
        loginForm  && loginForm.addEventListener("submit", handleLogin);
        signupForm && signupForm.addEventListener("submit", handleSignup);

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (animeDetailsModal?.classList.contains("active")) closeAnimeModal();
                if (authModal?.classList.contains("active")) closeAuthModal();
                searchSuggestions?.classList.remove("active");
            }
        });

        window.addEventListener("scroll", () => {
            backToTop?.classList.toggle("show", window.scrollY > 600);
        });
        backToTop && backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

        loadCurrentUser().then(() => loadWatchlist());
        currentView = "trending";
        loadAnime(false);
    }

    init();
})();