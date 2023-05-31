import { TypeRegistry } from "@polkadot/types";
import { BitcoinMerkleProof, decodeBtcAddress, encodeBtcAddress, getTxProof } from "../../../src/utils";
import { assert } from "../../chai";
import * as bitcoinjs from "bitcoinjs-lib";
import { BitcoinAddress } from "@polkadot/types/lookup";
import { getAPITypes } from "../../../src/factory";
import { H160, H256 } from "@polkadot/types/interfaces/runtime";
import sinon from "sinon";
import { DefaultElectrsAPI } from "../../../src/external";

describe("Bitcoin", () => {
    let registry: TypeRegistry;

    const createH256 = (hash: string): H256 => {
        return registry.createType("H256", hash);
    };

    const createH160 = (hash: string): H160 => {
        return registry.createType("H160", hash);
    };

    before(() => {
        registry = new TypeRegistry();
        registry.register(getAPITypes());
    });

    describe("decodeBtcAddress", () => {
        it("should get correct hash for p2pkh address", () => {
            assert.deepEqual(decodeBtcAddress("1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH", bitcoinjs.networks.bitcoin), {
                p2pkh: "0x751e76e8199196d454941c45d1b3a323f1433bd6",
            });
        });

        it("should get correct hash for p2sh address", () => {
            assert.deepEqual(decodeBtcAddress("3JvL6Ymt8MVWiCNHC7oWU6nLeHNJKLZGLN", bitcoinjs.networks.bitcoin), {
                p2sh: "0xbcfeb728b584253d5f3f70bcb780e9ef218a68f4",
            });
        });

        it("should get correct hash for p2wpkh address", () => {
            // compare hex because type lib has trouble with this enum
            assert.deepEqual(
                decodeBtcAddress("bcrt1qjvmc5dtm4qxgtug8faa5jdedlyq4v76ngpqgrl", bitcoinjs.networks.regtest),
                {
                    p2wpkhv0: "0x93378a357ba80c85f1074f7b49372df901567b53",
                }
            );
            assert.deepEqual(
                decodeBtcAddress("tb1q45uq0q4v22fspeg3xjnkgf8a0v7pqgjks4k6sz", bitcoinjs.networks.testnet),
                {
                    p2wpkhv0: "0xad380782ac529300e51134a76424fd7b3c102256",
                }
            );
            assert.deepEqual(
                decodeBtcAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", bitcoinjs.networks.bitcoin),
                {
                    p2wpkhv0: "0xe8df018c7e326cc253faac7e46cdc51e68542c42",
                }
            );
        });

        it("should get correct hash for p2wsh address", () => {
            assert.deepEqual(
                decodeBtcAddress(
                    "bc1q75f6dv4q8ug7zhujrsp5t0hzf33lllnr3fe7e2pra3v24mzl8rrqtp3qul",
                    bitcoinjs.networks.bitcoin
                ),
                {
                    p2wshv0: "0xf513a6b2a03f11e15f921c0345bee24c63fffe638a73eca823ec58aaec5f38c6",
                }
            );
        });
    });

    describe("encodeBtcAddress", () => {
        it("should encode correct p2pkh address from hash", () => {
            const mockAddress = <BitcoinAddress>{
                isP2pkh: true,
                asP2pkh: createH160("0x751e76e8199196d454941c45d1b3a323f1433bd6"),
                type: "P2pkh",
            };

            const encodedAddress = encodeBtcAddress(mockAddress, bitcoinjs.networks.bitcoin);
            assert.equal(encodedAddress, "1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH");
        });

        it("should encode correct p2sh address from hash", () => {
            const mockAddress = <BitcoinAddress>{
                isP2sh: true,
                asP2sh: createH160("0xbcfeb728b584253d5f3f70bcb780e9ef218a68f4"),
                type: "P2sh",
            };

            const encodedAddress = encodeBtcAddress(mockAddress, bitcoinjs.networks.bitcoin);
            assert.equal(encodedAddress, "3JvL6Ymt8MVWiCNHC7oWU6nLeHNJKLZGLN");
        });

        it("should encode correct p2wpkh address from hash", () => {
            const mockAddress = <BitcoinAddress>{
                isP2wpkHv0: true,
                asP2wpkHv0: createH160("0x93378a357ba80c85f1074f7b49372df901567b53"),
                type: "P2wpkHv0",
            };

            const encodedAddress = encodeBtcAddress(mockAddress, bitcoinjs.networks.regtest);
            assert.equal(encodedAddress, "bcrt1qjvmc5dtm4qxgtug8faa5jdedlyq4v76ngpqgrl");
        });

        it("should encode correct p2wsh address from hash", () => {
            const mockAddress = <BitcoinAddress>{
                isP2wsHv0: true,
                asP2wsHv0: createH256("0xf513a6b2a03f11e15f921c0345bee24c63fffe638a73eca823ec58aaec5f38c6"),
                type: "P2wsHv0",
            };

            const encodedAddress = encodeBtcAddress(mockAddress, bitcoinjs.networks.bitcoin);
            assert.equal(encodedAddress, "bc1q75f6dv4q8ug7zhujrsp5t0hzf33lllnr3fe7e2pra3v24mzl8rrqtp3qul");
        });
    });

    describe("getTxProof", () => {
        const stubbedElectrsApi = sinon.createStubInstance(DefaultElectrsAPI);
        const mockElectrsGetParsedExecutionParameters = (merkleProofHex: string, txHex: string) => {
            const [proof, tx] = [BitcoinMerkleProof.fromHex(merkleProofHex), bitcoinjs.Transaction.fromHex(txHex)];
            stubbedElectrsApi.getParsedExecutionParameters.withArgs(sinon.match.any).resolves([proof, tx]);
        };

        it.only("should parse proof and transactions correctly", async () => {
            const merkleProofHex =
                // eslint-disable-next-line max-len
                "00000020c7e49e3d9d84a599f0fbf78f003ae770b942675956810c000000000000000000060534ec75faf97318c8c3587e00e00e222fe4cdf81085ab066ece6e7722294f4173565f123a1017a946a513b40200000bceb6ead3403d40614248e5b13f5e61f45e864263fb5a54f3069c20843d3d8af485aba8094cc43a2e5967e0de4ae2e2a2fa45a26793700e1136720d0ed027dc7d18e606d4e45a304ed3c322acd6e326104daa50a47dc4af545f6aeb548cebc243d9e88d3230862cad3c2ac95cdd330fae2da6f5852aefbfa47a70bcd7485df4c34bf591ad98b1a5bcb0527fa01db93c01532dad0a7fcd8cc58c6b3624563e66974bf5958efb651a211c45516dc89a95aedb6154fa56e896a0d7fb79b89a7b0d0a5140785fd84fe0870ce5ceac6455ad94345b628693fcc2368e7b91693641ed4f3204eb690dbd0ca0284867489900367f3d1344e0d97d12386007e47aa76db73cfdf2aba5b43566018d821c5eb8600ecb53f5404838f315af07b001ae7e81b64c3b1f92c90286541261e989d6113c20ff1cfef90b0e2af0e064d485dfa90bce02c508ed53fe5e2f2aec2050bbbd80b795197061b6b42ebb4ce862d916c5389c6703f7aa00";
            const txHex =
                // eslint-disable-next-line max-len
                "02000000000101a1dcf3ca033463e346339642dd7305e33de4ce5ab179d1e19b1eb146534421660000000017160014a97a9058829417d4c581ad5004b6e46cc680063dfdffffff01b9010000000000001600143b05c08e224ddec538ac7aa2e3b6583b983807a302473044022051480b10ef40d12bce982d1d08176a403f176dd3e51189c07a0a9584ddb8e91602204a02134b2b892904a3519da0044e97da9ae78232f8f7678fea0b6531bf3104130121039dcac4d315739516bf5cea98bc6a9cfb49cb6269beb67c520bc5ecacc3c7d47206c70900";
            mockElectrsGetParsedExecutionParameters(merkleProofHex, txHex);
            const expectedMerkleProof = { txCount: 692, hashCount: 11, flagBitsCount: 24 };
            const expectedTxIns = [
                {
                    source: {
                        fromOutput: [
                            {
                                type: "Buffer",
                                data: [
                                    161, 220, 243, 202, 3, 52, 99, 227, 70, 51, 150, 66, 221, 115, 5, 227, 61, 228, 206,
                                    90, 177, 121, 209, 225, 155, 30, 177, 70, 83, 68, 33, 102,
                                ],
                            },
                            0,
                        ],
                    },
                    script: "0x160014a97a9058829417d4c581ad5004b6e46cc680063d",
                    sequence: 4294967293,
                    witness: [
                        // eslint-disable-next-line max-len
                        "0x3044022051480b10ef40d12bce982d1d08176a403f176dd3e51189c07a0a9584ddb8e91602204a02134b2b892904a3519da0044e97da9ae78232f8f7678fea0b6531bf31041301",
                        "0x039dcac4d315739516bf5cea98bc6a9cfb49cb6269beb67c520bc5ecacc3c7d472",
                    ],
                },
            ];
            const expectedTxOuts = [
                {
                    value: 441,
                    script: { bytes: "0x00143b05c08e224ddec538ac7aa2e3b6583b983807a3" },
                },
            ];
            const expectedTxLockTime = { blockHeight: 640774 };
            const expectedLengthBound = 214;

            const { merkleProof, transaction, lengthBound } = await getTxProof(stubbedElectrsApi, "");

            assert.equal(merkleProof.transactionsCount, expectedMerkleProof.txCount);
            assert.equal(merkleProof.flagBits.length, expectedMerkleProof.flagBitsCount);
            assert.equal(merkleProof.hashes.length, expectedMerkleProof.hashCount);
            assert.equal(JSON.stringify(transaction.inputs), JSON.stringify(expectedTxIns));
            assert.equal(JSON.stringify(transaction.outputs), JSON.stringify(expectedTxOuts));
            assert.deepEqual(transaction.lockAt, expectedTxLockTime);
            assert.equal(lengthBound, expectedLengthBound);
        });
    });
});
