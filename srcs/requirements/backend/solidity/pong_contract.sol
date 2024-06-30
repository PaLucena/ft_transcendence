// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PongTournament {
    struct Match {
        uint256 matchId;
        uint256 player1Id;
        uint256 player2Id;
        uint256 winnerId;
    }

    struct Tournament {
        uint256 tournamentId;
        string name;
        uint256[] matchIds;
    }

    address public owner;

    uint256 public matchCount = 0;

    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => Match) public matches;

    event TournamentCreated(uint256 tournamentId, string name);
    event MatchResultRecorded(uint256 matchId, uint256 player1Id, uint256 player2Id, uint256 winnerId);

    constructor() {
        owner = msg.sender;
    }

    modifier OnlyOwner(address _dir) {
        require(_dir == owner, "Only owner can call this function");
        _;
    }

    function createTournament(string memory name, uint256 tournamentId) public OnlyOwner(msg.sender) {
        tournaments[tournamentId] = Tournament(tournamentId, name, new uint256[](0));
        emit TournamentCreated(tournamentId, name);
    }

    function recordMatch(uint256 tournamentId, uint256 player1Id, uint256 player2Id, uint256 winnerId) public OnlyOwner(msg.sender) {
        require(tournaments[tournamentId].tournamentId == tournamentId, "Tournament does not exist");

        matchCount++;
        matches[matchCount] = Match(matchCount, player1Id, player2Id, winnerId);
        tournaments[tournamentId].matchIds.push(matchCount);

        emit MatchResultRecorded(matchCount, player1Id, player2Id, winnerId);
    }

    function getTournament(uint256 tournamentId) public view returns (Match[] memory) {
        uint256[] memory matchIds = tournaments[tournamentId].matchIds;
        Match[] memory tournamentMatches = new Match[](matchIds.length);

        for (uint256 i = 0; i < matchIds.length; i++) {
            tournamentMatches[i] = matches[matchIds[i]];
        }

        return tournamentMatches;
    }

    function getMatch(uint256 matchId) public view returns (Match memory) {
        return matches[matchId];
    }
}
