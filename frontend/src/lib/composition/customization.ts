import { define_element } from "@chocbite/ts-lib-base";
import { material_device_brightness_medium_rounded } from "@chocbite/ts-lib-icons";
import { some } from "@chocbite/ts-lib-result";
import { state } from "@chocbite/ts-lib-state";
import {
  ANIMATION_LEVEL,
  ANIMATION_SPEED,
  INPUT_MODE,
  SCALE,
  THEME,
} from "@chocbite/ts-lib-theme";
import type { Panel, PanelOptions } from "@libComposition";
import form from "@libForm";
import { ContentBase } from "./content";
import { panel_position_with_anchor } from "./panel";
import { get_element_anchor_position, type CompAnchor } from "./shared";

class CustomizationPanel extends ContentBase {
  static element_name() {
    return "customization-panel";
  }
  static element_name_space() {
    return "ui";
  }

  readonly panel: Panel;
  readonly main_group;
  readonly advanced_group;

  constructor(panel: Panel) {
    super();
    this.main_group = form.group({ embed: true });
    this.advanced_group = form.group({});
    const advanced = form.group({
      collapsible: true,
      collapse_text: "Advanced",
      collapsed: true,
      embed: true,
      elements: [
        form.text({ text: "UI Scale" }),
        form.stepper({ value_by_state: SCALE }),
        form.text({ text: "Input Mode" }),
        form.toggle_button({ value_by_state: INPUT_MODE }),
        form.text({ text: "Animation Level" }),
        form.toggle_button({ value_by_state: ANIMATION_LEVEL }),
        form.text({ text: "Animation Speed" }),
        form.slider({ value_by_state: ANIMATION_SPEED, live: true }),
        this.advanced_group,
      ],
    });
    this.appendChild(
      form.group({
        elements: [
          form.toggle_button({ value_by_state: THEME }),
          this.main_group,
          advanced,
        ],
      }),
    );

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
  element: Element = document.documentElement,
  panel_option_overrides: PanelOptions = {},
): CustomizationPanel {
  const content = new CustomizationPanel(
    element.ownerDocument.panel_container.create_panel({
      closeable: false,
      moveable: false,
      sizeable: false,
      show_titlebar: true,
      width: 20,
      hidden: true,
      auto_hide: true,
      modal: true,
      ...panel_option_overrides,
    }),
  );
  content.panel.content = content;
  return content;
}

export function attach_customization_panel_to_element(
  element: Element,
  element_anchor: CompAnchor,
  panel_anchor: CompAnchor,
  c_panel: CustomizationPanel = customization_panel(element),
): CustomizationPanel {
  element.addEventListener("click", () => {
    const element_position = get_element_anchor_position(
      element,
      element_anchor,
    );
    panel_position_with_anchor(c_panel.panel, element_position, panel_anchor);
    c_panel.panel.hide = false;
    c_panel.panel.focus_panel();
  });
  return c_panel;
}
