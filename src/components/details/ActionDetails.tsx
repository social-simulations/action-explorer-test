import { Action, Tag, ThematicArea } from "../../types/types";
import "./action-details.css";
import "../list/action-list.css";

type ActionDetailsProps = {
  action: Action;
  tags: Tag[];
  thematicAreas: ThematicArea[];
  onReturn: () => void;
};

export function ActionDetails({
  action: {
    name,
    summary,
    description,
    investmentCost,
    operationalCostPerYear,
    ghgReductionBy2030,
    tagIds,
    thematicAreasLever,
    thematicAreasNonLever,
  },
  tags,
  thematicAreas,
  onReturn,
}: ActionDetailsProps) {
  const tagLabels = (tagIds ?? [])
    .map(
      (tagId) =>
        tags.find((tag) => tag.id.toString() === tagId.toString())?.name,
    )
    .filter((label): label is string => Boolean(label));

  const systemicLeverLabels = (thematicAreasLever ?? [])
    .map(
      (leverId) =>
        thematicAreas.find(
          (thematicArea) => thematicArea.id.toString() === leverId.toString(),
        )?.name,
    )
    .filter((label): label is string => Boolean(label));

  const fieldOfActionLabels = (thematicAreasNonLever ?? [])
    .map(
      (areaId) =>
        thematicAreas.find(
          (thematicArea) => thematicArea.id.toString() === areaId.toString(),
        )?.name,
    )
    .filter((label): label is string => Boolean(label));

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
            <p className="action-details-description">
              {summary || description || "No summary provided."}
            </p>
          </div>
        </section>

        <section className="action-details-section">
          <h2 className="action-details-section-title">Classifications</h2>
          <div className="action-details-card">
            <div className="action-details-area-row">
              <span className="action-details-area-label">Tags:</span>
              <span className="action-details-area-pill-container">
                {tagLabels.length > 0 ? (
                  tagLabels.map((label) => (
                    <span key={label} className="action-details-area-pill">
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="action-details-area-pill">-</span>
                )}
              </span>
            </div>
            <div className="action-details-area-row">
              <span className="action-details-area-label">Systemic Lever:</span>
              <span className="action-details-area-pill-container">
                {systemicLeverLabels.length > 0 ? (
                  systemicLeverLabels.map((label) => (
                    <span key={label} className="action-details-area-pill">
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="action-details-area-pill">-</span>
                )}
              </span>
            </div>
            <div className="action-details-area-row">
              <span className="action-details-area-label">
                Fields of Action:
              </span>
              <span className="action-details-area-pill-container">
                {fieldOfActionLabels.length > 0 ? (
                  fieldOfActionLabels.map((label) => (
                    <span key={label} className="action-details-area-pill">
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="action-details-area-pill">-</span>
                )}
              </span>
            </div>
          </div>
        </section>

        <section className="action-details-metrics">
          <div className="action-details-metric">
            <div className="action-details-metric-label">
              GHG emissions reduction by 2030:
            </div>
            <div className="action-details-metric-value">
              {ghgReductionBy2030 ?? "-"}
            </div>
          </div>
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
