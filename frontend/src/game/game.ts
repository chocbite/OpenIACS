import { err, ok, ResultOk } from "@chocbite/ts-lib-result";
import state, { type StateROS } from "@chocbite/ts-lib-state";
import type { Character } from "./character";
import { game_storage, Part } from "./shared";

game_storage.make_sub_group("games");

export class Game extends Part {
  //Stores all characters in the game
  #characters = state.ok_w<Character[]>([]);

  #game_name = state.ok_w("New Game");
  readonly game_name = this.#game_name.read_write;

  #creation_date = state.ok_w(new Date());
  readonly creation_date = this.#creation_date.read_only;

  constructor(uuid?: string, name?: string, creation_date?: Date) {
    super(uuid);
    if (name) this.#game_name.set_ok(name);
    if (creation_date) this.#creation_date.set_ok(creation_date);
  }

  [state.v.OVERRIDE_KEY]() {
    return {
      characters: this.#characters,
      uuid: this.uuid,
      name: this.#game_name,
      creation_date: this.#creation_date,
    };
  }
}

export const games = state.rosw<StateROS<Game>[]>(
  parse_games(game_storage.get("games", [])),
);
game_storage.register("games", games);

function parse_games(data: ResultOk<unknown>): ResultOk<StateROS<Game>[]> {
  if (!Array.isArray(data.value)) return ok([]);
  const yo = (data.value as unknown[])
    .map((d) => {
      if (typeof d !== "object" || d === null) return err("Invalid game data");
      if (!("uuid" in d)) return err("Missing uuid");
      if (typeof d.uuid !== "string") return err("Invalid uuid");
      if (!("name" in d)) return err("Missing name");
      if (typeof d.name !== "string") return err("Invalid name");
      if (!("creation_date" in d)) return err("Missing creation date");
      if (typeof d.creation_date !== "string")
        return err("Invalid creation date");
      return ok(new Game(d.uuid, d.name, new Date(d.creation_date)));
    })
    .filter((result) => result.ok)
    .map((result) => state.ok(result.value));
  return ok(yo);
}
