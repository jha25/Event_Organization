/** @format */

const { expectRevert, time } = require("@openzeppelin/test-helpers")
const EventContract = artifacts.require("EventOrganization")

contract("EventContract", async (accounts) => {
	let eventContract
	before(async () => {
		eventContract = await EventContract.new()
	})

	it("Should not create an event if not a later date from now", async () => {
		const date = (await time.latest()) - time.duration.seconds(1)
		console.log(date)
		await expectRevert(
			eventContract.createEvent("Event1", date, 5, 10),
			"Can only create if at a future date.",
		)
	})

	it("Should not create an event if there is no tickets", async () => {
		const date = (await time.latest()) + time.duration.seconds(1000)
		console.log(date)
		await expectRevert(
			eventContract.createEvent("Event1", date, 5, 0),
			"No tickets available.",
		)
	})

	it("Should create an event", async () => {
		const date = (await time.latest()) + time.duration.seconds(1000)
		await eventContract.createEvent("Event1", date, 5, 2)
		console.log("Event created.")
		const event = await eventContract.events(0)
		console.log(event.id.toNumber(), event.name, event.date.toNumber())
		assert(event.id.toNumber() === 0)
		assert(event.name === "Event1")
		// assert(event.date.toNumber() === date.toNumber())
	})

	it("Should not buy a ticket if event does not exist", async () => {
		await expectRevert(eventContract.buyTickets(1, 1), "Event does not exist.")
	})

	context("event create", () => {
		beforeEach(async () => {
			const date = (await time.latest()) + time.duration.seconds(1000)
			await eventContract.createEvent("Event1", date, 5, 2)
		})

		it("Should not buy a ticket if insufficient funds sent", async () => {
			await expectRevert(
				eventContract.buyTickets(0, 1),
				"Ether sent must be equal to total ticket cost",
			)
		})

		it("Should not buy a ticket if not enough ticket available", async () => {
			await expectRevert(
				eventContract.buyTickets(0, 3, { value: 15 }),
				"Not enough tickets left",
			)
		})

		it("Should buy tickets", async () => {
			await eventContract.buyTickets(0, 1, { value: 5, from: accounts[1] })
			await eventContract.buyTickets(0, 1, { value: 5, from: accounts[2] })
			const ticketCount1 = await eventContract.tickets.call(accounts[1], 0)
			const ticketCount2 = await eventContract.tickets.call(accounts[2], 0)
			assert(ticketCount1.toNumber() === 1)
			assert(ticketCount2.toNumber() === 1)
		})

		it("Should not transfer ticket ticket if not enough available tickets", async () => {
			await expectRevert(
				eventContract.transferTickets(0, 3, accounts[5]),
				"Insufficient tickets",
			)
		})

		it("Should transfer tickets", async () => {
			await eventContract.transferTickets(0, 1, accounts[5], {
				from: accounts[1],
			})
			const ticketCount1 = await eventContract.tickets.call(accounts[1], 0)
			const ticketCount5 = await eventContract.tickets.call(accounts[5], 0)
			console.log(ticketCount1)
			assert(ticketCount1.toNumber() === 0)
			assert(ticketCount5.toNumber() === 1)
		})

		it("Should not buy a ticket if event has expired", async () => {
			time.increase(1001)
			await expectRevert(eventContract.buyTickets(0, 1), "Event has ended.")
		})
	})
})
