#!/bin/bash
# Create copyleft repo for individual algorithm

set -e

ALGO_ID="$1"
ALGO_FAMILY="$2"
ALGO_STATUS="$3"

if [ -z "$ALGO_ID" ] || [ -z "$ALGO_FAMILY" ]; then
    echo "Usage: create-algorithm-repo.sh <algo-id> <family> [status]"
    exit 1
fi

ALGO_STATUS="${ALGO_STATUS:-ACTIVE}"
REPO_NAME="algo-$(echo "$ALGO_ID" | tr '[:upper:]' '[:lower:]' | tr '/' '-' | tr ' ' '-')"
REPO_DIR="algorithms/$REPO_NAME"

echo "Creating repository for $ALGO_ID..."

# Create directory structure
mkdir -p "$REPO_DIR"/{src,proofs/{lean,rocq,fstar,isabelle},vectors/{standard,hostile},ground-truths,zk-proofs,docs}

# Create README
cat > "$REPO_DIR/README.md" << README_EOF
# $ALGO_ID

**Family:** $ALGO_FAMILY  
**Status:** $ALGO_STATUS  
**License:** AGPL-3.0-or-later (copyleft)

## Structure

- \`src/\` - Reference implementations (C, Rust, Python, JavaScript)
- \`proofs/\` - Formal proofs in Lean 4, Rocq, F*, Isabelle
- \`vectors/\` - Test vectors (standard and hostile)
- \`ground-truths/\` - Ground truth verification package
- \`zk-proofs/\` - Zero-knowledge proofs
- \`docs/\` - Documentation and specifications

## Requirements

- Zero axioms in formal proofs
- Zero sorry/admit in formal proofs
- Comprehensive hostile test vectors
- Complete ground truth package
- ZK proofs of correctness and security

## Verification

\`\`\`bash
# Verify formal proofs
cd proofs/lean && lake build
cd proofs/rocq && coq_makefile -f _CoqProject && make
cd proofs/fstar && fstar.exe *.fst
cd proofs/isabelle && isabelle build -D .

# Run test vectors
cd vectors && ./run-all.sh

# Verify ground truths
cd ground-truths && ./verify.sh

# Verify ZK proofs
cd zk-proofs && ./verify.sh
\`\`\`
README_EOF

# Create AGPL-3.0 license
cat > "$REPO_DIR/LICENSE" << 'LICENSE_EOF'
                    GNU AFFERO GENERAL PUBLIC LICENSE
                       Version 3, 19 November 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The GNU Affero General Public License is a free, copyleft license
for software and other kinds of works, specifically designed to ensure
cooperation with the community in the case of network server software.

[Full AGPL-3.0 text would go here]
LICENSE_EOF

# Create .gitignore
cat > "$REPO_DIR/.gitignore" << 'GITIGNORE_EOF'
# Build artifacts
*.o
*.obj
*.exe
*.out
build/
dist/

# Proof artifacts
*.olean
*.vo
*.checked
*.proof

# Test artifacts
*.log
*.tmp
*.cache

# OS files
.DS_Store
Thumbs.db
GITIGNORE_EOF

# Create Makefile for proofs
cat > "$REPO_DIR/Makefile" << 'MAKEFILE_EOF'
.PHONY: all lean rocq fstar isabelle test verify clean

all: lean rocq fstar isabelle test

lean:
	cd proofs/lean && lake build

rocq:
	cd proofs/rocq && coq_makefile -f _CoqProject && make

fstar:
	cd proofs/fstar && fstar.exe *.fst

isabelle:
	cd proofs/isabelle && isabelle build -D .

test:
	cd vectors && ./run-all.sh

verify: all
	cd ground-truths && ./verify.sh
	cd zk-proofs && ./verify.sh

clean:
	rm -rf proofs/lean/build
	rm -rf proofs/rocq/*.vo
	rm -rf proofs/fstar/*.checked
	rm -rf proofs/isabelle/output
MAKEFILE_EOF

echo "Repository created at $REPO_DIR"
echo "Next steps:"
echo "  1. Implement reference implementations in src/"
echo "  2. Write formal proofs in proofs/"
echo "  3. Generate test vectors in vectors/"
echo "  4. Create ground truths in ground-truths/"
echo "  5. Build ZK proofs in zk-proofs/"
