import { node_clone } from "@chocbite/ts-lib-common";
import { material_action_autorenew_rounded } from "@chocbite/ts-lib-icons";
import type { StateROS } from "@chocbite/ts-lib-state";
import { svg } from "@chocbite/ts-lib-svg";
import type { ViewportElement } from "@libEditor";
import "./viewport_mover.scss";

const nw = svg.svg(32, 32, "0 0 32 32").cl("nw").elem;
nw.appendChild(svg.create("circle").elem);
nw.appendChild(svg.line(-8, -8, 8, 8).elem);
nw.appendChild(svg.isosceles_triangle(-7, -7, 8, 6).rotate(-45, -7, -7).elem);
nw.appendChild(svg.isosceles_triangle(7, 7, 8, 6).rotate(135, 7, 7).elem);
const ne = svg.svg(32, 32, "0 0 32 32").cl("ne").elem;
ne.appendChild(svg.create("circle").elem);
ne.appendChild(svg.line(-8, 8, 8, -8).elem);
ne.appendChild(svg.isosceles_triangle(-7, 7, 8, 6).rotate(-135, -7, 7).elem);
ne.appendChild(svg.isosceles_triangle(7, -7, 8, 6).rotate(45, 7, -7).elem);
const se = svg.svg(32, 32, "0 0 32 32").cl("se").elem;
se.appendChild(svg.create("circle").elem);
se.appendChild(svg.line(-8, -8, 8, 8).elem);
se.appendChild(svg.isosceles_triangle(-7, -7, 8, 6).rotate(-45, -7, -7).elem);
se.appendChild(svg.isosceles_triangle(7, 7, 8, 6).rotate(135, 7, 7).elem);
const sw = svg.svg(32, 32, "0 0 32 32").cl("sw").elem;
sw.appendChild(svg.create("circle").elem);
sw.appendChild(svg.line(-8, 8, 8, -8).elem);
sw.appendChild(svg.isosceles_triangle(-7, 7, 8, 6).rotate(-135, -7, 7).elem);
sw.appendChild(svg.isosceles_triangle(7, -7, 8, 6).rotate(45, 7, -7).elem);
const move = svg.svg(32, 32, "0 0 32 32").cl("move").elem;
move.appendChild(svg.create("circle").elem);
move.appendChild(svg.line(0, 8, 0, -8).elem);
move.appendChild(svg.isosceles_triangle(0, 10, 8, 6).rotate(180, 0, 10).elem);
move.appendChild(svg.isosceles_triangle(0, -10, 8, 6).rotate(0, 0, -10).elem);
move.appendChild(svg.line(-10, 0, 10, 0).elem);
move.appendChild(svg.isosceles_triangle(-10, 0, 8, 6).rotate(270, -10, 0).elem);
move.appendChild(svg.isosceles_triangle(10, 0, 8, 6).rotate(90, 10, 0).elem);
const rotate = svg.svg(32, 32, "0 0 32 32").a("y", "-20").cl("rotate").elem;
rotate.appendChild(svg.create("circle").elem);
rotate.appendChild(material_action_autorenew_rounded());

export class ViewportMover {
  #canvas: SVGSVGElement = svg.create("svg").cl("viewport-mover").elem;
  #outline = this.#canvas.appendChild(
    svg.rectangle_from_corner(0, 0, 1, 1, 0).elem,
  );
  #nw_corner = this.#canvas.appendChild(node_clone(nw));
  #ne_corner = this.#canvas.appendChild(node_clone(ne));
  #sw_corner = this.#canvas.appendChild(node_clone(sw));
  #se_corner = this.#canvas.appendChild(node_clone(se));
  #move = this.#canvas.appendChild(node_clone(move));
  #rotate = this.#canvas.appendChild(node_clone(rotate));

  constructor(scale: StateROS<number>) {
    // scale.sub((val) => {
    //   this.#nw_corner.setAttribute("transform", `scale(${1 / val.value})`);
    //   this.#ne_corner.setAttribute("transform", `scale(${1 / val.value})`);
    //   this.#sw_corner.setAttribute("transform", `scale(${1 / val.value})`);
    //   this.#se_corner.setAttribute("transform", `scale(${1 / val.value})`);
    //   this.#move.setAttribute("transform", `scale(${1 / val.value})`);
    //   this.#rotate.setAttribute("transform", `scale(${1 / val.value})`);
    // });
  }

  #width = 0;
  set width(value: number) {
    this.#outline.setAttribute("width", value.toString());
    this.#ne_corner.setAttribute("x", String(value));
    this.#ne_corner.setAttribute("transform-origin", `${value} 0`);
    this.#se_corner.setAttribute("x", String(value));
    this.#se_corner.setAttribute(
      "transform-origin",
      `${value} ${this.#height}`,
    );
    this.#move.setAttribute("x", String(value / 2));
    this.#move.setAttribute(
      "transform-origin",
      `${value / 2} ${this.#height / 2}`,
    );
    this.#rotate.setAttribute("x", String(value / 2));
    this.#rotate.setAttribute("transform-origin", `${value / 2} 0`);
    this.#width = value;
  }
  #height = 0;
  set height(value: number) {
    this.#outline.setAttribute("height", value.toString());
    this.#sw_corner.setAttribute("y", String(value));
    this.#sw_corner.setAttribute("transform-origin", `0 ${value}`);
    this.#se_corner.setAttribute("y", String(value));
    this.#se_corner.setAttribute("transform-origin", `${this.#width} ${value}`);
    this.#move.setAttribute("y", String(value / 2));
    this.#move.setAttribute(
      "transform-origin",
      `${this.#width / 2} ${value / 2}`,
    );
    this.#height = value;
  }

  attach_to_element(element: ViewportElement, canvas: SVGSVGElement) {
    this.#canvas.setAttribute("x", element.position_x.toString());
    this.#canvas.setAttribute("y", element.position_y.toString());
    this.width = element.default_width();
    this.height = element.default_height();
    canvas.appendChild(this.#canvas);
  }
}
