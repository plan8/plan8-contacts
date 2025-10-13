import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { PartyForm } from "./PartyForm";
import { PartyList } from "./PartyList";
import { PartyDetails } from "./PartyDetails";

export function PartyManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingParty, setEditingParty] = useState<any>(null);
  const [selectedParty, setSelectedParty] = useState<any>(null);

  const parties = useQuery(api.parties.list) ?? [];
  const createParty = useMutation(api.parties.create);
  const updateParty = useMutation(api.parties.update);

  const handleCreateParty = async (data: any) => {
    try {
      await createParty(data);
      toast.success("Party created successfully");
      setShowForm(false);
    } catch (error) {
      toast.error("Failed to create party");
    }
  };

  const handleUpdateParty = async (data: any) => {
    try {
      await updateParty({ id: editingParty._id, ...data });
      toast.success("Party updated successfully");
      setEditingParty(null);
    } catch (error) {
      toast.error("Failed to update party");
    }
  };

  if (selectedParty) {
    return (
      <PartyDetails
        partyId={selectedParty._id}
        onBack={() => setSelectedParty(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Parties & Events</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
        >
          Create Party
        </button>
      </div>

      {/* Party List */}
      <PartyList
        parties={parties}
        onEdit={setEditingParty}
        onView={setSelectedParty}
      />

      {/* Modals */}
      {showForm && (
        <PartyForm
          onSubmit={handleCreateParty}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingParty && (
        <PartyForm
          party={editingParty}
          onSubmit={handleUpdateParty}
          onClose={() => setEditingParty(null)}
        />
      )}
    </div>
  );
}
