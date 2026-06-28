import form from "@chocbite/ts-lib-form";
import type { SVGFunc } from "@chocbite/ts-lib-svg";
import { Content, main_panel_container } from "@libComposition";

interface PromptButtonsButton<T> {
  text: string;
  click?: () => void;
  value?: T;
  icon?: SVGFunc;
}

export function prompt_buttons<T>(
  text: string,
  buttons: PromptButtonsButton<T>[],
) {
  const content = new Content();
  content.appendChild(
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
                content.content_close();
                if (button.click) button.click();
              },
            }),
          ),
        }),
      ],
    }),
  );
  main_panel_container.create_panel(content, {
    show_titlebar: false,
    sizeable: false,
    modal: true,
  });
}
