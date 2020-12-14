import { ApiPromise, Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { TypeRegistry } from "@polkadot/types";
import { GenericAccountId } from "@polkadot/types/generic";
import { H256, Hash, AccountId } from "@polkadot/types/interfaces";
import { DefaultRedeemAPI } from "../../../src/apis/redeem";
import sinon from "sinon";
import { createPolkadotAPI } from "../../../src/factory";
import { H256Le, Vault } from "../../../src/interfaces/default";
import { assert } from "../../chai";
import { defaultEndpoint } from "../../config";
import { DefaultIssueAPI } from "../../../src/apis/issue";
import { btcToSat, stripHexPrefix, encodeBtcAddress } from "../../../src/utils";
import * as bitcoin from "bitcoinjs-lib";
import { DefaultBTCCoreAPI } from "../../../src/apis/btc-core";
import { DefaultTreasuryAPI } from "../../../src/apis/treasury";

export type RequestResult = { hash: Hash; vault: Vault };

describe("redeem", () => {
    let redeemAPI: DefaultRedeemAPI;
    let issueAPI: DefaultIssueAPI;
    let treasuryAPI: DefaultTreasuryAPI;
    let api: ApiPromise;
    let keyring: Keyring;
    // alice is the root account
    let alice: KeyringPair;
    let charlie: KeyringPair;
    const registry: TypeRegistry = new TypeRegistry();
    const randomDecodedAccountId = "0xD5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5D5";
    let requestResult: RequestResult;

    before(async () => {
        api = await createPolkadotAPI(defaultEndpoint);
        keyring = new Keyring({ type: "sr25519" });
        alice = keyring.addFromUri("//Alice");
    });

    beforeEach(() => {
        redeemAPI = new DefaultRedeemAPI(api, bitcoin.networks.regtest);
        issueAPI = new DefaultIssueAPI(api, bitcoin.networks.regtest);
        treasuryAPI = new DefaultTreasuryAPI(api);
        sinon.stub(redeemAPI, <any>"vaults").get(() => {
            return {
                selectRandomVaultRedeem() {
                    return Promise.resolve({ id: new GenericAccountId(registry, randomDecodedAccountId) });
                },
                get(id: AccountId) {
                    return { id };
                },
            };
        });
    });

    after(() => {
        return api.disconnect();
    });

    describe.skip("request", () => {
        it("should fail if no account is set", () => {
            const amount = api.createType("Balance", 10);
            assert.isRejected(redeemAPI.request(amount, randomDecodedAccountId));
        });

        async function requestAndCallRedeem(blocksToMine: number) {
            const btcCore = new DefaultBTCCoreAPI("http://0.0.0.0:3002");
            btcCore.initializeClientConnection("regtest", "0.0.0.0", "rpcuser", "rpcpassword", "18443", "Alice");
            keyring = new Keyring({ type: "sr25519" });
            alice = keyring.addFromUri("//Alice");
            charlie = keyring.addFromUri("//Charlie");

            // request issue
            issueAPI.setAccount(alice);
            const amountAsBtcString = "0.1";
            const amountAsSatoshiString = btcToSat(amountAsBtcString);
            const amountAsSatoshi = api.createType("Balance", amountAsSatoshiString);
            const requestResult = await issueAPI.request(amountAsSatoshi, api.createType("AccountId", charlie.address));
            assert.isTrue(requestResult.hash.length > 0);

            // send btc tx
            const data = stripHexPrefix(requestResult.hash.toString());
            const vaultBtcAddress = encodeBtcAddress(requestResult.vault.wallet.address, bitcoin.networks.regtest);
            if (vaultBtcAddress === undefined) {
                throw new Error("Undefined vault address returned from RequestIssue");
            }
            const txData = await btcCore.sendBtcTxAndMine(vaultBtcAddress, amountAsBtcString, data, blocksToMine);

            // redeem
            redeemAPI.setAccount(alice);
            const redeemAmountAsBtcString = "0.09";
            const redeemAmountAsSatoshiString = btcToSat(redeemAmountAsBtcString);
            const redeemAmountAsSatoshi = api.createType("Balance", redeemAmountAsSatoshiString);
            const btcAddress = "bcrt1qujs29q4gkyn2uj6y570xl460p4y43ruayxu8ry";
            const vaultId = api.createType("AccountId", charlie.address);
            await redeemAPI.request(redeemAmountAsSatoshi, btcAddress, vaultId);
        }

        it("should request and execute issue, request redeem", async () => {
            const blocksToMine = 3;
            await requestAndCallRedeem(blocksToMine);
        });

        it("should request and execute issue, request (and wait for execute) redeem", async () => {
            const initialBalance = await treasuryAPI.balancePolkaBTC(api.createType("AccountId", alice.address));
            const blocksToMine = 3;
            requestAndCallRedeem(blocksToMine);

            // check redeeming worked
            const finalBalance = await treasuryAPI.balancePolkaBTC(api.createType("AccountId", alice.address));
            assert.equal(initialBalance.toString(), finalBalance.toString());
        });
    });

    describe("fees", () => {
        it("should getFeesToPay", async () => {
            const amount = "2";
            const amountAsBalance = api.createType("Balance", amount);
            const feesToPay = await redeemAPI.getFeesToPay(amountAsBalance);
            assert.equal(feesToPay, "0.01");
        });

        it("should getFeePercentage", async () => {
            const feePercentage = await redeemAPI.getFeePercentage();
            assert.equal(feePercentage, 0.005);
        });
    });
});
