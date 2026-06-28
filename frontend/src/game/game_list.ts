import { define_element } from "@chocbite/ts-lib-base";
import ctm from "@chocbite/ts-lib-context-menu";
import { material_casino_rounded } from "@chocbite/ts-lib-icons";
import list from "@chocbite/ts-lib-list";
import { some } from "@chocbite/ts-lib-result";
import state from "@chocbite/ts-lib-state";
import { main_panel_container } from "@libComposition";
import { ContentBase } from "../lib/composition/content";
import { Game, games } from "./game";
import { GameUI } from "./game_ui";

export class GameList extends ContentBase {
  static element_name(): string {
    return "list";
  }
  static element_name_space(): string {
    return "game";
  }

  get content_title() {
    return state.ok("Games");
  }
  get content_icon() {
    return state.ok(some(material_casino_rounded));
  }
  get content_closable() {
    return state.ok(true);
  }

  constructor() {
    super();

    this.appendChild(
      list.container(
        {
          name: list.column_string("Name"),
          created: list.column_string("Created"),
        },
        (row) => {
          return {
            values: {
              name: row.game_name.ok(),
              created: row.creation_data.ok().toLocaleString(),
            },
            context_menu() {
              return some(
                ctm.menu([
                  ctm.line("Delete", () => games.array.delete(row)),
                  ctm.line("Open", () => {
                    main_panel_container.create_panel(new GameUI(row), {
                      width: 20,
                    });
                  }),
                ]),
              );
            },
          };
        },
        games,
        {
          sub_rows: false,
          add_row: {
            text: "New Game",
            on_add() {
              games.array.push(new Game());
            },
          },
        },
      ),
    );
  }
}
define_element(GameList);
