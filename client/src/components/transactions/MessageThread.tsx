import React, { useState, useRef, useEffect } from 'react';
import { Send, Reply, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  text: string;
  replyTo: string | null;
  isSeedMessage: boolean;
  created_at: string;
}

interface MessageThreadProps {
  messages: Message[];
  currentUserRole?: string;
  currentUserId?: string; // Added for party role views
  onSendMessage: (text: string, replyToId?: string) => void;
  onUpload?: (file: File) => void;
  initialMessageEditable?: boolean;
  isNegotiator?: boolean; // Added for party role views
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  currentUserRole,
  currentUserId,
  onSendMessage,
  onUpload,
  initialMessageEditable = false,
  isNegotiator
}) => {
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingSeedMessage, setEditingSeedMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Helper to get the initial/seed message
  const seedMessage = messages.find(msg => msg.isSeedMessage);
  
  // Get the message being replied to (if any)
  const replyToMessage = replyingTo 
    ? messages.find(msg => msg.id === replyingTo) 
    : null;
  
  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText, replyingTo || undefined);
      setMessageText('');
      setReplyingTo(null);
    }
  };
  
  // Handle saving edited seed message
  const handleSaveSeedMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
      setEditingSeedMessage(false);
    }
  };
  
  // Handle canceling reply
  const cancelReply = () => {
    setReplyingTo(null);
  };
  
  // Start editing seed message
  const startEditingSeedMessage = () => {
    if (seedMessage && initialMessageEditable) {
      setMessageText(seedMessage.text);
      setEditingSeedMessage(true);
    }
  };
  
  // Check if user can send new messages (only negotiators)
  const canSendNewMessage = isNegotiator !== undefined 
    ? isNegotiator 
    : currentUserRole === 'negotiator';
  
  // Check if user can reply to messages (all users)
  const canReplyToMessages = true;
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format role for display
  const formatRole = (role: string) => {
    switch(role) {
      case 'negotiator': return 'Negotiator';
      case 'seller': return 'Seller';
      case 'buyer': return 'Buyer';
      case 'listing_agent': return 'Listing Agent';
      case 'buyers_agent': return 'Buyer\'s Agent';
      case 'escrow': return 'Escrow';
      default: return role;
    }
  };
  
  // Get color for avatar based on role
  const getRoleColor = (role: string) => {
    switch(role) {
      case 'negotiator': return 'bg-primary text-primary-foreground';
      case 'seller': return 'bg-blue-500 text-white';
      case 'buyer': return 'bg-green-500 text-white';
      case 'listing_agent': return 'bg-purple-500 text-white';
      case 'buyers_agent': return 'bg-indigo-500 text-white';
      case 'escrow': return 'bg-amber-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>Transaction Messages</CardTitle>
      </CardHeader>
      
      <CardContent className="overflow-y-auto max-h-[500px]">
        <div className="space-y-4">
          {messages.map(message => {
            // Check if this message is being replied to
            const isBeingRepliedTo = message.id === replyingTo;
            
            // Check if this is a seed message being edited
            const isEditableSeed = message.isSeedMessage && initialMessageEditable;
            
            // Check if this is a reply message
            const isReply = !!message.replyTo;
            
            // Find parent message for replies
            const parentMessage = isReply 
              ? messages.find(m => m.id === message.replyTo)
              : null;
              
            return (
              <div 
                key={message.id} 
                className={cn(
                  "relative",
                  isBeingRepliedTo ? "bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-900" : "",
                  isReply ? "pl-4 ml-6 border-l-2 border-gray-200 dark:border-gray-700" : ""
                )}
              >
                {isReply && parentMessage && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <Reply className="h-3 w-3 inline mr-1" />
                    Replying to {parentMessage.sender.name}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Avatar className={cn("h-8 w-8", getRoleColor(message.sender.role))}>
                    <AvatarFallback>{getInitials(message.sender.name)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{message.sender.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRole(message.sender.role)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(message.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    
                    {isEditableSeed && editingSeedMessage ? (
                      <div className="mt-1">
                        <Textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="min-h-[100px] mb-2"
                          placeholder="Edit transaction introduction..."
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingSeedMessage(false);
                              setMessageText('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleSaveSeedMessage}
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">
                          {message.text}
                        </p>
                        
                        {canReplyToMessages && !isEditableSeed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            onClick={() => setReplyingTo(message.id)}
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                        )}
                        
                        {isEditableSeed && !editingSeedMessage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={startEditingSeedMessage}
                          >
                            Edit Introduction
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t flex flex-col">
        {replyingTo && replyToMessage && (
          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm flex justify-between items-center w-full">
            <div>
              <span className="font-medium">Replying to {replyToMessage.sender.name}:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">
                {replyToMessage.text.length > 50 
                  ? `${replyToMessage.text.substring(0, 50)}...` 
                  : replyToMessage.text}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={cancelReply}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Cancel
            </Button>
          </div>
        )}
        
        {/* Only allow negotiators to start new threads or allow replies from everyone */}
        {(canSendNewMessage || (replyingTo && canReplyToMessages)) && (
          <div className="w-full">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={replyingTo ? "Type your reply..." : "Type a new message..."}
              className="min-h-[80px] mb-2"
            />
            <div className="flex justify-between items-center">
              {onUpload && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file && onUpload) {
                        onUpload(file);
                      }
                    };
                    input.click();
                  }}
                >
                  Attach File
                </Button>
              )}
              
              <Button 
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="ml-auto"
              >
                <Send className="h-4 w-4 mr-2" />
                {replyingTo ? 'Send Reply' : 'Send Message'}
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default MessageThread;