import { ether, EVM_REVERT } from './helpers'

const Token = artifacts.require('./Token')

require('chai')
.use(require('chai-as-promised'))
.should()

contract('Token', ([deployer, receiver, exchange]) => {
	const name = 'NEc Token'
	const symbol = 'NEC'
	const decimals = '18'
	const totalSupply = ether(1000000).toString()
	let token

	beforeEach(async () => {
		token = await Token.new()
	} )

	describe('deployment', () => {
		it('tracks the name', async () =>{
			const result = await token.name()
			result.should.equal(name)
			
		})

		it('tracks the symbol', async () =>{
			const result = await token.symbol()
			result.should.equal(symbol)
			
		})

		it('tracks the decimals', async () =>{
			const result = await token.decimals()
			result.toString().should.equal(decimals)
			
		})

		it('tracks the total supply', async () =>{
			const result = await token.totalSupply()
			result.toString().should.equal(totalSupply)
			
		})
	})

	describe('sending tokens', () => {
		let result
		let amount

		describe('success', () => {
			beforeEach(async () => {
				amount = ether(100)
				result = await token.transfer(receiver, amount, {from: deployer})
			})

			it('transfers token balance', async () => {
				let balanceOf
				balanceOf = await token.balanceOf(deployer)
				balanceOf.toString().should.equal(ether(999900).toString())
				balanceOf = await token.balanceOf(receiver)
				balanceOf.toString().should.equal(ether(100).toString())


			})

			it('emits a transfer event', () =>{
				const log = result.logs[0]
				log.event.should.eq('Transfer')
				const event = log.args
				event.from.toString().should.eq(deployer, 'from is correct')
				event.to.should.equal(receiver, 'to is correct')
				event.value.toString().should.equal(amount.toString(), 'value is correct')
			})
		})

		describe ('failure', () => {
			let invalidAmount
			//transfer when you have insufficient balance
			it('rejects insufficient balance', async () => {
				invalidAmount = ether(10000000)
				await token.transfer(receiver, invalidAmount, {from: deployer}).should.be.rejectedWith(EVM_REVERT)

				//transfer when you have no token
				invalidAmount = ether(10)
			    await token.transfer(deployer, invalidAmount, {from: receiver} ).should.be.rejectedWith(EVM_REVERT)
			})
				//transfer when the recipient is invalid
			it('rejects inavalid recepients', async () => {
				await token.transfer(0x0, amount, {from: deployer}).should.be.rejected
			})

		})
		
	})

	describe('approving tokens', () => {
		let amount
		let result

		beforeEach(async () => {
			amount = ether(100)
			result = await token.approve(exchange, amount, {from:deployer})
		})

		describe('success', () => {
			beforeEach(async () => {
				await token.approve(exchange, amount, {from:deployer})
			})
			

			it('allocates an allowance for delegated token spending on exchange', async () => {
				const allowance = await token.allowance(deployer, exchange)
				allowance.toString().should.equal(amount.toString())
			})

			
		    it('emits an Approval event', () => {
		    	const log = result.logs[0]
		        log.event.should.eq('Approval')
		        const event = log.args
		        event.owner.toString().should.equal(deployer, 'owner is correct')
		        event.spender.toString().should.equal(exchange, 'spender is correct')
		        event.value.toString().should.equal(amount.toString(), 'value is correct')    
		    })
		})

		describe('failure', () => {
			it('rejects inavalid spenders', async () => {
				await token.approve(0x0, amount, {from: deployer}).should.be.rejected
			})
		})
	})

	describe('delegated token transfers', () => {
		let amount
		let result

		beforeEach(async () => {
			amount = ether(100)
			await token.approve(exchange, amount, {from: deployer})
		})
		describe('success', () => {
				beforeEach(async () => {
				amount = ether(100)
				result = await token.transferFrom(deployer, receiver, amount, {from: exchange})
				})

				it('transfers token balance', async () => {
					let balanceOf
					balanceOf = await token.balanceOf(deployer)
					balanceOf.toString().should.equal(ether(999800).toString())
					balanceOf = await token.balanceOf(exchange)
					balanceOf.toString().should.equal(ether(100).toString())
				})

				it('resets the allowance', async () => {
					const allowance = await token.allowance(deployer, exchange)
					allowance.toString().should.equal('0')
				})

				it('emits a transfer event', () =>{
					const log = result.logs[0]
					log.event.should.eq('Transfer')
					const event = log.args
					event.from.toString().should.eq(deployer, 'from is correct')
					event.to.should.equal(receiver, 'to is correct')
					event.value.toString().should.equal(amount.toString(), 'value is correct')
				})	
			})
		describe('failure', () => {
			it('rejects insufficient amount', async () => {
				const invalidAmount = ether(10000000)
				token.transferFrom(deployer, receiver, invalidAmount, {from: deployer}).should.be.rejectedWith(EVM_REVERT)
			})
			it('rejects invalid recepients', async () => {
				token.transferFrom(deployer, 0x0, amount, {from: exchange}).should.be.rejected
			})
		})
	})
})