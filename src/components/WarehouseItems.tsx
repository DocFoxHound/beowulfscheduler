import React, { useEffect, useState } from 'react';
import { fetchWarehouseItems, editWarehouseItem, deleteWarehouseItem, addWarehouseItem } from '../api/warehouseApi';
import { WarehouseItem } from '../types/warehouse';

interface Props {
  user_id: string | null;
}

type ForOrgFilter = 'both' | 'on' | 'off';

const WarehouseItems: React.FC<Props> = ({ user_id }) => {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openLocations, setOpenLocations] = useState<Record<string, boolean>>({});
  const [filterText, setFilterText] = useState('');
  const [forOrgFilter, setForOrgFilter] = useState<ForOrgFilter>('both');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<WarehouseItem>>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [newItem, setNewItem] = useState<Partial<WarehouseItem>>({
    commodity_name: '',
    location: '',
    total_scu: 0,
    total_value: 0,
    for_org: false,
  });

  useEffect(() => {
    const getItems = async () => {
      try {
        const data = await fetchWarehouseItems(user_id);
        setItems(data);
        const locations = Array.from(new Set(data.map(item => item.location)));
        setOpenLocations(Object.fromEntries(locations.map(loc => [loc, true])));
      } catch (err) {
        setError('Failed to fetch warehouse items');
      } finally {
        setLoading(false);
      }
    };
    getItems();
  }, [user_id]);

  if (loading) return <div>Loading warehouse items...</div>;
  if (error) return <div>{error}</div>;

  // Filtering logic
  const filteredItems = items.filter(item => {
    const matchesText =
      item.commodity_name.toLowerCase().includes(filterText.toLowerCase()) ||
      item.location.toLowerCase().includes(filterText.toLowerCase());
    const matchesForOrg =
      forOrgFilter === 'both' ||
      (forOrgFilter === 'on' && item.for_org) ||
      (forOrgFilter === 'off' && !item.for_org);
    return matchesText && matchesForOrg;
  });

  // Group filtered items by location
  const itemsByLocation: Record<string, WarehouseItem[]> = {};
  filteredItems.forEach(item => {
    if (!itemsByLocation[item.location]) {
      itemsByLocation[item.location] = [];
    }
    itemsByLocation[item.location].push(item);
  });

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
  };

  const handleAddSave = async () => {
    if (!newItem.commodity_name || !newItem.location) return;
    const itemToAdd = {
      ...newItem,
      user_id: user_id ?? '',
      patch: '', // or your default
    } as WarehouseItem;
    const saved = await addWarehouseItem(itemToAdd);
    setItems(items => [saved, ...items]);
    setShowAddRow(false);
    setNewItem({
      commodity_name: '',
      location: '',
      total_scu: 0,
      total_value: 0,
      for_org: false,
    });
  };

  return (
    <div className="warehouse-items">
      <h2>Warehouse Items</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Filter items..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          style={{
            flex: '0 0 180px',
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #333',
            background: '#222',
            color: '#fff',
            marginRight: '2rem'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ marginRight: 4 }}>For Org:</span>
          <button
            style={{
              background: forOrgFilter === 'both' ? '#666' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            onClick={() => setForOrgFilter('both')}
          >Both</button>
          <button
            style={{
              background: forOrgFilter === 'on' ? '#666' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            onClick={() => setForOrgFilter('on')}
          >Yes</button>
          <button
            style={{
              background: forOrgFilter === 'off' ? '#666' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            onClick={() => setForOrgFilter('off')}
          >No</button>
        </div>
        <button
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowAddRow(v => !v)}
        >
          Add New Item
        </button>
      </div>
      {showAddRow && (
        <table className="warehouse-table" style={{ width: '100%', margin: '1rem 0', borderCollapse: 'collapse', background: '#181a1b', borderRadius: 6 }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px' }}>
                <input
                  type="text"
                  value={newItem.commodity_name}
                  onChange={e => handleAddChange('commodity_name', e.target.value)}
                  placeholder="Commodity Name"
                  style={{ width: 140 }}
                  title="The name of this item"
                />
              </td>
              <td style={{ padding: '8px' }}>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={e => handleAddChange('location', e.target.value)}
                  placeholder="Location"
                  style={{ width: 120 }}
                  title="The station or location where the item is stored"
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
                <input
                  type="checkbox"
                  checked={newItem.for_org === true}
                  onChange={e => handleAddChange('for_org', e.target.checked)}
                  style={{ width: 20, height: 20 }}
                  title="Check if this item is for the organization"
                />
              </td>
              <td style={{ textAlign: 'center', padding: '8px' }}>
                <button onClick={handleAddSave} title="Save" style={{ fontSize: 18, marginLeft: 8 }}>💾</button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
      {Object.keys(itemsByLocation).length === 0 && (
        <div style={{ marginTop: '1rem', color: '#aaa' }}>No items match your filter.</div>
      )}
      {Object.keys(itemsByLocation)
        .sort((a, b) => a.localeCompare(b))
        .map(location => (
          <div key={location} style={{ marginBottom: '0rem', border: '1px solid #333', borderRadius: '6px', background: '#222' }}>
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
                    <th style={{ textAlign: 'center', padding: '8px' }}>For Org</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsByLocation[location]
                    .slice()
                    .sort((a, b) => a.commodity_name.localeCompare(b.commodity_name))
                    .map(item => (
                      <React.Fragment key={item.id}>
                        <tr>
                          <td style={{ padding: '8px' }}>{item.commodity_name}</td>
                          <td style={{ textAlign: 'right', padding: '8px' }}>{item.total_scu}</td>
                          <td style={{ textAlign: 'right', padding: '8px' }}>{item.total_value}</td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>
                            {item.for_org ? '✔' : ''}
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
                                <input
                                  type="checkbox"
                                  checked={editValues.for_org === true}
                                  onChange={e => handleEditChange('for_org', e.target.checked ? true : false)}
                                  style={{ width: 20, height: 20, marginRight: '2.25rem' }}
                                />
                                <button onClick={handleSave} title="Save" style={{ fontSize: 18, marginLeft: 8 }}>💾</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
    </div>
  );
};

export default WarehouseItems;