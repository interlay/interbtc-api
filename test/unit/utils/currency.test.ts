import Big from "big.js";
import BN from "bn.js";
import { btcToSat, satToMBTC, satToBTC, dotToPlanck, planckToDOT, roundTwoDecimals } from "../../../src/utils";
import { assert } from "../../chai";

describe("currency", () => {
    describe("Bitcoin", () => {
        it("should round to two decimals", () => {
            const bitcoin = "13.5132132132";
            const rounded = "13.51";
            assert.equal(roundTwoDecimals(bitcoin), rounded);
        });
    });
    describe("Bitcoin", () => {
        it("should convert a Bitcoin value to a Satoshi value", () => {
            const bitcoin = new Big("13.5");
            const satoshi = new BN("1350000000");
            assert.equal(btcToSat(bitcoin).toString(), satoshi.toString());
        });
        it("should convert a large Bitcoin value to a Satoshi value", () => {
            const bitcoin = new Big("13321321321");
            const satoshi = new BN("1332132132100000000");
            assert.equal(btcToSat(bitcoin).toString(), satoshi.toString());
        });
        it("should round too small a Bitcoin amount to 1 Satoshi", () => {
            const bitcoin = new Big("0.00000000000005");
            assert.equal(btcToSat(bitcoin).toString(), new BN(1).toString());
        });
        it("should convert a Satoshi value to a Bitcoin value", () => {
            const bitcoin = new Big("135000");
            const satoshi = new BN("13500000000000");
            assert.equal(satToBTC(satoshi).toString(), bitcoin.toString());
        });
        it("should convert a Satoshi value to a mBTC value", () => {
            const mbtc = "135000000";
            const satoshi = "13500000000000";
            assert.equal(satToMBTC(satoshi), mbtc);
        });
    });
    describe("Dot", () => {
        it("should convert a Dot value to a Planck value", () => {
            const dot = new Big("13.5");
            const planck = new BN("135000000000");
            assert.equal(dotToPlanck(dot).toString(), planck.toString());
        });
        it("should convert a large Dot value to a Planck value", () => {
            const dot = new Big("13321321321");
            const planck = new BN("133213213210000000000");
            assert.equal(dotToPlanck(dot).toString(), planck.toString());
        });
        it("should convert a too small Dot amount to 1 Planck", () => {
            const dot = new Big("0.000000000000005");
            assert.equal(dotToPlanck(dot).toString(), new BN(1).toString());
        });
        it("should convert a Planck value to a Dot value", () => {
            const dot = new Big("135000");
            const planck = new BN("1350000000000000");
            assert.equal(planckToDOT(planck).toString(), dot.toString());
        });
        it("should convert a Planck value to a Dot value", () => {
            const dot = new Big("0.0000000135");
            const planck = new BN("135");
            assert.equal(planckToDOT(planck).toString(), dot.toString());
        });
        it("should convert a Planck value to a Dot value", () => {
            const dot = new Big("0.000000001");
            const planck = new BN("10");
            assert.equal(planckToDOT(planck).toString(), dot.toString());
        });
    });
});