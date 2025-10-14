import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { PartyForm } from "./PartyForm";
import { PartyList } from "./PartyList";

export function PartyManager() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingParty, setEditingParty] = useState<any>(null);
  const [selectedParties, setSelectedParties] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const parties = useQuery(api.parties.list) ?? [];
  const createParty = useMutation(api.parties.create);
  const updateParty = useMutation(api.parties.update);
  const batchUpdatePartyStatus = useMutation(api.parties.batchUpdateStatus);

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

  const handleSelectParty = (partyId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedParties);
    if (isSelected) {
      newSelected.add(partyId);
    } else {
      newSelected.delete(partyId);
    }
    setSelectedParties(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = new Set(parties.map(party => party._id));
      setSelectedParties(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedParties(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      await batchUpdatePartyStatus({ 
        ids: Array.from(selectedParties) as any[], 
        status: newStatus 
      });
      toast.success(`${selectedParties.size} parties updated to ${newStatus}`);
      setSelectedParties(new Set());
      setShowBulkActions(false);
    } catch (error) {
      toast.error("Failed to update some parties");
    }
  };


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

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-primary">
                {selectedParties.size} part{selectedParties.size !== 1 ? 'ies' : 'y'} selected
              </span>
              <button
                onClick={() => {
                  setSelectedParties(new Set());
                  setShowBulkActions(false);
                }}
                className="text-sm text-primary hover:text-primary/80"
              >
                Clear selection
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusChange("active")}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Mark as Active
              </button>
              <button
                onClick={() => handleBulkStatusChange("completed")}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors text-sm"
              >
                Mark as Completed
              </button>
              <button
                onClick={() => handleBulkStatusChange("cancelled")}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Mark as Cancelled
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Party List */}
      <PartyList
        parties={parties}
        onEdit={setEditingParty}
        onView={(party) => navigate(`/parties/${party._id}`)}
        selectedParties={selectedParties}
        onSelectParty={handleSelectParty}
        onSelectAll={handleSelectAll}
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
