// The point model and the deterministic tally. Pure functions over the
// state object; no IO here. The orchestrator (an LLM) extracts critiques
// into the structured input this module validates; every state transition
// of a concern happens here and nowhere else.

import { CouncilError } from "./store.mjs";

export const CONCERN_STATES = new Set([
  "carried",
  "fix pending",
  "agreed",
  "withdrawn",
  "deadlocked",
  "open verification",
  "verified",
  "user decision",
  "applied",
  "rejected",
  "open"
]);

export const SETTLED = new Set(["agreed", "withdrawn", "verified", "applied", "rejected"]);
export const VERDICTS = new Set(["AGREE", "AGREE WITH CHANGE", "REBUT", "MISSING"]);
export const OPS = new Set(["replace", "insert-after", "delete", "none"]);
export const SEVERITIES = new Set(["major", "minor", "refinement"]);
export const USER_LINE_PATTERN = /\[USER\]|\(user approved/;

function seatByName(state, name) {
  const seat = state.seats.find((s) => s.name === name);
  if (!seat) {
    throw new CouncilError("UNKNOWN_SEAT", `unknown seat "${name}"`);
  }
  return seat;
}

export function activeSeats(state, round) {
  const r = state.rounds[round];
  return r ? r.seats : state.roster;
}

export function otherSeats(state, round, seatName) {
  return activeSeats(state, round).filter((s) => s !== seatName);
}

// ---------------------------------------------------------------- validation
function validateEdit(edit, where) {
  if (!edit || typeof edit !== "object") {
    throw new CouncilError("BAD_INPUT", `${where}: edit must be an object`);
  }
  if (!OPS.has(edit.op)) {
    throw new CouncilError("BAD_INPUT", `${where}: edit.op must be one of ${[...OPS].join("|")}`);
  }
  if (edit.op !== "none" && (typeof edit.anchor !== "string" || edit.anchor.trim() === "")) {
    throw new CouncilError("BAD_INPUT", `${where}: edit.anchor must be non-empty text for op ${edit.op}`);
  }
  if ((edit.op === "replace" || edit.op === "insert-after") && (typeof edit.text !== "string" || edit.text === "")) {
    throw new CouncilError("BAD_INPUT", `${where}: edit.text is required for op ${edit.op}`);
  }
  const touchesUserLine =
    (edit.anchor && USER_LINE_PATTERN.test(edit.anchor)) || (edit.text && USER_LINE_PATTERN.test(edit.text));
  if (edit.op !== "none" && touchesUserLine && !["none", "contradicts"].includes(edit.userLineImpact)) {
    throw new CouncilError(
      "BAD_INPUT",
      `${where}: the edit touches a user-owned line; set userLineImpact to "none" (meaning preserved) or "contradicts"`
    );
  }
  if (edit.userLineImpact != null && !["none", "contradicts"].includes(edit.userLineImpact)) {
    throw new CouncilError("BAD_INPUT", `${where}: userLineImpact must be "none" or "contradicts"`);
  }
  return {
    op: edit.op,
    anchor: edit.op === "none" ? null : edit.anchor,
    text: edit.op === "replace" || edit.op === "insert-after" ? edit.text : null,
    userLineImpact: edit.userLineImpact ?? null
  };
}

// ---------------------------------------------------------------- ids
function nextConcernId(state, round, seatLetter) {
  state.nextConcernNumber ??= {};
  const key = `R${round}-${seatLetter}`;
  const n = (state.nextConcernNumber[key] ?? 0) + 1;
  state.nextConcernNumber[key] = n;
  return `${key}-${n}`;
}

function nextEditId(concern) {
  const letter = String.fromCharCode("a".charCodeAt(0) + concern.edits.length);
  return `${concern.id}/${letter}`;
}

function addEdit(concern, seatName, round, rawEdit) {
  const edit = {
    id: nextEditId(concern),
    proposedBy: seatName,
    round,
    ...rawEdit,
    stances: { [seatName]: { stance: "accepts", round, reason: "proposed it" } },
    status: "open"
  };
  concern.edits.push(edit);
  return edit;
}

function log(concern, round, text) {
  concern.history.push({ round, note: text });
}

// ---------------------------------------------------------------- ingest
// One call per seat critique of a round. Records concerns, verdicts and
// verification answers; changes no concern state (tally does that).
export function ingestCritique(state, round, seatName, input) {
  const seat = seatByName(state, seatName);
  const r = state.rounds[round];
  if (!r) {
    throw new CouncilError("BAD_STATE", `round ${round} does not exist`);
  }
  if (!r.seats.includes(seatName)) {
    throw new CouncilError("BAD_INPUT", `seat ${seatName} is not active in round ${round}`);
  }
  if (r.ingested?.[seatName]) {
    throw new CouncilError("ALREADY_INGESTED", `seat ${seatName} was already ingested for round ${round}`);
  }
  r.ingested ??= {};
  const report = { concernsAdded: [], merged: [], duplicates: [], verdicts: 0, verifications: 0, unverifiable: [] };

  const concerns = Array.isArray(input.concerns) ? input.concerns : [];
  const verdicts = Array.isArray(input.verdicts) ? input.verdicts : [];
  const verifications = Array.isArray(input.verifications) ? input.verifications : [];
  const unverifiable = Array.isArray(input.unverifiable) ? input.unverifiable : [];

  if (!input.noConcerns && concerns.length === 0 && verdicts.length === 0 && verifications.length === 0 && unverifiable.length === 0) {
    throw new CouncilError("BAD_INPUT", `seat ${seatName}: empty input; set noConcerns: true if the seat explicitly raised nothing`);
  }

  // -- verdicts on carried items (rounds 2+ and reopened points)
  const expected = new Map((r.carriedTo?.[seatName] ?? []).map((item) => [item.concern, item]));
  const seen = new Set();
  for (const v of verdicts) {
    const concern = state.concerns[v.concern];
    if (!concern) {
      throw new CouncilError("BAD_INPUT", `verdict names unknown concern ${v.concern}`);
    }
    if (!expected.has(v.concern)) {
      throw new CouncilError("BAD_INPUT", `concern ${v.concern} was not carried to ${seatName} in round ${round}`);
    }
    if (seen.has(v.concern)) {
      throw new CouncilError("BAD_INPUT", `two verdicts for ${v.concern} from ${seatName}`);
    }
    seen.add(v.concern);
    if (!VERDICTS.has(v.verdict)) {
      throw new CouncilError("BAD_INPUT", `verdict for ${v.concern} must be one of ${[...VERDICTS].join("|")}`);
    }
    const target = expected.get(v.concern);
    const editId = v.edit ?? target.edit ?? null;
    const edit = editId ? concern.edits.find((e) => e.id === editId) : null;
    if (editId && !edit) {
      throw new CouncilError("BAD_INPUT", `verdict for ${v.concern} names unknown edit ${editId}`);
    }
    if (v.verdict === "AGREE WITH CHANGE" && !v.newEdit) {
      throw new CouncilError("BAD_INPUT", `AGREE WITH CHANGE on ${v.concern} needs newEdit`);
    }
    if (v.verdict === "REBUT" && !(typeof v.reason === "string" && v.reason.trim())) {
      throw new CouncilError("BAD_INPUT", `REBUT on ${v.concern} needs a reason`);
    }
    concern.verdictsThisRound ??= {};
    const record = { verdict: v.verdict, edit: editId, reason: v.reason ?? null, position: v.position ?? null, round };
    if (v.verdict === "AGREE WITH CHANGE") {
      const ne = addEdit(concern, seatName, round, validateEdit(v.newEdit, `newEdit for ${v.concern}`));
      record.newEdit = ne.id;
    }
    concern.verdictsThisRound[seatName] = record;
    if (v.position) {
      concern.positions[seatName] = v.position;
    }
    report.verdicts += 1;
  }
  for (const item of expected.keys()) {
    if (!seen.has(item)) {
      const concern = state.concerns[item];
      concern.verdictsThisRound ??= {};
      concern.verdictsThisRound[seatName] = { verdict: "MISSING", round };
    }
  }

  // -- verification answers
  const expectedVerifications = new Set((r.verificationsTo?.[seatName] ?? []).map((x) => x.concern));
  for (const ver of verifications) {
    const concern = state.concerns[ver.concern];
    if (!concern || concern.state !== "open verification") {
      throw new CouncilError("BAD_INPUT", `verification names ${ver.concern}, which is not an open verification`);
    }
    if (!expectedVerifications.has(ver.concern)) {
      throw new CouncilError("BAD_INPUT", `verification ${ver.concern} was not routed to ${seatName} in round ${round}`);
    }
    if (!["VERIFIED", "REFUTED", "UNVERIFIABLE"].includes(ver.result)) {
      throw new CouncilError("BAD_INPUT", `verification result for ${ver.concern} must be VERIFIED|REFUTED|UNVERIFIABLE`);
    }
    if (ver.result !== "UNVERIFIABLE" && !(typeof ver.source === "string" && ver.source.trim())) {
      throw new CouncilError("BAD_INPUT", `verification ${ver.concern}: VERIFIED/REFUTED needs a source`);
    }
    concern.verification.answers ??= {};
    const answer = { result: ver.result, source: ver.source ?? null, round, seat: seatName };
    if (ver.edit) {
      const e = addEdit(concern, seatName, round, validateEdit(ver.edit, `verification edit for ${ver.concern}`));
      answer.edit = e.id;
    }
    concern.verification.answers[seatName] = answer;
    report.verifications += 1;
  }

  // -- new concerns
  for (const [index, c] of concerns.entries()) {
    const where = `${seatName} concern #${index + 1}`;
    if (c.duplicateOf) {
      const original = state.concerns[c.duplicateOf];
      if (!original) {
        throw new CouncilError("BAD_INPUT", `${where}: duplicateOf names unknown concern ${c.duplicateOf}`);
      }
      original.duplicates.push({ seat: seatName, round, title: c.title ?? null });
      log(original, round, `${seatName} restated it — duplicate, not counted`);
      report.duplicates.push({ of: c.duplicateOf, seat: seatName });
      continue;
    }
    if (!(typeof c.title === "string" && c.title.trim()) || !(typeof c.text === "string" && c.text.trim())) {
      throw new CouncilError("BAD_INPUT", `${where}: title and text are required`);
    }
    const severity = c.severity ?? "major";
    if (!SEVERITIES.has(severity)) {
      throw new CouncilError("BAD_INPUT", `${where}: severity must be major|minor|refinement`);
    }
    const edit = c.edit ? validateEdit(c.edit, where) : null;
    if (c.sameAs) {
      // round 1 only: the same concern the other seat raised
      const existing = state.concerns[c.sameAs];
      if (!existing || existing.round !== round) {
        throw new CouncilError("BAD_INPUT", `${where}: sameAs must name a concern raised this round`);
      }
      if (existing.raisedBy.includes(seatName)) {
        throw new CouncilError("BAD_INPUT", `${where}: ${seatName} already raised ${c.sameAs}`);
      }
      existing.raisedBy.push(seatName);
      existing.examinedBy.push(seatName);
      existing.positions[seatName] = c.text;
      if (edit) {
        if (c.sameEdit && existing.edits.length) {
          existing.edits[0].stances[seatName] = { stance: "accepts", round, reason: "proposed the same edit" };
        } else {
          addEdit(existing, seatName, round, edit);
        }
      }
      log(existing, round, `also raised by ${seatName}${c.sameEdit ? " with the same edit" : edit ? " with a different edit" : ""}`);
      report.merged.push(existing.id);
      continue;
    }
    const id = nextConcernId(state, round, seat.letter);
    const concern = {
      id,
      round,
      seat: seatName,
      raisedBy: [seatName],
      examinedBy: [seatName],
      title: c.title.trim(),
      text: c.text.trim(),
      severity,
      relatedTo: c.relatedTo ?? null,
      state: "carried",
      edits: [],
      positions: { [seatName]: c.text.trim() },
      awaiting: [],
      carriedBack: false,
      history: [],
      duplicates: [],
      verification: null,
      userConflict: null,
      finalItem: null
    };
    if (edit) {
      addEdit(concern, seatName, round, edit);
    }
    log(concern, round, `raised by ${seatName}`);
    state.concerns[id] = concern;
    report.concernsAdded.push(id);
  }

  // -- UNVERIFIABLE claims become open-verification concerns
  for (const [index, u] of unverifiable.entries()) {
    if (!(typeof u.claim === "string" && u.claim.trim())) {
      throw new CouncilError("BAD_INPUT", `${seatName} unverifiable #${index + 1}: claim is required`);
    }
    const id = nextConcernId(state, round, seat.letter);
    const concern = {
      id,
      round,
      seat: seatName,
      raisedBy: [seatName],
      examinedBy: [seatName],
      title: `Verify: ${u.claim.trim().slice(0, 80)}`,
      text: u.text?.trim() || u.claim.trim(),
      severity: "major",
      relatedTo: u.relatedTo ?? null,
      state: "open verification",
      edits: [],
      positions: { [seatName]: `could not verify: ${u.claim.trim()}` },
      awaiting: [],
      carriedBack: false,
      history: [],
      duplicates: [],
      verification: { claim: u.claim.trim(), routedTo: null, answers: {}, result: null },
      userConflict: null,
      finalItem: null
    };
    log(concern, round, `${seatName} marked UNVERIFIABLE`);
    state.concerns[id] = concern;
    report.unverifiable.push(id);
  }

  r.ingested[seatName] = { at: new Date().toISOString(), noConcerns: Boolean(input.noConcerns), ...report };
  return report;
}

// ---------------------------------------------------------------- tally
function bothAccept(concern, edit, seats) {
  return seats.every((s) => edit.stances[s]?.stance === "accepts");
}

function anyUnknown(concern, seats) {
  return seats.some((s) => concern.verdictsThisRound?.[s]?.verdict === "MISSING");
}

function closeOthers(concern, keep, reason) {
  for (const e of concern.edits) {
    if (e.id !== keep.id && e.status === "open") {
      e.status = `superseded by ${keep.id}`;
      e.closedReason = reason;
    }
  }
}

function applyUserConflict(concern, edit, round) {
  const contradicts =
    edit.userLineImpact === "contradicts" ||
    (edit.op !== "insert-after" && edit.op !== "none" && edit.anchor && USER_LINE_PATTERN.test(edit.anchor));
  if (contradicts) {
    concern.state = "user decision";
    concern.userConflict = { edit: edit.id, at: round };
    concern.awaiting = [];
    log(concern, round, `agreed edit ${edit.id} changes a user-owned line — user decision (Hard rule 8)`);
    return true;
  }
  return false;
}

// Returns the list of {concern, edit} to apply this round and a summary.
// Every concern of the ledger is examined; verdicts recorded by ingest are
// consumed here. Order of ingestion never matters: everything is read at
// once.
export function tallyRound(state, round) {
  const r = state.rounds[round];
  const seats = r.seats;
  const summary = { agreed: [], withdrawn: [], fixPending: [], carried: [], deadlocked: [], userDecision: [], verified: [], openVerification: [], missing: [], newMajor: 0 };
  const toApply = [];
  const twoSeats = seats.length >= 2;

  for (const concern of Object.values(state.concerns)) {
    if (SETTLED.has(concern.state) || concern.state === "deadlocked" || concern.state === "user decision" || concern.state === "open") {
      continue;
    }

    // --- open verification
    if (concern.state === "open verification") {
      const answers = Object.values(concern.verification.answers ?? {}).filter((a) => a.round === round);
      const decisive = answers.find((a) => a.result === "VERIFIED" || a.result === "REFUTED");
      if (decisive) {
        concern.verification.result = decisive;
        concern.state = "verified";
        concern.awaiting = [];
        log(concern, round, `${decisive.result} by ${decisive.seat} (${decisive.source})`);
        summary.verified.push(concern.id);
        if (decisive.edit) {
          // The fact is settled; the resulting document change still needs
          // the other seat's acceptance: spawn a follow-up concern that
          // carries the edit, so the change is council-agreed, not unilateral.
          const edit = concern.edits.find((e) => e.id === decisive.edit);
          const follow = spawnFollowUp(state, round, concern, decisive.seat, edit, decisive);
          summary.carried.push(follow.id);
        }
        continue;
      }
      if (answers.length && answers.every((a) => a.result === "UNVERIFIABLE")) {
        concern.verification.routedTo = null;
        concern.verification.exhausted ??= [];
        for (const a of answers) {
          if (!concern.verification.exhausted.includes(a.seat)) {
            concern.verification.exhausted.push(a.seat);
          }
        }
        log(concern, round, `UNVERIFIABLE for ${answers.map((a) => a.seat).join(", ")}`);
      }
      summary.openVerification.push(concern.id);
      continue;
    }

    const isNew = concern.round === round;
    const missing = anyUnknown(concern, seats);
    if (missing) {
      summary.missing.push(concern.id);
    }

    // --- round 1 and newly raised concerns: nobody else has judged yet
    if (isNew) {
      if (concern.severity === "major") {
        summary.newMajor += 1;
      }
      if (concern.raisedBy.length >= 2 && twoSeats) {
        const shared = concern.edits.find((e) => e.status === "open" && bothAccept(concern, e, seats));
        if (shared) {
          concern.state = "agreed";
          concern.agreedEdit = shared.id;
          shared.status = "agreed";
          closeOthers(concern, shared, "another edit was accepted");
          concern.awaiting = [];
          log(concern, round, `both seats raised it with the same edit ${shared.id} — agreed`);
          if (!applyUserConflict(concern, shared, round)) {
            toApply.push({ concern: concern.id, edit: shared.id });
            summary.agreed.push(concern.id);
          } else {
            summary.userDecision.push(concern.id);
          }
        } else {
          concern.state = "fix pending";
          concern.awaiting = seats.filter((s) => concern.edits.some((e) => e.status === "open" && !e.stances[s]));
          log(concern, round, "both seats raised it with different edits — fix pending");
          summary.fixPending.push(concern.id);
        }
      } else {
        concern.state = "carried";
        concern.awaiting = otherSeats(state, round, concern.seat);
        summary.carried.push(concern.id);
      }
      continue;
    }

    // --- carried / fix pending concerns judged this round
    const verdicts = concern.verdictsThisRound ?? {};
    const judgedThisRound = Object.keys(verdicts).filter((s) => verdicts[s].verdict !== "MISSING");
    for (const s of judgedThisRound) {
      if (!concern.examinedBy.includes(s)) {
        concern.examinedBy.push(s);
      }
    }
    const reopened = concern.reopenedCycle != null && concern.reopenedRound === round;

    // record stances from verdicts
    for (const [s, v] of Object.entries(verdicts)) {
      if (v.verdict === "MISSING") {
        continue;
      }
      const edit = v.edit ? concern.edits.find((e) => e.id === v.edit) : null;
      if (v.verdict === "AGREE") {
        if (concern.carriedBack && s === concern.seat && !edit) {
          // the originator concedes the rebuttal
          concern.conceded = true;
        } else if (edit) {
          edit.stances[s] = { stance: "accepts", round, reason: v.reason ?? "AGREE" };
        }
      } else if (v.verdict === "REBUT") {
        if (edit) {
          edit.stances[s] = { stance: "rejects", round, reason: v.reason };
        }
        concern.rebuttals ??= [];
        concern.rebuttals.push({ seat: s, round, reason: v.reason, edit: edit?.id ?? null });
      } else if (v.verdict === "AGREE WITH CHANGE") {
        if (edit) {
          edit.stances[s] = { stance: "rejects", round, reason: `AGREE WITH CHANGE → ${v.newEdit}` };
        }
      }
    }

    if (missing) {
      // The seat's answer is unknown, not a vote: the concern keeps its
      // state and stays with that seat. Never a REBUT.
      concern.awaiting = seats.filter((s) => verdicts[s]?.verdict === "MISSING");
      log(concern, round, `no verdict from ${concern.awaiting.join(", ")} — kept ${concern.state}, not counted as a vote`);
      (concern.state === "fix pending" ? summary.fixPending : summary.carried).push(concern.id);
      delete concern.verdictsThisRound;
      continue;
    }

    // step 1: an edit both seats accept
    const accepted = concern.edits.filter((e) => e.status === "open" && bothAccept(concern, e, seats));
    if (accepted.length && twoSeats) {
      const chosen = accepted.sort((a, b) => a.id.localeCompare(b.id))[0];
      concern.state = "agreed";
      concern.agreedEdit = chosen.id;
      chosen.status = "agreed";
      closeOthers(concern, chosen, "another edit was accepted");
      concern.awaiting = [];
      log(concern, round, `edit ${chosen.id} accepted by both — agreed`);
      if (!applyUserConflict(concern, chosen, round)) {
        toApply.push({ concern: concern.id, edit: chosen.id });
        summary.agreed.push(concern.id);
      } else {
        summary.userDecision.push(concern.id);
      }
      delete concern.verdictsThisRound;
      continue;
    }

    // conceded carry-back
    if (concern.conceded) {
      concern.state = "withdrawn";
      concern.awaiting = [];
      for (const e of concern.edits) {
        if (e.status === "open") {
          e.status = "withdrawn";
        }
      }
      log(concern, round, `${concern.seat} conceded — withdrawn`);
      summary.withdrawn.push(concern.id);
      delete concern.verdictsThisRound;
      continue;
    }

    if (reopened) {
      // one exchange only: no mutual edit → deadlocked again
      concern.state = "deadlocked";
      concern.awaiting = [];
      log(concern, round, "reopened point: no edit accepted by both — deadlocked again");
      summary.deadlocked.push(concern.id);
      delete concern.verdictsThisRound;
      continue;
    }

    // step 2: a new edit proposed this round → fix pending, carried to
    // the seat that has not judged it
    const newEdits = concern.edits.filter((e) => e.status === "open" && e.round === round);
    if (newEdits.length) {
      concern.state = "fix pending";
      concern.awaiting = seats.filter((s) => newEdits.some((e) => !e.stances[s]));
      log(concern, round, `new edit(s) ${newEdits.map((e) => e.id).join(", ")} — fix pending, to ${concern.awaiting.join(", ")}`);
      summary.fixPending.push(concern.id);
      delete concern.verdictsThisRound;
      continue;
    }

    // step 3: rejected for the first time → one carry-back to the originator
    const rejectedThisRound = concern.edits.some((e) => e.status === "open" && Object.values(e.stances).some((st) => st.stance === "rejects" && st.round === round));
    if (rejectedThisRound && !concern.carriedBack) {
      concern.carriedBack = true;
      concern.state = "carried";
      concern.awaiting = [concern.seat];
      log(concern, round, `rebutted — carried back once to ${concern.seat}`);
      summary.carried.push(concern.id);
      delete concern.verdictsThisRound;
      continue;
    }

    // step 4: deadlocked
    concern.state = "deadlocked";
    concern.awaiting = [];
    log(concern, round, "no mutually accepted edit after the carry-back — deadlocked");
    summary.deadlocked.push(concern.id);
    delete concern.verdictsThisRound;
  }

  return { toApply, summary };
}

function spawnFollowUp(state, round, concern, seatName, edit, decisive) {
  const seat = seatByName(state, seatName);
  const id = nextConcernId(state, round, seat.letter);
  const follow = {
    id,
    round,
    seat: seatName,
    raisedBy: [seatName],
    examinedBy: [seatName],
    title: `Apply ${decisive.result.toLowerCase()} fact: ${concern.title.replace(/^Verify: /, "")}`,
    text: `${decisive.result} (${decisive.source}): ${concern.verification.claim}. Proposed document change follows.`,
    severity: "major",
    relatedTo: concern.id,
    state: "carried",
    edits: [],
    positions: { [seatName]: `${decisive.result} — ${decisive.source}` },
    awaiting: otherSeats(state, round, seatName),
    carriedBack: false,
    history: [{ round, note: `follows verification ${concern.id}` }],
    duplicates: [],
    verification: null,
    userConflict: null,
    finalItem: null,
    verifiedSource: decisive.source
  };
  const e = { ...edit, id: `${id}/a`, proposedBy: seatName, round, stances: { [seatName]: { stance: "accepts", round, reason: "proposed it" } }, status: "open" };
  follow.edits.push(e);
  state.concerns[id] = follow;
  return follow;
}

// ---------------------------------------------------------------- percentage
export function percentage(state) {
  const all = Object.values(state.concerns);
  if (all.length === 0) {
    return { settled: 0, total: 0, percent: null };
  }
  const settled = all.filter((c) => SETTLED.has(c.state)).length;
  return { settled, total: all.length, percent: Math.floor((settled * 1000) / all.length) / 10 };
}

// What goes into the next round's packets.
export function carriedLists(state, round) {
  const lists = {};
  const verifications = {};
  const frozen = [];
  for (const c of Object.values(state.concerns)) {
    if (c.state === "carried" || c.state === "fix pending") {
      for (const s of c.awaiting) {
        lists[s] ??= [];
        const openEdits = c.edits.filter((e) => e.status === "open" && !e.stances[s]);
        lists[s].push({ concern: c.id, edits: openEdits.map((e) => e.id), carriedBack: c.carriedBack && s === c.seat, reopened: c.reopenedRound === round });
      }
    } else if (c.state === "open verification" && c.verification.routedTo) {
      verifications[c.verification.routedTo] ??= [];
      verifications[c.verification.routedTo].push({ concern: c.id, claim: c.verification.claim });
    } else if (c.state !== "carried") {
      frozen.push({ id: c.id, title: c.title, state: c.state });
    }
  }
  return { lists, verifications, frozen };
}

// Route open verifications to a seat that can check them (the orchestrator
// names which seats have tools). Deterministic: first capable seat that has
// not already answered UNVERIFIABLE.
export function routeVerifications(state, round, capableSeats) {
  for (const c of Object.values(state.concerns)) {
    if (c.state !== "open verification") {
      continue;
    }
    const exhausted = new Set(c.verification.exhausted ?? []);
    const candidate = capableSeats.find((s) => !exhausted.has(s) && state.rounds[round].seats.includes(s));
    c.verification.routedTo = candidate ?? null;
  }
}

// ---------------------------------------------------------------- stop rule
export function stopCheck(state, round, summary) {
  const a = state.setup.answers;
  const pct = percentage(state);
  const all = Object.values(state.concerns);
  const unexaminedSingleSeat = all.some((c) => (c.state === "carried" || c.state === "fix pending") && c.examinedBy.length < 2 && state.rounds[c.round].seats.length < 2);
  const anythingOpen = all.some((c) => c.state === "carried" || c.state === "fix pending" || c.state === "open verification");
  const reasons = [];
  let stop = false;
  if (round >= a.roundLimit) {
    stop = true;
    reasons.push(`round limit ${a.roundLimit} reached`);
  }
  if (a.stopRule?.type === "percent") {
    if (round >= 2 && pct.percent != null && pct.percent >= a.stopRule.threshold && summary.newMajor === 0 && !unexaminedSingleSeat) {
      stop = true;
      reasons.push(`agreement ${pct.percent}% >= ${a.stopRule.threshold}%, no new major concern, nothing unexamined`);
    }
  } else if (a.stopRule?.type === "fixed") {
    if (round >= (a.roundTarget ?? a.roundLimit)) {
      stop = true;
      reasons.push(`round target ${a.roundTarget ?? a.roundLimit} reached`);
    } else if (round >= 2 && !anythingOpen && summary.newMajor === 0 && (summary.carried?.length ?? 0) === 0) {
      stop = true;
      reasons.push("nothing carried, nothing awaiting verification, no new concern");
    }
  }
  if (all.length === 0 && round >= 1) {
    stop = true;
    reasons.push("no concerns raised");
  }
  return { stop, reasons, percentage: pct, unexaminedSingleSeat };
}

// ---------------------------------------------------------------- final review
export function buildFinalItems(state, cycle) {
  const items = [];
  state.final ??= { cycles: [], nextItemNumber: 1 };
  for (const c of Object.values(state.concerns).sort((x, y) => x.id.localeCompare(y.id))) {
    if (SETTLED.has(c.state) || c.state === "open") {
      continue;
    }
    const options = [];
    const openEdits = c.edits.filter((e) => e.status === "open" || e.status === "agreed");
    if (c.state === "user decision") {
      const edit = c.edits.find((e) => e.id === c.userConflict.edit);
      options.push({ id: "keep", label: "Keep what I said", edit: null });
      options.push({ id: edit.id, label: `Take the council's change (${edit.id})`, edit: edit.id });
    } else {
      for (const e of openEdits) {
        options.push({ id: e.id, label: `${e.proposedBy}'s fix ${e.id}`, edit: e.id });
      }
      if (options.length === 0) {
        for (const [s, pos] of Object.entries(c.positions)) {
          options.push({ id: `position:${s}`, label: `${s}'s position (no document change)`, edit: null, position: pos });
        }
      }
    }
    options.push({ id: "leave-open", label: "Leave open", edit: "open" });
    options.push({ id: "drop", label: "Drop it", edit: null });
    const i = state.final.nextItemNumber;
    state.final.nextItemNumber += 1;
    c.finalItem = i;
    items.push({ i, concern: c.id, state: c.state, title: c.title, text: c.text, positions: c.positions, options, verdict: null });
  }
  return items;
}
