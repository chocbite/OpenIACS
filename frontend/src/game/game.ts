import { err, ok, ResultOk } from "@chocbite/ts-lib-result";
import state from "@chocbite/ts-lib-state";
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
      uuid: this.uuid,
      name: this.#game_name,
      creation_date: this.#creation_date,
    };
  }
}

export const games = state.rosw<Game[]>(
  parse_games(game_storage.get("games", [])),
);
game_storage.register("games", games);

function parse_games(data: ResultOk<never[]>): ResultOk<Game[]> {
  return ok(
    data.value
      .map((data: Partial<ReturnType<Game["toJSON"]>>) => {
        if (typeof data !== "object" || data === null)
          return err("Invalid game data");
        if (!data.uuid) return err("Missing uuid");
        if (!data.name) return err("Missing name");
        if (!data.creation_data) return err("Missing creation data");
        return ok(new Game(data.uuid, data.name, new Date(data.creation_data)));
      })
      .filter((result) => result.ok)
      .map((result) => result.value),
  );
}
