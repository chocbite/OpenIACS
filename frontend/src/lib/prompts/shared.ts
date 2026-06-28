import { define_element } from "@chocbite/ts-lib-base";
import { state, type StateROS } from "@chocbite/ts-lib-state";
import { ContentBase } from "@libComposition";

export class Prompt<T> extends ContentBase<T> {
  static element_name() {
    return "prompt";
  }
  static element_name_space() {
    return "prompt";
  }

  get content_closable(): StateROS<boolean> {
    return state.ok(true);
  }

  constructor(element: HTMLElement) {
    super();
    this.appendChild(element);
  }
}
define_element(Prompt);
