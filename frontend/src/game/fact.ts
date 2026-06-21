import state from "@chocbite/ts-lib-state";
import type { Entity } from "./entity";
import type { Game } from "./game";
import { Part } from "./shared";

export class Fact extends Part {
  #description;
  readonly description;
  readonly owner: Entity;
  #game: Game;

  constructor(game: Game, desc: string, owner: Entity, uuid?: string) {
    super(uuid);
    this.#game = game;
    this.#description = state.ok_w(desc);
    this.description = this.#description.read_write;
    this.owner = owner;
    this.#game.push_fact(this);
  }
}
