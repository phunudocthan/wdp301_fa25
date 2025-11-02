declare module 'react-quill' {
  import * as React from 'react';

  type QuillProps = {
    value?: any;
    defaultValue?: any;
    onChange?: (value: any, delta?: any, source?: any, editor?: any) => void;
    [key: string]: any;
  } & React.HTMLAttributes<any>;

  const ReactQuill: React.ComponentType<QuillProps>;
  export default ReactQuill;
}
declare module 'react-quill' {
  const ReactQuill: any;
  export default ReactQuill;
}
