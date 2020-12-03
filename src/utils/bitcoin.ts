import * as bitcoin from "bitcoinjs-lib";
import { H160 } from "@polkadot/types/interfaces";
import { u8 } from "@polkadot/types";
import { BtcAddress } from "../interfaces/default";
import { TypeRegistry } from "@polkadot/types";

export { bitcoin };

export function encodeBtcAddress(address: BtcAddress, network: bitcoin.Network): string {
    let btcAddress: string | undefined;
    try {
        if (address.isP2Pkh) {
            const result = bitcoin.payments.p2pkh({
                hash: Buffer.from(address.asP2Pkh.buffer),
                network,
            });
            btcAddress = result.address;
        } else if (address.isP2Sh) {
            const result = bitcoin.payments.p2sh({
                hash: Buffer.from(address.asP2Sh.buffer),
                network,
            });
            btcAddress = result.address;
        } else if (address.asP2WpkHv0) {
            const result = bitcoin.payments.p2wpkh({
                hash: Buffer.from(address.asP2WpkHv0.buffer),
                network,
            });
            btcAddress = result.address;
        } else {
            throw new Error("Invalid address format");
        }
    } catch (err) {
        throw new Error(`Error encoding BTC address ${address}: ${err}`);
    }

    if (btcAddress) return btcAddress;
    throw new Error("Unable to encode address");
}

interface Payable {
    hash?: Buffer;
    address?: string;
}

function decode<P extends Payable, O>(p: P, f: (payment: P, options?: O) => P): string | undefined {
    try {
        const pay = f(p);
        return pay.hash ? "0x" + pay.hash.toString("hex") : "";
    } catch (err) {
        return undefined;
    }
}

export function decodeBtcAddress(
    address: string,
    network: bitcoin.Network
): { p2pkh: string } | { p2sh: string } | { p2wpkhv0: string } {
    const p2pkh = decode({ address, network }, bitcoin.payments.p2pkh);
    if (p2pkh) return { p2pkh };

    const p2sh = decode({ address, network }, bitcoin.payments.p2sh);
    if (p2sh) return { p2sh };

    const p2wpkhv0 = decode({ address, network }, bitcoin.payments.p2wpkh);
    if (p2wpkhv0) return { p2wpkhv0 };

    throw new Error("Unable to decode address");
}

export function btcAddressFromParams(
    registry: TypeRegistry,
    params: { p2pkh: H160 | string } | { p2sh: H160 | string } | { p2wpkhv0: H160 | string }
): BtcAddress {
    return registry.createType("BtcAddress", {
        ...params,
    });
}

export async function broadcastOpReturnTx(value: number, opReturn: string) {
    const alice1 = createPayment("p2pkh");
    console.log(alice1);
    const inputData1 = await getInputData(2e5, alice1.payment, false, "noredeem");

    // const data = Buffer.from(opReturn, "utf8");
    // const embed = bitcoin.payments.embed({ data: [data] });

    // const psbt = new bitcoin.Psbt({ network: regtest })
    //     .addInput(inputData1)
    //     .addOutput({
    //         script: embed.output!,
    //         value: 0,
    //     })
    //     .addOutput({
    //         address: regtestUtils.RANDOM_ADDRESS,
    //         value: 1e5,
    //     })
    //     .signInput(0, alice1.keys[0]);

    // // assert.strictEqual(psbt.validateSignaturesOfInput(0), true);
    // psbt.finalizeAllInputs();

    // // build and broadcast to the RegTest network
    // await regtestUtils.broadcast(psbt.extractTransaction().toHex());
}

function createPayment(_type: string, myKeys?: any[], network?: any): any {
    network = network || regtest;
    const splitType = _type.split("-").reverse();
    const isMultisig = splitType[0].slice(0, 4) === "p2ms";
    const keys = myKeys || [];
    let m: number | undefined;
    if (isMultisig) {
        const match = splitType[0].match(/^p2ms\((\d+) of (\d+)\)$/);
        m = parseInt(match![1], 10);
        let n = parseInt(match![2], 10);
        if (keys.length > 0 && keys.length !== n) {
            throw new Error("Need n keys for multisig");
        }
        while (!myKeys && n > 1) {
            keys.push(bitcoin.ECPair.makeRandom({ network }));
            n--;
        }
    }
    if (!myKeys) keys.push(bitcoin.ECPair.makeRandom({ network }));

    let payment: any;
    splitType.forEach((type) => {
        if (type.slice(0, 4) === "p2ms") {
            payment = bitcoin.payments.p2ms({
                m,
                pubkeys: keys.map((key) => key.publicKey).sort((a, b) => a.compare(b)),
                network,
            });
        } else if (["p2sh", "p2wsh"].indexOf(type) > -1) {
            payment = (bitcoin.payments as any)[type]({
                redeem: payment,
                network,
            });
        } else {
            payment = (bitcoin.payments as any)[type]({
                pubkey: keys[0].publicKey,
                network,
            });
        }
    });

    return {
        payment,
        keys,
    };
}

async function getInputData(amount: number, payment: any, isSegwit: boolean, redeemType: string): Promise<any> {
    const unspent = await regtestUtils.faucetComplex(payment.output, amount);
    const utx = await regtestUtils.fetch(unspent.txId);
    // for non segwit inputs, you must pass the full transaction buffer
    const nonWitnessUtxo = Buffer.from(utx.txHex, "hex");
    // for segwit inputs, you only need the output script and value as an object.
    const witnessUtxo = getWitnessUtxo(utx.outs[unspent.vout]);
    const mixin = isSegwit ? { witnessUtxo } : { nonWitnessUtxo };
    const mixin2: any = {};
    switch (redeemType) {
        case "p2sh":
            mixin2.redeemScript = payment.redeem.output;
            break;
        case "p2wsh":
            mixin2.witnessScript = payment.redeem.output;
            break;
        case "p2sh-p2wsh":
            mixin2.witnessScript = payment.redeem.redeem.output;
            mixin2.redeemScript = payment.redeem.output;
            break;
    }
    return {
        hash: unspent.txId,
        index: unspent.vout,
        ...mixin,
        ...mixin2,
    };
}

function getWitnessUtxo(out: any): any {
    delete out.address;
    out.script = Buffer.from(out.script, "hex");
    return out;
}
