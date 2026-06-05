"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  documentId: string;
  initialContent: object | null;
  readOnly?: boolean;
};

const AUTOSAVE_DELAY = 1500; // ms after last keystroke

export default function Editor({
  documentId,
  initialContent,
  readOnly = false,
}: Props) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (content: object) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error("Save failed");
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    },
    [documentId],
  );

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [StarterKit.configure({ underline: false }), Underline],
    content:
      initialContent && Object.keys(initialContent).length > 0
        ? initialContent
        : { type: "doc", content: [{ type: "paragraph" }] },
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[60vh] px-1",
      },
    },
    onUpdate({ editor }) {
      if (readOnly) return;
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        save(editor.getJSON());
      }, AUTOSAVE_DELAY);
    },
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        {!readOnly && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-card flex-wrap sticky top-14 z-10">
            <ToolbarToggle
              label="Bold"
              icon={<Bold className="h-4 w-4" />}
              pressed={editor.isActive("bold")}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
            />
            <ToolbarToggle
              label="Italic"
              icon={<Italic className="h-4 w-4" />}
              pressed={editor.isActive("italic")}
              onPressedChange={() =>
                editor.chain().focus().toggleItalic().run()
              }
              disabled={!editor.can().chain().focus().toggleItalic().run()}
            />
            <ToolbarToggle
              label="Underline"
              icon={<UnderlineIcon className="h-4 w-4" />}
              pressed={editor.isActive("underline")}
              onPressedChange={() =>
                editor.chain().focus().toggleUnderline().run()
              }
            />

            <Separator orientation="vertical" className="h-5 mx-1" />

            <ToolbarToggle
              label="Heading 1"
              icon={<Heading1 className="h-4 w-4" />}
              pressed={editor.isActive("heading", { level: 1 })}
              onPressedChange={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            />
            <ToolbarToggle
              label="Heading 2"
              icon={<Heading2 className="h-4 w-4" />}
              pressed={editor.isActive("heading", { level: 2 })}
              onPressedChange={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            />
            <ToolbarToggle
              label="Heading 3"
              icon={<Heading3 className="h-4 w-4" />}
              pressed={editor.isActive("heading", { level: 3 })}
              onPressedChange={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            />

            <Separator orientation="vertical" className="h-5 mx-1" />

            <ToolbarToggle
              label="Bullet List"
              icon={<List className="h-4 w-4" />}
              pressed={editor.isActive("bulletList")}
              onPressedChange={() =>
                editor.chain().focus().toggleBulletList().run()
              }
            />
            <ToolbarToggle
              label="Numbered List"
              icon={<ListOrdered className="h-4 w-4" />}
              pressed={editor.isActive("orderedList")}
              onPressedChange={() =>
                editor.chain().focus().toggleOrderedList().run()
              }
            />

            {/* Save status indicator */}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground pr-1">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <span className="text-destructive">Save failed</span>
              )}
            </div>
          </div>
        )}

        {/* Editor content */}
        <div
          className={cn(
            "flex-1 px-6 py-6 overflow-y-auto pt-16",
            readOnly && "cursor-default",
          )}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </TooltipProvider>
  );
}

function ToolbarToggle({
  label,
  icon,
  pressed,
  onPressedChange,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  pressed: boolean;
  onPressedChange: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={pressed}
          onPressedChange={onPressedChange}
          disabled={disabled}
          aria-label={label}
        >
          {icon}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
