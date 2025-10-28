"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SubCommand {
    constructor(client, options) {
        this.client = client;
        this.name = options.name;
    }
    Execute(interaction) {
    }
}
exports.default = SubCommand;
