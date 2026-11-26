#!/usr/bin/env python3
"""Parse one line range of the MAD1 Q2 bank -> JSON of PYQ records (+ counts).
Usage: python3 -I parse_mad1_q2.py bank.md START END out.json
START END are 1-based line numbers of ONE topic (see A5 line-range table)."""
import re, json, sys
HDR = re.compile(r'^\*\*(Parent |Child )?Question (\d+) \((\d+)\)\*\* \| Exam Date: (.+?) \| Total Mark: ([\d.]+) \| Type: (\w+)')
# curated near-duplicates from the audit: later id -> earlier id (each keeps its own solution)
REPEAT_OF = {"6406531021272":"640653856976","6406531021273":"640653856977","6406531021275":"640653771131",
             "6406531021274":"640653771132","6406531325145":"640653771133","640653771128":"640653586805",
             "6406532035126":"6406531021272"}
def parse(path, a, b):
    L = open(path, encoding='utf-8').read().split('\n')[a-1:b]
    topic = sub = sect = None; blocks = []; cur = None
    def close():
        nonlocal cur
        if cur: blocks.append(cur); cur = None
    for l in L:
        if l.startswith('# Topic:'): close(); topic = l[8:].strip(); continue
        if l.startswith('## Subtopic:'): close(); sub = l[12:].strip(); continue
        if l.startswith('### Type:'): close(); sect = l[9:].strip(); continue
        m = HDR.match(l)
        if m:
            close()
            cur = dict(role=(m.group(1) or 'Q').strip(), qno=int(m.group(2)), id=m.group(3), date=m.group(4),
                       marks=float(m.group(5)), type=m.group(6), topic=topic, sub=sub, sect=sect, lines=[])
        elif cur is not None: cur['lines'].append(l)
    close()
    parents = {}; out = []; last_parent = None
    for k in blocks:
        text = '\n'.join(k['lines']).strip()
        if k['role'] == 'Parent':
            parents[k['id']] = text; last_parent = k['id']; continue
        if k['marks'] == 0 and k['topic'].startswith('Exam Instructions'): continue      # admin item: dropped
        head, _, opt = text.partition('OPTIONS:')
        am = re.search(r'Accepted Answer\s*:\s*(.+)', text)
        if k['type'] == 'SA': head = re.split(r'\n\s*Answer \(', text)[0]
        options = []
        if opt:
            for chunk in re.split(r'\n(?=\* [A-F]\.)', '\n' + opt.strip()):
                mm = re.match(r'\s*\* ([A-F])\.\s?(.*)', chunk, re.S)
                if mm: options.append({'label': mm.group(1), 'text': mm.group(2).strip()})
        fig = re.search(r'\[Image Description:\s*(.*?)\]', text, re.S)
        rec = dict(id=k['id'], uid='q2:' + k['id'], exam='q2', paper=k['date'], date=k['date'], qno=k['qno'],
                   marks=k['marks'], type=('COMP' if k['role'] == 'Child' else k['type']), childType=k['type'] if k['role']=='Child' else None,
                   topic=k['topic'], sub=k['sub'], stem=head.strip(), options=options,
                   key=am.group(1).strip() if am else None, figureNote=fig.group(1) if fig else None,
                   repeatOf=REPEAT_OF.get(k['id']), alsoIn=[], tag='[SRC]' if am else '[DERIVED]')
        if k['role'] == 'Child': rec['parent'] = {'id': last_parent, 'text': parents.get(last_parent)}
        out.append(rec)
    return out
if __name__ == '__main__':
    path, a, b, dst = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    recs = parse(path, a, b); json.dump(recs, open(dst, 'w'), indent=1, ensure_ascii=False)
    print(len(recs), 'PYQs', sum(r['marks'] for r in recs), 'marks',
          'children', sum(1 for r in recs if r['type']=='COMP'), 'keys from bank', sum(1 for r in recs if r['key']))
