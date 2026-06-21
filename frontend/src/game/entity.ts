import state from "@chocbite/ts-lib-state";
import type { Fact } from "./fact";
import { Part } from "./shared";

export class Entity extends Part {
  #description;
  readonly description;
  #fact_store = state.ok_w<Fact[]>([]);
  readonly facts = this.#fact_store.read_write;

  constructor(uuid: string, desc: string) {
    super(uuid);
    this.#description = state.ok_w(desc);
    this.description = this.#description.read_write;
  }
}
