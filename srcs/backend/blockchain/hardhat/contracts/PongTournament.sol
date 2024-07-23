// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

contract PongTournament {
    struct Match {
        uint256 matchId_;
        uint256 player1Id_;
        uint256 player2Id_;
        uint256 player1Score_;
        uint256 player2Score_;
        uint256 winnerId_;
    }

    struct Tournament {
        uint256 tournamentId_;
        uint256[] matchIds_;
        mapping(uint256 => bool) playerExists_;
    }

    address public immutable owner_;

    mapping(uint256 => Tournament) private tournaments_;
    mapping(uint256 => Match) private matches_;
    mapping(uint256 => uint256[]) private player_Tournaments_;

    event TournamentCreated(uint256 tournamentId);
    event MatchResultRecorded(uint256 matchId);

    constructor() payable {
        owner_ = msg.sender;
    }

    modifier OnlyOwner(address _dir) {
        require(_dir == owner_, "You are not the owner");
        _;
    }

    function createTournament(uint256 tournamentId, uint256[] memory playersIds) public OnlyOwner(msg.sender) {
        require(playersIds.length == 8, "Must have 8 players");

        Tournament storage newTournament = tournaments_[tournamentId];
        newTournament.tournamentId_ = tournamentId;

        for (uint256 i = 0; i < playersIds.length; ++i) {
            newTournament.playerExists_[playersIds[i]] = true;
            player_Tournaments_[playersIds[i]].push(tournamentId);
        }

        emit TournamentCreated(tournamentId);
    }

    function recordMatch(uint256 tournamentId, uint256 matchId, uint256 player1Id, uint256 player2Id, uint256 player1Score, uint256 player2Score, uint256 winnerId) public OnlyOwner(msg.sender) {
        Tournament storage tournament = tournaments_[tournamentId];
        require(tournament.tournamentId_ == tournamentId, "Incorrect tournament");
        require(player1Id != player2Id, "Players error");
        require(tournament.playerExists_[player1Id], "P1 not in tournament");
        require(tournament.playerExists_[player2Id], "P2 not in tournament");
        require(winnerId == player1Id || winnerId == player2Id, "Winner is not a player");

        matches_[matchId] = Match(matchId, player1Id, player2Id, player1Score, player2Score, winnerId);
        tournaments_[tournamentId].matchIds_.push(matchId);

        emit MatchResultRecorded(matchId);
    }

    function getTournament(uint256 tournamentId) public view returns (Match[] memory) {
        uint256[] memory matchIds = tournaments_[tournamentId].matchIds_;
        uint256 length = matchIds.length;
        Match[] memory tournamentMatches = new Match[](matchIds.length);

        for (uint256 i = 0; i < length; i++) {
            tournamentMatches[i] = matches_[matchIds[i]];
        }

        return tournamentMatches;
    }

    function getMatch(uint256 matchId) public view returns (Match memory) {
        return matches_[matchId];
    }

    function getPlayerTournaments(uint256 playerId) public view returns (uint256[] memory) {
        return player_Tournaments_[playerId];
    }
}
