/* eslint @typescript-eslint/no-var-requires: "off" */
import { createSubstrateAPI } from "../src/factory";
import { ApiPromise, Keyring } from "@polkadot/api";
import { DefaultTransactionAPI } from "../src/parachain";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { XcmVersionedMultiLocation } from "@polkadot/types/lookup";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { assert } from "console";

import { Arguments } from 'yargs';
import { url } from "inspector";

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const args = yargs(hideBin(process.argv))
    .option("url", {
        type: "string",
        description: "Polkadotjs url",
        demandOption: true,
    })
    .argv;


main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});

async function main(): Promise<void> {
    const url = new URL(args['url']);
    const rpc = url.searchParams.get('rpc');
    const hashPrefix = '#/extrinsics/decode/';
    const extrinsic = url.hash.replace(hashPrefix, '');
    console.log("rpc:", rpc);
    console.log("extrinsic:", extrinsic);

    const api = await createSubstrateAPI(rpc as string);
    const call = api.createType('Call', extrinsic);
    console.log('Full input tx: ', call.toHuman());
    console.log('');
    console.log('Abbreviated input tx: ', call.section.toString() + '.' + call.method.toString());
    console.log('');

    const deposit = api.consts.democracy.minimumDeposit.toNumber();
    const preImageSubmission = api.tx.democracy.notePreimage(call.toHex());
    const proposal = api.tx.democracy.propose(call.hash.toHex(), deposit);
    const batched = api.tx.utility.batchAll([preImageSubmission, proposal]);

    console.log('**Extrinsic:**', url.href);
    console.log('');

    url.hash = hashPrefix + batched.toHex();
    console.log('**Proposal:**', url.href);
    console.log('');

    await api.disconnect();
}
