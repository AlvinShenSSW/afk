# Full-history audit qualification history

The current profile passed a source-bound negative and positive pair over the
complete controlled core history on the numbered current-evidence projection.
Both requests retained exact original source bytes and every prior audit
context. This qualifies the represented history and A6 correction for the
current profile only; a changed prompt, setting or runtime file invalidates it.

| Observation | Request bytes | Prior audits | Outcome |
| --- | ---: | ---: | --- |
| Missing integer guard and A6 regression | 183864 | 2 | CORRECT-COURSE, A6-INTEGER-GUARD |
| Guard and A6 regression corrected | 227475 | 3 | COMPLETE, no findings |

The two initial historical audits were controlled fixtures with zero provider
calls. The negative and positive checks each made one actual request; the
provider reported model `deepseek-flash` with finish `stop` for
both. Usage was 52689 input and 2194 output tokens for the
negative request and 65478 input and 2494 output tokens
for the positive request; cached input is a subset of input. Original confined
checks independently observed A6 fail before the correction and all six
acceptance checks pass afterward. Every current and historical exact citation,
source binding and reconstructed request passed production validation.

## Corrections demonstrated by earlier attempts

Four earlier attempts on the same full-history packet at the provider default
temperature each failed strict validation for a different reason, and each
failure is retained unchanged:

| Attempt | Invalid response | Cause | Correction |
| --- | --- | --- | --- |
| 1 | Negative | Multiline artifact anchor declared its start one line after the quoted opening brace | Prompt: prefer the smallest sufficient single-line anchor; multiline bounds must match the quoted lines |
| 2 | Positive | A 3261-character single line of escaped JSON in driver-rendered history was copied as a prefix | Prompt: copy every cited line completely; render driver history as readable multi-line text |
| 3 | Positive | Invariant rows cited source-kind request evidence in artifacts | Prompt: invariants are supported by retained-record artifact lines, otherwise uncertain |
| 4 | Negative | Top-level JSON object closed one brace early despite JSON mode | Request setting: temperature 0 |

No validator, formatter or response was weakened or edited; no failed attempt
was retried unchanged. Each correction changed the profile, so only the final
pair above qualifies the current profile.

The qualification proves that the auditor can consume complete relevant history
with exact current citations. It is not a reliability rate, an author-behavior
result or an endpoint approval for any original subject. COMPLETE refers to the
measurement target. Flash auditing and any Flash review role are correlated
uses of the same model. Direction remains off by default.

The machine-readable qualification record binds the exact runtime profile,
request, response, result and this report. Retained local artifacts preserve the
complete requests, responses, original captures and the rejected attempts; raw
sessions and local paths are not published.
