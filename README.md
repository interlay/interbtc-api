# PolkaBTC JS

JavaScript library to interact with PolkaBTC

## Getting started

See [BTC Parachain](https://github.com/interlay/btc-parachain) to get a development node running.

To install dependencies, run

```
yarn install
```

Then, to run tests, run

```
yarn test
```

Note that the parachain needs to be running for all tests to pass.
To run only unit tests, use

```
yarn test:unit
```

## Usage

To use the library, you will first need to create a PolkadotJS `APIPromise` instance,
and then to instantiate a `PolkaBTCAPI` instance.

```typescript
import PolkaBTCAPI from "@interlay/polkabtc-js";
import { createAPI } from "@interlay/polkabtc-js/factory";

const defaultEndpoint = "ws://127.0.0.1:9944";
const api = await createAPI(defaultEndpoint);
const polkaBTC = new PolkaBTCAPI(api);
```

To emit transactions, an `account` has to be set.
The account should be an instance of `KeyringPair`.

```typescript
import testKeyring from "@polkadot/keyring/testing";
const keyring = testKeyring();
const keypair = keypair.getPairs()[0];
polkaBTC.setAccount(keypair);
```

The different functionalities are then exposed through the `PolkaBTCAPI` instance.
