import React from "react";
import { SummarizedItem } from "../../types/items_summary";

export type CargoItem = {
  commodity_name: string;
  scuAmount: number;
  avg_price: number;
};

interface CargoSectionProps {
  cargoList: CargoItem[];
  setCargoList: React.Dispatch<React.SetStateAction<CargoItem[]>>;
  warehouseFlags: { toWarehouse: boolean; forOrg: boolean }[];
  setWarehouseFlags: React.Dispatch<React.SetStateAction<{ toWarehouse: boolean; forOrg: boolean }[]>>;
  summarizedItems: SummarizedItem[];
  showCargoPicker: boolean;
  setShowCargoPicker: React.Dispatch<React.SetStateAction<boolean>>;
  cargoSearch: string;
  setCargoSearch: React.Dispatch<React.SetStateAction<string>>;
  selectedCargo: SummarizedItem | null;
  setSelectedCargo: React.Dispatch<React.SetStateAction<SummarizedItem | null>>;
  cargoQuantity: number;
  setCargoQuantity: React.Dispatch<React.SetStateAction<number>>;
  customCargoName: string;
  setCustomCargoName: React.Dispatch<React.SetStateAction<string>>;
  customCargoAvg: number;
  setCustomCargoAvg: React.Dispatch<React.SetStateAction<number>>;
  customCargoQty: number;
  setCustomCargoQty: React.Dispatch<React.SetStateAction<number>>;
  showCustomCargoMenu: boolean;
  setShowCustomCargoMenu: React.Dispatch<React.SetStateAction<boolean>>;
  addItemBtnRef: React.RefObject<HTMLButtonElement | null>;
  totalValue: number;
}

const CargoSection: React.FC<CargoSectionProps> = ({
  cargoList,
  setCargoList,
  warehouseFlags,
  setWarehouseFlags,
  summarizedItems,
  showCargoPicker,
  setShowCargoPicker,
  cargoSearch,
  setCargoSearch,
  selectedCargo,
  setSelectedCargo,
  cargoQuantity,
  setCargoQuantity,
  customCargoName,
  setCustomCargoName,
  customCargoAvg,
  setCustomCargoAvg,
  customCargoQty,
  setCustomCargoQty,
  showCustomCargoMenu,
  setShowCustomCargoMenu,
  addItemBtnRef,
  totalValue,
}) => {
  const addCargoItem = (item: CargoItem) => {
    setCargoList(list => [...list, item]);
    setWarehouseFlags(flags => [...flags, { toWarehouse: false, forOrg: false }]);
  };

  return (
    <div>
      <div style={{ marginBottom: "0.5em", display: "flex", flexDirection: "column", alignItems: "flex-start", position: "relative" }}>
        <div
          style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center"}}
        >
          <button
            ref={addItemBtnRef}
            type="button"
            tabIndex={-1}
            onClick={() => {
              setShowCargoPicker(true);
              setShowCustomCargoMenu(false);
            }}
            style={{
              background: "#2d7aee",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "2px 10px",
              fontSize: 16,
              cursor: "pointer"
            }}
            aria-label="Add Cargo"
          >
            Add Item
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustomCargoMenu(true);
              setShowCargoPicker(false);
            }} 
            style={{
              background: "#2d7aee",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "2px 10px",
              fontSize: 16,
              cursor: "pointer"
            }}
            aria-label="Add Custom Cargo"
          >
            Add Custom
          </button>
          <span style={{ marginLeft: 16, fontWeight: "bold", color: "#fff" }}>
            Total Value: {totalValue.toLocaleString()}
          </span>
          <span style={{ display: "block", fontSize: 12, color: "#bbb", marginBottom: 4 }}>
            If editing values, provide screenshot proof in media or the discord post of this hit.
          </span>
        </div>
        {/* Show CargoPicker or CustomCargoMenu in the same spot above the table */}
        {showCargoPicker && (
          <div style={{
            background: "#23272e",
            border: "1px solid #353a40",
            borderRadius: 8,
            padding: 16,
            marginBottom: 8, // Place above the table, not absolutely positioned
            width: "100%",
            zIndex: 20,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)"
          }}>
            <input
              type="text"
              placeholder="Search cargo..."
              value={cargoSearch}
              onChange={e => setCargoSearch(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <div style={{ maxHeight: 120, overflowY: "auto" }}>
              {summarizedItems
                .filter(item => item.commodity_name.toLowerCase().includes(cargoSearch.toLowerCase()))
                .map(item => (
                  <div key={item.commodity_name} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ flex: 1 }}>{item.commodity_name} (avg: {Math.max(item.price_buy_avg, item.price_sell_avg)})</span>
                    <input
                      type="number"
                      min={1}
                      value={selectedCargo?.commodity_name === item.commodity_name ? cargoQuantity : 1}
                      onFocus={() => {
                        setSelectedCargo(item);
                        setCargoQuantity(1);
                      }}
                      onChange={e => {
                        setSelectedCargo(item);
                        setCargoQuantity(Number(e.target.value));
                      }}
                      style={{ width: 60, marginRight: 8 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addCargoItem({ commodity_name: item.commodity_name, scuAmount: cargoQuantity, avg_price: Math.max(item.price_buy_avg, item.price_sell_avg) });
                        setCargoSearch("");
                        setSelectedCargo(null);
                        setCargoQuantity(1);
                      }}
                      style={{ background: "#2d7aee", color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", cursor: "pointer" }}
                    >Add</button>
                  </div>
                ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCargoPicker(false);
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }}
              style={{ marginTop: 8, background: "#444", color: "#fff", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        )}
        {showCustomCargoMenu && (
          <div style={{ background: "#23272e", border: "1px solid #353a40", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 120, color: "#bbb", fontSize: 13 }}>Item</span>
              <span style={{ width: 100, color: "#bbb", fontSize: 13 }}>Value</span>
              <span style={{ width: 80, color: "#bbb", fontSize: 13 }}>Quantity</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <input
                type="text"
                placeholder="Name"
                value={customCargoName}
                onChange={e => setCustomCargoName(e.target.value)}
                style={{ width: 120, marginRight: 0 }}
              />
              <input
                type="number"
                min={1}
                placeholder="Avg Value"
                value={customCargoAvg}
                onChange={e => setCustomCargoAvg(Number(e.target.value))}
                style={{ width: 100, marginRight: 0 }}
              />
              <input
                type="number"
                min={1}
                placeholder="Quantity"
                value={customCargoQty}
                onChange={e => setCustomCargoQty(Number(e.target.value))}
                style={{ width: 80, marginRight: 0 }}
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (!customCargoName.trim()) return;
                addCargoItem({
                  commodity_name: customCargoName.trim(),
                  scuAmount: customCargoQty,
                  avg_price: customCargoAvg
                });
                setCustomCargoName("");
                setCustomCargoQty(1);
                setCustomCargoAvg(1);
              }}
              style={{ background: "#2d7aee", color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", cursor: "pointer" }}
              disabled={!customCargoName.trim() || customCargoQty < 1 || customCargoAvg < 1}
            >
              Add
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowCustomCargoMenu(false);
                if (addItemBtnRef.current) addItemBtnRef.current.blur();
              }}
              style={{ marginLeft: 8, background: "#444", color: "#fff", border: "none", borderRadius: 4, padding: "2px 10px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        )}
        <table style={{ width: "100%", marginTop: 8, marginBottom: 8, background: "#23272e", borderRadius: 6 }}>
          {cargoList.length > 0 && (
            <thead>
              <tr>
                <th style={{ color: "#ccc", padding: 4, textAlign: "left" }}>Item</th><th style={{ color: "#ccc", padding: 4, textAlign: "right" }}>Value (total)</th><th style={{ color: "#ccc", padding: 4, textAlign: "right" }}>Quantity</th><th style={{ color: "#ccc", padding: 4, textAlign: "center" }}>For Org</th><th style={{ color: "#ccc", padding: 4, textAlign: "center" }}>To Warehouse</th><th></th>
              </tr>
            </thead>
          )}
          <tbody>
            {cargoList.map((cargo, idx) => (
              <tr key={cargo.commodity_name + idx}>
                <td style={{ padding: 4 }}>{cargo.commodity_name}</td><td style={{ padding: 4, textAlign: "right" }}>
                  <input
                    type="number"
                    min={0}
                    value={cargo.avg_price * cargo.scuAmount}
                    onChange={e => {
                      const newTotalValue = Number(e.target.value);
                      setCargoList(list =>
                        list.map((item, i) =>
                          i === idx
                            ? {
                                ...item,
                                avg_price: cargo.scuAmount > 0 ? newTotalValue / cargo.scuAmount : 0,
                              }
                            : item
                        )
                      );
                    }}
                    style={{ width: 100 }}
                  />
                </td><td style={{ padding: 4, textAlign: "right" }}>{cargo.scuAmount}</td><td style={{ padding: 4, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    className="large-checkbox"
                    checked={warehouseFlags[idx]?.forOrg || false}
                    disabled={!warehouseFlags[idx]?.toWarehouse}
                    onChange={e => {
                      setWarehouseFlags(flags =>
                        flags.map((flag, i) =>
                          i === idx ? { ...flag, forOrg: e.target.checked } : flag
                        )
                      );
                    }}
                  />
                </td><td style={{ padding: 4, textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setWarehouseFlags(flags =>
                        flags.map((flag, i) =>
                          i === idx
                            ? {
                                ...flag,
                                toWarehouse: !flag.toWarehouse,
                                forOrg: !flag.toWarehouse ? false : flag.forOrg,
                              }
                            : flag
                        )
                      );
                    }}
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 12,
                      border: "1px solid #888",
                      background: warehouseFlags[idx]?.toWarehouse ? "#2d7aee" : "#444",
                      position: "relative",
                      transition: "background 0.2s",
                      outline: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: warehouseFlags[idx]?.toWarehouse ? "flex-end" : "flex-start",
                    }}
                    aria-pressed={warehouseFlags[idx]?.toWarehouse}
                    aria-label="Toggle To Warehouse"
                  >
                    <span
                      style={{
                        display: "block",
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        transition: "transform 0.2s",
                        transform: warehouseFlags[idx]?.toWarehouse ? "translateX(0)" : "translateX(0)",
                      }}
                    />
                  </button>
                </td><td style={{ padding: 4 }}>
                  <button
                    type="button"
                    style={{ color: "#ff6b6b", background: "none", border: "none", cursor: "pointer" }}
                    onClick={(e) => {
                      e.preventDefault();
                      setCargoList(list => list.filter((_, i) => i !== idx));
                      setWarehouseFlags(flags => flags.filter((_, i) => i !== idx));
                    }}
                  >✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CargoSection;
