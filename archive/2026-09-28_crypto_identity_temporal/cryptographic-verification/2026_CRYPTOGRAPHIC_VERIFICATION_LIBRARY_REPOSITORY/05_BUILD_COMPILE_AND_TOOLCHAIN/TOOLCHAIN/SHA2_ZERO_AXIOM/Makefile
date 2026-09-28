
# Makefile for crypto-sha2
# Unverified: This is a standard Makefile pattern, but has not been tested.

.PHONY: all build test test-sha256 test-sha512 test-all clean verify

all: build

build:
	lake build

test: test-all

test-sha256:
	lake exe test-sha256

test-sha512:
	lake exe test-sha512

test-all:
	lake exe test-all

verify:
	@echo "Running axiom verification..."
	@echo "Load Crypto.SHA256.Verification in a Lean REPL and run:"
	@echo "  #print axioms sha256_size"
	@echo "  #print axioms hmacSha256_size"
	@echo "  #print axioms paddingLength_spec"
	@echo "  #print axioms processBlock_size"
	@echo "  #print axioms expandSchedule_size"
	@echo "Expected output for each: '-- no axioms' or equivalent."

clean:
	lake clean
	rm -rf build
