import React, { useState } from "react";
import { UserFleet } from "../types/fleet";
import FleetMemberView from "./FleetMemberView";
import FleetOwnerManageView from "./FleetOwnerManageView";
import CreateFleetModal from "./CreateFleetModal";

interface User {
  id: number;
  username: string;
}

interface ManageFleetProps {
  ownsFleet: boolean;
  ownedFleet: UserFleet | null;
  memberOfFleet: boolean;
  memberFleet: UserFleet | null;
  userId: number;
  allUsers: any[];
  dbUser: any;
  fleets: UserFleet[];
}

const getMembersUsernames = (members_ids: (number | string)[] = [], allUsers: User[]) =>
  members_ids
    .map(id => allUsers.find(user => user.id === Number(id))?.username)
    .filter(Boolean) as string[];

const getCommanderUsername = (commander_id: number | string, allUsers: User[]) =>
  allUsers.find(user => user.id === Number(commander_id))?.username || "";

const ManageFleet: React.FC<ManageFleetProps> = ({
  ownsFleet,
  ownedFleet,
  memberOfFleet,
  memberFleet,
  userId,
  allUsers,
  dbUser,
  fleets,
}) => {
  const [showCreateFleetModal, setShowCreateFleetModal] = useState(false);

  const handleCreateFleet = async (fleet: Partial<UserFleet>) => {
    // TODO: Implement actual create fleet logic
    // Example: await api.createFleet(fleet);
    // Optionally refresh fleet data here
  };

  if (ownsFleet && ownedFleet) {
    const members = (ownedFleet.members_ids || [])
      .map(id => {
        const user = allUsers.find(u => String(u.id) === id);
        return user ? { id: user.id, username: user.username } : null;
      })
      .filter(Boolean) as { id: number; username: string }[];

    const commanderUser = allUsers.find(user => user.id === ownedFleet.commander_id);
    const commander = commanderUser
      ? { id: commanderUser.id, username: commanderUser.username }
      : null;
    return (
      <FleetOwnerManageView
        fleet={ownedFleet}
        userId={userId}
        members={members}
        commander={commander}
        dbUser={dbUser}
      />
    );
  }
  if (memberOfFleet && memberFleet) {
    const members = (memberFleet.members_ids || [])
      .map(id => {
        const user = allUsers.find(u => String(u.id) === id);
        return user ? { id: user.id, username: user.username } : null;
      })
      .filter(Boolean) as { id: number; username: string }[];
    const members_usernames = getMembersUsernames(memberFleet.members_ids, allUsers);
    const commander_username = getCommanderUsername(memberFleet.commander_id ?? "", allUsers);
    const username = allUsers.find(user => user.id === userId)?.username || "";

    const commanderUser = allUsers.find(user => user.id === memberFleet.commander_id);
    const commander = commanderUser
      ? { id: commanderUser.id, username: commanderUser.username }
      : null;

    return (
      <FleetMemberView
        fleet={memberFleet}
        userId={userId.toString()}
        username={username}
        members={members}
        commander={commander}
      />
    );
  }

  // Check if user is an original commander of any fleet
  const isOriginalCommander = fleets.some(
    fleet => String(fleet.original_commander_id) === String(dbUser.id)
  );

  return (
    <div>
      {dbUser.corsair_level > 0 && !isOriginalCommander && (
        <>
          <button
            className="add-hit-btn"
            style={{
              width: '100%',
              marginBottom: '1rem',
              padding: '0.75rem',
              fontSize: '1.1rem',
              background: '#2d7aee',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => setShowCreateFleetModal(true)}
          >
            Create Fleet
          </button>
          <CreateFleetModal
            show={showCreateFleetModal}
            onClose={() => setShowCreateFleetModal(false)}
            onSubmit={handleCreateFleet}
            allUsers={allUsers}
            userId={userId}
            dbUser={dbUser}
          />
        </>
      )}
      {isOriginalCommander
        ? "To create another fleet, contact an admin."
        : (
          <div style={{ whiteSpace: "pre-line" }}>
            {"Fleet Rules:\n\n1. A CORSAIR may only ever create a single fleet. All additional creations must be handled by an admin. \n2. Fleet Logs must have 4, or more, members from your fleet active to count.\n3. The Fleet MUST have a commanding/leading role in the event or activity.\n4. Multiple fleets can claim the same event, but only if they had significant leadership roles in the event. The members of the event must be split evenly when both fleets make a Fleet Log."}
          </div>
        )
      }
    </div>
  );
};

export default ManageFleet;