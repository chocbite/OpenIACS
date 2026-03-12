import { Base, define_element } from "@chocbite/ts-lib-base";
import { none, type Option } from "@chocbite/ts-lib-result";
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

  abstract readonly name: StateROS<string>;
  abstract readonly icon: StateROS<Option<SVGFunc>>;
  abstract readonly closable: StateROS<boolean>;
  abstract readonly min_size: StateROS<Option<CompMinSize>>;
  abstract on_close(): Promise<Close>;

  async close(_args: Close): Promise<Option<Close>> {
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

  #name = state.s.ros.ok("");
  get name() {
    return this.#name.read_only;
  }
  set_name(value: string) {
    this.#name.set_ok(value);
  }

  #icon = state.s.ros.ok<Option<SVGFunc>>(none());
  get icon() {
    return this.#icon.read_only;
  }
  set_icon(value: Option<SVGFunc>) {
    this.#icon.set_ok(value);
  }

  #closable = state.s.ros.ok(false);
  get closable() {
    return this.#closable.read_only;
  }
  set_closable(value: boolean) {
    this.#closable.set_ok(value);
  }

  #min_size = state.s.ros.ok<Option<CompMinSize>>(none());
  get min_size() {
    return this.#min_size.read_only;
  }
  set_min_size(value: Option<CompMinSize>) {
    this.#min_size.set_ok(value);
  }

  async close(_args: void): Promise<Option<void>> {
    return none();
  }

  async on_close(): Promise<void> {
    return;
  }

  constructor() {
    super();
  }
}
define_element(Content);
