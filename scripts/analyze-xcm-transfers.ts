import { BN } from "bn.js";
import fetch from "cross-fetch";

const ENDPOINT = 'https://api.interlay.io/gateway-graphql/v1/graphql';
const ENDPOINT2 = 'https://api.interlay.io/graphql/graphql';
const ACALA_SOVEREIGN_ACCOUNT = 'wdA7Cx6DfdaYx39ac5RtRD1H8kDdT74Nmi8tB7vKh2z9RPzQg';
const MOONBEAM_SOVEREIGN_ACCOUNT = 'wdA7Cx6DgS4mg7dHqMwoKyjqR8kH7gW7G6ymTeLywQAHJJVNy';

interface Deposited {
    total: any,
    amountFrom: Map<String, any>,
}

const xcmTransferQuery = JSON.stringify({
    query: `{
        substrate_extrinsic(where: {substrate_events: {section: {_eq: "xcmpQueue"}, method: {_eq: "Success"}}, blockNumber: {_gt: "975127"}}) {
        id
        method
        name
        section
        blockNumber
        substrate_events {
          method
          name
          section
          params
        }
    }
    }`
});

async function query(query: any, endpoint: string) {
    const response = await fetch(
        endpoint,
        {
            method: 'post',
            body: query,
            headers: {
              'Content-Type': 'application/json',
            },
        }
    );

    const json = await response.json();

    return json.data;
}

const redeemRequests = JSON.stringify({
    query: `{
        redeems(where: {request: {height: {absolute_gt: 975127}}}) {
          id
          status
          userParachainAddress
          request {
            requestedAmountBacking
            height {
              absolute
            }
          }
        }
    }`
})

async function main() {
    const xcm = (await query(xcmTransferQuery, ENDPOINT)).substrate_extrinsic;
    const redeems = (await query(redeemRequests, ENDPOINT2)).redeems;

    let accounts = new Map<string, Deposited>();
    let totalWrappedDeposited = new BN(0);
    let totalWrappedWithdrawn = new BN(0);
    let totalWrappedWithdrawnAcala = new BN(0);
    let totalWrappedWithdrawnMoonbeam = new BN(0);
    let totalGovDeposited = new BN(0);
    let totalGovWithdrawn = new BN(0);

    // get a list of all accounts the deposited iBTC to Interlay
    // and log total amount as well as amount from Acala and Moonbeam
    xcm.forEach((extrinsic: { substrate_events: any; }) => {
        const events = extrinsic.substrate_events;
        let withdrawnFrom = "";
        let depositedTo;
        events.forEach((event: {
            section: any;
            method: any;
            params: any;
        }) => {
            if (event.section === "tokens") {
                const method = event.method;
                // param0 is the token
                const token = event.params[0].value.token;
                // param1 is the account
                const account = event.params[1].value;
                // param2 is the amount either as a number of hex encoded
                let amount = new BN(event.params[2].value);

                console.log(`${method} ${amount} ${token} from/to ${account}`);

                if (method === "Withdrawn") {
                    withdrawnFrom = account;
                    if (token === "INTR") {
                        totalGovWithdrawn = totalGovWithdrawn.add(amount);
                    } else if (token === "IBTC") {
                        totalWrappedWithdrawn = totalWrappedWithdrawn.add(amount);
                        if (withdrawnFrom === ACALA_SOVEREIGN_ACCOUNT) {
                            totalWrappedWithdrawnAcala = totalWrappedWithdrawnAcala.add(amount);
                        } else if (withdrawnFrom === MOONBEAM_SOVEREIGN_ACCOUNT) {
                            totalWrappedWithdrawnMoonbeam = totalWrappedWithdrawnMoonbeam.add(amount);
                        }
                    }
                } else if (method === "Deposited") {
                    depositedTo = account;
                    if (token === "INTR") {
                        totalGovDeposited = totalGovDeposited.add(amount);
                    } else if (token === "IBTC") {
                        totalWrappedDeposited = totalWrappedDeposited.add(amount);
                        const deposited = accounts.get(account);
                        if (deposited) {
                            deposited.total = deposited.total.add(amount);
                            let currentAmount = deposited.amountFrom.get(withdrawnFrom);
                            if (currentAmount) {
                                const newAmount = currentAmount.add(amount);
                                deposited.amountFrom.set(withdrawnFrom, newAmount);
                            } else {
                                deposited.amountFrom.set(withdrawnFrom, amount);
                            }
                            accounts.set(account, deposited);
                        } else {
                            const amountFrom = new Map<String, any>();
                            amountFrom.set(withdrawnFrom, amount);
                            accounts.set(
                                account,
                                {
                                    total: amount,
                                    amountFrom: amountFrom
                                });
                        }
                    }
                }
            }
        })
    });

    const redeemsFromXcmUsers: Array<any> = [];
    const redeemsFromAcalaUsers: Array<any> = [];
    const redeemsFromMoonbeamUsers: Array<any> = [];
    let totalWrappedRedeemedFromXcm = new BN(0);
    let totalWrappedRedeemedAcala = new BN(0);
    let maxAcalaRedeems = new BN(0);
    console.log(redeems);
    redeems.forEach((redeem: { userParachainAddress: string; request: { requestedAmountBacking: any; }; }) => {
        const account = redeem.userParachainAddress;
        if (accounts.has(account)) {
            redeemsFromXcmUsers.push(redeem);
            const amount = new BN(redeem.request.requestedAmountBacking);
            totalWrappedRedeemedFromXcm = totalWrappedRedeemedFromXcm.add(amount);

            if (accounts.get(account)?.amountFrom.has(ACALA_SOVEREIGN_ACCOUNT)) {
                maxAcalaRedeems = maxAcalaRedeems.add(amount);
            }

            if (accounts.get(account)?.amountFrom.has(ACALA_SOVEREIGN_ACCOUNT)) {
                redeemsFromAcalaUsers.push(redeem);
                totalWrappedRedeemedAcala = totalWrappedRedeemedAcala.add(amount);
            }
            if (accounts.get(account)?.amountFrom.has(MOONBEAM_SOVEREIGN_ACCOUNT)) {
                redeemsFromMoonbeamUsers.push(redeem);
            }
        }

    });

    console.log(`Total INTR Deposited: ${totalGovDeposited}`);
    console.log(`Total INTR Withdrawn: ${totalGovWithdrawn}`);
    console.log(`Total IBTC Deposited: ${totalWrappedDeposited}`);
    console.log(`Total IBTC Withdrawn: ${totalWrappedWithdrawn}`);
    console.log(`Total IBTC Withdrawn Acala: ${totalWrappedWithdrawnAcala}`);
    console.log(`Total IBTC Withdrawn Moonbeam: ${totalWrappedWithdrawnMoonbeam}`);
    console.log(`Total redeemed from XCM users ${totalWrappedRedeemedFromXcm}`);
    console.log(`Max possible redeemed from Acala users ${maxAcalaRedeems}`);
    console.log(`Redeems from users bridging from Moonbeam ${redeemsFromMoonbeamUsers.length}`);
    console.log(`Redeems from users bridging from Acala ${JSON.stringify(redeemsFromAcalaUsers)}`);
    console.log(`Total IBTC redeemed from users bridging from Acala ${totalWrappedRedeemedAcala}`);
}

main().catch((err) => {
    console.log("Error thrown by script:");
    console.log(err);
});
