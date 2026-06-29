import { define_element } from "@chocbite/ts-lib-base";
import { state, type StateROS } from "@chocbite/ts-lib-state";
import { ContentBase } from "@libComposition";

export class Prompt extends ContentBase {
  static element_name() {
    return "prompt";
  }
  static element_name_space() {
    return "prompt";
  }

  get content_closable(): StateROS<boolean> {
    return state.ok(true);
  }

  #title;
  get content_title(): StateROS<string> {
    return this.#title;
  }

  constructor(title: string, element: HTMLElement) {
    super();
    this.#title = state.ok(title);
    this.appendChild(element);
  }
}
define_element(Prompt);
