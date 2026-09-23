COQC ?= coqc
FILES := GPXBoundary GPXTemporal GPXDiachronic
EXPECTED := 42 23 18
all: $(addsuffix .vo,$(FILES))
%.vo: %.v
	$(COQC) -q $< 2>&1 | tee $*.coq.log
GPXTemporal.vo: GPXBoundary.vo
GPXDiachronic.vo: GPXTemporal.vo
check: all
	@echo "expected closed: 42 / 23 / 18"
	@for f in $(FILES); do \
	  printf "%-16s closed=%s axiom-dependent=%s\n" $$f \
	    $$(grep -c "Closed under the global context" $$f.coq.log || true) \
	    $$(grep -Ec "^(Axioms|Parameters):" $$f.coq.log || true); done
	@echo "--- forbidden axioms (must be empty) ---"
	@grep -h -E "propositional_extensionality|functional_extensionality|classic|proof_irrelevance" *.coq.log || echo "  none"
clean:
	rm -f *.vo *.vok *.vos *.glob .*.aux *.coq.log
.PHONY: all check clean
