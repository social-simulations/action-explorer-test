import { Action } from "../../types/types";
import "./action-details.css";
import "../list/action-list.css";

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
      <div className="action-list-header">
        <button className="action-details-return" onClick={onReturn}>
          <span className="action-details-return-chevron">‹</span>
          <span>Return</span>
        </button>
      </div>
      <div className="action-details-content">
        <section className="action-details-section">
          <h2 className="action-details-section-title">City Climate Action</h2>
          <div className="action-details-card action-details-title-card">
            {name}
          </div>
        </section>

        <section className="action-details-section">
          <h2 className="action-details-section-title">Action Description</h2>
          <div className="action-details-card">
            <p className="action-details-description">{description}</p>
          </div>
        </section>

        <section className="action-details-section">
          <h2 className="action-details-section-title">Classifications</h2>
          <div className="action-details-card">
            <div className="action-details-area-row">
              <span className="action-details-area-label">Action Areas:</span>
              <span className="action-details-area-pill">{area}</span>
            </div>
          </div>
        </section>

        <section className="action-details-metrics">
          <div className="action-details-metric">
            <div className="action-details-metric-label">Investment cost</div>
            <div className="action-details-metric-value">
              ${investmentCost.toLocaleString()}
            </div>
          </div>
          <div className="action-details-metric">
            <div className="action-details-metric-label">Operational cost</div>
            <div className="action-details-metric-value">
              ${operationalCostPerYear.toLocaleString()}/year
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
