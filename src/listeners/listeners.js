export function createEventListeners(instance) {
    const searchBox = document.querySelector("#searchBox");
    searchBox.addEventListener("input", (e) => instance.search(e));
}
