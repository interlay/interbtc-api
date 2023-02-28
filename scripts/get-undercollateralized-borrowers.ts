import { cryptoWaitReady } from "@polkadot/util-crypto";
import { createInterBtcApi } from "../src/factory";
import { UndercollateralizedPosition } from "../src";

const Table = require("cli-table3");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const args = yargs(hideBin(process.argv))
    .option("parachain-endpoint", {
        description: "The wss url of the parachain",
        type: "string",
        demandOption: true,
    })
    .argv;

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

function toPrintable(pos: UndercollateralizedPosition) {
    return {
        accountId: pos.accountId.toString(),
        shortfall: pos.shortfall.toHuman() + ` ${pos.shortfall.currency.ticker}`,
        // Round down amounts to 3 decimals
        collateralPositions: pos.collateralPositions.map(p => p.amount.toHuman(3) + ` ${p.amount.currency.ticker}`).join(" | "),
        borrowPositions: pos.borrowPositions.map(p => p.amount.toHuman(3) + ` ${p.amount.currency.ticker}`).join(" | "),
    };
}

async function main(): Promise<void> {
    await cryptoWaitReady();

    console.log(`Connecting to parachain at ${args["parachain-endpoint"]}`);
    const interBtc = await createInterBtcApi(args["parachain-endpoint"]);
    console.log("Checking for undercollateralized borrowers...");
    let borrowers = await interBtc.loans.getUndercollateralizedBorrowers();
    // Sort in descending order of shortfall
    borrowers = borrowers.sort((a, b) => b.shortfall.sub(a.shortfall).toBig().toNumber());

    const table = new Table({
        head: ["Account", "Shortfall", "Collateral Positions", "Borrow Positions"],
        style: {
            head: ["blue"],
        },
    });
    borrowers.forEach(b => table.push(Object.values(toPrintable(b))));
    console.log(table.toString());
    await interBtc.disconnect();
}