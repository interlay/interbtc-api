
import { ApiPromise } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";

export function constructProposal(api: ApiPromise, call: SubmittableExtrinsic<"promise">) {
    const deposit = api.consts.democracy.minimumDeposit.toNumber();

    if (call.toU8a().byteLength <= 128) {
        return api.tx.democracy.propose({ Inline: call.toHex() }, deposit);
    } else {
        const preImageSubmission = api.tx.preimage.notePreimage(call.toHex());
        const innerProposal = api.tx.democracy.propose({ Lookup: {
            hash: call.hash.toHex(),
            len: call.toU8a().byteLength
        }}, deposit);
        return api.tx.utility.batchAll([preImageSubmission, innerProposal]);
    }
}

export function printDiscordProposal(
    description: string,
    extrinsic: SubmittableExtrinsic<"promise">,
    endpoint: string,
    api: ApiPromise,
) {
    const proposal = constructProposal(api, extrinsic);
    const invocation = process.argv.map(function (x) { return x.substring(x.lastIndexOf('/') + 1) }).join(" ");

    console.log("");
    console.log("");
    console.log("**" + description + "**");
    console.log("");
    console.log("**Extrinsic:**", toUrl(extrinsic, endpoint));
    console.log("");
    console.log("**Proposal:**", toUrl(proposal, endpoint));
    console.log("");
    console.log("_Generated with_: `" + invocation + "`");
    console.log("");
    console.log("");
}

export function toUrl(extrinsic: SubmittableExtrinsic<"promise">, endpoint: string) {
    return "https://polkadot.js.org/apps/?rpc=" +
        encodeURIComponent(endpoint) +
        "#/extrinsics/decode/" +
        extrinsic.method.toHex();
}
