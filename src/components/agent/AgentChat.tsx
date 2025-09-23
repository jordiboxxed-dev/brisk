import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface AgentChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'agent';
  content: string;
}

const AgentChat = ({ isOpen, onClose }: AgentChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content: "¡Hola! Soy Brisk Insights, tu asistente financiero personal. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: { messages: newMessages },
      });

      if (error) {
        throw error;
      }

      // Asumimos que n8n devuelve una respuesta con el formato { "reply": "..." }
      const agentResponse: Message = {
        role: 'agent',
        content: data.reply || "Lo siento, no pude procesar tu solicitud.",
      };
      setMessages((prev) => [...prev, agentResponse]);

    } catch (error: any) {
      console.error('Error al llamar la función del agente:', error);
      showError('Hubo un error al contactar al asistente.');
      const errorResponse: Message = {
        role: 'agent',
        content: "Hubo un problema de conexión. Por favor, inténtalo de nuevo.",
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Brisk Insights
          </SheetTitle>
          <SheetDescription>
            Tu co-piloto financiero inteligente.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4 -mr-6" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'agent' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Sparkles className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs rounded-lg px-4 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex items-start gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Sparkles className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                    </div>
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter>
          <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale a tus finanzas..."
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AgentChat;