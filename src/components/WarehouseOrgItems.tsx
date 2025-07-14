import React, { useEffect, useState } from 'react';
import { fetchPublicOrgWarehouseItems, fetchPrivateOrgWarehouseItems, addWarehouseItem, editWarehouseItem, deleteWarehouseItem } from '../api/warehouseApi';
import { SummarizedItem } from '../types/items_summary';
import { WarehouseItem } from '../types/warehouse';

interface Props {
  user_id: string | null;
  gameVersion: string | null;
  summarizedItems: SummarizedItem[];
  isModerator: boolean;
  isMember: boolean;
  userList: any[];
  items: WarehouseItem[];
  setItems: React.Dispatch<React.SetStateAction<WarehouseItem[]>>;
  addWarehouseItem: (item: WarehouseItem) => Promise<WarehouseItem>;
  editWarehouseItem: (id: string, item: WarehouseItem) => Promise<WarehouseItem>;
  deleteWarehouseItem: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const intentColors: Record<string, string> = {
  LTB: '#2d7aee22', // blueish
  LTS: '#2dee7a22', // greenish
  'N/A': '#ee2d7a22', // reddish
};

const intentBorderColors: Record<string, string> = {
  LTB: '#2d7aee',
  LTS: '#2dee7a',
  'N/A': '#ee2d7a',
};


const WarehouseOrgItems: React.FC<Props> = ({ user_id, gameVersion, summarizedItems, isModerator, isMember, userList, items, setItems, addWarehouseItem, editWarehouseItem, deleteWarehouseItem, loading, error }) => {
  // items, setItems, loading, error are now props
  const [showAddRow, setShowAddRow] = useState(false);
  const [newItem, setNewItem] = useState<Partial<WarehouseItem>>({
    commodity_name: '',
    location: '',
    total_scu: 0,
    total_value: 0,
    intent: 'N/A',
    for_org: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<WarehouseItem>>({});
  const [suggestions, setSuggestions] = useState<SummarizedItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Add row handlers (moderator only)
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
        setSuggestions(filtered.slice(0, 8));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
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

  const handleAddSave = async () => {
    if (!newItem.commodity_name || !newItem.location) return;
    const itemToAdd = {
      ...newItem,
      id: new Date().getTime().toString(),
      user_id: user_id ?? '',
      patch: gameVersion,
      for_org: true,
    } as WarehouseItem;
    const saved = await addWarehouseItem(itemToAdd);
    setItems(items => [saved, ...items]);
    setShowAddRow(false);
    setNewItem({
      commodity_name: '',
      location: '',
      total_scu: 0,
      total_value: 0,
      intent: 'N/A',
      for_org: true,
    });
    setEditingId(saved.id); // Immediately editable
    setEditValues({ ...saved });
  };

  // Edit row handlers
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
    if (!editingId) return;
    // If quantity is 0, delete the item
    if (editValues.total_scu === 0) {
      try {
        await deleteWarehouseItem(editingId);
        setItems(items => items.filter(i => i.id !== editingId));
      } catch (err) {
        // Optionally handle error globally
      } finally {
        setEditingId(null);
        setEditValues({});
      }
      return;
    }
    // Otherwise, update the item
    const updatedItem = { ...editValues, id: editingId, for_org: true } as WarehouseItem;
    const saved = await editWarehouseItem(editingId, updatedItem);
    setItems(items => items.map(i => (i.id === editingId ? saved : i)));
    setEditingId(null);
    setEditValues({});
  };
  // loading and error are now props
  const [filterText, setFilterText] = useState('');
  const [intentFilter, setIntentFilter] = useState<'all' | 'LTB' | 'LTS' | 'N/A'>('all');
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'category' | 'list'>('category');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);


  // items, loading, error are now props; fetching is handled by parent

  // Show all org items (for_org === true) and all personal items (for_org === false)
  const orgAndPersonalItems = items.filter(item => item.for_org === true || item.for_org === false);
  // Filtering logic
  const filteredItems = orgAndPersonalItems.filter(item => {
    const matchesText =
      item.commodity_name.toLowerCase().includes(filterText.toLowerCase()) ||
      item.location.toLowerCase().includes(filterText.toLowerCase());
    const matchesIntent =
      intentFilter === 'all' || item.intent === intentFilter;
    return matchesText && matchesIntent;
  });

  // Sorting logic for List view
  const sortedItems = React.useMemo(() => {
    if (!sortConfig) return filteredItems;
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue: any;
      let bValue: any;
      switch (key) {
        case 'commodity_name':
          aValue = a.commodity_name || '';
          bValue = b.commodity_name || '';
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
          break;
        case 'location':
          aValue = a.location || '';
          bValue = b.location || '';
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
          break;
        case 'total_scu':
          aValue = a.total_scu ?? 0;
          bValue = b.total_scu ?? 0;
          break;
        case 'total_value':
          aValue = a.total_value ?? 0;
          bValue = b.total_value ?? 0;
          break;
        case 'intent':
          aValue = a.intent || '';
          bValue = b.intent || '';
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
          break;
        case 'for_org':
          aValue = a.for_org ? 1 : 0;
          bValue = b.for_org ? 1 : 0;
          break;
        case 'user_id':
          aValue = getOwnerName(a.user_id)?.toLowerCase?.() || '';
          bValue = getOwnerName(b.user_id)?.toLowerCase?.() || '';
          break;
        default:
          aValue = '';
          bValue = '';
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      } else {
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      }
    });
    return sorted;
  }, [filteredItems, sortConfig]);

  if (loading) return <div>Loading org warehouse items...</div>;
  if (error) return <div>{error}</div>;

  // Helper for rendering sort arrows
  const renderSortArrow = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // Handler for header click
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        // Toggle direction
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Get unique locations from filtered items
  const uniqueLocations = Array.from(new Set(filteredItems.map(item => item.location)));

  // Group items by location
  const itemsByLocation: Record<string, WarehouseItem[]> = {};
  uniqueLocations.forEach(loc => {
    itemsByLocation[loc] = filteredItems.filter(item => item.location === loc);
  });

  const toggleLocation = (location: string) => {
    setExpandedLocations(prev => ({
      ...prev,
      [location]: !prev[location],
    }));
  };

  // Helper to get owner display name
  const getOwnerName = (userId: string | null | undefined) => {
    if (!userId) return '';
    const user = userList.find((u: any) => u.id === userId);
    if (!user) return '';
    return user.nickname || user.username || '';
  };

  return (
    <div className="warehouse-items">
      <h2 style={{ textAlign: 'center' }}>Org Warehouse Items</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              marginRight: '2rem',
              fontSize: '1rem',
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
              const allExpanded = uniqueLocations.every(loc => expandedLocations[loc]);
              const newState: Record<string, boolean> = {};
              uniqueLocations.forEach(loc => { newState[loc] = !allExpanded; });
              setExpandedLocations(newState);
            }}
          >
            {uniqueLocations.every(loc => expandedLocations[loc]) ? 'Collapse All' : 'Expand All'}
          </button>
          <button
            style={{
              background: viewMode === 'list' ? '#666' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '2px 7px',
              cursor: 'pointer',
              fontSize: '0.92rem',
              minWidth: '70px',
              textAlign: 'center',
            }}
            onClick={() => setViewMode(viewMode === 'category' ? 'list' : 'category')}
          >
            {viewMode === 'category' ? 'List' : 'Category'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            style={{
              background: intentFilter === 'all' ? '#666' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '1rem',
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
              cursor: 'pointer',
              fontSize: '1rem',
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
              cursor: 'pointer',
              fontSize: '1rem',
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
              cursor: 'pointer',
              fontSize: '1rem',
            }}
            onClick={() => setIntentFilter('N/A')}
          >N/A</button>
        </div>
      </div>

      {/* Add New Item button on a new line below filter/sort controls */}
      {isModerator && (
        <div style={{ margin: '0.5rem 0 0.5rem 0', width: '100%' }}>
          <button
            style={{ background: '#2d7aee', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: '1rem' }}
            onClick={() => setShowAddRow(v => !v)}
          >
            Add New Item
          </button>
        </div>
      )}
      <div style={{ margin: '0.5rem 0 1rem 0', width: '100%' }}>
        {showAddRow && isModerator && (
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
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
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
                          style={{ padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid #333' }}
                          onMouseDown={() => handleSuggestionClick(item)}
                        >
                          {item.commodity_name}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '8px' }}>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={e => handleAddChange('location', e.target.value)}
                    placeholder="Location"
                    style={{ width: 120 }}
                    title="The station or location where the item is stored"
                    autoComplete="off"
                  />
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
      </div>
      {uniqueLocations.length === 0 && (
        <div style={{ color: '#aaa', textAlign: 'center', padding: 16 }}>No org items match your filter.</div>
      )}
      {viewMode === 'category' ? (
        <table className="warehouse-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#181a1b', borderRadius: 6, fontSize: '1.05rem' }}>
          <thead>
            <tr style={{ background: '#23272e', color: '#fff' }}>
              <th style={{ padding: '8px 6px', minWidth: 120 }}>Commodity</th>
              {/* <th style={{ padding: '8px 6px', minWidth: 100 }}>Location</th> */}
              <th style={{ padding: '8px 6px', minWidth: 60 }}>Qty</th>
              <th style={{ padding: '8px 6px', minWidth: 80 }}>Value</th>
              <th style={{ padding: '8px 6px', minWidth: 60 }}>Intent</th>
              <th style={{ padding: '8px 6px', minWidth: 100 }}>Owner</th>
            </tr>
          </thead>
          <tbody>
            {uniqueLocations.sort((a, b) => a.localeCompare(b)).map(location => (
              <React.Fragment key={location}>
                <tr>
                  <td colSpan={6}
                    style={{
                      background: '#222',
                      color: '#bfc7d5',
                      fontWeight: 500,
                      fontSize: '0.98rem',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderBottom: '1px solid #23272e',
                      userSelect: 'none',
                      letterSpacing: '0.01em',
                      lineHeight: 1.2,
                      minHeight: 0,
                    }}
                    onClick={() => toggleLocation(location)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>{location}</span>
                      <span style={{ fontSize: '1.05em', marginLeft: 8 }}>{expandedLocations[location] ? '▼' : '▶'}</span>
                    </div>
                  </td>
                </tr>
                {expandedLocations[location] && itemsByLocation[location].map(item => (
                  <React.Fragment key={item.id}>
                    <tr
                      key={item.id}
                      style={{
                        background: intentColors[item.intent] || '#333',
                        borderLeft: `4px solid ${intentBorderColors[item.intent] || '#444'}`,
                        color: '#fff',
                        fontWeight: 500,
                        fontSize: '1.05rem',
                      }}
                    >
                      <td style={{ padding: '8px 6px' }}>{item.commodity_name}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{item.total_scu}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{item.total_value?.toLocaleString?.() ?? ''}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>{item.intent}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>{getOwnerName(item.user_id)}</td>
                      {isModerator && (
                        <td style={{ textAlign: 'center', padding: '8px' }}>
                          <button onClick={() => handleEditClick(item)}>✎</button>
                        </td>
                      )}
                    </tr>
                    {editingId === item.id && isModerator && (
                      <tr>
                        <td colSpan={6} style={{ background: '#181a1b', padding: '8px' }}>
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
              </React.Fragment>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="warehouse-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#181a1b', borderRadius: 6, fontSize: '1.05rem' }}>
          <thead>
            <tr style={{ background: '#23272e', color: '#fff' }}>
              <th style={{ padding: '8px 6px', minWidth: 120, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('commodity_name')}>Commodity{renderSortArrow('commodity_name')}</th>
              <th style={{ padding: '8px 6px', minWidth: 100, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('location')}>Location{renderSortArrow('location')}</th>
              <th style={{ padding: '8px 6px', minWidth: 60, cursor: 'pointer', userSelect: 'none', textAlign: 'right' }} onClick={() => handleSort('total_scu')}>Qty{renderSortArrow('total_scu')}</th>
              <th style={{ padding: '8px 6px', minWidth: 80, cursor: 'pointer', userSelect: 'none', textAlign: 'right' }} onClick={() => handleSort('total_value')}>Value{renderSortArrow('total_value')}</th>
              <th style={{ padding: '8px 6px', minWidth: 60, cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('intent')}>Intent{renderSortArrow('intent')}</th>
              {/* Removed 'For Org?' column */}
              <th style={{ padding: '8px 6px', minWidth: 100, cursor: 'pointer', userSelect: 'none', textAlign: 'center' }} onClick={() => handleSort('user_id')}>Owner{renderSortArrow('user_id')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => (
              <tr
                key={item.id}
                style={{
                  background: intentColors[item.intent] || '#333',
                  borderLeft: `4px solid ${intentBorderColors[item.intent] || '#444'}`,
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '1.05rem',
                }}
              >
                <td style={{ padding: '8px 6px' }}>{item.commodity_name}</td>
                <td style={{ padding: '8px 6px' }}>{item.location}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right' }}>{item.total_scu}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right' }}>{item.total_value?.toLocaleString?.() ?? ''}</td>
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{item.intent}</td>
                {/* Removed 'For Org?' column */}
                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{getOwnerName(item.user_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WarehouseOrgItems;
