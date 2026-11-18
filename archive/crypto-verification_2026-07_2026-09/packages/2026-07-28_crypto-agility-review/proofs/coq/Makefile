COQC ?= coqc
FILES := ProofBundleRegistry.v ProofBundleHybrid.v ProofBundleMerkle.v ProofBundleVerifier.v

.PHONY: all clean

all:
	@set -e; for file in $(FILES); do $(COQC) "$$file"; done

clean:
	@rm -f -- *.vo *.vos *.vok *.glob .*.aux
