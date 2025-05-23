import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface TrackerNote {
  id: string;
  note_text: string;
  created_at: string;
}

interface TrackerNotesWidgetProps {
  transactionId: string;
  userRole: string;
}

// Predefined tracker note options for quick selection
const TRACKER_NOTE_OPTIONS = [
  "Hardship package submitted to lender",
  "Waiting for lender acknowledgment", 
  "Property valuation ordered",
  "Reviewing offer with lender",
  "Negotiating terms with lender",
  "Final approval received",
  "Preparing closing documents",
  "Scheduling closing date"
];

export default function TrackerNotesWidget({ transactionId, userRole }: TrackerNotesWidgetProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tracker notes
  const { data: notes = [], isLoading } = useQuery<TrackerNote[]>({
    queryKey: [`/api/v1/transactions/${transactionId}/tracker-notes`],
    enabled: !!transactionId
  });

  // Create tracker note mutation
  const createNoteMutation = useMutation({
    mutationFn: (noteData: { note_text: string }) => 
      apiRequest(`/api/v1/transactions/${transactionId}/tracker-notes`, 'POST', noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}/tracker-notes`] });
      setNoteText("");
      setSelectedOption("");
      setIsAddingNote(false);
      toast({
        title: "Activity Note Added",
        description: "The tracker note has been added successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add tracker note. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAddNote = () => {
    const finalNoteText = selectedOption || noteText;
    if (!finalNoteText.trim()) return;

    createNoteMutation.mutate({ note_text: finalNoteText });
  };

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
    setNoteText(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Activity Notes
          </CardTitle>
          {userRole === 'negotiator' && !isAddingNote && (
            <Button size="sm" onClick={() => setIsAddingNote(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAddingNote && userRole === 'negotiator' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 p-4 border rounded-lg bg-gray-50"
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Quick Options</label>
                <Select value={selectedOption} onValueChange={handleOptionSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pre-written note or write custom..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACKER_NOTE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Custom Note</label>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter activity note..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || createNoteMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingNote(false);
                    setNoteText("");
                    setSelectedOption("");
                  }}
                  disabled={createNoteMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {isLoading && (
            <div className="text-center text-gray-500 py-4">
              Loading activity notes...
            </div>
          )}
          
          {!isLoading && notes.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No activity notes yet.
              {userRole === 'negotiator' && " Add the first note to track progress."}
            </div>
          )}
          
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 p-3 border rounded-lg bg-white"
            >
              <Badge variant="outline" className="mt-0.5">
                <Clock className="mr-1 h-3 w-3" />
                {formatDate(note.created_at)}
              </Badge>
              <p className="text-sm text-gray-700 flex-1">{note.note_text}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}