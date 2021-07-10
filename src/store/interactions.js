import Web3 from 'web3'
import Token from '../abis/Token.json'
import Exchange from '../abis/Exchange.json'



import {
	web3Loaded,
	web3AccountLoaded,
	tokenLoaded,
	exchangeLoaded,
	cancelledOrdersLoaded,
	filledOrdersLoaded,
	allOrdersLoaded
} from './actions'



export const loadWeb3 = (dispatch) => {
	const web3 = new Web3(window.ethereum)
    window.ethereum.enable().catch(error => {
        // User denied account access
        console.log(error)
    })
	dispatch(web3Loaded(web3))
	return web3

}

export const loadAccount = async (web3, dispatch) => {
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]
	dispatch(web3AccountLoaded(account))
	return account

}

export const loadToken = async (web3, networkId, dispatch) => {
	try {
		const networkId = await web3.eth.net.getId()
		const tokenData = Token.networks[networkId]
		const token = new web3.eth.Contract(Token.abi, tokenData.address)
		dispatch(tokenLoaded(token))
		return token

	} catch (error) {
		console.log('Contract not deployed to the current network. Please select another network with Metamask.')
		return null
	}
}

export const loadExchange = async (web3, networkId, dispatch) => {
	try {
		const networkId = await web3.eth.net.getId()
		const exchangeData = Exchange.networks[networkId]
		const exchange = new web3.eth.Contract(Exchange.abi, exchangeData.address)
		dispatch(exchangeLoaded(exchange))
		return exchange

	} catch (error) {
		console.log('Contract not deployed to the current network. Please select another network with Metamask.')
		return null
	}
}

export const loadAllOrders = async (exchange, dispatch) => {
	// fectch cancelled orders with the 'Cancel' event stream
	const cancelStream = await exchange.getPastEvents('Cancel', { fromBlock: 0, toBlock: 'latest'})
	// filtering out the cancelled orders from past events
	const cancelledOrders = cancelStream.map((event) => event.returnValues)
	// add the cancelled orders to the redux store
	dispatch(cancelledOrdersLoaded(cancelledOrders))

	// fectch filled orders with the 'Trade' event stream
	const tradeStream = await exchange.getPastEvents('Trade', { fromBlock: 0, toBlock: 'latest'})
		// filtering out the cancelled orders from past events
	const filledOrders = tradeStream.map((event) => event.returnValues)
	// add the filled orders to the redux store
	dispatch(filledOrdersLoaded(filledOrders))

	// fectch all orders with the 'Order' event stream
	const allOrdersStream = await exchange.getPastEvents('Order', { fromBlock: 0, toBlock: 'latest'})
		// filtering out the cancelled orders from past events
	const allOrders = allOrdersStream.map((event) => event.returnValues)
	// add the filled orders to the redux store
	dispatch(allOrdersLoaded(allOrders))



}