import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface BulkPartyInviteProps {
  selectedContactIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkPartyInvite({ selectedContactIds, onClose, onSuccess }: BulkPartyInviteProps) {
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  
  const parties = useQuery(api.parties.list) ?? [];
  const bulkInvite = useMutation(api.invitations.bulkInvite);

  const handleInvite = async () => {
    if (!selectedPartyId) {
      toast.error("Please select a party");
      return;
    }

    setIsInviting(true);
    try {
      await bulkInvite({
        partyId: selectedPartyId as any,
        contactIds: selectedContactIds as any[]
      });
      
      toast.success(`Successfully invited ${selectedContactIds.length} contacts to the party`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to invite contacts to party");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add to Party</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Select a party to invite {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? 's' : ''} to:
          </p>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Party
          </label>
          <select
            value={selectedPartyId}
            onChange={(e) => setSelectedPartyId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="">Select a party...</option>
            {parties.map((party) => (
              <option key={party._id} value={party._id}>
                {party.name} {party.date && `(${new Date(party.date).toLocaleDateString()})`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInvite}
            disabled={isInviting || !selectedPartyId}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isInviting ? "Inviting..." : "Invite to Party"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
