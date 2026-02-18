import omitBy from 'lodash/omitBy';
import isPropValid from './isPropValid';
function isPropInvalid(prop) {
    return !isPropValid(prop);
}
function hasInvalidProp(props) {
    var foundInvalidProp = false;
    for (var prop in props) {
        if (props.hasOwnProperty(prop) && isPropInvalid(prop)) {
            foundInvalidProp = true;
            break;
        }
    }
    return foundInvalidProp;
}
export default function omitInvalidProps(props) {
    // if we can avoid the allocation of a new, sanitized copy of the props object, we should.
    if (!hasInvalidProp(props))
        return props;
    return omitBy(props, function (_, key) { return isPropInvalid(key); });
}
//# sourceMappingURL=omitInvalidProps.js.map