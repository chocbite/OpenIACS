import { Base, define_element } from "@chocbite/ts-lib-base";
import "./topbar.scss";

export const TopBarSides = {
  LEFT: "L",
  MID: "M",
  RIGHT: "R",
} as const;
export type TopBarSides = (typeof TopBarSides)[keyof typeof TopBarSides];

export class Topbar extends Base {
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

export class TopbarButton extends Base {
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
}
define_element(TopbarButton);

export class TopbarLabel extends Base {
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
