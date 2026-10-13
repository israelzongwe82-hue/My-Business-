"use strict";

/* =========================================================
   MY BUSINESS
   Gestion commerciale hors ligne
   Créateur : KIBWE ZONGWE Israël
   ========================================================= */

const APP_NAME = "My Business";

const STORAGE_PREFIX = "myBusiness_v1_";
const SETTINGS_KEY = STORAGE_PREFIX + "settings";
const ACTIVE_MODE_KEY = STORAGE_PREFIX + "activeMode";

const MODES = {
    petit: {
        fr: "Petit commerce",
        en: "Small shop"
    },

    general: {
        fr: "Commerce général",
        en: "General commerce"
    },

    entreprise: {
        fr: "Gestion complète d'entreprise",
        en: "Complete business management"
    },

    universel: {
        fr: "Application universelle",
        en: "Universal application"
    }
};

const DEFAULT_SETTINGS = {
    color: "#1565c0",
    textSize: 100,
    appearance: "auto",
    language: "fr"
};

let settings = loadSettings();

let activeMode = localStorage.getItem(ACTIVE_MODE_KEY) || "";

let currentPage = "homePage";

let pageHistory = [];

let splashTimer = null;

let lastFocusedElement = null;


/* =========================================================
   OUTILS GÉNÉRAUX
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function today() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value + "T12:00:00");

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(
        settings.language === "en" ? "en-GB" : "fr-FR"
    ).format(date);
}

function formatDateTime(value) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat(
        settings.language === "en" ? "en-GB" : "fr-FR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    ).format(new Date(value));
}

function money(amount, currency) {
    const value = Number(amount) || 0;

    try {
        return new Intl.NumberFormat(
            settings.language === "en" ? "en-US" : "fr-FR",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        ).format(value) + " " + (currency || "CDF");
    } catch {
        return value.toFixed(2) + " " + (currency || "CDF");
    }
}

function showMessage(message) {
    let box = $("appMessage");

    if (!box) {
        box = document.createElement("div");

        box.id = "appMessage";

        box.setAttribute("role", "status");

        box.setAttribute("aria-live", "polite");

        box.style.position = "fixed";
        box.style.left = "12px";
        box.style.right = "12px";
        box.style.bottom = "20px";
        box.style.zIndex = "99999";
        box.style.padding = "14px";
        box.style.borderRadius = "12px";
        box.style.background = "#1565c0";
        box.style.color = "#ffffff";
        box.style.boxShadow = "0 4px 16px #0003";
        box.style.textAlign = "center";

        document.body.appendChild(box);
    }

    box.textContent = message;

    box.hidden = false;

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {
        box.hidden = true;
    }, 3500);
}

function confirmAction(message) {
    return window.confirm(message);
}


/*
=========================================================
   PARAMÈTRES ET SAUVEGARDE
   ========================================================= */

function loadSettings() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(SETTINGS_KEY)
        );

        return {
            ...DEFAULT_SETTINGS,
            ...(saved || {})
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings() {
    try {
        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(settings)
        );

        return true;
    } catch {
        showMessage(
            "Impossible d'enregistrer les paramètres sur cet appareil."
        );

        return false;
    }
}

function applySettings() {
    document.documentElement.style.setProperty(
        "--primary",
        settings.color
    );

    document.documentElement.style.setProperty(
        "--primary-color",
        settings.color
    );

    document.documentElement.style.setProperty(
        "--font-scale",
        Number(settings.textSize) / 100
    );

    document.documentElement.lang = settings.language;

    const dark = settings.appearance === "dark" ||
        (
            settings.appearance === "auto" &&
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        );

    document.body.classList.toggle("dark-mode", Boolean(dark));

    if ($("themeColor")) {
        $("themeColor").value = settings.color;
    }

    if ($("textSize")) {
        $("textSize").value = settings.textSize;
    }

    if ($("appearanceMode")) {
        $("appearanceMode").value = settings.appearance;
    }

    if ($("languageSelect")) {
        $("languageSelect").value = settings.language;
    }

    updateTextSizeLabel();
}

function updateTextSizeLabel() {
    const label = $("textSizeLabel");

    if (!label) {
        return;
    }

    const size = Number(settings.textSize);

    if (settings.language === "en") {
        label.textContent = size < 100
            ? "Small text"
            : size === 100
                ? "Normal text"
                : size <= 125
                    ? "Large text"
                    : "Very large text";
    } else {
        label.textContent = size < 100
            ? "Texte réduit"
            : size === 100
                ? "Taille normale"
                : size <= 125
                    ? "Texte agrandi"
                    : "Texte très agrandi";
    }

    label.textContent += ` (${size} %)`;
}

function setupSettings() {
    $("themeColor")?.addEventListener("input", event => {
        settings.color = event.target.value;

        applySettings();

        saveSettings();
    });

    $("textSize")?.addEventListener("input", event => {
        settings.textSize = Number(event.target.value);

        applySettings();

        saveSettings();
    });

    $("appearanceMode")?.addEventListener("change", event => {
        settings.appearance = event.target.value;

        applySettings();

        saveSettings();
    });

    $("languageSelect")?.addEventListener("change", event => {
        settings.language = event.target.value;

        applySettings();

        saveSettings();

        updateHome();

        if (currentPage === "featurePage") {
            renderCurrentFeature();
        }
    });

    $("resetAppearanceButton")?.addEventListener("click", () => {
        if (!confirmAction(
            "Réinitialiser la couleur, la taille du texte et l'apparence ?"
        )) {
            return;
        }

        settings.color = DEFAULT_SETTINGS.color;
        settings.textSize = DEFAULT_SETTINGS.textSize;
        settings.appearance = DEFAULT_SETTINGS.appearance;

        applySettings();

        saveSettings();

        showMessage("L'apparence a été réinitialisée.");
    });

    window.matchMedia?.("(prefers-color-scheme: dark)")
        .addEventListener?.("change", () => {
            if (settings.appearance === "auto") {
                applySettings();
            }
        });
}


/*
=========================================================
   DONNÉES INDÉPENDANTES POUR CHAQUE COMMERCE
   ========================================================= */

function emptyBusinessData() {
    return {
        profile: null,

        products: [],

        sales: [],

        expenses: [],

        history: []
    };
}

function storageKeyForMode(mode) {
    return STORAGE_PREFIX + "data_" + mode;
}

function loadBusinessData(mode = activeMode) {
    if (!MODES[mode]) {
        return emptyBusinessData();
    }

    try {
        const saved = JSON.parse(
            localStorage.getItem(storageKeyForMode(mode))
        );

        if (!saved || typeof saved !== "object") {
            return emptyBusinessData();
        }

        return {
            ...emptyBusinessData(),
            ...saved,

            products: Array.isArray(saved.products)
                ? saved.products
                : [],

            sales: Array.isArray(saved.sales)
                ? saved.sales
                : [],

            expenses: Array.isArray(saved.expenses)
                ? saved.expenses
                : [],

            history: Array.isArray(saved.history)
                ? saved.history
                : []
        };
    } catch {
        return emptyBusinessData();
    }
}

function saveBusinessData(data, mode = activeMode) {
    if (!MODES[mode]) {
        return false;
    }

    try {
        localStorage.setItem(
            storageKeyForMode(mode),
            JSON.stringify(data)
        );

        return true;
    } catch {
        showMessage(
            "Enregistrement impossible. Vérifiez l'espace disponible."
        );

        return false;
    }
}

function getBusinessData() {
    return loadBusinessData(activeMode);
}

function updateBusinessData(callback) {
    const data = getBusinessData();

    callback(data);

    return saveBusinessData(data);
}

function addHistory(data, action, description, amount = 0) {
    data.history.unshift({
        id: makeId(),
        action,
        description,
        amount: Number(amount) || 0,
        date: new Date().toISOString()
    });

    if (data.history.length > 2000) {
        data.history.length = 2000;
    }
}


/* =========================================================
   NAVIGATION ENTRE LES PAGES
   ========================================================= */

function showPage(pageId, remember = true) {
    const target = $(pageId);

    if (!target) {
        return;
    }

    if (remember && currentPage !== pageId) {
        pageHistory.push(currentPage);
    }

    document.querySelectorAll("#appContent > section")
        .forEach(section => {
            section.hidden = section.id !== pageId;
        });

    currentPage = pageId;

    if ($("backContainer")) {
        $("backContainer").hidden = pageId === "homePage";
    }

    if (pageId !== "homePage") {
        closeBusinessMenu();
    }

    if (pageId === "homePage") {
        updateHome();
    }

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });

    if (pageId === "featurePage") {
        renderCurrentFeature();
    }

    if (pageId === "settingsPage") {
        applySettings();
    }

    if (pageId === "aboutPage") {
        updateAboutPage();
    }
}

function goBack() {
    if (!$("businessMenu").hidden) {
        closeBusinessMenu();
        return;
    }

    if (currentPage === "profilePage") {
        showPage("homePage", false);
        return;
    }

    if (pageHistory.length > 0) {
        const previousPage = pageHistory.pop();

        showPage(previousPage, false);

        return;
    }

    if (currentPage !== "homePage") {
        showPage("homePage", false);

        return;
    }

    showMessage(
        settings.language === "en"
            ? "You are already on the home page."
            : "Vous êtes déjà sur la page d'accueil."
    );
}

function setupNavigation() {
    $("backButton")?.addEventListener("click", goBack);

    $("settingsButton")?.addEventListener("click", () => {
        showPage("settingsPage");
    });

    $("aboutButton")?.addEventListener("click", () => {
        showPage("aboutPage");
    });

    window.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            if (!$("businessMenu").hidden) {
                closeBusinessMenu();
            } else if (currentPage !== "homePage") {
                goBack();
            }
        }
    });

    /*
     * Permet au bouton Retour d'Android et à l'historique
     * du navigateur de ramener l'utilisateur à la page précédente.
     */
    history.replaceState(
        { myBusiness: true, page: "homePage" },
        "",
        location.href
    );

    window.addEventListener("popstate", () => {
        goBack();

        history.pushState(
            { myBusiness: true, page: currentPage },
            "",
            location.href
        );
    });
}


/*
=========================================================
   MENU DES QUATRE MODES
   ========================================================= */

function openBusinessMenu() {
    $("businessMenu").hidden = false;

    lastFocusedElement = document.activeElement;

    $("closeBusinessMenu")?.focus();
}

function closeBusinessMenu() {
    $("businessMenu").hidden = true;

    if (lastFocusedElement?.focus) {
        lastFocusedElement.focus();
    }
}

function setupBusinessMenu() {
    $("businessMenuButton")?.addEventListener("click", () => {
        if ($("businessMenu").hidden) {
            openBusinessMenu();
        } else {
            closeBusinessMenu();
        }
    });

    $("closeBusinessMenu")?.addEventListener(
        "click",
        closeBusinessMenu
    );

    document.querySelectorAll("[data-mode]").forEach(button => {
        button.addEventListener("click", () => {
            selectBusinessMode(button.dataset.mode);
        });
    });
}

function selectBusinessMode(mode) {
    if (!MODES[mode]) {
        return;
    }

    if (mode === activeMode) {
        closeBusinessMenu();

        if (getBusinessData().profile) {
            showPage("homePage");
        } else {
            showPage("profilePage");
        }

        return;
    }

    if (activeMode && MODES[activeMode]) {
        const message = settings.language === "en"
            ? "Switch to another business? The data of each business remains separate."
            : "Changer de commerce ? Les données de chaque commerce resteront séparées.";

        if (!confirmAction(message)) {
            return;
        }
    }

    activeMode = mode;

    localStorage.setItem(ACTIVE_MODE_KEY, mode);

    closeBusinessMenu();

    pageHistory = [];

    const data = getBusinessData();

    if (!data.profile) {
        prepareProfileForm();

        showPage("profilePage");
    } else {
        showPage("homePage");
    }

    updateHome();
}


/* =========================================================
   PROFIL DU COMMERCE
   ========================================================= */

function prepareProfileForm() {
    const data = getBusinessData();

    const profile = data.profile || {};

    const form = $("businessProfileForm");

    if (!form) {
        return;
    }

    form.reset();

    const fields = [
        "ownerName",
        "ownerPostname",
        "ownerFirstname",
        "ownerBirthdate",
        "ownerCountry",
        "ownerPhone",
        "businessName",
        "businessActivity",
        "businessAddress",
        "businessCurrency"
    ];

    fields.forEach(id => {
        const input = $(id);

        if (input && profile[id] !== undefined) {
            input.value = profile[id];
        }
    });

    if (!$("businessCurrency").value) {
        $("businessCurrency").value = "CDF";
    }
}

function setupProfileForm() {
    $("businessProfileForm")?.addEventListener(
        "submit",
        event => {
            event.preventDefault();

            if (!activeMode || !MODES[activeMode]) {
                showMessage(
                    "Choisissez d'abord votre type de commerce."
                );

                openBusinessMenu();

                return;
            }

            const form = event.currentTarget;

            if (!form.reportValidity()) {
                return;
            }

            const data = getBusinessData();

            const profile = {};

            [
                "ownerName",
                "ownerPostname",
                "ownerFirstname",
                "ownerBirthdate",
                "ownerCountry",
                "ownerPhone",
                "businessName",
                "businessActivity",
                "businessAddress",
                "businessCurrency"
            ].forEach(id => {
                profile[id] = $(id).value.trim();
            });

            data.profile = profile;

            addHistory(
                data,
                "profile",
                "Création ou mise à jour du profil commercial"
            );

            if (!saveBusinessData(data)) {
                return;
            }

            pageHistory = [];

            showPage("homePage");

            updateHome();

            showMessage(
                settings.language === "en"
                    ? "Business profile saved successfully."
                    : "Profil du commerce enregistré avec succès."
            );
        }
    );

    $("cancelProfileButton")?.addEventListener("click", () => {
        if (getBusinessData().profile) {
            showPage("homePage");
        } else {
            showPage("homePage", false);

            showMessage(
                "Vous pourrez créer votre profil en sélectionnant votre commerce."
            );
        }
    });
}


/* =========================================================
   ACCUEIL
   ========================================================= */

function updateHome() {
    const data = getBusinessData();

    const selected = $("selectedBusiness");

    if (selected) {
        if (data.profile) {
            selected.textContent =
                (settings.language === "en" ? "Selected business: " : "Commerce sélectionné : ") +
                data.profile.businessName +
                " — " +
                MODES[activeMode][settings.language];
        } else if (activeMode && MODES[activeMode]) {
            selected.textContent =
                (settings.language === "en" ? "Selected mode: " : "Mode sélectionné : ") +
                MODES[activeMode][settings.language] +
                ". " +
                (settings.language === "en"
                    ? "Create your business profile to continue."
                    : "Créez votre profil commercial pour continuer.");
        } else {
            selected.textContent =
                settings.language === "en"
                    ? "No business selected."
                    : "Aucun commerce sélectionné.";
        }
    }

    const startButton = $("startButton");

    if (startButton) {
        startButton.textContent = settings.language === "en"
            ? "🚀 Start"
            : "🚀 Commencer";
    }

    if (settings.language === "en") {
        const labels = {
            productsButton: "📦 My products",
            salesButton: "💰 My sales",
            expensesButton: "💸 My expenses",
            stockButton: "📊 My stock",
            profitsButton: "📈 My profits",
            historyButton: "📅 History"
        };

        Object.entries(labels).forEach(([id, text]) => {
            if ($(id)) {
                $(id).textContent = text;
            }
        });
    } else {
        const labels = {
            productsButton: "📦 Mes produits",
            salesButton: "💰 Mes ventes",
            expensesButton: "💸 Mes dépenses",
            stockButton: "📊 Mon stock",
            profitsButton: "📈 Mes bénéfices",
            historyButton: "📅 Historique"
        };

        Object.entries(labels).forEach(([id, text]) => {
            if ($(id)) {
                $(id).textContent = text;
            }
        });
    }
}

function requireBusiness() {
    if (!activeMode || !MODES[activeMode]) {
        showMessage(
            settings.language === "en"
                ? "Please choose a business type first."
                : "Veuillez d'abord choisir votre type de commerce."
        );

        openBusinessMenu();

        return false;
    }

    if (!getBusinessData().profile) {
        prepareProfileForm();

        showPage("profilePage");

        return false;
    }

    return true;
}

function setupHomeButtons() {
    $("startButton")?.addEventListener("click", () => {
        if (!activeMode || !MODES[activeMode]) {
            openBusinessMenu();
            return;
        }

        if (!getBusinessData().profile) {
            prepareProfileForm();

            showPage("profilePage");

            return;
        }

        showFeature("dashboard");
    });

    $("productsButton")?.addEventListener("click", () => {
        showFeature("products");
    });

    $("salesButton")?.addEventListener("click", () => {
        showFeature("sales");
    });

    $("expensesButton")?.addEventListener("click", () => {
        showFeature("expenses");
    });

    $("stockButton")?.addEventListener("click", () => {
        showFeature("stock");
    });

    $("profitsButton")?.addEventListener("click", () => {
        showFeature("profits");
    });

    $("historyButton")?.addEventListener("click", () => {
        showFeature("history");
    });
}


/*
=========================================================
   FONCTIONNALITÉS
   ========================================================= */

let currentFeature = "dashboard";

function showFeature(feature) {
    if (!requireBusiness()) {
        return;
    }

    currentFeature = feature;

    showPage("featurePage");
}

function textFor(fr, en) {
    return settings.language === "en" ? en : fr;
}

function renderCurrentFeature() {
    const title = $("featureTitle");

    const content = $("featureContent");

    if (!title || !content) {
        return;
    }

    if (!requireBusinessForRender()) {
        return;
    }

    const renderers = {
        dashboard: renderDashboard,
        products: renderProducts,
        sales: renderSales,
        expenses: renderExpenses,
        stock: renderStock,
        profits: renderProfits,
        history: renderHistory
    };

    (renderers[currentFeature] || renderDashboard)(title, content);
}

function requireBusinessForRender() {
    const data = getBusinessData();

    if (!activeMode || !MODES[activeMode] || !data.profile) {
        showPage("homePage", false);

        return false;
    }

    return true;
}

function featureHeader(titleText, description) {
    return `
        <div class="feature-heading">
            <h3>${escapeHTML(titleText)}</h3>
            <p>${escapeHTML(description || "")}</p>
        </div>
    `;
}

function actionButton(id, text) {
    return `
        <button type="button" id="${id}">
            ${escapeHTML(text)}
        </button>
    `;
}

function formField(label, id, type = "text", options = {}) {
    const required = options.required === false ? "" : "required";

    if (type === "select") {
        const choices = options.choices || [];

        return `
            <label for="${id}">${escapeHTML(label)}</label>
            <select id="${id}" ${required}>
                ${choices.map(choice => `
                    <option value="${escapeHTML(choice.value)}">
                        ${escapeHTML(choice.label)}
                    </option>
                `).join("")}
            </select>
        `;
    }

    return `
        <label for="${id}">${escapeHTML(label)}</label>
        <input
            id="${id}"
            type="${type}"
            ${required}
            ${options.min !== undefined ? `min="${options.min}"` : ""}
            ${options.step !== undefined ? `step="${options.step}"` : ""}
            ${options.placeholder ? `placeholder="${escapeHTML(options.placeholder)}"` : ""}
        >
    `;
}

function renderDashboard(title, content) {
    const data = getBusinessData();

    const currency = data.profile.businessCurrency;

    const revenue = data.sales.reduce(
        (sum, sale) => sum + Number(sale.total),
        0
    );

    const expenses = data.expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
    );

    const costOfGoods = data.sales.reduce(
        (sum, sale) => sum + Number(sale.costTotal || 0),
        0
    );

    const profit = revenue - expenses - costOfGoods;

    title.textContent = textFor(
        "Tableau de bord",
        "Dashboard"
    );

    content.innerHTML = `
        ${featureHeader(
            data.profile.businessName,
            textFor(
                "Voici le résumé de votre activité commerciale.",
                "Here is your business summary."
            )
        )}

        <div class="data-grid">
            <article class="data-card">
                <h3>${textFor("Produits", "Products")}</h3>
                <p>${data.products.length}</p>
            </article>

            <article class="data-card">
                <h3>${textFor("Ventes", "Sales")}</h3>
                <p>${data.sales.length}</p>
            </article>

            <article class="data-card">
                <h3>${textFor("Recettes", "Revenue")}</h3>
                <p>${escapeHTML(money(revenue, currency))}</p>
            </article>

            <article class="data-card">
                <h3>${textFor("Dépenses", "Expenses")}</h3>
                <p>${escapeHTML(money(expenses, currency))}</p>
            </article>

            <article class="data-card">
                <h3>${textFor("Bénéfice estimé", "Estimated profit")}</h3>
                <p>${escapeHTML(money(profit, currency))}</p>
            </article>
        </div>

        <h3>${textFor("Actions rapides", "Quick actions")}</h3>

        <div class="home-buttons">
            ${actionButton("dashProducts", "📦 " + textFor("Ajouter un produit", "Add a product"))}
            ${actionButton("dashSales", "💰 " + textFor("Enregistrer une vente", "Record a sale"))}
            ${actionButton("dashExpenses", "💸 " + textFor("Ajouter une dépense", "Add an expense"))}
        </div>
    `;

    $("dashProducts")?.addEventListener("click", () => showFeature("products"));

    $("dashSales")?.addEventListener("click", () => showFeature("sales"));

    $("dashExpenses")?.addEventListener("click", () => showFeature("expenses"));
}


/* =========================================================
   PRODUITS
   ========================================================= */

function renderProducts(title, content) {
    const data = getBusinessData();

    title.textContent = textFor(
        "Gestion des produits",
        "Product management"
    );

    content.innerHTML = `
        ${featureHeader(
            textFor("Ajouter un produit", "Add a product"),
            textFor(
                "Enregistrez les produits que vous vendez et leur stock initial.",
                "Register the products you sell and their initial stock."
            )
        )}

        <form id="productForm" class="data-form">
            ${formField(
                textFor("Nom du produit", "Product name"),
                "productName"
            )}

            ${formField(
                textFor("Référence (facultatif)", "Reference (optional)"),
                "productReference",
                "text",
                { required: false }
            )}

            ${formField(
                textFor("Prix d'achat unitaire", "Unit purchase price"),
                "productCost",
                "number",
                { min: 0, step: "any" }
            )}

            ${formField(
                textFor("Prix de vente unitaire", "Unit selling price"),
                "productPrice",
                "number",
                { min: 0, step: "any" }
            )}

            ${formField(
                textFor("Quantité initiale", "Initial quantity"),
                "productQuantity",
                "number",
                { min: 0, step: 1 }
            )}

            ${formField(
                textFor("Seuil d'alerte du stock", "Low-stock alert threshold"),
                "productAlert",
                "number",
                { min: 0, step: 1 }
            )}

            <button type="submit">
                ➕ ${textFor("Enregistrer le produit", "Save product")}
            </button>
        </form>

        <h3>${textFor("Liste des produits", "Product list")}</h3>

        <div class="data-list">
            ${data.products.length
                ? data.products.map(product => productCard(product, data.profile.businessCurrency)).join("")
                : `<p>${textFor("Aucun produit enregistré.", "No products registered.")}</p>`
            }
        </div>
    `;

    $("productForm")?.addEventListener("submit", event => {
        event.preventDefault();

        const name = $("productName").value.trim();

        const cost = Number($("productCost").value);

        const price = Number($("productPrice").value);

        const quantity = Number($("productQuantity").value);

        const alert = Number($("productAlert").value);

        if (!name || cost < 0 || price < 0 || quantity < 0 || alert < 0) {
            showMessage(textFor(
                "Vérifiez les informations saisies.",
                "Please check the entered information."
            ));

            return;
        }

        const latest = getBusinessData();

        const product = {
            id: makeId(),
            name,
            reference: $("productReference").value.trim(),
            cost,
            price,
            quantity,
            alert,
            createdAt: new Date().toISOString()
        };

        latest.products.push(product);

        addHistory(
            latest,
            "product_added",
            `${name} — quantité initiale : ${quantity}`
        );

        if (!saveBusinessData(latest)) {
            return;
        }

        showMessage(textFor(
            "Produit enregistré.",
            "Product saved."
        ));

        renderCurrentFeature();
    });

    content.querySelectorAll("[data-edit-product]").forEach(button => {
        button.addEventListener("click", () => {
            editProduct(button.dataset.editProduct);
        });
    });

    content.querySelectorAll("[data-delete-product]").forEach(button => {
        button.addEventListener("click", () => {
            deleteProduct(button.dataset.deleteProduct);
        });
    });
}

function productCard(product, currency) {
    return `
        <article class="data-card">
            <h3>${escapeHTML(product.name)}</h3>

            <p>
                ${textFor("Référence", "Reference")} :
                ${escapeHTML(product.reference || "—")}
            </p>

            <p>
                ${textFor("Prix d'achat", "Purchase price")} :
                ${escapeHTML(money(product.cost, currency))}
            </p>

            <p>
                ${textFor("Prix de vente", "Selling price")} :
                ${escapeHTML(money(product.price, currency))}
            </p>

            <p>
                ${textFor("Stock disponible", "Available stock")} :
                <strong>${Number(product.quantity)}</strong>
            </p>

            <p>
                ${textFor("Seuil d'alerte", "Alert threshold")} :
                ${Number(product.alert || 0)}
            </p>

            ${actionButton(
                "editProduct_" + product.id,
                "✏️ " + textFor("Modifier", "Edit")
            ).replace('id="editProduct_' + product.id + '"', 'data-edit-product="' + escapeHTML(product.id) + '"')}

            ${actionButton(
                "deleteProduct_" + product.id,
                "🗑️ " + textFor("Supprimer", "Delete")
            ).replace('id="deleteProduct_' + product.id + '"', 'data-delete-product="' + escapeHTML(product.id) + '"')}
        </article>
    `;
}

function editProduct(id) {
    const data = getBusinessData();

    const product = data.products.find(item => item.id === id);

    if (!product) {
        return;
    }

    const newName = prompt(
        textFor("Nom du produit :", "Product name:"),
        product.name
    );

    if (newName === null) {
        return;
    }

    const name = newName.trim();

    if (!name) {
        showMessage(textFor(
            "Le nom ne peut pas être vide.",
            "The name cannot be empty."
        ));

        return;
    }

    const newCost = prompt(
        textFor("Prix d'achat unitaire :", "Unit purchase price:"),
        String(product.cost)
    );

    if (newCost === null) {
        return;
    }

    const newPrice = prompt(
        textFor("Prix de vente unitaire :", "Unit selling price:"),
        String(product.price)
    );

    if (newPrice === null) {
        return;
    }

    const cost = Number(newCost);

    const price = Number(newPrice);

    if (
        !Number.isFinite(cost) ||
        !Number.isFinite(price) ||
        cost < 0 ||
        price < 0
    ) {
        showMessage(textFor(
            "Les prix doivent être des nombres positifs ou nuls.",
            "Prices must be non-negative numbers."
        ));

        return;
    }

    product.name = name;

    product.cost = cost;

    product.price = price;

    addHistory(
        data,
        "product_updated",
        `Produit modifié : ${name}`
    );

    if (saveBusinessData(data)) {
        showMessage(textFor(
            "Produit modifié.",
            "Product updated."
        ));

        renderCurrentFeature();
    }
}

function deleteProduct(id) {
    const data = getBusinessData();

    const product = data.products.find(item => item.id === id);

    if (!product) {
        return;
    }

    if (data.sales.some(sale => sale.productId === id)) {
        showMessage(textFor(
            "Ce produit apparaît dans l'historique des ventes. Conservez-le pour préserver vos comptes.",
            "This product appears in sales history. Keep it to preserve your records."
        ));

        return;
    }

    if (!confirmAction(
        textFor(
            `Supprimer le produit « ${product.name} » ?`,
            `Delete product "${product.name}"?`
        )
    )) {
        return;
    }

    data.products = data.products.filter(item => item.id !== id);

    addHistory(
        data,
        "product_deleted",
        `Produit supprimé : ${product.name}`
    );

    if (saveBusinessData(data)) {
        showMessage(textFor(
            "Produit supprimé.",
            "Product deleted."
        ));

        renderCurrentFeature();
    }
}


/*
=========================================================
   VENTES
   ========================================================= */

function renderSales(title, content) {
    const data = getBusinessData();

    const currency = data.profile.businessCurrency;

    title.textContent = textFor(
        "Enregistrement des ventes",
        "Record sales"
    );

    content.innerHTML = `
        ${featureHeader(
            textFor("Nouvelle vente", "New sale"),
            textFor(
                "Choisissez un produit et indiquez la quantité vendue. Le stock sera mis à jour automatiquement.",
                "Choose a product and enter the quantity sold. Stock will update automatically."
            )
        )}

        <form id="saleForm" class="data-form">

            ${formField(
                textFor("Produit", "Product"),
                "saleProduct",
                "select",
                {
                    choices: [
                        {
                            value: "",
                            label: textFor("Choisissez un produit", "Choose a product")
                        },
                        ...data.products.map(product => ({
                            value: product.id,
                            label: `${product.name} — stock : ${product.quantity}`
                        }))
                    ]
                }
            )}

            ${formField(
                textFor("Quantité vendue", "Quantity sold"),
                "saleQuantity",
                "number",
                { min: 1, step: 1 }
            )}

            ${formField(
                textFor("Remarque (facultatif)", "Note (optional)"),
                "saleNote",
                "text",
                { required: false }
            )}

            <button type="submit">
                💰 ${textFor("Enregistrer la vente", "Record sale")}
            </button>
        </form>

        <h3>${textFor("Dernières ventes", "Recent sales")}</h3>

        <div class="data-list">
            ${data.sales.length
                ? data.sales.slice(0, 100).map(sale => `
                    <article class="data-card">
                        <h3>${escapeHTML(sale.productName)}</h3>
                        <p>${textFor("Quantité", "Quantity")} : ${sale.quantity}</p>
                        <p>${textFor("Total", "Total")} : ${escapeHTML(money(sale.total, currency))}</p>
                        <p>${formatDateTime(sale.date)}</p>
                        <p>${escapeHTML(sale.note || "")}</p>
                    </article>
                `).join("")
                : `<p>${textFor("Aucune vente enregistrée.", "No sales recorded.")}</p>`
            }
        </div>
    `;

    $("saleForm")?.addEventListener("submit", event => {
        event.preventDefault();

        const productId = $("saleProduct").value;

        const quantity = Number($("saleQuantity").value);

        const latest = getBusinessData();

        const product = latest.products.find(item => item.id === productId);

        if (!product) {
            showMessage(textFor(
                "Choisissez un produit valide.",
                "Choose a valid product."
            ));

            return;
        }

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            showMessage(textFor(
                "La quantité doit être un nombre entier positif.",
                "Quantity must be a positive whole number."
            ));

            return;
        }

        if (quantity > Number(product.quantity)) {
            showMessage(textFor(
                "Stock insuffisant pour cette vente.",
                "Not enough stock for this sale."
            ));

            return;
        }

        const total = Number(product.price) * quantity;

        const costTotal = Number(product.cost) * quantity;

        product.quantity = Number(product.quantity) - quantity;

        const sale = {
            id: makeId(),
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: Number(product.price),
            unitCost: Number(product.cost),
            total,
            costTotal,
            note: $("saleNote").value.trim(),
            date: new Date().toISOString()
        };

        latest.sales.unshift(sale);

        addHistory(
            latest,
            "sale",
            `${quantity} × ${product.name}`,
            total
        );

        if (!saveBusinessData(latest)) {
            return;
        }

        showMessage(
            textFor("Vente enregistrée : ", "Sale recorded: ") +
            money(total, currency)
        );

        renderCurrentFeature();
    });
}


/* =========================================================
   DÉPENSES
   ========================================================= */

function renderExpenses(title, content) {
    const data = getBusinessData();

    const currency = data.profile.businessCurrency;

    title.textContent = textFor(
        "Gestion des dépenses",
        "Expense management"
    );

    content.innerHTML = `
        ${featureHeader(
            textFor("Nouvelle dépense", "New expense"),
            textFor(
                "Enregistrez les sommes dépensées pour votre activité commerciale.",
                "Record the money spent on your business."
            )
        )}

        <form id="expenseForm" class="data-form">

            ${formField(
                textFor("Motif de la dépense", "Expense description"),
                "expenseName"
            )}

            ${formField(
                textFor("Montant", "Amount"),
                "expenseAmount",
                "number",
                { min: 0.01, step: "any" }
            )}

            ${formField(
                textFor("Date", "Date"),
                "expenseDate",
                "date"
            )}

            ${formField(
                textFor("Remarque (facultatif)", "Note (optional)"),
                "expenseNote",
                "text",
                { required: false }
            )}

            <button type="submit">
                💸 ${textFor("Enregistrer la dépense", "Save expense")}
            </button>
        </form>

        <h3>${textFor("Dépenses enregistrées", "Recorded expenses")}</h3>

        <div class="data-list">
            ${data.expenses.length
                ? data.expenses.slice(0, 200).map(expense => `
                    <article class="data-card">
                        <h3>${escapeHTML(expense.name)}</h3>
                        <p>${escapeHTML(money(expense.amount, currency))}</p>
                        <p>${formatDate(expense.date)}</p>
                        <p>${escapeHTML(expense.note || "")}</p>
                        <button
                            type="button"
                            data-delete-expense="${escapeHTML(expense.id)}"
                        >
                            🗑️ ${textFor("Supprimer", "Delete")}
                        </button>
                    </article>
                `).join("")
                : `<p>${textFor("Aucune dépense enregistrée.", "No expenses recorded.")}</p>`
            }
        </div>
    `;

    $("expenseDate").value = today();

    $("expenseForm")?.addEventListener("submit", event => {
        event.preventDefault();

        const name = $("expenseName").value.trim();

        const amount = Number($("expenseAmount").value);

        const date = $("expenseDate").value;

        if (!name || !date || !Number.isFinite(amount) || amount <= 0) {
            showMessage(textFor(
                "Vérifiez le motif, le montant et la date.",
                "Check the description, amount and date."
            ));

            return;
        }

        const latest = getBusinessData();

        const expense = {
            id: makeId(),
            name,
            amount,
            date,
            note: $("expenseNote").value.trim(),
            createdAt: new Date().toISOString()
        };

        latest.expenses.unshift(expense);

        addHistory(
            latest,
            "expense",
            name,
            amount
        );

        if (!saveBusinessData(latest)) {
            return;
        }

        showMessage(textFor(
            "Dépense enregistrée.",
            "Expense recorded."
        ));

        renderCurrentFeature();
    });

    content.querySelectorAll("[data-delete-expense]").forEach(button => {
        button.addEventListener("click", () => {
            const id = button.dataset.deleteExpense;

            if (!confirmAction(textFor(
                "Supprimer cette dépense ?",
                "Delete this expense?"
            ))) {
                return;
            }

            const latest = getBusinessData();

            const expense = latest.expenses.find(item => item.id === id);

            if (!expense) {
                return;
            }

            latest.expenses = latest.expenses.filter(
                item => item.id !== id
            );

            addHistory(
                latest,
                "expense_deleted",
                `Dépense supprimée : ${expense.name}`,
                expense.amount
            );

            if (saveBusinessData(latest)) {
                renderCurrentFeature();
            }
        });
    });
}


/* =========================================================
   STOCK
   ========================================================= */

function renderStock(title, content) {
    const data = getBusinessData();

    const currency = data.profile.businessCurrency;

    title.textContent = textFor(
        "État du stock",
        "Stock overview"
    );

    const totalItems = data.products.reduce(
        (sum, product) => sum + Number(product.quantity),
        0
    );

    const stockValue = data.products.reduce(
        (sum, product) => sum +
            Number(product.quantity) * Number(product.cost),
        0
    );

    const lowStock = data.products.filter(
        product => Number(product.quantity) <= Number(product.alert || 0)
    );

    content.innerHTML = `
        ${featureHeader(
            textFor("Suivi des quantités", "Quantity tracking"),
            textFor(
                "Le stock diminue automatiquement lorsqu'une vente est enregistrée.",
                "Stock decreases automatically when a sale is recorded."
            )
        )}

        <div class="data-grid">
            <article class="data-card">
                <h3>${textFor("Nombre de produits", "Number of products")}</h3>
                <p>${data.products.length}</p>
            </article>

            <article class="data-card">
                <h3>${textFor("Articles en stock", "Items in stock")}</h3>
                <p>${totalItems}</p>
            </article>

            <article class="data-card">
                <h3>${textFor("Valeur d'achat du stock", "Stock purchase value")}</h3>
                <p>${escapeHTML(money(stockValue, currency))}</p>
            </article>
        </div>

        <h3>${textFor("Alertes de stock", "Stock alerts")}</h3>

        <div class="data-list">
            ${lowStock.length
                ? lowStock.map(product => `
                    <article class="data-card">
                        <h3>⚠️ ${escapeHTML(product.name)}</h3>
                        <p>${textFor("Stock restant", "Remaining stock")} : ${product.quantity}</p>
                        <p>${textFor("Seuil d'alerte", "Alert threshold")} : ${product.alert || 0}</p>
                    </article>
                `).join("")
                : `<p>${textFor("Aucune alerte de stock.", "No stock alerts.")}</p>`
            }
        </div>

        <h3>${textFor("Tous les produits", "All products")}</h3>

        <div class="data-list">
            ${data.products.length
                ? data.products.map(product => `
                    <article class="data-card">
                        <h3>${escapeHTML(product.name)}</h3>
                        <p>${textFor("Quantité", "Quantity")} : ${product.quantity}</p>
                        <p>${textFor("Prix de vente", "Selling price")} : ${escapeHTML(money(product.price, currency))}</p>
                    </article>
                `).join("")
                : `<p>${textFor("Ajoutez d'abord vos produits.", "Add your products first.")}</p>`
            }
        </div>
    `;
}


/* =========================================================
   BÉNÉFICES ET RAPPORTS
   ========================================================= */

function renderProfits(title, content) {
    const data = getBusinessData();

    const currency = data.profile.businessCurrency;

    const revenue = data.sales.reduce(
        (sum, sale) => sum + Number(sale.total),
        0
    );

    const cost = data.sales.reduce(
        (sum, sale) => sum + Number(sale.costTotal || 0),
        0
    );

    const expenses = data.expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
    );

    const grossProfit = revenue - cost;

    const netProfit = grossProfit - expenses;

    title.textContent = textFor(
        "Bénéfices et rapports",
        "Profit and reports"
    );

    content.innerHTML = `
        ${featureHeader(
            textFor("Résumé financier", "Financial summary"),
            textFor(
                "Les calculs utilisent les ventes et les dépenses enregistrées dans ce commerce.",
                "Calculations use the sales and expenses recorded for this business."
            )
        )}

        <div class="data-grid">
            <article class="data-card">
                <h3>${textFor("Recettes des ventes", "Sales revenue")}</h3>
                <p>${escapeHTML(money(revenue, currency))}</p>
            </article>

            <article class="data-card">
                <h3>${textFor("Coût des produits vendus", "Cost of goods sold")}</h3>
                <p>${escapeHTML(money(cost, currency))}</p>
            </article>

            <article class="data-card">
                <h3>${textFor("Marge brute estimée", "Estimated gross profit")}</h3>
                <p>${escapeHTML(money(grossProfit, currency))}</p>
            </article>

            <article class="data-card">
                <h3>${textFor("Dépenses", "Expenses")}</h3>
                <p>${escapeHTML(money(expenses, currency))}</p>
            </article>

            <article class="data-card">
                <h3>${textFor("Bénéfice net estimé", "Estimated net profit")}</h3>
                <p>${escapeHTML(money(netProfit, currency))}</p>
            </article>
        </div>

        <p>
            ${textFor(
                "Important : ce calcul est une estimation basée sur les données saisies. Il ne remplace pas une comptabilité complète.",
                "Important: this is an estimate based on entered data. It does not replace full accounting."
            )}
        </p>

        <button type="button" id="exportReportButton">
            📄 ${textFor("Exporter le rapport CSV", "Export CSV report")}
        </button>
    `;

    $("exportReportButton")?.addEventListener("click", exportReport);
}


/* =========================================================
   HISTORIQUE
   ========================================================= */

function renderHistory(title, content) {
    const data = getBusinessData();

    title.textContent = textFor(
        "Historique du commerce",
        "Business history"
    );

    content.innerHTML = `
        ${featureHeader(
            textFor("Activités récentes", "Recent activity"),
            textFor(
                "Consultez les opérations effectuées dans ce commerce.",
                "Review the operations performed in this business."
            )
        )}

        <button type="button" id="exportHistoryButton">
            📥 ${textFor("Exporter l'historique", "Export history")}
        </button>

        <div class="data-list">
            ${data.history.length
                ? data.history.map(item => `
                    <article class="data-card">
                        <h3>${escapeHTML(item.action)}</h3>
                        <p>${escapeHTML(item.description)}</p>
                        <p>${formatDateTime(item.date)}</p>
                        ${item.amount
                            ? `<p>${escapeHTML(money(item.amount, data.profile.businessCurrency))}</p>`
                            : ""
                        }
                    </article>
                `).join("")
                : `<p>${textFor("Aucune activité enregistrée.", "No activity recorded.")}</p>`
            }
        </div>
    `;

    $("exportHistoryButton")?.addEventListener("click", () => {
        const rows = [
            ["Date", "Action", "Description", "Montant"],

            ...data.history.map(item => [
                item.date,
                item.action,
                item.description,
                item.amount || 0
            ])
        ];

        downloadCSV(rows, "my-business-historique.csv");
    });
}


/*
=========================================================
   EXPORTATION CSV
   ========================================================= */

function downloadCSV(rows, filename) {
    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value ?? "").replace(/"/g, '""') + '"'
        ).join(";")
    ).join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

function exportReport() {
    const data = getBusinessData();

    const currency = data.profile.businessCurrency;

    const rows = [
        ["Type", "Date", "Description", "Quantité", "Montant", "Devise"],

        ...data.sales.map(sale => [
            "Vente",
            sale.date,
            sale.productName,
            sale.quantity,
            sale.total,
            currency
        ]),

        ...data.expenses.map(expense => [
            "Dépense",
            expense.date,
            expense.name,
            "",
            -Number(expense.amount),
            currency
        ])
    ];

    downloadCSV(rows, "my-business-rapport.csv");
}


/* =========================================================
   PAGE À PROPOS
   ========================================================= */

function updateAboutPage() {
    /*
     * Cette page conserve le contenu du HTML.
     * Aucune photo du créateur n'est ajoutée.
     */
}


/* =========================================================
   SAUVEGARDE ET RESTAURATION
   ========================================================= */

function exportBackup() {
    const backup = {
        application: APP_NAME,
        version: 1,
        exportedAt: new Date().toISOString(),
        settings,
        activeMode,
        businesses: {}
    };

    Object.keys(MODES).forEach(mode => {
        backup.businesses[mode] = loadBusinessData(mode);
    });

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "my-business-sauvegarde.json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

function importBackup(file) {
    const reader = new FileReader();

    reader.onload = () => {
        try {
            const backup = JSON.parse(reader.result);

            if (
                backup.application !== APP_NAME ||
                !backup.businesses ||
                typeof backup.businesses !== "object"
            ) {
                throw new Error("Invalid backup");
            }

            if (!confirmAction(
                "Importer cette sauvegarde remplacera les données locales des commerces concernés. Continuer ?"
            )) {
                return;
            }

            Object.keys(MODES).forEach(mode => {
                const data = backup.businesses[mode];

                if (data && typeof data === "object") {
                    saveBusinessData(
                        {
                            ...emptyBusinessData(),
                            ...data
                        },
                        mode
                    );
                }
            });

            if (backup.settings && typeof backup.settings === "object") {
                settings = {
                    ...DEFAULT_SETTINGS,
                    ...backup.settings
                };

                saveSettings();

                applySettings();
            }

            if (MODES[backup.activeMode]) {
                activeMode = backup.activeMode;

                localStorage.setItem(
                    ACTIVE_MODE_KEY,
                    activeMode
                );
            }

            pageHistory = [];

            showPage("homePage", false);

            updateHome();

            showMessage("Sauvegarde importée avec succès.");
        } catch {
            showMessage(
                "Fichier de sauvegarde invalide ou illisible."
            );
        }
    };

    reader.readAsText(file);
}


/* =========================================================
   SPLASH SCREEN
   ========================================================= */

function showSplashScreen() {
    const splash = document.createElement("div");

    splash.id = "appSplashScreen";

    splash.setAttribute("role", "status");

    splash.setAttribute("aria-label", "My Business");

    splash.style.position = "fixed";
    splash.style.inset = "0";
    splash.style.zIndex = "100000";
    splash.style.display = "flex";
    splash.style.flexDirection = "column";
    splash.style.alignItems = "center";
    splash.style.justifyContent = "center";
    splash.style.background = "#0d47a1";
    splash.style.color = "#ffffff";
    splash.style.textAlign = "center";
    splash.style.padding = "24px";
    splash.style.boxSizing = "border-box";
    splash.style.transition = "opacity 0.4s ease";

    const image = document.createElement("img");

    image.src = "images/splash.png";

    image.alt = "My Business";

    image.style.position = "absolute";
    image.style.inset = "0";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "cover";

    image.onerror = () => {
        image.remove();
    };

    const overlay = document.createElement("div");

    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.background = "#0d47a1aa";

    const title = document.createElement("h1");

    title.textContent = APP_NAME;

    title.style.position = "relative";
    title.style.zIndex = "1";
    title.style.fontSize = "2.2rem";
    title.style.margin = "0 0 12px";

    const subtitle = document.createElement("p");

    subtitle.textContent = textFor(
        "Votre commerce, votre organisation, votre avenir.",
        "Your business, your organization, your future."
    );

    subtitle.style.position = "relative";
    subtitle.style.zIndex = "1";
    subtitle.style.maxWidth = "400px";

    splash.append(image, overlay, title, subtitle);

    document.body.appendChild(splash);

    splashTimer = setTimeout(() => {
        splash.style.opacity = "0";

        setTimeout(() => splash.remove(), 450);
    }, 1500);
}


/* =========================================================
   INITIALISATION
   ========================================================= */

function initializeApp() {
    applySettings();

    setupSettings();

    setupNavigation();

    setupBusinessMenu();

    setupProfileForm();

    setupHomeButtons();

    /*
     * Vérifie les données avant de charger l'accueil.
     * Chaque mode conserve son propre espace de stockage.
     */
    if (!MODES[activeMode]) {
        activeMode = "";

        localStorage.removeItem(ACTIVE_MODE_KEY);
    }

    showPage("homePage", false);

    updateHome();

    showSplashScreen();

    console.log("My Business est prêt.");
}

document.addEventListener("DOMContentLoaded", initializeApp);