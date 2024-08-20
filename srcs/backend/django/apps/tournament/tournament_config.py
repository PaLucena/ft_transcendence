next_match_dependencies = {
    1: [5, 7], # After match 1, match 5 (loser's bracket) and match 7 (winner's bracket) may become available
    2: [5, 7],
    3: [6, 8],
    4: [6, 8],
    5: [9],
    6: [10],
    7: [11],
    8: [12],
    9: [13],
    10: [13],
    11: [14],
    12: [14]
}

required_matches = {
    5: [1, 2],
    6: [3, 4],
    7: [1, 2],
    8: [3, 4],
    9: [5],
    10: [6],
    11: [7],
    12: [8],
    13: [9, 10],
    14: [11, 12]
}

assignments = {
    5: {'player1': {'loser': 1}, 'player2': {'loser': 2}},
    6: {'player1': {'loser': 3}, 'player2': {'loser': 4}},
    7: {'player1': {'winner': 1}, 'player2': {'winner': 2}},
    8: {'player1': {'winner': 3}, 'player2': {'winner': 4}},
    9: {'player1': {'loser': 7}, 'player2': {'winner': 5}},
    10: {'player1': {'loser': 8}, 'player2': {'winner': 6}},
    11: {'player1': {'winner': 7}, 'player2': {'winner': 8}},
    12: {'player1': {'winner': 9}, 'player2': {'loser': 10}},
    13: {'player1': {'loser': 11}, 'player2': {'winner': 12}},
    14: {'player1': {'winner': 11}, 'player2': {'winner': 13}},
}