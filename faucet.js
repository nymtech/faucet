import express from 'express';
import * as path from 'path'

import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { StargateClient, SigningStargateClient, GasPrice } from "@cosmjs/stargate";
import { FrequencyChecker } from './checker.js';

import conf from './config.js'

const app = express()

const checker = new FrequencyChecker(conf)

app.get('/', (req, res) => {
  res.sendFile(path.resolve('./index.html'));
})

app.get('/faucet/config', async (req, res) => {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(conf.sender.mnemonic, conf.sender.option);
  const [firstAccount] = await wallet.getAccounts();
  const project = conf.project;
  project.sample = firstAccount.address;
  project.denom = conf.tx.amount.denom;

  // Parse the denom and make amount readable if there's a prefix
  if (project.denom.startsWith('u')) {
    project.amount = conf.tx.amount.amount / Math.pow(10, 6);
    project.denom = project.denom.substring(1).toUpperCase();
  } else if (project.denom.startsWith('n')) {
    project.amount = conf.tx.amount.amount / Math.pow(10, 9);
    project.denom = project.denom.substring(1).toUpperCase();
  } else if (project.denom.startsWith('a')) {
    project.amount = conf.tx.amount.amount / Math.pow(10, 18);
    project.denom = project.denom.substring(1).toUpperCase();
  } else {
    project.denom = conf.tx.amount.amount
  }

  res.send(project);
})

app.get('/faucet/health', async (req, res) => {
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(conf.sender.mnemonic, conf.sender.option);
    const [firstAccount] = await wallet.getAccounts();
    const includeBalance = req.query.showbalance ? true : false;
    const client = await StargateClient.connect(conf.blockchain.rpc_endpoint);
    const balances = await client.getAllBalances(firstAccount.address);
    const faucetDispenseCoin = conf.tx.amount;

    // Find the balance for the required denomination
    const balance = balances.find(b => b.denom === faucetDispenseCoin.denom);

    const response = { status: 'insufficient_funds' };

    // Check if the balance is sufficient and update the response
    if (balance && (BigInt(balance.amount) >= BigInt(faucetDispenseCoin.amount))) {
      response.status = 'ok';
      if (includeBalance) {
        response.balance = balance;
      }
    }

    res.send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'error', message: error.message });
  }
});



app.get('/send/:address', async (req, res) => {
  const { address } = req.params;
  console.log('request tokens to ', address, req.ip);
  if (address) {
    try {
      // if valid address
      if (address.startsWith(conf.sender.option.prefix)) {
        // if not rate-limited
        if (await checker.checkAddress(address) && await checker.checkIp(req.ip)) {
          // if the wallet does not have tokens already
          if (checkWalletHasExistingTokens(address)) {
            res.status(429).send({ result: "Too many requests. Wallet is already funded" })
            return;
          }

          const txhash = await sendTx(address);

          if (txhash) {
            // Update the rate-limit for the IP and address
            checker.update(req.ip);
            checker.update(address);
            res.send({ result: txhash });
          } else {
            res.status(500).send({ result: "Transaction hash not found" });
          }

        } else {
          res.status(429).send({ result: "Too many requests. Try again later" });
        }
      } else {
        res.send({ result: `Address ${address} is not supported` });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({ result: 'Fatal error. Contact team!' });
    }

  } else {
    // send result
    res.send({ result: 'Address is required' });
  }
})

app.listen(conf.port, () => {
  console.log(`Faucet app listening on port ${conf.port}`);
  // To be set if reverse proxy enabled
  app.set('trust proxy', true)
})


async function checkWalletHasExistingTokens(recipient) {

  const client = await StargateClient.connect(conf.blockchain.rpc_endpoint);
  const balances = await client.getAllBalances(recipient);

  // Find the balance being dispensed in requester's bank
  const walletBalance = balances.find(b => b.denom === conf.tx.amount.denom);

  if (walletBalance && (BigInt(walletBalance.amount) >= BigInt(conf.tx.amount.amount))) {
    return true
  }

  return false

}

async function sendTx(recipient) {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(conf.sender.mnemonic, conf.sender.option);
  const [firstAccount] = await wallet.getAccounts();

  const rpcEndpoint = conf.blockchain.rpc_endpoint;
  const gasPrice = GasPrice.fromString(conf.tx.gasPrices);
  const amount = conf.tx.amount;

  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, { gasPrice: gasPrice });

  // 1.5 is the gas multiplier. gas is estimated automatically when this is set. ref : https://github.com/cosmos/cosmjs/blob/b4aa877843c1206104b0207f3053a7d59b2d734f/packages/cli/examples/simulate.ts
  const result = await client.sendTokens(firstAccount.address, recipient, [amount], 1.5, "dispensing tokens from faucet");
  return result && result.transactionHash ? result.transactionHash.toString() : null;
}

