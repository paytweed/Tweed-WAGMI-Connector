import { useAccount, useBalance, useChainId, useConnect, useDisconnect, useSendTransaction, useSwitchChain } from 'wagmi';


function App() {
  const account = useAccount()
  const { connectors, connect, status: connectStatus, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { chains, switchChain } = useSwitchChain()
  const { sendTransaction } =useSendTransaction();
  const chainId = useChainId()


  const address = account.address
  const result = useBalance({
    address
  })

  async function handleSendTransaction() {
    sendTransaction({
      to: address!,
      value: BigInt(0),
      chainId: chainId,
    });
  }


  const balance = result.data?.value
  const decimals = result.data?.decimals
  const balanceAsString = balance && decimals ? Number(balance) / 10 ** decimals : ''  


  return (
    <>
      <div>
        <h1>TWEED X WAGMI</h1>
        <h2>Account</h2>
        <div>
          status: {account.status}
          <br />
          addresses: {account.addresses}
          <br />
          chainId: {account.chainId}
          <br />
          balance: {balanceAsString}
        </div>
        {account.status === 'connected' && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}

{account.status === 'connected' &&
  <>
        <h2>Switch Network</h2>

      <div>
        {chains.map((chain) => (
          <button key={chain.id} onClick={() => switchChain({ chainId: chain.id })}>
            {chain.name}
          </button>
        ))}
      </div>

      <div>
      <h2>Send Transaction</h2>

      <button onClick={handleSendTransaction}>send transaction</button>
      </div>
      </>
        }



<h3>Status</h3>
        <div>{connectStatus}</div>
        <div>{connectError?.message}</div>
      </div>
    </>
  )
}

export default App
