// This file exists to override jest specific setup defaults

import console from "console";

/**
 * Replace jest's expanded logger the "stock" console to reduce verbosity of logging. 
 * Needs `import console from "console"` to work.
 */
global.console = console;

/**
 * Replace the logger with a silent spy, suppressing console.log outputs.
 */
// jest.spyOn(console, "log").mockImplementation();