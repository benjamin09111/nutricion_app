"use client";

import { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { cn } from '@/lib/utils';
import { 
  Bold, Italic, Strikethrough, List, ListOrdered, CheckSquare, 
  CheckCircle2, XCircle, Sparkles, Plus
} from 'lucide-react';

interface NutriDocsEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function NutriDocsEditor({ value, onChange }: NutriDocsEditorProps) {
  const [paragraphBounce, setParagraphBounce] = useState(false);
  const paragraphBtnRef = useRef<HTMLButtonElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        codeBlock: false,
        hardBreak: false,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[600px] p-12 text-slate-900 selection:bg-emerald-100',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          setParagraphBounce(true);
          setTimeout(() => setParagraphBounce(false), 300);
          return true;
        }
        return false;
      },
    },
  });

  if (!editor) return <div className="min-h-[400px] bg-slate-50 animate-pulse rounded-xl border border-slate-100" />;

  const insertIcon = (type: 'ticket' | 'cross') => {
    const icons = { ticket: '✔️', cross: '❌' };
    editor.chain().focus().insertContent(` <span style="font-size: 1.25em;">${icons[type]}</span> `).run();
  };

  const addParagraph = () => {
    editor.chain().focus().insertContent('<p></p><p></p>').run();
  };

  const addSubtitle = () => {
    editor.chain().focus().insertContent('<h3></h3>').run();
  };

  return (
    <div className="relative border border-slate-200 rounded-xl overflow-visible bg-white flex flex-col focus-within:ring-2 ring-indigo-500/20 transition-shadow">
      <div className="relative z-50 flex flex-wrap items-center gap-1 p-3 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm rounded-t-xl">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Negrita"><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Cursiva"><Italic className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('strike') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Tachado"><Strikethrough className="w-4 h-4" /></button>
        
        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Lista"><List className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Enumeración"><ListOrdered className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('taskList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Tareas"><CheckSquare className="w-4 h-4" /></button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button type="button" onClick={() => insertIcon('ticket')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Visto bueno"><CheckCircle2 className="w-4 h-4" /></button>
        <button type="button" onClick={() => insertIcon('cross')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Equis"><XCircle className="w-4 h-4" /></button>

        <div className="ml-auto flex items-center gap-2">
          <button
            ref={paragraphBtnRef}
            type="button"
            onClick={addParagraph}
            className={`p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5 ${paragraphBounce ? 'animate-pulse ring-2 ring-indigo-400 ring-offset-2' : ''}`}
            title="Añadir párrafo"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-semibold">Párrafo</span>
          </button>
          <button type="button" onClick={addSubtitle} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5" title="Añadir subtítulo">
            <Plus className="w-4 h-4" />
            <span className="text-xs font-semibold">Subtítulo</span>
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .tiptap { 
          color: #0f172a; 
          outline: none !important;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .tiptap p { margin: 1em 0; line-height: 1.8; color: #1e293b; white-space: pre-wrap; }
        .tiptap p:last-child { margin-bottom: 0; }
        
        .tiptap ul, .tiptap ol { padding-left: 1.5rem; margin: 1rem 0; }
        .tiptap ul { list-style-type: disc; }
        .tiptap ol { list-style-type: decimal; }
        .tiptap li { margin-bottom: 0.25rem; white-space: pre-wrap; }

        .tiptap ul[data-type="taskList"] { list-style: none; padding: 0; }
        .tiptap ul[data-type="taskList"] li { display: flex; align-items: start; gap: 0.75rem; margin-bottom: 0.5rem; }
        .tiptap ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 0.25rem; }
        .tiptap ul[data-type="taskList"] input[type="checkbox"] { 
          width: 1.25rem; height: 1.25rem; cursor: pointer; border-radius: 6px; 
          border: 2px solid #cbd5e1; appearance: none; position: relative;
          background-color: #fff; transition: all 0.2s;
        }
        .tiptap ul[data-type="taskList"] input[type="checkbox"]:checked { 
          background-color: #10b981; border-color: #10b981; 
        }
        .tiptap ul[data-type="taskList"] input[type="checkbox"]:checked::after {
          content: '✓'; position: absolute; color: white; font-size: 0.8rem;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
        }

        .tiptap br { display: block; content: ""; margin-top: 0; }
      `}} />

      <EditorContent editor={editor} className="relative z-0 min-h-[600px] cursor-text" />
      
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-xl">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Editor visual
        </p>
      </div>
    </div>
  );
}
