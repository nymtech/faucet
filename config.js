
import { stringToPath } from '@cosmjs/crypto'
import 'dotenv/config'

export default {
    port: 8000, // http port
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
        rpc_endpoint: "https://rpc.sandbox.nymtech.net",
    },
    sender: {
        mnemonic: process.env.mnemonic,
        option: {
            hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
            prefix: "n"
        }
    },
    tx: {
        amount: {
            denom: "unym",
            amount: "101000000"
        },
        gasPrices: "0.025unym"
    },
    limit: {
        // how many times each wallet address is allowed in a window(24h)
        address: 1,
        // how many times each ip is allowed in a window(24h),
        // This will let a valid user claim twice (once from each wallet) for running a gateway & mixnode
        ip: 2
    }
}