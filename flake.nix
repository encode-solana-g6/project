{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    solana = { url = "github:nmrshll-templates/solana"; inputs.nixpkgs.follows = "nixpkgs"; };
    rust-overlay = { url = "github:oxalica/rust-overlay"; inputs.nixpkgs.follows = "nixpkgs"; };
    nix-utils = { url = "github:nmrshll/nix-utils"; inputs.nixpkgs.follows = "nixpkgs"; };
  };

  outputs = inputs@{ nixpkgs, flake-parts, solana, rust-overlay, nix-utils, ... }: with builtins; flake-parts.lib.mkFlake { inherit inputs; } {
    systems = [ "x86_64-linux" "aarch64-darwin" ];

    perSystem = { pkgs, system, lib, ... }:
      let
        dbg = obj: trace (toJSON obj) obj;
        ownPkgs = {
          rust = pkgs.rust-bin.stable."1.87.0".default.override {
            extensions = [ "rust-src" "rust-analyzer" ];
            targets = [ ];
          };
        };
        env = {
          WD = getEnv "PWD";
          PAYER = "${env.WD}/.cache/keys/payer.json";
          SOLANA_CONFIG_PATH = "${env.WD}/.cache/config.yml";
          CACHE_DIR = "${env.WD}/.cache";
          IS_ANCHOR = true;
          ANCHOR_LOG = true;
          # ANCHOR_EXTRA_ARGS = ''--provider.cluster "$(${bin.getnet})" --provider.wallet "${env.PAYER}" '';
        };
        buildInputs = [ ];
        devInputs = [
          ownPkgs.rust
          solana.packages.${system}.solana-cli
          solana.packages.${system}.anchor-cli
          solana.packages.${system}.spl-token
          solana.packages.${system}.cargo-build-sbf
          pkgs.nodejs_24
          pkgs.nodePackages_latest.ts-node
          pkgs.yarn
          pkgs.pnpm
          pkgs.zellij
          pkgs.pkg-config # for finding openSSL
          pkgs.openssl.dev # Add openssl development package
        ];

        mkDev = cmd:
          let
            zellijConfig = pkgs.writeText "config.kdl" ''
              show_startup_tips false
              show_release_notes false
              keybinds {
                shared { 
                  bind "Ctrl Esc" { Quit; }
                  bind "Ctrl k" {
                    Run "bash" "-c" "zellij ka -y && zellij da -yf"
                  }
                }
              }
            '';
            cmdPane = { cmd, paneCfg ? "" }: ''pane command="zsh" ${paneCfg} {
                args "-c" "${replaceStrings [ "\"" ] [ "\\\"" ] cmd}"
              }'';
            layout = pkgs.writeText "layout.kdl" ''
              layout {
                default_tab_template { 
                  pane size=1 borderless=true { plugin location="zellij:tab-bar"; };
                  children
                }
                tab name="foreground" {
                  pane split_direction="vertical" {
                    ${cmdPane {cmd = cmd; }}
                    pane split_direction="horizontal" {
                      ${cmdPane {cmd = "${bin.logs}"; }}
                      pane size="20%"
                    }
                  }
                }
                tab name="background" {
                  pane split_direction="vertical" {
                    ${cmdPane {cmd = "${bin.localnet}"; }}
                    ${cmdPane {cmd = "${bin.web}"; }}
                  }
                }
              }
            '';
          in
          '' zellij --config ${zellijConfig} --new-session-with-layout ${layout} '';

        wd = "$(git rev-parse --show-toplevel)";
        scripts = mapAttrs (name: txt: pkgs.writeScriptBin name txt) rec {
          localnet = ''solana-test-validator --reset'';
          await_net = ''VALIDATOR_URL="$(${bin.getnet})"; until sol balance 2>&1 | grep -q "SOL"; do sleep 0.3; echo "Waitiing for validator... $VALIDATOR_URL"; done && echo "Validator ready at $VALIDATOR_URL" '';
          logs = ''await_net; sol logs'';
          mkKeys = ''if [ ! -f "${env.PAYER}" ]; then  solana-keygen new --no-bip39-passphrase --outfile "${env.PAYER}"; fi '';
          sol = ''set -x; mkKeys; solana --config "${env.SOLANA_CONFIG_PATH}" $@ '';

          setnet = ''set -x; mkKeys; sol config set --url "$1" --keypair "${env.PAYER}" '';
          getnet = ''sol config get | grep -oP 'RPC URL: \K.*' '';
          setdevnet = ''set -x; ${bin.setdotenv} devnet; if [[ "$(${bin.getnet})" != *"devnet"* ]]; then ${bin.setnet} devnet; fi'';
          setlocal = ''set -x; ${bin.setdotenv} local; if [[ "$(${bin.getnet})" != *"local"* ]]; then ${bin.setnet} localhost; fi'';

          # FOR ALL PROGRAMS
          exports = ''set -x; 
            export PKG="''${1-''${TEST_ONLY_PKG}}"
            export PROG_DIR="$(find ${wd}/programs -maxdepth 1 -type d -name "*$PKG*")"
            export PROG_NAME="''${PKG//-/_}" 
            export TARGET_DIR="${wd}/target" 
            export PROG_KEYS="$TARGET_DIR/deploy/$PROG_NAME-keypair.json" '';
          build = ''set -x; ${exports};
            if [ ! -d "node_modules" ]; then yarn install; fi 
            if [[ "$PROG_DIR" == *native* ]]; then cargo-build-sbf -- --package "$PKG"; fi
            if [[ $IS_ANCHOR ]]; then anchor build --program-name "$PROG_NAME"; fi
          '';
          deploy = ''set -x; ${exports}; airdrop; await_net;
            if [[ "$PROG_DIR" == *native* ]]; then
              sol program-v4 deploy --program-keypair "$(progKeysOf $PKG)" "''${env.PROGRAMS_PATH}/$PROG_NAME.so";  
            fi
            if [[ $IS_ANCHOR ]]; then
              # anchor deploy --program-name "$PROG_NAME" --program-keypair "$PROG_KEYS" ''${env.ANCHOR_EXTRA_ARGS}
              sol program-v4 deploy --program-keypair "$PROG_KEYS" "${wd}/target/deploy/$PROG_NAME.so"
              anchor keys sync --program-name "$PROG_NAME"
            fi
          '';
          show = ''set -x; ${exports};
            sol program-v4 show "$(addrOfKeys "$(progKeysOf $PKG)")"
          '';
          call = ''set -x; ${exports};
            cd "${wd}"; npm i
            ts-node "$PROG_DIR/client/main.ts"
          '';
          utest-pkg = ''set -x; ${exports}; cd "${wd}";
            anchor test --program-name "$PROG_NAME"
          '';
          itest = ''set -x; ${exports}; cd "${wd}"; 
            if [ ! -d "${wd}/node_modules" ]; then yarn install; fi
            anchor test --program-name "$PROG_NAME" --no-idl --skip-build --skip-deploy --skip-local-validator --provider.wallet "${env.PAYER}" 
          '';

          addrOfKeys = '' solana address - -keypair "$1" '';
          myAddr = '' solana address --keypair "${env.PAYER}" '';
          myBal = '' set - x; sol balance --lamports --no-address-labels | awk '{print $1}' '';
          airdrop = ''set -x; mkKeys; await_net; if [ "$(${bin.myBal})" -lt 5000000000 ]; then mkKeys; sol airdrop 5; fi'';


          cleanup = ''set -x; 
            rm -r "${wd}/test-ledger"
            rm -r "${wd}/node_modules"
            rm -r "${wd}/web-app/node_modules"
            rm -r "${wd}/web-app/test-ledger"
            rm -r "${wd}/web-app/styled-system"
            rm -r "${wd}/target"
            rm -r "${env.CACHE_DIR}/keys"
            rm -r "${env.CACHE_DIR}/config.yml"
            rm -r "${wd}/.anchor"
            rm -r "${wd}/.direnv"
          '';

          # COMMANDS
          utest-ts = ''if [ ! -d "node_modules" ]; then yarn install; fi; anchor test --provider.wallet "${env.PAYER}" '';
          dev = mkDev ''set -x; setlocal; build; deploy; ${bin.itest};'';
          web = ''cd web-app; yarn install; yarn panda codegen; yarn dev'';
          utest-rs = ''set -ex; ${exports}; build; cargo test --package "$PKG" -- --nocapture'';

          # DEBUG
          hist = ''ACCOUNT_ADDR="''${1-$ADDR}"; solana transaction-history $ACCOUNT_ADDR --url http://localhost:8899'';

        };
        bin = mapAttrs (k: v: "${v}/bin/${k}") (nix-utils.packages.${system} // scripts);

      in
      {
        devShells.default = pkgs.mkShellNoCC {
          inherit env;
          buildInputs = buildInputs ++ devInputs ++ (attrValues scripts);
          shellHook = ''
            ${bin.configure-editors}
            dotenv
          '';
        };
        _module.args.pkgs = import inputs.nixpkgs {
          inherit system;
          overlays = [ (import rust-overlay) ];
          config = { };
        };
      };
  };
}
