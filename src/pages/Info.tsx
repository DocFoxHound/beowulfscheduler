import React from "react";
import Navbar from "../components/Navbar";
import "./Info.css";

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
    "Hooligan Badge": "Deal $10,000 worth of collective damages in Ship Deaths (AC + PU)",
    "Initiation Badge": "Duel and defeat 3 separate RAPTOR I pilots in a best of 3 format.",
    "Brawler Badge": "Duel and defeat 3 separate RAPTOR II pilots in a best of 3 format.",
    "Competitor Badge": "Duel and defeat 3 separate RAPTOR III pilots in a best of 3 format.",
    "Dogfighter": "Duel and defeat 3 separate RAPTOR IV pilots in a best of 5 format.",
    "Mercenary Badge": "Kill a community high-tier pilot in a clean dogfight in AC. (top 100, judged by RAPTOR V's)",
    "Assassin": "Defeat a community Ace in a clean dogfight in AC. (top 50, judged by RAPTOR V's)",
    "Ace Badge": "Defeat a RAPTOR V pilot.",
    // RAIDER
    "RAIDER Badge": "Awarded for creative thinking in Pirate Hits and Hunting, high piracy activity, and high FPS skills.",
    // CORSAIR
    "Fleet Support Badge": "Attend 5 fleet events.",
    "Fleet Staff Badge": "Submit 5 Fleet Logs with at least 8 members.",
    "Fleet Commander Badge": "Submit 10 Fleet Logs with more than the 8 person minimum.",
    "Fleet Captain Badge": "Submit 20 Fleet Logs with 15+ participants.",
    "Fleet Admiral Badge": " Selected from the Fleet Captains for being of superior grade.",
    // Add more as needed...
};

const BadgeChip: React.FC<{ name: string; description?: string }> = ({ name, description }) => (
    <span className="badge-chip">
        {name}
        {description && (
            <span className="badge-tooltip">{description}</span>
        )}
    </span>
);

const Info: React.FC = () => (
    <div className="info-root">
        <Navbar />
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
		</main>
	</div>
);

export default Info;