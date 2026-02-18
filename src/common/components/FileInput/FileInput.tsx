import classNames from 'classnames';
import _uniqueId from 'lodash/uniqueId';
import type { FunctionComponent } from 'react';
import React, { useState, useRef, useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import styles from './FileInput.scss';

const messages = defineMessages({
  attachFile: {
    description: 'Attach file button text',
    defaultMessage: 'Attach file',
  },
  fileSelected: {
    description: 'File selected message',
    defaultMessage: 'File selected: {fileName}',
  },
  filesSelected: {
    description: 'Multiple files selected message',
    defaultMessage: '{count} files selected: {fileDetails}',
  },
  noFilesSelected: {
    description: 'No files selected message',
    defaultMessage: 'No files selected',
  },
});

export interface Props {
  accept: string,
  multiple?: boolean;
  label: string;
  error?: string;
  onChange?: (fileList: FileList | null) => void;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  required?: boolean;
}

const FileInput: FunctionComponent<Props> = (props) => {
  const intl = useIntl();
  const id = useRef(_uniqueId('fileInput-'));
  const [fileList, setFileList] = useState<FileList | null>(null);
  const {
    accept,
    multiple = false,
    label,
    error,
    onChange,
    'aria-describedby': ariaDescribedBy,
    required = false,
  } = props;

  const containerCls = classNames(styles.container, {
    [styles.errored]: !!error,
  });

  const errorId = `${id.current}-error`;
  const fileListId = `${id.current}-filelist`;
  const statusId = `${id.current}-status`;

  // Create aria-describedby value
  const describedBy = [ariaDescribedBy, error ? errorId : null, statusId].filter(Boolean).join(' ');

  // Get file selection status message
  const getFileStatusMessage = () => {
    if (!fileList || fileList.length === 0) {
      return intl.formatMessage(messages.noFilesSelected);
    }
    if (fileList.length === 1) {
      return intl.formatMessage(messages.fileSelected, { fileName: fileList[0].name });
    }
    const fileNames = Array.from(fileList).map((file) => file.name);
    return intl.formatMessage(messages.filesSelected, {
      count: fileList.length,
      fileDetails: fileNames,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileList(event.currentTarget.files);
    onChange?.(event.currentTarget.files);
  };

  const handleButtonClick = useCallback(() => {
    // Trigger the hidden file input
    const fileInput = document.getElementById(id.current) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }, []);

  return (
    <div className={containerCls}>
      <div className={styles.inputWrapper}>
        {/* Hidden file input */}
        <input
          id={id.current}
          type="file"
          accept={accept}
          multiple={multiple}
          className={styles.input} // This will be hidden
          onChange={handleFileChange}
          required={required}
        />

        {/* Label for description */}
        <label htmlFor={id.current} className={styles.label}>
          {label}
        </label>

        {/* Custom button that triggers the hidden input */}
        <button
          type="button"
          className={styles.fileButton}
          onClick={handleButtonClick}
          aria-describedby={describedBy}
          aria-label={label}
        >
          {intl.formatMessage(messages.attachFile)}
        </button>
      </div>

      {/* File selection status for screen readers */}
      <div
        id={statusId}
        className={styles['sr-only']}
        aria-live="polite"
        aria-atomic="true"
      >
        {getFileStatusMessage()}
      </div>

      {/* Error message */}
      {error && (
        <div
          id={errorId}
          className={styles.errorMessage}
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* File list */}
      {fileList && fileList.length > 0 && (
        <ul
          id={fileListId}
          className={styles.list}
          aria-label={intl.formatMessage(messages.filesSelected, { count: fileList.length })}
        >
          {Array.from(fileList).map((file, index) => (
            <li key={`${file.name}-${index}`}>
              <span className={styles.fileName}>{file.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileInput;
