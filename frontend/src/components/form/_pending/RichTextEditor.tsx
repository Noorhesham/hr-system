"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Quote, Redo, Undo, Heading1, Heading2, Heading3, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import React from "react";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
  name?: string;
  label?: string;
  required?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const buttons = [
    {
      icon: <Bold className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
      label: "Bold",
    },
    {
      icon: <Italic className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
      label: "Italic",
    },
    {
      icon: <Heading1 className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
      label: "H1",
    },
    {
      icon: <Heading2 className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
      label: "H2",
    },
    {
      icon: <Heading3 className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
      label: "H3",
    },
    {
      icon: <List className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
      label: "Bullet List",
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
      label: "Ordered List",
    },
    {
      icon: <Quote className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
      label: "Blockquote",
    },
    {
      icon: <Code className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock"),
      label: "Code Block",
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/50">
      {buttons.map((btn, i) => (
        <Button
          key={i}
          type="button"
          variant="ghost"
          size="sm"
          onClick={btn.onClick}
          className={cn(
            "h-8 w-8 p-0 rounded-md transition-all",
            btn.isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-primary/10",
          )}
          title={btn.label}
        >
          {btn.icon}
        </Button>
      ))}
      <div className="flex-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 p-0 rounded-md"
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-8 w-8 p-0 rounded-md"
      >
        <Redo className="w-4 h-4" />
      </Button>
    </div>
  );
};

export function RichTextEditor({
  value: externalValue,
  onChange: externalOnChange,
  placeholder,
  className,
  onBlur,
  name,
  label,
  required,
}: RichTextEditorProps) {
  const formContext = useFormContext();

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: externalValue || "",
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-[150px] p-4 focus:outline-none focus:ring-0",
          className,
        ),
      },
    },
    onUpdate: ({ editor }: any) => {
      externalOnChange?.(editor.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  // Sync value if changed externally (e.g. form reset)
  React.useEffect(() => {
    if (editor && externalValue !== undefined && externalValue !== editor.getHTML()) {
      editor.commands.setContent(externalValue);
    }
  }, [externalValue, editor]);

  const editorContent = (
    <div className="w-full rounded-2xl border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          outline: none !important;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .ProseMirror h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          font-style: italic;
          color: #6b7280;
        }
      `}</style>
    </div>
  );

  if (formContext && name && !(arguments[0] as any)._isNested) {
    return (
      <FormField
        control={formContext.control}
        name={name}
        render={({ field }) => (
          <FormItem className="space-y-2">
            {label && (
              <FormLabel className="font-semibold">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <RichTextEditor
                {...{
                  ...field,
                  value: field.value || "",
                  onChange: field.onChange,
                  onBlur: field.onBlur,
                  placeholder,
                  className,
                  // @ts-ignore
                  _isNested: true,
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return editorContent;
}
