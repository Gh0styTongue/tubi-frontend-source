export const STUBIOS_DMCA_ISSUE_TYPE_FIELD_ID = 27839251589531;
export const STUBIOS_DMCA_REPORTER_INFORMATION_FIELD_ID = 28468939613467;
export const STUBIOS_DMCA_COPYRIGHT_OWNERS_FULL_NAME_FIELD_ID = 28469341302299;
export const STUBIOS_DMCA_RELATIONSHIP_TO_OWNER_FIELD_ID = 28470969454363;
export const STUBIOS_DMCA_YOUR_FULL_NAME_FIELD_ID = 28469332942363;
export const STUBIOS_DMCA_COMPANY_FIELD_ID = 27692228836379;
export const STUBIOS_DMCA_JOB_TITLE_FIELD_ID = 27693636311963;
export const STUBIOS_DMCA_EMAIL_ADDRESS_FIELD_ID = 27692377228187;
export const STUBIOS_DMCA_STREET_ADDRESS_FIELD_ID = 27842448716443;
export const STUBIOS_DMCA_CITY_FIELD_ID = 27692274989083;
export const STUBIOS_DMCA_STATE_PROVINCE_FIELD_ID = 27692276585883;
export const STUBIOS_DMCA_POSTAL_CODE_FIELD_ID = 27693703727259;
export const STUBIOS_DMCA_COUNTRY_FIELD_ID = 29266954297627;
export const STUBIOS_DMCA_PHONE_NUMBER_FIELD_ID = 27692378587291;
export const STUBIOS_DMCA_COPYRIGHTED_TYPE_FIELD_ID = 27693129309979;
export const STUBIOS_DMCA_DESCRIPTION_OF_WORK_FIELD_ID = 27693130123803;
export const STUBIOS_DMCA_LINK_TO_ORIGINAL_WORK_FIELD_ID = 27693082402331;
export const STUBIOS_DMCA_TRADEMARK_OWNERSHIP_DETAILS_FIELD_ID = 28616002562587;
export const STUBIOS_DMCA_TRADEMARK_REGISTRATION_FIELD_ID = 27843476538267;
export const STUBIOS_DMCA_REGISTRATION_NUMBER_FIELD_ID = 27843701156763;
export const STUBIOS_DMCA_COUNTRY_OF_TRADEMARK_OFFICE_FIELD_ID = 28616708933915;
export const STUBIOS_DMCA_URL_OF_TRADEMARK_REGISTRATION_FIELD_ID = 27843838524955;
export const STUBIOS_DMCA_DESCRIPTION_OF_TRADEMARK_USE_FIELD_ID = 28616727059739;
export const STUBIOS_DMCA_EVIDENCE_OF_TRADEMARK_USE_FIELD_ID = 28616734602651;
export const STUBIOS_DMCA_URL_OF_TRADEMARK_USE_FIELD_ID = 28616749358747;
export const STUBIOS_DMCA_CONTENT_TO_REPORT_FIELD_ID = 27845926541979;
export const STUBIOS_DMCA_DETAILS_OF_ISSUE_FIELD_ID = 27845959405851;
export const STUBIOS_DMCA_SWORN_STATEMENTS_FIELD_ID = 28617030379419;
export const STUBIOS_DMCA_SIGNATURE_FIELD_ID = 27836988313115;
export const STUBIOS_DMCA_COPYRIGHT_ACKNOWLEDGEMENT_STATEMENT_FIELD_ID = 27836817666331;
export const STUBIOS_DMCA_TRADEMARK_ACKNOWLEDGEMENT_STATEMENT_FIELD_ID = 29122973892635;
export const STUBIOS_DMCA_BELIEF_OF_UNAUTHORIZED_STATEMENT_FIELD_ID = 27846052533275;
export const STUBIOS_DMCA_COPYRIGHT_ACCURACY_CERTIFICATION_STATEMENT_FIELD_ID = 27846049596699;
export const STUBIOS_DMCA_TRADEMARK_ACCURACY_CERTIFICATION_STATEMENT_FIELD_ID = 29123570202779;
export const STUBIOS_DMCA_INFORMATION_DISCLOSURE_CONSENT_STATEMENT_FIELD_ID = 27846089265435;
export const STUBIOS_DMCA_PLATFORM_FIELD_ID = 27693150607003;
export const STUBIOS_DMCA_FORM_ID = 27691489477275;

export enum StubiosDMCAIssueTypeValue {
  copyrightInfringement = 'copyright_infringement_claim_',
  trademarkInfringement = 'trademark_infringement_claim_',
  copyrightInfringementOnTubi = 'possible_copyright_infringement_on_tubi',
  trademarkInfringementOnTubi = 'possible_trademark_infringement_on_tubi',
}

export enum StubiosDMCACopyrightReporterValue {
  copyrightOwner = 'i_am_the_copyright_owner',
  copyrightAuthorizedRepresentative = 'i_am_an_authorized_representative_of_the_copyright_owner',
  none = 'none_above',
}
export enum StubiosDMCATrademarkReporterValue {
  trademarkOwner = 'i_am_the_trademark_owner',
  trademarkAuthorizedRepresentative = 'i_am_an_authorized_representative_of_the_trademark_owner',
  none = 'none_above',
}
export enum StubiosDMCASwornStatementsValue {
  yes = 'yes__i_agree',
  no = 'no__i_don_t_agree',
}
export enum StubiosDMCAPlatformValue {
  stubios = 'stubios',
  tubi = 'tubi',
}
export enum StubiosDMCATrademarkRegistrationValue {
  yes = 'yes',
  no = 'no',
}

export const REQUIRED_STUBIOS_DMCA_MAIN_FIELDS = [
  'issueType',
  'reporterInformation',
];
export const REQUIRED_STUBIOS_DMCA_OWNER_CONTACT_INFORMATION_FIELDS = [
  'ownersFullName',
  'name',
  'email',
  'streetAddress',
  'city',
  'postalCode',
  'country',
];
export const REQUIRED_STUBIOS_DMCA_AUTHORIZED_REPRESENTATIVE_CONTACT_INFORMATION_FIELDS = [
  'ownersFullName',
  'relationshipToOwner',
  'name',
  'company',
  'jobTitle',
  'email',
  'streetAddress',
  'city',
  'postalCode',
  'country',
];
export const REQUIRED_STUBIOS_DMCA_COPYRIGHT_INFORMATION_FIELDS = [
  'copyrightType',
  'copyrightedWorkDescription',
];
export const REQUIRED_STUBIOS_DMCA_TRADEMARK_INFORMATION_FIELDS = [
  'trademarkedWord',
  'trademarkHaveRegistration',
];
export const REQUIRED_STUBIOS_DMCA_TRADEMARK_REGISTRATION_FIELDS = [
  'trademarkRegistrationNumber',
  'trademarkCountry',
];
export const REQUIRED_STUBIOS_DMCA_TRADEMARK_USE_FIELDS = [
  'trademarkUseDescription',
  'screenshots',
];
export const REQUIRED_STUBIOS_DMCA_TRADEMARK_STATEMENT_FIELDS = [
  'acknowledgementStatement',
  'accuracyCertificationStatement',
  'informationDisclosureConsentStatement',
];
export const REQUIRED_STUBIOS_DMCA_COPYRIGHT_STATEMENT_FIELDS = [
  'acknowledgementStatement',
  'beliefOfUnauthorizedUseStatement',
  'accuracyCertificationStatement',
  'informationDisclosureConsentStatement',
];
export const REQUIRED_STUBIOS_DMCA_ISSUE_DETAILS_FIELDS = [
  'stubiosContentLink',
  'reportedIssueDetails',
  'signature',
];

const ALLOWED_STUBIOS_DMCA_CONTACT_INFORMATION_FIELDS = [
  ...REQUIRED_STUBIOS_DMCA_OWNER_CONTACT_INFORMATION_FIELDS,
  ...REQUIRED_STUBIOS_DMCA_AUTHORIZED_REPRESENTATIVE_CONTACT_INFORMATION_FIELDS,
  'stateProvince',
  'phoneNumber',
];
const ALLOWED_STUBIOS_DMCA_COPYRIGHT_INFORMATION_FIELDS = [
  ...REQUIRED_STUBIOS_DMCA_COPYRIGHT_INFORMATION_FIELDS,
  'copyrightOriginalLink',
];
const ALLOWED_STUBIOS_DMCA_TRADEMARK_INFORMATION_FIELDS = [
  ...REQUIRED_STUBIOS_DMCA_TRADEMARK_INFORMATION_FIELDS,
  ...REQUIRED_STUBIOS_DMCA_TRADEMARK_REGISTRATION_FIELDS,
  ...REQUIRED_STUBIOS_DMCA_TRADEMARK_USE_FIELDS,
  'trademarkRegistrationURL',
  'trademarkUseURL',
];
export const ALLOWED_STUBIOS_DMCA_FIELDS = [
  ...REQUIRED_STUBIOS_DMCA_MAIN_FIELDS,
  ...ALLOWED_STUBIOS_DMCA_CONTACT_INFORMATION_FIELDS,
  ...ALLOWED_STUBIOS_DMCA_COPYRIGHT_INFORMATION_FIELDS,
  ...ALLOWED_STUBIOS_DMCA_TRADEMARK_INFORMATION_FIELDS,
  ...REQUIRED_STUBIOS_DMCA_ISSUE_DETAILS_FIELDS,
  ...REQUIRED_STUBIOS_DMCA_TRADEMARK_STATEMENT_FIELDS,
  ...REQUIRED_STUBIOS_DMCA_COPYRIGHT_STATEMENT_FIELDS,
  'platform',
];
