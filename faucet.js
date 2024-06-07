import express from 'express';
import * as path from 'path'

import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient, GasPrice } from "@cosmjs/stargate";
import { FrequencyChecker } from './checker.js';

import conf from './config.js'

// load config
console.log("loaded config: ", conf)

const app = express()

const checker = new FrequencyChecker(conf)

app.get('/', (req, res) => {
  res.sendFile(path.resolve('./index.html'));
})

app.get('/config.json', async (req, res) => {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(conf.sender.mnemonic, conf.sender.option);
  const [firstAccount] = await wallet.getAccounts();
  const project = conf.project
  project.sample = firstAccount.address
  res.send(project);
})

app.get('/send/:address', async (req, res) => {
  const {address} = req.params;
  console.log('request tokens to ', address, req.ip)
  if (address) {
    try {
      if (address.startsWith(conf.sender.option.prefix)) {
        if( await checker.checkAddress(address) && await checker.checkIp(req.ip) ) {
          checker.update(req.ip) // get ::1 on localhost
          sendTx(address).then(ret => {
            console.log('sent tokens to ', address);
            checker.update(address);
            console.log(ret);
            // Convert BigInt values to strings before sending response
            const result = JSON.parse(JSON.stringify(ret, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value
            ));
            res.send({ result });
          });
        }else {
          res.send({ result: "You requested too often" })
        }
      } else {
        res.send({ result: `Address [${address}] is not supported.` })
      }
    } catch (err) {
      console.error(err);
      res.send({ result: 'Failed, Please contact to admin.' })
    }

  } else {
    // send result
    res.send({ result: 'address is required' });
  }
})

app.listen(conf.port, () => {
  console.log(`Faucet app listening on port ${conf.port}`)
})


async function sendTx(recipient) {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(conf.sender.mnemonic, conf.sender.option);
  const [firstAccount] = await wallet.getAccounts();

  const rpcEndpoint = conf.blockchain.rpc_endpoint;
  const gasPrice = GasPrice.fromString(conf.tx.gasPrices)
  const amount = conf.tx.amount;

  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, {gasPrice: gasPrice} );

  // 1.5 is the gas multiplier as gas is estimated automatically. ref : https://github.com/cosmos/cosmjs/blob/b4aa877843c1206104b0207f3053a7d59b2d734f/packages/cli/examples/simulate.ts
  const result = await client.sendTokens(firstAccount.address, recipient, [amount], 1.5, "dispensing 101 NYM from faucet");
  
  // Convert BigInt values to strings before returning result
  return JSON.parse(JSON.stringify(result, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

