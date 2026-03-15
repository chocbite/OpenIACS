import { Base, define_element } from "@chocbite/ts-lib-base";
import type { SVGFunc } from "@chocbite/ts-lib-svg";
import "./topbar.scss";

export const TopBarSides = {
  LEFT: "left",
  MID: "mid",
  RIGHT: "right",
} as const;
export type TopBarSides = (typeof TopBarSides)[keyof typeof TopBarSides];

class Topbar extends Base {
  static element_name() {
    return "topbar";
  }
  static element_name_space() {
    return "ui";
  }

  #right = this.appendChild(document.createElement("div"));
  #mid = this.appendChild(document.createElement("div"));
  #left = this.appendChild(document.createElement("div"));

  constructor() {
    super();
  }

  add_item<T extends HTMLElement>(item: T, side: TopBarSides): T {
    switch (side) {
      case TopBarSides.LEFT:
        this.#left.appendChild(item);
        break;
      case TopBarSides.MID:
        this.#mid.appendChild(item);
        break;
      case TopBarSides.RIGHT:
        this.#right.appendChild(item);
        break;
    }
    return item;
  }
}
define_element(Topbar);

export function topbar(): Topbar {
  return new Topbar();
}

class TopbarButton extends Base {
  static element_name() {
    return "topbar-button";
  }
  static element_name_space() {
    return "ui";
  }

  constructor() {
    super();
  }

  set text(text: string) {
    this.textContent = text;
  }

  set on_click(func: () => void) {
    this.onclick = func;
  }
}
define_element(TopbarButton);

export function topbar_button(text: string, on_click: () => void) {
  const button = new TopbarButton();
  button.text = text;
  button.on_click = on_click;
  return button;
}

class TopbarButtonIcon extends Base {
  static element_name() {
    return "topbar-button-icon";
  }
  static element_name_space() {
    return "ui";
  }

  constructor() {
    super();
  }

  set icon(svg: SVGFunc) {
    this.replaceChildren(svg());
  }

  set on_click(func: () => void) {
    this.onclick = func;
  }
}
define_element(TopbarButtonIcon);

export function topbar_button_icon(icon: SVGFunc, on_click: () => void) {
  const button = new TopbarButtonIcon();
  button.icon = icon;
  button.on_click = on_click;
  return button;
}

class TopbarLabel extends Base {
  static element_name() {
    return "topbar-label";
  }
  static element_name_space() {
    return "ui";
  }

  constructor() {
    super();
  }

  set text(text: string) {
    this.textContent = text;
  }
}
define_element(TopbarLabel);

export function topbar_label(text: string) {
  const label = new TopbarLabel();
  label.text = text;
  return label;
}
