@interlay/interbtc-api / [Exports](modules.md)

# interbtc-api

## About

The interBTC TypeScript library connects the Polkadot and Kusama ecosystems with Bitcoin. It allows the creation of iBTC on Polkadot and kBTC on Kusama, fungible "wrapped" tokens that represent Bitcoin. Wrapped tokens are backed by Bitcoin 1:1 and allow redeeming of the equivalent amount of Bitcoins by relying on a collateralized third-party (Vaults).
In comparison to other bridge constructions (like tBTC, wBTC, or RenVM) _anyone_ can become an intermediary by depositing collateral making interBTC the only truly open system.

The bridge itself follows the detailed specification: <a href="https://spec.interlay.io/" target="_blank"><strong>Explore the specification »</strong></a>

It is implemented as a collection of open-source Substrate modules using Rust: <a href="https://github.com/interlay/interbtc" target="_blank"><strong>Explore the implementation »</strong></a>

### Built with

- [TypeScript](https://github.com/Microsoft/TypeScript)
- [polkadot-js](https://polkadot.js.org/)
- [nvm](https://github.com/nvm-sh/nvm)
- [yarn](https://github.com/yarnpkg/yarn)
- [docker-compose](https://docs.docker.com/compose/)

You can visit [bridge.interlay.io](https://bridge.interlay.io/) to see the library in action.

## Usage

The library assumes you have a version of the [Interlay or Kintsugi networks](https://github.com/interlay/interbtc) running locally or remotely.

### Creating an API Instance

To use the library, you will first need to create a PolkadotJS `APIPromise` instance,
and then instantiate a `InterBtcApi` instance.

```ts
import { createInterBtcApi } from "@interlay/interbtc";

// If you are using a local development environment
// const PARACHAIN_ENDPOINT = "ws://127.0.0.1:9944";
// if you want to use the Interlay-hosted beta network
const PARACHAIN_ENDPOINT = "wss://api.interlay.io/parachain";
const bitcoinNetwork = "mainnet";
const interBTC = await createInterBtcApi(PARACHAIN_ENDPOINT, bitcoinNetwork);

// When finished using the API, disconnect to allow Node scripts to gracefully terminate
interBTC.disconnect();
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

The different functionalities are then exposed through the `InterBtcApi` instance.

### Issuing

From the account you set, you can then request to issue (mint) interBTC.

```ts
import { BitcoinAmount } from "@interlay/monetary-js";
// amount of BTC to convert to interBTC
// NOTE: the bridge fees will be deducted from this. For example, if you request 1 BTC, you will receive about 0.995 interBTC
const amount = BitcoinAmount.from.BTC(0.001);
// request to issue interBTC
const requestResults = await interBTC.issue.request(amount);
// the request results includes the BTC address(es) and the BTC that should be sent to the Vault(s)
// NOTE: the library will automatically distribute issue requests across multiple Vaults if no single Vault can fulfill the request.
// Most of the time, a single Vault will be able to fulfill the request.
```

Send BTC using the wallet of your choice or the regtest node (see below).

### Redeeming

To exchange interBTC back for physical BTC, you can then request to redeem (burn) interBTC.

```ts
import { BitcoinAmount } from "@interlay/monetary-js";
// the amount wrapped tokens to redeem
// NOTE: the bridge fees will be deducted from this 
const amount = BitcoinAmount.from.BTC(0.001);
// your BTC address
const btcAddress = "tb123....";
// the request results includes the BTC address(es) and the BTC that should be sent to the Vault(s)
// NOTE: the library will automatically distribute redeem requests across multiple Vaults if no single Vault can fulfill the request.
// Most of the time, a single Vault will be able to fulfill the request.
const requestResults = await interBTC.redeem.request(amount, btcAddress);
```

One or more Vaults will send BTC to the address specified within the expiry period.

### Creating an AccountId Instance

Certain API calls require a parameter of type `AccountId`, which represents the Polkadot/Kusama account and can be instantiated as follows

```ts
const accountId = await interBTC.api.createType(
    "AccountId",
    "5Ck5SLSHYac6WFt5UZRSsdJjwmpSZq85fd5TRNAdZQVzEAPT"
);
```

### More examples

There are many examples in the integration tests, showing how to use this library. Take a look at them here: https://github.com/interlay/interbtc-api/tree/master/test/integration

## Development

### Fork this repository

Follow Github's instructions on [how to fork a repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo) to create your own fork.

### Clone your repository

```bash
git@github.com:<your_github_profile>/interbtc-api.git
cd interbtc-api
```

### Setting up a local development environment

Start by setting your Node version via `nvm`

```bash
nvm use
```

(If necessary, `nvm` will guide you on how to install the version.)

Next, install the dependencies

```bash
yarn install
```

Finally, build the library

```bash
yarn build
```

### Testing

To run unit tests only, use

```bash
yarn test:unit
```

#### Start the parachain locally for integration tests

Note that the parachain needs to be running for all tests to run.

```bash
docker-compose up -d
```

The default parachain runtime is Kintsugi.

#### Run all tests

Then, to run all tests:

```bash
yarn test
```

#### Run integration tests only

```bash
yarn test:integration
```

NOTE: While the parachain is starting up, there will be warnings from the integration tests until it can locate the locally running test vaults. Expect the startup to take a few seconds, before the integration tests start.

##### Dealing with timeouts during local testing

At times, when running tests locally, the timeout set in `package.json`'s `jest.testTimeout` setting might not be enough. In that case, you can override the `testTimeout` value (in ms) on the command line:

```bash
yarn test:integration --testTimeout=900000
```

##### Check service logs in detached mode
To check the logs or the services (for example, `vault_1`) you can use this:

```bash
docker-compose logs -f vault_1
```

NOTE: The optional `-f` flag attaches the terminal to the log output, you will need to <kbd>Ctrl</kbd> + <kbd>C</kbd> to exit. Alternatively, omit the flag to just get the current latest log entries.

#### Stop the local parachain

To stop the locally running parachain, run:

```bash
docker-compose down -v
```

NOTE: This will remove the volumes attached to the images. So your chain will start next time in a clean/wiped state. 

### Updating types

We only need to update types when we have changed to newer docker images for the parachain / clients.

Run the parachain (as shown above) and update the metadata:

```bash
yarn update-metadata
```

Then, update the metadata by building the library:

```bash
yarn build
```

### Usage as script

This repository contains a number of scripts for various use cases. Check `package.json` for all of the available scripts. 

**Query Undercollateralized borrowers**

Given a `PARACHAIN_ENDPOINT` (e.g. `wss://api-dev-kintsugi.interlay.io/parachain`), the following will print a table with all undercollateralized borrowers on that network.
```bash
yarn install
yarn undercollateralized-borrowers --parachain-endpoint PARACHAIN_ENDPOINT
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

1. Set up git so you can [sign your commits](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work) (Alternative link: [GitHub: Signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits))  
Unsigned PRs cannot be merged, so do not skip this step.
2. Fork the Project
3. Create your Feature Branch (git checkout -b yourname/AmazingFeature)
4. Commit your Changes (git commit -m 'Add some AmazingFeature')
5. Push to the Branch (git push origin yourname/AmazingFeature)
6. Open a Pull Request with a description of feature you are adding

If you are searching for a place to start or would like to discuss features, reach out to us:

- [Discord](https://discord.com/invite/interlay)

## License

(C) Copyright 2022 [Interlay](https://www.interlay.io) Ltd

interbtc-js is licensed under the terms of the Apache License (Version 2.0). See [LICENSE](LICENSE).

## Contact

Website: [Interlay.io](https://www.interlay.io)

Twitter: [@interlayHQ](https://twitter.com/InterlayHQ)

Email: contact@interlay.io

## Acknowledgements

We would like to thank the following teams for their continuous support:

-   [Web3 Foundation](https://web3.foundation/)
-   [Parity Technologies](https://www.parity.io/)
