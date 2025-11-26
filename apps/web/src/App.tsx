import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameSocketProvider } from "./lib/websocket";
import { JoinPage } from "./pages/JoinPage";
import { GrimoirePage } from "./pages/GrimoirePage";
import { PlayerPage } from "./pages/PlayerPage";
import "./App.css";

function App() {
  return (
    <GameSocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<JoinPage />} />
          <Route path="/grimoire" element={<GrimoirePage />} />
          <Route path="/player/:lobbyId" element={<PlayerPage />} />
        </Routes>
      </BrowserRouter>
    </GameSocketProvider>
  );
}

export default App;
