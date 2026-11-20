"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState } from "react";
import { uploadImage } from "./upload-client";

function Btn({ onClick, active, label, children, disabled }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`min-w-9 rounded px-2 py-1.5 text-sm font-bold transition disabled:opacity-40 ${active ? "bg-navy-900 text-white" : "text-navy-900 hover:bg-gold-100"}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage, uploading }: { editor: Editor; onImage: () => void; uploading: boolean }) {
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("أدخل الرابط (https://…)", prev ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:|\/)/i.test(url)) {
      window.alert("رابط غير صالح");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-white p-1.5" role="toolbar" aria-label="أدوات التنسيق">
      <Btn label="فقرة" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>¶</Btn>
      <Btn label="عنوان رئيسي" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
      <Btn label="عنوان فرعي" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>
      <span className="mx-1 h-5 w-px bg-line" />
      <Btn label="عريض" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></Btn>
      <Btn label="مائل" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></Btn>
      <Btn label="تسطير" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></Btn>
      <Btn label="يتوسطه خط" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></Btn>
      <span className="mx-1 h-5 w-px bg-line" />
      <Btn label="قائمة نقطية" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>• قائمة</Btn>
      <Btn label="قائمة مرقمة" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>١. قائمة</Btn>
      <Btn label="اقتباس" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝ اقتباس</Btn>
      <Btn label="فاصل" onClick={() => editor.chain().focus().setHorizontalRule().run()}>―</Btn>
      <span className="mx-1 h-5 w-px bg-line" />
      <Btn label="رابط" active={editor.isActive("link")} onClick={setLink}>🔗 رابط</Btn>
      <Btn label="إدراج صورة" onClick={onImage} disabled={uploading}>{uploading ? "…" : "🖼 صورة"}</Btn>
      <span className="mx-1 h-5 w-px bg-line" />
      <Btn label="تراجع" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>↶</Btn>
      <Btn label="إعادة" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>↷</Btn>
    </div>
  );
}

export function RichEditor({ name, defaultValue, placeholder = "ابدأ كتابة المقال هنا…" }: { name: string; defaultValue?: string; placeholder?: string }) {
  const [html, setHtml] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] },
        code: false,
        codeBlock: false,
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue || "",
    editorProps: {
      attributes: { class: "article-body", dir: "rtl", "data-testid": "rich-editor", "aria-label": "محتوى المقال", role: "textbox", "aria-multiline": "true" },
    },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });

  async function onFile(file?: File) {
    if (!file || !editor) return;
    setError(null);
    const alt = window.prompt("النص البديل للصورة (Alt Text):", "") ?? "";
    setUploading(true);
    try {
      const img = await uploadImage(file, alt);
      editor.chain().focus().setImage({ src: img.url, alt: alt || img.alt || "" }).run();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-line bg-white focus-within:border-navy-700">
      <input type="hidden" name={name} value={html} />
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" data-testid="editor-image-input" onChange={(e) => onFile(e.target.files?.[0])} />
      {editor ? <Toolbar editor={editor} uploading={uploading} onImage={() => fileRef.current?.click()} /> : <div className="h-11 border-b border-line" />}
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
      {error && <p className="field-error px-4 pb-3" role="alert">{error}</p>}
    </div>
  );
}
