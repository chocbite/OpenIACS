import { GREY, ORANGE } from "@chocbite/ts-lib-colors";
import { px_to_rem, theme_init_variable_root } from "@chocbite/ts-lib-theme";

/** Type to store a position related to composition
 * position is always in rem*/
export interface CompPosition {
  x: number;
  y: number;
}

export interface CompMinSize {
  width: number;
  height: number;
}

export const CompAnchor = {
  TOP_RIGHT: "top_right",
  TOP_LEFT: "top_left",
  BOT_RIGHT: "bot_right",
  BOT_LEFT: "bot_left",
} as const;
export type CompAnchor = (typeof CompAnchor)[keyof typeof CompAnchor];

export function get_element_anchor_position(
  element: Element,
  anchor: CompAnchor,
): CompPosition {
  const rect = element.getBoundingClientRect();
  const [f, l] = anchor.split("_");
  return {
    x: px_to_rem(l === "left" ? rect.left : rect.left + rect.width),
    y: px_to_rem(f === "top" ? rect.top : rect.top + rect.height),
  };
}

const theme_root = theme_init_variable_root(
  "ui",
  "UI Elements",
  "Theme variables for UI Elements",
);

//       _____ ____  _      ____  _____   _____
//      / ____/ __ \| |    / __ \|  __ \ / ____|
//     | |   | |  | | |   | |  | | |__) | (___
//     | |   | |  | | |   | |  | |  _  / \___ \
//     | |___| |__| | |___| |__| | | \ \ ____) |
//      \_____\____/|______\____/|_|  \_\_____/
const colors = theme_root.make_sub_group(
  "colors",
  "Colors",
  "Colors used in all form elements",
);

colors.make_variable(
  "titlebar",
  "Title Bar Background",
  "Background color for the title bar of UI panels",
  GREY[500],
  GREY[800],
  "Color",
  undefined,
);

colors.make_variable(
  "titlebarHover",
  "Title Bar Hover Background",
  "Background color for the title bar of UI panels when hovered",
  GREY[400],
  GREY[700],
  "Color",
  undefined,
);

colors.make_variable(
  "titlebarText",
  "Title Bar Text",
  "Text color for the title bar of UI panels",
  GREY[900],
  GREY[50],
  "Color",
  undefined,
);

colors.make_variable(
  "background",
  "Content Background",
  "Default background color for content areas",
  GREY[100],
  "#000000",
  "Color",
  undefined,
);

colors.make_variable(
  "icons",
  "Icons Color",
  "Default color for icons",
  GREY[900],
  GREY[100],
  "Color",
  undefined,
);

colors.make_variable(
  "sizers",
  "Content Background",
  "Default background color for content areas",
  GREY[300],
  GREY[900],
  "Color",
  undefined,
);

colors.make_variable(
  "shadow",
  "Border Shadow",
  "Shadow color for borders and outlines",
  "#000000",
  GREY[50],
  "Color",
  undefined,
);

colors.make_variable(
  "shadowFocus",
  "Border Shadow In Focus",
  "Shadow color for borders and outlines when in focus",
  ORANGE[500],
  ORANGE[500],
  "Color",
  undefined,
);
