import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";





export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h2>Counter</h2>
      <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
    </div>
  );
};

export const Voting: React.FC = () => {
  const [votes, setVotes] = useState(0);
  return (
    <div>
      <h2>Voting</h2>
      <button onClick={() => setVotes((votes) => votes + 1)}>votes are {votes}</button>
    </div>
  );
};

type NavBarProps = {
  setPage: (page: string) => void;
};
export const NavBar: React.FC<NavBarProps> = ({ setPage }) => {
  return (
    <nav>
      <ul>
        <li>
          <a href="#counter" onClick={() => setPage("counter")}>
            Counter
          </a>
        </li>
        <li>
          <a href="#voting" onClick={() => setPage("voting")}>
            Voting
          </a>
        </li>
      </ul>
    </nav>
  );
};

export const Layout: React.FC = () => {
  const [page, setPage] = useState("counter");

  return (
    <div>
      <h1>Welcome to the Bootcamp</h1>
      <NavBar setPage={setPage} />
      <main>
        {page === "counter" && <Counter />}
        {page === "voting" && <Voting />}
      </main>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Layout />
  </StrictMode>
);
