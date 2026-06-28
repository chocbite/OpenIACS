import form from "@chocbite/ts-lib-form";
import { none, some, type Option } from "@chocbite/ts-lib-result";
import type { SVGFunc } from "@chocbite/ts-lib-svg";
import { main_panel_container } from "@libComposition";
import { Prompt } from "./shared";

interface PromptButtonsButton<T> {
  text: string;
  value: T;
  click?: () => void;
  icon?: SVGFunc;
}

export function prompt_buttons<T>(
  text: string,
  buttons: PromptButtonsButton<T>[],
): Promise<Option<T>> {
  const prompt = new Prompt<T>(
    form.group({
      elements: [
        form.text({ text: text, size: 1.2 }),
        form.spacer({ space: 0.5 }),
        form.group({
          embed: true,
          column: "10rem",
          elements: buttons.map((button) =>
            form.button({
              text: button.text,
              icon: button.icon,
              on_click: () => {
                prompt.content_close(button.value);
                if (button.click) button.click();
              },
            }),
          ),
        }),
      ],
    }),
  );
  const panel = main_panel_container.create_panel(prompt, {
    // show_titlebar: false,
    sizeable: false,
    modal: true,
  });
  return Promise.race([
    prompt.content_on_close().then((v) => some(v)),
    panel.on_close().then(() => none()),
  ]);
}
