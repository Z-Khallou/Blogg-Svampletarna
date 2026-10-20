// ==========================================
// Mina svampar: visar de svampar besökaren har sparat
// ==========================================

// ------------------------------------------
// 1. Referenser till HTML och inställningar
// ------------------------------------------
const cardContainer = document.getElementById("card-container");
const emptyState = document.getElementById("empty-state");
const clearButton = document.getElementById("clear-button");
const errorMessage = document.getElementById("error-message");

// Nyckeln som de sparade svamparna ligger under i localStorage
const STORAGE_KEY = "savedMushrooms";

// Alla svampar från svampar.json. Filen hämtas bara en gång och sparas här.
let allMushrooms = [];

// ------------------------------------------
// 2. Hämta data
// ------------------------------------------

// Läser listan med sparade LATINSKA NAMN ur localStorage.
// Ger alltid tillbaka en lista, även om inget finns sparat eller om texten är trasig.
function getSavedNames() {
    const savedText = localStorage.getItem(STORAGE_KEY);

    if (!savedText) {
        return [];
    }

    try {
        const savedList = JSON.parse(savedText);
        if (Array.isArray(savedList)) {
            return savedList;
        }
        return [];
    } catch (error) {
        return [];
    }
}

// Hämtar alla svampar från svampar.json.
async function loadMushrooms() {
    const response = await fetch("svampar.json");

    if (!response.ok) {
        throw new Error("Kunde inte hämta svampar.json, status " + response.status);
    }

    const data = await response.json();
    return data.svampar;
}

// ------------------------------------------
// 3. Små hjälpfunktioner för att bygga kort
// ------------------------------------------

// Skapar ett element med text i och eventuell CSS-klass
function createTextElement(tagName, text, className) {
    const element = document.createElement(tagName);
    element.textContent = text;
    if (className) {
        element.classList.add(className);
    }
    return element;
}

// Fältet "ätlig" är en lång text, till exempel "Ätlig – en av de bästa...".
// Vi tittar bara på hur texten börjar.
function getEdibility(edibleText) {
    if (!edibleText) return "Okänd";

    if (edibleText.startsWith("Ätlig")) {
        return "Ätlig";
    }
    if (edibleText.startsWith("Dödligt giftig")) {
        return "Dödligt giftig";
    }
    if (edibleText.startsWith("Giftig")) {
        return "Giftig";
    }
    return "Okänd";
}

// Skapar etiketten med symbol och text (aldrig bara färg)
function createBadge(edibility) {
    const badge = document.createElement("span");
    badge.classList.add("badge");

    if (edibility === "Ätlig") {
        badge.textContent = "✔ Ätlig";
        badge.classList.add("badge-atlig");
    } else if (edibility === "Giftig") {
        badge.textContent = "⚠ Giftig";
        badge.classList.add("badge-giftig");
    } else if (edibility === "Dödligt giftig") {
        badge.textContent = "⚠ Dödligt giftig";
        badge.classList.add("badge-dodlig");
    } else {
        badge.textContent = "? Okänd";
    }

    return badge;
}

// Bygger ett helt svampkort med exakt samma struktur som på startsidan
function createCard(svamp) {
    const article = document.createElement("article");

    article.appendChild(createTextElement("h3", svamp.svenskt_namn));
    article.appendChild(createTextElement("p", svamp.latinskt_namn, "latin-name"));

    const image = document.createElement("img");
    image.src = "./svampar/" + svamp.bild.replace("./", "");
    image.alt = "Bild av " + svamp.svenskt_namn;
    image.loading = "lazy";
    article.appendChild(image);

    article.appendChild(createTextElement("p", svamp.beskrivning));
    article.appendChild(createTextElement("p", "Fyndplats: " + svamp.fyndplats, "location"));

    const edibility = getEdibility(svamp["ätlig"]);
    article.appendChild(createBadge(edibility));
    article.appendChild(createTextElement("p", svamp["ätlig"]));

    return article;
}

// ------------------------------------------
// 4. Visa sidan
// ------------------------------------------

// Visar tomt läge eller knappen beroende på hur många kort det finns
function updateVisibility(cardCount) {
    const hasCards = cardCount > 0;

    emptyState.hidden = hasCards;
    clearButton.hidden = !hasCards;
    errorMessage.hidden = true;
}

// Visar bara felmeddelandet (när svampar.json inte gick att hämta)
function showError() {
    errorMessage.hidden = false;
    emptyState.hidden = true;
    clearButton.hidden = true;
}

// Väljer ut, sorterar och ritar de sparade svamparna
function renderSavedMushrooms() {
    const savedNames = getSavedNames();

    // 1. Behåll bara svampar vars latinska namn finns i listan
    const savedMushrooms = allMushrooms.filter(svamp => savedNames.includes(svamp.latinskt_namn));

    // 2. Sortera alfabetiskt efter svenskt namn, med svenska bokstäver (å, ä, ö sist)
    savedMushrooms.sort((a, b) => a.svenskt_namn.localeCompare(b.svenskt_namn, "sv"));

    // 3. Rädda den osynliga rubriken och töm behållaren
    const srHeading = cardContainer.querySelector(".sr-only");
    if (srHeading) {
        cardContainer.replaceChildren(srHeading);
    } else {
        cardContainer.replaceChildren();
    }

    // Bygg ett kort per svamp
    savedMushrooms.forEach(svamp => {
        cardContainer.appendChild(createCard(svamp));
    });

    // 4. Tomt läge avgörs EFTER filtreringen: noll kort betyder tomt läge
    updateVisibility(savedMushrooms.length);
}

// ------------------------------------------
// 5. Töm-knappen
// ------------------------------------------
clearButton.addEventListener("click", () => {
    const isSure = window.confirm("Är du säker på att du vill ta bort alla dina sparade svampar?");

    if (isSure) {
        localStorage.removeItem(STORAGE_KEY);
        renderSavedMushrooms();
    }
});

// ------------------------------------------
// 6. Starta
// ------------------------------------------
async function init() {
    try {
        allMushrooms = await loadMushrooms();
        renderSavedMushrooms();
    } catch (error) {
        console.error("Kunde inte visa sparade svampar:", error);
        showError();
    }
}

init();
