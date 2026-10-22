// ============================================================================
// Svampletarna – Bloggsida i TypeScript
// ============================================================================

// ----------------------------------------------------------------------------
// 1. INTERFACES (Kontrakt för våra JSON- och TypeScript-objekt)
// ----------------------------------------------------------------------------

// Representerar en kommentar på ett blogginlägg
interface IComment {
    id: string;
    author: string; // Författare av kommentar
    text: string;   // Kommentarens text
    date: string;   // Datum för kommentar
}

// Representerar ett blogginlägg
interface IBlogPost {
    id: string;
    title: string;        // Titel
    author: string;       // Användare (författare av inlägget)
    text: string;         // Text
    date: string;         // Datum för inlägg
    comments: IComment[]; // Eventuella kommentarer
}

// Representerar hela JSON-objektet som sparas permanent i localStorage
interface IBlogStorageData {
    posts: IBlogPost[];
}

// ----------------------------------------------------------------------------
// 2. KLASSER / OBJEKT (Objektorienterad struktur i TypeScript
// ----------------------------------------------------------------------------

// Klass för att skapa ett kommentarsobjekt
class BlogComment implements IComment {
    public id: string;
    public author: string;
    public text: string;
    public date: string;

    constructor(author: string, text: string, date?: string, id?: string) {
        this.id = id ?? crypto.randomUUID();
        this.author = author;
        this.text = text;
        this.date = date ?? formatCurrentDate();
    }
}

// Klass för att skapa och hantera ett blogginläggsobjekt
class BlogPost implements IBlogPost {
    public id: string;
    public title: string;
    public author: string;
    public text: string;
    public date: string;
    public comments: BlogComment[];

    constructor(
        title: string,
        author: string,
        text: string,
        comments: IComment[] = [],
        date?: string,
        id?: string
    ) {
        this.id = id ?? crypto.randomUUID();
        this.title = title;
        this.author = author;
        this.text = text;
        this.date = date ?? formatCurrentDate();
        // Säkerställer att alla kommentarer i listan är instanser av BlogComment
        this.comments = comments.map(
            (c) => new BlogComment(c.author, c.text, c.date, c.id)
        );
    }

    // Metod på objektet för att lägga till en ny kommentar
    public addComment(author: string, text: string): BlogComment {
        const newComment = new BlogComment(author, text);
        this.comments.push(newComment);
        return newComment;
    }
}

// ----------------------------------------------------------------------------
// 3. HJÄLPFUNKTIONER & KONSTANTER FÖR LOCALSTORAGE
// ----------------------------------------------------------------------------

// Samma nyckel som används på login.html / login.js
const USER_STORAGE_KEY = "username";

// Nyckeln där hela bloggens JSON-objekt sparas permanent i localStorage
const BLOG_STORAGE_KEY = "svampletarna_blog";

// Returnerar dagens datum i svenskt format (ÅÅÅÅ-MM-DD HH:MM)
function formatCurrentDate(): string {
    const now = new Date();
    const datePart = now.toLocaleDateString("sv-SE");
    const timePart = now.toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit"
    });
    return `${datePart} kl. ${timePart}`;
}

// Hämtar inloggad användare från localStorage (eller null om utloggad)
function getLoggedInUser(): string | null {
    const user = localStorage.getItem(USER_STORAGE_KEY);
    return user && user.trim() !== "" ? user.trim() : null;
}

// Skapar startinlägg om localStorage är tomt vid första besöket
function createInitialPosts(): BlogPost[] {
    const firstPost = new BlogPost(
        "Fantastisk kantarelllycka i Småland!",
        "Linn",
        "Idag var vi ute i mossig blandskog strax utanför Växjö och hittade korgarna fulla med gula kantareller. Kom ihåg att alltid kolla undersidan så att det är gaffelgrenade åsar och inte skivor!",
        [
            new BlogComment(
                "Felicia",
                "Vilket drömfynd! Jag ska ge mig ut i helgen och leta vid samma typ av skog.",
                "2026-10-18 kl. 14:20"
            )
        ],
        "2026-10-18 kl. 11:05"
    );

    const secondPost = new BlogPost(
        "Höstens trattkantareller har äntligen kommit",
        "Zouhir",
        "Nu när frosten närmar sig står trattkantarellerna tätt i den fuktiga barrskogen. De är perfekta att torka och använda i soppor och grytor hela vintern.",
        [],
        "2026-10-19 kl. 16:40"
    );

    return [secondPost, firstPost];
}

// Sparar alla blogginlägg och kommentarer permanent som ETT JSON-objekt i localStorage
function saveBlogToStorage(posts: BlogPost[]): void {
    const storageObject: IBlogStorageData = {
        posts: posts
    };
    localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(storageObject));
}

// Läser in JSON-objektet från localStorage och gör om det till BlogPost-objekt
function loadBlogFromStorage(): BlogPost[] {
    const rawJson = localStorage.getItem(BLOG_STORAGE_KEY);

    if (!rawJson) {
        const initialPosts = createInitialPosts();
        saveBlogToStorage(initialPosts);
        return initialPosts;
    }

    try {
        const parsedData = JSON.parse(rawJson) as IBlogStorageData;

        if (parsedData && Array.isArray(parsedData.posts)) {
            return parsedData.posts.map(
                (p) =>
                    new BlogPost(
                        p.title,
                        p.author,
                        p.text,
                        p.comments ?? [],
                        p.date,
                        p.id
                    )
            );
        }
    } catch (error) {
        console.error("Kunde inte tolka sparade blogginlägg från localStorage:", error);
    }

    const fallbackPosts = createInitialPosts();
    saveBlogToStorage(fallbackPosts);
    return fallbackPosts;
}

// ----------------------------------------------------------------------------
// 4. DOM-REFERENSER & TILLSTÅND
// ----------------------------------------------------------------------------

const authStatusEl = document.getElementById("auth-status") as HTMLParagraphElement | null;
const guestNoticeSection = document.getElementById("guest-notice") as HTMLElement | null;
const createPostSection = document.getElementById("create-post-section") as HTMLElement | null;
const postForm = document.getElementById("post-form") as HTMLFormElement | null;
const postTitleInput = document.getElementById("post-title") as HTMLInputElement | null;
const postTextInput = document.getElementById("post-text") as HTMLTextAreaElement | null;
const postErrorEl = document.getElementById("post-error") as HTMLParagraphElement | null;
const postsContainer = document.getElementById("posts-container") as HTMLElement | null;

// Håller våra BlogPost-objekt i minnet under sidans livstid
let blogPosts: BlogPost[] = [];

// ----------------------------------------------------------------------------
// 5. DOM-MANIPULATION (Bygger gränssnittet dynamiskt
// ----------------------------------------------------------------------------

// Hjälpfunktion för att skapa ett HTML-element med text och valfri klass
function createElementWithText<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    text: string,
    className?: string
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) {
        element.classList.add(className);
    }
    return element;
}

// Uppdaterar vy beroende på om besökaren är inloggad eller utloggad
function updateAuthUI(): void {
    const currentUser = getLoggedInUser();

    if (currentUser) {
        if (authStatusEl) {
            authStatusEl.textContent = `Inloggad som: ${currentUser}`;
        }
        if (guestNoticeSection) {
            guestNoticeSection.hidden = true;
        }
        if (createPostSection) {
            createPostSection.hidden = false;
        }
    } else {
        if (authStatusEl) {
            authStatusEl.textContent = "Du läser som gäst (Utloggad)";
        }
        if (guestNoticeSection) {
            guestNoticeSection.hidden = false;
        }
        if (createPostSection) {
            createPostSection.hidden = true;
        }
    }
}

// Skapar DOM-elementet för en enskild kommentar (Författare, Datum, Text)
function createCommentElement(comment: BlogComment): HTMLLIElement {
    const li = document.createElement("li");
    li.classList.add("comment-item");

    const meta = createElementWithText(
        "p",
        `Kommentar av ${comment.author} • ${comment.date}`,
        "comment-meta"
    );
    const text = createElementWithText("p", comment.text, "comment-text");

    li.appendChild(meta);
    li.appendChild(text);

    return li;
}

// Skapar kommentarsformuläret under ett inlägg (visas endast för inloggad användare)
function createCommentForm(post: BlogPost): HTMLFormElement {
    const form = document.createElement("form");
    form.classList.add("comment-form");

    const label = document.createElement("label");
    label.textContent = "Skriv en kommentar";

    const input = document.createElement("input");
    input.type = "text";
    input.name = "commentText";
    input.placeholder = "Dela dina tankar om inlägget...";
    input.required = true;

    label.appendChild(input);

    const submitBtn = createElementWithText("button", "Kommentera");
    submitBtn.type = "submit";

    form.appendChild(label);
    form.appendChild(submitBtn);

    form.addEventListener("submit", (event: SubmitEvent) => {
        event.preventDefault();
        const currentUser = getLoggedInUser();

        if (!currentUser) {
            return;
        }

        const commentText = input.value.trim();
        if (!commentText) {
            return;
        }

        // Använder metoden på vårt BlogPost-objekt (Objektorientering)
        post.addComment(currentUser, commentText);

        // Sparar uppdaterade blogginlägg och kommentarer som JSON i localStorage
        saveBlogToStorage(blogPosts);

        // Ritar om inläggen i DOM:en
        renderPosts();
    });

    return form;
}

// Skapar ett komplett <article>-element för ett blogginlägg
function createPostElement(post: BlogPost): HTMLElement {
    const article = document.createElement("article");
    article.classList.add("blog-post");

    // 1. Header med Titel, Användare och Datum för inlägg
    const header = document.createElement("header");
    header.classList.add("post-header");

    const titleEl = createElementWithText("h3", post.title, "post-title");
    const metaEl = createElementWithText(
        "p",
        `Skrivet av ${post.author} • Publicerat ${post.date}`,
        "post-meta"
    );

    header.appendChild(titleEl);
    header.appendChild(metaEl);
    article.appendChild(header);

    // 2. Själva brödtexten i blogginlägget
    const contentEl = createElementWithText("p", post.text, "post-content");
    article.appendChild(contentEl);

    // 3. Sektion för eventuella kommentarer
    const commentsSection = document.createElement("section");
    commentsSection.classList.add("comments-section");
    commentsSection.setAttribute("aria-label", "Kommentarer");

    const commentsHeading = createElementWithText(
        "h4",
        `Kommentarer (${post.comments.length})`,
        "comments-heading"
    );
    commentsSection.appendChild(commentsHeading);

    // Om det finns kommentarer visar vi listan med författare, datum och text
    if (post.comments.length > 0) {
        const ul = document.createElement("ul");
        ul.classList.add("comments-list");

        post.comments.forEach((comment) => {
            ul.appendChild(createCommentElement(comment));
        });

        commentsSection.appendChild(ul);
    } else {
        const emptyComments = createElementWithText(
            "p",
            "Inga kommentarer än.",
            "no-comments"
        );
        commentsSection.appendChild(emptyComments);
    }

    // 4. Om användaren är inloggad lägger vi till formuläret för att kommentera
    if (getLoggedInUser() !== null) {
        commentsSection.appendChild(createCommentForm(post));
    }

    article.appendChild(commentsSection);
    return article;
}

// Ritar ut alla blogginlägg i DOM:en
function renderPosts(): void {
    if (!postsContainer) return;

    // Bevarar den osynliga rubriken för skärmläsare
    const srHeading = postsContainer.querySelector(".sr-only");
    if (srHeading) {
        postsContainer.replaceChildren(srHeading);
    } else {
        postsContainer.replaceChildren();
    }

    blogPosts.forEach((post) => {
        postsContainer.appendChild(createPostElement(post));
    });
}

// ----------------------------------------------------------------------------
// 6. HÄNDELSEHANTERING FÖR ATT SKAPA NYTT BLOGGINLÄGG
// ----------------------------------------------------------------------------

function handleCreatePost(event: SubmitEvent): void {
    event.preventDefault();

    const currentUser = getLoggedInUser();
    if (!currentUser) {
        if (postErrorEl) {
            postErrorEl.textContent = "Du måste vara inloggad för att publicera ett inlägg.";
            postErrorEl.hidden = false;
        }
        return;
    }

    if (!postTitleInput || !postTextInput || !postForm) return;

    const title = postTitleInput.value.trim();
    const text = postTextInput.value.trim();

    if (!title || !text) {
        if (postErrorEl) {
            postErrorEl.textContent = "Vänligen fyll i både titel och text.";
            postErrorEl.hidden = false;
        }
        return;
    }

    if (postErrorEl) {
        postErrorEl.hidden = true;
        postErrorEl.textContent = "";
    }

    // Skapar ett nytt BlogPost-objekt (VG-krav: använt objekt i TypeScript)
    const newPost = new BlogPost(title, currentUser, text);

    // Lägger det nya inlägget överst i listan
    blogPosts.unshift(newPost);

    // Sparar permanent som JSON-objekt i localStorage
    saveBlogToStorage(blogPosts);

    // Återställer formuläret och uppdaterar DOM:en dynamiskt
    postForm.reset();
    renderPosts();
}

// ----------------------------------------------------------------------------
// 7. INITIERING AV BLOGGSIDAN
// ----------------------------------------------------------------------------

function initBlog(): void {
    blogPosts = loadBlogFromStorage();
    updateAuthUI();
    renderPosts();

    if (postForm) {
        postForm.addEventListener("submit", handleCreatePost);
    }
}

initBlog();
