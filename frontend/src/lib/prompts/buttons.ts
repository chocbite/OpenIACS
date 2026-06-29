import form from "@chocbite/ts-lib-form";
import { some, type Option } from "@chocbite/ts-lib-result";
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
  return new Promise<Option<T>>((resolve) => {
    const prompt = new Prompt(
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
                  prompt.content_close();
                  resolve(some(button.value));
                  if (button.click) button.click();
                },
              }),
            ),
          }),
        ],
      }),
    );
    main_panel_container
      .create_panel(prompt, {
        // show_titlebar: false,
        sizeable: false,
        moveable: false,
        modal: true,
      })
      .on_close()
      .then(resolve);
  });
}
