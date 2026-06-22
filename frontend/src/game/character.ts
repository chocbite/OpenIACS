import { define_element } from "@chocbite/ts-lib-base";
import { material_action_123_rounded } from "@chocbite/ts-lib-icons";
import {
  err,
  none,
  ok,
  some,
  type Option,
  type Result,
} from "@chocbite/ts-lib-result";
import { state, type StateLocalROSW } from "@chocbite/ts-lib-state";
import type { SVGFunc } from "@chocbite/ts-lib-svg";
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
    const yo = state.ok<Option<SVGFunc>>(none());
    setInterval(() => {
      yo.set_ok(
        Math.random() > 0.5 ? none() : some(material_action_123_rounded),
      );
    }, 1700);
    return yo;
  }
  get closable() {
    const yo = state.ok(false);
    setInterval(() => {
      yo.set_ok(!yo.get().value);
    }, 1500);
    return yo;
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
    const yo = state.ok("");
    setInterval(() => {
      yo.set_ok(
        yo.get().value === "" ? "Char: " + character.name.get().unwrap() : "",
      );
    }, 1800);
    this.#name.set_state(yo);
    // this.#name.set_state(
    //   state.collected.ros((v) => ok("Char: " + v[0].value), character.name),
    // );
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
