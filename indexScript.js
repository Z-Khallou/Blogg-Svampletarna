// ==========================================
// Alla svampar: visar föreningens svampsamling
// ==========================================

const cardContainer = document.getElementById("card-container");
const jsonError = document.getElementById("jsonError");
const STORAGE_KEY = "savedMushrooms";

// Hämta svampar.json med try/catch och kontrollera response.ok
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

// Tolkar hur fältet "ätlig" börjar för att visa rätt badge
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

// Skapar etiketten (badge) med både symbol och text
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

// Läser sparade svampnamn ur localStorage
function getSavedNames() {
    const savedText = localStorage.getItem(STORAGE_KEY);
    if (!savedText) return [];
    try {
        const parsed = JSON.parse(savedText);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Kontrollerar om en specifik svamp redan är sparad
function checkIfSaved(svamp) {
    const savedMushrooms = getSavedNames();
    return savedMushrooms.some(saved => saved === svamp.latinskt_namn);
}

// Skapar spara-knappen på svampkortet
function saveArticleButton(svamp, article) {
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.classList.add("save-button");

    function updateButtonState() {
        if (checkIfSaved(svamp)) {
            saveButton.textContent = "✔ Sparad";
            saveButton.classList.add("is-saved");
        } else {
            saveButton.textContent = "Spara";
            saveButton.classList.remove("is-saved");
        }
    }

    updateButtonState();

    saveButton.addEventListener("click", () => {
        if (!checkIfSaved(svamp)) {
            const savedMushrooms = getSavedNames();
            savedMushrooms.push(svamp.latinskt_namn);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMushrooms));
            updateButtonState();
        }
    });

    article.appendChild(saveButton);
}

// Loopar igenom alla svampar och bygger svampkorten i DOM:en
function createArticles(svampar) {
    svampar.forEach(svamp => {
        const article = document.createElement("article");

        article.appendChild(createTextElement("h3", svamp.svenskt_namn));
        article.appendChild(createTextElement("p", svamp.latinskt_namn, "latin-name"));

        const imageMushroom = document.createElement("img");
        imageMushroom.src = "./svampar/" + svamp.bild.replace("./", "");
        imageMushroom.alt = "Bild av " + svamp.svenskt_namn;
        imageMushroom.loading = "lazy";
        article.appendChild(imageMushroom);

        article.appendChild(createTextElement("p", svamp.beskrivning));
        article.appendChild(createTextElement("p", "Fyndplats: " + svamp.fyndplats, "location"));

        const edibility = getEdibility(svamp["ätlig"]);
        article.appendChild(createBadge(edibility));
        article.appendChild(createTextElement("p", svamp["ätlig"]));

        saveArticleButton(svamp, article);
        cardContainer.appendChild(article);
    });
}

// Starta när sidan är inläst
fetchData();
