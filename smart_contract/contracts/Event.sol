// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EventOrganization {
    struct Event {
        uint256 id;
        address admin;
        string name;
        uint256 date;
        uint256 price;
        uint256 ticketCount;
        uint256 ticketRemaining;
    }

    mapping(uint256 => Event) public events;
    mapping(address => mapping(uint256 => uint256)) public tickets;
    uint256 public nextId;

    function createEvent(
        string calldata _name,
        uint256 _date,
        uint256 _price,
        uint256 _ticketCount
    ) external {
        require(
            _date > block.timestamp,
            "Event must be created at a later date."
        );
        require(_ticketCount > 0, "Must have tickets available.");
        events[nextId] = Event(
            nextId,
            msg.sender,
            _name,
            _date,
            _price,
            _ticketCount,
            _ticketCount
        );
        nextId++;
    }

    modifier eventExist(uint256 _id) {
        require(events[_id].date != 0, "Event does not exist.");
        _;
    }

    modifier eventActive(uint256 _id) {
        require(block.timestamp < events[_id].date, "Event must be active");
        _;
    }

    function buyTickets(uint256 _id, uint256 _amount)
        external
        payable
        eventExist(_id)
        eventActive(_id)
    {
        Event storage _event = events[_id];
        require(msg.value == (_event.price * _amount), "Insufficient funds.");
        require(
            _event.ticketRemaining > 0,
            "Must have tickets available that meets demand."
        );
        _event.ticketRemaining -= _amount;
        tickets[msg.sender][_id] += _amount;
    }

    function transferTickets(
        uint256 _eventId,
        uint256 _amount,
        address _to
    ) external eventExist(_eventId) eventActive(_eventId) {
        require(
            tickets[msg.sender][_eventId] > _amount,
            "Insufficient tickets"
        );
        tickets[msg.sender][_eventId] -= _amount;
        tickets[_to][_eventId] += _amount;
    }
}
