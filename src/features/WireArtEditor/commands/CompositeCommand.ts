export class CompositeCommand {
  private commands: any[];

  constructor(commands: any[]) {
    this.commands = commands;
  }

  execute(editor: any) {
    for (const cmd of this.commands) {
      cmd.execute(editor);
    }
  }

  undo(editor: any) {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo(editor);
    }
  }
}
