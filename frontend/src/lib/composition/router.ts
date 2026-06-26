import { define_element } from "@chocbite/ts-lib-base";
import { none, type Option } from "@chocbite/ts-lib-result";
import state, { type StateROS } from "@chocbite/ts-lib-state";
import type { SVGFunc } from "@chocbite/ts-lib-svg";
import { ContentBase } from "./content";
import "./router.scss";
import "./shared";
import type { CompMinSize } from "./shared";

export interface Router {
  /**Navigate to a new url */
  navigate(url: string): void;
  /**Navigate back in history */
  back(): void;
  /**Navigate forward in history */
  forward(): void;
}

export interface RouterProvider {}

/**Special content to display multiple contents in the same space with an url
 *With back/forward navigation support */
export class ContentRouter extends ContentBase implements Router {
  static element_name() {
    return "router";
  }
  static element_name_space() {
    return "ui";
  }

  get content_title(): StateROS<string> {
    return state.ok("Router");
  }
  get content_icon(): StateROS<Option<SVGFunc>> {
    return state.ok(none());
  }
  get content_closable(): StateROS<boolean> {
    return state.ok(true);
  }
  get content_min_size(): StateROS<Option<CompMinSize>> {
    return state.ok(none());
  }
  protected async content_on_close(): Promise<void> {
    return undefined;
  }

  async content_close(_args: void): Promise<Option<void>> {
    return none();
  }

  constructor() {
    super();
  }

  #history: string[][] = [];

  navigate() {}

  back() {}

  forward() {}
}
define_element(ContentRouter);

export function router(): ContentRouter {
  return new ContentRouter();
}
