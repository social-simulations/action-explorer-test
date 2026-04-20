import { Action } from "../../types/types";

type ActionListItemProps = {
  action: Action;
  onDetails?: (actionId: string | number) => void;
};

export function ActionListItem({ action, onDetails }: ActionListItemProps) {
  return (
    <div key={action.id} className="action-list-item">
      <div className="action-list-item-content">
        <h4>{action.name}</h4>
        <p className="action-list-item-area">{action.area}</p>
        <div className="action-list-item-costs">
          <span>
            <strong>Investment:</strong> $
            {action.investmentCost.toLocaleString()}
          </span>
          <span>
            <strong>Yearly:</strong> $
            {action.operationalCostPerYear.toLocaleString()}
          </span>
        </div>
      </div>
      <button
        className="action-details-button"
        onClick={() => onDetails?.(action.id)}
      >
        Details
      </button>
    </div>
  );
}
