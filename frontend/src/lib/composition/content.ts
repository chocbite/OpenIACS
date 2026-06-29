import { Base, define_element } from "@chocbite/ts-lib-base";
import { ctm, type ContextMenuLines } from "@chocbite/ts-lib-context-menu";
import { none, ok, type Option } from "@chocbite/ts-lib-result";
import { state, type StateROS } from "@chocbite/ts-lib-state";
import type { SVGFunc } from "@chocbite/ts-lib-svg";
import "./content.scss";
import "./shared";
import type { CompMinSize } from "./shared";

const PRIVATE_FOCUSED_CONTENT = state.err<ContentBase>("No content focused");
export const FOCUSED_CONTENT = PRIVATE_FOCUSED_CONTENT.read_only;

export abstract class ContentBase extends Base {
  static element_name() {
    return "@abstract@";
  }
  static element_name_space() {
    return "@abstract@";
  }

  /**Title of content that can be displayed by the container of the content*/
  get content_title(): StateROS<string> {
    return state.ok("");
  }
  /**Icon of content that can be displayed by the container of the content*/
  get content_icon(): StateROS<Option<SVGFunc>> {
    return state.ok(none());
  }
  /**Whether the content can be closed by the container*/
  get content_closable(): StateROS<boolean> {
    return state.ok(false);
  }
  /**Minimum size of the content*/
  get content_min_size(): StateROS<Option<CompMinSize>> {
    return state.ok(none());
  }
  /**Context menu lines of the content, automatically applied to the content itself, may also be used by the container*/
  get content_context_lines(): ContextMenuLines {
    return [];
  }

  #content_on_closers: (() => void)[] = [];

  /**Called when container requests the content to close*/
  content_on_close(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.#content_on_closers.push(resolve);
    });
  }

  #content_on_close_fulfill() {
    for (const closer of this.#content_on_closers) closer();
    this.#content_on_closers = [];
  }

  /**Closes content */
  content_close() {
    this.#content_on_close_fulfill();
    this.dispatchEvent(new CustomEvent("content_closed", { bubbles: true }));
  }

  #on_contect_menu = (e: MouseEvent) => {
    e.preventDefault();
    ctm.summon(
      ctm.menu(this.content_context_lines),
      this,
      e.clientX,
      e.clientY,
    );
  };

  constructor() {
    super();
    this.tabIndex = -1;
    this.classList.add("content");
    this.oncontextmenu = this.#on_contect_menu;
  }
}

export class Content extends ContentBase {
  static element_name() {
    return "content";
  }
  static element_name_space() {
    return "ui";
  }

  #content_title = state.ros(ok(""));
  get content_title() {
    return this.#content_title.read_only;
  }
  set_content_title(value: string) {
    this.#content_title.set_ok(value);
  }

  #content_icon = state.ros(ok<Option<SVGFunc>>(none()));
  get content_icon() {
    return this.#content_icon.read_only;
  }
  set_content_icon(value: Option<SVGFunc>) {
    this.#content_icon.set_ok(value);
  }

  #content_closable = state.ros(ok(false));
  get content_closable() {
    return this.#content_closable.read_only;
  }
  set_content_closable(value: boolean) {
    this.#content_closable.set_ok(value);
  }

  #content_min_size = state.ros(ok<Option<CompMinSize>>(none()));
  get content_min_size() {
    return this.#content_min_size.read_only;
  }
  set_content_min_size(value: Option<CompMinSize>) {
    this.#content_min_size.set_ok(value);
  }

  constructor() {
    super();
  }
}
define_element(Content);
