# PolkaBTC JS

JavaScript library to interact with PolkaBTC

## Getting started

See [BTC Parachain](https://github.com/interlay/btc-parachain) to get a development node running.

To install dependencies, run

```
yarn install
```

Build the library using

```
yarn build
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

### Updating Types

Run the parachain (or indeed any Substrate node) and download the metadata:

```bash
curl -H "Content-Type: application/json" -d '{"id":"1", "jsonrpc":"2.0", "method": "state_getMetadata", "params":[]}' http://localhost:9933 > src/json/edgeware.json
```

## Usage

The library assumes you have a [BTC-Parachain](https://github.com/interlay/btc-parachain) running locally.

To use the library, you will first need to create a PolkadotJS `APIPromise` instance,
and then to instantiate a `PolkaBTCAPI` instance.

```typescript
import { createPolkabtcAPI } from "@interlay/polkabtc";

const defaultEndpoint = "ws://127.0.0.1:9944";
const isMainnet = false;
const polkaBTC = await createPolkabtcAPI(defaultEndpoint, isMainnet);
```

To emit transactions, an `account` has to be set.
The account should be an instance of `AddressOrPair`.

```typescript
import testKeyring from "@polkadot/keyring/testing";
const keyring = testKeyring();
const keypair = keypair.getPairs()[0];
polkaBTC.setAccount(keypair);
```

The different functionalities are then exposed through the `PolkaBTCAPI` instance.

## Testing without a running BTC-Parachain

For testing purposes, you can mock the BTC-Parachain and use a mock endpoint that emulates the behavior of the BTC-Parachain. 

```typescript
import { createPolkabtcAPI } from "@interlay/polkabtc";

const polkaBTC = await createPolkabtcAPI("mock");
```

Example usage:

```typescript
const issueRequests = await polkaBTC.issue.list();
const totalStakedDOTAmount = await polkaBTC.stakedRelayer.getTotalStakedDOTAmount();
```

Certain API calls require a parameters of type `AccountId`. For testing, an empty accountId will suffice:

```typescript
import { AccountId } from "@polkadot/types/interfaces/runtime";

const activeStakedRelayerId = <AccountId>{};
const feesEarnedByActiveStakedRelayer = await polkaBTC.stakedRelayer.getFeesEarned(
    activeStakedRelayerId
);
```
