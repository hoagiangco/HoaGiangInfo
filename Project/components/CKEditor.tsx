'use client';

import { useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface CKEditorComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CKEditorComponent({ value, onChange, placeholder = 'Nhập nội dung...' }: CKEditorComponentProps) {
  const editorRef = useRef<any>(null);

  return (
    <div className="ckeditor-wrapper">
      <CKEditor
        editor={ClassicEditor as any}
        data={value}
        onReady={(editor) => {
          editorRef.current = editor;
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
        config={{
          placeholder,
          language: 'vi',
          toolbar: {
            items: [
              'heading',
              '|',
              'bold',
              'italic',
              'underline',
              'strikethrough',
              '|',
              'fontSize',
              'fontColor',
              'fontBackgroundColor',
              '|',
              'bulletedList',
              'numberedList',
              '|',
              'alignment',
              '|',
              'link',
              'insertTable',
              '|',
              'blockQuote',
              'codeBlock',
              '|',
              'undo',
              'redo'
            ],
            shouldNotGroupWhenFull: true
          },
          table: {
            contentToolbar: [
              'tableColumn',
              'tableRow',
              'mergeTableCells'
            ]
          }
        }}
      />
    </div>
  );
}

