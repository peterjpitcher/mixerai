import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Heading4,
  Undo,
  Redo,
  Code,
  Quote,
  Link as LinkIcon,
  Pilcrow
} from 'lucide-react'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Heading from '@tiptap/extension-heading'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
}

const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading to use our custom config
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ml-4'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-4'
          }
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 pl-4 italic'
          }
        },
        code: {
          HTMLAttributes: {
            class: 'bg-gray-100 rounded px-1 py-0.5 font-mono text-sm'
          }
        },
        paragraph: {
          HTMLAttributes: {
            class: 'mb-4'
          }
        }
      }),
      Heading.configure({
        levels: [2, 3, 4],
      }).extend({
        renderHTML({ node, HTMLAttributes }) {
          const level = node.attrs.level as 2 | 3 | 4
          const classes = {
            2: 'text-2xl font-bold mb-4',
            3: 'text-xl font-bold mb-3',
            4: 'text-lg font-bold mb-2'
          }[level]

          return [`h${level}`, { ...HTMLAttributes, class: classes }, 0]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
    enableInputRules: true,
    enablePasteRules: true,
    autofocus: false,
    editable: true,
    injectCSS: true,
    immediatelyRender: false // Add this to handle SSR properly
  })

  if (!editor) {
    return null
  }

  const MenuButton = ({ 
    onClick, 
    active = false,
    disabled = false,
    icon: Icon,
    title
  }: { 
    onClick: () => void
    active?: boolean
    disabled?: boolean
    icon: any
    title: string
  }) => (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={active ? 'bg-gray-200 hover:bg-gray-300' : ''}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  const addLink = () => {
    const url = window.prompt('Enter URL')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="border rounded-lg">
      <div className="border-b bg-gray-50 p-2 flex gap-2 flex-wrap">
        <MenuButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          icon={Pilcrow}
          title="Paragraph"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          title="Heading 2"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          title="Heading 3"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          active={editor.isActive('heading', { level: 4 })}
          icon={Heading4}
          title="Heading 4"
        />
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          icon={Bold}
          title="Bold"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          icon={Italic}
          title="Italic"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          icon={Code}
          title="Code"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          icon={Quote}
          title="Quote"
        />
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          icon={List}
          title="Bullet List"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          icon={ListOrdered}
          title="Numbered List"
        />
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <MenuButton
          onClick={addLink}
          active={editor.isActive('link')}
          icon={LinkIcon}
          title="Add Link"
        />
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          icon={Undo}
          title="Undo"
        />
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          icon={Redo}
          title="Redo"
        />
      </div>
      <div className="prose prose-slate max-w-none">
        <EditorContent 
          editor={editor} 
          className="min-h-[500px] p-4 [&_p]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-3 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:mb-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:bg-gray-100 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm" 
        />
      </div>
    </div>
  )
}

export default TiptapEditor 