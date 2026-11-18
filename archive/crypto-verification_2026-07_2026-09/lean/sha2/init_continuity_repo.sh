
#!/bin/bash
# init_continuity_repo.sh
# Run this once to establish the continuity archive.

set -euo pipefail

REPO_NAME="${1:-continuity}"
ORIGIN_URL="${2:-}"

echo "Initializing continuity repository: $REPO_NAME"
mkdir -p "$REPO_NAME"
cd "$REPO_NAME"
git init

# Partition by domain, not by date.
mkdir -p manuscripts/{paper_i,paper_ii,paper_iii,the_gold_archetype}
mkdir -p proofs/{lean,rocq,coq,smt,z3,ml_kem,sha256}
mkdir -p sessions/{kimi,ok_computer,kimiclaw}
mkdir -p artifacts/{photos,screenshots,ots_anchors,ci_logs}
mkdir -p crypto/{implementations,test_vectors,verifier_bundles}
mkdir -p meta/{manifests,timestamps,merkle_roots}

# Establish the invariant manifest.
cat > meta/manifests/ARCHITECTURE.md << 'EOF'
# Continuity Archive Architecture

This repository maintains all intellectual output generated across sessions.
Directory structure is domain-partitioned to prevent chronological landfill.
Every commit must include a timestamp in ISO 8601 format.
Every file over 1MB must have a companion .sha256 file.
No binary blobs without provenance documentation.
EOF

# Establish the capture template for sessions.
cat > sessions/TEMPLATE.md << 'EOF'
# Session Capture Template

## Session Metadata
- Model Instance: 
- Timestamp Start: 
- Timestamp End: 
- Agent Tag: 
- Word Count Approximate: 

## Artifacts Produced
- 

## Critical Decisions / State Changes
- 

## Blockers / Failures
- 

## Next Pass Targets
- 
EOF

# Establish the gitignore to prevent pollution.
cat > .gitignore << 'EOF'
*.tmp
*.swp
*.DS_Store
node_modules/
__pycache__/
*.o
*.exe
*.dll
*.so
EOF

# Initial commit.
git add .
git commit -m "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Archive initialized. Domain-partitioned continuity repository established."

if [ -n "$ORIGIN_URL" ]; then
    git remote add origin "$ORIGIN_URL"
    git branch -M master
    git push -u origin master
    echo "Pushed to $ORIGIN_URL"
else
    echo "No origin URL provided. Add remote manually when ready."
fi

echo "Repository initialized at $(pwd)"
