import { ether, tokens, EVM_REVERT, ETHER_ADDRESS } from './helpers'


const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')

require('chai')
.use(require('chai-as-promised'))
.should()

contract('Exchange', ([deployer, receiver, feeAccount, user1, user2]) => {
	let token
	let exchange
	const feePercent = 10

	beforeEach(async () => {
		token = await Token.new()
		await token.transfer(user1, ether(100), {from: deployer})
		exchange = await Exchange.new(feeAccount, feePercent)
	})

	describe('deployment', () =>{
		let feeAccount
		let feePercent
		it('tracks the feeAccount', async () => {
			feeAccount = await exchange.feeAccount()
			feeAccount.toString().should.eq(feeAccount)
		})
		it('tracks the feePercent', async () => {
			feePercent = await exchange.feePercent()
			feePercent.toString().should.eq(feePercent.toString())
		})
	})
	

	describe('fallback', () =>{
		it('reverts when ether is sent by mistake', async () => {
			await exchange.sendTransaction({value: ether(1), from: user1}).should.be.rejectedWith(EVM_REVERT)
		})
	})
		
	describe('it deposits Ether', () => {
		let amount
		let depositResult
		beforeEach(async () => {
			amount = ether(1)
			depositResult = await exchange.depositEther({from: user1, value: amount})
		})
		it('tracks ether deposits', async () => {
			let balance
			balance = await exchange.tokens(ETHER_ADDRESS, user1)
			balance.toString().should.eq(amount.toString())
		})
		it('emits a deposit event', async () => {
			const log = depositResult.logs[0]
			log.event.should.eq('Deposit')
			const event = log.args
			event.token.should.eq(ETHER_ADDRESS, 'token address is correct')
			event.user.should.eq(user1, 'user is correct')
			event.amount.toString().should.eq(amount.toString(), 'amount is correct')
			event.balance.toString().should.eq(amount.toString(), 'balance is correct')
		})	
	})	
	describe('withdraws ether', () => {
		let amount
		let depositResult
		beforeEach(async () =>{
			amount = ether(1)
			depositResult = await exchange.depositEther({from: user1, value: amount})
		})

		describe ('success', () => {
			let result

			beforeEach(async () =>{
				result = await exchange.withdrawEther(amount, {from: user1})

			})

			it('withdraws ether funds', async () =>{
				const balance = await exchange.tokens(ETHER_ADDRESS, user1)
				balance.toString().should.eq('0')
			})
			it('emits a withraw event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Withdraw')
				const event = log.args
				event.token.should.eq(ETHER_ADDRESS, 'token address is correct')
				event.user.should.eq(user1, 'user is correct')
				event.amount.toString().should.eq(amount.toString(), 'amount is correct')
				event.balance.toString().should.eq('0', 'balance is correct')
			})		
		})
		describe('failure', () =>{
			it('rejects withdraws from insufficient balances', async () =>{
				await exchange.withdrawEther(ether(100), {from: user1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})
	describe('depositing token', ()  => {
		let amount
		let depositResult

		describe('success', () => {
			let amount
			let depositResult
			beforeEach(async () => {
				amount = tokens(10)
				await token.approve(exchange.address, amount, {from: user1})
				depositResult = await exchange.depositToken(token.address, amount, {from: user1})
			})
			it('tracks token deposits', async() => {
				let balance
				balance = await token.balanceOf(exchange.address)
				balance = balance.sub(amount)
				balance.toString().should.equal(amount.toString())
				balance = await exchange.tokens(token.address, user1)
				// balance = balance.add(amount)
				balance.toString().should.eq(amount.toString())
			})
			it('emits a deposit event', async () => {
				const log = depositResult.logs[0]
				log.event.should.eq('Deposit')
				const event = log.args
				event.token.should.eq(token.address, 'token address is correct')
				event.user.should.eq(user1, 'user is correct')
				event.amount.toString().should.eq(amount.toString(), 'amount is correct')
				event.balance.toString().should.eq(amount.toString(), 'balance is correct')
			})
		})
		describe('failure', () => {
			let amount
			amount = ether(1)
			it('rejects token deposits without approval', async () => {
				await exchange.depositToken(token.address, amount, {from: user1}).should.be.rejectedWith(EVM_REVERT)
			})
			it('rejects ether deposits', async () => {
				await exchange.depositToken(ETHER_ADDRESS, amount, {from: user1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})
	describe('withrawing token', () => {
		let amount
		let result
		describe('success', () =>{
			beforeEach(async () => {
				amount = ether(10)
				//approve tokens before deposit
				await token.approve(exchange.address, amount, {from: user1})
				//deposit the tokens approved
				await exchange.depositToken(token.address, amount, {from: user1})
				//withdraw tokens deposited
				result = await exchange.withdrawToken(token.address, amount, {from: user1})
			})
			it('withdraws token funds',  async () =>{
				//balance of the user account that has the funds
				const balance = await exchange.tokens(token.address, user1)
				balance.toString().should.eq('0')
			})
			it('emits a withraw event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Withdraw')
				const event = log.args
				event.token.should.eq(token.address, 'token address is correct')
				event.user.should.eq(user1, 'user is correct')
				event.amount.toString().should.eq(amount.toString(), 'amount is correct')
				event.balance.toString().should.eq('0', 'balance is correct')
			})	
		})
		describe('failure', () => {
			let amount
			amount = ether(1)
			it('rejects token withdrawal without approval', async () => {
				await exchange.withdrawToken(token.address, amount, {from: user1}).should.be.rejectedWith(EVM_REVERT)
			})
			it('rejects ether withdrawal', async () => {
				await exchange.withdrawToken(ETHER_ADDRESS, amount, {from: user1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
		
	})	
	describe('checking balances', () =>{
		let amount
		let balance
		beforeEach(async () => {
			amount = ether(1)
			await exchange.depositEther({form: user1, value: amount})

		})
		it('returns user balance', async () => {
			balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
			balance = balance.add(amount)
			balance.toString().should.equal(ether(1).toString())
		})
	})
	describe('making orders', () => {
		let result
		beforeEach(async () => {
			result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from: user1})
		})

		it('tracks newly created order', async () =>{
			const orderCount = await exchange.orderCount()
			orderCount.toString().should.eq('1')
			const order = await exchange.orders(orderCount)
			order.id.toString().should.equal('1', 'id is correct')
			order.user.should.equal(user1, "user is correct")
			order.tokenGet.should.eq(token.address, 'token address is correct')
			order.amountGet.toString().should.eq(tokens(1).toString(), 'amount is correct')
			order.tokenGive.should.eq(ETHER_ADDRESS, 'ether address is correct')
			order.amountGive.toString().should.equal(ether(1).toString(), 'amount to give is correct')
			order.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct')

		})
		it('emits an Order event', () =>{
			const log = result.logs[0]
			console.log(log)
			log.event.should.equal('Order')
			const event = log.args
			console.log(event)
			event.id.toString().should.equal('1', 'id is correct')
			event.user.should.equal(user1, 'user is correct')
			event.tokenGet.should.equal(token.address, 'user is correct')
			event.amountGet.toString().should.equal(tokens(1).toString(), 'user is correct')
			event.tokenGive.should.equal(ETHER_ADDRESS, 'token to give is correct')
			event.amountGive.toString().should.equal(ether(1).toString(), 'token to give is correct')
			event.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct')
		})
	})
	describe('order actions', () => {
		let amount
		beforeEach(async () =>{
			amount = tokens(100)
				// transfer tokens to user 2 from deployer
			await token.transfer(user2, amount, {from: deployer})
				//user 1 deposits ether for the trade
			await exchange.depositEther({from:user1, value:ether(1)})
				//user 2 deposits token to exchange(tokens have to be approved before deposited to exchange)
			await token.approve(exchange.address, tokens(2), {from: user2})
			await exchange.depositToken(token.address, tokens(2), {from: user2})
				// user 1 makes the order
			await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from: user1})
		})
		describe('filling orders',() => {
			let result
			describe('success', () => {
				
				beforeEach(async () => {
					//user 2 fills the order
					result = await exchange.fillOrder('1', {from: user2})
				})

				it('executes trades and charge fees', async () => {

				let balance
				
				balance = await exchange.balanceOf(token.address, user1)
				balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens' )
				balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
				balance.toString().should.equal(ether(1).toString(), 'user2 received ether')
				balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
				balance.toString().should.eq('0'.toString(), 'ether deducted from user1')
				balance = await exchange.balanceOf(token.address, user2)
				balance.toString().should.equal(tokens(0.9).toString(), 'user2 tokens deducted with fees paid')
				const feeAccount = await exchange.feeAccount()
				balance = await exchange.balanceOf(token.address, feeAccount)
				balance.toString().should.equal(tokens(0.1).toString(), 'feeAccount account received fee')
				})
				it('updates filled order', async () =>{
					const orderFilled = await exchange.orderFilled('1')
					orderFilled.should.eq(true)
				})
				it('emits a trade event', () => {
					const log = result.logs[0]
					log.event.should.equal('Trade')
					const event = log.args
					event.id.toString().should.eq('1', 'id is correct')
					event.user.should.eq(user1, 'user is correct')
					event.tokenGet.should.equal(token.address, 'tokenGet is correct')
					event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
					event.tokenGive.should.eq(ETHER_ADDRESS, 'tokenGive is correct')
					event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
					event.userfill.should.equal(user2, 'userFill is correct')
					event.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct')
				})
			})	
		
			describe('failure', () => {
				it('rejects invalid order id', async () => {
					const invalidOrder_id = 99999
					exchange.fillOrder(invalidOrder_id, {from:user2}).should.be.rejectedWith(EVM_REVERT)
				})

				it('rejects already filled order', async () => {
					//fill the order first
					exchange.fillOrder('1', {from: user2}).should.be.fulfilled
					//try filling the same order
					exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
				})
				it('rejects cancelled orders', async () => {
				//first cancel the order
					exchange.cancelOrder('1', {from:user1}).should.be.fulfilled
				//try filling the same order again
					exchange.fillOrder('1', {from:user2}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
		describe('cancelling order', () =>{
			let result
			
			describe('success', () =>{
				let result
				beforeEach(async () =>{
					await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from: user1})
					result = await exchange.cancelOrder('1', {from: user1})
				})
				it('updates cancelled orders', async () => {
					const orderCancelled = await exchange.orderCancelled('1')
					orderCancelled.should.equal(true)
				})
				it('emits an Cancel event', () =>{
					const log = result.logs[0]
					log.event.should.equal('Cancel')
					const event = log.args
					event.id.toString().should.equal('1', 'id is correct')
					event.user.should.equal(user1, 'user is correct')
					event.tokenGet.should.equal(token.address, 'tokenGet is correct')
					event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct') 
					event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
					event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
					event.timestamp.toString().length.should.be.at.least(1, 'timestamp is correct')
				})
			})
			describe('failure', () => {
				const invalidOrder_id = 9999
				it('rejects invalid order id', async () => {
					exchange.cancelOrder(invalidOrder_id, {from:user1}).should.be.rejectedWith(EVM_REVERT)
				})
				it('rejects unauthorized cancelling', async () =>{
					await exchange.cancelOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})
})