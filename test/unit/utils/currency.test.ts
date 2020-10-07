import { btcToSat, satToMBTC, satToBTC, dotToPlanck, planckToDOT, roundTwoDecimals } from "../../../src/utils";
import { assert } from "../../chai";

describe("currency", () => {
    describe("Bitcoin", () => {
        it("should round to two decimals", () => {
            const bitcoin = "13.5132132132";
            const rounded = "13.51";
            assert.equal(roundTwoDecimals(bitcoin), rounded);
        })
    })
    describe("Bitcoin", () => {
        it("should convert a Bitcoin string to a Satoshi string", () => {
            const bitcoin = "13.5";
            const satoshi = "1350000000";
            assert.equal(btcToSat(bitcoin), satoshi);
        })
        it("should convert a large Bitcoin string to a Satoshi string", () => {
            const bitcoin = "13321321321";
            const satoshi = "1332132132100000000";
            assert.equal(btcToSat(bitcoin), satoshi);
        })
        it("should not convert a too small Bitcoin amount to a Satoshi string", () => {
            const bitcoin = "0.00000000000005";
            assert.equal(btcToSat(bitcoin), undefined);
        })
        it("should convert a Satoshi string to a Bitcoin string", () => {
            const bitcoin = "135000";
            const satoshi = "13500000000000";
            assert.equal(satToBTC(satoshi), bitcoin);
        })
        it("should convert a Satoshi string to a mBTC string", () => {
            const mbtc = "135000000";
            const satoshi = "13500000000000";
            assert.equal(satToMBTC(satoshi), mbtc);
        })
    })
    describe("Dot", () => {
        it("should convert a Dot string to a Planck string", () => {
            const dot = "13.5";
            const planck = "135000000000";
            assert.equal(dotToPlanck(dot), planck);
        })
        it("should convert a large Dot string to a Planck string", () => {
            const dot = "13321321321";
            const planck = "133213213210000000000";
            assert.equal(dotToPlanck(dot), planck);
        })
        it("should not convert a too small Dot amount to a Planck string", () => {
            const dot = "0.000000000000005";
            assert.equal(dotToPlanck(dot), undefined);
        })
        it("should convert a Planck string to a Dot string", () => {
            const dot = "135000";
            const planck = "1350000000000000";
            assert.equal(planckToDOT(planck), dot);
        })
        it("should convert a Planck string to a Dot string", () => {
            const dot = "0.0000000135";
            const planck = "135";
            assert.equal(planckToDOT(planck), dot);
        })
        it("should convert a Planck string to a Dot string", () => {
            const dot = "0.000000001";
            const planck = "10";
            assert.equal(planckToDOT(planck), dot);
        })
    })
})