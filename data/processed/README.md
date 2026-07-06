# Processed corpus

`hf_legal_corpus.json.gz` is the HuggingFace-sourced legal corpus referenced by
`data/eval/results/REPRODUCIBILITY.json`. It ships compressed to stay under
GitHub's 100 MB file limit.

You do not need to decompress it manually — `data/rag_pipeline.py`
decompresses it to `hf_legal_corpus.json` on first load. To do it by hand:

```bash
gunzip -k data/processed/hf_legal_corpus.json.gz
```

The decompressed file's SHA-256
(`81a5cb32b19915ca7238900c7e240de628994bb0116abec1b79a7c8515944a53`)
matches the entry pinned in the reproducibility manifest.

Other files in this directory (`all_chunks.json`, `hf_legal_normalized.json`,
etc.) are intermediate build artifacts, gitignored, and regenerable via the
scripts in `data/`.
