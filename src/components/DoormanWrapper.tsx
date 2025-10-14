import { useParams, useNavigate } from "react-router-dom";
import { DoormanView } from "./DoormanView";

export function DoormanWrapper() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();

  if (!partyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Party Not Found</h1>
          <p className="text-gray-600">The party you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <DoormanView partyId={partyId} onBack={() => navigate("/parties")} />;
}
