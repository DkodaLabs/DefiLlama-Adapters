const ADDRESSES = require('../helper/coreAssets.json')
const { sumTokens2 } = require('../helper/unwrapLPs')

const config = {
  base: { address: '0xf93659fb357899e092813bc3a2959ceDb3282a7f', blacklistedTokens: [ADDRESSES.bsc.USDT, "0x96af5739ca66ca55ab71ac9f308720d5044995ee","0xca4f1536cd29d42bcbc8211f1b621ba9e817433f", "0x4da07a07f40f877a587acfcdbb0c84c73fdf2e92"]},
  bsc: { address: '0xA1fe1C37Bf899C7F7521082C002dFA4fEbAaA8dd', blacklistedTokens: [ADDRESSES.optimism.WETH_1] },
  ethereum: { address: '0x7c530c9ED5E734964453Ce62Ae9C4e31a247738B'}
}

const abi = {
  getTokens: 'address[]:getTokens',
  vault: 'address:vault'
}

async function tvl(api, address, blacklistedTokens) {
  const indexes = await api.fetchList({ lengthAbi: 'uint256:portfolioId', itemAbi: 'function getPortfolioList(uint256) view returns (address)', target: address })
  const [tokens, vaults] = await Promise.all([
    api.multiCall({ abi: abi.getTokens, calls: indexes }),
    api.multiCall({ abi: abi.vault, calls: indexes }),
  ])

  const ownerTokens = indexes.map((_, i) => {
    const assets = tokens[i]
    const vault = vaults[i]
    if (!assets || !assets.length || !vault) return null
    return [assets, vault]
  }).filter(Boolean)

  return sumTokens2({ api, ownerTokens, resolveLP: true, blacklistedTokens, permitFailure: true });
}

module.exports = { methodology: 'calculates overall value deposited across different protocol portfolios' }

Object.keys(config).forEach(chain => {
  const { address, blacklistedTokens } = config[chain]
  module.exports[chain] = { tvl: (api) => tvl(api, address, blacklistedTokens) }
})
