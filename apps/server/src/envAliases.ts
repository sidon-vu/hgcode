// HGCode fork: accept HGCODE_* env vars as aliases for the upstream T3CODE_* names.
// An explicitly set T3CODE_* always wins, so upstream scripts and docs keep working.
// Must be imported before anything else reads process.env.
for (const [key, value] of Object.entries(process.env)) {
  if (value === undefined || !key.startsWith("HGCODE_")) continue;
  const upstreamKey = `T3CODE_${key.slice("HGCODE_".length)}`;
  if (process.env[upstreamKey] === undefined) process.env[upstreamKey] = value;
}
