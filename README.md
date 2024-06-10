# faucet

Fork of [ping.pub faucet](https://github.com/ping-pub/faucet/) to dispense Nym sandbox tokens

## Prerequisite

```sh
node -v
v22.2.0
```

# Installation

 - Clone the repo:

 ```sh
 git clone https://github.com/nymtech/faucet.git
 ```

 - Setup the configuration in `./config.js`

 - Move `.env.example` as `.env` and populate the mnemonic for the account from which funds will be dispensed

 - Install dependenices with `npm install`

 - Run faucet

 ```sh
 node --es-module-specifier-resolution=node faucet.js
 ```

 # Test

 visit http://localhost:80

 80 is default, you can edit it in the config.json

 # Donations to ping.pub

Your donation will help us make developers of ping.pub make better products. Thanks in advance.

 - Address for ERC20: USDC, USDT, ETH
```
0x88BFec573Dd3E4b7d2E6BfD4D0D6B11F843F8aa1
```

 - You can donate any token in the Cosmos ecosystem: [here](https://ping.pub/coffee)
