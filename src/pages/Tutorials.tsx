import { Link } from "react-router-dom";
import { Globe, ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import TutorialCard from "@/components/TutorialCard";
import { leaderTutorials, analystTutorials, developerTutorials } from "@/data/tutorials";

const tracks = [
  { id: "leaders", label: "Leaders & Strategists", tutorials: leaderTutorials },
  { id: "analysts", label: "Analysts & GIS Pros", tutorials: analystTutorials },
  { id: "developers", label: "Developers & Engineers", tutorials: developerTutorials },
];

export default function Tutorials() {
  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Nav header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Map
        </Link>
        <div className="mx-3 h-5 w-px bg-border" />
        <Globe className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold tracking-tight">Geospatial Tutorials</h1>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Learn Geospatial + AI</h2>
            <p className="text-muted-foreground">
              A structured learning path from strategy to code. Pick your track and dive in.
            </p>
          </div>

          <Tabs defaultValue="leaders" className="w-full">
            <TabsList className="mb-6 w-full justify-start bg-secondary/50">
              {tracks.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="text-xs sm:text-sm">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tracks.map((track) => (
              <TabsContent key={track.id} value={track.id}>
                <Accordion type="single" collapsible className="space-y-2">
                  {track.tutorials.map((tut) => (
                    <TutorialCard key={tut.id} tutorial={tut} />
                  ))}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
