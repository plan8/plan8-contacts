import { useParams, useNavigate } from "react-router-dom";
import { ContactDetails } from "./ContactDetails";

export function ContactDetailsWrapper() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();

  if (!contactId) {
    return (
      <div className="text-center py-8 text-gray-500">
        Contact not found
      </div>
    );
  }

  return (
    <ContactDetails
      contactId={contactId}
      onBack={() => navigate("/contacts")}
    />
  );
}
