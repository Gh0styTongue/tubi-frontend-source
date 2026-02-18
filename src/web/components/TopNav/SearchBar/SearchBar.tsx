import { Close, Search } from '@tubitv/icons';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import type {
  ChangeEventHandler, FC } from 'react';
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { defineMessages } from 'react-intl';

import { clearSearch, storeSrcPath } from 'common/actions/search';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMovieAndTVShowNavEnabledSelector } from 'common/selectors/webTopNav';
import { useIntl } from 'i18n/intl';
import { TopNavContext } from 'web/components/TopNav/context';

import styles from './SearchBar.scss';

const QUERY_LIMIT = 64;

const messages = defineMessages({
  searchPlaceholder: {
    description: 'search box placeholder',
    defaultMessage: 'Find movies, TV shows and more',
  },
});

const SearchBar: FC<{ inverted?: boolean; isMobileMenuShow: boolean }> = ({ inverted, isMobileMenuShow }) => {
  const intl = useIntl();
  const { viewportType } = useAppSelector((state) => state.ui);
  const { key: initialKeyword, fromPath = WEB_ROUTES.home } = useAppSelector(
    (state) => state.search
  );
  const path = useLocation().pathname;
  const [keyword, setKeyword] = useState(initialKeyword);
  const dispatch = useAppDispatch();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSearchPage = path.indexOf(`${WEB_ROUTES.search}`) === 0;
  const { setShowMobileMenu, setIsSearchInputFocused } = useContext(TopNavContext);
  const isMovieAndTVShowNavEnabled = useAppSelector(isMovieAndTVShowNavEnabledSelector);

  const moveCursorToEnd = useCallback(() => {
    const el = searchInputRef.current;
    if (el && typeof el.selectionStart === 'number') {
      setTimeout(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
      }, 1);
    }
  }, []);

  useEffect(() => {
    if (isSearchPage) {
      moveCursorToEnd();
    } else {
      setKeyword('');
    }
  }, [isSearchPage, moveCursorToEnd]);

  const clearAndExit = useCallback(() => {
    dispatch(clearSearch());
    tubiHistory.push(fromPath);
    setKeyword('');
  }, [dispatch, fromPath]);

  const search = useCallback(
    (val: string) => {
      const encodedVal = encodeURIComponent(val);
      // when search box is empty, exit search
      if (val.trim().length === 0) {
        clearAndExit();
        return;
      }

      // store the src path for back once exit from search
      dispatch(storeSrcPath(path));

      // only store the final search url to history
      if (isSearchPage) {
        tubiHistory.replace(`${WEB_ROUTES.search}/${encodedVal}`);
      } else {
        tubiHistory.push(`${WEB_ROUTES.search}/${encodedVal}`);
      }
    },
    [clearAndExit, dispatch, isSearchPage, path]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce(search, 500, { leading: false, trailing: true }), [search]);

  const onChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const target = event.target;
      let val = target.value || '';

      if (val.trim().length > QUERY_LIMIT) {
        val = val.substring(0, QUERY_LIMIT);
      }

      if (keyword !== val && viewportType !== 'mobile') {
        debouncedSearch(val);
      }

      setKeyword(val);
    },
    [debouncedSearch, keyword, viewportType]
  );

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (viewportType === 'mobile') {
        search(keyword);
        setShowMobileMenu(false);
      }
    },
    [keyword, search, setShowMobileMenu, viewportType]
  );

  const withOpenAndInvertedStyle = useCallback(
    (style: string) => classnames(style, { [styles.open]: !!keyword, [styles.inverted]: inverted }),
    [inverted, keyword]
  );

  return (
    <div className={classnames(withOpenAndInvertedStyle(styles.searchBar), {
      [styles.showOnMobile]: isMobileMenuShow,
      [styles.withMovieAndTVShow]: isMovieAndTVShowNavEnabled,
    })}
    >
      <Search className={styles.searchIcon} />
      <form onSubmit={onSubmit} className={withOpenAndInvertedStyle(styles.form)}>
        <input
          ref={searchInputRef}
          value={keyword}
          className={withOpenAndInvertedStyle(styles.textInput)}
          required
          type="search"
          placeholder={intl.formatMessage(messages.searchPlaceholder)}
          onChange={onChange}
          onFocus={() => setIsSearchInputFocused(true)}
          onBlur={() => setIsSearchInputFocused(false)}
        />
      </form>
      {keyword ? <Close className={styles.closeIcon} onClick={clearAndExit} /> : null}
    </div>
  );
};

export default memo(SearchBar);
