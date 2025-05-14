import React, { useEffect, useState } from 'react';
import { fetchStatistics } from '../api/hittrackerApi';
import { Statistics } from '../types/hittracker';

const OverviewPanel: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getStatistics = async () => {
      try {
        const data = await fetchStatistics();
        setStatistics(data);
      } catch (err) {
        setError('Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    getStatistics();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="overview-panel">
      <h2>Overview</h2>
      <div className="statistics">
        <div>Total Hits: {statistics?.totalHits}</div>
        <div>Hits for Current Patch: {statistics?.currentPatchHits}</div>
        <div>Total Items Stolen: {statistics?.totalItemsStolen}</div>
        <div>Total Value: {statistics?.totalValue}</div>
      </div>
      <div className="recent-hits">
        <div className="recent-pirate-hits">
          <h3>Recent Pirate Hits</h3>
          {/* RecentPirateHits component will be rendered here */}
        </div>
        <div className="warehouse-items">
          <h3>Warehouse Items</h3>
          {/* WarehouseItems component will be rendered here */}
        </div>
        <div className="recent-other-hits">
          <h3>Recent Hits by Others</h3>
          {/* RecentOtherHits component will be rendered here */}
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;