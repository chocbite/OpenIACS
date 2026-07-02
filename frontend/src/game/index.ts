import { main_panel_container } from "@libComposition";
import { games } from "./game";
import { GameList } from "./game_list";
import { GameUI } from "./game_ui";

export {} from "./character";
export {} from "./game";
export { GameList } from "./game_list";

main_panel_container.create_panel(new GameList(), {
  width: 20,
});
main_panel_container.create_panel(new GameUI(games.array.get[0]), {
  width: 20,
});

const db_request = indexedDB.open("game_db", 5);

db_request.onerror = (e) => {
  console.warn(e);
};

db_request.onupgradeneeded = (e) => {
  const db = e.target!.result as IDBDatabase;
  console.warn(db.version);
  const store = db.createObjectStore("games", { keyPath: "uuid" });
};

db_request.onsuccess = (e) => {
  const db = e.target!.result as IDBDatabase;
  console.warn(db.version);
  const transaction = db.transaction("games", "readwrite");
  const store = transaction.objectStore("games");
  store.put({ uuid: "1234", name: "Hero" });
  const request = store.getAll();
  request.onsuccess = (e) => {
    console.warn(e.target!.result);
  };
};
