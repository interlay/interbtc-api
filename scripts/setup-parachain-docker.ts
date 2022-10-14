import shell from "shelljs";
import yargs from "yargs/yargs";

const exec = (cmd: string, fatal = true) => {
    console.log(`$ ${cmd}`);
    const res = shell.exec(cmd);
    if (res.code !== 0) {
        console.error("Error: Command failed with code", res.code);
        console.log(res);
        if (fatal) {
            process.exit(1);
        }
    }
    return res;
};

const argv = yargs(process.argv.slice(2))
    .alias("c", "chain")
    .option("chain", {
        choices: ["KINT", "INTR"],
        description: "The type of parachain to setup. Defaults to KINT.",
        default: "KINT",
    })
    .alias("d", "detach")
    .boolean("detach")
    .describe("detach", "Whether to detach docker outputs or not.")
    .parseSync();

const chain = argv.chain;
const detachOpt = argv.detach ? "-d" : "";

exec("chmod +x ./scripts/docker-setup.sh");
exec(`./scripts/docker-setup.sh ${chain} ${detachOpt}`);
