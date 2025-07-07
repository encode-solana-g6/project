{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    solana = { url = "github:nmrshll-templates/solana"; inputs.nixpkgs.follows = "nixpkgs"; };
    rust-overlay = { url = "github:oxalica/rust-overlay"; inputs.nixpkgs.follows = "nixpkgs"; };
  };

  outputs = inputs@{ nixpkgs, flake-parts, solana, rust-overlay, ... }: with builtins; flake-parts.lib.mkFlake { inherit inputs; } {
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
          PAYER = "${env.WD}/.cache/keys/id.json";
          SOLANA_CONFIG_PATH = "${env.WD}/.cache/config.yml";
          CACHE_DIR = "${env.WD}/.cache";
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
            cmdPane = { cmd, paneCfg ? "" }: ''pane command="bash" ${paneCfg} {
                args "-c" "${cmd}"
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
                    ${cmdPane {cmd = "logs"; }}
                    pane
                  }
                }
                tab name="background" {
                  ${cmdPane {cmd = "localnet"; }}
                }
              }
            '';
          in
          '' zellij --config ${zellijConfig} --new-session-with-layout ${layout} '';

        wd = "$(git rev-parse --show-toplevel)";
        scripts = mapAttrs (name: txt: pkgs.writeScriptBin name txt) rec {
          localnet = ''solana-test-validator --reset'';
          await_net = ''until sol balance 2>&1 | grep -q "SOL"; do sleep 1; echo "Waitiing for validator..."; done && echo "Validator is ready"'';
          logs = ''await_net; sol logs'';
          mkKeys = ''if [ ! -f "${env.PAYER}" ]; then  solana-keygen new --no-bip39-passphrase --outfile "${env.PAYER}"; fi '';
          sol = ''set -x; mkKeys; solana --config "${env.SOLANA_CONFIG_PATH}" $@ '';

          setenv = ''set -x; sol config set --url "$1" '';
          getnet = ''sol config get | grep -oP 'RPC URL: \K.*' '';
          setdevnet = ''set -x; if [[ "$(net)" != *"devnet"* ]]; then setenv devnet; fi'';
          setlocal = ''set -x; if [[ "$(net)" != *"local"* ]]; then setenv localhost; fi'';

          # FOR ALL PROGRAMS
          prog_dir = ''find ${wd}/examples_baremetal ${wd}/examples_anchor -maxdepth 2 -type d -name "*$1*" '';
          exports = ''set -x; 
            export PKG="''${1-''${PKG}}"
            export PROG_DIR="$(prog_dir $PKG)"
            export PROG_NAME="''${PKG//-/_}" 
            export TARGET_DIR="$(dirname "$PROG_DIR")/target" '';
          build = ''set -x; ${exports};
            if [[ "$PROG_DIR" == *baremetal* ]]; 
              then cargo-build-sbf --manifest-path=${wd}/examples_baremetal/Cargo.toml -- --package "$PKG" 
            fi
            if [[ "$PROG_DIR" == *anchor* ]]; then
              cd "$PROG_DIR"
              if [ ! -d "node_modules" ]; then yarn install; fi 
              ANCHOR_LOG=true anchor build --program-name "$PROG_NAME"
              # mkdir -p "${env.CACHE_DIR}/$PKG"
              # --out ${env.CACHE_DIR}/hello-world/idl.json --out-ts ${env.CACHE_DIR}/hello-world/idl-ts.ts
              ANCHOR_LOG=true anchor idl build --program-name "$PROG_NAME" 
            fi
          '';
          deploy = ''set -x; ${exports}; 
            echo "PROG_DIR=$PROG_DIR" "TARGET_DIR=$TARGET_DIR" "PKG=$PKG"; exit 1
          airdrop; mk_prog_keys; await_net;
            sol program-v4 deploy --program-keypair "$(progKeysOf $PKG)" "''${env.PROGRAMS_PATH}/$PKG.so"; 
          '';
          show = ''set -x; ${exports};
            sol program-v4 show "$(addrOfKeys "$(progKeysOf $PKG)")"
          '';
          call = ''set -x; ${exports};
            cd "${wd}"; npm i
            ts-node "$PROG_DIR/client/main.ts"
          '';

          addrOfKeys = ''solana address --keypair "$1" '';
          myAddr = ''solana address --keypair "${env.PAYER}"'';
          myBal = ''set -x; sol balance --lamports --no-address-labels | awk '{print $1}' '';
          airdrop = ''set -x; mkKeys; await_net; if [ "$(${bin.myBal})" -lt 5000000000 ]; then mkKeys; sol airdrop 5; fi'';


          cleanup = ''set -x; 
            rm -r "${wd}/test-ledger"
          '';

        };
        bin = mapAttrs (k: _: "${scripts.${k}}/bin/${k}") scripts;

      in
      {
        devShells.default = pkgs.mkShellNoCC {
          inherit env;
          buildInputs = buildInputs ++ devInputs ++ (attrValues scripts);
          shellHook = ''
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
