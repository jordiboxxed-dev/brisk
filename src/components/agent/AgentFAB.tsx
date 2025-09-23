import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface AgentFABProps {
  onClick: () => void;
}

const AgentFAB = ({ onClick }: AgentFABProps) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg z-50"
      size="icon"
    >
      <Sparkles className="h-8 w-8" />
      <span className="sr-only">Abrir Brisk Insights</span>
    </Button>
  );
};

export default AgentFAB;