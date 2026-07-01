import { define_element } from "@chocbite/ts-lib-base";
import { ctm, type ContextMenuLines } from "@chocbite/ts-lib-context-menu";
import form from "@chocbite/ts-lib-form";
import { material_casino_rounded } from "@chocbite/ts-lib-icons";
import { some } from "@chocbite/ts-lib-result";
import state from "@chocbite/ts-lib-state";
import { ContentBase } from "@libComposition";
import { prompts } from "@libPrompts";
import type { Game } from "./game";

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
  get content_context_lines(): ContextMenuLines {
    return [
      ctm.line("Rename Game", async () => {
        (
          await prompts.form(
            "Rename Game",
            [form.text_input({ id: "name", value: this.#game.game_name.ok() })],
            {
              text: "Rename",
            },
          )
        ).map((v) => {
          this.#game.game_name.write(v.name!);
        });
      }),
    ];
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
