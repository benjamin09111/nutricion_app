"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { cn } from '@/lib/utils';
import StarterKit from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { 
  Bold, Italic, Strikethrough, List, ListOrdered, CheckSquare, 
  AlignLeft, AlignCenter, AlignRight, ImageIcon, Table as TableIcon, 
  SplitSquareHorizontal, Lightbulb, AlertTriangle, HelpCircle, 
  CheckCircle2, XCircle, Trash, Sparkles, Type, Braces,
  Rows, Columns, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  PlusCircle, MinusCircle, Maximize2, Minimize2, Link2
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';

interface NutriDocsEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function NutriDocsEditor({ value, onChange, placeholder }: NutriDocsEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        codeBlock: false,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: true, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
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
      handleDrop: function(view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function() {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              const node = schema.nodes.image.create({ src: reader.result });
              const transaction = view.state.tr.insert(coordinates?.pos || 0, node);
              view.dispatch(transaction);
            };
            return true;
          }
        }
        return false;
      }
    },
  });

  const [imageUrl, setImageUrl] = useState('');
  const [showImagePopover, setShowImagePopover] = useState(false);

  const addImageFromUrl = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setShowImagePopover(false);
  }, [editor, imageUrl]);

  if (!editor) return <div className="min-h-[400px] bg-slate-50 animate-pulse rounded-4xl border border-slate-100" />;

  const insertCallout = (type: 'idea' | 'warning' | 'question') => {
    const config = {
      idea: { color: 'amber', icon: '💡', title: 'Idea/Tip' },
      warning: { color: 'rose', icon: '⚠️', title: 'Importante' },
      question: { color: 'blue', icon: '❓', title: 'Pregunta' }
    };
    const c = config[type];
    editor.chain().focus().insertContent(`
      <div style="background-color: var(--${c.color}-50); border: 1px solid var(--${c.color}-200); padding: 1.5rem; border-radius: 1rem; margin: 1.5rem 0; display: flex; gap: 1rem; align-items: start;">
        <span style="font-size: 1.5rem; line-height: 1;">${c.icon}</span>
        <div><strong style="color: var(--${c.color}-800); font-size: 1.1rem;">${c.title}</strong><br/><p style="margin: 0.5rem 0 0 0; color: var(--${c.color}-900);">Escribe aquí...</p></div>
      </div>
      <p></p>
    `).run();
  };

  const insertIcon = (type: 'ticket' | 'cross') => {
    const icons = { ticket: '✔️', cross: '❌' };
    editor.chain().focus().insertContent(` <span style="font-size: 1.25em;">${icons[type]}</span> `).run();
  };

  const insertPageBreak = () => {
    editor.chain().focus().insertContent(`<hr class="page-break" style="page-break-after: always; border-top: 2px dashed #94a3b8; margin: 3rem 0; position: relative;" data-label="Salto de Página" />`).run();
  };

  const createVariable = () => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    if (text) {
      editor.chain().focus().insertContent(`{${text.trim()}}`).run();
    } else {
      const varName = window.prompt('Nombre de la variable:');
      if (varName) {
        editor.chain().focus().insertContent(`{${varName.trim()}}`).run();
      }
    }
  };

  return (
    <div className="border border-slate-200 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50 bg-white flex flex-col focus-within:ring-4 ring-emerald-500/10 transition-shadow">
      <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">
        
        {/* Basic formatting */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-xl transition-all ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Negrita"><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-xl transition-all ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Cursiva"><Italic className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded-xl transition-all ${editor.isActive('strike') ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Tachado"><Strikethrough className="w-4 h-4" /></button>
        
        <div className="w-px h-6 bg-slate-200 mx-1" />
        
        {/* Headings */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-2 py-1 text-sm font-bold rounded-xl transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Título 1">H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-sm font-bold rounded-xl transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Título 2">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-sm font-bold rounded-xl transition-all ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Título 3">H3</button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Text Color */}
        <div className="flex items-center gap-1 group relative">
          <button 
            type="button" 
            onClick={() => editor.chain().focus().unsetColor().run()} 
            className="p-1 px-2 rounded-lg text-slate-400 hover:text-slate-900 transition-all text-[10px] font-bold"
            title="Quitar color"
          >
            A
          </button>
          {[
            { color: '#0f172a', label: 'Negro' },
            { color: '#10b981', label: 'Verde' },
            { color: '#6366f1', label: 'Indigo' },
            { color: '#f43f5e', label: 'Rosa' },
            { color: '#f59e0b', label: 'Ambar' },
          ].map((c) => (
            <button
              key={c.color}
              type="button"
              onClick={() => editor.chain().focus().setColor(c.color).run()}
              className="w-5 h-5 rounded-md border border-white shadow-sm transition-transform hover:scale-110"
              style={{ backgroundColor: c.color }}
              title={c.label}
            />
          ))}
        </div>
        
        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded-xl transition-all ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}><AlignLeft className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded-xl transition-all ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}><AlignCenter className="w-4 h-4" /></button>
        
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Lists */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-xl transition-all ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Puntitos"><List className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-xl transition-all ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Numeración (1,2..)"><ListOrdered className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-2 rounded-xl transition-all ${editor.isActive('taskList') ? 'bg-slate-200 text-slate-900 shadow-inner' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`} title="Checklist cuadrado"><CheckSquare className="w-4 h-4" /></button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Images with Popover */}
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setShowImagePopover(!showImagePopover)} 
            className={cn(
              "p-2 rounded-xl transition-all",
              showImagePopover ? "bg-emerald-100 text-emerald-700 shadow-inner" : "text-slate-600 hover:bg-white hover:shadow-sm"
            )}
            title="Insertar Imagen"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          
          {showImagePopover && (
            <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 w-72 animate-in fade-in zoom-in slide-in-from-top-1 duration-200">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">Insertar Imagen por URL</h4>
              <div className="flex flex-col gap-3">
                <Input 
                  placeholder="https://ejemplo.com/imagen.jpg" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="rounded-xl border-slate-200 text-xs"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && addImageFromUrl()}
                />
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 rounded-xl bg-emerald-500 text-white font-bold h-9 text-xs"
                    onClick={addImageFromUrl}
                  >
                    Insertar
                  </Button>
                  <Button 
                    variant="ghost"
                    className="flex-1 rounded-xl text-slate-400 font-bold h-9 text-xs"
                    onClick={() => setShowImagePopover(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Improved Table Controls */}
        <div className="flex items-center gap-1">
          <button 
            type="button" 
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
            className={cn(
               "p-2 rounded-xl transition-all",
               editor.isActive('table') ? "bg-emerald-100 text-emerald-700 shadow-inner" : "text-slate-600 hover:bg-white hover:shadow-sm"
            )}
            title="Insertar Tabla"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          {editor.isActive('table') && (
            <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-left-2">
              <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg" title="Añadir fila arriba"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg" title="Añadir fila abajo"><ChevronDown className="w-3.5 h-3.5" /></button>
              <div className="w-px h-3 bg-slate-200 mx-0.5" />
              <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg" title="Añadir columna izquierda"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg" title="Añadir columna derecha"><ChevronRight className="w-3.5 h-3.5" /></button>
              <div className="w-px h-3 bg-slate-200 mx-0.5" />
              <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg" title="Borrar fila"><MinusCircle className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg" title="Borrar columna"><MinusCircle className="w-3.5 h-3.5 rotate-90" /></button>
              <div className="w-px h-3 bg-slate-200 mx-0.5" />
              <button type="button" onClick={() => editor.chain().focus().mergeCells().run()} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Combinar celdas"><Maximize2 className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => editor.chain().focus().splitCell().run()} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Dividir celda"><Minimize2 className="w-3.5 h-3.5" /></button>
              <div className="w-px h-3 bg-slate-200 mx-0.5" />
              <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Borrar Tabla Completa"><Trash className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        <button type="button" onClick={insertPageBreak} className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm transition-all" title="Salto de Página (Nueva Hoja)"><SplitSquareHorizontal className="w-4 h-4" /></button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Callouts y Bloques Visuales */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm ml-auto sm:ml-0">
          <button type="button" onClick={() => insertCallout('idea')} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer hover:scale-110" title="Añadir Idea"><Lightbulb className="w-4 h-4" /></button>
          <button type="button" onClick={() => insertCallout('warning')} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer hover:scale-110" title="Añadir Advertencia"><AlertTriangle className="w-4 h-4" /></button>
          <button type="button" onClick={() => insertCallout('question')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer hover:scale-110" title="Añadir Pregunta"><HelpCircle className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button type="button" onClick={() => insertIcon('ticket')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer hover:scale-110" title="Insertar Ticket ✔️"><CheckCircle2 className="w-4 h-4" /></button>
          <button type="button" onClick={() => insertIcon('cross')} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer hover:scale-110" title="Insertar Equis ❌"><XCircle className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button 
            type="button" 
            onClick={createVariable} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-wider"
            title="Convertir selección en variable dinámica { }"
          >
            <Braces className="w-3.5 h-3.5" />
            Variable
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .tiptap { 
          color: #0f172a; 
          outline: none !important;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .tiptap p { margin: 1em 0; line-height: 1.8; color: #1e293b; }
        .tiptap h1 { font-size: 2.5rem; font-weight: 900; margin: 2rem 0 1rem; color: #020617; line-height: 1.1; letter-spacing: -0.02em; }
        .tiptap h2 { font-size: 2rem; font-weight: 800; margin: 1.75rem 0 0.75rem; color: #0f172a; line-height: 1.2; letter-spacing: -0.01em; }
        .tiptap h3 { font-size: 1.5rem; font-weight: 800; margin: 1.5rem 0 0.5rem; color: #1e293b; line-height: 1.3; }
        
        .tiptap ul, .tiptap ol { padding-left: 1.5rem; margin: 1rem 0; }
        .tiptap ul { list-style-type: disc; }
        .tiptap ol { list-style-type: decimal; }
        .tiptap li { margin-bottom: 0.25rem; }

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

        .tiptap table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 2rem 0; overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0; }
        .tiptap td, .tiptap th { min-width: 1em; border: 1px solid #e2e8f0; padding: 1rem; vertical-align: top; box-sizing: border-box; position: relative; }
        .tiptap th { font-weight: 800; text-align: left; background-color: #f8fafc; color: #475569; }
        .tiptap .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(16, 185, 129, 0.1); pointer-events: none; }
        .tiptap .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #10b981; pointer-events: none; }
        
        .tiptap img { max-width: 100%; height: auto; border-radius: 1rem; margin: 2rem 0; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); cursor: pointer; transition: transform 0.2s; }
        .tiptap img:hover { transform: scale(1.01); }
        .tiptap hr.page-break { border: none; border-top: 2px dashed #94a3b8; margin: 4rem 0; position: relative; cursor: default; }
        .tiptap hr.page-break::before { content: "SALTO DE PÁGINA (NUEVA HOJA EN EL PDF)"; position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #f8fafc; padding: 0 15px; color: #94a3b8; font-size: 11px; font-weight: 900; letter-spacing: 0.15em; border-radius: 99px; }
      `}} />

      <EditorContent editor={editor} className="min-h-[600px] cursor-text" />
      
      <div className="px-6 py-3 border-t border-slate-50 bg-slate-50 flex justify-between items-center rounded-b-[2rem]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          Editor NutriDocs
        </p>
        <p className="text-[10px] text-slate-400">Todo se guarda automáticamente</p>
      </div>
    </div>
  );
}
