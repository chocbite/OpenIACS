import "@chocbite/ts-lib-base";
import form from "@chocbite/ts-lib-form";
import { material_device_brightness_medium_rounded } from "@chocbite/ts-lib-icons";
import { err, ok, type Result } from "@chocbite/ts-lib-result";
import { state, type StateLocalROSW } from "@chocbite/ts-lib-state";
import "./index.scss";
import "./lib/composition";
import { comp, TopBarSides } from "./lib/composition";

const topbar = comp.topbar();
document.body.prepend(topbar);
topbar.add_item(
  document.createElement("button"),
  TopBarSides.LEFT,
).textContent = "Left";
topbar.add_item(document.createElement("div"), TopBarSides.LEFT).textContent =
  "Left";
const butt = topbar.add_item(
  comp.topbar_button("Mid", () => {}),
  TopBarSides.MID,
);
const lab = topbar.add_item(comp.topbar_label("Right"), TopBarSides.RIGHT);

const cust_butt = topbar.add_item(
  comp.topbar_button_icon(material_device_brightness_medium_rounded, () => {}),
  TopBarSides.RIGHT,
);

const cust = comp.attach_customization_panel_to_element(
  cust_butt,
  "bot_left",
  "top_left",
);
cust.main_group.elements = [form.text({ text: "Dark Mode" }), form.switch({})];

class Game {
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

class Part {
  readonly uuid: string;
  constructor(uuid: string = crypto.randomUUID()) {
    this.uuid = uuid;
  }
}

class Fact extends Part {
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

class Entity extends Part {
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

interface CharacterData {
  uuid: string;
  name: string;
}
class Character extends Part {
  #name: StateLocalROSW<string> = state.ok_w("");
  readonly name = this.#name.read_write;

  static deserialize(data: Partial<CharacterData>): Result<Character, string> {
    if (!data.uuid) return err("Missing uuid");
    if (!data.name) return err("Missing name");
    const char = new Character(data.uuid);
    char.#name.set_ok(data.name);
    return ok(char);
  }

  serialize(): CharacterData {
    return {
      uuid: this.uuid,
      name: this.#name.ok(),
    };
  }
}

console.warn(Character.deserialize({ uuid: "1234", name: "Hero" }));

// document.getElementById("app")?.replaceChildren(example_page());
