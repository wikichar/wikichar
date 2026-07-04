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
document.getElementById("addSectionBtn").addEventListener("click", () => {

    const article = document.querySelector(".article");

    const section = document.createElement("div");
    section.className = "section";
    section.dataset.hasImage = "false"; // 🔥 WAŻNE

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.innerText = "×";

    const h2 = document.createElement("h2");
    h2.contentEditable = true;
    h2.innerText = "Nowy nagłówek";

    const p = document.createElement("p");
    p.contentEditable = true;
    p.className = "tresc";
    p.innerText = "Nowa treść...";

    const imgBtn = document.createElement("button");
    imgBtn.className = "add-img-btn";
    imgBtn.innerText = "+ zdjęcie";

    section.appendChild(del);
    section.appendChild(h2);
    section.appendChild(p);
    section.appendChild(imgBtn);

    article.appendChild(section);
});
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
        e.target.closest(".section").remove();
    }
});
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-office")) {
        e.target.closest(".office-group").remove();
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
        <tr>
            <td class="infoleft">Poprzednik</td>
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

// klik w dowolny obrazek edytowalny
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("editable-img") || e.target.classList.contains("infobox-img")) {
        activeImage = e.target;
        imgInput.click();
    }
});


document.addEventListener("click", (e) => {

    if (e.target.classList.contains("add-img-btn")) {

        const section = e.target.closest(".section");

        // 🔥 jeśli już ma zdjęcie → nic nie rób
        if (section.dataset.hasImage === "true") return;

        targetSection = section;
        activeImage = null;
        imgInput.click();
    }
});
imgInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(event) {

        // 🔥 TRYB 1: edycja istniejącego zdjęcia
        if (activeImage) {
            activeImage.src = event.target.result;
        }

        // 🔥 TRYB 2: dodanie nowego zdjęcia do sekcji
        else if (targetSection) {

            const thumb = document.createElement("div");
            thumb.className = "thumb";

            const img = document.createElement("img");
            img.className = "editable-img";
            img.src = event.target.result;

            const caption = document.createElement("div");
            caption.className = "caption";
            caption.contentEditable = true;
            caption.innerText = "Opis zdjęcia";

            thumb.appendChild(img);
            thumb.appendChild(caption);

            targetSection.appendChild(thumb);

            // 🔥 UKRYJ PRZYCISK
            const btn = targetSection.querySelector(".add-img-btn");
            if (btn) btn.style.display = "none";

            // 🔥 FLAGA
            targetSection.dataset.hasImage = "true";
        }
    };

    reader.readAsDataURL(file);

    // reset
    imgInput.value = "";
});
function exportHTML() {
    console.log("EXPORT START");

    const clone = document.documentElement.cloneNode(true);

    // usuń UI
    clone.querySelectorAll(
        ".delete-btn, .add-img-btn, .remove-office, #toolbar, #addSectionBtn, #addOffice, #exportHTML, #exportPNG, .side-btn"
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
        ".delete-btn, .add-img-btn, .remove-office, #toolbar, #addSectionBtn, .side-btn"
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