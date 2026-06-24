import { define_element } from "@chocbite/ts-lib-base";
import { material_casino_rounded } from "@chocbite/ts-lib-icons";
import { some } from "@chocbite/ts-lib-result";
import state from "@chocbite/ts-lib-state";
import { main_panel_container } from "@libComposition";
import { ContentBase } from "../lib/composition/content";
import type { Character } from "./character";

export class Game {
  //Stores all characters in the game
  #characters = state.ok_w<Character[]>([]);

  #game_name = state.ok_w("New Game");
  readonly game_name = this.#game_name.read_write;

  save() {}
}

export class GameUI extends ContentBase {
  static element_name(): string {
    return "ui";
  }
  static element_name_space(): string {
    return "game";
  }

  #content_title = state.proxy.ros(state.ok("").read_only);
  get content_title() {
    return this.#content_title;
  }
  get content_icon() {
    return state.ok(some(material_casino_rounded));
  }
  get content_closable() {
    return state.ok(true);
  }
  get content_min_size() {
    return state.ok(some({ width: 20, height: 10 }));
  }

  protected async content_on_close(): Promise<void> {
    return;
  }

  constructor(game: Game) {
    super();
    this.#game = game;
    this.game = game;
  }

  #game: Game;
  set game(game: Game) {
    this.#game = game;
    this.#content_title.set_state(game.game_name);
  }
}
define_element(GameUI);

console.warn("yoyoyo");

main_panel_container.create_panel({
  content: new GameUI(new Game()),
  width: 10,
  height: 10,
});
