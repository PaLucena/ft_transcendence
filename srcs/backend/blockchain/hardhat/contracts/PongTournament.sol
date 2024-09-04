// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

contract PongTournament {
    struct Match {
        uint256 tournamentId_;
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
    uint256[] private tournamentsIds;
    mapping(uint256 => Match) private matches_;
    mapping(uint256 => uint256[]) private player_Tournaments_;
    mapping(uint256 => uint256[]) private player_Matches_;

    event TournamentCreated(uint256 tournamentId);
    event MatchResultRecorded(uint256 matchId);


    constructor() payable {
        owner_ = msg.sender;
        tournamentsIds.push(0);
    }

    modifier OnlyOwner(address _dir) {
        require(_dir == owner_, "You are not the owner");
        _;
    }

    function createTournament(uint256 tournamentId, uint256[] memory playersIds) public OnlyOwner(msg.sender) {
        require(tournaments_[tournamentId].tournamentId_ == 0, "Tournament already exists");
        require(playersIds.length == 8, "Must have 8 players");
        Tournament storage newTournament = tournaments_[tournamentId];
        newTournament.tournamentId_ = tournamentId;
        tournamentsIds.push(tournamentId);
        for (uint256 i = 0; i < playersIds.length; ++i) {
            newTournament.playerExists_[playersIds[i]] = true;
            player_Tournaments_[playersIds[i]].push(tournamentId);
        }

        emit TournamentCreated(tournamentId);
    }

    function recordMatch(uint256 tournId, uint256 matchId, uint256 p1Id, uint256 p2Id, uint256 p1Sc, uint256 p2Sc, uint256 winId) public OnlyOwner(msg.sender) {
        require(matches_[matchId].matchId_ == 0, "Match already exists");
        Tournament storage tournament = tournaments_[tournId];
        require(tournament.tournamentId_ == tournId, "Incorrect tournament");
        if (tournId == 0) {
            tournament.playerExists_[p1Id] = true;
            tournament.playerExists_[p2Id] = true;
        }
        require(tournament.playerExists_[p1Id], "P1 not in tournament");
        require(tournament.playerExists_[p2Id], "P2 not in tournament");

        require(p1Id != p2Id, "Players error");

        matches_[matchId] = Match(tournId, matchId, p1Id, p2Id, p1Sc, p2Sc, winId);
        tournaments_[tournId].matchIds_.push(matchId);
        player_Matches_[p1Id].push(matchId);
        player_Matches_[p2Id].push(matchId);

        emit MatchResultRecorded(matchId);
    }

    function getTournament(uint256 tournamentId) public view returns (Match[] memory) {
        uint256[] memory matchIds = tournaments_[tournamentId].matchIds_;
        uint256 length = matchIds.length;
        Match[] memory tournamentMatches = new Match[](length);
        for (uint256 i = 0; i < length; i++) {
            tournamentMatches[i] = matches_[matchIds[i]];
        }
        return tournamentMatches;
    }

    function getAllTournamentsIds() public view returns (uint256[] memory) {
        return tournamentsIds;
    }

    function getMatch(uint256 matchId) public view returns (Match memory) {
        return matches_[matchId];
    }

    function getPlayerTournaments(uint256 playerId) public view returns (uint256[] memory) {
        return player_Tournaments_[playerId];
    }

    function getPlayerMatches(uint256 playerId) public view returns (Match[] memory) {
        Match[] memory playerMatches = new Match[](player_Matches_[playerId].length);
        for (uint256 i = 0; i < player_Matches_[playerId].length; i++) {
            playerMatches[i] = matches_[player_Matches_[playerId][i]];
        }
        return playerMatches;
    }

    function getFace2Face(uint256 player1Id, uint256 player2Id) public view returns (Match[] memory) {
        uint256[] memory player1Matches = player_Matches_[player1Id];
        uint256[] memory player2Matches = player_Matches_[player2Id];

        uint256 matchesCount = 0;
        for (uint256 i = 0; i < player1Matches.length; i++) {
            for (uint256 j = 0; j < player2Matches.length; j++) {
                if (player1Matches[i] == player2Matches[j]) {
                    matchesCount++;
                }
            }
        }

        Match[] memory face2faceMatches = new Match[](matchesCount);
        uint256 index = 0;

        for (uint256 i = 0; i < player1Matches.length; i++) {
            for (uint256 j = 0; j < player2Matches.length; j++) {
                if (player1Matches[i] == player2Matches[j]) {
                    face2faceMatches[index] = matches_[player1Matches[i]];
                    index++;
                }
            }
        }
        return face2faceMatches;
    }

// ********************************************************************************
//                            AUTOMATIC TEST FUNCTIONS
// ********************************************************************************

    uint256 private testTournamentCounter = 0;
    uint256 private testMatchCounter = 0;

    function randomPairNumber() private  view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(testMatchCounter, "randomWinner", block.timestamp))) % 2;
    }

    function randomMatch(uint256 p1Id, uint256 p2Id) private  returns (Match memory) {
        testMatchCounter++;
        uint256 goals1;
        player_Matches_[p1Id].push(testMatchCounter);
        player_Matches_[p2Id].push(testMatchCounter);
        uint256 goals2 = uint256(keccak256(abi.encodePacked(p1Id, p2Id, block.timestamp))) % 9;
        if (goals2 >= 5) {
            goals1 = goals2 + 2;
        } else {
            goals1 = 6;
        }
        uint256 winner = randomPairNumber();
        if (winner < 1) {
            return Match(testTournamentCounter, testMatchCounter, p1Id, p2Id, goals1, goals2, p1Id);
        } else {
            return Match(testTournamentCounter, testMatchCounter, p1Id, p2Id, goals2, goals1, p2Id);
        }
    }

    function randomTournament(uint256[] memory playersIds) private {
        testTournamentCounter++;
        uint256 local;
        uint256 visitor;
        Match memory rnd_match;

        createTournament(testTournamentCounter, playersIds);

        // Shuffle players
        for (uint256 i = 0; i < 8; i++) {
            uint256 j = i + uint256(keccak256(abi.encodePacked(testMatchCounter, i, block.timestamp))) % (8 - i);
            uint256 temp = playersIds[i];
            playersIds[i] = playersIds[j];
            playersIds[j] = temp;
        }

        // Aux containers
        uint256[] memory winnersBracket = new uint256[](4);
        uint256[] memory losersBracket = new uint256[](4);

        // Initial round - 8 players
        for (uint256 i = 0; i < 4; i++) {
            local = playersIds[i * 2];
            visitor = playersIds[i * 2 + 1];
            rnd_match = randomMatch(local, visitor);
            matches_[rnd_match.matchId_] = rnd_match;
            tournaments_[testTournamentCounter].matchIds_.push(rnd_match.matchId_);
            if (rnd_match.winnerId_ == local) {
                winnersBracket[i] = local;
                losersBracket[i] = visitor;
            } else {
                winnersBracket[i] = visitor;
                losersBracket[i] = local;
            }
        }

        // Loosers bracket - First round - 4 players
        for (uint256 i = 0; i < 2; i++) {
            local = losersBracket[i * 2];
            visitor = losersBracket[i * 2 + 1];
            rnd_match = randomMatch(local, visitor);
            matches_[rnd_match.matchId_] = rnd_match;
            tournaments_[testTournamentCounter].matchIds_.push(rnd_match.matchId_);
            if (rnd_match.winnerId_ == local) {
                losersBracket[i * 2 + 1] = local;
            } else {
                losersBracket[i * 2 + 1] = visitor;
            }
        }

        // Winners bracket - First round - 4 players
        for (uint256 i = 0; i < 2; i++) {
            local = winnersBracket[i * 2];
            visitor = winnersBracket[i * 2 + 1];
            rnd_match = randomMatch(local, visitor);
            matches_[rnd_match.matchId_] = rnd_match;
            tournaments_[testTournamentCounter].matchIds_.push(rnd_match.matchId_);
            if (rnd_match.winnerId_ == local) {
                winnersBracket[i] = local;
                losersBracket[i * 2] = visitor;
            } else {
                winnersBracket[i] = visitor;
                losersBracket[i * 2] = local;
            }
        }

        // Loosers bracket - Second round - 4 players
        for (uint256 i = 0; i < 2; i++) {
            local = losersBracket[i * 2];
            visitor = losersBracket[i * 2 + 1];
            rnd_match = randomMatch(local, visitor);
            matches_[rnd_match.matchId_] = rnd_match;
            tournaments_[testTournamentCounter].matchIds_.push(rnd_match.matchId_);
            if (rnd_match.winnerId_ == local) {
                losersBracket[i] = local;
            } else {
                losersBracket[i] = visitor;
            }
        }

        // Loosers bracket - Third round - 2 players
        local = losersBracket[0];
        visitor = losersBracket[1];
        rnd_match = randomMatch(local, visitor);
        matches_[rnd_match.matchId_] = rnd_match;
        tournaments_[testTournamentCounter].matchIds_.push(rnd_match.matchId_);
        if (rnd_match.winnerId_ == local) {
            losersBracket[1] = local;
        } else {
            losersBracket[1] = visitor;
        }

        // Winners bracket - Second round - 2 players
        local = winnersBracket[0];
        visitor = winnersBracket[1];
        rnd_match = randomMatch(local, visitor);
        matches_[rnd_match.matchId_] = rnd_match;
        tournaments_[testTournamentCounter].matchIds_.push(rnd_match.matchId_);
        if (rnd_match.winnerId_ == local) {
            winnersBracket[0] = local;
            losersBracket[0] = visitor;
        } else {
            winnersBracket[0] = visitor;
            losersBracket[0] = local;
        }

        // Loosers bracket - Fourth round - 2 players
        local = losersBracket[0];
        visitor = losersBracket[1];
        rnd_match = randomMatch(local, visitor);
        matches_[rnd_match.matchId_] = rnd_match;
        tournaments_[testTournamentCounter].matchIds_.push(rnd_match.matchId_);
        if (rnd_match.winnerId_ == local) {
            losersBracket[0] = local;
        } else {
            losersBracket[0] = visitor;
        }

        // Final
        local = winnersBracket[0];
        visitor = losersBracket[0];
        rnd_match = randomMatch(local, visitor);
        matches_[rnd_match.matchId_] = rnd_match;
        tournaments_[testTournamentCounter].matchIds_.push(rnd_match.matchId_);
    }


    function loadTestData() public OnlyOwner(msg.sender) {
        uint256[] memory playersToTest = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            playersToTest[i] = i + 2;
        }
        for (uint256 i = 0; i < 4; i++) {
            randomTournament(playersToTest);
        }
    }
}
