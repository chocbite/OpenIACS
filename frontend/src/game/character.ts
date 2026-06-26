import { define_element } from "@chocbite/ts-lib-base";
import form from "@chocbite/ts-lib-form";
import { material_chess_pawn_rounded } from "@chocbite/ts-lib-icons";
import { err, ok, some, type Result } from "@chocbite/ts-lib-result";
import { state, type StateLocalROSW } from "@chocbite/ts-lib-state";
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

  #content_title = state.proxy.ros(state.ok("").read_only);
  get content_title() {
    return this.#content_title;
  }
  get content_icon() {
    return state.ok(some(material_chess_pawn_rounded));
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

  #name;

  constructor(character: Character) {
    super();
    this.appendChild(
      form.group({
        elements: [(this.#name = form.input_text())],
      }),
    );
    this.character = character;
  }

  set character(character: Character) {
    this.#content_title.set_state(
      state.collected.ros((v) => ok("Char: " + v[0].value), character.name),
    );
    this.#name.value_by_state = character.name;
  }
}
define_element(CharacterEditor);

const test_char = Character.deserialize({ uuid: "1234", name: "Hero" });

console.warn(test_char);

// main_panel_container.create_panel({
//   content: new CharacterEditor(test_char.unwrap()),
//   width: 10,
//   height: 10,
// });
