// ==========================================
// Svampguiden: visar förväxlingssvampar två par åt gången
// ==========================================

let allPairs = [];
let index = 0;

const leftRisk = document.getElementById("leftRisk");
const leftTitle = document.getElementById("leftTitle");
const leftList = document.getElementById("leftIdentify");

const rightRisk = document.getElementById("rightRisk");
const rightTitle = document.getElementById("rightTitle");
const rightList = document.getElementById("rightIdentify");

const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const pageNumber = document.getElementById("pageNumber");
const somethingHappened = document.getElementById("somethingHappened");

function init() {
    getList();
}

async function getList() {
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
        somethingHappened.hidden = false;
        somethingHappened.textContent = "Något gick fel när sidan lästes in, försök igen senare.";
        rightTitle.textContent = "";
        leftTitle.textContent = "";
    }
}

function displayList() {
    leftList.textContent = "";
    const leftPair = allPairs[index];
    leftTitle.textContent = leftPair.par;
    leftRisk.textContent = leftPair.risk;
    const leftFeatures = leftPair.särskiljande;

    leftFeatures.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        leftList.appendChild(li);
    });

    const rightPair = allPairs[index + 1];

    rightTitle.textContent = "";
    rightRisk.textContent = "";
    rightList.textContent = "";

    if (rightPair !== undefined) {
        rightTitle.textContent = rightPair.par;
        rightRisk.textContent = rightPair.risk;

        const rightFeatures = rightPair.särskiljande;

        rightFeatures.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            rightList.appendChild(li);
        });
    }

    showPageNumber();
    nextButton.disabled = (index >= allPairs.length - 2);
    prevButton.disabled = (index <= 0);
}

function showPageNumber() {
    const currentPage = index / 2 + 1;
    const totalPages = Math.ceil(allPairs.length / 2);

    pageNumber.textContent = `Sida ${currentPage} av ${totalPages}`;
}

function nextPair() {
    if (index < allPairs.length - 2) {
        index += 2;
        displayList();
    }
}

function prevPair() {
    if (index > 0) {
        index -= 2;
        displayList();
    }
}

nextButton.addEventListener("click", nextPair);
prevButton.addEventListener("click", prevPair);

init();
