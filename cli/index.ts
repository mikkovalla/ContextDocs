import { Command } from "commander";
import { installCommand } from "./install";

const program = new Command();

program
  .name("docbrain")
  .description(
    "Documentation installer and structural compressor for AI agents",
  )
  .version("1.0.0");

// Register the install command
program.addCommand(installCommand);

program.parse(process.argv);
