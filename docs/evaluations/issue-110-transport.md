# Issue 110 transport qualification

Status: **QUALIFIED-PROTOTYPE** after driver inspection of one live invocation
on 2026-09-13. This qualifies the demonstrated synthetic delivery/result path;
final-schema compatibility and broad direction accuracy remain OUTSTANDING.

## Candidate and boundaries

The qualified prototype surface is one manual Node HTTP request to DeepSeek Chat Completions,
requesting exact alias `deepseek-flash`, with thinking disabled, no tool
definitions and `tool_choice: "none"`. The driver confirmed Codex authorship of the synthetic artifact and request.
DeepSeek was independent of that author family. Settings are experiment-specific;
they neither change review defaults nor qualify an untested downstream profile.

The [frozen design](../designs/specs/issue-110-direction-transport.md) owns the
contract, limits and final-schema handoff. The existing provider factory builds
one system and one user message. The request includes exact synthetic source
bytes, not a native diff shortcut or a reference the model must fetch.

| Capability | Current evidence |
| --- | --- |
| Deterministic request, path, artifact and result checks | Helper tests; these use mocks, not a provider. |
| Live packet/source delivery and concrete discrepancy judgment | Exact challenge returned; artifact subtraction correctly identified against the sum requirement. |
| Actual provider envelope identity and terminal behavior | Envelope `model: deepseek-flash`, HTTP 200, normal `stop`, exit 0. Alias only. |
| Fresh stateless request without prior transcript | Live exact body contained two messages and embedded sources, with no prior transcript or session identifier. |
| Complete tools-absent interface | Live body omitted tools and set `tool_choice: none`; no returned tool calls or execution dispatcher. |
| Final #109 packet/result contract | OUTSTANDING; prototype namespace is provisional. |
| Broad semantic direction accuracy | OUTSTANDING; not established by a transport challenge. |
| Author-host confinement and behavior trials | OUTSTANDING; [issue 98's limitations](issue-98-pilot.md) remain. |

## Invocation and evidence

The driver chooses an existing private directory under the current ignored run,
sets `AFK_QUALIFICATION_ROOT` to it, and supplies `DEEPSEEK_API_KEY` only through
the environment. The script never loads credential files. Preparation performs
no network I/O; each `probe` invocation needs its previously reserved slot.

```bash
node scripts/qualify-direction-transport.mjs prepare --fixture-root scripts/fixtures/direction-transport --out "$AFK_QUALIFICATION_ROOT/attempt-1"
node scripts/qualify-direction-transport.mjs probe --prepared "$AFK_QUALIFICATION_ROOT/attempt-1"
```

The driver wraps each `probe` process in a 150-second watchdog and preserves
stdout, stderr and exit status. The helper's HTTP abort is 120 seconds. Across
prototype and final-schema qualification, at most two attempts and 300 seconds
cumulative invocation time are available; inter-stage waiting does not reset
consumption. The complete request cap is 16384 bytes, output cap 8192 tokens and
response cap 131072 bytes. The planned USD 0.10 allowance is a spending decision,
not a billing guarantee. No paid call is authorized by this report.

`prepared.json` is the machine-readable candidate, limits and digest inventory.
`packet.json` embeds the evidence; `request.json` is the exact credential-free
HTTP body; `expected.json` is a withheld local oracle. `dispatch.json` refuses
reuse even after interruption. `response.json` preserves sanitized observations
and the original body digest when available; `result.json` separates extracted
content from its validation status; `terminal.json` records outcome, timing,
observed identity, usage and artifact bindings. Missing usage remains null.

Before changing this status, retain reviewed code revision, helper/request/source/
result digests, attempt reservation and terminal evidence, timestamps, consumed
elapsed time, actual exit status and human inspection of source delivery and
the concrete mismatch. Publish synthetic, sanitized evidence only. Observed
identity must come from the response envelope's `model`, separately from the
requested alias and local provenance; it does not attest provider weights.

The result update must distinguish `QUALIFIED-PROTOTYPE`, `NO-GO` and
`ENVIRONMENT-BLOCKED`, naming incomplete capabilities. First prototype success
preserves the second slot for final-schema revalidation. The #109/#111 owner
records final compatibility before integration acceptance; changed wire fields,
profiles or extraction require an unconsumed live slot. Exhaustion leaves
required-mode integration and paid behavior acceptance OUTSTANDING.

## Observed prototype and retained evidence

The driver inspected the complete prepared request and both embedded sources
before dispatch. The live result returned `canyon-lilac-47`, bound the packet,
phase and target digests, selected `CORRECT-COURSE`, and cited `artifact.mjs:2`:
`return left - right;`. Its finding recommended `left + right`, matching R1's
requirement for a sum. The top-level next action repeated the supplied review
question; the concrete correction appeared in finding F1. This is narrow
fixture evidence, not a general semantic accuracy score.

The helper emitted `CANDIDATE-PASS` and deliberately left qualification to the
driver. The driver checked source delivery, the concrete discrepancy, exact
envelope identity, empty tool interface and immutable artifact bindings before
recording this report's `QUALIFIED-PROTOTYPE` disposition. Provider alias identity
does not establish generation or weight identity. Stateless request construction
does not establish provider cache deletion.

| Binding | Value |
| --- | --- |
| Execution revision | `e070201a4d72329eb7cbde8901d429185e67b979` |
| Helper SHA-256 | `36d493fef33bedaa19b9388d8a3e2191ac8fd9e9b45a2dab0af88cc96ca5af05` |
| Packet SHA-256 | `c989d05d4c88835550bd9bd33f0cfc398c050935077d6a23896d76c86558cd82` |
| Request SHA-256 | `903e8abcdee39a3bcee2f5eb0e2bab30bd9521a584775e4b1936207cbc96d8fc` |
| Requirement source SHA-256 | `d8652678709f15d5d92bb8560a729f70d11088cb64190467485244667c8ea50d` |
| Artifact source SHA-256 | `4f554dc9dd1f89403b22180079e613acb83f34beb5175daa890405df8335b5f1` |
| Extracted result artifact SHA-256 | `eadc819a27419d7ab0a34faab21e3287a692210a8823db7d5110be9720e06376` |
| Sanitized response artifact SHA-256 | `3441dedfc41fcd8565859f52efa378bf86a89e9a61acd51d65c2bd5c41fee66a` |
| Original response-byte SHA-256 | `3f32168c56641e820056eee18a915561017b0ec5771a4e7d6a087eb3b59110ef` |

The live interval was 06:35:05.140–06:35:07.001 UTC; the driver charged
1900 milliseconds including process execution and publication. One of two
qualification slots is consumed, leaving one slot and 298100 milliseconds of
cumulative invocation allowance; the second call still has a 150-second process
limit. Raw usage reported 624 input tokens, 178 output tokens and zero cached
input tokens. Cache input is a subset of total input. At the recorded peak
rates, observed usage estimates USD 0.0004008; this is not a billing receipt.

The current private run retains the complete request, packet, withheld oracle,
prepared/dispatch/response/result/terminal artifacts, stdout/stderr and
driver-owned qualification accounting under attempt `issue110-qualification-1`.
The response observation redacts hash-shaped strings; the validated extracted
result retains binding hashes. Original and sanitized response digests therefore
refer to distinct byte sequences. No raw credential, private project source,
provider request identifier or local filesystem path is published here.

Required deterministic checks passed with 122 tests, including exact local
assertion classification, preexisting output refusal before dispatch and
concurrent-attempt arbitration. The required Markdown check passed. S110-3 is a
deferred P2: malformed non-JSON response text is sanitized, but its `redacted`
metadata can underreport that transformation. Such a response remains INVALID.

The next qualification owner must retain this consumed slot and revalidate the
final #109/#111 protocol. Changed wire fields, prompts, thinking settings,
delivery or extraction require the remaining live slot before integration
acceptance. Neither successful PR reviews nor this provisional result can
substitute. The report update follows the execution revision without changing
helper, fixtures or dependency bytes; the driver retains that carryforward
verification. Author-host confinement and behavior acceptance remain OUTSTANDING.
