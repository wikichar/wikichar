
document.addEventListener("DOMContentLoaded", () => {
    updateTOC();
    document.addEventListener("selectionchange", () => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);

        if (sel.toString().trim().length > 0) {
            savedRange = range;
        }
    });
    const saveBtn = document.getElementById("saveBtn");
    const loadBtn = document.getElementById("loadBtn");

    if (saveBtn) saveBtn.onclick = saveProject;
    if (loadBtn) loadBtn.onclick = openExplorer;

});
let currentProject = null;

function getProjectFromURL() {
    const raw = window.location.search; // ?projekt123

    if (!raw) return null;

    return decodeURIComponent(raw.slice(1).split("#")[0]);
}

currentProject = getProjectFromURL();
let linkMode = false;
let savedRange = null;
let previewMode = false;
const projectDialog = document.getElementById("projectDialog");
const projectList = document.getElementById("projectList");
const dialogOk = document.getElementById("dialogOk");
const projectName = document.getElementById("projectName");
const PREFIX = "wiki_";
const dialogTitle = document.getElementById("dialogTitle");document.addEventListener("paste", e => {

    const target = e.target;

    if (!target.isContentEditable) return;

    e.preventDefault();

    const text = (e.clipboardData || window.clipboardData).getData("text/plain");

    document.execCommand("insertText", false, text);

});
document.addEventListener("DOMContentLoaded", () => {

    const toolbar = document.getElementById("toolbar");

    document.addEventListener("mouseup", showToolbar);
    document.addEventListener("keyup", showToolbar);
    document.addEventListener("click", showToolbar);

    function showToolbar() {
        const selection = window.getSelection();

        if (!selection || selection.toString().trim() === "") {
            toolbar.classList.add("hidden");
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        toolbar.style.top = (rect.top + window.scrollY - 40) + "px";
        toolbar.style.left = (rect.left + window.scrollX) + "px";

        toolbar.classList.remove("hidden");
    }

    window.format = function(command) {
        document.execCommand(command, false, null);
    };
    window.formatBlock = function(tag) {
        document.execCommand("formatBlock", false, tag);
    };
});
function createSection() {

    const section = document.createElement("div");

    section.className = "section";
    section.dataset.hasImage = "false";

    section.innerHTML = `
        <button class="delete-btn">×</button>

        <h2 contenteditable="true">
            Nowy nagłówek
        </h2>

        <p class="tresc" contenteditable="true">
            Nowa treść...
        </p>

        <button class="add-img-btn">
            + zdjęcie
        </button>
    `;
    return section;
}
function createThumb(src){

    const thumb=document.createElement("div");

    thumb.className="thumb";

    thumb.innerHTML=`
        <img class="editable-img" src="${src}">
        <div class="caption" contenteditable="true">
            Opis zdjęcia
        </div>
    `;

    return thumb;

}
document.getElementById("addSectionBtn").addEventListener("click", () => {

    const article = document.querySelector(".article");

    article.appendChild(createSection());
});
document.addEventListener("click", e => {
    updateTOC();
    if (e.target.classList.contains("delete-btn")) {
        e.target.closest(".section").remove();
        return;
    }

    if (e.target.classList.contains("remove-office")) {
        e.target.closest(".office-group").remove();
        return;
    }

    if (e.target.classList.contains("editable-img") ||
        e.target.classList.contains("infobox-img")) {

        activeImage = e.target;
        targetSection = null;
        imgInput.click();
        return;
    }

    if (e.target.classList.contains("add-img-btn")) {

        const section = e.target.closest(".section");

        if (section.dataset.hasImage === "true") return;

        targetSection = section;
        activeImage = null;
        imgInput.click();
    }

});
document.getElementById("addOffice").addEventListener("click", () => {
    const table = document.querySelector(".infobox table");

    const tbody = document.createElement("tbody");
    tbody.className = "office-group";

    tbody.innerHTML = `
        <tr>
            <td contenteditable="true" colspan="2" class="infobox-role">
                Nowy urząd
                <button class="remove-office">×</button>
            </td>
        </tr>

        <tr>
            <td class="infoleft">Okres</td>
            <td class="inforight" contenteditable="true">
                od ...
                <div class="inforight" contenteditable="true">do ...</div>
            </td>
        </tr>
        <tr class="poprzednik">
            <td class="infoleft">Poprzednik<button class="toggle-predecessor">x</button></td>
            <td class="inforight" contenteditable="true">Wstaw osobę</td>
        </tr>
        <tr>
            <td class="infoleft">Następca</td>
            <td class="inforight" contenteditable="true">Wstaw osobę</td>
        </tr>
    `;

    table.appendChild(tbody);
});
const imgInput = document.getElementById("imgInput");

let activeImage = null;
let targetSection = null;



imgInput.addEventListener("change", e => {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = ({target}) => {

        if (activeImage) {
            activeImage.src = target.result;
        } else if (targetSection) {

            targetSection.appendChild(createThumb(target.result));

            targetSection.dataset.hasImage = "true";
            targetSection.querySelector(".add-img-btn").remove();
        }

        activeImage = null;
        targetSection = null;
        imgInput.value = "";
    };

    reader.readAsDataURL(file);
});
function exportHTML() {
    console.log("EXPORT START");

    const clone = document.documentElement.cloneNode(true);

    // usuń UI
    clone.querySelectorAll(
        ".delete-btn, .add-img-btn, .remove-office, #toolbar, #addSectionBtn, #addOffice, #exportHTML, #exportPNG, .side-btn, .toggle-predecessor,  #importHTML"
    ).forEach(el => el.remove());

    // wyłącz edycję
    clone.querySelectorAll("[contenteditable]").forEach(el => {
        el.removeAttribute("contenteditable");
    });

    // 🔥 WYCIĄGNIJ CSS Z LINKA
    const styleSheets = Array.from(document.styleSheets);
    let cssText = "";

    for (let sheet of styleSheets) {
        try {
            const rules = sheet.cssRules;
            for (let rule of rules) {
                cssText += rule.cssText + "\n";
            }
        } catch (e) {
            console.warn("Nie można odczytać CSS (cross-origin?)");
        }
    }

    // 🔥 wstrzyknięcie CSS do <style>
    const styleTag = document.createElement("style");
    styleTag.innerHTML = cssText;

    clone.querySelector("head").appendChild(styleTag);

    // 🔥 usuń link do css (żeby nie było 2 źródeł)
    clone.querySelectorAll('link[rel="stylesheet"]').forEach(l => l.remove());

    // export
    const blob = new Blob([clone.outerHTML], { type: "text/html" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "strona.html";
    a.click();
}
function exportPNG() {

    const ui = document.querySelectorAll(
        ".delete-btn, .add-img-btn, .remove-office, #toolbar, #addSectionBtn, .side-btn, .toggle-predecessor, #importHTML"
    );

    ui.forEach(el => el.classList.add("export-mode"));

    html2canvas(document.body, {
        useCORS: true,
        scale: 2
    }).then(canvas => {

        const link = document.createElement("a");
        link.download = "strona.png";
        link.href = canvas.toDataURL("image/png");
        link.click();

        ui.forEach(el => el.classList.remove("export-mode"));
    });
}
document.getElementById("removeDeath").addEventListener("click", () => {

    document.querySelectorAll(".death-content").forEach(el => {

        if (el.classList.contains("hidden-death")) {
            el.classList.remove("hidden-death");
        } else {
            el.classList.add("hidden-death");
        }

    });

});
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
        e.target.closest(".section").remove();
    }
});
document.addEventListener("click", e => {

    if (!e.target.classList.contains("toggle-predecessor")) return;

    const office = e.target.closest(".office-group");

    office.querySelector(".poprzednik").classList.toggle("hidden-predecessor");

});
loadBtn.onclick=()=>{

    dialogTitle.textContent="Wczytaj projekt";

    projectName.style.display="none";

    projectList.innerHTML="";

    for(let i=0;i<localStorage.length;i++){

        const key=localStorage.key(i);

        if(!key.startsWith("wiki_"))continue;

        const btn=document.createElement("button");

        btn.className="project-item";
        btn.textContent=key.substring(5);

        btn.onclick=()=>{

            document.querySelector(".page").innerHTML=
                localStorage.getItem(key);

            projectDialog.close();

        };

        projectList.appendChild(btn);

    }

    dialogOk.style.display="none";

    projectDialog.showModal();

}
function getProjects() {
    const list = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key.startsWith(PREFIX)) {
            list.push(key);
        }
    }

    return list;
}
function openExplorer() {

    const box = document.getElementById("explorer");
    const list = document.getElementById("explorerList");

    list.innerHTML = "";

    const projects = getProjects();

    projects.forEach(key => {

        const name = key.replace(PREFIX, "");

        const row = document.createElement("div");
        row.className = "file";

        row.innerHTML = `
            <div class="file-name">${name}</div>
            <div class="file-delete">🗑</div>
        `;

        // klik = otwórz
        row.querySelector(".file-name").onclick = () => {
            loadProject(key);
            closeExplorer();
        };

        // kosz = usuń
        row.querySelector(".file-delete").onclick = (e) => {
            e.stopPropagation();
            localStorage.removeItem(key);
            openExplorer(); // odśwież
        };

        list.appendChild(row);
    });
    document.getElementById('explorer').style.display = 'block';
    box.classList.remove("hidden");
}

// Zamykanie
function closeExplorer() {
    document.getElementById('explorer').style.display = 'none';
}

function saveProject() {
    const name = prompt("Nazwa projektu:");
    if (!name) return;

    localStorage.setItem(
        "wiki_" + name,
        document.querySelector(".page").innerHTML
    );

    // opcjonalnie: aktualizuj URL
    history.pushState({}, "", `?${encodeURIComponent(name)}`);
}
function createProjectItem(key) {

    const data = JSON.parse(localStorage.getItem(key));

    const item = document.createElement("div");
    item.className = "file";

    const name = document.createElement("div");
    name.className = "file-name";

    const title = document.createElement("div");
    title.className = "file-title";

    // 🔥 NAZWA PROJEKTU
    name.textContent = key.replace("wiki_", "");

    // 🔥 TYTUŁ STRONY (np h1)
    const h1 = document.querySelector(".page h1");
    title.textContent = h1 ? h1.textContent : "brak tytułu";

    item.appendChild(name);
    item.appendChild(title);

    item.onclick = () => loadProject(key);

    return item;
}
function loadProject(key) {
    setTimeout(() => {
        restoreEditing();
    }, 0);

    const name = key.replace("wiki_", "");
    const html = localStorage.getItem(key);

    document.querySelector(".page").innerHTML = html;

        requestAnimationFrame(() => {
            updateTOC();
            enablePageEditing();
        });
    history.pushState({}, "", `?${encodeURIComponent(name)}`);
}
window.addEventListener("DOMContentLoaded", () => {

    const query = window.location.search; // np. "?projekt1"
    if (!query) return;

    const name = decodeURIComponent(query.replace("?", ""));
    const key = "wiki_" + name;

    const data = localStorage.getItem(key);

    if (data) {
        document.querySelector(".page").innerHTML = data;
    }

});
window.addEventListener("popstate", () => {
    const query = window.location.search;
    if (!query) return;

    const name = decodeURIComponent(query.replace("?", ""));
    const key = "wiki_" + name;

    const data = localStorage.getItem(key);

    if (data) {
        document.querySelector(".page").innerHTML = data;
    }
});
function insertProjectLink(projectKey) {
    const name = projectKey.replace("wiki_", "");
    const text = savedRange.toString();

    if (!savedRange) return;

    const a = document.createElement("a");
    a.className = "internal-link";
    a.href = `?${encodeURIComponent(name)}`;
    a.textContent = text;

    savedRange.deleteContents();
    savedRange.insertNode(a);

    savedRange = null; // reset po użyciu
}
function openLinks() {
    linkMode = true;

    const box = document.getElementById("explorer");
    const list = document.getElementById("explorerList");

    list.innerHTML = "";

    const projects = getProjects();

    getProjects().forEach(key => {

        const name = key.replace("wiki_", "");

        const row = document.createElement("div");
        row.className = "file";
        row.textContent = name;

        row.onclick = () => {

            if (linkMode) {
                insertProjectLink(key);
                linkMode = false;
                closeExplorer();
            }
        };

        list.appendChild(row);
    });
    document.getElementById('explorer').style.display = 'block';
    box.classList.remove("hidden");
}
document.getElementById("previewBtn").onclick = () => {
    localStorage.setItem("previewMode", "1");
    setPreview(true);
};
document.getElementById("exitPreviewBtn").onclick = () => {
    localStorage.removeItem("previewMode");
    setPreview(false);
};
document.addEventListener("contextmenu", (e) => {

    if (previewMode) return; // w preview NIC NIE RUSZA

    const link = e.target.closest("a.internal-link");
    if (!link) return;

    e.preventDefault();

    // 🔥 zamiana linku na tekst
    const text = document.createTextNode(link.textContent);
    link.replaceWith(text);
});
function setPreview(mode) {
    previewMode = mode;

    document.body.classList.toggle("preview-mode", previewMode);

    document.querySelectorAll("[contenteditable]").forEach(el => {
        el.setAttribute("contenteditable", previewMode ? "false" : "true");
    });

    document.querySelectorAll(".side-btn, .add-img-btn, .delete-btn, .toggle-predecessor, .remove-office, #importHTML")
        .forEach(btn => {
            btn.style.display = previewMode ? "none" : "";
        });

    document.getElementById("exitPreviewBtn").style.display =
        previewMode ? "block" : "none";

    if (!previewMode) {
        restoreEditing(); // 🔥 KLUCZ
    }
}
function quickSave() {
    currentProject = getProjectFromURL();
    if (!currentProject) {
        alert("Nie ma aktywnego projektu w URL!");
        return;
    }

    localStorage.setItem(
        "wiki_" + currentProject,
        document.querySelector(".page").innerHTML
    );

    console.log("Zapisano:", currentProject);
}
function createH2Entry(text, id) {

    const wrap = document.createElement("div");
    wrap.className = "toc-group";

    const header = document.createElement("div");
    header.className = "toc-h2";

    const link = document.createElement("a");
    link.href = "#" + id;
    link.textContent = text;

    const children = document.createElement("div");
    children.className = "toc-children";

    header.appendChild(link);
    wrap.appendChild(header);
    wrap.appendChild(children);

    return { wrap, children };
}
function createH3Entry(text, id) {

    const wrap = document.createElement("div");
    wrap.className = "toc-h3";

    const a = document.createElement("a");
    a.href = "#" + id;
    a.textContent = text;

    wrap.appendChild(a);

    return wrap;
}
function updateTOC() {

    const list = document.getElementById("tocList");
    if (!list) return;

    list.innerHTML = "";

    const headings = document.querySelectorAll(".article h2, .article h3");

    let currentH2 = null;

    headings.forEach((heading, i) => {

        if (!heading.id) {
            heading.id = "h-" + i;
        }

        if (heading.tagName === "H2") {

            currentH2 = createH2Entry(
                heading.textContent,
                heading.id
            );

            list.appendChild(currentH2.wrap);

        } else if (currentH2) {

            currentH2.children.appendChild(
                createH3Entry(
                    heading.textContent,
                    heading.id
                )
            );

            // 🔥 WAŻNE: oznacz że H2 ma dzieci
            currentH2.hasChildren = true;
        }
        document.querySelectorAll(".toc-group").forEach(group => {

            const id = group.dataset.id;
            const children = group.querySelector(".toc-children");
        });
    });

    // 🔥 PO BUDOWIE: pokaż/ukryj toggle
    document.querySelectorAll(".toc-group").forEach(group => {

        const children = group.querySelector(".toc-children");
        const toggle = group.querySelector(".toggle");

        if (!children || !toggle) return;

        const hasChildren = children.children.length > 0;

        toggle.style.display = hasChildren ? "inline" : "none";
    });
}
function fixEditable() {
    document.querySelectorAll(".article h2, .article h3").forEach(el => {
        el.setAttribute("contenteditable", "true");
    });
}
window.addEventListener("popstate", () => {

    const query = window.location.search;
    if (!query) return;

    const name = decodeURIComponent(query.replace("?", ""));
    const key = "wiki_" + name;

    const data = localStorage.getItem(key);

    if (data) {
        document.querySelector(".page").innerHTML = data;
        fixEditable(); // 🔥 DODAJ TO
    }
});
document.addEventListener("click", (e) => {
    if (!previewMode) return;

    const link = e.target.closest("a[href^='#']");
    if (!link) return;

    e.preventDefault();

    const id = link.getAttribute("href").slice(1);
    const target = document.getElementById(id);

    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
});

document.addEventListener("mousedown", (e) => {
    if (!previewMode) return;

    // jeśli kliknięto w contenteditable → zbij focus
    const editable = e.target.closest("[contenteditable='true']");
    if (editable) {
        e.preventDefault();
        editable.blur();
    }
});
function restoreEditing() {
    document.querySelectorAll(".article h2, .article h3").forEach(el => {
        el.setAttribute("contenteditable", "true");
    });

    document.querySelectorAll(".article p, .article div, .article span").forEach(el => {
        // nie wszystko musi być editable — ale jeśli było, nie psuj
        if (el.dataset.wasEditable === "1") {
            el.setAttribute("contenteditable", "true");
        }
    });
}

function importHTMLFile(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = ({ target }) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(target.result, "text/html");

        // 🔥 walidacja czy to Twój eksport
        const version = doc.querySelector('meta[name="wiki-editor-version"]');
        if (!version) {
            alert("To nie jest plik z tego edytora.");
            return;
        }

        const importedPage = doc.querySelector(".page");
        if (!importedPage) {
            alert("Brak .page w pliku.");
            return;
        }

        console.log("📥 IMPORT START");
        console.log("📦 HTML length:", importedPage.innerHTML.length);

        // 🔥 NAJWAŻNIEJSZE: podmiana strony
        const page = document.querySelector(".page");
        page.innerHTML = importedPage.innerHTML;

        requestAnimationFrame(() => {
            updateTOC();
            enablePageEditing();
        });
    };

    reader.readAsText(file);
}
document.getElementById("importHTML").addEventListener("change", e => {
    importHTMLFile(e.target.files[0]);
    e.target.value = "";
});
function enablePageEditing() {
    const page = document.querySelector(".page");
    if (!page) return;

    page.querySelectorAll("*").forEach(el => {
        el.setAttribute("contenteditable", "true");
    });
}