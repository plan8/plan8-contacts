import { useParams } from "react-router-dom";
import { PublicAttendance } from "./PublicAttendance";

export function PublicAttendanceWrapper() {
  const { partyId } = useParams<{ partyId: string }>();

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

  return <PublicAttendance partyId={partyId} />;
}
