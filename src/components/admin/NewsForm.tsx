'use client';
import { useState } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { News } from '@/types/news';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { CSSProperties } from 'react';

interface NewsFormProps {
  news?: News;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

const styleMap: { [key: string]: CSSProperties } = {
  'ALIGN-LEFT': {
    display: 'block',
    textAlign: 'left' as const
  },
  'ALIGN-CENTER': {
    display: 'block',
    textAlign: 'center' as const
  },
  'ALIGN-RIGHT': {
    display: 'block',
    textAlign: 'right' as const
  },
  'FONTSIZE-SMALL': {
    fontSize: '12px'
  },
  'FONTSIZE-NORMAL': {
    fontSize: '16px'
  },
  'FONTSIZE-LARGE': {
    fontSize: '20px'
  },
  'FONTSIZE-HUGE': {
    fontSize: '24px'
  }
};

export default function NewsForm({ news, onSubmit, onCancel }: NewsFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(news?.image || '/default-news.png');
  const [editorState, setEditorState] = useState(() => {
    if (news?.content) {
      const contentBlock = htmlToDraft(news.content);
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
        return EditorState.createWithContent(contentState);
      }
    }
    return EditorState.createEmpty();
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    if (imageFile) {
      formData.append('image', imageFile);
    }
    if (news?._id) {
      formData.append('_id', news._id);
    }

    const contentState = editorState.getCurrentContent();
    const rawContentState = convertToRaw(contentState);
    const htmlContent = draftToHtml(rawContentState);
    formData.append('content', htmlContent);

    onSubmit(formData);
  };

  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const onBoldClick = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, 'BOLD'));
  };

  const onItalicClick = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, 'ITALIC'));
  };

  const onUnderlineClick = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, 'UNDERLINE'));
  };

  const onStrikeClick = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, 'STRIKETHROUGH'));
  };

  const onListClick = (type: 'ordered-list-item' | 'unordered-list-item') => {
    setEditorState(RichUtils.toggleBlockType(editorState, type));
  };

  const onAlignmentClick = (alignment: string) => {
    const newAlignment = `ALIGN-${alignment.toUpperCase()}`;
    let newEditorState = editorState;
    
    ['ALIGN-LEFT', 'ALIGN-CENTER', 'ALIGN-RIGHT'].forEach(align => {
      newEditorState = RichUtils.toggleInlineStyle(newEditorState, align);
    });
    
    newEditorState = RichUtils.toggleInlineStyle(newEditorState, newAlignment);
    setEditorState(newEditorState);
  };

  const onCodeClick = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, 'CODE'));
  };

  const onBlockquoteClick = () => {
    setEditorState(RichUtils.toggleBlockType(editorState, 'blockquote'));
  };

  const onLinkClick = () => {
    const url = window.prompt('Nhập URL:');
    if (url) {
      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity(
        'LINK',
        'MUTABLE',
        { url }
      );
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const newEditorState = EditorState.set(editorState, { 
        currentContent: contentStateWithEntity 
      });
      setEditorState(RichUtils.toggleLink(
        newEditorState,
        newEditorState.getSelection(),
        entityKey
      ));
    }
  };

  const onFontSizeClick = (size: string) => {
    let newEditorState = editorState;
    
    // Remove other font sizes first
    ['FONTSIZE-SMALL', 'FONTSIZE-NORMAL', 'FONTSIZE-LARGE', 'FONTSIZE-HUGE'].forEach(fontSize => {
      newEditorState = RichUtils.toggleInlineStyle(newEditorState, fontSize);
    });
    
    // Apply new font size
    newEditorState = RichUtils.toggleInlineStyle(newEditorState, `FONTSIZE-${size.toUpperCase()}`);
    setEditorState(newEditorState);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Image field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Ảnh tin tức</label>
          <div className="mt-1 flex items-center space-x-4">
            <img 
              src={imagePreview} 
              alt="News preview" 
              className="h-32 w-48 object-cover rounded"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>

        {/* Title field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
          <input
            type="text"
            name="title"
            defaultValue={news?.title}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Author field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Tác giả</label>
          <input
            type="text"
            name="author"
            defaultValue={news?.author}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Content field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nội dung</label>
          <div className="mt-1">
            <div className="mb-2 bg-gray-50 p-2 rounded flex flex-wrap items-center gap-1">
              <button type="button" onClick={onBoldClick} title="Bold" className="p-2 hover:bg-gray-200 rounded font-bold">B</button>
              <button type="button" onClick={onItalicClick} title="Italic" className="p-2 hover:bg-gray-200 rounded italic">I</button>
              <button type="button" onClick={onUnderlineClick} title="Underline" className="p-2 hover:bg-gray-200 rounded underline">U</button>
              <button type="button" onClick={onStrikeClick} title="Strikethrough" className="p-2 hover:bg-gray-200 rounded line-through">S</button>
              
              <div className="h-6 w-px bg-gray-300 mx-1"></div>
              <select 
                onChange={(e) => onFontSizeClick(e.target.value)}
                className="p-2 rounded border border-gray-200 hover:bg-gray-200"
                defaultValue="normal"
              >
                <option value="small">Nhỏ</option>
                <option value="normal">Bình thường</option>
                <option value="large">Lớn</option>
                <option value="huge">Rất lớn</option>
              </select>
              
              <div className="h-6 w-px bg-gray-300 mx-1"></div>
              <button type="button" onClick={() => onListClick('unordered-list-item')} title="Bullet List" className="p-2 hover:bg-gray-200 rounded">•</button>
              <button type="button" onClick={() => onListClick('ordered-list-item')} title="Numbered List" className="p-2 hover:bg-gray-200 rounded">1.</button>
              
              <div className="h-6 w-px bg-gray-300 mx-1"></div>
              <button type="button" onClick={() => onAlignmentClick('left')} title="Align Left" className="p-2 hover:bg-gray-200 rounded">⫷</button>
              <button type="button" onClick={() => onAlignmentClick('center')} title="Align Center" className="p-2 hover:bg-gray-200 rounded">⫸</button>
              <button type="button" onClick={() => onAlignmentClick('right')} title="Align Right" className="p-2 hover:bg-gray-200 rounded">⫹</button>
              
              <div className="h-6 w-px bg-gray-300 mx-1"></div>
              <button type="button" onClick={onLinkClick} title="Insert Link" className="p-2 hover:bg-gray-200 rounded">🔗</button>
              <button type="button" onClick={onCodeClick} title="Code" className="p-2 hover:bg-gray-200 rounded font-mono">{`<>`}</button>
              <button type="button" onClick={onBlockquoteClick} title="Quote" className="p-2 hover:bg-gray-200 rounded">""</button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="p-4 h-[300px] overflow-y-auto bg-white">
                <Editor
                  editorState={editorState}
                  onChange={setEditorState}
                  handleKeyCommand={handleKeyCommand}
                  customStyleMap={styleMap}
                  placeholder="Nhập nội dung bài viết..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Published checkbox */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={news?.isPublished}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Xuất bản</span>
          </label>
        </div>

        {/* Form buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            {news ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </form>
  );
}