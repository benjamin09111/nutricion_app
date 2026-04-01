"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
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
  AlignLeft, AlignCenter, ImageIcon, Table as TableIcon, 
  Lightbulb, AlertTriangle, HelpCircle, 
  CheckCircle2, XCircle, Trash, Sparkles, Braces, PenSquare,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MinusCircle, Minimize2
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface NutriDocsEditorProps {
  value: string;
  onChange: (html: string) => void;
}

type TableHandlePosition = {
  top: number;
  left: number;
};

export function NutriDocsEditor({ value, onChange }: NutriDocsEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
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
      Image.configure({ inline: true, allowBase64: false }),
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
    },
  });

  const [imageUrl, setImageUrl] = useState('');
  const [showImagePopover, setShowImagePopover] = useState(false);
  const [showCreateTablePopover, setShowCreateTablePopover] = useState(false);
  const [showEditTablePopover, setShowEditTablePopover] = useState(false);
  const [tableRows, setTableRows] = useState('3');
  const [tableColumns, setTableColumns] = useState('3');
  const [tableHandlePosition, setTableHandlePosition] = useState<TableHandlePosition | null>(null);
  const [isHoveringTableControls, setIsHoveringTableControls] = useState(false);

  const addImageFromUrl = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setShowImagePopover(false);
  }, [editor, imageUrl]);

  const insertTable = useCallback(() => {
    if (!editor) return;

    const rows = Math.max(1, Number.parseInt(tableRows, 10) || 3);
    const cols = Math.max(1, Number.parseInt(tableColumns, 10) || 3);

    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setShowCreateTablePopover(false);
  }, [editor, tableColumns, tableRows]);

  const runTableAction = useCallback((action: (instance: NonNullable<typeof editor>) => void) => {
    if (!editor) return;
    editor.commands.focus();
    action(editor);
  }, [editor]);

  const updateTableHandlePosition = useCallback((table: HTMLTableElement | null) => {
    if (!table || !rootRef.current) {
      setTableHandlePosition(null);
      return;
    }

    const rootRect = rootRef.current.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();

    setTableHandlePosition({
      top: tableRect.top - rootRect.top + 10,
      left: tableRect.right - rootRect.left - 42,
    });
  }, []);

  useEffect(() => {
    if (!editor) return;

    const dom = editor.view.dom;

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const table = target?.closest('table') as HTMLTableElement | null;

      if (table) {
        updateTableHandlePosition(table);
        return;
      }

      if (!showEditTablePopover && !isHoveringTableControls) {
        setTableHandlePosition(null);
      }
    };

    const handleMouseLeave = () => {
      if (!showEditTablePopover && !isHoveringTableControls) {
        setTableHandlePosition(null);
      }
    };

    dom.addEventListener('mousemove', handleMouseMove);
    dom.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      dom.removeEventListener('mousemove', handleMouseMove);
      dom.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor, isHoveringTableControls, showEditTablePopover, updateTableHandlePosition]);

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

  const createVariable = () => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    if (text) {
      editor.chain().focus().insertContent(`{${text.trim()}}`).run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent('{}')
        .setTextSelection(from + 1)
        .run();
    }
  };

  return (
    <div ref={rootRef} className="relative border border-slate-200 rounded-[2rem] overflow-visible shadow-xl shadow-slate-200/50 bg-white flex flex-col focus-within:ring-4 ring-emerald-500/10 transition-shadow">
      {(showImagePopover || showCreateTablePopover || showEditTablePopover) && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowImagePopover(false);
            setShowCreateTablePopover(false);
            setShowEditTablePopover(false);
            setIsHoveringTableControls(false);
          }}
        />
      )}

      <div className="relative z-50 flex flex-wrap items-center gap-1.5 p-3 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md rounded-t-[2rem]">
        
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
        <div className="relative z-[80]">
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
            <div className="pointer-events-auto absolute top-full left-0 mt-2 p-4 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-[90] w-72 animate-in fade-in zoom-in slide-in-from-top-1 duration-200">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">Insertar imagen por link</h4>
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

        {/* Table Controls */}
        <div className="relative z-[80] flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setShowImagePopover(false);
              setShowEditTablePopover(false);
              setShowCreateTablePopover((current) => !current);
            }}
            className={cn(
              "p-2 rounded-xl transition-all",
              showCreateTablePopover
                ? "bg-emerald-100 text-emerald-700 shadow-inner"
                : "text-slate-600 hover:bg-white hover:shadow-sm"
            )}
            title="Crear tabla"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          {showCreateTablePopover && (
            <div className="pointer-events-auto absolute top-full left-0 z-[90] mt-2 w-[22rem] rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl animate-in fade-in zoom-in slide-in-from-top-1 duration-200">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Crear tabla
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Elige el tamano inicial y luego puedes sumar o quitar filas y columnas cuando quieras.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Filas
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={tableRows}
                      onChange={(event) => setTableRows(event.target.value)}
                      className="h-10 rounded-xl border-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Columnas
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="6"
                      value={tableColumns}
                      onChange={(event) => setTableColumns(event.target.value)}
                      className="h-10 rounded-xl border-slate-200 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1 rounded-xl bg-emerald-500 text-white font-bold h-10 text-xs"
                    onClick={insertTable}
                  >
                    Insertar tabla
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 rounded-xl h-10 text-xs font-bold text-slate-500"
                    onClick={() => setShowCreateTablePopover(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

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
        .tiptap h1 { font-size: 1.75rem; font-weight: 800; margin: 1.6rem 0 0.8rem; color: #020617; line-height: 1.2; letter-spacing: -0.015em; }
        .tiptap h2 { font-size: 1.375rem; font-weight: 800; margin: 1.4rem 0 0.7rem; color: #0f172a; line-height: 1.25; letter-spacing: -0.01em; }
        .tiptap h3 { font-size: 1.125rem; font-weight: 700; margin: 1.15rem 0 0.45rem; color: #1e293b; line-height: 1.35; }
        
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

        .tiptap .tableWrapper { max-width: 100%; overflow-x: auto; overflow-y: hidden; margin: 2rem 0; padding-bottom: 0.35rem; }
        .tiptap table { border-collapse: collapse; table-layout: fixed; width: max-content; min-width: 100%; margin: 0; overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0; background: #fff; }
        .tiptap td, .tiptap th { min-width: 9rem; max-width: 14rem; border: 1px solid #e2e8f0; padding: 0.85rem; vertical-align: top; box-sizing: border-box; position: relative; word-break: break-word; overflow-wrap: anywhere; }
        .tiptap th { font-weight: 800; text-align: left; background-color: #f8fafc; color: #475569; }
        .tiptap .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(16, 185, 129, 0.1); pointer-events: none; }
        .tiptap .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #10b981; pointer-events: none; }
        
        .tiptap img { max-width: 100%; height: auto; border-radius: 1rem; margin: 2rem 0; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); cursor: pointer; transition: transform 0.2s; }
        .tiptap img:hover { transform: scale(1.01); }
      `}} />

      <EditorContent editor={editor} className="relative z-0 min-h-[600px] cursor-text" />

      {tableHandlePosition && (
        <div
          className="absolute z-[85]"
          style={{ top: tableHandlePosition.top, left: tableHandlePosition.left }}
          onMouseEnter={() => setIsHoveringTableControls(true)}
          onMouseLeave={() => {
            setIsHoveringTableControls(false);
            if (!showEditTablePopover) {
              setTableHandlePosition(null);
            }
          }}
        >
          <button
            type="button"
            onClick={() => {
              setShowCreateTablePopover(false);
              setShowImagePopover(false);
              editor.commands.focus();
              setShowEditTablePopover((current) => !current);
            }}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition-all hover:border-emerald-200 hover:text-emerald-700"
            title="Editar tabla"
          >
            <PenSquare className="h-3.5 w-3.5" />
          </button>

          {showEditTablePopover && (
            <div className="pointer-events-auto absolute right-0 top-10 z-[95] w-[20rem] rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-2xl">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Editar tabla
              </p>
              <div className="grid grid-cols-5 gap-2">
                <button type="button" onClick={() => runTableAction((instance) => { instance.chain().focus().addRowBefore().run(); })} className="flex h-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-50" title="Anadir fila arriba"><ChevronUp className="w-4 h-4" /></button>
                <button type="button" onClick={() => runTableAction((instance) => { instance.chain().focus().addRowAfter().run(); })} className="flex h-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-50" title="Anadir fila abajo"><ChevronDown className="w-4 h-4" /></button>
                <button type="button" onClick={() => runTableAction((instance) => { instance.chain().focus().addColumnBefore().run(); })} className="flex h-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-50" title="Anadir columna izquierda"><ChevronLeft className="w-4 h-4" /></button>
                <button type="button" onClick={() => runTableAction((instance) => { instance.chain().focus().addColumnAfter().run(); })} className="flex h-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-50" title="Anadir columna derecha"><ChevronRight className="w-4 h-4" /></button>
                <button type="button" onClick={() => runTableAction((instance) => { instance.chain().focus().deleteTable().run(); setShowEditTablePopover(false); setIsHoveringTableControls(false); setTableHandlePosition(null); })} className="flex h-10 items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition-all hover:bg-rose-50" title="Borrar tabla completa"><Trash className="w-4 h-4" /></button>
                <button type="button" onClick={() => runTableAction((instance) => { instance.chain().focus().deleteRow().run(); })} className="flex h-10 items-center justify-center rounded-xl border border-slate-200 text-rose-500 transition-all hover:bg-rose-50" title="Borrar fila"><MinusCircle className="w-4 h-4" /></button>
                <button type="button" onClick={() => runTableAction((instance) => { instance.chain().focus().deleteColumn().run(); })} className="flex h-10 items-center justify-center rounded-xl border border-slate-200 text-rose-500 transition-all hover:bg-rose-50" title="Borrar columna"><MinusCircle className="w-4 h-4 rotate-90" /></button>
                <button type="button" onClick={() => runTableAction((instance) => { instance.chain().focus().splitCell().run(); })} className="flex h-10 items-center justify-center rounded-xl border border-slate-200 text-indigo-500 transition-all hover:bg-indigo-50" title="Dividir celda"><Minimize2 className="w-4 h-4" /></button>
                <button type="button" onClick={() => { setShowEditTablePopover(false); setIsHoveringTableControls(false); setTableHandlePosition(null); }} className="flex h-10 items-center justify-center rounded-xl bg-slate-50 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 transition-all hover:bg-slate-100">
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="px-6 py-3 border-t border-slate-50 bg-slate-50 flex justify-between items-center rounded-b-[2rem] overflow-hidden">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          Editor NutriDocs
        </p>
        <p className="text-[10px] text-slate-400">Todo se guarda automáticamente</p>
      </div>
    </div>
  );
}
