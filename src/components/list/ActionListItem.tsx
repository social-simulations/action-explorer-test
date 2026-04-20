import { Action } from "../../types/types";

type ActionListItemProps = {
  action: Action;
  onDetails?: (actionId: string | number) => void;
};

export function ActionListItem({ action, onDetails }: ActionListItemProps) {
  return (
    <div className="action-list-item">
      <div className="action-list-item-content">
        <h4>{action.name}</h4>
      </div>
      <button
        className="action-list-item-details-btn"
        onClick={() => onDetails?.(action.id)}
        aria-label={`View details for ${action.name}`}
      >
        ›
      </button>
    </div>
  );
}
