(function () {
    'use strict';

    // --- State ---
    let currentScenario = null;
    let scenarioCount = 0;
    let correctCount = 0;

    // --- DOM refs ---
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const startBtn = document.getElementById('start-btn');
    const checkBtn = document.getElementById('check-btn');
    const nextBtn = document.getElementById('next-btn');
    const scoreEl = document.getElementById('score');
    const scenarioNumEl = document.getElementById('scenario-number');
    const playersInfoEl = document.getElementById('players-info');
    const roundsBodyEl = document.getElementById('rounds-body');
    const resultsCard = document.getElementById('results-card');
    const resultsIcon = document.getElementById('results-icon');
    const resultsText = document.getElementById('results-text');
    const resultsDetail = document.getElementById('results-detail');
    const answerCard = document.querySelector('.answer-card');

    const fields = ['pot', 'rake', 'tip', 'jackpot', 'payout'];
    const inputs = {};
    const feedbacks = {};
    fields.forEach(f => {
        inputs[f] = document.getElementById('ans-' + f);
        feedbacks[f] = document.getElementById('fb-' + f);
    });

    // --- Helpers ---
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // --- Tip Lookup Table ---
    function getTip(pot) {
        if (pot < 600) return 0;
        if (pot < 1500) return 10;
        if (pot < 2500) return 20;
        if (pot < 3500) return 30;
        if (pot < 5000) return 40;
        if (pot < 6000) return 50;
        if (pot < 7000) return 60;
        if (pot < 8000) return 70;
        if (pot < 9000) return 80;
        if (pot < 10000) return 90;
        return 100;
    }

    // --- Scenario Generation ---
    function generateScenario() {
        const totalPlayers = randomInt(3, 8);
        let players = totalPlayers;
        const roundNames = ['Pre-flop', 'Flop', 'Turn', 'River'];
        const rounds = [];
        let pot = 0;

        // Bet ranges per round (realistic)
        const betOptions = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

        for (let i = 0; i < 4; i++) {
            let folds = 0;
            if (players > 2) {
                const maxFolds = Math.min(players - 2, 2);
                folds = randomInt(0, maxFolds);
            }
            players -= folds;

            const bet = randomChoice(betOptions);
            const roundAmount = bet * players;
            pot += roundAmount;

            rounds.push({
                name: roundNames[i],
                folds: folds,
                players: players,
                bet: bet,
                roundAmount: roundAmount,
            });
        }

        // Deductions
        const rake = Math.min(100, Math.round(pot * 0.05));
        const tip = getTip(pot);
        const jackpot = 20;
        const totalDeductions = rake + tip + jackpot;
        const payout = pot - totalDeductions;

        return {
            totalPlayers: totalPlayers,
            rounds: rounds,
            pot: pot,
            rake: rake,
            tip: tip,
            jackpot: jackpot,
            totalDeductions: totalDeductions,
            payout: payout,
        };
    }

    // --- Rendering ---
    function renderScenario(scenario) {
        scenarioCount++;
        scenarioNumEl.textContent = '#' + scenarioCount;
        playersInfoEl.innerHTML = '<strong>' + scenario.totalPlayers + ' players</strong> are seated at the table.';

        roundsBodyEl.innerHTML = '';
        scenario.rounds.forEach(r => {
            const row = document.createElement('div');
            row.className = 'round-row';

            const foldText = r.folds === 0 ? 'None' : r.folds;
            const foldClass = r.folds > 0 ? 'fold-count has-folds' : 'fold-count';

            row.innerHTML =
                '<span class="round-name">' + r.name + '</span>' +
                '<span class="' + foldClass + '">' + foldText + '</span>' +
                '<span class="active-count">' + r.players + '</span>' +
                '<span class="bet-amount">' + r.bet + ' kr</span>';
            roundsBodyEl.appendChild(row);
        });
    }

    function clearInputs() {
        fields.forEach(f => {
            inputs[f].value = '';
            inputs[f].className = '';
            feedbacks[f].textContent = '';
        });
    }

    function showResults(allCorrect, details) {
        resultsCard.classList.remove('hidden');
        answerCard.querySelector('.btn-primary').classList.add('hidden');

        if (allCorrect) {
            correctCount++;
            resultsIcon.textContent = '\u2705';
            resultsText.textContent = 'Perfect! All calculations correct.';
        } else {
            resultsIcon.textContent = '\u274C';
            resultsText.textContent = 'Not quite right. Check the corrections below.';
        }

        let detailHtml = '';
        const labels = {
            pot: 'Final Pot',
            rake: 'Rake',
            tip: 'Tip',
            jackpot: 'Jackpot',
            payout: 'Winner Receives',
        };
        fields.forEach(f => {
            const correct = details[f].correct;
            const answer = details[f].answer;
            const isRight = details[f].isCorrect;
            if (isRight) {
                detailHtml += '<div><span class="correct-val">\u2713</span> ' + labels[f] + ': ' + correct + ' kr</div>';
            } else {
                detailHtml += '<div><span class="incorrect-val">\u2717</span> ' + labels[f] + ': You said ' + (answer !== null ? answer + ' kr' : '(empty)') + ' — correct is <strong>' + correct + ' kr</strong></div>';
            }
        });
        resultsDetail.innerHTML = detailHtml;

        updateScore();
    }

    function updateScore() {
        scoreEl.textContent = correctCount + ' / ' + scenarioCount;
    }

    // --- Event Handlers ---
    startBtn.addEventListener('click', function () {
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        newRound();
    });

    checkBtn.addEventListener('click', function () {
        if (!currentScenario) return;

        const details = {};
        let allCorrect = true;

        fields.forEach(f => {
            const val = inputs[f].value.trim();
            const answer = val === '' ? null : parseInt(val, 10);
            const correct = currentScenario[f];
            const isCorrect = answer === correct;

            details[f] = { answer: answer, correct: correct, isCorrect: isCorrect };

            if (isCorrect) {
                inputs[f].classList.add('correct');
                feedbacks[f].textContent = '\u2713';
                feedbacks[f].style.color = 'var(--correct)';
            } else {
                allCorrect = false;
                inputs[f].classList.add('incorrect');
                feedbacks[f].textContent = correct;
                feedbacks[f].style.color = 'var(--incorrect)';
            }
        });

        // Disable inputs
        fields.forEach(f => {
            inputs[f].disabled = true;
        });

        showResults(allCorrect, details);
    });

    nextBtn.addEventListener('click', function () {
        newRound();
    });

    function newRound() {
        currentScenario = generateScenario();
        clearInputs();
        fields.forEach(f => {
            inputs[f].disabled = false;
        });
        resultsCard.classList.add('hidden');
        checkBtn.classList.remove('hidden');
        renderScenario(currentScenario);
        inputs.pot.focus();
    }

    // Keyboard: Enter to submit or move to next input
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            if (!resultsCard.classList.contains('hidden')) {
                nextBtn.click();
            } else if (!checkBtn.classList.contains('hidden')) {
                // Check if all fields have values
                const allFilled = fields.every(f => inputs[f].value.trim() !== '');
                if (allFilled) {
                    checkBtn.click();
                } else {
                    // Move to next empty field
                    for (let i = 0; i < fields.length; i++) {
                        if (inputs[fields[i]].value.trim() === '') {
                            inputs[fields[i]].focus();
                            break;
                        }
                    }
                }
            }
        }
    });

    // Tab through inputs with Enter key within inputs
    fields.forEach(function (f, idx) {
        inputs[f].addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && idx < fields.length - 1) {
                e.preventDefault();
                inputs[fields[idx + 1]].focus();
            }
        });
    });
})();
