// The marker-block contract every external gate prints on stdout. The gate
// skills tell the reader to parse these exact strings, so the label is the only
// thing that varies between gates.
//
// A gate always emits a block — a skip, an error, and a review are all
// parseable outcomes. Exiting without one hands the caller silence to interpret.

import { DESIGN_VERDICTS, DIFF_VERDICTS } from './prompt.mjs';

// Review text is model output over attacker-influenced input (the diff under
// review). A body line that looks like a marker would terminate the block
// early for a strict parser and let a forged SKIPPED/verdict ride outside it.
// [A-Z]+ assumes single-word labels — true of all six gates; a multi-word
// label would need the class widened here.
const MARKER_LOOKALIKE = /^\s*===== (?:END )?[A-Z]+ REVIEW/;

// Built lazily and guarded: the vocabulary comes from another module (the
// point — a copy drifts), and a malformed export must surface as a marker
// block, never a markerless stack trace.
let verdictWords = null;
let verdictLabel = '';
function buildVerdictWords() {
  const words = [...DIFF_VERDICTS, ...DESIGN_VERDICTS];
  // The human-facing label is derived inside the same guard: a vocabulary
  // malformed in a spread-compatible way must not die later, markerless, in
  // the default error message.
  verdictLabel = words.join(' / ');
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`);
}

export function createProtocol({ label, slug, out = process.stdout, err = process.stderr }) {
  const start = `===== ${label} REVIEW (final message) =====`;
  const end = `===== END ${label} REVIEW =====`;

  // Trim FIRST, then sanitize: mapping before a trim would hand the trim the
  // sanitizer's own leading space on a first-line forgery and restore the
  // marker to column 0.
  function block(body) {
    const sanitized = String(body)
      .trim()
      .split('\n')
      .map((line) => (MARKER_LOOKALIKE.test(line) ? ` ${line}` : line))
      .join('\n');
    out.write(`${start}\n`);
    out.write(`${sanitized}\n`);
    out.write(`${end}\n`);
  }

  const protocol = {
    start,
    end,

    // A skip is not a failure: the gate is optional, so the caller continues.
    emitSkip(reason) {
      err.write(`[${slug}] skipped: ${reason}\n`);
      block(`SKIPPED: ${reason}`);
      process.exit(0);
    },

    emitReview(text) {
      block(text);
    },

    // The gate ran and could not produce a verdict. Never exits 0 — a caller
    // that only checks the exit code must not read this as a clean review.
    emitError(message, exitCode = 1) {
      err.write(`[${slug}] ${message}\n`);
      block(`ERROR: ${message}`);
      process.exit(exitCode || 1);
    },

    // Returns on success; only its error paths exit (via emitError) — the
    // per-gate exit tails after it stay live code.
    emitVerifiedReview(text, {
      requireVerdict = false,
      emptyMessage,
      missingVerdictMessage,
      exitCode = 1,
    } = {}) {
      const review = String(text ?? '').trim();
      if (!review) {
        protocol.emitError(
          emptyMessage || `${label} returned an empty review — an empty result is an error, not an empty approval.`,
          exitCode,
        );
      }
      if (requireVerdict) {
        if (!verdictWords) {
          try {
            verdictWords = buildVerdictWords();
          } catch (buildError) {
            protocol.emitError(
              `cannot review — the verdict vocabulary is not usable as a pattern: ${buildError.message}`,
              1,
            );
          }
        }
        if (!verdictWords.test(review)) {
          protocol.emitError(
            missingVerdictMessage
              || `${label} answered without the mandated verdict line (${verdictLabel}); the review is discarded rather than presented as a verdict.`,
            exitCode,
          );
        }
      }
      protocol.emitReview(review);
    },
  };
  return protocol;
}
