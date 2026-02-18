import type { CSSProperties } from 'react';

/* eslint no-unused-expressions: 0, no-nested-ternary: 0 */
/* eslint no-bitwise: 0 */
/* eslint no-cond-assign: 0 */
/* eslint max-params: 0 */
/* eslint func-names: 0 */
/* eslint max-classes-per-file: 0 */

type ContainerBox = Omit<DOMRect, 'x' | 'y' | 'toJSON'>;

type WebMafVTTCue = VTTCue & { rgba: number[], action: string };

// Try to parse input as a time stamp.
function parseTimeStamp(input: string) {

  const computeSeconds = (...time: (number | string)[]) => {
    return ((time[0] as number) | 0) * 3600 + ((time[1] as number) | 0) * 60 + ((time[2] as number) | 0) + ((time[3] as number) | 0) / 1000;
  };

  const m = input.match(/^(\d+):(\d{2})(:\d{2})?\.(\d{3})/);
  if (!m) {
    return null;
  }

  if (m[3]) {
    // Timestamp takes the form of [hours]:[minutes]:[seconds].[milliseconds]
    return computeSeconds(m[1], m[2], m[3].replace(':', ''), m[4]);
  } if (typeof m[1] === 'number' && m[1] > 59) {
    // Timestamp takes the form of [hours]:[minutes].[milliseconds]
    // First position is hours as it's over 59.
    return computeSeconds(m[1], m[2], 0, m[4]);
  }
  // Timestamp takes the form of [minutes]:[seconds].[milliseconds]
  return computeSeconds(0, m[1], m[2], m[4]);
}

const ESCAPE: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&lrm;': '\u200e',
  '&rlm;': '\u200f',
  '&nbsp;': '\u00a0',
};

const TAG_NAME: Record<string, string> = {
  c: 'span',
  i: 'i',
  b: 'b',
  u: 'u',
  ruby: 'ruby',
  rt: 'rt',
  v: 'span',
  lang: 'span',
};

const TAG_ANNOTATION: Record<string, 'title' | 'lang'> = {
  v: 'title',
  lang: 'lang',
};

const NEEDS_PARENT: Record<string, string> = {
  rt: 'ruby',
};

// Parse content into a document fragment.
function parseContent(window: Window, input: string) {
  function nextToken() {
    // Check for end-of-string.
    if (!input) {
      return null;
    }

    // Consume 'n' characters from the input.
    function consume(result: string) {
      input = input.substr(result.length);
      return result;
    }

    const m = input.match(/^([^<]*)(<[^>]+>?)?/);
    // If there is some text before the next tag, return it, otherwise return
    // the tag.
    if (!m) return m;
    return consume(m[1] ? m[1] : m[2]);
  }

  // Unescape a string 's'.
  function unescape1(e: string) {
    return ESCAPE[e];
  }

  function unescape(s: string) {
    let m;
    while ((m = s.match(/&(amp|lt|gt|lrm|rlm|nbsp);/))) {
      s = s.replace(m[0], unescape1);
    }
    return s;
  }

  function shouldAdd(current: HTMLElement, element: HTMLElement) {
    return !NEEDS_PARENT[element.localName]
          || NEEDS_PARENT[element.localName] === current.localName;
  }

  // Create an element for this tag.
  function createElement(type: string, annotation: string) {
    const tagName = TAG_NAME[type];
    if (!tagName) {
      return null;
    }
    const element = window.document.createElement(tagName) as HTMLElement;
    const name = TAG_ANNOTATION[type];
    if (name && annotation) {
      element[name] = annotation.trim();
    }
    return element;
  }

  const rootDiv = window.document.createElement('div');
  let current = rootDiv;
  let t;
  const tagStack = [];

  while ((t = nextToken()) !== null) {
    if (t[0] === '<') {
      if (t[1] === '/') {
        // If the closing tag matches, move back up to the parent node.
        if (tagStack.length
                  && tagStack[tagStack.length - 1] === t.substr(2).replace('>', '')) {
          tagStack.pop();
          current = current.parentNode as HTMLDivElement;
        }
        // Otherwise just ignore the end tag.
        continue;
      }
      const ts = parseTimeStamp(t.substr(1, t.length - 2));
      let node;
      if (ts) {
        // Timestamps are lead nodes as well.
        node = window.document.createProcessingInstruction('timestamp', ts.toString());
        current.appendChild(node);
        continue;
      }
      const m = t.match(/^<([^.\s/0-9>]+)(\.[^\s\\>]+)?([^>\\]+)?(\\?)>?$/);
      // If we can't parse the tag, skip to the next tag.
      if (!m) {
        continue;
      }
      // Try to construct an element, and ignore the tag if we couldn't.
      node = createElement(m[1], m[3]);
      if (!node) {
        continue;
      }
      // Determine if the tag should be added based on the context of where it
      // is placed in the cuetext.
      if (!shouldAdd(current, node)) {
        continue;
      }
      // Set the class list (as a list of classes, separated by space).
      if (m[2]) {
        node.className = m[2].substr(1).replace('.', ' ');
      }
      // Append the node to the current node, and enter the scope of the new
      // node.
      tagStack.push(m[1]);
      current.appendChild(node);
      current = node as HTMLDivElement;
      continue;
    }

    // Text nodes are leaf nodes.
    current.appendChild(window.document.createTextNode(unescape(t)));
  }

  return rootDiv;
}

// This is a list of all the Unicode characters that have a strong
// right-to-left category. What this means is that these characters are
// written right-to-left for sure. It was generated by pulling all the strong
// right-to-left characters out of the Unicode data table. That table can
// found at: http://www.unicode.org/Public/UNIDATA/UnicodeData.txt
const strongRTLRanges = [[0x5be, 0x5be], [0x5c0, 0x5c0], [0x5c3, 0x5c3], [0x5c6, 0x5c6],
  [0x5d0, 0x5ea], [0x5f0, 0x5f4], [0x608, 0x608], [0x60b, 0x60b], [0x60d, 0x60d],
  [0x61b, 0x61b], [0x61e, 0x64a], [0x66d, 0x66f], [0x671, 0x6d5], [0x6e5, 0x6e6],
  [0x6ee, 0x6ef], [0x6fa, 0x70d], [0x70f, 0x710], [0x712, 0x72f], [0x74d, 0x7a5],
  [0x7b1, 0x7b1], [0x7c0, 0x7ea], [0x7f4, 0x7f5], [0x7fa, 0x7fa], [0x800, 0x815],
  [0x81a, 0x81a], [0x824, 0x824], [0x828, 0x828], [0x830, 0x83e], [0x840, 0x858],
  [0x85e, 0x85e], [0x8a0, 0x8a0], [0x8a2, 0x8ac], [0x200f, 0x200f],
  [0xfb1d, 0xfb1d], [0xfb1f, 0xfb28], [0xfb2a, 0xfb36], [0xfb38, 0xfb3c],
  [0xfb3e, 0xfb3e], [0xfb40, 0xfb41], [0xfb43, 0xfb44], [0xfb46, 0xfbc1],
  [0xfbd3, 0xfd3d], [0xfd50, 0xfd8f], [0xfd92, 0xfdc7], [0xfdf0, 0xfdfc],
  [0xfe70, 0xfe74], [0xfe76, 0xfefc], [0x10800, 0x10805], [0x10808, 0x10808],
  [0x1080a, 0x10835], [0x10837, 0x10838], [0x1083c, 0x1083c], [0x1083f, 0x10855],
  [0x10857, 0x1085f], [0x10900, 0x1091b], [0x10920, 0x10939], [0x1093f, 0x1093f],
  [0x10980, 0x109b7], [0x109be, 0x109bf], [0x10a00, 0x10a00], [0x10a10, 0x10a13],
  [0x10a15, 0x10a17], [0x10a19, 0x10a33], [0x10a40, 0x10a47], [0x10a50, 0x10a58],
  [0x10a60, 0x10a7f], [0x10b00, 0x10b35], [0x10b40, 0x10b55], [0x10b58, 0x10b72],
  [0x10b78, 0x10b7f], [0x10c00, 0x10c48], [0x1ee00, 0x1ee03], [0x1ee05, 0x1ee1f],
  [0x1ee21, 0x1ee22], [0x1ee24, 0x1ee24], [0x1ee27, 0x1ee27], [0x1ee29, 0x1ee32],
  [0x1ee34, 0x1ee37], [0x1ee39, 0x1ee39], [0x1ee3b, 0x1ee3b], [0x1ee42, 0x1ee42],
  [0x1ee47, 0x1ee47], [0x1ee49, 0x1ee49], [0x1ee4b, 0x1ee4b], [0x1ee4d, 0x1ee4f],
  [0x1ee51, 0x1ee52], [0x1ee54, 0x1ee54], [0x1ee57, 0x1ee57], [0x1ee59, 0x1ee59],
  [0x1ee5b, 0x1ee5b], [0x1ee5d, 0x1ee5d], [0x1ee5f, 0x1ee5f], [0x1ee61, 0x1ee62],
  [0x1ee64, 0x1ee64], [0x1ee67, 0x1ee6a], [0x1ee6c, 0x1ee72], [0x1ee74, 0x1ee77],
  [0x1ee79, 0x1ee7c], [0x1ee7e, 0x1ee7e], [0x1ee80, 0x1ee89], [0x1ee8b, 0x1ee9b],
  [0x1eea1, 0x1eea3], [0x1eea5, 0x1eea9], [0x1eeab, 0x1eebb], [0x10fffd, 0x10fffd]];

function isStrongRTLChar(charCode: number) {
  for (const currentRange of strongRTLRanges) {
    if (charCode >= currentRange[0] && charCode <= currentRange[1]) {
      return true;
    }
  }

  return false;
}

function pushNodes(nodeStack: ChildNode[], node: HTMLElement) {
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    nodeStack.push(node.childNodes[i]);
  }
}

function nextTextNode(nodeStack: HTMLElement[]): string | null | undefined {
  if (!nodeStack || !nodeStack.length) {
    return null;
  }

  const node = nodeStack.pop();
  const text = node?.textContent || node?.innerText;
  if (text) {
    // TODO: This should match all unicode type B characters (paragraph
    // separator characters). See issue #115.
    const m = text.match(/^.*(\n|\r)/);
    if (m) {
      nodeStack.length = 0;
      return m[0];
    }
    return text;
  }
  if (node?.tagName === 'ruby') {
    return nextTextNode(nodeStack);
  }
  if (node?.childNodes) {
    pushNodes(nodeStack, node);
    return nextTextNode(nodeStack);
  }
}

function determineBidi(cueDiv: HTMLDivElement) {
  if (!cueDiv || !cueDiv.childNodes) {
    return 'ltr';
  }

  const nodeStack: HTMLElement[] = [];
  let text;
  let charCode;

  pushNodes(nodeStack, cueDiv);
  while ((text = nextTextNode(nodeStack))) {
    for (let i = 0; i < text.length; i++) {
      charCode = text.charCodeAt(i);
      if (isStrongRTLChar(charCode)) {
        return 'rtl';
      }
    }
  }
  return 'ltr';
}

function computeLinePos(cue: VTTCue) {
  if (typeof cue.line === 'number'
      && (cue.snapToLines || (cue.line >= 0 && cue.line <= 100))) {
    return cue.line;
  }
  if (
    !cue.track ||
    // @ts-expect-error textTrackList not a property
    !cue.track.textTrackList ||
    // @ts-expect-error textTrackList not a property
    !cue.track.textTrackList.mediaElement) {
    return -1;
  }
  const track = cue.track;
  // @ts-expect-error textTrackList not a property
  const trackList = track.textTrackList as TextTrackList;
  let count = 0;
  for (let i = 0; i < trackList.length && trackList[i] !== track; i++) {
    if (trackList[i].mode === 'showing') {
      count++;
    }
  }
  return ++count * -1;
}

function isWebMAFCaption(cue: WebMafVTTCue) {
  if (!cue) {
    return false;
  }
  const { rgba, text, position, action } = cue;
  return Array.isArray(rgba) && Array.isArray(position) && typeof text === 'string' && typeof action === 'string';
}

class StyleBox {
  div?: HTMLDivElement;

  // Apply styles to a div. If there is no div passed then it defaults to the
  // div on 'this'.
  applyStyles = (styles: CSSProperties, div?: HTMLDivElement) => {
    div = div || this.div;
    if (!div) return;
    Object.assign(div.style, styles);
  };

  formatStyle = (val: number, unit: string) => {
    return val === 0 ? 0 : val + unit;
  };
}

// Constructs the computed display state of the cue (a div). Places the div
// into the overlay which should be a block level element (usually a div).
class CueStyleBox extends StyleBox {
  cue: VTTCue;

  cueDiv: HTMLDivElement;

  div: HTMLDivElement;

  constructor(window: Window, cue: VTTCue) {
    super();
    this.cue = cue;

    // Parse our cue's text into a DOM tree rooted at 'cueDiv'. This div will
    // have inline positioning and will function as the cue background box.
    this.cueDiv = parseContent(window, cue.text);
    this.cueDiv.className = 'tubi-text-track-cue tubi-reset';

    let writingMode: CSSProperties['writingMode'] = 'horizontal-tb';

    if (/^(lr|rl)$/.test(cue.vertical)) {
      writingMode = `vertical-${cue.vertical}` as CSSProperties['writingMode'];
    }

    let styles: CSSProperties = {
      textShadow: '',
      position: 'relative',
      paddingLeft: 0,
      paddingRight: 0,
      left: 0,
      top: 0,
      bottom: 0,
      display: 'inline',
      whiteSpace: 'pre',
      writingMode,
      unicodeBidi: 'plaintext',
    };

    this.applyStyles(styles, this.cueDiv);

    // Create an absolutely positioned div that will be used to position the cue
    // div. Note, all WebVTT cue-setting alignments are equivalent to the CSS
    // mirrors of them except "middle" which is "center" in CSS.
    this.div = window.document.createElement('div');
    styles = {
      textAlign: (cue.align as string) === 'middle' ? 'center' : cue.align,
      whiteSpace: 'pre-line',
      position: 'absolute',
      direction: determineBidi(this.cueDiv),
      writingMode,
      unicodeBidi: 'plaintext',
    };

    this.applyStyles(styles);

    this.div.appendChild(this.cueDiv);

    // Calculate the distance from the reference edge of the viewport to the text
    // position of the cue box. The reference edge will be resolved later when
    // the box orientation styles are applied.
    let textPos: VTTCue['position'] = 0;
    // The polyfill used cue.positionAlign to determine whether text should be left,
    // center or right aligned. However, this value is read only after a cue has been created in FF though the
    // spec says this value should be settable. See below link:
    // https://w3c.github.io/webvtt/#ref-for-enumdef-positionalignsetting-1
    // The cue.align property is settable and other browsers use it as the offset from which the cue.position
    // value is applied.
    let transform = '';
    switch (cue.align) {
      case 'start':
      case 'left':
        textPos = cue.position;
        break;
      case 'middle' as AlignSetting:
      case 'center':
        textPos = (cue.position === 'auto' ? 50 : cue.position);
        transform = cue.vertical ? 'translateY(-50%)' : 'translateX(-50%)';
        break;
      case 'end':
      case 'right':
        textPos = (cue.position === 'auto' ? 100 : cue.position);
        transform = cue.vertical ? 'translateY(-100%)' : 'translateX(-100%)';
        break;
      default:
        break;
    }

    // Ensures textPos is within the bounds of the cueBox
    textPos = Math.max(Math.min(100, textPos as number), 0);

    // Horizontal box orientation; textPos is the distance from the left edge of the
    // area to the left edge of the box and cue.size is the distance extending to
    // the right from there.
    if (isWebMAFCaption(cue as WebMafVTTCue)) {
      const { position: [x, y] } = cue as VTTCue & { position: number[] };
      this.applyStyles({
        top: `${y}px`,
        left: `${x}px`,
      });
    } else if (!cue.vertical) {
      this.applyStyles({
        left: this.formatStyle(textPos, '%'),
        transform,
      });
      // Vertical box orientation; textPos is the distance from the top edge of the
      // area to the top edge of the box and cue.size is the height extending
      // downwards from there.
    } else {
      this.applyStyles({
        top: this.formatStyle(textPos, '%'),
        height: this.formatStyle(cue.size, '%'),
        transform,
      });
    }
  }

  move = (box: ContainerBox) => {
    this.applyStyles({
      top: this.formatStyle(box.top, 'px'),
      bottom: this.formatStyle(box.bottom, 'px'),
      left: this.formatStyle(box.left, 'px'),
      paddingRight: this.formatStyle(box.right, 'px'),
      height: this.formatStyle(box.height, 'px'),
      transform: '',
    });
  };
}

// Represents the co-ordinates of an Element in a way that we can easily
// compute things with such as if it overlaps or intersects with another Element.
// Can initialize it with either a StyleBox or another BoxPosition.
class BoxPosition {
  static getSimpleBoxPosition: (obj: StyleBox | BoxPosition | HTMLElement) => ContainerBox;

  left: number = 0;

  right: number = 0;

  top: number = 0;

  height: number = 0;

  bottom: number = 0;

  width: number = 0;

  lineHeight: number = 0;

  constructor(obj: StyleBox | BoxPosition | ContainerBox) {
    // Either a BoxPosition was passed in and we need to copy it, or a StyleBox
    // was passed in and we need to copy the results of 'getBoundingClientRect'
    // as the object returned is readonly. All co-ordinate values are in reference
    // to the viewport origin (top left).
    let lh: number = 0;
    let height: number = 0;
    let width: number = 0;
    let top: number = 0;

    const { div } = obj as StyleBox;
    if (div) {
      height = div.offsetHeight;
      width = div.offsetWidth;
      top = div.offsetTop;

      const { firstChild } = div;
      const rects = (firstChild as HTMLDivElement)?.getClientRects?.();
      obj = div.getBoundingClientRect();
      // In certain cases the outer div will be slightly larger then the sum of
      // the inner div's lines. This could be due to bold text, etc, on some platforms.
      // In this case we should get the average line height and use that. This will
      // result in the desired behaviour.
      lh = rects ? Math.max((rects[0] && rects[0].height) || 0, obj.height / rects.length)
        : 0;
    }
    const box = obj as BoxPosition;
    this.left = box.left;
    this.right = box.right;
    this.top = box.top || top;
    this.height = box.height || height;
    this.bottom = box.bottom || (top + (box.height || height));
    this.width = box.width || width;
    this.lineHeight = lh > 0 ? lh : box.lineHeight;

    // Sets the width to be slightly larger to prevent text wrapping in IE 11
    this.width = Math.ceil(this.width + 1);
  }

  // Move the box along a particular axis. Optionally pass in an amount to move
  // the box. If no amount is passed then the default is the line height of the
  // box.
  move = (axis: string, toMove?: number) => {
    toMove = toMove !== undefined ? toMove : this.lineHeight || 0;
    switch (axis) {
      case '+x':
        this.left += toMove;
        this.right += toMove;
        break;
      case '-x':
        this.left -= toMove;
        this.right -= toMove;
        break;
      case '+y':
        this.top += toMove;
        this.bottom += toMove;
        break;
      case '-y':
        this.top -= toMove;
        this.bottom -= toMove;
        break;
      default:
        break;
    }
  };

  // Check if this box overlaps another box, b2.
  overlaps = (b2: ContainerBox) => {
    return this.left < b2.right
        && this.right > b2.left
        && this.top < b2.bottom
        && this.bottom > b2.top;
  };

  // Check if this box overlaps any other boxes in boxes.
  overlapsAny = (boxes: ContainerBox[]) => {
    for (const box of boxes) {
      if (this.overlaps(box)) {
        return true;
      }
    }
    return false;
  };

  // Check if this box is within another box.
  within = (container: ContainerBox) => {
    return this.top >= container.top
        && this.bottom <= container.bottom
        && this.left >= container.left
        && this.right <= container.right;
  };

  // Check if this box is entirely within the container or it is overlapping
  // on the edge opposite of the axis direction passed. For example, if "+x" is
  // passed and the box is overlapping on the left edge of the container, then
  // return true.
  overlapsOppositeAxis = (container: ContainerBox, axis: string) => {
    switch (axis) {
      case '+x':
        return this.left < container.left;
      case '-x':
        return this.right > container.right;
      case '+y':
        return this.top < container.top;
      case '-y':
        return this.bottom > container.bottom;
      default:
        break;
    }
  };

  // Find the percentage of the area that this box is overlapping with another
  // box.
  intersectPercentage = (b2: ContainerBox) => {
    const x = Math.max(0, Math.min(this.right, b2.right) - Math.max(this.left, b2.left));
    const y = Math.max(0, Math.min(this.bottom, b2.bottom) - Math.max(this.top, b2.top));
    const intersectArea = x * y;
    return intersectArea / (this.height * this.width);
  };

  // Convert the positions from this box to CSS compatible positions using
  // the reference container's positions. This has to be done because this
  // box's positions are in reference to the viewport origin, whereas, CSS
  // values are in reference to their respective edges.
  toCSSCompatValues = (reference: ContainerBox) => {
    return {
      top: this.top - reference.top,
      bottom: reference.bottom - this.bottom,
      left: this.left - reference.left,
      paddingRight: reference.right - this.right,
      height: this.height,
      width: this.width,
    };
  };
}

// Get an object that represents the box's position without anything extra.
// Can pass a StyleBox, HTMLElement, or another BoxPosition.
BoxPosition.getSimpleBoxPosition = function (obj: StyleBox | BoxPosition | HTMLElement) {
  const height = obj instanceof StyleBox && obj.div
    ? obj.div.offsetHeight
    : obj instanceof HTMLElement && obj.tagName
      ? obj.offsetHeight
      : 0;
  const width = obj instanceof StyleBox && obj.div
    ? obj.div.offsetWidth
    : obj instanceof HTMLElement && obj.tagName
      ? obj.offsetWidth
      : 0;
  const top = obj instanceof StyleBox && obj.div
    ? obj.div.offsetTop
    : obj instanceof HTMLElement && obj.tagName
      ? obj.offsetTop
      : 0;

  const rect: ContainerBox = obj instanceof StyleBox && obj.div
    ? obj.div.getBoundingClientRect()
    : obj instanceof HTMLElement && obj.tagName
      ? obj.getBoundingClientRect()
      : obj as unknown as ContainerBox;

  const trueHeight = rect.height || height;

  const ret = {
    left: rect.left,
    right: rect.right,
    top: rect.top || top,
    height: trueHeight,
    bottom: rect.bottom || (top + trueHeight),
    width: rect.width || width,
  };

  return ret;
};

// Move a StyleBox to its specified, or next best, position. The containerBox
// is the box that contains the StyleBox, such as a div. boxPositions are
// a list of other boxes that the styleBox can't overlap with.
// Puts the cue in the "best fit" line if the cue's line would cause text to fall outside the containerBox
function moveBoxToLinePosition(window: Window, styleBox: CueStyleBox, containerBox: ContainerBox, boxPositions: ContainerBox[], numLinesOfText: number) {

  // Find the best position for a cue box, b, on the video. The axis parameter
  // is a list of axis, the order of which, it will move the box along. For example:
  // Passing ["+x", "-x"] will move the box first along the x axis in the positive
  // direction. If it doesn't find a good position for it there it will then move
  // it along the x axis in the negative direction.
  function findBestPosition(b: BoxPosition, axis: string[], posFindRecursiveCount = 0): BoxPosition {
    let bestPosition;
    const specifiedPosition = new BoxPosition(b);
    let percentage = 0; // Lowest possible so the first thing we get is better.
    let bestAxis;

    // Prevent empty boxes from entering recursive overlap correction.
    if (!b.height || !b.width) {
      return specifiedPosition;
    }

    for (const ax of axis) {
      while (b.overlapsOppositeAxis(containerBox, ax)
          || (b.within(containerBox) && b.overlapsAny(boxPositions))) {
        b.move(ax);
      }

      // We found a spot where we aren't overlapping anything. This is our
      // best position.
      if (b.within(containerBox)) {
        return b;
      }
      const p = b.intersectPercentage(containerBox);
      // If we're outside the container box less then we were on our last try
      // then remember this position as the best position.
      if (percentage <= p) {
        bestPosition = new BoxPosition(b);
        percentage = p;
        bestAxis = ax;
      }
      // Reset the box position to the specified position.
      b = new BoxPosition(specifiedPosition);
    }

    const finalPos = bestPosition || specifiedPosition;
    // If we detect a best position based on one axis, oftentimes combining with the other axis
    // results in a much better position.
    // TODO: Make more performant by checking axis permutations above
    if (bestAxis && posFindRecursiveCount === 0) {
      const otherAxis = bestAxis.indexOf('y') === -1 ? ['-y', '+y'] : ['-x', '+x'];
      return findBestPosition(finalPos, otherAxis, posFindRecursiveCount + 1);
    }
    return finalPos;
  }
  let boxPosition = new BoxPosition(styleBox);
  const cue = styleBox.cue;
  let linePos = computeLinePos(cue);
  let axis: string[] = [];
  let step: number = boxPosition.lineHeight;

  // If we have a line number to align the cue to.
  if (cue.snapToLines) {
    let size: 'height' | 'width' = 'height';
    switch (cue.vertical) {
      case '':
        axis = ['+y', '-y'];
        size = 'height';
        step = containerBox[size] / 15;
        break;
      case 'rl':
        axis = ['+x', '-x'];
        size = 'width';
        step = containerBox[size] / 100;
        break;
      case 'lr':
        axis = ['-x', '+x'];
        size = 'width';
        step = containerBox[size] / 100;
        break;
      default:
        break;
    }

    // const step = boxPosition.lineHeight;
    // This ensures that cues are positioned according to the maximum number of lines
    // that can be displayed based on the container size.
    // The position also needs to account for the number of lines of text to ensure
    // text isn't cut off at the bottom of the container
    const maxLines = Math.floor(containerBox[size] / step);
    linePos = Math.min(linePos, maxLines - numLinesOfText);
    let position = step * Math.round(linePos);
    const maxPosition = containerBox[size] + step;
    const initialAxis = axis[0];

    // If the specified initial position is greater than the max position, then
    // clamp the box to the amount of steps it would take for the box to
    // reach the max position.
    if (Math.abs(position) > maxPosition) {
      position = position < 0 ? -1 : 1;
      position *= Math.ceil(maxPosition / step) * step;
    }

    // If computed line position returns negative then line numbers are
    // relative to the bottom of the video instead of the top. Therefore, we
    // need to increase our initial position by the length or width of the
    // video, depending on the writing direction, and reverse our axis directions.
    if (linePos < 0) {
      position += cue.vertical ? containerBox.width : containerBox.height;
      // Account for lines of text when determining position based on a negative line value
      const textHeight = numLinesOfText * step;
      position -= textHeight;
      // We call reverse on a copy of the 'axis' array, instead of calling it directly on the original var because
      // Safari 12 introduced a bug where the reverse order of an array is cached after calling
      // array.prototype.reverse (https://bugs.webkit.org/show_bug.cgi?id=188794).
      axis = axis.slice().reverse();
    }

    // Shift the position of the captions up to prevent minor overlaps as the text is laid out in IE11
    position -= numLinesOfText;

    // Move the box to the specified position. This may not be its best
    // position.
    boxPosition.move(initialAxis, position);
  } else {
    const calculatedPercentage = (boxPosition.lineHeight / containerBox.height) * 100;
    switch (cue.lineAlign) {
      case 'middle' as LineAlignSetting:
        linePos -= (calculatedPercentage / 2);
        break;
      case 'end':
        linePos -= calculatedPercentage;
        break;
      default:
        break;
    }

    // Apply initial line position to the cue box.
    switch (cue.vertical) {
      case '':
        styleBox.applyStyles({
          top: styleBox.formatStyle(linePos, '%'),
        });
        break;
      case 'rl':
        styleBox.applyStyles({
          left: styleBox.formatStyle(linePos, '%'),
        });
        break;
      case 'lr':
        styleBox.applyStyles({
          paddingRight: styleBox.formatStyle(linePos, '%'),
        });
        break;
      default:
        break;
    }

    axis = ['+y', '-x', '+x', '-y'];

    // Get the box position again after we've applied the specified positioning
    // to it.
    boxPosition = new BoxPosition(styleBox);
  }

  const bestPosition = findBestPosition(boxPosition, axis);
  styleBox.move(bestPosition.toCSSCompatValues(containerBox) as unknown as ContainerBox);
}

function WebVTT() {
  // Nothing
}

// Helper to allow strings to be decoded instead of the default binary utf8 data.
WebVTT.StringDecoder = function () {
  return {
    decode(data: string) {
      if (!data) {
        return '';
      }
      if (typeof data !== 'string') {
        throw new Error('Error - expected string data.');
      }
      return decodeURIComponent(encodeURIComponent(data));
    },
  };
};

WebVTT.convertCueToDOMTree = function (window: Window, cuetext: string) {
  if (!window || !cuetext) {
    return null;
  }
  return parseContent(window, cuetext);
};

const CUE_BACKGROUND_PADDING = '1.5%';

// Determine if we need to compute the display states of the cues. This could
// be the case if a cue's state has been changed since the last computation or
// if it has not been computed yet.
function shouldCompute(cues: VTTCue[]) {
  for (const cue of cues) {
    // @ts-expect-error hasBeenReset and displayState not properties
    if (cue.hasBeenReset || !cue.displayState) {
      return true;
    }
  }
  return false;
}

// Runs the processing model over the cues and regions passed to it.
// @param overlay A block level element (usually a div) that the computed cues
//                and regions will be placed into.
// This ensures that cues are displayed within the overlay whenever its size changes
WebVTT.processCues = function (window: Window, cues: VTTCue[], overlay: HTMLElement, updateBoxPosition: boolean, styles = { window: {}, font: {} }) {
  if (!window || !cues || !overlay) {
    return null;
  }

  // Remove all previous children.
  while (overlay.firstChild) {
    overlay.removeChild(overlay.firstChild);
  }

  // Return early if there are no cues to process
  if (!cues.length) {
    return null;
  }

  // We ensure the order of cues being processed are from smallest line value
  // to greatest to ensure elements are appended to the parent container in the
  // correct order
  cues = cues.sort((a, b) => computeLinePos(a) - computeLinePos(b));

  const paddedOverlay = window.document.createElement('div');
  // For styling captions with CSS
  paddedOverlay.className = 'tubi-text-track-container tubi-reset';
  paddedOverlay.style.position = 'absolute';
  paddedOverlay.style.left = '0';
  paddedOverlay.style.right = '0';
  paddedOverlay.style.top = '0';
  paddedOverlay.style.bottom = '0';
  paddedOverlay.style.margin = CUE_BACKGROUND_PADDING;
  overlay.appendChild(paddedOverlay);

  // We don't need to recompute the cues' display states. Just reuse them.
  if (!shouldCompute(cues) && !updateBoxPosition) {
    for (const cue of cues) {
      // @ts-expect-error displayState not a property
      paddedOverlay.appendChild(cue.displayState);
    }
    return;
  }

  const boxPositions = [];
  const containerBox = BoxPosition.getSimpleBoxPosition(paddedOverlay);
  let currentNumOfLines = cues.reduce((totalLines, cue) => {
    return totalLines + cue.text.split('\n').length;
  }, 0);

  (() => {
    for (const cue of cues) {
      // Compute the initial position and styles of the cue div.
      const styleBox = new CueStyleBox(window, cue);
      // For styling captions with CSS
      styleBox.div.className = 'tubi-text-track-display tubi-reset';
      paddedOverlay.appendChild(styleBox.div);

      if (styleBox.div.offsetWidth > containerBox.width!) {
        styleBox.cueDiv.style.whiteSpace = 'pre-wrap';
        styleBox.div.style.left = '0px';
      }

      styleBox.applyStyles(styles.window, styleBox.div);
      styleBox.applyStyles(styles.font, styleBox.cueDiv);

      // Move the cue div to it's correct line position.
      moveBoxToLinePosition(window, styleBox, containerBox, boxPositions, currentNumOfLines);
      currentNumOfLines -= cue.text.split('\n').length;

      // Remember the computed div so that we don't have to recompute it later
      // if we don't have too.
      // @ts-expect-error displayState not a property
      cue.displayState = styleBox.div;

      boxPositions.push(BoxPosition.getSimpleBoxPosition(styleBox));
    }
  })();
};

export default WebVTT;
