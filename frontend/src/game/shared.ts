export class Part {
  readonly uuid: string;
  constructor(uuid: string = crypto.randomUUID()) {
    this.uuid = uuid;
  }
}
