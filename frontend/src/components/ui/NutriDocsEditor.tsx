"use client";

import { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
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
  const paragraphBtnRef = useRef<HTMLButtonElement>(null);

  const initialContent = (!value || value.trim() === '' || value.trim() === '<p></p>')
    ? '<h3></h3><p></p>'
    : value;

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
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Escribe un subtítulo aquí...';
          }
          return 'Escribe el contenido del párrafo aquí...';
        },
        emptyNodeClass: 'is-empty',
        showOnlyCurrent: false,
      }),
    ],
    immediatelyRender: false,
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] p-8 md:p-10 text-slate-900 selection:bg-indigo-100',
      },
    },
  });

  if (!editor) return <div className="min-h-[400px] bg-slate-50 animate-pulse rounded-xl border border-slate-100" />;

  const insertIcon = (type: 'ticket' | 'cross') => {
    const emoji = type === 'ticket' ? '✔️' : '❌';
    editor.chain().focus().insertContent(emoji).run();
  };

  const addParagraph = () => {
    editor.chain().focus('end').insertContent('<h3></h3><p></p>').run();
  };

  const ToolBtn = ({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} className={cn("p-2 rounded-lg transition-all", active ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-white hover:shadow-sm')} title={title}>{children}</button>
  );

  return (
    <div className="relative border border-slate-200 rounded-xl overflow-visible bg-white flex flex-col focus-within:ring-2 ring-indigo-500/20 transition-shadow">
      <div className="relative z-50 flex flex-wrap items-center gap-1 p-3 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm rounded-t-xl">
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita"><Bold className="w-4 h-4" /></ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva"><Italic className="w-4 h-4" /></ToolBtn>
        <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado"><Strikethrough className="w-4 h-4" /></ToolBtn>
        
        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista"><List className="w-4 h-4" /></ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Enumeración"><ListOrdered className="w-4 h-4" /></ToolBtn>
        <ToolBtn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Tareas"><CheckSquare className="w-4 h-4" /></ToolBtn>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button type="button" onClick={() => insertIcon('ticket')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Visto bueno"><CheckCircle2 className="w-4 h-4" /></button>
        <button type="button" onClick={() => insertIcon('cross')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Equis"><XCircle className="w-4 h-4" /></button>

        <div className="ml-auto">
          <button
            ref={paragraphBtnRef}
            type="button"
            onClick={addParagraph}
            className="px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-1.5 font-semibold text-xs cursor-pointer"
            title="Añadir bloque (subtítulo y párrafo)"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo párrafo</span>
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .tiptap { 
          color: #0f172a; 
          outline: none !important;
          font-family: 'Inter', system-ui, sans-serif;
        }
        
        .tiptap h3 { 
          font-size: 1.05rem; 
          font-weight: 700; 
          color: #1e1b4b;
          background: linear-gradient(to right, #eff6ff, #f8fafc);
          border-left: 4px solid #3b82f6;
          border-radius: 0.5rem;
          padding: 0.6rem 0.85rem;
          margin: 1.25rem 0 0.5rem 0;
          line-height: 1.4;
          position: relative;
        }
        .tiptap h3:first-child { margin-top: 0; }
        
        .tiptap h3.is-empty::before {
          content: attr(data-placeholder);
          color: #93c5fd;
          font-weight: 500;
          pointer-events: none;
          float: left;
          height: 0;
        }

        .tiptap p { 
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          margin: 0.5rem 0 1rem 0;
          line-height: 1.7; 
          color: #1e293b; 
          white-space: pre-wrap; 
          transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .tiptap p:last-child { margin-bottom: 0; }
        
        .tiptap p:focus-within, .tiptap p:has(:focus), .tiptap p.has-focus {
          background-color: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }

        .tiptap p.is-empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          float: left;
          height: 0;
        }

        .tiptap li p {
          background-color: transparent;
          border: none;
          padding: 0;
          margin: 0;
          box-shadow: none;
        }

        .tiptap ul, .tiptap ol { padding-left: 1.5rem; margin: 1rem 0; }
        .tiptap ul { list-style-type: disc; }
        .tiptap ol { list-style-type: decimal; }
        .tiptap li { margin-bottom: 0.25rem; white-space: pre-wrap; }

        .tiptap ul[data-type="taskList"] { list-style: none; padding: 0; }
        .tiptap ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
        .tiptap ul[data-type="taskList"] li > label { flex-shrink: 0; padding-top: 0.1rem; display: flex; align-items: center; }
        .tiptap ul[data-type="taskList"] li > div { min-width: 0; flex: 1; line-height: 1.6; }
        .tiptap ul[data-type="taskList"] input[type="checkbox"] { 
          width: 1rem; height: 1rem; cursor: pointer; border-radius: 4px; 
          border: 2px solid #cbd5e1; appearance: none; position: relative;
          background-color: #fff; transition: all 0.2s;
          margin: 0; flex-shrink: 0;
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

      <EditorContent editor={editor} className="relative z-0 min-h-[400px] cursor-text" />
      
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-xl">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Editor visual
        </p>
        <p className="text-[10px] font-medium text-slate-400">
          Subtítulo y párrafo diferenciados con fondo visible
        </p>
      </div>
    </div>
  );
}
