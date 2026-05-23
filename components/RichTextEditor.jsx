'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

// ── Toolbar button ──────────────────────────────────────────────────────────
function ToolBtn({ onClick, active, title, children }) {
  return (
    <button
      type='button'
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      style={{
        background: active ? 'var(--accent, #0d9488)' : 'transparent',
        color: active ? '#fff' : 'var(--ink, #1e293b)',
        border: '1px solid',
        borderColor: active ? 'var(--accent, #0d9488)' : 'var(--line, #e2e8f0)',
        borderRadius: 5,
        padding: '2px 8px',
        fontSize: 13,
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        lineHeight: '20px',
      }}
    >
      {children}
    </button>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────
/** @see {@link __tests__/RichTextEditor.test.jsx} */
export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 80,
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rte-content',
        style: `min-height:${minHeight}px; outline:none;`,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. when modal opens with a different record)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', false);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  return (
    <div className='rte-wrap'>
      {/* Toolbar */}
      <div className='rte-toolbar'>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title='Bold'
        >
          B
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title='Italic'
        >
          <em>I</em>
        </ToolBtn>
        <span
          style={{
            width: 1,
            background: 'var(--line, #e2e8f0)',
            alignSelf: 'stretch',
            margin: '0 4px',
          }}
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title='Bullet list'
        >
          • List
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title='Numbered list'
        >
          1. List
        </ToolBtn>
        <span
          style={{
            width: 1,
            background: 'var(--line, #e2e8f0)',
            alignSelf: 'stretch',
            margin: '0 4px',
          }}
        />
        <ToolBtn
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}
          title='Outdent'
        >
          ⇤
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          title='Indent'
        >
          ⇥
        </ToolBtn>
      </div>
      {/* Content area */}
      <EditorContent editor={editor} />
      {!value && <div className='rte-placeholder'>{placeholder}</div>}
    </div>
  );
}
