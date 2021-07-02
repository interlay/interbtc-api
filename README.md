# interbtc-js

## About

The interbtc TypeScript library connects the Polkadot ecosystem with Bitcoin. It allows the creation of interBTC, a fungible token that represents Bitcoin in the Polkadot ecosystem. InterBTC is backed by Bitcoin 1:1 and allows redeeming of the equivalent amount of Bitcoins by relying on a collateralized third-party (Vaults).
In comparison to other bridge constructions (like tBTC, wBTC, or RenVM) _anyone_ can become an intermediary by depositing collateral making interBTC the only truly open system.

The bridge itself follows the detailed specification: <a href="https://interlay.gitlab.io/interbtc-spec/" target="_blank"><strong>Explore the specification »</strong></a>

It is implemented as a collection of open-source Substrate modules using Rust: <a href="https://github.com/interlay/interbtc" target="_blank"><strong>Explore the implementation »</strong></a>

### Built with

- [TypeScript](https://github.com/Microsoft/TypeScript)
- [polkadot-js](https://polkadot.js.org/)
- [yarn](https://github.com/yarnpkg/yarn)
- [docker-compose](https://docs.docker.com/compose/)

You can visit [bridge.interlay.io](https://bridge.interlay.io/) to see the library in action.

## Usage

The library assumes you have a [BTC-Parachain](https://github.com/interlay/interbtc) running locally or remotely.

### Creating an API Instance

To use the library, you will first need to create a PolkadotJS `APIPromise` instance,
and then to instantiate a `InterBTCAPI` instance.

```ts
import { createInterbtcAPI } from "@interlay/interbtc";

// If you are using a local development environment
// const DEFAULT_PARACHAIN_ENDPOINT = "ws://127.0.0.1:9944";
// if you want to use the Interlay-hosted beta network
const DEFAULT_PARACHAIN_ENDPOINT = "wss://bridge.interlay.io/api/parachain";
const isMainnet = false;
const interBTC = await createInterbtcAPI(DEFAULT_PARACHAIN_ENDPOINT, isMainnet);
```

### Attaching an Account

To emit transactions, an `account` has to be set.
The account should conform to the `AddressOrPair` interface.
If the account is not of the `KeyringPair` type, then a signer must also
be provided (such as an injected extension signer, from the Polkadot wallet).
See more details here: https://polkadot.js.org/docs/extension/usage/

```ts
import { createTestKeyring } from "@polkadot/keyring/testing";
const keyring = createTestKeyring();
const keypair = keyring.getPairs()[0];
interBTC.setAccount(keypair);
```

The different functionalities are then exposed through the `InterBTCAPI` instance.

### Issuing interBTC

From the account you set, you can then start requesting to issue interBTC.

```ts
// amount of BTC to convert to interBTC
// NOTE: the bridge fees will be deducted from this. For example, if you request 1 BTC, you will receive about 0.995 interBTC
const amount = new Big(0.001);
// request to issue interBTC
const requestResults = await issueAPI.request(amount);
// the request results includes the BTC address(es) and the BTC that should be sent to the vault(s)
// NOTE: the library will automatically distribute issue requests across multiple vaults if no single vault can fulfill the request.
// Most of the time, a single vault will be able to fulfill the request.
```

At this point, you will need to send BTC using your favorite BTC wallet.

### Redeeming interBTC

```ts
// the amount interBTC to burn
// NOTE: the bridge fees will be deducted from this 
const amount = new Big(0.001);
// your BTC address
const btcAddress = "tb123....";
// the request results includes the BTC address(es) and the BTC that should be sent to the vault(s)
// NOTE: the library will automatically distribute redeem requests across multiple vaults if no single vault can fulfill the request.
// Most of the time, a single vault will be able to fulfill the request.
const requestResults = await redeemAPI.request(amount, btcAddress);
```

At this point, one more more vaults will send BTC to the address specified within 24 hours.

### More Examples

There are plenty more examples how to use this library. Best is to take a look at the integration tests: https://github.com/interlay/interbtc-js/tree/13b421bb0fb91a04ce671e15a6be860750cc08a2/test/integration/parachain

## API Documentation

Please check the documentation at https://www.interlay.io/interbtc-js/#/modules

## Development

### Clone this Repository

```bash
git@gitlab.com:interlay/interbtc-js.git
cd interbtc-js
```

### Setting up a Local Development Environment

You can spin up the parachain including the different clients with docker-compose:

```bash
docker-compose up
```

If you want to run components individually, you can clone the repositories and run the commands as done in `docker-compose.yml`.

To install dependencies, run

```bash
yarn install
```

Build the library using

```bash
yarn build
```

### Testing

To run only unit tests, use

```bash
yarn test:unit
```

Note that the parachain needs to be running for all tests to pass.

Then, to run tests, run

```bash
yarn test
```

Certain API calls require a parameters of type `AccountId`. For testing, an empty accountId will suffice:

```ts
import { AccountId } from "@polkadot/types/interfaces/runtime";

const activeStakedRelayerId = <AccountId>{};
const feesEarnedByActiveStakedRelayer = await interBTC.stakedRelayer.getFeesEarned(
    activeStakedRelayerId
);
```

### Updating Types

Run the parachain (or indeed any Substrate node) and download the metadata:

```bash
curl -H "Content-Type: application/json" -d '{"id":"1", "jsonrpc":"2.0", "method": "state_getMetadata", "params":[]}' http://localhost:9933 > src/json/parachain.json
```

Then, update the metadata by building the library:

```bash
yarn build
```

## Help

### Bitcoin Regtest

Regtest is a local Bitcoin instance that allows you to practically anything including sending transactions, mining blocks, and generating new addresses.
For a full overview, [head over to the Bitcoin developer documentation](https://developer.bitcoin.org/examples/testing.html#regtest-mode).

**Sending Transactions**

For the issue process, you need to send a transaction. On regtest this can be achieved with:

```shell
bitcoin-cli -regtest -rpcwallet=Alice sendtoaddress VAULT_ADDRESS AMOUNT
```

**Mining Blocks**

In regtest, blocks are not automatically produced. After you sent a transaction, you need to mine e.g., 1 block:

```shell
bitcoin-cli -regtest generatetoaddress 1 $(bitcoin-cli -regtest getnewaddress)
```

**Getting Balances**

You can query the balance of your wallet like so:

```shell
bitcoin-cli -regtest -rpcwallet=Alice getbalance
```

### Docker

You can hard-reset the docker dependency setup with the following commands:

```shell
docker kill $(docker ps -q)
docker rm $(docker ps -a -q)
docker rmi $(docker images -q)
docker volume rm $(docker volume ls -q)
```

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (git checkout -b yourname/AmazingFeature)
3. Commit your Changes (git commit -m 'Add some AmazingFeature')
4. Push to the Branch (git push origin yourname/AmazingFeature)
5. Open a Pull Request

If you are searching for a place to start or would like to discuss features, reach out to us:

- [Discord](https://discord.gg/BgA6dTYmAV)

## License

(C) Copyright 2021 [Interlay](https://www.interlay.io) Ltd

interbtc-js is licensed under the terms of the Apache License (Version 2.0). See [LICENSE](LICENSE).

## Contact

Website: [Interlay.io](https://www.interlay.io)

Twitter: [@interlayHQ](https://twitter.com/InterlayHQ)

Email: contact@interlay.io

## Acknowledgements

We would like to thank the following teams for their continuous support:

-   [Web3 Foundation](https://web3.foundation/)
-   [Parity Technologies](https://www.parity.io/)
