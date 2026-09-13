# Issue 110 transport qualification

Status: **NOT RUN**. Deterministic helper tests do not qualify an independent
model invocation. No prototype or final-schema qualification is claimed here.
The driver updates this report after inspecting the implementation and retaining
the authorized experiment's evidence.

## Candidate and boundaries

The planned surface is one manual Node HTTP request to DeepSeek Chat Completions,
requesting exact alias `deepseek-flash`, with thinking disabled, no tool
definitions and `tool_choice: "none"`. The synthetic artifact has Codex author
provenance, subject to driver confirmation. Settings are experiment-specific;
they neither change review defaults nor qualify an untested downstream profile.

The [frozen design](../designs/specs/issue-110-direction-transport.md) owns the
contract, limits and final-schema handoff. The existing provider factory builds
one system and one user message. The request includes exact synthetic source
bytes, not a native diff shortcut or a reference the model must fetch.

| Capability | Current evidence |
| --- | --- |
| Deterministic request, path, artifact and result checks | Helper tests; these use mocks, not a provider. |
| Live packet/source delivery and concrete discrepancy judgment | NOT RUN |
| Actual provider envelope identity and terminal behavior | NOT RUN |
| Fresh stateless request without prior transcript | Local construction tested; live invocation NOT RUN. |
| Complete tools-absent interface | Local wire and output handling tested; live invocation NOT RUN. |
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
