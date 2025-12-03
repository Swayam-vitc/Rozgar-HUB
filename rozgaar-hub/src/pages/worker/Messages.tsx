import { WorkerSidebar } from "@/components/WorkerSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, Star } from "lucide-react";
import { messageAPI } from "@/lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";

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
  completed?: boolean;
  rating?: number;
  feedback?: string;
}

export default function Messages() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
      toast.error(t('common.loadingError') || "Failed to load conversations");
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
      toast.error(t('common.loadingError') || "Failed to load messages");
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

  const handleSendMessage = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
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
      toast.error(t('common.error') || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('loadingMessages')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <WorkerSidebar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="p-4 md:p-6 border-b">
            <h1 className="text-2xl md:text-3xl font-bold">{t('messagesTitle')}</h1>
            <p className="text-muted-foreground text-sm">
              {isConnected ? `🟢 ${t('connected')}` : `🔴 ${t('disconnected')}`}
            </p>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Conversations List */}
            <div className="w-full md:w-80 border-r overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('noConversations')}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('startChatting')}
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

                        {/* Rating Display */}
                        {conv.completed && conv.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < conv.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">({conv.rating}/5)</span>
                          </div>
                        )}
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
                        const isOwnMessage = message.senderId._id === (user as any)?._id;
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
                    <div className="p-4 border-t bg-muted/50">
                      <p className="text-sm text-muted-foreground text-center mb-2">
                        {t('jobCompletedChatDisabled')}
                      </p>
                      {selectedConversation.rating && (
                        <div className="bg-card p-3 rounded-lg border">
                          <p className="text-xs font-medium mb-2">{t('yourRating')}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < selectedConversation.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{selectedConversation.rating}/5</span>
                          </div>
                          {selectedConversation.feedback && (
                            <p className="text-xs text-muted-foreground mt-2">
                              "{selectedConversation.feedback}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder={t('typeMessage')}
                          disabled={!isConnected || sending}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleSendMessage}
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
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-xl font-semibold mb-2">{t('selectConversation')}</p>
                    <p className="text-muted-foreground">
                      {t('chooseConversation')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
