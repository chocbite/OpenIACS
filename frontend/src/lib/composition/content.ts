import { Base, define_element } from "@chocbite/ts-lib-base";
import { none, ok, type Option } from "@chocbite/ts-lib-result";
import { state, type StateROS } from "@chocbite/ts-lib-state";
import type { SVGFunc } from "@chocbite/ts-lib-svg";
import "./content.scss";
import "./shared";
import type { CompMinSize } from "./shared";

const PRIVATE_FOCUSED_CONTENT = state.err<ContentBase>("No content focused");
export const FOCUSED_CONTENT = PRIVATE_FOCUSED_CONTENT.read_only;

export abstract class ContentBase<Close = void> extends Base {
  static element_name() {
    return "@abstract@";
  }
  static element_name_space() {
    return "@abstract@";
  }

  abstract readonly content_title: StateROS<string>;
  abstract readonly content_icon: StateROS<Option<SVGFunc>>;
  abstract readonly content_closable: StateROS<boolean>;
  abstract readonly content_min_size: StateROS<Option<CompMinSize>>;
  protected abstract content_on_close(): Promise<Close>;

  async content_close(_args: Close): Promise<Option<Close>> {
    return none();
  }

  constructor() {
    super();
    this.tabIndex = 0;
    this.classList.add("content");
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

  async content_close(_args: void): Promise<Option<void>> {
    return none();
  }

  protected async content_on_close(): Promise<void> {
    return;
  }

  constructor() {
    super();
  }
}
define_element(Content);
