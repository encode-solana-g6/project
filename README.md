# Collection of Solana programs & UI

## Programs

- `anchor_init`: A simple program that prints "Greetings from: anchor_init"
- `anchor-voting`: A voting program

## Development

Needs: Rust stable 1.87+, Solana CLI, Anchor CLI, and optionally Nix.

> <details>
> <summary>
>   How to install these ?
> </summary>
>
> - **Via Anchor installer** (also installs Rust, solana-cli):  
>     ```sh
>     curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
>     ```
>
> - **Via Nix**:  
>     1. Install Nix:  
>         ```sh
>         curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install --no-confirm
>         ```
>     2. Then run in the `solana-bootcamp-project` folder:  
>         ```sh
>         nix develop
>         ```
>
> - **Manual installation**:  
>     1. Install Rust:  
>         ```sh
>         curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
>         ```
>     2. Install Solana CLI:  
>         ```sh
>         sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
>         ```
>     3. Install Anchor:  
>         ```sh
>         cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
>         avm install latest
>         avm use latest
>         ```
> 
> </details>

<br/>

In the background:
- Start the local solana cluster: `solana-test-validator --reset`
- Start the web UI: `(cd web-app; yarn install; yarn dev)`

Then:
- Build the anchor programs: `anchor build`
- Deploy the anchor programs: `anchor deploy`
- (optional) Run the tests: `anchor test`
- Try it via the web UI: [http://localhost:4321/](http://localhost:4321/)