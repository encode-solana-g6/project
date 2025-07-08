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
          PAYER = "${env.WD}/.cache/keys/payer.json";
          SOLANA_CONFIG_PATH = "${env.WD}/.cache/config.yml";
          CACHE_DIR = "${env.WD}/.cache";
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
          await_net = ''until sol balance 2>&1 | grep -q "SOL"; do sleep 1; echo "Waitiing for validator..."; done && echo "Validator ready at $(${bin.getnet})" '';
          logs = ''await_net; sol logs'';
          mkKeys = ''if [ ! -f "${env.PAYER}" ]; then  solana-keygen new --no-bip39-passphrase --outfile "${env.PAYER}"; fi '';
          sol = ''set -x; mkKeys; solana --config "${env.SOLANA_CONFIG_PATH}" $@ '';

          setenv = ''set -x; mkKeys; sol config set --url "$1" --keypair "${env.PAYER}" '';
          getnet = ''sol config get | grep -oP 'RPC URL: \K.*' '';
          setdevnet = ''set -x; if [[ "$(${bin.getnet})" != *"devnet"* ]]; then ${bin.setenv} devnet; fi'';
          setlocal = ''set -x; if [[ "$(${bin.getnet})" != *"local"* ]]; then ${bin.setenv} localhost; fi'';

          # FOR ALL PROGRAMS
          exports = ''set -x; 
            export PKG="''${1-''${PKG}}"
            export PROG_DIR="$(find ${wd}/programs -maxdepth 1 -type d -name "*$PKG*")"
            export PROG_NAME="''${PKG//-/_}" 
            export TARGET_DIR="${wd}/target" 
            export PROG_KEYS="$TARGET_DIR/deploy/$PKG-keypair.json" '';
          build = ''set -x; ${exports};
            if [[ "$PROG_DIR" == *native* ]]; 
              then cargo-build-sbf -- --package "$PKG" 
            fi
            if [[ "$PROG_DIR" == *anchor* ]]; then
              if [ ! -d "node_modules" ]; then yarn install; fi 
              anchor build --program-name "$PROG_NAME" 
              # anchor idl build --program-name "$PROG_NAME" 
            fi
          '';
          deploy = ''set -x; ${exports}; airdrop; await_net;
            if [[ "$PROG_DIR" == *native* ]]; then
              sol program-v4 deploy --program-keypair "$(progKeysOf $PKG)" "''${env.PROGRAMS_PATH}/$PKG.so";  
            fi
            if [[ "$PROG_DIR" == *anchor* ]]; then
              # anchor deploy --program-name "$PROG_NAME" --program-keypair "$PROG_KEYS" ''${env.ANCHOR_EXTRA_ARGS}
              sol program-v4 deploy --program-keypair "$PROG_KEYS" "${wd}/target/deploy/$PKG.so"
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

          addrOfKeys = ''solana address --keypair "$1" '';
          myAddr = ''solana address --keypair "${env.PAYER}"'';
          myBal = ''set -x; sol balance --lamports --no-address-labels | awk '{print $1}' '';
          airdrop = ''set -x; mkKeys; await_net; if [ "$(${bin.myBal})" -lt 5000000000 ]; then mkKeys; sol airdrop 5; fi'';


          cleanup = ''set -x; 
            rm -r "${wd}/test-ledger"
            rm -r "${wd}/node_modules"
            rm -r "${wd}/target"
            rm -r "${env.CACHE_DIR}/keys"
            rm -r "${env.CACHE_DIR}/config.yml"
          '';

          dev = mkDev ''set -x; setlocal; export PKG="anchor_init"; build; deploy;'';

          web = ''cd web-app; yarn install; yarn dev'';

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
