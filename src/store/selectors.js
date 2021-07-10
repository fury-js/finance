import { get, groupBy, reject } from 'lodash'
import { createSelector } from 'reselect'
import {ETHER_ADDRESS, tokens, ether, GREEN, RED} from '../helpers'
import moment from 'moment'


const account = state => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl)


const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el)


const exchange = state => get(state, 'exchange.contract')
export const exchangeSelector = createSelector(exchange, e => e)


export const contractsLoadedSelector = createSelector(
	tokenLoaded,
	exchangeLoaded,
	(tl, el) => (tl && el)
)

//  All Orders
const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
const allOrders = state => get(state, 'exchange.allOrders.data', [])


// Cancelled Orders
const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false)
export const cancelledOrdersLoadedSelector = createSelector(cancelledOrdersLoaded, loaded => loaded)

const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
export const cancelledOrdersSelector = createSelector(cancelledOrders, o => o)


//  filled Orders
const filledOrdersLoaded = state => get(state, 'exchange.filledOrders.loaded', false)
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

const filledOrders = state => get(state, 'exchange.filledOrders.data', [])
export const filledOrdersSelector = createSelector(
	filledOrders,
	 (orders) => {
	 		//  Sort by date asceding for price comparison
	 	orders = orders.sort((a,b) => b.timestamp - a.timestamp)

	 	// Decorate the orders
	 	orders = decorateFilledOrders(orders)

	 	//  Sort by date desceding for price comparison
	 	orders = orders.sort((a,b) => b.timestamp - a.timestamp)
	 	return orders
	}
)


const decorateFilledOrders = (orders) => {
	// track previous order
	let previousOrder = orders[0]

	return (
		orders.map((order) => {
			order = decorateOrder(order)
			order = decorateFilledOrder(order, previousOrder)
			previousOrder = order // Update previous order once its decorated
			return order

		})
	)
} 


const decorateOrder = (order) => {
	let etherAmount
	let tokenAmount


	if(order.tokenGive === ETHER_ADDRESS ) {
		etherAmount = order.amountGive
		tokenAmount = order.amountGet
	} else {
		etherAmount = order.amountGet
		tokenAmount = order.amountGive
	}

	const precision = 100000
	let tokenPrice = (etherAmount / tokenAmount)
	tokenPrice = Math.round(tokenPrice * precision) / precision

	return({
		...order,
		etherAmount: ether(etherAmount),
		tokenAmount: tokens(tokenAmount),
		tokenPrice,
		formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a M/D')
	})

}





const decorateFilledOrder = (order, previousOrder) => {
	return({
		...order,
		tokenPriceclass: tokenPriceclass(order.tokenPrice, order.id, previousOrder)
	})
}




const tokenPriceclass = (tokenPrice, orderId, previousOrder) => {
// show green price if only one order exists
	if(previousOrder.id === orderId) {
		return GREEN
	}

// show green if order price higher than previous order
// show red if order price lower than previous order 
	if(previousOrder.tokenPrice <= tokenPrice) {
		return GREEN
	} else {
		return RED
	}

}


const openOrders = state => {
	const all = allOrders(state)
	const filled = filledOrders(state)
	const cancelled = cancelledOrders(state)
	

	const openOrders = reject(all, (order) => {
		const orderFilled = filled.some((o) => o.id === order.id)
		const orderCancelled = cancelled.some((o) => o.id === order.id)
		return (orderFilled || orderCancelled)
	})

	return openOrders
}

const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)
export const orderBookLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)


// Create the order book

export const orderBookSelector = createSelector(
	openOrders, (orders) => {

		// Decorate orders
		orders = decorateOrderBookOrders(orders)

		// Group orders by orderType
		orders = groupBy(orders, 'orderType')

		// fetch buy orders
		const buyOrders = get(orders, 'buy', [])

		// Sort buy orders by token price
		orders ={
			...orders,
			buyOrders: buyOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
		}

		// fetch sell orders
		const sellOrders = get(orders, 'sell', [])

		// Sort buy orders by token price
		orders ={
			...orders,
			sellOrders: sellOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
		}
		console.log(orders)
		return orders
	}
)

const decorateOrderBookOrders = (orders) => {
	return(
		orders.map((order) => {
			order = decorateOrder(order)

			// Decorate order book order
			order = decorateOrderBookOrder(order)
			return (order)
		})
	)
}

const decorateOrderBookOrder = (order) => {
	const orderType = order.tokenGive === ETHER_ADDRESS ? 'buy' : 'sell'

	return({
		...order,
		orderType,
		orderTypeClass: (orderType === 'buy' ? GREEN : RED),
		orderFillClass: orderType === 'buy' ? 'sell' : 'buy'
	})
}
