import { useState } from "react";
import { Action, City } from "../../types/types";
import "./action-list.css";

type ActionListProps = {
  actions: Action[];
  cities: City[];
  onActionDetails?: (actionId: string | number) => void;
};

export function ActionList({
  actions,
  cities,
  onActionDetails,
}: ActionListProps) {
  const [groupBy, setGroupBy] = useState<"city" | "area">("city");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string | number>>(
    new Set(),
  );

  const handleDetailsClick = (actionId: string | number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("actionId", actionId.toString());
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params}`,
    );
    onActionDetails?.(actionId);
  };

  const toggleGroupCollapse = (groupKey: string | number) => {
    const newCollapsedGroups = new Set(collapsedGroups);
    if (newCollapsedGroups.has(groupKey)) {
      newCollapsedGroups.delete(groupKey);
    } else {
      newCollapsedGroups.add(groupKey);
    }
    setCollapsedGroups(newCollapsedGroups);
  };

  // Group actions by city or area based on selection
  const groupedActions =
    groupBy === "city"
      ? cities
          .map((city) => ({
            label: city.name,
            key: city.id,
            actions: actions.filter((action) => action.cityId === city.id),
          }))
          .filter((group) => group.actions.length > 0)
      : // Group by area
        Object.entries(
          actions.reduce(
            (acc, action) => {
              if (!acc[action.area]) {
                acc[action.area] = [];
              }
              acc[action.area].push(action);
              return acc;
            },
            {} as Record<string, Action[]>,
          ),
        )
          .map(([area, areaActions]) => ({
            label: area,
            key: area,
            actions: areaActions,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="action-list">
      <div className="action-list-header">
        <div className="action-list-header-top">
          <p className="action-list-count">{actions.length} actions</p>
          <div className="action-list-header-controls">
            <label htmlFor="group-by-select">Group by:</label>
            <select
              id="group-by-select"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as "city" | "area")}
            >
              <option value="city">City</option>
              <option value="area">Area</option>
            </select>
          </div>
        </div>
      </div>
      <div className="action-list-content">
        {actions.length === 0 ? (
          <div className="action-list-empty">
            <p>No actions match your filters</p>
          </div>
        ) : (
          groupedActions.map((group) => (
            <div key={group.key} className="action-list-city-group">
              <div className="action-list-city-header">
                <h3>{group.label}</h3>
                <div className="action-list-city-header-right">
                  <button
                    className="action-list-group-toggle"
                    onClick={() => toggleGroupCollapse(group.key)}
                  >
                    {collapsedGroups.has(group.key) ? "Show" : "Hide"} items
                  </button>
                  <span className="action-list-city-count">
                    {group.actions.length}
                  </span>
                </div>
              </div>
              {!collapsedGroups.has(group.key) && (
                <div className="action-list-city-actions">
                  {group.actions.map((action) => (
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
                        onClick={() => handleDetailsClick(action.id)}
                      >
                        Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
