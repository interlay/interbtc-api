/* eslint-disable max-len */
import { TypeRegistry } from "@polkadot/types";
import { BitcoinMerkleProof, decodeBtcAddress, encodeBtcAddress, getTxProof } from "../../../src/utils";
import { assert } from "../../chai";
import * as bitcoinjs from "bitcoinjs-lib";
import { BitcoinAddress } from "@polkadot/types/lookup";
import { getAPITypes } from "../../../src/factory";
import { H160, H256 } from "@polkadot/types/interfaces/runtime";
import { DefaultElectrsAPI } from "../../../src/external";

describe("Bitcoin", () => {
    let registry: TypeRegistry;

    const createH256 = (hash: string): H256 => {
        return registry.createType("H256", hash);
    };

    const createH160 = (hash: string): H160 => {
        return registry.createType("H160", hash);
    };

    beforeAll(() => {
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
        const mockElectrsGetParsedExecutionParameters = (merkleProofHex: string, txHex: string) => {
            const stubbedElectrsApi = sinon.createStubInstance(DefaultElectrsAPI);
            const [proof, tx] = [BitcoinMerkleProof.fromHex(merkleProofHex), bitcoinjs.Transaction.fromHex(txHex)];
            stubbedElectrsApi.getParsedExecutionParameters.withArgs(expect.anything()).resolves([proof, tx]);
            stubbedElectrsApi.getCoinbaseTxId.withArgs(expect.anything()).resolves(tx.getId());
            return stubbedElectrsApi;
        };

        it("should parse proof and transactions correctly", async () => {
            const merkleProofHex =
                // eslint-disable-next-line max-len
                "00000020c7e49e3d9d84a599f0fbf78f003ae770b942675956810c000000000000000000060534ec75faf97318c8c3587e00e00e222fe4cdf81085ab066ece6e7722294f4173565f123a1017a946a513b40200000bceb6ead3403d40614248e5b13f5e61f45e864263fb5a54f3069c20843d3d8af485aba8094cc43a2e5967e0de4ae2e2a2fa45a26793700e1136720d0ed027dc7d18e606d4e45a304ed3c322acd6e326104daa50a47dc4af545f6aeb548cebc243d9e88d3230862cad3c2ac95cdd330fae2da6f5852aefbfa47a70bcd7485df4c34bf591ad98b1a5bcb0527fa01db93c01532dad0a7fcd8cc58c6b3624563e66974bf5958efb651a211c45516dc89a95aedb6154fa56e896a0d7fb79b89a7b0d0a5140785fd84fe0870ce5ceac6455ad94345b628693fcc2368e7b91693641ed4f3204eb690dbd0ca0284867489900367f3d1344e0d97d12386007e47aa76db73cfdf2aba5b43566018d821c5eb8600ecb53f5404838f315af07b001ae7e81b64c3b1f92c90286541261e989d6113c20ff1cfef90b0e2af0e064d485dfa90bce02c508ed53fe5e2f2aec2050bbbd80b795197061b6b42ebb4ce862d916c5389c6703f7aa00";
            const txHex =
                // eslint-disable-next-line max-len
                "02000000000101a1dcf3ca033463e346339642dd7305e33de4ce5ab179d1e19b1eb146534421660000000017160014a97a9058829417d4c581ad5004b6e46cc680063dfdffffff01b9010000000000001600143b05c08e224ddec538ac7aa2e3b6583b983807a302473044022051480b10ef40d12bce982d1d08176a403f176dd3e51189c07a0a9584ddb8e91602204a02134b2b892904a3519da0044e97da9ae78232f8f7678fea0b6531bf3104130121039dcac4d315739516bf5cea98bc6a9cfb49cb6269beb67c520bc5ecacc3c7d47206c70900";
            const stubbedElectrsApi = mockElectrsGetParsedExecutionParameters(merkleProofHex, txHex);
            const expectedMerkleProof = { txCount: 692, hashCount: 11, flagBitsCount: 24 };
            const expectedTxIns = [
                {
                    source: { fromOutput: ["0xa1dcf3ca033463e346339642dd7305e33de4ce5ab179d1e19b1eb14653442166", 0] },
                    script: "0x160014a97a9058829417d4c581ad5004b6e46cc680063d",
                    sequence: 4294967293,
                    witness: [
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

            const {
                userTxProof: { merkleProof, transaction, txEncodedLen },
            } = await getTxProof(stubbedElectrsApi, "");

            assert.equal(merkleProof.transactionsCount, expectedMerkleProof.txCount);
            assert.equal(merkleProof.flagBits.length, expectedMerkleProof.flagBitsCount);
            assert.equal(merkleProof.hashes.length, expectedMerkleProof.hashCount);
            assert.equal(JSON.stringify(transaction.inputs), JSON.stringify(expectedTxIns));
            assert.equal(JSON.stringify(transaction.outputs), JSON.stringify(expectedTxOuts));
            assert.deepEqual(transaction.lockAt, expectedTxLockTime);
            assert.equal(txEncodedLen, expectedLengthBound);
        });

        it("should parse coinbase transaction correctly", async () => {
            const merkleProofHex =
                "0040722fb212fd2df19dd3aa1b46ab45720b2756d40fef2795b10400000000000000000064168c425ebfd66f6dcd784ff7f1edb2cc21b468d95bed7e2f1b1077c55b8a5b77a47864697e0517a33edbeb0e0c00000d2f55880e7fe3ede64cd5c6c79bafde3a3d50a3d97ed2121ae639abd405c3115416000038effc732e2d1dd150ee56768f37a51cac2d538462577ea30dec922193043c9ab7309b6e367f2c1feccf184ba21910bab082cb45010add598c50e2a25642f0214cd95741374d420f277b61067c2c5c353cb2eb633f18e4cb59a3fab36797aeb1d028dd257b7c02b3d80cf12b4ba95b3a8bc5723425ad7f921ed684392c076761d77a8d75b589cb69848be8b5cdb73586454760da4c43bed179f0ed321e6996eb7dfcc3d152ee16d0a7961f97e36e0d8eb3e99cdf1eea225869edf445fb8643f867bcda8241385db5eae81d1dbf0b6257613b27062d6a3698801d1d3184081995612e2864367369f1a743c25db628a99574071ec2c61f8476c50986d652b23a71a47b90b30ce6c2ca5c680914b54d498df7efe06a4883554b990e1f16b6ee99c08d363117a918258f068fbea2d0a3f34cf2afe6a25407e425da1d5b9b3c8bc9e25826f65d499a46ede7f6ad7538815d68b34ec9110ca87647feeeef93da72baa8dee2a1e23d13ccba237eb2b17af095c265bf132d00e2be3282d926a0a404ff1f0000";
            const txHex =
                "010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff270342170c0b2f4d61726120506f6f6c2f1a01000200000003000000700027ff6200000000000000ffffffff02c164ae28000000001976a9142fc701e2049ee4957b07134b6c1d771dd5a96b2188ac0000000000000000266a24aa21a9ed054d90af5d454378394db8e2ab79b49aa9ba346af428d4f4969e9029750bf31a0120000000000000000000000000000000000000000000000000000000000000000000000000";
            const stubbedElectrsApi = mockElectrsGetParsedExecutionParameters(merkleProofHex, txHex);

            const {
                userTxProof: { transaction },
            } = await getTxProof(stubbedElectrsApi, "");
            assert.equal(transaction.inputs[0].source, "coinbase");
        });

        it("should parse timestamp locktime", async () => {
            const merkleProofHex =
                "00000020aebddedc2e843e47d4871b46d6f9b8784ffe13ece103910200000000000000009bdf738b56299f10bbe6e001f90e8958315f50fb8a6527bcf347ecccaec2d4849cb18a5847cc0218d43b4b19d50600000c152ec602c2d17d419da2559438f3978cc39d44284c188d3000101247640b3505bb716a03997c99afeb65a35cb8b3faa198f9ae6f1a9864ad6f6e65314aa447b79724241cd43852cd28f2216b3688fc7a3666dc0b3aa1a6e62195d6e9512498db15982af17383be42dcebdb401efcf1cb516c8d2709c5ee3f461833b6995f82b01e008bde63b6ea172f8780dd6e54bc7631caa93fdbca3bdd12deea2542db9a6ae075e3529ea2ed1a6f456cbeef00278dbc56e3a8bc290a5e68c1689b1fe7a8e34fbadb40255a22112094fe943874cdcf0f796c3db6d32d585c136816823fcf87d28983d431c287e4a49666e15563a23d66c36ab78ec8065bc00521db4a597bcf7d0145e4fd72a9c24e6ab96fe648d820ab7fa30214987786abafcfcd0c7068acac03a77a09c91eef38a13e8d26a7cc883be9246d9e072904ad615db28b829084713ce8c5f9559fbf57e946b2e2d6bf80cdf58a4961c0c01050553c8fb2f1983ad1e869f7450242daba46d399d1ed35a0699caddb838d8fe52846a7d767a517ed036db50a";
            const txHex =
                "0100000001c2bbbcb93451095bfa065bc5cd180308b41b08bcabaa48256508db8c74fb0d67000000008a47304402207fafead4082245238c3a3f3160133ef8625fb440475f7aac10e80e811553cfe502202bad066f3e63145c3b0b0de4224b73370bdc5a9152849d971f221ed543b647460141040a8cb7f2cc5e7b95d57b2667df225f9fd5090392b1953ee6b8d582c325c2ef6b8c8d9ccf80c28037923ef6cac2cf3580767af9efb04e560de38ee8a54fe48032ffffffff0200000000000000003c6a3a45572046696e64206d79206e616d6520696e20746865206e4c6f636b54696d65206669656c64206f662074686973207472616e73616374696f6e80260400000000001976a9149c11e6dca590909d274350269620344f702032c288ac496c736b";
            const stubbedElectrsApi = mockElectrsGetParsedExecutionParameters(merkleProofHex, txHex);

            const expectedLocktime = { time: 1802726473 };

            const {
                userTxProof: { transaction },
            } = await getTxProof(stubbedElectrsApi, "");
            assert.deepEqual(transaction.lockAt, expectedLocktime);
        });
    });
});
