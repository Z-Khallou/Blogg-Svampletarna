// ==========================================
// Mina svampar: visar de svampar besökaren har sparat
// ==========================================

const cardContainer = document.getElementById("card-container");
const emptyState = document.getElementById("empty-state");
const clearButton = document.getElementById("clear-button");
const errorMessage = document.getElementById("error-message");
const STORAGE_KEY = "savedMushrooms";

let allMushrooms = [];

// Läser listan med sparade latinska namn ur localStorage
function getSavedNames() {
    const savedText = localStorage.getItem(STORAGE_KEY);
    return savedText ? JSON.parse(savedText) : [];
}

// Skapar ett HTML-element med text och eventuell CSS-klass
function createTextElement(tagName, text, className) {
    const element = document.createElement(tagName);
    element.textContent = text;
    if (className) {
        element.classList.add(className);
    }
    return element;
}

// Skapar ätlighets-badge med EN tydlig if / else if / else-sats
function createBadge(edibleText) {
    const badge = document.createElement("p");

    if (edibleText.startsWith("Ätlig")) {
        badge.textContent = "✔ Ätlig";
        badge.classList.add("edible");
    } else if (edibleText.startsWith("Dödligt giftig")) {
        badge.textContent = "⚠ Dödligt giftig";
        badge.classList.add("deadly");
    } else if (edibleText.startsWith("Giftig")) {
        badge.textContent = "⚠ Giftig";
        badge.classList.add("poisonous");
    } else {
        badge.textContent = "? Okänd";
    }

    return badge;
}

// Bygger ett svampkort med samma struktur som på startsidan
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
    article.appendChild(createTextElement("p", "Fyndplats: " + svamp.fyndplats));
    article.appendChild(createBadge(svamp.ätlig));
    article.appendChild(createTextElement("p", svamp.ätlig));

    return article;
}

// Väljer ut, sorterar och ritar de sparade svamparna
function renderSavedMushrooms() {
    const savedNames = getSavedNames();
    const savedMushrooms = allMushrooms
        .filter(svamp => savedNames.includes(svamp.latinskt_namn))
        .sort((a, b) => a.svenskt_namn.localeCompare(b.svenskt_namn, "sv"));

    const srHeading = cardContainer.querySelector(".sr-only");
    cardContainer.replaceChildren(...(srHeading ? [srHeading] : []));

    savedMushrooms.forEach(svamp => {
        cardContainer.appendChild(createCard(svamp));
    });

    const hasCards = savedMushrooms.length > 0;
    emptyState.hidden = hasCards;
    clearButton.hidden = !hasCards;
    errorMessage.hidden = true;
}

// Tömmer sparade svampar efter bekräftelse
clearButton.addEventListener("click", () => {
    if (window.confirm("Är du säker på att du vill ta bort alla dina sparade svampar?")) {
        localStorage.removeItem(STORAGE_KEY);
        renderSavedMushrooms();
    }
});

// Hämtar svampar.json och ritar ut sidan
async function init() {
    try {
        const response = await fetch("svampar.json");
        if (!response.ok) {
            throw new Error("Kunde inte hämta svampar.json");
        }
        const data = await response.json();
        allMushrooms = data.svampar;
        renderSavedMushrooms();
    } catch (error) {
        console.error("Kunde inte visa sparade svampar:", error);
        errorMessage.hidden = false;
        emptyState.hidden = true;
        clearButton.hidden = true;
    }
}

init();
