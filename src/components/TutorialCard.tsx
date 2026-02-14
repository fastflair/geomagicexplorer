import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen } from "lucide-react";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";

export interface Tutorial {
  id: string;
  title: string;
  readingTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  content: string;
  takeaways: string[];
}

const difficultyColor: Record<Tutorial["difficulty"], string> = {
  Beginner: "bg-accent text-accent-foreground",
  Intermediate: "bg-primary/20 text-primary",
  Advanced: "bg-destructive/20 text-destructive",
};

export default function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <AccordionItem value={tutorial.id} className="border-border">
      <AccordionTrigger className="hover:no-underline px-1 gap-3">
        <div className="flex flex-1 items-center gap-3 text-left">
          <BookOpen className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-semibold text-foreground">{tutorial.title}</span>
          <Badge className={`ml-auto shrink-0 text-[10px] ${difficultyColor[tutorial.difficulty]}`}>
            {tutorial.difficulty}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            {tutorial.readingTime}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-1">
        <article className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-secondary prose-pre:text-secondary-foreground prose-pre:rounded-lg prose-pre:border prose-pre:border-border prose-code:text-primary prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 prose-a:text-primary">
          <ReactMarkdown>{tutorial.content}</ReactMarkdown>
        </article>
        {tutorial.takeaways.length > 0 && (
          <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-4">
            <h4 className="text-sm font-bold text-foreground mb-2">🔑 Key Takeaways</h4>
            <ul className="list-disc list-inside space-y-1">
              {tutorial.takeaways.map((t, i) => (
                <li key={i} className="text-sm text-muted-foreground">{t}</li>
              ))}
            </ul>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
