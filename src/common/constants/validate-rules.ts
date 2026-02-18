export const REGEX_EMAIL_VALIDATION = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,10}$/i;

export const NAME_INVALID_CHARS = '[<>&"\'`,!@$%()=+{}[\\]]'; // using double backslashes to escape the ']' character
export const REGEX_NAME_INVALID_CHARS = new RegExp(NAME_INVALID_CHARS);
export const REGEX_NAME_INVALID_CHARS_GLOBAL = new RegExp(NAME_INVALID_CHARS, 'g');
