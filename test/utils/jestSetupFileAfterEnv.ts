import console from "console";

// This file exists to override jest specific setup defaults

// Replace jest's expanded logger the "stock" console to reduce verbosity of logging. 
// Comment out this if you actually want expanded jest logging.
global.console = console;