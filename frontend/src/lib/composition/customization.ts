import { define_element } from "@chocbite/ts-lib-base";
import { material_device_brightness_medium_rounded } from "@chocbite/ts-lib-icons";
import { some } from "@chocbite/ts-lib-result";
import { state } from "@chocbite/ts-lib-state";
import {
  ANIMATION_LEVEL,
  INPUT_MODE,
  SCALE,
  THEME,
} from "@chocbite/ts-lib-theme";
import type { Panel } from "@libComposition";
import form from "@libForm";
import { ContentBase } from "./content";
import type { CompAnchor } from "./shared";

class CustomizationPanel extends ContentBase {
  static element_name() {
    return "customization-panel";
  }
  static element_name_space() {
    return "ui";
  }

  readonly panel: Panel;

  #main_group = this.appendChild(
    form.group({
      elements: [form.toggle_button({ value_by_state: THEME })],
    }),
  );
  readonly main_group = this.appendChild(form.group({}));

  readonly advanced_group = form.group({});
  #advanced_group = this.appendChild(
    form.group({
      collapsible: true,
      collapse_text: "Advanced",
      collapsed: true,
      elements: [
        form.text({ text: "UI Scale" }),
        form.stepper({ value_by_state: SCALE }),
        form.text({ text: "Input Mode" }),
        form.toggle_button({ value_by_state: INPUT_MODE }),
        form.text({ text: "Animation Level" }),
        form.toggle_button({ value_by_state: ANIMATION_LEVEL }),
        this.advanced_group,
      ],
    }),
  );

  constructor(panel: Panel) {
    super();
    this.panel = panel;
  }

  get name() {
    return state.ok("Customization");
  }
  get icon() {
    return state.ok(some(material_device_brightness_medium_rounded));
  }
  get closable() {
    return state.ok(true);
  }
  get min_size() {
    return state.ok(some({ width: 10, height: 6 }));
  }

  async on_close(): Promise<void> {
    return;
  }
}
define_element(CustomizationPanel);

export function customization_panel(
  element: Element,
  element_anchor: CompAnchor,
): CustomizationPanel {
  const content = new CustomizationPanel(
    element.ownerDocument.panel_container.create_panel({
      closeable: false,
      moveable: false,
      sizeable: false,
      show_titlebar: false,
      width: 18,
    }),
  );
  content.panel.content = content;
  return content;
}
