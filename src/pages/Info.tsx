import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "./Info.css";
import { getUserById } from "../api/userService";
import axios from "axios";

// Detailed Ranks
const ranks = [
	{
		name: "Blooded",
		desc: "Senior members and first-line leaders. Blooded serve as mentors, trainers, and facilitators for the org. They are hand-selected from active Marauders.",
		img: "https://i.imgur.com/2zvJ01w.png",
	},
	{
		name: "Marauder",
		desc: "Competitive, highly skilled, and dangerous. Marauders are respected in the community even outside of IronPoint and are expected to maintain their edge.",
		img: "https://i.imgur.com/uhSQtg4.png",
	},
	{
		name: "Crew",
		desc: "Fully-fledged, respected members of IronPoint. Proven strong Pirates, strong Dogfighters, and capable Team Players.",
		img: "https://i.imgur.com/YtVLyBU.png",
	},
	{
		name: "Prospect",
		desc: "Individuals looking to become the deadliest Pirate in the verse'. Show activity, Pirate Hits, Kills, and Dogfighting Proficiency. Exceptions for vetted senior community members.",
		img: "https://i.imgur.com/qyhXZui.png",
	},
];

// Prestige Schools
const prestiges = [
    {
        name: "RAPTOR",
        focus: "Dogfighting",
        lead: "AllegedlyAdam",
        assistants: ["Instructor Ace"],
        desc: "Focuses on Dogfighting and pilot skill. From basic duels to competing with the best in the game.",
        img: "https://i.imgur.com/9wMuyX1.png",
        poster: "https://i.imgur.com/fgqQSa6.png", // <-- Add poster
        tiers: [
            {
                name: "Tier I",
                requirements: [
                    "Hooligan Badge",
                    "Initiation Badge",
                ],
            },
            {
                name: "Tier II",
                requirements: [
                    "Brawler Badge",
                    "Lead a 2v2 Dogfighting Team (instruct a RAPTOR teammate, graded by RAPTOR V)",
                ],
            },
            {
                name: "Tier III",
                requirements: [
                    "Competitor Badge",
                    "Mercenary Badge",
                    "Lead a 3v3 Dogfighting Team (instruct a RAPTOR teammate, graded by RAPTOR V)",
                ],
            },
            {
                name: "Tier IV",
                requirements: [
                    "Dogfighter",
                    "Assassin",
                    "Demonstrate Proficiency in Teamfighting Skills (subjective, RAPTOR V)",
                ],
            },
            {
                name: "Tier V",
                requirements: ["Ace Badge"],
            },
        ],
    },
    {
        name: "RAIDER",
        focus: "Piracy & FPS",
        lead: "Leo_Getz",
        assistants: ["Instructor Pirate"],
        desc: "All things dirty and grungy: boarding, ground objectives, snare routes, creative piracy. Non-linear badge system for standout Pirates and FPS players.",
        img: "https://i.imgur.com/FNBpkfz.png",
        poster: "https://i.imgur.com/jEaYrQk.png", // <-- Add poster
        tiers: [
            {
                name: "RAIDER Badge",
                requirements: [
                    "Creative thinking in Pirate Hits and Hunting",
                    "High Piracy activity",
                    "High FPS skills",
                ],
            },
        ],
    },
    {
        name: "CORSAIR",
        focus: "Fleet Leadership",
        lead: "Mercuriuss",
        assistants: ["Instructor Commander"],
        desc: "Ties the other two PRESTIGES together for successful operations. Learn to lead Dogfighting and FPS teams in Events and Operations.",
        img: "https://i.imgur.com/O6TpgjD.png",
        poster: "https://i.imgur.com/96RzdPG.png", // <-- Add poster
        tiers: [
            {
                name: "Tier I",
                requirements: ["Fleet Support Badge"],
                
            },
            {
                name: "Tier II",
                requirements: ["Fleet Staff Badge"],
            },
            {
                name: "Tier III",
                requirements: ["Fleet Commander Badge"],
                
            },
            {
                name: "Tier IV",
                requirements: ["Fleet Captain Badge"],
            },
            {
                name: "Tier V",
                requirements: ["Fleet Admiral Badge"],
            },
        ],
    },
];

const badgeDescriptions: Record<string, string> = {
    // RAPTOR
    "Sardine": "100 Ship Kills in Arena Commander. (10pts)",
    "Yellowtail": "200 Ship Kills in Arena Commander. (20pts)",
    "Barracuda": "500 Ship Kills in Arena Commander. (50pts)",
    "Marlin": "1000 Ship Kills in Arena Commander. (90pts)",
    "Kraken": "5000 Ship Kills in Arena Commander. (title)",
    "Sparrow": "10 Ship Kills in the Persistent Universe. (10pts)",
    "Bluejay": "50 Ship Kills in the Persistent Universe. (20pts)",
    "Crow": "100 Ship Kills in the Persistent Universe. (50pts)",
    "Raven": "200 Ship Kills in the Persistent Universe. (90pts)",
    "Hawk": "500 Ship Kills in the Persistent Universe. (title)",
    "Initiation Badge": "Duel and defeat 3 separate RAPTOR I pilots in a best of 3 format. (10pts)",
    "Brawler Badge": "Duel and defeat 3 separate RAPTOR II pilots in a best of 3 format. (20pts)",
    "Competitor Badge": "Duel and defeat 3 separate RAPTOR III pilots in a best of 3 format. (50pts)",
    "Dogfighter": "Duel and defeat 3 separate RAPTOR IV pilots in a best of 5 format. (90pts)",
    "Hooligan Badge": "Deal $10,000 worth of collective damages in Ship Deaths (AC + PU). (10pts)",
    "Troublesome": "Deal $100,000 worth of collective damages in Ship Deaths (AC + PU). (30pts)",
    "Menace": "Deal $1,000,000 worth of collective damages in Ship Deaths (AC + PU). (50pts)",
    "Terrorist": "Deal $100,000,000 worth of collective damages in Ship Deaths (AC + PU). (title)",
    "Mercenary Badge": "Kill a community high-tier pilot in a clean dogfight in AC. (top 100, judged by RAPTOR V's) (20pts)",
    "Assassin": "Defeat a community Ace in a clean dogfight in AC. (top 50, judged by RAPTOR V's) (50pts)",
    "Ace Badge": "Defeat a RAPTOR V pilot. (90pts)",
    "Master Gunner": "Making Top 10 in an FPS Module Leaderboard. (title)",
    "Master Pilot": "Making Top 10 in Squadron Battles' Leaderboard. (title)",
    // RAIDER
    "RAIDER Badge": "Awarded for creative thinking in Pirate Hits and Hunting, high piracy activity, and high FPS skills.",
    // CORSAIR
    "Fleet Support Badge": "Attend 5 fleet events. (10pts)",
    "Fleet Staff Badge": "Submit 5 Fleet Logs with at least 8 members. (10pts)",
    "Fleet Commander Badge": "Submit 10 Fleet Logs with more than the 8 person minimum. (20pts)",
    "Fleet Captain Badge": "Submit 20 Fleet Logs with 15+ participants. (50pts)",
    "Fleet Admiral Badge": "Selected from the Fleet Captains for being of superior grade.",
    "Boarding Party": "Successfully board and capture a ship during a live operation. (10pts)",
    "Saboteur": "Disable a ship’s systems during a boarding action. (10pts)",
    "Headhunter": "Eliminate a high-value target during a raid. (20pts)",
    "Ghost": "Complete a piracy hit without being detected. (20pts)",
    "Demolitionist": "Destroy a ship’s cargo or critical systems during a raid. (10pts)",
    "Enforcer": "Lead a successful FPS assault on a defended objective. (50pts)",
    "Quartermaster": "Secure and extract valuable cargo during a raid. (10pts)",
    "Wetwork": "Eliminate all crew on a target ship without losing any raiders. (20pts)",
    "Ringleader": "Coordinate a multi-ship boarding operation. (90pts)",
    // CORSAIR
    "Lieutenant": "Lead 5x LARGE SCALE (12+ members) fleet events. (20pts)",
    "Bridge Officer": "Lead 10x LARGE SCALE (12+ members) fleet events. (50pts)",
    "Deck Hand": "Attend 10 fleet events. (20pts)",
    "Expert Crewman": "Attend 20 fleet events. (50pts)",
    "Master Chief": "Attend 50 fleet events. (title)",
    "Overlord": "Submit 20 fleet logs for a fleet of any size (minimum of 8 players). (50pts)",
    "Rear Admiral": "Submit 50 fleet logs for a fleet of any size (minimum of 8 players). (90pts)",
    "Forward Deployed": "Get 5 sub-commands under your belt. (10pts)",
    "Tactical Master": "Get 10 sub-commands under your belt. (20pts)",
    "Strategist": "Get 20 sub-commands under your belt. (50pts)",
    "Duck Hunter": "100 FPS kills. (10pts)",
    "Digital Gunner": "500 FPS kills. (20pts)",
    "Cyber Terror": "1000 FPS kills. (50pts)",
    "Ocelot": "3000 FPS kills. (90pts)",
    "Megalomania": "10000 FPS kills. (title)",
};

const raptorBadgeCategories = [
    {
        category: "Ship Kills in Arena Commander",
        badges: [
            "Sardine",
            "Yellowtail",
            "Barracuda",
            "Marlin",
            "Kraken",
        ],
    },
    {
        category: "Ship Kills in the PU",
        badges: [
            "Sparrow",
            "Bluejay",
            "Crow",
            "Raven",
            "Hawk",
        ],
    },
    {
        category: "Dogfighting Duels",
        badges: [
            "Initiation Badge",
            "Brawler Badge",
            "Competitor Badge",
            "Dogfighter",
        ],
    },
    {
        category: "Ship Damages",
        badges: [
            "Hooligan Badge",
            "Troublesome",
            "Menace",
            "Terrorist",
        ],
    },
    {
        category: "Bounty Hunting",
        badges: [
            "Mercenary Badge",
            "Assassin",
            "Ace Badge",
        ],
    },
    {
        category: "One-Offs",
        badges: [
            "Master Gunner",
            "Master Pilot",
        ],
    },
];

// List of progression badges (from RAPTOR progression)
const raptorProgressionBadges = [
    "Hooligan Badge",
    "Initiation Badge",
    "Brawler Badge",
    "Competitor Badge",
    "Dogfighter",
    "Mercenary Badge",
    "Assassin",
    "Ace Badge",
];

const raiderBadgeCategories = [
    {
        category: "Pirate Hits & Boarding",
        badges: [
            "Boarding Party",
            "Saboteur",
            "Ghost",
            "Demolitionist",
            "Quartermaster",
        ],
    },
    {
        category: "FPS Raids & Combat",
        badges: [
            "Headhunter",
            "Enforcer",
            "Wetwork",
        ],
    },
    {
        category: "AC FPS Kills",
        badges: [
            "Duck Hunter",
            "Cyber Terror",
            "Ocelot",
            "Megalomania",
        ],
    },
    {
        category: "Leadership & Coordination",
        badges: [
            "Ringleader",
            "RAIDER Badge",
        ],
    },
];

const raiderProgressionBadges = [
    "RAIDER Badge",
];

const corsairBadgeCategories = [
    {
        category: "Command",
        badges: [
            "Lieutenant",
            "Bridge Officer",
            "Fleet Captain Badge",
        ],
    },
    {
        category: "Participation",
        badges: [
            "Fleet Support Badge",
            "Deck Hand",
            "Expert Crewman",
            "Master Chief",
        ],
    },
    {
        category: "Small Team",
        badges: [
            "Fleet Staff Badge",
            "Fleet Commander Badge",
            "Overlord",
            "Rear Admiral",
        ],
    },
    {
        category: "Team Leader",
        badges: [
            "Forward Deployed",
            "Tactical Master",
            "Strategist",
        ],
    },
];

const corsairProgressionBadges = [
    "Fleet Support Badge",
    "Fleet Staff Badge",
    "Fleet Commander Badge",
    "Fleet Captain Badge",
    "Fleet Admiral Badge",
];

const BadgeChip: React.FC<{ name: string; description?: string; subdued?: boolean }> = ({ name, description, subdued }) => (
    <span className={`badge-chip${subdued ? " badge-chip-subdued" : ""}`}>
        {name}
        {description && (
            <span className="badge-tooltip">{description}</span>
        )}
    </span>
);

const Info: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [dbUser, setDbUser] = useState<any>(null);

    // Fetch Discord user if dbUser is not set
    useEffect(() => {
        if (!dbUser) {
            axios
                .get(
                    import.meta.env.VITE_IS_LIVE === "true"
                        ? import.meta.env.VITE_LIVE_USER_URL
                        : import.meta.env.VITE_TEST_USER_URL,
                    { withCredentials: true }
                )
                .then((res) => setUser(res.data))
                .catch(() => setUser(null));
        }
    }, [dbUser]);

    // Fetch dbUser from backend if Discord user is available and dbUser is not set
    useEffect(() => {
        if (!dbUser && user && user.id) {
            getUserById(user.id)
                .then((data) => setDbUser(data))
                .catch(() => setDbUser(null));
        }
    }, [user, dbUser]);

    return (
        <div className="info-root">
            <Navbar dbUser={dbUser} />
            <main className="info-content">
                <section className="info-section">
                    <h1>IronPoint Organization Structure</h1>
                    <div className="info-blurb">
                        <strong>Beowulf Hunter</strong> is the org-made kill tracker that works by logging kills from your <code>game.log</code> file. If you want to support your fleet, show your activity, and increase our overall kill numbers, we heavily suggest downloading it! You can view the code to see that we are not capturing anything else other than data pertaining to kills, yourself, at the GitHub page:
                        <br />
                        <a
                            href="https://github.com/DocFoxHound/BeowulfHunterPy/releases/latest"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-block", marginTop: "0.75em" }}
                        >
                            <img
                                src="https://i.imgur.com/hFkzpRL.png"
                                alt="Download Beowulf Hunter"
                                className="info-graphic"
                                style={{ width: "240px", borderRadius: "8px", boxShadow: "0 2px 8px #0004" }}
                            />
                        </a>
                    </div>
                    <p>
                        Welcome to IronPoint! Below you'll find information about our ranking
                        structure, how to progress, what we expect from members, and the
                        different schools of training ("Prestiges") you can pursue.
                    </p>
                </section>

				<section className="info-section">
					<h2>Ranking Structure</h2>
					<div className="info-rank-structure-flex">
						<img
							src="https://i.imgur.com/NKSTixp.png"
							alt="Rank Structure"
							className="info-rank-structure-img"
						/>
						<div className="info-rank-list">
							{ranks.map((r) => (
								<div className="info-rank-card-horizontal" key={r.name}>
									<img src={r.img} alt={r.name} className="info-rank-img-small" />
									<div className="info-rank-details">
										<div className="info-rank-title">{r.name}</div>
										<div className="info-rank-desc">{r.desc}</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="info-section">
					<div className="info-duo-flex">
						<div className="info-duo-block">
							<h2>Requirements to Progress</h2>
							<ul>
								<li>Active participation in org events and missions</li>
								<li>Demonstrate teamwork, communication, and respect</li>
								<li>Complete training modules and pass evaluations</li>
								<li>Mentor new members as you advance</li>
								<li>Specialize in a Prestige for advanced ranks</li>
							</ul>
						</div>
						<div className="info-duo-block">
							<h2>Expectations</h2>
							<ul>
								<li>Be respectful and supportive to all members</li>
								<li>Represent IronPoint positively in-game and in the community</li>
								<li>Follow org rules and chain of command</li>
								<li>Strive for improvement and help others grow</li>
								<li>Work as a team and help your peers and crew mates</li>
								<li>Above-average combat skills expected</li>
							</ul>
						</div>
					</div>
				</section>

				<section className="info-section">
					<h2>Prestiges (Schools of Training)</h2>
					<img
						src="https://i.imgur.com/XiXYhrP.png"
						alt="All Prestige Banners"
						className="info-prestige-banners"
					/>
					<div className="info-prestige-list">
						{prestiges.map((p) => (
							<div className="info-prestige-flex" key={p.name}>
								{/* Poster image removed */}
								<div className="info-prestige-card">
									<div style={{ display: "flex", alignItems: "center", gap: "0.75em" }}>
										<img
											src={p.img}
											alt={p.name}
											className="info-prestige-logo-small"
										/>
										<div className="info-prestige-title">
											{p.name}
											<br />
											{p.focus}
										</div>
									</div>
									<div className="info-prestige-lead">
										<strong>Lead:</strong> {p.lead}
									</div>
									<div className="info-prestige-desc">{p.desc}</div>
									<div className="info-prestige-tiers">
										{p.tiers.map((tier) => (
											<div className="info-prestige-tier" key={tier.name}>
												<strong>{tier.name}</strong>
												<ul>
													{tier.requirements.map((req, i) => {
                                                    // Try to match the badge name at the start of the requirement string
                                                    const badgeMatch = Object.keys(badgeDescriptions).find(badge =>
                                                        req.startsWith(badge)
                                                    );
                                                    return (
                                                        <li key={i}>
                                                            {badgeMatch ? (
                                                                <>
                                                                    <BadgeChip name={badgeMatch} description={badgeDescriptions[badgeMatch]} />
                                                                    {req.slice(badgeMatch.length)}
                                                                </>
                                                            ) : (
                                                                req
                                                            )}
                                                        </li>
                                                    );
                                                })}
											</ul>
										</div>
										))}
									</div>
									<div className="info-prestige-badges">
                                    </div>
								</div>
							</div>
						))}
					</div>
					<img
						src="https://i.imgur.com/gNTZzqI.png"
						alt="Prestige Overview"
						className="info-graphic"
					/>
				</section>

                {/* All Badges Section */}
                <section className="info-section">
                    <h2>All Badges</h2>
                    <p style={{ marginBottom: "2em", color: "#c0c7d1" }}>
                        The IronPoint badging system is designed to add fun, challenge, and recognition to your time in the org. Each badge represents a specific achievement, skill, or contribution, and many come with a point value or a special title as a reward and metric of your accomplishments. While earning badges is not required for general membership, certain badges are prerequisites for progressing through the tiers of a Prestige school. Progression itself is based on meeting the requirements for each tier, which may include earning specific badges. Collect badges for the challenge, the bragging rights, and to show your dedication to your chosen path!
                    </p>
                    <div className="info-badges-columns">
                        <div>
                            <h3>RAPTOR All Badges</h3>
                            {raptorBadgeCategories.map(cat => (
                <div key={cat.category} style={{ marginBottom: "1.2em" }}>
                    <div style={{ fontWeight: "bold", color: "#4fa3ff", marginBottom: "0.3em" }}>{cat.category}</div>
                    <ul>
                        {cat.badges.map(badge => (
                            <li key={badge}>
                                <BadgeChip
                                    name={badge}
                                    description={badgeDescriptions[badge]}
                                    subdued={!raptorProgressionBadges.includes(badge)}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
                        </div>
                        <div>
                            <h3>RAIDER All Badges</h3>
                            {raiderBadgeCategories.map(cat => (
                <div key={cat.category} style={{ marginBottom: "1.2em" }}>
                    <div style={{ fontWeight: "bold", color: "#ff4f4f", marginBottom: "0.3em" }}>{cat.category}</div>
                    <ul>
                        {cat.badges.map(badge => (
                            <li key={badge}>
                                <BadgeChip
                                    name={badge}
                                    description={badgeDescriptions[badge]}
                                    subdued={!raiderProgressionBadges.includes(badge)}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
                        </div>
                        <div>
                            <h3>CORSAIR All Badges</h3>
                            {corsairBadgeCategories.map(cat => (
                <div key={cat.category} style={{ marginBottom: "1.2em" }}>
                    <div style={{ fontWeight: "bold", color: "#00e6b8", marginBottom: "0.3em" }}>{cat.category}</div>
                    <ul>
                        {cat.badges.map(badge => (
                            <li key={badge}>
                                <BadgeChip
                                    name={badge}
                                    description={badgeDescriptions[badge]}
                                    subdued={!corsairProgressionBadges.includes(badge)}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
                        </div>
                    </div>
                </section>
			</main>
		</div>
	);
};

export default Info;