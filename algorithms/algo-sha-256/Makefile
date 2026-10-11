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
