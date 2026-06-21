import { define_element } from "@chocbite/ts-lib-base";
import {
  err,
  none,
  ok,
  type Option,
  type Result,
} from "@chocbite/ts-lib-result";
import { state, type StateLocalROSW } from "@chocbite/ts-lib-state";
import { main_panel_container } from "@libComposition";
import { ContentBase } from "../lib/composition/content";
import { Part } from "./shared";

interface CharacterData {
  uuid: string;
  name: string;
}
export class Character extends Part {
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

export class CharacterEditor extends ContentBase {
  static element_name(): string {
    return "character-editor";
  }
  static element_name_space(): string {
    return "game";
  }

  #name = state.proxy.ros(state.ok("").read_only);
  get name() {
    return this.#name;
  }
  get icon() {
    return state.ok(none());
  }
  get closable() {
    return state.ok(true);
  }
  get min_size() {
    return state.ok(none());
  }
  async close(_args: void): Promise<Option<void>> {
    return none();
  }

  async on_close(): Promise<void> {
    return;
  }

  constructor(character: Character) {
    super();
    this.#name.set_state(character.name);
    console.warn(character.name.get().unwrap());
  }
}
define_element(CharacterEditor);

const test_char = Character.deserialize({ uuid: "1234", name: "Hero" });

console.warn(test_char);

main_panel_container.create_panel({
  content: new CharacterEditor(test_char.unwrap()),
  width: 10,
  height: 10,
});
