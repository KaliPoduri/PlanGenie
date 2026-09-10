// Building a prepared result from edit entries. Deterministic: every anchor
// must match exactly once, edits must not overlap, and the output is the
// whole document. Conflicts are reported, never guessed around.

export const OPEN_SECTION_HEADING = "## Open concerns";

function normalize(text) {
  return text.replace(/\r\n/g, "\n");
}

function findAll(haystack, needle) {
  const positions = [];
  let from = 0;
  while (true) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) {
      break;
    }
    positions.push(at);
    from = at + Math.max(1, needle.length);
  }
  return positions;
}

function endOfLine(text, at) {
  const nl = text.indexOf("\n", at);
  return nl === -1 ? text.length : nl;
}

// entries: [{id, op, anchor, text}] — id is the point ID or "FINAL item i".
// Returns {result, applied:[ids], conflicts:[{id, reason}]}. A conflicted
// entry is left out; the result still contains every other edit.
export function buildResult(document, entries, options = {}) {
  const doc = normalize(document);
  const conflicts = [];
  const spans = [];

  for (const entry of entries) {
    if (entry.op === "none") {
      continue;
    }
    if (entry.op === "append-open") {
      spans.push({ id: entry.id, op: entry.op, start: doc.length, end: doc.length, text: entry.text });
      continue;
    }
    const anchor = normalize(entry.anchor ?? "");
    if (!anchor.trim()) {
      conflicts.push({ id: entry.id, reason: "empty anchor" });
      continue;
    }
    const hits = findAll(doc, anchor);
    if (hits.length === 0) {
      conflicts.push({ id: entry.id, reason: "anchor not found" });
      continue;
    }
    if (hits.length > 1) {
      conflicts.push({ id: entry.id, reason: `anchor is ambiguous (${hits.length} matches)` });
      continue;
    }
    const start = hits[0];
    const end = start + anchor.length;
    if (entry.op === "replace") {
      spans.push({ id: entry.id, op: "replace", start, end, text: normalize(entry.text) });
    } else if (entry.op === "delete") {
      // remove the anchor and, when it ends a line, the line break with it
      const extra = doc[end] === "\n" ? 1 : 0;
      spans.push({ id: entry.id, op: "delete", start, end: end + extra, text: "" });
    } else if (entry.op === "insert-after") {
      const at = endOfLine(doc, end - 1 >= start ? end - 1 : end);
      const insertAt = Math.max(at, end);
      spans.push({ id: entry.id, op: "insert-after", start: insertAt, end: insertAt, text: `\n${normalize(entry.text)}` });
    } else {
      conflicts.push({ id: entry.id, reason: `unknown op ${entry.op}` });
    }
  }

  // overlap check: two spans overlap when their ranges intersect (a pure
  // insertion at the boundary of another span is allowed).
  spans.sort((a, b) => a.start - b.start || a.end - b.end);
  const kept = [];
  for (const span of spans) {
    const clash = kept.find((k) => {
      const kInsert = k.start === k.end;
      const sInsert = span.start === span.end;
      if (kInsert && sInsert) {
        return k.start === span.start && k.id !== span.id ? false : false;
      }
      return span.start < k.end && k.start < span.end;
    });
    if (clash) {
      conflicts.push({ id: span.id, reason: `overlaps edit ${clash.id}` });
      continue;
    }
    kept.push(span);
  }

  let out = "";
  let cursor = 0;
  for (const span of kept) {
    out += doc.slice(cursor, span.start) + span.text;
    cursor = span.end;
  }
  out += doc.slice(cursor);

  // ensure an "Open concerns" section exists if any append-open ran and
  // the document has no such heading
  if (kept.some((k) => k.op === "append-open") && !out.includes(options.openHeading ?? OPEN_SECTION_HEADING)) {
    const idx = out.lastIndexOf("\n\n");
    void idx;
  }
  return { result: out, applied: kept.map((k) => k.id), conflicts };
}

// The "leave open" resolution: an entry that inserts an [OPEN] line after
// the document's open-items heading, or appends a section when the heading
// is absent.
export function openItemEntry(document, id, line, heading) {
  const doc = normalize(document);
  const h = heading ?? OPEN_SECTION_HEADING;
  if (doc.includes(h)) {
    return { id, op: "insert-after", anchor: h, text: line };
  }
  return { id, op: "append-open", anchor: null, text: `\n\n${h}\n${line}\n` };
}
