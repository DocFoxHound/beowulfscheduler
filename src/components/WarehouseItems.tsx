import React, { useEffect, useState } from 'react';
import { fetchWarehouseItems } from '../api/hittrackerApi';
import { WarehouseItem } from '../types/hittracker';

const WarehouseItems: React.FC = () => {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getItems = async () => {
      try {
        const data = await fetchWarehouseItems();
        setItems(data);
      } catch (err) {
        setError('Failed to fetch warehouse items');
      } finally {
        setLoading(false);
      }
    };

    getItems();
  }, []);

  if (loading) {
    return <div>Loading warehouse items...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="warehouse-items">
      <h2>Warehouse Items</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.name} - Quantity: {item.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WarehouseItems;