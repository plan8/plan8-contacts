import { useParams, useNavigate } from "react-router-dom";
import { PartyDetails } from "./PartyDetails";

export function PartyDetailsWrapper() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();

  if (!partyId) {
    return (
      <div className="text-center py-8 text-gray-500">
        Party not found
      </div>
    );
  }

  return (
    <PartyDetails
      partyId={partyId}
      onBack={() => navigate("/parties")}
    />
  );
}
