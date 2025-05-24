
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, User, Bot, Loader2, X } from 'lucide-react';
import { chatWithBot, type ChatWithBotOutput } from '@/ai/flows/chat-flow';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      text: inputValue,
      sender: 'user',
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response: ChatWithBotOutput = await chatWithBot({ userInput: userMessage.text });
      const botMessage: Message = {
        id: Date.now().toString() + '-bot',
        text: response.botResponse,
        sender: 'bot',
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        text: "Sorry, I couldn't get a response. Please try again.",
        sender: 'bot',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      toast({
        variant: "destructive",
        title: "Chatbot Error",
        description: "Failed to connect to the chatbot.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpen = () => {
    setIsOpen(true);
    // Add an initial greeting message from the bot when chat opens for the first time in session
    if (messages.length === 0) {
      setMessages([
        { id: 'initial-greeting', text: "Hello! I'm StudySmarts AI. How can I help you today?", sender: 'bot' }
      ]);
    }
  }


  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 animate-bounce z-50"
        aria-label="Open Chatbot"
      >
        <MessageSquare className="h-7 w-7" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] md:max-w-[600px] lg:max-w-[500px] p-0 flex flex-col h-[70vh] max-h-[600px]">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center">
              <Bot className="mr-2 h-6 w-6 text-primary" /> StudySmarts AI Chat
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ask questions or get help with your studies.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end space-x-2 ${
                    message.sender === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.sender === 'bot' && (
                    <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {message.text.split('\\n').map((line, index) => (
                        <span key={index}>
                        {line}
                        <br />
                        </span>
                    ))}
                  </div>
                  {message.sender === 'user' && (
                    <User className="h-6 w-6 text-secondary-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <Bot className="h-6 w-6 text-primary animate-pulse" />
                  <div className="max-w-[70%] rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Typing...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t">
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} size="icon" aria-label="Send message">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </DialogFooter>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:bg-muted/50"
            aria-label="Close chat"
           >
            <X className="h-5 w-5" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
