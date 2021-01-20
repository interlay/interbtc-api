import { BTCCoreAPI, TxStatus } from "../../apis/btc-core";

export class MockBTCCoreAPI implements BTCCoreAPI {
    getLatestBlock(): Promise<string> {
        return Promise.resolve("00000000000000000006d0d6796fc5ed2e7be8d5511912bc3e8bdc1cf8d4c63f");
    }

    getLatestBlockHeight(): Promise<number> {
        return Promise.resolve(1835346);
    }

    getMerkleProof(): Promise<string> {
        return Promise.resolve(
            "00000020db957b64e98a999cce48ff1bc3be1c5c93f886842f83" +
                "09000000000000000000c7d497903ba4a8cec7c32909f3b1ca07" +
                "27e84653fc72bb6f0514150bde9c522ccb24745faa920e17ad20" +
                "4447f50400000c8926403719fb0befce9548b599e42722ad9bb3" +
                "8f9c1d52d7c5af49ca7dcb156cf34dc26187e607857296152c7d" +
                "5ce23b844fa1d5144edbb803c487f44a0cf45af4e23c954c9882" +
                "b149f2793ec0bbbe1269cfbdbce2050c607c515a3ba7605925d5" +
                "3585a422b26a1c114965d6fa39ee5491b4263d6dbf8e7a6c7550" +
                "1acfefafb6cb68d819bd4da7a9b24506d434ca720d91ccfcea0e" +
                "ea951481362e4409d325ffe46127d55feb011a9285f7af5f471f" +
                "b16bfe43a9aa5adf2d545333a97d283e55330f209a85b80aa217" +
                "d72e4ad194e8bc9957488d30382060ad4a7ec5842b46420f057e" +
                "1af88adeedb3d236e7538d0cb63fffbea3fbd49dacf53adc1cc0" +
                "99b172dd5c9f407ce64e1c323750c2bad3b8c0acc52c204e91e8" +
                "d5e13f64dc0d3eab338950f5475e5a84e0cc6aac41dc512ed420" +
                "f134803ea9a399ac6792f6741914737c425b75625b92f0f742ea" +
                "22538f686e9080e6e03374ee34c2a9d62c6e651b6c35a6586f67" +
                "a56a7244b303094f954e4691f3be3ecac1dc36914cd1561a6625" +
                "b003ff0f00"
        );
    }

    getTransactionStatus(): Promise<TxStatus> {
        return Promise.resolve({
            confirmed: true,
            confirmations: 12,
        });
    }

    getTransactionBlockHeight(): Promise<number> {
        return Promise.resolve(213132);
    }

    getRawTransaction(): Promise<Buffer> {
        return Promise.resolve(
            Buffer.from(
                "020000000001012a489eaa754d9aaf5198627d79e9234" +
                    "dba945436503aa445c1b82d6bc194c3270100000000ff" +
                    "ffffff0280380100000000001600145601eeffa54c8b7" +
                    "e306c0b3a50c48121c42d09be8d4e0300000000001600" +
                    "14a528e6f91766262e3d1b22e52af342f55b2d551c024" +
                    "7304402206fdaa5186ff79740b0fc2848f3ee40b48aa0" +
                    "cbdf9000304fbe6d35d7b1ee0c3602202cf90c73b0b83" +
                    "4c8cc78c0b9e988bc2c5781fa617551c8cb5aa7b555ef" +
                    "e7ab0a012102170f80797baa55d091f85e38a7b463c56" +
                    "905c09ef6024e83039037be5cd7550900000000"
            )
        );
    }

    getTxIdByRecipientAddress(_recipientAddress: string, _amountAsBTC?: string): Promise<string> {
        return Promise.resolve("f5bcaeb5181154267bf7d05901cc8c2f647414a42126c3aee89e01a2c905ae91");
    }

    getTxIdByOpReturn(_opReturn: string, _recipientAddress?: string, _amountAsBTC?: string): Promise<string> {
        return Promise.resolve("f5bcaeb5181154267bf7d05901cc8c2f647414a42126c3aee89e01a2c905ae91");
    }
}
