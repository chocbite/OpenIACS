export { main_panel_container } from "./container";
export { Panel, type PanelOptions } from "./panel";
export { CompAnchor, type CompMinSize, type CompPosition } from "./shared";
import {
  attach_customization_panel_to_element,
  customization_panel,
} from "./customization";
import { router } from "./router";
import { get_element_anchor_position } from "./shared";
import {
  topbar,
  topbar_button,
  topbar_button_icon,
  topbar_label,
} from "./topbar";

export const comp = {
  topbar,
  topbar_button,
  topbar_button_icon,
  topbar_label,
  customization_panel,
  attach_customization_panel_to_element,
  get_element_anchor_position,
  router,
};

export { Content, ContentBase } from "./content";
export type { Router } from "./router";
export { TopBarSides } from "./topbar";
