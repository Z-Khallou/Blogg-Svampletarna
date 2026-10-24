"use strict";
// ============================================================================
// Svampletarna – Bloggsida i TypeScript (Uppfyller samtliga G- och VG-krav)
// ============================================================================
// ----------------------------------------------------------------------------
// 2. KLASSER / OBJEKT (Objektorienterad struktur i TypeScript – VG-krav)
// ----------------------------------------------------------------------------
// Klass för att skapa ett kommentarsobjekt
class BlogComment {
    constructor(author, text, date, id) {
        this.id = id ?? crypto.randomUUID();
        this.author = author;
        this.text = text;
        this.date = date ?? formatCurrentDate();
    }
}
// Klass för att skapa och hantera ett blogginläggsobjekt
class BlogPost {
    constructor(title, author, text, comments = [], date, id) {
        this.id = id ?? crypto.randomUUID();
        this.title = title;
        this.author = author;
        this.text = text;
        this.date = date ?? formatCurrentDate();
        this.comments = comments.map((c) => new BlogComment(c.author, c.text, c.date, c.id));
    }
    // Metod på objektet för att lägga till en ny kommentar
    addComment(author, text) {
        const newComment = new BlogComment(author, text);
        this.comments.push(newComment);
        return newComment;
    }
}
// ----------------------------------------------------------------------------
// 3. HJÄLPFUNKTIONER & KONSTANTER FÖR LOCALSTORAGE
// ----------------------------------------------------------------------------
const USER_STORAGE_KEY = "username";
const BLOG_STORAGE_KEY = "svampletarna_blog";
// Returnerar dagens datum i svenskt format (ÅÅÅÅ-MM-DD kl. HH:MM)
function formatCurrentDate() {
    const now = new Date();
    const datePart = now.toLocaleDateString("sv-SE");
    const timePart = now.toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit"
    });
    return `${datePart} kl. ${timePart}`;
}
// Hämtar inloggad användare från localStorage (eller null om utloggad)
function getLoggedInUser() {
    const user = localStorage.getItem(USER_STORAGE_KEY);
    return user && user.trim() !== "" ? user.trim() : null;
}
// Skapar startinlägg om localStorage är tomt vid första besöket
function createInitialPosts() {
    const firstPost = new BlogPost("Fantastisk kantarelllycka i Småland!", "Linn", "Idag var vi ute i mossig blandskog strax utanför Växjö och hittade korgarna fulla med gula kantareller. Kom ihåg att alltid kolla undersidan så att det är gaffelgrenade åsar och inte skivor!", [
        new BlogComment("Felicia", "Vilket drömfynd! Jag ska ge mig ut i helgen och leta vid samma typ av skog.", "2026-10-18 kl. 14:20")
    ], "2026-10-18 kl. 11:05");
    const secondPost = new BlogPost("Höstens trattkantareller har äntligen kommit", "Zouhir", "Nu när frosten närmar sig står trattkantarellerna tätt i den fuktiga barrskogen. De är perfekta att torka och använda i soppor och grytor hela vintern.", [], "2026-10-19 kl. 16:40");
    return [secondPost, firstPost];
}
// Sparar alla blogginlägg och kommentarer permanent som ETT JSON-objekt i localStorage (VG-krav)
function saveBlogToStorage(posts) {
    const storageObject = { posts };
    localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(storageObject));
}
// Läser in JSON-objektet från localStorage och gör om det till BlogPost-objekt
function loadBlogFromStorage() {
    const rawJson = localStorage.getItem(BLOG_STORAGE_KEY);
    if (rawJson) {
        try {
            const parsedData = JSON.parse(rawJson);
            if (Array.isArray(parsedData.posts)) {
                return parsedData.posts.map((p) => new BlogPost(p.title, p.author, p.text, p.comments, p.date, p.id));
            }
        }
        catch (error) {
            console.error("Kunde inte tolka sparade blogginlägg:", error);
        }
    }
    const initialPosts = createInitialPosts();
    saveBlogToStorage(initialPosts);
    return initialPosts;
}
// ----------------------------------------------------------------------------
// 4. FÅ OCH TYDLIGA DOM-REFERENSER
// ----------------------------------------------------------------------------
const authStatusEl = document.getElementById("auth-status");
const guestNoticeSection = document.getElementById("guest-notice");
const createPostSection = document.getElementById("create-post-section");
const postForm = document.getElementById("post-form");
const postsContainer = document.getElementById("posts-container");
let blogPosts = [];
// ----------------------------------------------------------------------------
// 5. DOM-MANIPULATION (Bygger gränssnittet dynamiskt – G-krav)
// ----------------------------------------------------------------------------
// Hjälpfunktion för att skapa ett HTML-element med text
function createTextElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) {
        element.classList.add(className);
    }
    return element;
}
// Uppdaterar vy beroende på om besökaren är inloggad eller utloggad
function updateAuthUI() {
    const currentUser = getLoggedInUser();
    const isLoggedIn = currentUser !== null;
    authStatusEl.textContent = isLoggedIn
        ? `Inloggad som: ${currentUser}`
        : "Du läser som gäst (Utloggad)";
    guestNoticeSection.hidden = isLoggedIn;
    createPostSection.hidden = !isLoggedIn;
}
// Skapar DOM-elementet för en enskild kommentar (Författare, Datum, Text)
function createCommentElement(comment) {
    const li = document.createElement("li");
    li.appendChild(createTextElement("p", `Kommentar av ${comment.author} • ${comment.date}`, "meta"));
    li.appendChild(createTextElement("p", comment.text));
    return li;
}
// Skapar kommentarsformuläret under ett inlägg (visas endast för inloggad användare)
function createCommentForm(post) {
    const form = document.createElement("form");
    const label = createTextElement("label", "Skriv en kommentar");
    const input = document.createElement("input");
    input.type = "text";
    input.name = "commentText";
    input.placeholder = "Dela dina tankar om inlägget...";
    input.required = true;
    label.appendChild(input);
    form.appendChild(label);
    form.appendChild(createTextElement("button", "Kommentera"));
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const currentUser = getLoggedInUser();
        const commentText = input.value.trim();
        if (currentUser && commentText) {
            post.addComment(currentUser, commentText);
            saveBlogToStorage(blogPosts);
            renderPosts();
        }
    });
    return form;
}
// Skapar ett komplett <article>-element för ett blogginlägg
function createPostElement(post) {
    const article = document.createElement("article");
    // 1. Header med Titel (h3), Användare och Datum för inlägg
    const header = document.createElement("header");
    header.appendChild(createTextElement("h3", post.title));
    header.appendChild(createTextElement("p", `Skrivet av ${post.author} • Publicerat ${post.date}`, "meta"));
    article.appendChild(header);
    // 2. Brödtexten i blogginlägget
    article.appendChild(createTextElement("p", post.text));
    // 3. Sektion för eventuella kommentarer (h4)
    const commentsSection = document.createElement("section");
    commentsSection.appendChild(createTextElement("h4", `Kommentarer (${post.comments.length})`));
    if (post.comments.length > 0) {
        const ul = document.createElement("ul");
        post.comments.forEach((comment) => {
            ul.appendChild(createCommentElement(comment));
        });
        commentsSection.appendChild(ul);
    }
    else {
        commentsSection.appendChild(createTextElement("p", "Inga kommentarer än.", "meta"));
    }
    // 4. Om användaren är inloggad lägger vi till formuläret för att kommentera
    if (getLoggedInUser() !== null) {
        commentsSection.appendChild(createCommentForm(post));
    }
    article.appendChild(commentsSection);
    return article;
}
// Ritar ut alla blogginlägg i DOM:en
function renderPosts() {
    const srHeading = postsContainer.querySelector(".sr-only");
    postsContainer.replaceChildren(...(srHeading ? [srHeading] : []));
    blogPosts.forEach((post) => {
        postsContainer.appendChild(createPostElement(post));
    });
}
// ----------------------------------------------------------------------------
// 6. HÄNDELSEHANTERING FÖR ATT SKAPA NYTT BLOGGINLÄGG
// ----------------------------------------------------------------------------
function handleCreatePost(event) {
    event.preventDefault();
    const currentUser = getLoggedInUser();
    if (!currentUser)
        return;
    const formData = new FormData(postForm);
    const title = String(formData.get("title") ?? "").trim();
    const text = String(formData.get("text") ?? "").trim();
    if (title && text) {
        const newPost = new BlogPost(title, currentUser, text);
        blogPosts.unshift(newPost);
        saveBlogToStorage(blogPosts);
        postForm.reset();
        renderPosts();
    }
}
// ----------------------------------------------------------------------------
// 7. INITIERING AV BLOGGSIDAN
// ----------------------------------------------------------------------------
function initBlog() {
    blogPosts = loadBlogFromStorage();
    updateAuthUI();
    renderPosts();
    postForm.addEventListener("submit", handleCreatePost);
}
initBlog();
