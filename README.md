# Wagmi X Tweed Example Project

Welcome to the Wagmi X Tweed example project! This repository showcases a simple implementation of using the Tweed SDK as a connector for Wagmi.

## Supported Wagmi SDK Hooks

useAccount, useBalance, useChainId, useClient, useConnect, useConfig, useDisconnect, useSendTransaction, useSwitchChain, useWriteContract

Please note that hooks not listed here might still work seamlessly with this connector, but have not been tested yet.

## Project setup

To get started, follow these straightforward steps:

### 1. Update Application ID
go to src/tweedConnector.ts and replace the placeholder "YOUR-APP-ID" with your own Tweed application ID.


```javascript
// src/tweedConnector.ts

export const getTweedConnector = async () => {
  const client = await TweedClient.create(
    "YOUR-APP-ID",
    // ... other configuration
  );
  // ... rest of the code
};
```
### 2. Install Dependencies

Run the following command in your terminal to install project dependencies using Yarn or npm.


Using npm:
```bash
npm install
```

Using Yarn:
```bash
yarn install

```
### 3. Start Development Server
Launch the development server with the following command:


```bash
npm run dev
```
or
```bash
yarn dev

```

## Using Tweed Connector in Your Project


### 1. Install Tweed Core-JS SDK


```bash
npm i @paytweed/core-js
```
or
```bash
yarn add @paytweed/core-js

```
### 2. Add tweedConnector.ts to Your App Directory


```bash
src/tweedConnector.ts
```

### 3. Update Application ID
Go to tweedConnector.ts that you just added and replace the placeholder "YOUR-APP-ID" with your own Tweed application ID.

```javascript
// // tweedConnector.ts

export const getTweedConnector = async () => {
  const client = await TweedClient.create(
    "YOUR-APP-ID",
    // ... other configuration
  );
  // ... rest of the code
};

```
### 4. Add Tweed Connector to Wagmi Config File

```javascript
import { createConfig } from 'wagmi';
import { Network } from "@paytweed/core-js";
import { mainnet, sepolia } from "wagmi/chains";
import { TweedConnector } from "./tweedConnector";

const appId = "YOUR-APP-ID";
const chains = [Network.ETHEREUM, Network.ETHEREUM_SEPOLIA];

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [new TweedConnector(appId, chains).createConnector()],

  // ... other configuration
});
  ```
  
Now you are ready to use Wagmi with Tweed! 🚀

