import "./App.css";
import { Map } from "./components/Map";
import { actions } from "./data/actions";
import { cities } from "./data/cities";

function App() {
  return (
    <div className="App">
      <Map cities={cities} actions={actions} />
    </div>
  );
}

export default App;
