import { fetchWTTJ } from "./sources/wttj.js";

(async () => {
  await fetchWTTJ("web", "Île-de-France");
})();
