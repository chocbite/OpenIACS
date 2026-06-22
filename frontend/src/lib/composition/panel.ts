import { Base, define_element } from "@chocbite/ts-lib-base";
import type { SVGFunc } from "@chocbite/ts-lib-svg";
import { px_to_rem, rem_to_px } from "@chocbite/ts-lib-theme";
import { ContentBase } from "./content";
import "./panel.scss";
import "./shared";
import type { CompAnchor, CompPosition } from "./shared";

const MIN_WIDTH = 4; //rem
const MIN_HEIGHT = 4; //rem

export type PanelSizers =
  | boolean
  | "all"
  | "nsew"
  | "nse"
  | "ns"
  | "n"
  | "s"
  | "se"
  | "sw"
  | "e"
  | "ew"
  | "w";
export interface PanelOptions {
  show_titlebar?: boolean;
  closeable?: boolean;

  //Composition
  layer?: number;
  hidden?: boolean;
  auto_hide?: boolean;
  modal?: boolean;
  auto_close?: boolean;

  //Accessories
  content: ContentBase;

  //Positioning
  moveable?: boolean;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;

  //Sizing
  sizeable?: PanelSizers;
  width?: number;
  height?: number;
}

export interface PanelContainer {
  readonly width: number;
  readonly height: number;
  set_layer(panel: Panel, layer: number): void;
  focus_panel(panel: Panel): void;
}

export class Panel extends Base {
  static element_name() {
    return "panel";
  }
  static element_name_space() {
    return "ui";
  }

  #container: PanelContainer;
  get #container_height(): number {
    return this.#container.height;
  }
  get #container_width(): number {
    return this.#container.width;
  }

  constructor(
    container: PanelContainer,
    options: PanelOptions & { layer: number },
  ) {
    super();

    this.#container = container;
    this.#layer = options.layer;
    this.tabIndex = 0;

    //Sizing
    this.#sizer = this.appendChild(document.createElement("div"));
    this.sizeable = options.sizeable ?? true;
    this.width = options.width;
    this.height = options.height;

    //Titlebar
    this.#titlebar = this.appendChild(document.createElement("div"));
    this.#titlebar.tabIndex = 0;
    this.#titlebar.onpointerdown = (e) => {
      if (!this.#moveable) return;
      this.#titlebar.setPointerCapture(e.pointerId);
      this.#titlebar.classList.add("moving");
      const start_x = e.clientX;
      const start_y = e.clientY;
      const orig_left = this.getBoundingClientRect().left;
      const orig_top = this.getBoundingClientRect().top;

      this.#titlebar.onpointermove = (ev: PointerEvent) => {
        const delta_x = ev.clientX - start_x;
        const delta_y = ev.clientY - start_y;
        const window = this.ownerDocument.defaultView!;
        const width = this.width;
        const px_width = rem_to_px(width);
        if (this.left + width / 2 > this.#container_width / 2)
          this.right = px_to_rem(
            window.innerWidth - (orig_left + delta_x + px_width),
          );
        else this.left = px_to_rem(orig_left + delta_x);
        const height = this.height;
        const px_height = rem_to_px(height);
        if (this.top + height / 2 > this.#container_height / 2)
          this.bottom = px_to_rem(
            window.innerHeight - (orig_top + delta_y + px_height),
          );
        else this.top = px_to_rem(orig_top + delta_y);
      };
      this.#titlebar.onpointerup = (ev: PointerEvent) => {
        this.#titlebar.releasePointerCapture(ev.pointerId);
        this.#titlebar.classList.remove("moving");
        this.#titlebar.onpointermove = null;
        this.#titlebar.onpointerup = null;
      };
    };
    this.#titlebar.onkeydown = (e) => {
      const offset = e.shiftKey ? 5 : e.ctrlKey ? 0.1 : 1;
      if (e.key === "ArrowDown") {
        if (this.#top !== undefined) this.top = this.top + offset;
        else this.bottom = this.bottom - offset;
      } else if (e.key === "ArrowUp") {
        if (this.#top !== undefined) this.top = this.top - offset;
        else this.bottom = this.bottom + offset;
      } else if (e.key === "ArrowLeft") {
        if (this.#left !== undefined) this.left = this.left - offset;
        else this.right = this.right + offset;
      } else if (e.key === "ArrowRight") {
        if (this.#left !== undefined) this.left = this.left + offset;
        else this.right = this.right - offset;
      } else return;
      e.preventDefault();
      e.stopPropagation();
    };
    this.show_titlebar = options.show_titlebar ?? true;
    this.#title = this.#titlebar.appendChild(document.createElement("div"));

    this.#content = this.appendChild(document.createElement("div"));
    if (options.content) this.content = options.content;

    //Positioning
    this.#moveable = options.moveable ?? true;
    let pos = 0;
    if (options.top !== undefined) this.top = options.top;
    else if (options.bottom !== undefined) this.bottom = options.bottom;
    else pos++;
    if (options.left !== undefined) this.left = options.left;
    else if (options.right !== undefined) this.right = options.right;
    else pos++;
    if (pos === 2) this.center = true;

    //Composition
    if (options.hidden) this.hide = true;
    if (options.auto_hide) this.auto_hide = true;
    if (options.modal) this.modal = true;
  }

  //       _____ ____  __  __ _____   ____   _____ _____ _______ _____ ____  _   _
  //      / ____/ __ \|  \/  |  __ \ / __ \ / ____|_   _|__   __|_   _/ __ \| \ | |
  //     | |   | |  | | \  / | |__) | |  | | (___   | |    | |    | || |  | |  \| |
  //     | |   | |  | | |\/| |  ___/| |  | |\___ \  | |    | |    | || |  | | . ` |
  //     | |___| |__| | |  | | |    | |__| |____) |_| |_   | |   _| || |__| | |\  |
  //      \_____\____/|_|  |_|_|     \____/|_____/|_____|  |_|  |_____\____/|_| \_|
  #layer: number;
  set layer(value: number) {
    this.#layer = value;
    this.#container.set_layer(this, value);
  }
  get layer(): number {
    return this.#layer;
  }

  set hide(hide: boolean) {
    if (hide) {
      this.classList.add("hidden");
      if (this.auto_hide) this.#detach_auto_hide_listener();
    } else {
      this.classList.remove("hidden");
      if (this.auto_hide) this.#attach_auto_hide_listener();
    }
  }
  get hide(): boolean {
    return this.classList.contains("hidden");
  }

  set auto_hide(auto_hide: boolean) {
    if (auto_hide && !this.#auto_hide_listener) {
      this.#auto_hide_listener = (e) => {
        if (!this.contains(e.target as Node) || e.target === this)
          this.hide = true;
      };
      if (!this.hide) this.#attach_auto_hide_listener();
    } else if (!auto_hide && this.#auto_hide_listener) {
      this.#detach_auto_hide_listener();
      this.#auto_hide_listener = undefined;
    }
  }
  get auto_hide(): boolean {
    return Boolean(this.#auto_hide_listener);
  }
  #auto_hide_listener?: EventListener;
  #attach_auto_hide_listener() {
    if (!this.#auto_hide_listener) return;
    this.ownerDocument.addEventListener(
      "pointerdown",
      this.#auto_hide_listener,
      { capture: true, passive: true },
    );
  }
  #detach_auto_hide_listener() {
    if (!this.#auto_hide_listener) return;
    this.ownerDocument.removeEventListener(
      "pointerdown",
      this.#auto_hide_listener,
      { capture: true },
    );
  }

  #auto_close_listener?: EventListener;
  set auto_close(close: boolean) {
    if (close && !this.#auto_close_listener) {
      this.ownerDocument.addEventListener(
        "pointerdown",
        (this.#auto_close_listener = (e) => {
          if ((close && !this.contains(e.target as Node)) || e.target === this)
            this.close();
        }),
        { capture: true, passive: true },
      );
    } else if (!close && this.#auto_close_listener) {
      this.ownerDocument.removeEventListener(
        "pointerdown",
        this.#auto_close_listener,
        { capture: true },
      );
      this.#auto_close_listener = undefined;
    }
  }
  get auto_close(): boolean {
    return Boolean(this.#auto_close_listener);
  }

  set modal(modal: boolean) {
    if (modal) this.classList.add("modal");
    else this.classList.remove("modal");
  }
  get modal(): boolean {
    return this.classList.contains("modal");
  }

  focus_panel(): void {
    this.#container.focus_panel(this);
  }

  close(): void {
    this.remove();
  }

  //               _____ _____ ______  _____ _____  ____  _____  _____ ______  _____
  //         /\   / ____/ ____|  ____|/ ____/ ____|/ __ \|  __ \|_   _|  ____|/ ____|
  //        /  \ | |   | |    | |__  | (___| (___ | |  | | |__) | | | | |__  | (___
  //       / /\ \| |   | |    |  __|  \___ \\___ \| |  | |  _  /  | | |  __|  \___ \
  //      / ____ \ |___| |____| |____ ____) |___) | |__| | | \ \ _| |_| |____ ____) |
  //     /_/    \_\_____\_____|______|_____/_____/ \____/|_|  \_\_____|______|_____/
  #titlebar: HTMLDivElement;
  #icon?: HTMLFormElement;
  #title: HTMLDivElement;
  #close_button?: HTMLSpanElement;

  set show_titlebar(show: boolean) {
    if (show) this.#titlebar.classList.remove("hidden");
    else this.#titlebar.classList.add("hidden");
  }

  get show_titlebar(): boolean {
    return !this.#titlebar.classList.contains("hidden");
  }

  #set_icon(icon?: SVGFunc) {
    if (icon) {
      if (!this.#icon) {
        this.#icon = document.createElement("form");
        this.#titlebar.prepend(this.#icon);
      }
      this.#icon.replaceChildren(icon());
    } else if (this.#icon) {
      this.#icon.remove();
      this.#icon = undefined;
    }
  }

  #closable(closable: boolean) {
    if (closable && !this.#close_button) {
      this.#close_button = document.createElement("span");
      this.#titlebar.appendChild(this.#close_button);
      this.#close_button.classList.add("close-button");
      this.#close_button.textContent = "×";
      this.#close_button.onpointerdown = (e) => {
        e.stopPropagation();
        this.close();
      };
    } else if (!closable && this.#close_button) {
      this.#close_button.remove();
      this.#close_button = undefined;
    }
  }

  #set_title(title: string) {
    this.#title.textContent = title;
  }

  #content: HTMLDivElement;
  set content(cont: ContentBase) {
    this.#content.replaceChildren(cont);
    this.attach_state(cont.icon, (c) =>
      this.#set_icon(c.value.unwrap_or(undefined)),
    );
    this.attach_state(cont.name, (c) => this.#set_title(c.value));
    this.attach_state(cont.closable, (c) => this.#closable(c.value));
  }
  get content(): ContentBase | undefined {
    return (this.#content.firstElementChild as ContentBase) ?? undefined;
  }

  //      _____   ____   _____ _____ _______ _____ ____  _   _ _____ _   _  _____
  //     |  __ \ / __ \ / ____|_   _|__   __|_   _/ __ \| \ | |_   _| \ | |/ ____|
  //     | |__) | |  | | (___   | |    | |    | || |  | |  \| | | | |  \| | |  __
  //     |  ___/| |  | |\___ \  | |    | |    | || |  | | . ` | | | | . ` | | |_ |
  //     | |    | |__| |____) |_| |_   | |   _| || |__| | |\  |_| |_| |\  | |__| |
  //     |_|     \____/|_____/|_____|  |_|  |_____\____/|_| \_|_____|_| \_|\_____|
  #moveable: boolean;
  #top?: number;
  #bottom?: number;
  #left?: number;
  #right?: number;

  //**Makes sure the panel is within the container boundaries */
  enforce_limits() {
    if (this.#top !== undefined) this.top = this.#top;
    if (this.#bottom !== undefined) this.bottom = this.#bottom;
    if (this.#left !== undefined) this.left = this.#left;
    if (this.#right !== undefined) this.right = this.#right;
    if (this.#width !== undefined)
      this.width = Math.min(this.width, this.#container_width);
    if (this.#height !== undefined)
      this.height = Math.min(this.height, this.#container_height);
  }

  set moveable(value: boolean) {
    this.#moveable = value;
  }
  get moveable(): boolean {
    return this.#moveable;
  }

  set center(value: boolean) {
    if (value && !this.center) {
      this.#top = undefined;
      this.#bottom = undefined;
      this.#left = undefined;
      this.#right = undefined;
      this.style.top = "";
      this.style.bottom = "";
      this.style.left = "";
      this.style.right = "";
    } else if (!value && this.center) {
      this.top = this.top;
      this.left = this.left;
    }
  }
  get center(): boolean {
    return (
      this.#top === undefined &&
      this.#bottom === undefined &&
      this.#left === undefined &&
      this.#right === undefined
    );
  }

  set top(value: number) {
    this.#top = Math.max(Math.min(value, this.#container_height - 2), 0);
    this.#bottom = undefined;
    this.style.top = this.#top + "rem";
    this.style.bottom = "";
  }
  get top(): number {
    return this.#top ?? px_to_rem(this.getBoundingClientRect().top);
  }

  set bottom(value: number) {
    const height = this.height;
    this.#bottom = Math.max(
      Math.min(value, this.#container_height - height),
      -height + 2,
    );
    this.#top = undefined;
    this.style.bottom = this.#bottom + "rem";
    this.style.top = "";
  }
  get bottom(): number {
    return (
      this.#bottom ??
      this.#container_height - px_to_rem(this.getBoundingClientRect().bottom)
    );
  }

  set left(value: number) {
    this.#left = Math.max(
      Math.min(value, this.#container_width - this.width / 2),
      -(this.width / 2),
    );
    this.#right = undefined;
    this.style.left = this.#left + "rem";
    this.style.right = "";
  }
  get left(): number {
    return this.#left ?? px_to_rem(this.getBoundingClientRect().left);
  }

  set right(value: number) {
    this.#right = Math.max(
      Math.min(value, this.#container_width - this.width / 2),
      -(this.width / 2),
    );
    this.#left = undefined;
    this.style.right = this.#right + "rem";
    this.style.left = "";
  }
  get right(): number {
    return (
      this.#right ??
      this.#container_width - px_to_rem(this.getBoundingClientRect().right)
    );
  }

  //       _____ _____ ___________ _   _  _____
  //      / ____|_   _|___  /_   _| \ | |/ ____|
  //     | (___   | |    / /  | | |  \| | |  __
  //      \___ \  | |   / /   | | | . ` | | |_ |
  //      ____) |_| |_ / /__ _| |_| |\  | |__| |
  //     |_____/|_____/_____|_____|_| \_|\_____|
  #sizer: HTMLDivElement;
  #sizeable: PanelSizers = true;
  #width?: number;
  #height?: number;

  set sizeable(value: PanelSizers) {
    if (typeof value === "string") this.classList.add("visible");
    else this.classList.remove("visible");
    if (value === true || value === "all") value = "nsew";
    if (value === false) {
      if (this.#sizer.children.length === 0) this.#sizer.replaceChildren();
      return;
    } else if (value === "nsew" && this.#sizer.children.length === 8) return;
    this.#sizeable = value;
    this.#sizer.replaceChildren();
    this.#sizer.classList.remove("n", "s", "e", "w");
    this.classList.remove("n", "s", "e", "w");
    const sizers = value.split("");
    this.#sizer.classList.add(...sizers);
    this.classList.add(...sizers);
    if (sizers.includes("n") && sizers.includes("e")) sizers.push("ne");
    if (sizers.includes("n") && sizers.includes("w")) sizers.push("nw");
    if (sizers.includes("s") && sizers.includes("e")) sizers.push("se");
    if (sizers.includes("s") && sizers.includes("w")) sizers.push("sw");
    for (const sizer of sizers) {
      const div = this.#sizer.appendChild(document.createElement("div"));
      div.classList.add(sizer);
      if (sizer.length === 1) div.innerHTML = "<div>\ue25d</div>";
      const north = sizer.includes("n");
      const south = sizer.includes("s");
      const east = sizer.includes("e");
      const west = sizer.includes("w");
      const vert = north || south;
      const horz = east || west;
      div.onpointerdown = (e) => {
        this.#sizer.setPointerCapture(e.pointerId);
        const start_x = e.clientX;
        const start_y = e.clientY;
        const top = this.#top;
        const bottom = this.#bottom;
        const left = this.#left;
        const right = this.#right;
        if (!this.center) {
          if (east) this.left = this.left;
          if (west) this.right = this.right;
          if (north) this.bottom = this.bottom;
          if (south) this.top = this.top;
        }
        const orig_width = horz ? this.width : 0;
        const orig_height = vert ? this.height : 0;

        this.#sizer.onpointermove = (ev: PointerEvent) => {
          const center = this.center ? 2 : 1;
          const delta_x = px_to_rem(ev.clientX - start_x);
          if (east) this.width = orig_width + delta_x * center;
          else if (west) this.width = orig_width - delta_x * center;
          const delta_y = px_to_rem(ev.clientY - start_y);
          if (south) this.height = orig_height + delta_y * center;
          else if (north) this.height = orig_height - delta_y * center;
        };
        this.#sizer.onpointerup = (ev: PointerEvent) => {
          this.#sizer.releasePointerCapture(ev.pointerId);
          this.#sizer.onpointermove = null;
          this.#sizer.onpointerup = null;
          if (top) this.top = this.top;
          if (bottom) this.bottom = this.bottom;
          if (left) this.left = this.left;
          if (right) this.right = this.right;
          this.#titlebar.focus();
        };
      };
    }
  }
  get sizeable(): PanelSizers {
    return this.#sizeable;
  }

  /**Sets the width of the panel, undefined means the panel uses css fit-content */
  set width(value: number | undefined) {
    if (value === undefined) {
      this.#width = undefined;
      this.style.width = "";
      return;
    }
    this.#width = Math.min(Math.max(value, MIN_WIDTH), this.#container_width);
    this.style.width = this.#width + "rem";
  }
  get width(): number {
    return this.#width ?? px_to_rem(this.getBoundingClientRect().width);
  }

  set height(value: number | undefined) {
    if (value === undefined) {
      this.#height = undefined;
      this.style.height = "";
      return;
    }
    this.#height = Math.min(
      Math.max(value, MIN_HEIGHT),
      this.#container_height,
    );
    this.style.height = this.#height + "rem";
  }
  get height(): number {
    return this.#height ?? px_to_rem(this.getBoundingClientRect().height);
  }
}
define_element(Panel);

export function panel_position_with_anchor(
  panel: Panel,
  position: CompPosition,
  anchor: CompAnchor,
) {
  const width = px_to_rem(panel.ownerDocument.defaultView?.innerWidth ?? 0);
  const height = px_to_rem(panel.ownerDocument.defaultView?.innerHeight ?? 0);
  const [f, l] = anchor.split("_");
  if (position.x < width / 2) {
    if (l === "left") panel.left = position.x;
    else panel.left = position.x - panel.width;
  } else {
    if (l === "left") panel.right = width - position.x - panel.width;
    else panel.right = width - position.x;
  }
  if (position.y < height / 2) {
    if (f === "top") panel.top = position.y;
    else panel.top = position.y - panel.height;
  } else {
    if (f === "top") panel.bottom = position.y - panel.height;
    else panel.bottom = position.y;
  }
}
