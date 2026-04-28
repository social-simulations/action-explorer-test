import "./App.css";
import { useEffect, useState } from "react";
import { Map } from "./components/Map";
import { Action, City, Tag, ThematicArea } from "./types/types";
import { fetchActionExplorerData } from "./api/actionService";

function App() {
  const [actions, setActions] = useState<Action[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [tags, setTags] = useState<Tag[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [thematicAreas, setThematicAreas] = useState<ThematicArea[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActionExplorerData()
      .then((result) => {
        setCities(result.cities);
        setActions(result.actions);
        setTags(result.tags);
        setThematicAreas(result.thematicAreas);
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
      <Map
        cities={cities}
        actions={actions}
        tags={tags}
        thematicAreas={thematicAreas}
      />
    </div>
  );
}

export default App;
