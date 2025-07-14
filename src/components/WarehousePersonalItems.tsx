import React, { useEffect, useState } from 'react';
import { fetchWarehouseItems, editWarehouseItem, deleteWarehouseItem, addWarehouseItem } from '../api/warehouseApi';
import { getSummarizedItems } from '../api/summarizedItemApi';
import { WarehouseItem } from '../types/warehouse';
import { SummarizedItem } from '../types/items_summary';
import { fetchAllUexSystems as fetchAllStations } from '../api/uexStationsApi';
import { fetchAllUexSystems as fetchAllPlanets } from '../api/uexPlanetsApi';

interface Props {
  user_id: string | null;
  gameVersion: string | null;
  summarizedItems: SummarizedItem[];
  items: WarehouseItem[];
  setItems: React.Dispatch<React.SetStateAction<WarehouseItem[]>>;
  addWarehouseItem: (item: WarehouseItem) => Promise<WarehouseItem>;
  editWarehouseItem: (id: string, item: WarehouseItem) => Promise<WarehouseItem>;
  deleteWarehouseItem: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

type IntentFilter = 'all' | 'LTB' | 'LTS' | 'N/A';

const WarehouseItems: React.FC<Props> = ({ user_id, gameVersion, summarizedItems, items, setItems, addWarehouseItem, editWarehouseItem, deleteWarehouseItem, loading, error }) => {
  // For Add New Location
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [addingLocation, setAddingLocation] = useState(false);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  // Fetch station and planet names for location suggestions
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        let planets = await fetchAllPlanets();
        // Filter out planets where is_available === 0 (ensure numeric check)
        if (Array.isArray(planets)) {
          planets = planets.filter(p => Number(p.is_available) !== 0);
        }
        const planetNames = Array.isArray(planets) ? planets.map(p => p.name) : [];
        console.log('Filtered planets:', planets);
        setAllLocations([...planetNames]);
      } catch (e) {
        setAllLocations([]);
      }
    };
    fetchLocations();
  }, []);
  // Handle Add New Location input changes
  const handleLocationInput = (value: string) => {
    setNewLocation(value);
    if (value.length > 0) {
      const filtered = allLocations.filter(loc =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setLocationSuggestions(filtered.slice(0, 8));
    } else {
      setLocationSuggestions([]);
    }
  };

  const handleLocationSuggestionClick = (loc: string) => {
    setNewLocation(loc);
    setLocationSuggestions([]);
  };

  const handleAddLocation = () => {
    if (!newLocation) return;
    setOpenLocations(prev => ({ ...prev, [newLocation]: true }));
    setAddingLocation(false);
    setShowAddLocation(false);
    setNewLocation('');
    setLocationSuggestions([]);
  };
  // items, setItems, loading, error are now props
  const [openLocations, setOpenLocations] = useState<Record<string, boolean>>({});
  const [newItem, setNewItem] = useState<Partial<WarehouseItem>>({
    commodity_name: '',
    location: '',
    total_scu: 0,
    total_value: 0,
    for_org: false,
  });
  const [locationInputSuggestions, setLocationInputSuggestions] = useState<string[]>([]);
  const [showLocationInputSuggestions, setShowLocationInputSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SummarizedItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverLocation, setDragOverLocation] = useState<string | null>(null);








  // Group filtered items by location




  // Group filtered items by location


  const [filterText, setFilterText] = useState('');
  const [intentFilter, setIntentFilter] = useState<IntentFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<WarehouseItem>>({});
  const [showAddRow, setShowAddRow] = useState(false);

  if (error) return <div>{error}</div>;

  // Only show items that belong to the current user (handle null user_id)
  const personalItems = items.filter(item => {
    if (!user_id) return false;
    // Compare as trimmed strings to avoid type/formatting issues
    return String(item.user_id).trim() === String(user_id).trim();
  });
  // Debug: log personalItems
  // console.log('personalItems', personalItems.length, personalItems);
  // Filtering logic
  const filteredItems = personalItems.filter(item => {
    const matchesText =
      item.commodity_name.toLowerCase().includes(filterText.toLowerCase()) ||
      item.location.toLowerCase().includes(filterText.toLowerCase());
    const matchesIntent =
      intentFilter === 'all' ||
      (intentFilter === 'LTB' && item.intent === 'LTB') ||
      (intentFilter === 'LTS' && item.intent === 'LTS') ||
      (intentFilter === 'N/A' && item.intent === 'N/A');
    return matchesText && matchesIntent;
  });


  // Group filtered items by location
  const itemsByLocation: Record<string, WarehouseItem[]> = {};
  filteredItems.forEach(item => {
    if (!itemsByLocation[item.location]) {
      itemsByLocation[item.location] = [];
    }
    itemsByLocation[item.location].push(item);
  });
  console.log("Items By Location: ", itemsByLocation)

  // Auto-expand all locations with items when itemsByLocation changes
  useEffect(() => {
    const locs = Object.keys(itemsByLocation);
    if (locs.length > 0) {
      setOpenLocations(prev => {
        // Only add new locations, don't close any the user has opened
        const updated = { ...prev };
        locs.forEach(loc => {
          if (!(loc in updated)) updated[loc] = true;
        });
        return updated;
      });
    }
  }, [Object.keys(itemsByLocation).join(",")]);

  const toggleLocation = (location: string) => {
    setOpenLocations(prev => ({
      ...prev,
      [location]: !prev[location],
    }));
  };

  const handleEditClick = (item: WarehouseItem) => {
    if (editingId === item.id) {
      setEditingId(null);
      setEditValues({});
    } else {
      setEditingId(item.id);
      setEditValues({ ...item });
    }
  };

  const handleEditChange = (field: keyof WarehouseItem, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    console.log("Edit Save")
    if (!editingId) return;
    const updatedItem = { ...editValues, id: editingId } as WarehouseItem;
    if (Number(updatedItem.total_scu) <= 0) {
      await deleteWarehouseItem(editingId);
      setItems(items => items.filter(i => i.id !== editingId));
    } else {
      const saved = await editWarehouseItem(editingId, updatedItem);
      setItems(items => items.map(i => (i.id === editingId ? saved : i)));
    }
    setEditingId(null);
    setEditValues({});
  };

  const handleAddChange = (field: keyof WarehouseItem, value: any) => {
    setNewItem(prev => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'commodity_name') {
      if (value.length > 0) {
        const filtered = summarizedItems.filter(item =>
          item.commodity_name.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 8)); // limit suggestions
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }

    if (field === 'location') {
      if (value.length > 0) {
        const filtered = allLocations.filter(loc =>
          loc.toLowerCase().includes(value.toLowerCase())
        );
        setLocationInputSuggestions(filtered.slice(0, 8));
        setShowLocationInputSuggestions(true);
      } else {
        setLocationInputSuggestions([]);
        setShowLocationInputSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (item: SummarizedItem) => {
    setNewItem(prev => ({
      ...prev,
      commodity_name: item.commodity_name,
      total_value: Math.max(item.price_buy_avg, item.price_sell_avg),
    }));
    setShowSuggestions(false);
  };

  const handleLocationInputSuggestionClick = (loc: string) => {
    setNewItem(prev => ({
      ...prev,
      location: loc,
    }));
    setShowLocationInputSuggestions(false);
  };

  const handleAddSave = async () => {
    if (!newItem.commodity_name || !newItem.location) return;
    // If quantity is 0 or less, do not add, and if an item with same name/location exists, delete it
    if (Number(newItem.total_scu) <= 0) {
      // Try to find an existing item with same commodity_name and location
      const existing = items.find(i => i.commodity_name === newItem.commodity_name && i.location === newItem.location);
      if (existing) {
        await deleteWarehouseItem(existing.id);
        setItems(items => items.filter(i => i.id !== existing.id));
      }
      setShowAddRow(false);
      setNewItem({
        id: new Date().getTime().toString(),
        commodity_name: '',
        location: '',
        total_scu: 0,
        total_value: 0,
        for_org: false,
      });
      return;
    }
    const itemToAdd = {
      ...newItem,
      id: new Date().getTime().toString(),
      user_id: user_id ?? '',
      patch: gameVersion, // or your default
    } as WarehouseItem;
    const saved = await addWarehouseItem(itemToAdd);
    setItems(items => [saved, ...items]);
    setOpenLocations(prev => ({ ...prev, [saved.location]: true }));
    setShowAddRow(false);
    setNewItem({
      id: new Date().getTime().toString(),
      commodity_name: '',
      location: '',
      total_scu: 0,
      total_value: 0,
      for_org: false,
    });
  };

  return (
    <div className="warehouse-items">
      <h2 style={{ textAlign: 'center' }}>Personal Warehouse Items</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
        <input
          type="text"
          placeholder="Filter items..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{
            width: 240,
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #333',
            background: '#222',
            color: '#fff',
            marginRight: '2rem'
          }}
        />
        <button
          style={{
            background: '#444',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '2px 7px',
            cursor: 'pointer',
            fontSize: '0.92rem',
            marginRight: '0.5rem',
            minWidth: '100px',
            textAlign: 'center',
          }}
          onClick={() => {
            const allExpanded = Object.keys(itemsByLocation).every(loc => openLocations[loc]);
            const newState: Record<string, boolean> = {};
            Object.keys(itemsByLocation).forEach(loc => { newState[loc] = !allExpanded; });
            setOpenLocations(newState);
          }}
        >
          {Object.keys(itemsByLocation).every(loc => openLocations[loc]) ? 'Collapse All' : 'Expand All'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            style={{
              background: intentFilter === 'all' ? '#666' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            onClick={() => setIntentFilter('all')}
          >All</button>
          <button
            style={{
              background: intentFilter === 'LTB' ? '#666' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            onClick={() => setIntentFilter('LTB')}
          >LTB</button>
          <button
            style={{
              background: intentFilter === 'LTS' ? '#666' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            onClick={() => setIntentFilter('LTS')}
          >LTS</button>
          <button
            style={{
              background: intentFilter === 'N/A' ? '#666' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            onClick={() => setIntentFilter('N/A')}
          >N/A</button>
        </div>
      </div>
      {/* Filter input on a new line */}
      <div style={{ margin: '0.5rem 0 1rem 0', width: '100%' }}>
        
      </div>
      {/* Add New Item form now appears below the button row */}
      {Object.keys(itemsByLocation).length === 0 && (
        <div style={{ marginTop: '1rem', color: '#aaa' }}>No items match your filter.</div>
      )}
      {/* + Location and Add New Item buttons row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0 1rem 0', width: '100%' }}>
        <button
          style={{
            background: '#2d7aee',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: 6
          }}
          onClick={() => {
            if (addingLocation) {
              setAddingLocation(false);
              setShowAddLocation(false);
              setNewLocation('');
              setLocationSuggestions([]);
            } else {
              setAddingLocation(true);
              setShowAddLocation(true);
              setNewLocation('');
            }
          }}
        >
          {'+ Location'}
        </button>
        <button
          style={{
            background: '#2d7aee',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: 6
          }}
          onClick={() => setShowAddRow(v => !v)}
        >
          Add New Item
        </button>
      </div>
      {addingLocation && (
        <table className="warehouse-table" style={{ width: '100%', margin: '0.5rem 0', borderCollapse: 'collapse', background: '#181a1b', borderRadius: 6 }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', position: 'relative' }} colSpan={4}>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => handleLocationInput(e.target.value)}
                  placeholder="Enter location name"
                  style={{ width: 180 }}
                  autoFocus
                  onFocus={() => { if (newLocation) setLocationSuggestions(locationSuggestions); }}
                  onBlur={() => setTimeout(() => setLocationSuggestions([]), 100)}
                />
                {locationSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#222',
                    border: '1px solid #444',
                    borderRadius: 4,
                    zIndex: 10,
                    width: '100%',
                    maxHeight: 180,
                    overflowY: 'auto',
                    color: '#fff',
                  }}>
                    {locationSuggestions.map(loc => (
                      <div
                        key={loc}
                        style={{ padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid #333' }}
                        onMouseDown={() => handleLocationSuggestionClick(loc)}
                      >
                        {loc}
                      </div>
                    ))}
                  </div>
                )}
              </td>
              <td style={{ textAlign: 'center', padding: '8px' }}>
                <button
                  style={{ background: '#2d7aee', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}
                  onClick={handleAddLocation}
                >Add</button>
                <button
                  style={{ marginLeft: 8, background: '#444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}
                  onClick={() => { setAddingLocation(false); setShowAddLocation(false); setNewLocation(''); setLocationSuggestions([]); }}
                >Cancel</button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
      {showAddRow && (
        <table className="warehouse-table" style={{ width: '100%', margin: '1rem 0', borderCollapse: 'collapse', background: '#181a1b', borderRadius: 6 }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', position: 'relative' }}>
                <input
                  type="text"
                  value={newItem.commodity_name}
                  onChange={e => handleAddChange('commodity_name', e.target.value)}
                  placeholder="Commodity Name"
                  style={{ width: 140 }}
                  title="The name of this item"
                  autoComplete="off"
                  onFocus={() => {
                    if (newItem.commodity_name) setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // allow click
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      background: '#222',
                      border: '1px solid #444',
                      borderRadius: 4,
                      zIndex: 10,
                      width: '100%',
                      maxHeight: 180,
                      overflowY: 'auto',
                      color: '#fff',
                    }}
                  >
                    {suggestions.map(item => (
                      <div
                        key={item.id}
                        style={{
                          padding: '4px 8px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #333',
                        }}
                        onMouseDown={() => handleSuggestionClick(item)}
                      >
                        {item.commodity_name}
                      </div>
                    ))}
                  </div>
                )}
              </td>
              <td style={{ padding: '8px', position: 'relative' }}>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={e => handleAddChange('location', e.target.value)}
                  placeholder="Location"
                  style={{ width: 120 }}
                  title="The station or location where the item is stored"
                  autoComplete="off"
                  onFocus={() => {
                    if (newItem.location) setShowLocationInputSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowLocationInputSuggestions(false), 100)}
                />
                {showLocationInputSuggestions && locationInputSuggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      background: '#222',
                      border: '1px solid #444',
                      borderRadius: 4,
                      zIndex: 10,
                      width: '100%',
                      maxHeight: 180,
                      overflowY: 'auto',
                      color: '#fff',
                    }}
                  >
                    {locationInputSuggestions.map(loc => (
                      <div
                        key={loc}
                        style={{ padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid #333' }}
                        onMouseDown={() => handleLocationInputSuggestionClick(loc)}
                      >
                        {loc}
                      </div>
                    ))}
                  </div>
                )}
              </td>
              <td style={{ padding: '8px' }}>
                <input
                  type="number"
                  value={newItem.total_scu}
                  onChange={e => handleAddChange('total_scu', Number(e.target.value))}
                  placeholder="Quantity"
                  style={{ width: 80, textAlign: 'right' }}
                  title="Total SCU (Standard Cargo Units) for this item"
                />
              </td>
              <td style={{ padding: '8px' }}>
                <input
                  type="number"
                  value={newItem.total_value}
                  onChange={e => handleAddChange('total_value', Number(e.target.value))}
                  placeholder="Value"
                  style={{ width: 80, textAlign: 'right' }}
                  title="Total value in aUEC for this item"
                />
              </td>
              <td style={{ textAlign: 'center', padding: '8px' }}>
                <select
                  value={newItem.intent ?? 'N/A'}
                  onChange={e => handleAddChange('intent', e.target.value)}
                  style={{ width: 80, padding: '2px 4px', borderRadius: 4 }}
                  title="Select the intent for this item"
                >
                  <option value="LTS">LTS</option>
                  <option value="LTB">LTB</option>
                  <option value="N/A">N/A</option>
                </select>
              </td>
              <td style={{ textAlign: 'center', padding: '8px' }}>
                <button onClick={handleAddSave} title="Save" style={{ fontSize: 18, marginLeft: 8 }}>🖫</button>
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {Object.keys(openLocations)
        .sort((a, b) => a.localeCompare(b))
        .map(location => (
          <div
            key={location}
            style={{
              marginBottom: '0rem',
              border: dragOverLocation === location ? '2px solid #2d7aee' : '1px solid #333',
              borderRadius: '6px',
              background: '#222'
            }}
            onDragOver={e => {
              e.preventDefault();
              setDragOverLocation(location);
            }}
            onDragLeave={() => setDragOverLocation(null)}
            onDrop={async e => {
              setDragOverLocation(null);
              if (!draggedItemId) return;
              // Find the item
              const item = items.find(i => i.id === draggedItemId);
              if (!item || item.location === location) return;
              const oldLocation = item.location;
              // Update location in backend and state
              const updated = { ...item, location };
              await editWarehouseItem(item.id, updated);
              setItems(items => {
                const newItems = items.map(i => (i.id === item.id ? updated : i));
                // If old location is now empty and not 'unk', remove it from openLocations
                const stillHasItems = newItems.some(i => i.location === oldLocation);
                if (!stillHasItems && oldLocation !== 'unk') {
                  setOpenLocations(prev => {
                    const copy = { ...prev };
                    delete copy[oldLocation];
                    return copy;
                  });
                }
                return newItems;
              });
              setDraggedItemId(null);
            }}
          >
            <div
              style={{
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                fontWeight: 'bold',
                background: '#181a1b',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                userSelect: 'none'
              }}
              onClick={() => toggleLocation(location)}
            >
              <span style={{ marginRight: '0.5rem' }}>
                {openLocations[location] ? '▼' : '►'}
              </span>
              {location}
            </div>
            {openLocations[location] && (
              <table className="warehouse-table" style={{ width: '100%', marginTop: '0', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Item Name</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Quantity</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Value(ea.)</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Intent</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {(itemsByLocation[location] || [])
                    .slice()
                    .sort((a, b) => a.commodity_name.localeCompare(b.commodity_name))
                    .map(item => (
                      <React.Fragment key={item.id}>
                        <tr
                          key={item.id}
                          draggable
                          onDragStart={() => setDraggedItemId(item.id)}
                          onDragEnd={() => setDraggedItemId(null)}
                        >
                          <td style={{ padding: '8px' }}>{item.commodity_name}</td>
                          <td style={{ textAlign: 'right', padding: '8px' }}>{item.total_scu}</td>
                          <td style={{ textAlign: 'right', padding: '8px' }}>{item.total_value}</td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>
                            <input
                              type="text"
                              value={item.intent || ''}
                              readOnly
                              style={{
                                width: 60,
                                textAlign: 'center',
                                background: 'transparent',
                                color: '#fff',
                                border: 'none',
                                outline: 'none',
                                fontWeight: 'bold'
                              }}
                            />
                          </td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>
                            <button onClick={() => handleEditClick(item)}>✎</button>
                          </td>
                        </tr>
                        {editingId === item.id && (
                          <tr>
                            <td colSpan={5} style={{ background: '#181a1b', padding: '8px' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center'  }}>
                                <input
                                  type="text"
                                  value={editValues.commodity_name ?? ''}
                                  onChange={e => handleEditChange('commodity_name', e.target.value)}
                                  style={{ width: 200, marginRight: '1rem' }} 
                                  placeholder="Item Name"
                                />
                                <input
                                  type="number"
                                  value={editValues.total_scu ?? ''}
                                  onChange={e => handleEditChange('total_scu', Number(e.target.value))}
                                  style={{ width: 80, textAlign: 'right', marginRight: '2.5rem' }}
                                  placeholder="Quantity"
                                />
                                <input
                                  type="number"
                                  value={editValues.total_value ?? ''}
                                  onChange={e => handleEditChange('total_value', Number(e.target.value))}
                                  style={{ width: 80, textAlign: 'right', marginRight: '1.25rem' }}
                                  placeholder="Value"
                                />
                                <select
                                  value={editValues.intent ?? 'N/A'}
                                  onChange={e => handleEditChange('intent', e.target.value)}
                                  style={{ width: 80, marginRight: '2.25rem', padding: '2px 4px', borderRadius: 4 }}
                                >
                                  <option value="LTS">LTS</option>
                                  <option value="LTB">LTB</option>
                                  <option value="N/A">N/A</option>
                                </select>
                                <button onClick={handleSave} title="Save" style={{ fontSize: 18, marginLeft: 8 }}>🖫</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  {/* If no items, show nothing (empty table) */}
                </tbody>
              </table>
            )}
          </div>
        ))}
    </div>
  );
};

export default WarehouseItems;