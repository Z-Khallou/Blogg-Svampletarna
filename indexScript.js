// ==========================================
// Alla svampar: visar föreningens svampsamling
// ==========================================

const cardContainer = document.getElementById("card-container");
const jsonError = document.getElementById("jsonError");
const STORAGE_KEY = "savedMushrooms";

// Hämtar svampar.json med try/catch och kontrollerar response.ok
async function fetchData() {
    try {
        const response = await fetch("svampar.json");
        if (!response.ok) {
            throw new Error("Kunde inte hämta data");
        }
        const data = await response.json();
        createArticles(data.svampar);
    } catch (error) {
        console.error("Error fetching data:", error);
        jsonError.hidden = false;
        jsonError.textContent = "Det gick inte att ladda in svamparna. Försök igen senare.";
    }
}

// Skapar ett HTML-element med textinnehåll och eventuell CSS-klass
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

// Läser sparade svampnamn ur localStorage
function getSavedNames() {
    const savedText = localStorage.getItem(STORAGE_KEY);
    return savedText ? JSON.parse(savedText) : [];
}

// Kontrollerar om en specifik svamp redan är sparad
function isMushroomSaved(latinName) {
    return getSavedNames().includes(latinName);
}

// Skapar spara-knappen på svampkortet
function createSaveButton(svamp) {
    const button = document.createElement("button");
    button.type = "button";

    if (isMushroomSaved(svamp.latinskt_namn)) {
        button.textContent = "✔ Sparad";
        button.classList.add("saved");
    } else {
        button.textContent = "Spara";
    }

    button.addEventListener("click", () => {
        if (!isMushroomSaved(svamp.latinskt_namn)) {
            const savedMushrooms = getSavedNames();
            savedMushrooms.push(svamp.latinskt_namn);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMushrooms));
            button.textContent = "✔ Sparad";
            button.classList.add("saved");
        }
    });

    return button;
}

// Loopar igenom alla svampar och bygger svampkorten i DOM:en
function createArticles(svampar) {
    svampar.forEach(svamp => {
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
        article.appendChild(createSaveButton(svamp));

        cardContainer.appendChild(article);
    });
}

fetchData();
