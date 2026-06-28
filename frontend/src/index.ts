import "@chocbite/ts-lib-base";
import { material_brightness_medium_rounded } from "@chocbite/ts-lib-icons";
import { prompts } from "@libPrompts";
import "./game";
import "./index.scss";
import "./lib/composition";
import { comp, TopBarSides } from "./lib/composition";

// (async () => {
//   const ollama = new Ollama({ host: "http://192.168.11.14:11434" });
//   const response = await ollama.chat({
//     model: "gemma4:26b",
//     messages: [{ role: "user", content: "Why is the sky blue?" }],
//   });

//   console.warn(response);
// })();

prompts.buttons("Test Prompt", [
  { text: "Button 1", value: true },
  { text: "Button 3", value: true },
  {
    text: "Button 2 very long text that  of the button in the prompt",
  },
  { text: "Button 3", value: true },
  { text: "Button 3", value: true },
  { text: "Button 3", value: true },
  { text: "Button 3", value: true },
]);

const topbar = comp.topbar();
document.body.prepend(topbar);
topbar.add_item(
  document.createElement("button"),
  TopBarSides.LEFT,
).textContent = "Left";
topbar.add_item(document.createElement("div"), TopBarSides.LEFT).textContent =
  "Left";
const butt = topbar.add_item(
  comp.topbar_button("Mid", () => {}),
  TopBarSides.MID,
);
const lab = topbar.add_item(comp.topbar_label("Right"), TopBarSides.RIGHT);

const cust_butt = topbar.add_item(
  comp.topbar_button_icon(material_brightness_medium_rounded, () => {}),
  TopBarSides.RIGHT,
);

const cust = comp.attach_customization_panel_to_element(
  cust_butt,
  "bot_left",
  "top_left",
);

// document.getElementById("app")?.replaceChildren(example_page());
