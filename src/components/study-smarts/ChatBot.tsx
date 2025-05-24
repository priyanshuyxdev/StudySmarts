
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, User, Bot, Loader2 } from 'lucide-react';
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
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

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
    if (messages.length === 0) {
      setMessages([
        { id: 'initial-greeting', text: "Hello! I'm StudySmarts AI. How can I help you today?", sender: 'bot' }
      ]);
    }
  }

  const renderMessageContent = (text: string) => {
    // Check if the message likely contains a code block
    if (!text.includes("```")) {
      // Original rendering for non-code messages, splitting by actual newline characters
      return text.split('\n').map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          {idx < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    }

    const parts = text.split("```");
    return parts.map((part, index) => {
      if (index % 2 === 1) { // This is a code block part
        const lines = part.split('\n');
        const language = lines[0].trim(); // e.g., "cpp" or empty if no language specified
        const codeContent = lines.slice(1).join('\n').trim(); // The actual code

        return (
          <pre
            key={index}
            className="font-mono bg-muted/70 dark:bg-muted/50 text-foreground p-3 my-2 rounded-md block whitespace-pre-wrap overflow-x-auto text-sm"
          >
            {language && <div className="text-xs text-muted-foreground/80 mb-1 capitalize">{language}</div>}
            <code>{codeContent}</code>
          </pre>
        );
      } else { // This is a normal text part
        // Render normal text, respecting its internal newlines
        return part.split('\n').map((line, lineIdx) => (
           <React.Fragment key={`${index}-${lineIdx}`}>
             {line}
             {lineIdx < part.split('\n').length - 1 && <br />}
           </React.Fragment>
        ));
      }
    });
  };


  return (
    <>
      <Button
        onClick={handleOpen}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg text-white 
                   bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 
                   hover:from-purple-600 hover:via-pink-600 hover:to-red-600 
                   focus:ring-4 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800 
                   shadow-pink-500/50 dark:shadow-lg dark:shadow-pink-800/80 
                   z-50 transition-all duration-300 ease-in-out transform hover:scale-110"
        aria-label="Open Chatbot"
      >
        <Sparkles className="h-7 w-7" /> 
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
                    <Bot className="h-6 w-6 text-primary flex-shrink-0 self-start mt-1" />
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {renderMessageContent(message.text)}
                  </div>
                  {message.sender === 'user' && (
                    <User className="h-6 w-6 text-secondary-foreground flex-shrink-0 self-start mt-1" />
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <Bot className="h-6 w-6 text-primary" />
                  <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground">
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
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !inputValue.trim()} 
                size="icon" 
                aria-label="Send message"
                className="text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 focus:ring-2 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
