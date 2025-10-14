import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CsvImportProps {
  onClose: () => void;
}

interface ColumnMapping {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  [key: string]: string;
}

export function CsvImport({ onClose }: CsvImportProps) {
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importType, setImportType] = useState<"csv" | "linkedin">("csv");
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    firstName: "",
    lastName: "",
    email: "",
    company: ""
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const importContacts = useMutation(api.contacts.importFromCsv);
  const importLinkedIn = useMutation(api.contacts.importFromLinkedIn);

  // Helper function to guess name from email
  const guessNameFromEmail = (email: string): { firstName: string; lastName: string } => {
    if (!email || !email.includes('@')) return { firstName: '', lastName: '' };
    
    const localPart = email.split('@')[0].toLowerCase();
    
    // Common patterns
    if (localPart.includes('.')) {
      const parts = localPart.split('.');
      if (parts.length >= 2) {
        return {
          firstName: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
          lastName: parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
        };
      }
    }
    
    // Try to split camelCase or other patterns
    const camelCaseMatch = localPart.match(/^([a-z]+)([A-Z][a-z]+)/);
    if (camelCaseMatch) {
      return {
        firstName: camelCaseMatch[1].charAt(0).toUpperCase() + camelCaseMatch[1].slice(1),
        lastName: camelCaseMatch[2].charAt(0).toUpperCase() + camelCaseMatch[2].slice(1)
      };
    }
    
    // If no pattern matches, use the whole local part as first name
    return {
      firstName: localPart.charAt(0).toUpperCase() + localPart.slice(1),
      lastName: ''
    };
  };

  // Parse CSV data and extract headers
  const parseCsvData = (data: string) => {
    if (!data.trim()) return;
    
    const lines = data.trim().split('\n');
    if (lines.length === 0) return;
    
    const detectedHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    setHeaders(detectedHeaders);
    
    // Auto-detect column mappings
    const autoMapping: ColumnMapping = {
      firstName: "",
      lastName: "",
      email: "",
      company: ""
    };
    
    detectedHeaders.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
        autoMapping.firstName = header;
      } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
        autoMapping.lastName = header;
      } else if (lowerHeader.includes('email')) {
        autoMapping.email = header;
      } else if (lowerHeader.includes('company') || lowerHeader.includes('företag')) {
        autoMapping.company = header;
      }
    });
    
    setColumnMapping(autoMapping);
    
    // Generate preview data
    const preview = lines.slice(1, 6).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      detectedHeaders.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    setPreviewData(preview);
  };

  // Update CSV data and parse
  const handleCsvDataChange = (value: string) => {
    setCsvData(value);
    parseCsvData(value);
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error("Please paste data");
      return;
    }

    if (!columnMapping.email) {
      toast.error("Please map the email column");
      return;
    }

    setIsImporting(true);
    try {
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      
      if (importType === "linkedin") {
        // Parse LinkedIn CSV format with mapping
        const contacts = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
          const contact: any = {};
          
          // Map columns based on user selection
          Object.entries(columnMapping).forEach(([field, headerName]) => {
            if (headerName && headers.includes(headerName)) {
              const index = headers.indexOf(headerName);
              contact[field] = values[index] || "";
            }
          });
          
          // If no first/last name but we have email, try to guess
          if (!contact.firstName && !contact.lastName && contact.email) {
            const guessed = guessNameFromEmail(contact.email);
            contact.firstName = guessed.firstName;
            contact.lastName = guessed.lastName;
          }
          
          return contact;
        }).filter(contact => contact.email && (contact.firstName || contact.lastName));

        if (contacts.length === 0) {
          toast.error("No valid contacts found in LinkedIn data");
          return;
        }

        await importLinkedIn({ contacts });
        toast.success(`Successfully imported ${contacts.length} LinkedIn connections`);
      } else {
        // Parse regular CSV format with mapping
        const contacts = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
          const contact: any = {};
          
          // Map columns based on user selection
          Object.entries(columnMapping).forEach(([field, headerName]) => {
            if (headerName && headers.includes(headerName)) {
              const index = headers.indexOf(headerName);
              contact[field] = values[index] || "";
            }
          });
          
          // If no first/last name but we have email, try to guess
          if (!contact.firstName && !contact.lastName && contact.email) {
            const guessed = guessNameFromEmail(contact.email);
            contact.firstName = guessed.firstName;
            contact.lastName = guessed.lastName;
          }
          
          return contact;
        }).filter(contact => contact.email && (contact.firstName || contact.lastName));

        if (contacts.length === 0) {
          toast.error("No valid contacts found in CSV data");
          return;
        }

        await importContacts({ contacts });
        toast.success(`Successfully imported ${contacts.length} contacts`);
      }
      
      onClose();
    } catch (error) {
      toast.error("Failed to import contacts");
    } finally {
      setIsImporting(false);
    }
  };

  const getPlaceholderText = () => {
    if (importType === "linkedin") {
      return `First Name,Last Name,URL,Email Address,Company,Position,Connected On
Julia,Edwall,https://www.linkedin.com/in/jedwall,,Investerum,Chief Operating Officer,11 Oct 2025
Sofia,Ilie,https://www.linkedin.com/in/sofia-ilie-76754318a,,shots,Sales Executive,11 Oct 2025`;
    } else {
      return `1,email,Land,Ansvar,Företag,Skickat? (448),Kommentar
121,rasmus@relaystudio.co,Danmark,Calle,Relay Studio,,
122,andreas@relaystudio.co,Danmark,Calle,Relay Studio,,
123,joyce@relaystudio.co,Danmark,Calle,Relay Studio,,
124,meredith@relaystudio.co,Danmark,Calle,Relay Studio,,
125,maranc@google.com,England,Calle,Google CL,,
126,russell.hall@imagination.com,England,Calle,Imagination,,`;
    }
  };

  const getInstructions = () => {
    if (importType === "linkedin") {
      return (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Paste your LinkedIn connections CSV data below. Expected columns: First Name, Last Name, URL, Email Address, Company, Position, Connected On
          </p>
          <p className="text-xs text-gray-500 mb-2">
            To export from LinkedIn: Go to Settings & Privacy → Data Privacy → Get a copy of your data → Want something in particular? → Connections → Request archive
          </p>
          <p className="text-xs text-gray-400">
            Note: Email addresses may be missing if connections haven't made them visible to their network.
          </p>
        </div>
      );
    } else {
      return (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Paste your CSV data below. Expected columns: First Name, Last Name, Email, Phone, Company, Position
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Example: First Name,Last Name,Email,Phone,Company,Position
          </p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Import Contacts</h2>
        
        {/* Import Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Import Type
          </label>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setImportType("csv")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                importType === "csv"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Regular CSV
            </button>
            <button
              onClick={() => setImportType("linkedin")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                importType === "linkedin"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              LinkedIn Export
            </button>
          </div>
        </div>

        {getInstructions()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CSV Data Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste your CSV data
            </label>
            <textarea
              value={csvData}
              onChange={(e) => handleCsvDataChange(e.target.value)}
              placeholder={getPlaceholderText()}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono text-sm"
            />
          </div>

          {/* Column Mapping */}
          {headers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Map CSV columns to contact fields
              </label>
              <div className="space-y-3">
                {Object.entries(columnMapping).map(([field, currentMapping]) => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="w-20 text-sm text-gray-600 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}:
                    </label>
                    <select
                      value={currentMapping}
                      onChange={(e) => setColumnMapping(prev => ({
                        ...prev,
                        [field]: e.target.value
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    >
                      <option value="">Select column...</option>
                      {headers.map(header => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              
              {/* Preview */}
              {previewData.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview (first 5 rows)
                  </label>
                  <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                    <div className="text-xs font-mono">
                      {previewData.map((row, index) => (
                        <div key={index} className="mb-1">
                          {Object.entries(columnMapping).map(([field, headerName]) => {
                            if (!headerName) return null;
                            const value = row[headerName] || '';
                            return (
                              <span key={field} className="mr-2">
                                <span className="text-blue-600">{field}:</span> {value}
                              </span>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <button
            onClick={handleImport}
            disabled={isImporting || !columnMapping.email}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isImporting ? "Importing..." : `Import ${importType === "linkedin" ? "LinkedIn Connections" : "Contacts"}`}
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
