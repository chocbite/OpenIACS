import state from "@chocbite/ts-lib-state";
import type { Entity } from "./entity";
import type { Fact } from "./fact";

export class Game {
  //Stores all facts in the game
  #fact_store = state.ok_w<Fact[]>([]);
  push_fact(fact: Fact) {
    this.#fact_store.array.push(fact);
  }
  //Stores all entities in the game
  #entity_store = state.ok_w<Entity[]>([]);
  push_entity(entity: Entity) {
    this.#entity_store.array.push(entity);
  }
}
