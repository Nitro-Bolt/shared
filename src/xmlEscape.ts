// @ts-check
import Cast from './cast';
import log from './log';

/**
 * Escape a string to be safe to use in XML content.
 * CC-BY-SA: hgoebl
 * https://stackoverflow.com/questions/7918868/
 * how-to-escape-xml-entities-in-javascript
 * @param unsafe Unsafe string.
 * @returns XML-escaped string, for use within an XML tag.
 */
const xmlEscape = function (unsafe: string[] | string) {
  if (typeof unsafe !== 'string') {
    // This happens when we have hacked blocks from 2.0
    // See scratchfoundation/scratch-vm#1030
    if (Array.isArray(unsafe)) {
      unsafe = String(unsafe);
    } else if (typeof unsafe === 'object') {
      unsafe = Cast.toString(unsafe);
    } else {
      log.error('Unexpected input received in replaceUnsafeChars');
      return unsafe;
    }
  }
  // @ts-expect-error
  return unsafe.replace(/[<>&'"]/g, (c: string) => {
    switch (c) {
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '&': return '&amp;';
    case '\'': return '&apos;';
    case '"': return '&quot;';
    }
  });
};

export default xmlEscape;