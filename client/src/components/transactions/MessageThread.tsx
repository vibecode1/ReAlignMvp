import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle, Reply, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface MessageSender {
  id: string;
  name: string;
  role: string;
}

interface MessageInfo {
  id: string;
  sender: MessageSender;
  text: string;
  replyTo: string | null;
  isSeedMessage: boolean;
  created_at: string;
}

interface MessageThreadProps {
  transactionId: string;
  messages: MessageInfo[];
  currentUserRole: string;
  isLoading?: boolean;
}

export const MessageThread = ({ 
  transactionId, 
  messages,
  currentUserRole,
  isLoading = false
}: MessageThreadProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<MessageInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const canPostNewTopLevel = currentUserRole === 'negotiator';
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await apiRequest('POST', `/api/v1/transactions/${transactionId}/messages`, {
        text: newMessage,
        replyTo: replyToMessage?.id || null,
        isSeedMessage: false
      });
      
      // Reset input and reply state
      setNewMessage("");
      setReplyToMessage(null);
      
      // Invalidate messages query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}/messages`] });
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setError("Failed to send message. Please try again.");
      toast({
        title: "Failed to Send Message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  // Group messages for replies
  const messageGroups: Record<string, MessageInfo[]> = {};
  const topLevelMessages: MessageInfo[] = [];
  
  // First pass: collect all top-level messages and create empty groups
  messages.forEach(msg => {
    if (!msg.replyTo) {
      topLevelMessages.push(msg);
      messageGroups[msg.id] = [];
    }
  });
  
  // Second pass: collect replies
  messages.forEach(msg => {
    if (msg.replyTo && messageGroups[msg.replyTo]) {
      messageGroups[msg.replyTo].push(msg);
    }
  });
  
  // Sort messages by date (oldest first)
  const sortedTopLevelMessages = [...topLevelMessages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <MessageCircle className="mr-2 h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : sortedTopLevelMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No messages yet. {canPostNewTopLevel ? 'Start the conversation!' : 'Wait for the negotiator to start the conversation.'}</p>
            </div>
          ) : (
            sortedTopLevelMessages.map(message => (
              <div key={message.id} className="space-y-3">
                {/* Parent message */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`
                    p-3 rounded-lg 
                    ${message.isSeedMessage ? 'bg-blue-50 border border-blue-100' : 'bg-gray-100'}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium flex items-center">
                      {message.sender.name}
                      <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                        {message.sender.role}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {!message.isSeedMessage && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-1"
                      onClick={() => setReplyToMessage(message)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </motion.div>
                
                {/* Replies */}
                {messageGroups[message.id]?.length > 0 && (
                  <div className="pl-6 border-l-2 border-gray-200 space-y-3">
                    {messageGroups[message.id]
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map(reply => (
                        <motion.div 
                          key={reply.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-3 rounded-lg bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium flex items-center">
                              {reply.sender.name}
                              <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                                {reply.sender.role}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(reply.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{reply.text}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-1"
                            onClick={() => setReplyToMessage(message)}
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                        </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 rounded flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
        
        {/* Reply notification */}
        {replyToMessage && (
          <div className="mb-4 p-2 bg-blue-50 text-blue-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              <Reply className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm truncate">
                Replying to <strong>{replyToMessage.sender.name}</strong>: {replyToMessage.text.slice(0, 50)}
                {replyToMessage.text.length > 50 ? '...' : ''}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelReply}
              className="ml-2 flex-shrink-0"
            >
              Cancel
            </Button>
          </div>
        )}
        
        {/* New message form */}
        {(canPostNewTopLevel || replyToMessage) && (
          <div className="flex flex-col space-y-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyToMessage ? "Type your reply..." : "Type your message..."}
              className="min-h-24 resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {replyToMessage ? "Send Reply" : "Send Message"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {!canPostNewTopLevel && !replyToMessage && (
          <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">
            Only negotiators can start new conversations. You can reply to existing messages.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageThread;
