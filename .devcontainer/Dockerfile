# ProofBundle — GitHub Codespaces / Dev Container image
# Based on the official Coq 8.18 image and adds Node.js 22 plus elan/Lean 4.11.0
# so the same container can run the Coq proof corpus, the Lean formal tree,
# and the Node/JavaScript crypto/test suites.

FROM coqorg/coq:8.18

USER root

# baseline tools
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      git \
      make \
      sudo \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Let the default Codespaces user run apt/opam without a password.
RUN echo "coq ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/coq && chmod 0440 /etc/sudoers.d/coq

# Return to the image's default user; Codespaces will use this account.
USER coq
WORKDIR /home/coq

# Install elan and the exact Lean 4 toolchain used by lean/lean-toolchain.
RUN curl -fsSL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -o /tmp/elan-init.sh \
 && chmod +x /tmp/elan-init.sh \
 && /tmp/elan-init.sh -y --default-toolchain leanprover/lean4:v4.11.0 \
 && rm -f /tmp/elan-init.sh

ENV PATH="/home/coq/.elan/bin:/home/coq/.local/bin:${PATH}"
