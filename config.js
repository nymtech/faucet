
import { stringToPath } from '@cosmjs/crypto'
import 'dotenv/config'

export default {
    port: 80, // http port
    db: {
        path: "./db/faucet.db" // save request states
    },
    project: {
        name: "Nym Sandbox",
        logo: "https://raw.githubusercontent.com/cosmos/chain-registry/master/nyx/images/nym_token_dark.png",
        tx_endpoint: "https://sandbox-blocks.nymtech.net/sandbox/tx/"
    },
    blockchain: {
        // make sure that CORS is enabled in rpc section in config.toml
        // cors_allowed_origins = ["*"]
        rpc_endpoint: "https://rpc.sentry-02.theta-testnet.polypore.xyz",
    },
    sender: {
        mnemonic: process.env.mnemonic,
        option: {
            hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
            prefix: "cosmos"
        }
    },
    tx: {
        amount: {
            denom: "uatom",
            amount: "10000"
        },
        gasPrices: "0.05uatom"
    },
    limit: {
        // how many times each wallet address is allowed in a window(24h)
        address: 2,
        // how many times each ip is allowed in a window(24h),
        // if you use proxy, double check if the req.ip is return client's ip.
        ip: 3
    }
}