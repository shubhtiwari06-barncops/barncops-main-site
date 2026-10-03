import Alpine from "https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/module.esm.js";
import collapse from "https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.14.9/dist/module.esm.js";

Alpine.plugin(collapse);
window.Alpine = Alpine;
window.dispatchEvent(new Event("alpine:loaded"));
