# interbtc-api

## About

The interBTC TypeScript library connects the Polkadot and Kusama ecosystems with Bitcoin. It allows the creation of interBTC on Polkadot and kBTC on Kusama, fungible "wrapped" tokens that represent Bitcoin. Wrapped tokens are backed by Bitcoin 1:1 and allow redeeming of the equivalent amount of Bitcoins by relying on a collateralized third-party (Vaults).
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
const isMainnet = false;
const interBTC = await createInterBtcApi(PARACHAIN_ENDPOINT, isMainnet);
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

### Issuing interBTC

From the account you set, you can then start requesting to issue interBTC.

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

At this point, you will need to send BTC using your favorite BTC wallet.

### Redeeming interBTC

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

At this point, one more more Vaults will send BTC to the address specified within 24 hours.

### Creating an AccountId Instance

Certain API calls require a parameter of type `AccountId`, which represents the Polkadot/Kusama account and can be instantiated as follows

```ts
import { AccountId } from "@polkadot/types/interfaces/runtime";

const activeStakedRelayerId = await interBTC.api.createType(
    "AccountId",
    "5Ck5SLSHYac6WFt5UZRSsdJjwmpSZq85fd5TRNAdZQVzEAPT"
);
const feesEarnedByActiveStakedRelayer = await interBTC.stakedRelayer.getFeesEarned(
    activeStakedRelayerId
);
```

### More Examples

There are many examples in the integration tests, showing how to use this library. Take a look at them here: https://github.com/interlay/interbtc-api/tree/master/test/integration

## API Documentation

Please check the documentation at https://docs.interlay.io/interbtc-api/#/classes/DefaultInterBtcApi

## Development

### Fork this Repository
Follow Github's instructions on [how to fork a repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo) to create your own fork.

### Clone Your Repository

```bash
git@github.com:<your_github_profile>/interbtc-api.git
cd interbtc-api
```

### Setting up a Local Development Environment

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

#### Start the Parachain Locally for Integration/All Tests

Note that the parachain needs to be running for all tests to run.

```bash
yarn docker-parachain-start
```

The default parachain started is Kintsugi (KINT). To choose a specific chain, use the optional `--chain` parameter.
e.g. to start Kintsugi explicitly

```bash
yarn docker-parachain-start --chain=KINT
```

Or, to start Interlay locally use

```bash
yarn docker-parachain-start --chain=INTR
```

When in doubt, start with Kintsugi. You will know when to use Interlay

#### Rebuild Generated Docker Files

`yarn docker-parachain-start` saves docker compose files locally in `local-setup` directory to avoid rebuilding all data just to restart the development environment. In most cases, you don't need to rebuild those unless there have been changes to the related docker images in our fork of the [parachain-launch project](https://github.com/interlay/parachain-launch).

In order to force a fresh rebuild of all configuration files used for the local test environment, delete the existing `local-setup` folder and run `yarn docker-parachain-start`. This will automatically regenerate all configuration files and start the parachain.

```bash
rm -r local-setup && yarn docker-parachain-start
```

#### Run All Tests
Then, to run all tests:

```bash
yarn test
```

#### Run Integration Tests Only

```bash
yarn test:integration
```

Note: While the parachain is starting up, there will be warnings from the integration tests until it can locate the locally running test vaults. Expect the startup to take around 2-3 minutes (after `yarn docker-parachain-start`), and only start the integration tests after that time frame.

Another option is to switch to the `local-setup` directory and there check for the vaults to start - for example, to see the logs for vault 1, use this:
```bash
# in <project_folder>/local-setup
docker-compose logs -f vault_1
```

(Note: The optional `-f` flag attaches the terminal to the log output, you will need to <kbd>Ctrl</kbd> + <kbd>C</kbd> to exit. Alternatively, omit the flag to just get the current latest log entries.)

#### Stop the Local Parachain

To stop the locally running parachain, run:

```bash
yarn docker-parachain-stop
```

Note: This will remove the volumes attached to the images. So your chain will start next time in a clean/wiped state. 

### Updating Types

We only need to update types when we have changed to newer docker images for the parachain / clients.

Run the parachain (via `yarn docker-parachain-start` as shown above, or indeed any Substrate node) and download the metadata:

```bash
curl -H "Content-Type: application/json" -d '{"id":"1", "jsonrpc":"2.0", "method": "state_getMetadata", "params":[]}' http://localhost:9933 > src/json/parachain.json
```

(Remember to remove `local-setup` if you want to generate types for a new version of the parachain.)

Then, update the metadata by building the library:

```bash
yarn build
```

### Usage as script

This library can be used as a script for initializing a local interBTC setup (the services ran using docker-compose), to allow for manual testing of the UI.

```bash
yarn install
yarn initialize
```

By default, every flag is enabled. To get more information about the flags and disable some of them, run

```bash
yarn initialize --help
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
