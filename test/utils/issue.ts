import { ApiPromise, Keyring } from "@polkadot/api";
import * as bitcoin from "bitcoinjs-lib";
import { fail } from "assert";
import { btcToSat, satToBTC, IssueRequestExt } from "../../src";
import { DefaultBTCCoreAPI } from "../../src/external/btc-core";
import { DefaultCollateralAPI } from "../../src/parachain/collateral";
import { IssueRequestResult, DefaultIssueAPI } from "../../src/parachain/issue";
import { DefaultTreasuryAPI } from "../../src/parachain/treasury";
import { BitcoinCoreClient } from "./bitcoin-core-client";
import Big from "big.js";

export interface IssueResult {
    request: IssueRequestResult;
    initialDotBalance: Big;
    finalDotBalance: Big;
    initialPolkaBtcBalance: Big;
    finalPolkaBtcBalance: Big;
}

export async function issue(
    api: ApiPromise,
    btcCoreAPI: DefaultBTCCoreAPI,
    bitcoinCoreClient: BitcoinCoreClient,
    keyring: Keyring,
    amount: string,
    requesterName: string,
    vaultName: string,
    autoExecute: boolean,
    triggerRefund: boolean
): Promise<IssueResult> {
    const treasuryAPI = new DefaultTreasuryAPI(api);
    const issueAPI = new DefaultIssueAPI(api, bitcoin.networks.regtest);
    const collateralAPI = new DefaultCollateralAPI(api);

    const requester = keyring.addFromUri("//" + requesterName);
    issueAPI.setAccount(requester);
    const requesterAccountId = api.createType("AccountId", requester.address);
    const initialBalanceDOT = await collateralAPI.balance(requesterAccountId);
    const initialBalancePolkaBTC = await treasuryAPI.balance(requesterAccountId);
    const blocksToMine = 3;
    keyring = new Keyring({ type: "sr25519" });
    const vault = keyring.addFromUri("//" + vaultName);
    const vaultAccountId = api.createType("AccountId", vault.address);

    // request issue
    let amountAsBtcString = amount;
    const amountAsSatoshiString = btcToSat(amountAsBtcString);
    if (amountAsSatoshiString === undefined) {
        fail();
    }
    const amountAsSatoshi = api.createType("Balance", amountAsSatoshiString);
    const requestResult = await issueAPI.request(amountAsSatoshi, vaultAccountId);
    let issueRequest;
    try {
        issueRequest = await issueAPI.getRequestById(requestResult.id);
    } catch (e) {
        // IssueCompleted errors occur when multiple vaults attempt to execute the same request
        console.log(e);
    }

    amountAsBtcString = satToBTC(
        (issueRequest as IssueRequestExt).amount.add((issueRequest as IssueRequestExt).fee).toString()
    );

    if (triggerRefund) {
        // Send 1 more Btc than needed
        amountAsBtcString = new Big(amountAsBtcString).add(1).toString();
    }

    // send btc tx
    const vaultBtcAddress = requestResult.issueRequest.btc_address;
    if (vaultBtcAddress === undefined) {
        throw new Error("Undefined vault address returned from RequestIssue");
    }

    const txData = await bitcoinCoreClient.sendBtcTxAndMine(vaultBtcAddress, amountAsBtcString, blocksToMine);

    if (autoExecute === false) {
        // execute issue, assuming the selected vault has the `--no-issue-execution` flag enabled
        const merkleProof = await btcCoreAPI.getMerkleProof(txData.txid);
        const parsedIssuedId = api.createType("H256", requestResult.id);
        // reverse endianness (expects little-endian)
        const parsedTxId = api.createType("H256", "0x" + Buffer.from(txData.txid, "hex").reverse().toString("hex"));
        const parsedMerkleProof = api.createType("Bytes", "0x" + merkleProof);
        const parsedRawTx = api.createType("Bytes", "0x" + txData.rawTx);
        await issueAPI.execute(parsedIssuedId, parsedTxId, parsedMerkleProof, parsedRawTx);
    } else {
        // wait for vault to execute issue
        while (!(await issueAPI.getRequestById(requestResult.id)).status.isCompleted) {
            await sleep(1000);
        }
    }

    // check issuing worked
    const finalBalancePolkaBTC = await treasuryAPI.balance(requesterAccountId);

    const finalBalanceDOT = await collateralAPI.balance(requesterAccountId);

    return {
        request: requestResult,
        initialDotBalance: new Big(initialBalanceDOT.toString()),
        finalDotBalance: new Big(finalBalanceDOT.toString()),
        initialPolkaBtcBalance: new Big(initialBalancePolkaBTC.toString()),
        finalPolkaBtcBalance: new Big(finalBalancePolkaBTC.toString()),
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}