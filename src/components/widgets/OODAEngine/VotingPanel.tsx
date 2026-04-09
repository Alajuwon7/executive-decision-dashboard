"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/formatters";
import type { AdminVote, VoteChoice } from "@/lib/data/ooda-types";
import { ThumbsUp, ThumbsDown, Flag } from "lucide-react";

interface VotingPanelProps {
  votes: Record<string, AdminVote>;
  currentUserId: string;
  onVote: (vote: VoteChoice, note?: string) => void;
}

const VOTE_OPTIONS: { choice: VoteChoice; label: string; icon: any; variant: "success" | "danger" | "warning" }[] = [
  { choice: "agree", label: "Agree", icon: ThumbsUp, variant: "success" },
  { choice: "disagree", label: "Disagree", icon: ThumbsDown, variant: "danger" },
  { choice: "flag", label: "Flag", icon: Flag, variant: "warning" },
];

export function VotingPanel({ votes, currentUserId, onVote }: VotingPanelProps) {
  const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(votes[currentUserId]?.vote ?? null);
  const [note, setNote] = useState(votes[currentUserId]?.note ?? "");
  const hasVoted = !!votes[currentUserId];

  const otherVotes = Object.entries(votes).filter(([uid]) => uid !== currentUserId);
  const votesConflict = otherVotes.length > 0 && otherVotes.some(([, v]) => v.vote !== selectedVote) && selectedVote;

  const handleVote = (choice: VoteChoice) => {
    setSelectedVote(choice);
    onVote(choice, note || undefined);
  };

  return (
    <div className="bg-surface-elevated rounded-[12px] p-4 mt-4">
      <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3">Your Vote</p>

      <div className="flex gap-2 mb-3">
        {VOTE_OPTIONS.map(({ choice, label, icon: Icon, variant }) => (
          <Button
            key={choice}
            size="sm"
            variant={selectedVote === choice ? "primary" : "secondary"}
            className={cn(
              selectedVote === choice && variant === "success" && "!bg-success !text-bg",
              selectedVote === choice && variant === "danger" && "!bg-danger !text-bg",
              selectedVote === choice && variant === "warning" && "!bg-accent !text-bg",
            )}
            onClick={() => handleVote(choice)}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Button>
        ))}
      </div>

      <Input
        placeholder="Add a note (optional)"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          if (selectedVote) onVote(selectedVote, e.target.value || undefined);
        }}
        className="text-xs"
      />

      {/* Other admin votes */}
      {otherVotes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] text-text-faint uppercase tracking-wider mb-2">Other Votes</p>
          {otherVotes.map(([uid, v]) => (
            <div key={uid} className="flex items-center gap-2">
              <Badge variant={v.vote === "agree" ? "success" : v.vote === "disagree" ? "danger" : "warning"} className="text-[10px]">
                {v.vote}
              </Badge>
              {v.note && <span className="text-xs text-text-muted">"{v.note}"</span>}
            </div>
          ))}
        </div>
      )}

      {votesConflict && (
        <div className="mt-3 p-2.5 bg-[rgba(245,158,11,0.08)] border border-accent/20 rounded-[8px]">
          <p className="text-xs text-accent">Votes differ — consider discussing before proceeding.</p>
        </div>
      )}
    </div>
  );
}
