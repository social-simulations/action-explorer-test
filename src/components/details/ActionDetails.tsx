import { Action } from "../types/types";
import "./action-details.css";

type ActionDetailsProps = {
  action: Action;
  onReturn: () => void;
};

export function ActionDetails({
  action: { name, area, description, investmentCost, operationalCostPerYear },
  onReturn,
}: ActionDetailsProps) {
  return (
    <div className="action-details">
      <button className="action-details-return" onClick={onReturn}>
        ← Return
      </button>
      <div className="action-details-content">
        <h1>{name}</h1>
        <div className="action-details-meta">
          <span className="action-details-area">{area}</span>
        </div>
        <p className="action-details-description">{description}</p>
        <div className="action-details-section">
          <h2>Investment Details</h2>
          <div className="action-details-row">
            <span className="label">Investment Cost:</span>
            <span className="value">${investmentCost.toLocaleString()}</span>
          </div>
          <div className="action-details-row">
            <span className="label">Operational Cost Per Year:</span>
            <span className="value">
              ${operationalCostPerYear.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
