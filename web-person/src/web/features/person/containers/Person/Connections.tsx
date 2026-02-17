import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import type { PersonData } from 'web/features/person/types/person';
import { getConnections, getPersonPath } from 'web/features/person/utils/person';

import styles from './Person.scss';
import messages from './personMessages';

const Connections = ({ name, videos }: PersonData) => {
  const { formatMessage } = useIntl();
  const connections = getConnections({ name, videos });

  if (!connections.length) {
    return null;
  }

  return (
    <div className={classNames(styles.section, styles.connections)}>
      <h2>{formatMessage(messages.connectionsTitle, { name })}</h2>
      <div>
        {connections.map((connection) => (
          <Link key={connection} to={getPersonPath(connection)}>
            {connection}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Connections;
