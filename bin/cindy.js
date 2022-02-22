const program = require("commander")

program
    .version(require("../package.json").version)
    .usage("<command> [options]")
    .command("init", "generate a new project from base")
    .parse(process.argv)
