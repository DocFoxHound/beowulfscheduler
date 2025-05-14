import OverviewPanel from '../components/OverviewPanel';
import RecentPirateHits from '../components/RecentPirateHits';
import WarehouseItems from '../components/WarehouseItems'; // Adjust the path as needed
import RecentOtherHits from '../components/RecentOtherHits'; // Ensure this path is correct

const Hittracker: React.FC = () => {
  return (
    <div className="hittracker-root">
      <header className="navbar">
        <div className="navbar-title">IronPoint</div>
        <nav className="navbar-links">
          <a href="/dashboard">Dashboard</a>
          <a href="/scheduler">Training Scheduler</a>
          <a href="/hittracker">Hits</a>
          {/* <a href="/charts">Charts</a> */}
          {/* <a href="/settings">Settings</a> */}
          {/* <a href="/logout" className="logout-link">Logout</a> */}
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-header">
          <h1>Hit Tracker</h1>
          <p>Track your hits and performance.</p>
        </section>

        <OverviewPanel />

        <div className="hittracker-layout">
          <div className="recent-pirate-hits">
            <RecentPirateHits />
          </div>
          <div className="warehouse-items">
            <WarehouseItems />
          </div>
          <div className="recent-other-hits">
            <RecentOtherHits />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Hittracker;