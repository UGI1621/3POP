import { engineVersion } from "@3pop/engine";

const app = document.querySelector("#app");
if (app == null){
	throw new Error("app not found");
}

app.textContent = engineVersion();
