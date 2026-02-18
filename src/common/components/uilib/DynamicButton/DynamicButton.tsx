import type { ButtonProps } from '@adrise/web-ui/lib/Button/Button';
import { Button as ButtonRefresh } from '@tubitv/web-ui';
import React, { PureComponent } from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages, injectIntl } from 'react-intl';

import Button from 'web/components/Button/Button';

import Spinner from '../Spinner/Spinner';

const messages = defineMessages({
  save: {
    description: 'submit button text',
    defaultMessage: 'Submit',
  },
  saving: {
    description: 'submit changes button text',
    defaultMessage: 'Submitting...',
  },
  saved: {
    description: 'submit changes button text when changes have been saved',
    defaultMessage: 'Success!',
  },
});

export interface DynamicButtonProps extends ButtonProps {
  promise: () => Promise<any>;
  defaultLabel: string;
  submittingLabel: string;
  successLabel: string;
  failureLabel?: string;
  unsaved?: boolean;
  intl: IntlShape;
  useRefreshStyle?: boolean;
  className?: string;
  type?: string;
}

interface DynamicButtonState { label: string }

/**
 *
 * Component that takes Button and makes it have a dynamic label
 * based on status of promise
 * @param defaultLabel: to display when not submitting
 * @param submittingLabel: to display when submitting
 * @param successLabel: to display on successful submit
 * @param unsaved: If parent form state is dirty, make button label default (Ex. Save vs Saved!)
 */
export class DynamicButton extends PureComponent<
  DynamicButtonProps,
  DynamicButtonState
> {
  private isComponentMounted = false;

  constructor(props: DynamicButtonProps) {
    super(props);
    const defaultLabelText = props.defaultLabel || props.intl.formatMessage(messages.save);
    this.state = {
      label: defaultLabelText,
    };
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    // cannot conflict with base "isMounted" property, which is readonly
    this.isComponentMounted = true;
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
  }

  handleClick(e: React.MouseEvent<HTMLElement>) {
    const { promise, defaultLabel, intl, submittingLabel, successLabel, failureLabel } = this.props;
    const defaultLabelText = defaultLabel || intl.formatMessage(messages.save);
    const submittingLabelText = submittingLabel || intl.formatMessage(messages.saving);
    const successLabelText = successLabel || intl.formatMessage(messages.saved);

    e.preventDefault();
    this.setState({ label: submittingLabelText });

    promise().then(() => {
      if (!this.isComponentMounted) return;
      this.setState({ label: successLabelText });
    }).catch(() => {
      if (!this.isComponentMounted) return;
      this.setState({
        label: failureLabel || defaultLabelText,
      });
    });
  }

  render() {
    const { label } = this.state;
    const {
      className,
      color = 'secondary',
      defaultLabel,
      intl,
      failureLabel,
      promise,
      submittingLabel,
      successLabel,
      unsaved = false,
      useRefreshStyle,
      ...cleanProps
    } = this.props;
    const defaultLabelText = defaultLabel || intl.formatMessage(messages.save);
    const submittingLabelText = submittingLabel || intl.formatMessage(messages.saving);
    const submitting = label === submittingLabelText;
    const buttonLabel = (unsaved && !submitting) ? defaultLabelText : label;

    if (useRefreshStyle) {
      return (
        <ButtonRefresh
          className={className}
          type="submit"
          appearance={!unsaved ? 'tertiary' : 'primary'}
          disabled={!unsaved}
          loading={submitting}
          onClick={this.handleClick}
        >
          {buttonLabel}
        </ButtonRefresh>
      );
    }

    return (
      <Button
        color={color}
        {...cleanProps}
        onClick={this.handleClick}
      >
        {buttonLabel}
        {submitting ? <Spinner /> : null}
      </Button>
    );
  }
}

export default injectIntl(DynamicButton);
