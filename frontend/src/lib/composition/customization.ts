import { define_element } from "@chocbite/ts-lib-base";
import form from "@chocbite/ts-lib-form";
import { material_brightness_medium_rounded } from "@chocbite/ts-lib-icons";
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
import { ContentBase } from "./content";
import { panel_position_with_anchor } from "./panel";
import { get_element_anchor_position, type CompAnchor } from "./shared";

class Customization extends ContentBase {
  static element_name() {
    return "customization-panel";
  }
  static element_name_space() {
    return "ui";
  }

  readonly main_group;
  readonly advanced_group;

  constructor() {
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
  }

  get content_title() {
    return state.ok("Customization");
  }
  get content_icon() {
    return state.ok(some(material_brightness_medium_rounded));
  }
  get content_closable() {
    return state.ok(true);
  }
  get content_min_size() {
    return state.ok(some({ width: 10, height: 6 }));
  }

  protected async content_on_close(): Promise<void> {
    return;
  }
}
define_element(Customization);

class CustomizationPanel {
  readonly panel: Panel;
  readonly main_group;
  readonly advanced_group;

  constructor(panel: Panel, content: Customization) {
    this.panel = panel;
    this.main_group = content.main_group;
    this.advanced_group = content.advanced_group;
  }
}

export function customization_panel(
  element: Element = document.documentElement,
  panel_option_overrides: Omit<PanelOptions, "content"> = {},
): CustomizationPanel {
  const content = new Customization();
  return new CustomizationPanel(
    element.ownerDocument.panel_container.create_panel({
      closeable: false,
      moveable: false,
      sizeable: false,
      show_titlebar: false,
      width: 20,
      hidden: true,
      auto_hide: true,
      modal: true,
      ...panel_option_overrides,
      content: content,
    }),
    content,
  );
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
