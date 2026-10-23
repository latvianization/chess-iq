const INS_PHASES = ['opening', 'middlegame', 'endgame'];
const INS_PHASE_LABELS = { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' };
const INS_EMPTY_RECORD = () => ({ w: 0, d: 0, l: 0 });

function insAverage(values) {
  const valid = values.filter((v) => typeof v === 'number' && !isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

function insRound(value, digits = 1) {
  if (value === null || value === undefined) return null;
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function insScore(record) {
  const total = record.w + record.d + record.l;
  return total ? ((record.w + record.d * 0.5) / total) * 100 : null;
}

function insAddResult(record, result) {
  record[result] += 1;
}

function insGroupBy(summaries, keyFn) {
  const groups = new Map();
  summaries.forEach((s) => {
    const key = keyFn(s);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  });
  return groups;
}

function insGroupStats(list) {
  const record = INS_EMPTY_RECORD();
  list.forEach((s) => insAddResult(record, s.result));
  return {
    games: list.length,
    record,
    score: insRound(insScore(record)),
    accuracy: insRound(insAverage(list.map((s) => s.acc)))
  };
}

function insStreaks(summaries) {
  let bestWin = 0;
  let worstLoss = 0;
  let win = 0;
  let loss = 0;
  summaries.forEach((s) => {
    win = s.result === 'w' ? win + 1 : 0;
    loss = s.result === 'l' ? loss + 1 : 0;
    bestWin = Math.max(bestWin, win);
    worstLoss = Math.max(worstLoss, loss);
  });
  return { bestWin, worstLoss };
}

function insHighlight(s) {
  return {
    id: s.id,
    pgn: s.pgn,
    color: s.color,
    oppName: s.oppName,
    oppElo: s.oppElo,
    ownElo: s.ownElo,
    acc: s.acc,
    date: s.date
  };
}

function insBuildNotes(report) {
  const notes = [];
  const phaseAcc = report.phaseAccuracy;
  const ranked = INS_PHASES.filter((p) => phaseAcc[p] !== null).sort((a, b) => phaseAcc[b] - phaseAcc[a]);
  if (ranked.length >= 2) {
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    notes.push({ type: 'strength', text: `${INS_PHASE_LABELS[best]} is your strongest phase (${phaseAcc[best]}% accuracy).` });
    if (phaseAcc[best] - phaseAcc[worst] >= 3) {
      notes.push({ type: 'weakness', text: `${INS_PHASE_LABELS[worst]} is your weakest phase (${phaseAcc[worst]}% vs ${phaseAcc[best]}% in the ${INS_PHASE_LABELS[best].toLowerCase()}).` });
    }
  }

  const white = report.byColor.w;
  const black = report.byColor.b;
  if (white.games >= 5 && black.games >= 5 && white.score !== null && black.score !== null && Math.abs(white.score - black.score) >= 10) {
    const strong = white.score > black.score ? 'White' : 'Black';
    const weak = strong === 'White' ? 'Black' : 'White';
    const strongScore = Math.max(white.score, black.score);
    const weakScore = Math.min(white.score, black.score);
    notes.push({ type: 'strength', text: `You score ${strongScore}% as ${strong}.` });
    notes.push({ type: 'weakness', text: `You score only ${weakScore}% as ${weak}.` });
  }

  const { stronger, weaker } = report.byOpponentStrength;
  if (stronger.games >= 5 && stronger.score !== null && stronger.score >= 40) {
    notes.push({ type: 'strength', text: `You hold your own against stronger opponents (${stronger.score}% score).` });
  }
  if (weaker.games >= 5 && weaker.score !== null && weaker.score < 70) {
    notes.push({ type: 'weakness', text: `You only score ${weaker.score}% against weaker opponents. Convert winning positions more carefully.` });
  }

  if (report.moves.blunderRate !== null) {
    notes.push({
      type: report.moves.blunderRate <= 1.5 ? 'strength' : 'weakness',
      text: `You make ${report.moves.blunderRate} blunders and ${report.moves.mistakeRate} mistakes per 100 moves.`
    });
  }

  if (report.timeTrouble.blunders >= 3) {
    notes.push({ type: 'weakness', text: `${report.timeTrouble.blunders} of your blunders and mistakes came with under 20 seconds on the clock. Manage your time earlier.` });
  }
  if (report.timeTrouble.impulsive >= 3) {
    notes.push({ type: 'weakness', text: `${report.timeTrouble.impulsive} blunders and mistakes were played in under 2 seconds. Slow down in critical positions.` });
  }

  if (report.moves.brilliantPerGame >= 0.2) {
    notes.push({ type: 'strength', text: `You find ${report.moves.brilliantPerGame} brilliant moves per game.` });
  }

  const timeControls = report.byTimeControl.filter((t) => t.games >= 5 && t.score !== null).sort((a, b) => b.score - a.score);
  if (timeControls.length >= 2) {
    const best = timeControls[0];
    const worst = timeControls[timeControls.length - 1];
    if (best.score - worst.score >= 10) {
      notes.push({ type: 'strength', text: `${best.label} is your best time control (${best.score}% score).` });
      notes.push({ type: 'weakness', text: `${worst.label} is your weakest time control (${worst.score}% score).` });
    }
  }

  const openings = report.openings.filter((o) => o.games >= 3 && o.score !== null);
  if (openings.length >= 2) {
    const sorted = [...openings].sort((a, b) => b.score - a.score);
    notes.push({ type: 'strength', text: `Best opening: ${sorted[0].name} (${sorted[0].score}% score in ${sorted[0].games} games).` });
    const worst = sorted[sorted.length - 1];
    if (worst.score < 45) {
      notes.push({ type: 'weakness', text: `Struggling opening: ${worst.name} (${worst.score}% score in ${worst.games} games).` });
    }
  }

  return notes;
}

function insClassifyOpponent(s) {
  const diff = s.oppElo - s.ownElo;
  if (diff > 50) return 'stronger';
  if (diff < -50) return 'weaker';
  return 'equal';
}

function insMoveStats(summaries) {
  const totals = {};
  let totalMoves = 0;
  summaries.forEach((s) => {
    Object.keys(s.counts || {}).forEach((k) => {
      totals[k] = (totals[k] || 0) + s.counts[k];
      totalMoves += s.counts[k];
    });
  });
  const perHundred = (key) => (totalMoves ? insRound(((totals[key] || 0) / totalMoves) * 100) : null);
  const perGame = (key) => (summaries.length ? insRound((totals[key] || 0) / summaries.length, 2) : 0);
  return {
    totals,
    totalMoves,
    blunderRate: perHundred('blunder'),
    mistakeRate: perHundred('mistake'),
    brilliantPerGame: perGame('brilliant'),
    greatPerGame: perGame('great')
  };
}

function insPhaseStats(summaries) {
  const accuracy = {};
  const errorsPerGame = {};
  const errorsPer100 = {};
  INS_PHASES.forEach((phase) => {
    accuracy[phase] = insRound(insAverage(summaries.map((s) => s.phaseAcc?.[phase])));
    const errors = summaries.reduce((sum, s) => sum + (s.phaseErr?.[phase] || 0), 0);
    const moves = summaries.reduce((sum, s) => sum + (s.phaseMoves?.[phase] || 0), 0);
    errorsPerGame[phase] = summaries.length ? insRound(errors / summaries.length, 2) : 0;
    errorsPer100[phase] = moves ? insRound((errors / moves) * 100) : null;
  });
  return { accuracy, errorsPerGame, errorsPer100 };
}

function insOpeningStats(summaries) {
  const groups = insGroupBy(summaries, (s) => s.ecoName || s.eco || 'Unknown');
  return [...groups.entries()]
    .map(([name, list]) => ({ name, eco: list[0].eco, ...insGroupStats(list) }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 8);
}

function insTimeControlStats(summaries) {
  const order = ['Bullet', 'Blitz', 'Rapid', 'Classical', 'Daily'];
  const groups = insGroupBy(summaries, (s) => s.tc);
  return order
    .filter((label) => groups.has(label))
    .map((label) => ({ label, ...insGroupStats(groups.get(label)) }));
}

function insAccuracyHistogram(summaries) {
  const buckets = [
    { label: '<60', min: 0, max: 60 },
    { label: '60s', min: 60, max: 70 },
    { label: '70s', min: 70, max: 80 },
    { label: '80s', min: 80, max: 90 },
    { label: '90+', min: 90, max: 101 }
  ];
  return buckets.map((b) => ({
    label: b.label,
    value: summaries.filter((s) => s.acc >= b.min && s.acc < b.max).length
  }));
}

function computeInsights(summaryList) {
  const summaries = [...summaryList].sort((a, b) => a.ts - b.ts);
  if (summaries.length === 0) return null;

  const record = INS_EMPTY_RECORD();
  summaries.forEach((s) => insAddResult(record, s.result));

  const byColor = {
    w: insGroupStats(summaries.filter((s) => s.color === 'w')),
    b: insGroupStats(summaries.filter((s) => s.color === 'b'))
  };

  const opponentGroups = { stronger: [], equal: [], weaker: [] };
  summaries.forEach((s) => opponentGroups[insClassifyOpponent(s)].push(s));
  const byOpponentStrength = {
    stronger: insGroupStats(opponentGroups.stronger),
    equal: insGroupStats(opponentGroups.equal),
    weaker: insGroupStats(opponentGroups.weaker)
  };

  const wins = summaries.filter((s) => s.result === 'w').sort((a, b) => b.oppElo - a.oppElo);
  const losses = summaries.filter((s) => s.result === 'l').sort((a, b) => a.oppElo - b.oppElo);
  const phase = insPhaseStats(summaries);
  const moves = insMoveStats(summaries);

  const report = {
    games: summaries.length,
    record,
    winRate: insRound((record.w / summaries.length) * 100),
    score: insRound(insScore(record)),
    avgAccuracy: insRound(insAverage(summaries.map((s) => s.acc))),
    avgOpponentAccuracy: insRound(insAverage(summaries.map((s) => s.oppAcc))),
    avgOwnElo: Math.round(insAverage(summaries.map((s) => s.ownElo))),
    avgOpponentElo: Math.round(insAverage(summaries.map((s) => s.oppElo))),
    avgPerformanceElo: Math.round(insAverage(summaries.map((s) => s.perf))),
    avgGameLength: Math.round(insAverage(summaries.map((s) => s.plies / 2))),
    currentElo: summaries[summaries.length - 1].ownElo,
    startElo: summaries[0].ownElo,
    peakElo: Math.max(...summaries.map((s) => s.ownElo)),
    lowestElo: Math.min(...summaries.map((s) => s.ownElo)),
    firstDate: summaries[0].date,
    lastDate: summaries[summaries.length - 1].date,
    streaks: insStreaks(summaries),
    byColor,
    byOpponentStrength,
    phaseAccuracy: phase.accuracy,
    phaseErrorsPerGame: phase.errorsPerGame,
    phaseErrorsPer100: phase.errorsPer100,
    moves,
    timeTrouble: {
      blunders: summaries.reduce((sum, s) => sum + (s.ttBlunders || 0), 0),
      impulsive: summaries.reduce((sum, s) => sum + (s.impBlunders || 0), 0)
    },
    openings: insOpeningStats(summaries),
    byTimeControl: insTimeControlStats(summaries),
    accuracyHistogram: insAccuracyHistogram(summaries),
    timeline: summaries.map((s) => ({
      date: s.date,
      ownElo: s.ownElo,
      oppElo: s.oppElo,
      acc: s.acc,
      perf: s.perf,
      result: s.result
    })),
    bestWins: wins.slice(0, 3).map(insHighlight),
    worstLosses: losses.slice(0, 3).map(insHighlight),
    bestAccuracyGame: insHighlight([...summaries].sort((a, b) => b.acc - a.acc)[0]),
    worstAccuracyGame: insHighlight([...summaries].sort((a, b) => a.acc - b.acc)[0])
  };

  report.notes = insBuildNotes(report);
  return report;
}
