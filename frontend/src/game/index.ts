import { main_panel_container } from "@libComposition";
import { games } from "./game";
import { GameUI } from "./game_ui";

export {} from "./character";
export {} from "./game";
export { GameList } from "./game_list";

// main_panel_container.create_panel({
//   content: new GameList(),
//   width: 20,
// });
main_panel_container.create_panel(new GameUI(games.array.get[0]), {
  width: 20,
});
