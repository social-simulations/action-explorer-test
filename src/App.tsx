import "./App.css";
import { useEffect, useState } from "react";
import { Map } from "./components/Map";
import { Action, City } from "./types/types";
import { fetchActionExplorerData } from "./api/actionService";

function App() {
  const [actions, setActions] = useState<Action[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActionExplorerData()
      .then((result) => {
        setCities(result.cities);
        setActions(result.actions);
      })
      .catch((fetchError) => {
        console.error("Failed to fetch API data:", fetchError);
        setError("Failed to load data from API.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="App">Loading data...</div>;
  }

  if (error) {
    return <div className="App">{error}</div>;
  }

  return (
    <div className="App">
      <Map cities={cities} actions={actions} />
    </div>
  );
}

export default App;
