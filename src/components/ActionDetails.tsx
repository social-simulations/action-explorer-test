import { Action } from "../types/types";
import "./actionDetails.css";

type ActionDetailsProps = {
  action: Action;
  onReturn: () => void;
};

export function ActionDetails({ action, onReturn }: ActionDetailsProps) {
  return (
    <div className="action-details">
      <button className="action-details-return" onClick={onReturn}>
        ← Return
      </button>
      <div className="action-details-content">
        <h1>{action.name}</h1>
        <div className="action-details-meta">
          <span className="action-details-area">{action.area}</span>
        </div>
        <div className="action-details-section">
          <h2>Investment Details</h2>
          <div className="action-details-row">
            <span className="label">Investment Cost:</span>
            <span className="value">
              ${action.investmentCost.toLocaleString()}
            </span>
          </div>
          <div className="action-details-row">
            <span className="label">Operational Cost Per Year:</span>
            <span className="value">
              ${action.operationalCostPerYear.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
