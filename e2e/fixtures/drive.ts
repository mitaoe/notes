import { startsNameOrWord } from '../../api/_tests/name-match.ts';
import { FOLDER_MIME_TYPE, PDF_MIME_TYPE, isFolder } from '../../shared/drive.ts';

export type FixtureNode = {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  parentId: string | null;
  children: FixtureNode[];
};

type Spec = { name: string; mimeType: string; size: number | null; children: Spec[] };

const folder = (name: string, children: Spec[] = []): Spec => ({
  name,
  mimeType: FOLDER_MIME_TYPE,
  size: null,
  children,
});
const file = (name: string, mimeType: string, size: number): Spec => ({
  name,
  mimeType,
  size,
  children: [],
});

const pdf = (name: string, size: number) => file(name, PDF_MIME_TYPE, size);

const subjects = [
  '00_journals',
  '01_cde',
  '02_phy',
  '03_foc',
  '04_eee',
  '05_sic',
  '06_son',
  '07_eds',
  '08_am',
  '09_ds',
  '10_bee',
  '11_ecs',
];

export const BROKEN_PREVIEW_NAME = 'broken_preview.pdf';
export const LOAD_MORE_FAILS_NAME = 'load_more_fails';
const LOAD_MORE_FAILS_SIZE = 11;

const subjectContents: Record<string, Spec[]> = {
  '00_journals': [
    pdf('am_journal.pdf', 15770031),
    pdf('am_journal_reference.pdf', 1701326),
    pdf('eee_journal.pdf', 4890003),
    file('lab_photo.png', 'image/png', 204800),
    file('lecture_recording.mp4', 'video/mp4', 73400320),
    file('viva_audio.mp3', 'audio/mpeg', 5242880),
    file('question_bank.zip', 'application/zip', 1024),
    pdf('phy_journal_with_a_really_long_name_that_needs_truncating_on_small_screens.pdf', 3120533),
  ],
  '01_cde': [pdf(BROKEN_PREVIEW_NAME, 4096)],
};

const tree: Spec = folder('root', [
  folder(
    'fy',
    subjects.map((name) => folder(name, subjectContents[name] ?? [])),
  ),
  folder('sy', [
    folder("o'reilly & co #1", [pdf('chapter_1.pdf', 2048)]),
    folder(
      LOAD_MORE_FAILS_NAME,
      Array.from({ length: LOAD_MORE_FAILS_SIZE }, (_, index) => pdf(`unit_${index}.pdf`, 1024)),
    ),
  ]),
  folder('ty'),
  pdf('syllabus.pdf', 524288),
]);

const build = (spec: Spec, parentId: string | null, path: string): FixtureNode => {
  const id = parentId === null ? 'root' : `id-${path}`.replace(/[^a-zA-Z0-9-]/g, '_');
  const node: FixtureNode = {
    id,
    name: spec.name,
    mimeType: spec.mimeType,
    size: spec.size,
    parentId,
    children: [],
  };
  node.children = spec.children.map((child) => build(child, id, `${path}/${child.name}`));
  return node;
};

const root = build(tree, null, '');

const allNodes = (node: FixtureNode = root): FixtureNode[] =>
  node.children.flatMap((child) => [child, ...allNodes(child)]);

export const findById = (id: string): FixtureNode | null =>
  id === root.id ? root : (allNodes().find((node) => node.id === id) ?? null);

export const findByPath = (names: readonly string[]): FixtureNode | null => {
  let node: FixtureNode | null = root;
  for (const name of names) {
    node = node.children.find((child) => child.name === name && isFolder(child)) ?? null;
    if (!node) return null;
  }
  return node;
};

export const sortForListing = (nodes: FixtureNode[]) =>
  nodes.toSorted((a, b) => {
    const aFolder = isFolder(a) ? 0 : 1;
    const bFolder = isFolder(b) ? 0 : 1;
    return aFolder - bFolder || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  });

export const searchNodes = (query: string) => {
  const terms = query.split(/\s+/).filter(Boolean);
  return sortForListing(
    allNodes().filter((node) => terms.every((term) => startsNameOrWord(node.name, term))),
  );
};

export const paginate = <T>(items: T[], pageToken: string | null, pageSize: number) => {
  const start = pageToken ? Number(pageToken) : 0;
  const end = start + pageSize;
  return { items: items.slice(start, end), nextPageToken: end < items.length ? String(end) : null };
};
