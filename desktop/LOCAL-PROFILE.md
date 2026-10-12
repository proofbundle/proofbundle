# Local ProofBundle profile

The desktop custody directory may contain `local-profile.json`. This configuration remains outside the application repository. Without a profile, live filesystem navigation works, existing retained records load, and archive source adapters have no configured personal sources.

```json
{
  "schema": "ProofBundleLocalProfile/v1",
  "sources": {},
  "registry": "/absolute/path/ALGORITHM_REGISTRY.json",
  "snapshots": [],
  "bridge_ledger": "/absolute/path/ledger.jsonl",
  "scripts": [],
  "reports": {}
}
```

`registry`, `bridge_ledger`, snapshot entries, and source database values name local paths. `reports` can map `cryptoAuditReport` and `snapshotTestReport` to retained receipt files. The profile is loaded when the desktop storage process starts. An explicit empty source map disables source databases. Snapshot membership is read from the profile rather than assuming two snapshots.

This computer displays live directory membership using runtime home and mounted filesystem discovery. Pages contain at most 100 matching entries and do not descend recursively. Filtering applies to names in the current directory. The filesystem's directory order can change between page requests; each page has its own observation time. Symlink metadata retains the link path and target reference. Selecting a directory follows that navigation choice; selecting a file or Show reveals its path in the system Files application. There is no background recursive content import.

Directory metadata observations are retained through ProofBundle's existing signed custody recorder. Actual bytes enter the retained archive through Capture artifacts. Past counts and determinations are immutable observations of specific captures and runs, not application constants or a claim to cover the computer. HTML execution receipts carry the application hash; an edited application labels earlier receipts as historical.
