
logo


0xae…1D0c
durin
Issue onchain ENS subdomains on an L2
Durin is an opinionated approach to issuing ENS L2 subdomains. Durin is open source and PRs are welcomed. For support reach out to Slobo on Telegram.
What you'll need
ENS name (Sepolia or Mainnet)
Etherscan API key for verification
Familiarity with solidity
RPC URL for the chosen chain
Objective: Launch an onchain ENS subdomain project on an L2 with mintable subdomain NFTs
1. Deploy the L2 Registry
Key Contract:
L2 Registry
The L2 registry tracks ownership of ENS subdomains. These names are represented as ERC-721 NFTs. Durin's implementation of the registry stores text records, cointypes, and contenthash that can be associated with a subdomain.
Choose an ENS Name
Sepolia
Mainnet
Search your ENS names
chevron
Choose a Chain
Testnet
Mainnet
This is where L2 registry contract will be deployed.

Base
Base Sepolia
chevron
Deploy L2 Registry on Base Sepolia
This will use your connected wallet to deploy the L2 Registry.
Deploy
Registry Address:
Waiting for Deploy...
2. Configure L1 Resolver
Key Contract:
L1 Resolver
The L1 Resolver functions as an entry point to provide information about a name. Users can query name resolution (bob.example.eth → 0x542) and associated text records.

The provided resolver is made to work with Durin's contracts. As the owner of the ENS name, you are able to revert any of these changes.
Change Resolver for frenguin.eth on Mainnet
Updating the resolver connects your ENS name to the deployed L2 registry.
Resolver up to date ✓
Resolver Address:
0x8A96...3D61
etherscan
Set L2 Registry
This button adds your L2 registry to the L1 resolver.
Set Registry
3. Customize Registrar
Key Contract:
L2 Registrar
The registrar controls how names are minted. Users can only register a subdomain through the registrar by calling register(). The registrar is where minting logic—such as pricing models, renewal mechanisms, and expiration dates—should be implemented. We provide an example on GitHub.
Customize and Deploy L2 Registrar
Select a template L2 registrar and modify it as needed. You will need your registry address.
githubCustomize
Registry Address:
Waiting for Deploy...
4. Connect Registrar to Registry
L2 Registrar <> L2 Registry
This step grants permission to your registrar contract to mint subdomains through your registry. Calling addRegistrar() on the registry connects the two contracts together.
Connect L2 Registrar to L2 Registry
As the final step, call addRegistrar() on your registry with the address of your deployed registrar.
5. Mint your first subdomain
Mint
Congrats on the launch! Create a subdomain via Etherscan.
Mint a subdomain via Etherscan
Search for your registrar address on the appropriate L2 Etherscan.

Under Contract select register() and write.etherscan
Transaction History
?
No transactions yet
Built By NameStone |
Logo
