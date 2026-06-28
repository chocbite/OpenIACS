import { storage_init } from "@chocbite/ts-lib-localstorage";
import { settings_init } from "@chocbite/ts-lib-settings";

export const game_settings = settings_init(
  "@chocbite/ttrpg",
  "1.0.0",
  "TTRPG",
  "AI TTRPG Game saves and settings",
);

export const game_storage = storage_init("@chocbite/ttrpg", "1.0.0");

export class Part {
  readonly uuid: string;
  constructor(uuid: string = crypto.randomUUID()) {
    this.uuid = uuid;
  }
}
