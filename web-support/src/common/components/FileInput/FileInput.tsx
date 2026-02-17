import classNames from 'classnames';
import _uniqueId from 'lodash/uniqueId';
import type { FunctionComponent } from 'react';
import React, { useState, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import styles from './FileInput.scss';

const messages = defineMessages({
  attachFile: {
    description: 'Attach file button text',
    defaultMessage: 'Attach file',
  },
});

export interface Props {
  accept: string,
  multiple?: boolean;
  label: string;
  error?: string;
  onChange?: (fileList: FileList | null) => void;
}

const FileInput: FunctionComponent<Props> = (props) => {
  const intl = useIntl();
  const id = useRef(_uniqueId('fileInput-'));
  const [fileList, setFileList] = useState<FileList | null>(null);
  const { accept, multiple = false, label, error, onChange } = props;
  const containerCls = classNames(styles.container, {
    [styles.errored]: !!error,
  });

  return (
    <div className={containerCls}>
      <div className={styles.inputWrapper}>
        <input
          id={id.current}
          type="file"
          accept={accept}
          multiple={multiple}
          className={styles.input}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFileList(event.currentTarget.files);
            onChange?.(event.currentTarget.files);
          }}
        />
        <span className={styles.label}>
          {error || label}
        </span>
        <label className={styles.button} htmlFor={id.current}>
          {intl.formatMessage(messages.attachFile)}
        </label>
      </div>
      {
        fileList
        && <ul className={styles.list}>
          {Array.from(fileList).map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      }
    </div>
  );
};

export default FileInput;
