// ==========================================
// Svampguiden: visar förväxlingssvampar två par åt gången
// ==========================================

const guideCards = document.getElementById("guide-cards");
const guideError = document.getElementById("guide-error");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const pageNumber = document.getElementById("pageNumber");

let allPairs = [];
let index = 0;

// Skapar ett article-kort för ett förväxlingspar dynamiskt
function createPairCard(pair) {
    const article = document.createElement("article");

    const title = document.createElement("h3");
    title.textContent = pair.par;
    article.appendChild(title);

    const risk = document.createElement("p");
    risk.className = "risk";
    risk.textContent = pair.risk;
    article.appendChild(risk);

    const list = document.createElement("ul");
    pair.särskiljande.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
    });
    article.appendChild(list);

    return article;
}

// Visar två förväxlingspar åt gången och uppdaterar sidnumreringen
function displayList() {
    const srHeading = guideCards.querySelector(".sr-only");
    guideCards.replaceChildren(...(srHeading ? [srHeading] : []));

    const currentPairs = allPairs.slice(index, index + 2);
    currentPairs.forEach(pair => {
        guideCards.appendChild(createPairCard(pair));
    });

    const currentPage = index / 2 + 1;
    const totalPages = Math.ceil(allPairs.length / 2);
    pageNumber.textContent = `Sida ${currentPage} av ${totalPages}`;

    prevButton.disabled = index <= 0;
    nextButton.disabled = index >= allPairs.length - 2;
}

prevButton.addEventListener("click", () => {
    if (index > 0) {
        index -= 2;
        displayList();
    }
});

nextButton.addEventListener("click", () => {
    if (index < allPairs.length - 2) {
        index += 2;
        displayList();
    }
});

async function init() {
    try {
        const response = await fetch("speciellaEgenskaper.json");
        if (!response.ok) {
            throw new Error("Något gick fel vid hämtning");
        }
        const data = await response.json();
        allPairs = data.särskiljande_egenskaper;
        displayList();
    } catch (error) {
        console.error("Fel:", error);
        guideError.hidden = false;
        guideError.textContent = "Något gick fel när sidan lästes in, försök igen senare.";
    }
}

init();
