/** @format */

import "./App.css"
import React, { useState, useEffect } from "react"
import { getWeb3 } from "./utils/utils"
import { contractABI, contractNetwork } from "./utils/constants"

const App = () => {
	const [web3, setWeb3] = useState()
	const [currentAccount, setCurrentAccount] = useState()
	const [contract, setContract] = useState()
	const [events, setEvents] = useState([])

	useEffect(() => {
		;(async () => {
			const web3 = await getWeb3()
			const accounts = await web3.eth.getAccounts()
			const networkId = await web3.eth.net.getId()
			const deployedNetwork = contractNetwork[networkId]
			const contract = new web3.eth.Contract(
				contractABI,
				deployedNetwork && deployedNetwork.address,
			)
			console.log(contract)

			setWeb3(web3)
			setCurrentAccount(accounts)
			setContract(contract)
		})()

		window.ethereum.on("accountsChanged", (accounts) => {
			setCurrentAccount(accounts)
		})
	}, [])

	const connected = () => {
		return (
			typeof contract !== "undefined" &&
			typeof web3 !== "undefined" &&
			typeof currentAccount !== "undefined"
		)
	}

	useEffect(() => {
		if (connected()) {
			updateEvents()
		}
	}, [currentAccount, contract, web3])

	const updateEvents = async () => {
		const nextId = parseInt(await contract.methods.nextId().call())
		console.log(parseInt(nextId))

		const events = []
		for (let i = 0; i < nextId; i++) {
			events.push(contract.methods.events(i).call())
		}
		setEvents(await Promise.all(events))
	}

	const transferTickets = async (e) => {
		e.preventDefault()
		const eventId = e.target.elements[0].value
		const amount = e.target.elements[1].value
		const to = e.target.elementss[2].value
		await contract.methods
			.transferTickets(eventId, amount, to)
			.send({ from: currentAccount })
		await updateEvents()
	}

	const buyTickets = async (e, event) => {
		e.preventDefault()
		const amount = web3.utils.toBN(e.target.elements[0].value)
		const price = web3.utils.toBN(event.price)
		await contract.methods
			.buyTickets(event.id, amount.toString())
			.send({ from: currentAccount, value: amount.mul(price).toString() })
		await updateEvents()
	}

	const createEvent = async (e) => {
		e.preventDefault()
		const name = e.target.elements[0].value
		const date = Math.floor(
			new Date(e.target.elements[1].value).getTime() / 1000,
		)
		const price = e.target.elements[2].value
		const ticketCount = e.target.elements[3].value
		await contract.methods
			.createEvent(name, date, price, ticketCount)
			.send({ from: currentAccount })
		await updateEvents()
	}

	const endEvent = async (event) => {
		const now = new Date().getTime()
		const eventEnd = new Date(parseInt(event.date) * 1000).getTime()
		return eventEnd > now ? false : true
	}

	if (!connected()) {
		return <div>Loading...</div>
	}

	return (
		<div className='container'>
			<h1 className='text-center'>Event Organization</h1>

			<div className='row'>
				<div className='col-sm-12'>
					<h2>Create Event</h2>
					<form onSubmit={(e) => createEvent(e)}>
						<div className='form-group'>
							<label htmlFor='name'>Name</label>
							<input type='text' className='form-control' id='name' />
						</div>
						<div className='form-group'>
							<label htmlFor='date'>Date</label>
							<input type='date' className='form-control' id='date' />
						</div>
						<div className='form-group'>
							<label htmlFor='price'>Price</label>
							<input type='text' className='form-control' id='price' />
						</div>
						<div className='form-group'>
							<label htmlFor='ticketCount'>Ticket Count</label>
							<input type='text' className='form-control' id='ticketCount' />
						</div>
						<button type='submit' className='btn btn-primary'>
							Submit
						</button>
					</form>
				</div>
			</div>

			<hr />

			<div className='row'>
				<div className='col-sm-12'>
					<h2>Transfer Tickets</h2>
					<form onSubmit={(e) => transferTickets(e)}>
						<div className='form-group'>
							<label htmlFor='eventId'>Event ID</label>
							<input type='text' className='form-control' id='eventId' />
						</div>
						<div className='form-group'>
							<label htmlFor='amount'>Amount</label>
							<input type='text' className='form-control' id='amount' />
						</div>
						<div className='form-group'>
							<label htmlFor='to'>To</label>
							<input type='text' className='form-control' id='to' />
						</div>
						<button type='submit' className='btn btn-primary'>
							Submit
						</button>
					</form>
				</div>
			</div>

			<hr />

			<div className='row'>
				<div className='col-sm-12'>
					<h2>Events</h2>
					<table className='table'>
						<thead>
							<tr>
								<th>Id</th>
								<th>Admin</th>
								<th>Name</th>
								<th>Date</th>
								<th>Price</th>
								<th>Ticket Remaining</th>
								<th>Total Tickets</th>
								<th>Buy</th>
							</tr>
						</thead>
						<tbody>
							{events.map((event) => (
								<tr key={event.id}>
									<td>{event.id}</td>
									<td>{event.admin}</td>
									<td>{event.name}</td>
									<td>
										{new Date(parseInt(event.date) * 1000).toLocaleString()}
									</td>
									<td>{event.price}</td>
									<td>{event.ticketRemaining}</td>
									<td>{event.ticketCount}</td>
									<td>
										{endEvent(event) ? (
											"Event ended"
										) : (
											<form onSubmit={(e) => buyTickets(e, event)}>
												<div className='form-group'>
													<label htmlFor='amount'>Amount</label>
													<input
														type='text'
														className='form-group'
														id='amount'
													/>
												</div>
												<button type='submit' className='btn  btn-primary'>
													Submit
												</button>
											</form>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

export default App
