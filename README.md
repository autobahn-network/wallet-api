# Wallet API (for the Autobahn Network Canary)

This code base contains a node API which fetches transfers from the configured network and provides token balances of addresses via REST. It fetches block by block so it's best used for rollups.

## Deployed API

The API has been deployed at https://autobahn-wallet-api.herokuapp.com and is ready to use.

### Fetch balances

To fetch balances of a certain address, the following endpoint may be used:

```
https://autobahn-wallet-api.herokuapp.com/balances/<address>
```

The param `<address>` must be a valid Autobahn Network address (usual Ethereum format). If an invalid address is passed, the API will return an HTTP 400 status code.

#### ERC-20 example

If an address has a balance of an ERC-20 token, an example response would be:

```json
{
  "address": "0x5bCc4FC255CaE72F23bbD314F3721f982bfE0d74",
  "balances": [
    {
      "holder": "0x5bCc4FC255CaE72F23bbD314F3721f982bfE0d74",
      "contract": "0x7ADfE7fA58A0df1BFf6817A8cDa03C8668771794",
      "name": "TestToken",
      "symbol": "TEST",
      "decimals": 18,
      "value": "1000000000000000000000000000",
      "type": "erc20"
    }
  ]
}
```

#### ERC-721 example

If an address has a balance of an ERC-721 token, example response would be:

```json

```
