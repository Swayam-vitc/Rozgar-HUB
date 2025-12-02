import { EmployerSidebar } from "@/components/EmployerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, CheckCircle2, CreditCard } from "lucide-react";
import { messageAPI, employerAPI } from "@/lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { RatingModal } from "@/components/RatingModal";
import axios from "axios";

interface Message {
  _id: string;
  text: string;
  senderId: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  createdAt: string;
}

interface Conversation {
  _id: string;
  connectionId: string;
  jobTitle: string;
  otherUser: {
    _id: string;
    name: string;
    profilePhoto?: string;
    role: string;
  };
  lastMessage: {
    text: string;
    timestamp: string;
  };
  unreadCount: number;
  hireRequestStatus?: string;
  paid?: boolean;
  completed?: boolean;
  rating?: number;
  hireRequestId?: {
    _id: string;
  };
}

export default function Messages() {
  const { user } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingConversation, setRatingConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Socket.io event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    socket.on("receive-message", (data: any) => {
      if (selectedConversation && data.message.connectionId === selectedConversation.connectionId) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();

        // Mark as read
        messageAPI.markAsRead(selectedConversation.connectionId);
      }

      // Update conversation list
      fetchConversations();
    });

    socket.on("new-message-notification", () => {
      fetchConversations();
    });

    return () => {
      socket.off("receive-message");
      socket.off("new-message-notification");
    };
  }, [socket, isConnected, selectedConversation]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getConversations() as any;
      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (connectionId: string) => {
    try {
      const response = await messageAPI.getMessages(connectionId) as any;
      if (response.success) {
        setMessages(response.messages);

        // Mark as read
        await messageAPI.markAsRead(connectionId);
        fetchConversations(); // Refresh to update unread count
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.connectionId);

    // Join Socket.io room
    if (socket) {
      socket.emit("join-conversation", conversation.connectionId);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !socket) return;

    const text = messageText.trim();
    setMessageText("");
    setSending(true);

    try {
      // Send via Socket.io
      socket.emit("send-message", {
        connectionId: selectedConversation.connectionId,
        text
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handlePayment = async (connectionId: string) => {
    try {
      await employerAPI.markHireRequestPaid(connectionId);
      toast.success("Payment marked as complete!");
      fetchConversations();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    }
  };

  const handleJobDone = (conversation: Conversation) => {
    setRatingConversation(conversation);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (rating: number, feedback: string) => {
    if (!ratingConversation) return;

    try {
      const response = await employerAPI.completeJobWithRating(ratingConversation.connectionId, {
        rating,
        feedback
      }) as any;
      toast.success("Rating submitted successfully!");
      setShowRatingModal(false);
      setRatingConversation(null);
      fetchConversations();

      // Clear selected conversation if it was the rated one
      if (selectedConversation?.connectionId === ratingConversation.connectionId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <EmployerSidebar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="p-4 md:p-6 border-b">
            <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground text-sm">
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </p>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Conversations List */}
            <div className="w-full md:w-80 border-r overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start chatting when you connect with employers
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedConversation?._id === conv._id ? "bg-muted" : ""
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={conv.otherUser.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser.name}`} />
                        <AvatarFallback>{conv.otherUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">{conv.otherUser.name}</h3>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{conv.jobTitle}</p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conv.lastMessage.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(conv.lastMessage.timestamp), "MMM d, h:mm a")}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          {conv.hireRequestStatus === 'accepted' && !conv.paid && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handlePayment(conv.connectionId)}
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              Pay
                            </Button>
                          )}
                          {conv.hireRequestStatus === 'accepted' && conv.paid && !conv.completed && (
                            <Button
                              size="sm"
                              className="text-xs gradient-saffron text-white"
                              onClick={() => handleJobDone(conv)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Job Done
                            </Button>
                          )}
                          {conv.completed && (
                            <span className="text-xs text-green-600 font-medium flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedConversation.otherUser.profilePhoto} />
                      <AvatarFallback>
                        {selectedConversation.otherUser.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold">{selectedConversation.otherUser.name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedConversation.jobTitle}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwnMessage = message.senderId._id === user?._id;
                        return (
                          <div
                            key={message._id}
                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}
                            >
                              <p className="text-sm">{message.text}</p>
                              <p className={`text-xs mt-1 ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {format(new Date(message.createdAt), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  {selectedConversation?.completed ? (
                    <div className="p-4 border-t bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground">
                        This job has been completed. Chat is now disabled.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type a message..."
                          disabled={!isConnected || sending}
                          className="flex-1"
                        />
                        <Button
                          type="submit"
                          disabled={!isConnected || sending || !messageText.trim()}
                          size="icon"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-xl font-semibold mb-2">Select a conversation</p>
                    <p className="text-muted-foreground">
                      Choose a conversation from the left to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Rating Modal */}
      {ratingConversation && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingConversation(null);
          }}
          onSubmit={handleSubmitRating}
          workerName={ratingConversation.otherUser.name}
        />
      )}
    </div>
  );
}
