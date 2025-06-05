import React, { useEffect, useState } from "react";
import { getAllGameVersions } from "../api/patchApi";
import {
  fetchTop10ACShipKillersByPatch,
  fetchTop10ACFPSKillersByPatch,
  fetchTop10PUShipKillersByPatch,
  fetchTop10PUFPSKillersByPatch,
} from "../api/blackboxApi";
import { fetchTop10TotalCutValueByPatch } from "../api/hittrackerApi";
import { getUserById } from "../api/userService";
import { fetchTopFleetsByPatch } from "../api/fleetLogApi";
import { fetchFleetById } from "../api/fleetApi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";

const DashboardTopPlayers: React.FC = () => {
  const [patchVersions, setPatchVersions] = useState<string[]>([]);
  const [selectedPatchIdx, setSelectedPatchIdx] = useState<number>(0);
  const [topDogfighters, setTopDogfighters] = useState<any[]>([]);
  const [topFPSAC, setTopFPSAC] = useState<any[]>([]);
  const [topDogfightersPU, setTopDogfightersPU] = useState<any[]>([]);
  const [topFPSPU, setTopFPSPU] = useState<any[]>([]);
  const [topPirates, setTopPirates] = useState<any[]>([]);
  const [topFleet, setTopFleet] = useState<any[]>([]);
  const [topTotalCut, setTopTotalCut] = useState<any[]>([]);
  const [topFleets, setTopFleets] = useState<any[]>([]);

  // Fetch all patch versions on mount
  useEffect(() => {
    getAllGameVersions().then(versions => {
      if (versions.length > 0) {
        const sorted = versions
          .slice()
          .sort((a, b) => parseFloat(b.version) - parseFloat(a.version));
        setPatchVersions(sorted.map(v => v.version));
        setSelectedPatchIdx(0);
      }
    });
  }, []);

  // Fetch top AC dogfighters for the selected patch
  useEffect(() => {
    if (patchVersions.length === 0) return;
    const patch = patchVersions[selectedPatchIdx];
    fetchTop10ACShipKillersByPatch(patch).then(async (results) => {
      const withNames = await Promise.all(
        results.map(async (entry: any) => {
          try {
            const user = await getUserById(entry.user_id);
            return {
              name: user?.nickname || user?.username || entry.user_id,
              kills: Number(entry.kill_count)
            };
          } catch {
            return {
              name: entry.user_id,
              kills: Number(entry.kill_count)
            };
          }
        })
      );
      setTopDogfighters(withNames);
    });
  }, [patchVersions, selectedPatchIdx]);

  // Fetch top AC FPS killers for the selected patch
  useEffect(() => {
    if (patchVersions.length === 0) return;
    const patch = patchVersions[selectedPatchIdx];
    fetchTop10ACFPSKillersByPatch(patch).then(async (results) => {
      const withNames = await Promise.all(
        results.map(async (entry: any) => {
          try {
            const user = await getUserById(entry.user_id);
            return {
              name: user?.nickname || user?.username || entry.user_id,
              kills: Number(entry.kill_count)
            };
          } catch {
            return {
              name: entry.user_id,
              kills: Number(entry.kill_count)
            };
          }
        })
      );
      setTopFPSAC(withNames);
    });
  }, [patchVersions, selectedPatchIdx]);

  // Fetch top PU dogfighters for the selected patch
  useEffect(() => {
    if (patchVersions.length === 0) return;
    const patch = patchVersions[selectedPatchIdx];
    fetchTop10PUShipKillersByPatch(patch).then(async (results) => {
      const withNames = await Promise.all(
        results.map(async (entry: any) => {
          try {
            const user = await getUserById(entry.user_id);
            return {
              name: user?.nickname || user?.username || entry.user_id,
              kills: Number(entry.kill_count)
            };
          } catch {
            return {
              name: entry.user_id,
              kills: Number(entry.kill_count)
            };
          }
        })
      );
      setTopDogfightersPU(withNames);
    });
  }, [patchVersions, selectedPatchIdx]);

  // Fetch top PU FPS killers for the selected patch
  useEffect(() => {
    if (patchVersions.length === 0) return;
    const patch = patchVersions[selectedPatchIdx];
    fetchTop10PUFPSKillersByPatch(patch).then(async (results) => {
      const withNames = await Promise.all(
        results.map(async (entry: any) => {
          try {
            const user = await getUserById(entry.user_id);
            return {
              name: user?.nickname || user?.username || entry.user_id,
              kills: Number(entry.kill_count)
            };
          } catch {
            return {
              name: entry.user_id,
              kills: Number(entry.kill_count)
            };
          }
        })
      );
      setTopFPSPU(withNames);
    });
  }, [patchVersions, selectedPatchIdx]);

  // Fetch top Total Cut value for the selected patch
  useEffect(() => {
    if (patchVersions.length === 0) return;
    const patch = patchVersions[selectedPatchIdx];
    fetchTop10TotalCutValueByPatch(patch).then(async (results) => {
      const withNames = await Promise.all(
        results.map(async (entry: any) => {
          try {
            const user = await getUserById(entry.user_id);
            return {
              name: user?.nickname || user?.username || entry.user_id,
              value: Number(entry.total_cut_sum)
            };
          } catch {
            return {
              name: entry.user_id,
              value: Number(entry.total_cut_sum)
            };
          }
        })
      );
      setTopTotalCut(withNames);
    });
  }, [patchVersions, selectedPatchIdx]);

  // Fetch top fleets for the selected patch
  useEffect(() => {
    if (patchVersions.length === 0) return;
    const patch = patchVersions[selectedPatchIdx];
    fetchTopFleetsByPatch(patch).then(async (results) => {
      const withNames = await Promise.all(
        results.map(async (entry: any) => {
          try {
            const fleetArr = await fetchFleetById(entry.fleet_id);
            const fleet = Array.isArray(fleetArr) ? fleetArr[0] : fleetArr;
            return {
              name: fleet?.name || entry.fleet_id,
              events: Number(entry.entry_count)
            };
          } catch {
            return {
              name: entry.fleet_id,
              events: Number(entry.entry_count)
            };
          }
        })
      );
      setTopFleets(withNames);
    });
  }, [patchVersions, selectedPatchIdx]);

  const handlePrev = () => {
    setSelectedPatchIdx(idx => Math.min(patchVersions.length - 1, idx + 1));
  };

  const handleNext = () => {
    setSelectedPatchIdx(idx => Math.max(0, idx - 1));
  };

  const currentPatch = patchVersions[selectedPatchIdx] || "";

  // Chart style
  const chartStyle = {
    background: "#1a1d21",
    color: "#fff",
    borderRadius: 8,
    padding: "1rem",
    textAlign: "center" as const,
    fontWeight: "bold" as const,
    marginBottom: "2rem"
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          fontSize: "2rem",
          fontWeight: "bold"
        }}
      >
        <button
          onClick={handlePrev}
          disabled={selectedPatchIdx === patchVersions.length - 1}
          style={{ fontSize: "2rem", marginRight: 16 }}
        >
          &lt;
        </button>
        <span>
          Patch: <strong>{currentPatch}</strong>
        </span>
        <button
          onClick={handleNext}
          disabled={selectedPatchIdx === 0}
          style={{ fontSize: "2rem", marginLeft: 16 }}
        >
          &gt;
        </button>
      </div>
      <div className="top-players-section">
        <div>
          <h3>Dogfighting AC</h3>
          <div style={chartStyle}>
            Top AC Ship Kills
            <div style={{ marginTop: 16, width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topDogfighters}
                  layout="vertical"
                  margin={{ left: 24, right: 24 }}
                >
                  <CartesianGrid stroke="#222" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} interval={0} />
                  <Bar dataKey="kills" fill="#2d7aee">
                    <LabelList 
                        dataKey="kills" 
                        position="insideRight" 
                        fill="#fff" 
                        fontWeight={600}
                        formatter={(kills: number) => kills.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                         />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div>
          <h3>Pirates</h3>
          <div style={chartStyle}>
            Top Total Cut Value (aUEC)
            <div style={{ marginTop: 16, width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topTotalCut}
                  layout="vertical"
                  margin={{ left: 24, right: 24 }}
                >
                  <CartesianGrid stroke="#222" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} interval={0} />
                  <Bar dataKey="value" fill="#b519ff">
                    <LabelList
                      dataKey="value"
                      position="insideRight"
                      fill="#fff"
                      fontWeight={600}
                      formatter={(value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div>
          <h3>Top Fleets</h3>
          <div style={chartStyle}>
            Most Active Fleets (Events)
            <div style={{ marginTop: 16, width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topFleets}
                  layout="vertical"
                  margin={{ left: 24, right: 24 }}
                >
                  <CartesianGrid stroke="#222" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} interval={0} />
                  <Bar dataKey="events" fill="#3e6606">
                    <LabelList
                      dataKey="events"
                      position="insideRight"
                      fill="#fff"
                      fontWeight={600}
                      formatter={(value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div>
          <h3>FPS AC</h3>
          <div style={chartStyle}>
            Top FPS (AC)
            <div style={{ marginTop: 16, width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topFPSAC}
                  layout="vertical"
                  margin={{ left: 24, right: 24 }}
                >
                  <CartesianGrid stroke="#222" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} interval={0} />
                  <Bar dataKey="kills" fill="#d11e1e">
                    <LabelList 
                        dataKey="kills" 
                        position="insideRight" 
                        fill="#fff" 
                        fontWeight={600}
                        formatter={(kills: number) => kills.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                         />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div>
          <h3>Dogfighting PU</h3>
          <div style={chartStyle}>
            Top Dogfighters (PU)
            <div style={{ marginTop: 16, width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topDogfightersPU}
                  layout="vertical"
                  margin={{ left: 24, right: 24 }}
                >
                  <CartesianGrid stroke="#222" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} interval={0} />
                  <Bar dataKey="kills" fill="#2d7aee">
                    <LabelList 
                        dataKey="kills" 
                        position="insideRight" 
                        fill="#fff" 
                        fontWeight={600}
                        formatter={(kills: number) => kills.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                         />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div>
          <h3>FPS PU</h3>
          <div style={chartStyle}>
            Top FPS (PU)
            <div style={{ marginTop: 16, width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topFPSPU}
                  layout="vertical"
                  margin={{ left: 24, right: 24 }}
                >
                  <CartesianGrid stroke="#222" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} interval={0} />
                  <Bar dataKey="kills" fill="#d11e1e">
                    <LabelList 
                        dataKey="kills" 
                        position="insideRight" 
                        fill="#fff" 
                        fontWeight={600}
                        formatter={(kills: number) => kills.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                         />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        {/* ...other sections like Fleet, etc. */}
      </div>
    </div>
  );
};

export default DashboardTopPlayers;