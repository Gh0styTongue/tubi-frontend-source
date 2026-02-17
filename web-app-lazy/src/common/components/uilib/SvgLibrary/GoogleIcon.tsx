import React from 'react';

import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

type Props = {
  className?: string;
  withColor?: boolean;
};

const GoogleIcon: React.FunctionComponent<Props> = (props) => {
  const { className, ...rest } = props;
  return (
    <SvgIcon viewBox="0 0 24 24" fill="none" className={className} {...rest} role="img">
      <title>Google Icon</title>
      <g clipPath="url(#clip0)">
        <path
          d="M22 12.23c0-.68-.056-1.364-.176-2.032H12.2v3.85h5.51a4.624 4.624 0 01-2.039 3.04v2.498h3.288C20.89 17.844 22 15.272 22 12.23z"
          fill="#4285F4"
        />
        <path
          d="M12.2 22c2.752 0 5.073-.886 6.764-2.414l-3.288-2.499c-.915.61-2.096.956-3.472.956-2.661 0-4.918-1.76-5.728-4.127H3.083v2.576C4.816 19.869 8.343 22 12.201 22z"
          fill="#34A853"
        />
        <path d="M6.472 13.916a5.877 5.877 0 010-3.829V7.513H3.083a9.831 9.831 0 000 8.98l3.39-2.576z" fill="#FBBC04" />
        <path
          d="M12.2 5.957a5.606 5.606 0 013.914 1.5L19.027 4.6A9.916 9.916 0 0012.201 2C8.343 2 4.815 4.13 3.083 7.512l3.39 2.575c.805-2.37 3.066-4.13 5.728-4.13z"
          fill="#EA4335"
        />
      </g>
      <defs>
        <clipPath id="clip0">
          <path fill="#fff" transform="translate(2 2)" d="M0 0h20v20H0z" />
        </clipPath>
      </defs>
    </SvgIcon>
  );
};

export default GoogleIcon;
