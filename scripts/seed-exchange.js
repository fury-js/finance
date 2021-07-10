

const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

require('chai')
.use(require('chai-as-promised'))
.should()


//Utils or helpers
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
const ether = (n) => {
	return new web3.utils.BN(web3.utils.toWei(n.toString(), 'ether'))
}
const tokens = (n) => ether(n)
const wait = (seconds) => {
	const milliseconds = seconds * 1000
	return new Promise(resolve => setTimeout(resolve, milliseconds))
} 


module.exports = async function(callback) {
	// let result
	// let log
	// 	// let order
	// 	let id
	try{
		//fetch accounts from wallet- these are unlocked
		const accounts = await web3.eth.getAccounts()
		console.log('accounts', accounts)
		//fetch the deployed token
		const token = await Token.deployed()
		console.log('Token fetched', token.address)
		//fetch deployed Exchange
		const exchange = await Exchange.deployed()
		console.log('Exchange fetched', exchange.address)
		

		//Give tokens to accounts
		const sender = accounts[0]
		const receiver = accounts[1]
		let amount 
		amount = web3.utils.toWei('1000', 'ether')// 10000 tokens

		await token.transfer(receiver, amount, {from: sender})
		console.log(`Transferred ${amount} tokens from ${sender} to ${receiver}`)

		// Exchange users
		const user1 = accounts[0]
		const user2 = accounts[1]
		const user3 = accounts[2]
		const user4 = accounts[3]


		//user1 deposits ether

		amount = 2
		await exchange.depositEther({from: user1, value:ether(amount)})
		console.log(`Deposited ${amount} Ether from ${user1}`)

		//user2 approves tokens
		amount =100
		await token.approve(exchange.address, tokens(100), {from: user2})
		console.log(`Approved ${amount} tokens from ${user2}`)

		// user2 deposits tokens
		await exchange.depositToken(token.address, tokens(100), { from: user2})
		console.log(`Deposited ${amount} tokens from ${user2}`)


		// //User1 makes order to get tokens
		let result
		let orderId


		 result = await exchange.makeOrder(token.address, tokens(50), ETHER_ADDRESS, ether(0.1), {from: user1})
		console.log(`Made order from ${user1}`)

		//wait one second
		await wait(1)

		// //User1 Cancels order
		
		orderId = result.logs[0].args.id
		console.log(orderId.toString())
		await exchange.cancelOrder(orderId, {from: user1})
		console.log(`Cancelled Order from ${user1}`)

		



		// //User1 makes an order
		result = await exchange.makeOrder(token.address, tokens(20), ETHER_ADDRESS, ether(0.1), {from: user1})
		console.log(`Made order from ${user1}`)



		// //User2 fills the order
		orderId = result.logs[0].args.id 

		await exchange.fillOrder(orderId, {from: user2})
		console.log(`filled from ${user1} `)

		//wait one second
		await wait(1)

		//User1 makes another order
		result = await exchange.makeOrder(token.address, tokens(50), ETHER_ADDRESS, ether(0.01), {from: user1})
		console.log(`Made order from ${user1}`)

		//wait one second
		await wait(1)

		// //User2 fills the order
		orderId = result.logs[0].args.id 
		console.log(orderId.toString())

		 await exchange.fillOrder(orderId, {from: user2})
		console.log(`filled from ${user1} `)

		

		// //wait one second
		// await wait(1)

		// // //User2 fills the order
		// // order = result3.logs[0]
		// // id = order.args.id 
		// // await exchange.fillOrder(id, {from: user2})
		// // console.log('order filled by ${user2} ')

		// // //wait one second
		// // await wait(1)

		// // //User1 makes Third and final order
		// result = await exchange.makeOrder(token.address, tokens(200), ETHER_ADDRESS, ether(0.15), {from: user1})
		// console.log(`Made order from ${user1}`)

		// // //User2 fills the order
		// order = result.logs[0]
		// orderId = order.args.id
		// await exchange.fillOrder(orderId.toString(), {from: user2})
		// console.log('order filled by ${user2}')

		//wait one second
		await wait(1)

		// //////////////////
		// // Seed open orders

		// // User1 Makes 10 orders

		for(let i = 1; i <= 10; i++){
			result = await exchange.makeOrder(token.address, tokens(10*1),ETHER_ADDRESS, ether(0.05), {from: user1})
			console.log(`Made order from ${user1}`)

			//wait 1 second
			await wait(1)
		}
		

		// User2 Makes 10 orders

		for(let i = 1; i <= 10; i++){
			result = await exchange.makeOrder(ETHER_ADDRESS , tokens(10*1), token.address, ether(0.05), {from: user2})
			console.log(`Made order from ${user2}`)

			//wait 1 second
			await wait(1)
		}

		











	}
	catch(error){
		console.log(error)
	}



	callback()
}