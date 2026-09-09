import json, re, html as htmlmod
from pathlib import Path
import language_tool_python

ROOT=Path('public')
article_catalog=json.loads((ROOT/'content/articles.json').read_text(encoding='utf-8'))['articles']

def visible_text(raw):
    a=raw.find('<!-- TL-CMS:ARTICLE_BODY_START -->')
    b=raw.find('<!-- TL-CMS:ARTICLE_BODY_END -->')
    if a>=0 and b>a: raw=raw[a:b]
    raw=re.sub(r'<script\b[\s\S]*?</script>', ' ', raw, flags=re.I)
    raw=re.sub(r'<style\b[\s\S]*?</style>', ' ', raw, flags=re.I)
    raw=re.sub(r'<svg\b[\s\S]*?</svg>', ' ', raw, flags=re.I)
    raw=re.sub(r'<code\b[\s\S]*?</code>', ' ', raw, flags=re.I)
    raw=re.sub(r'<[^>]+>', ' ', raw)
    raw=htmlmod.unescape(raw)
    raw=re.sub(r'\s+', ' ', raw).strip()
    return raw

skip_categories={'TYPOGRAPHY','PUNCTUATION','CASING','STYLE','REDUNDANCY','TYPOS'}
skip_rule_fragments=('WHITESPACE','DASH','QUOTE','COMMA','HYPHEN','EN_UNPAIRED_BRACKETS','UPPERCASE_SENTENCE_START','WORD_REPEAT_RULE')

def attr(obj,*names,default=None):
    for name in names:
        try: value=getattr(obj,name)
        except AttributeError: continue
        if value is not None: return value
    return default

tool=language_tool_python.LanguageTool('ru-RU')
rows=[]
for art in article_catalog:
    p=ROOT/art['path']
    if not p.exists(): continue
    text=visible_text(p.read_text(encoding='utf-8'))
    for m in tool.check(text):
        rule=str(attr(m,'rule_id','ruleId',default='') or '')
        cat=str(attr(m,'category',default='') or '')
        if cat in skip_categories or any(x in rule.upper() for x in skip_rule_fragments): continue
        offset=int(attr(m,'offset',default=0) or 0)
        err_len=int(attr(m,'error_length','errorLength',default=0) or 0)
        token=text[offset:offset+err_len].strip()
        ctx=text[max(0,offset-120):min(len(text),offset+err_len+170)]
        reps=list(attr(m,'replacements',default=[]) or [])[:8]
        message=str(attr(m,'message',default='') or '')
        rows.append({'url':art['url'],'rule':rule,'category':cat,'message':message,'token':token,'replacements':reps,'context':ctx})

tool.close()
print(f'Catalog articles checked: {len(article_catalog)}')
print(f'Grammar/logic candidates: {len(rows)}')
for r in rows: print('LT',json.dumps(r,ensure_ascii=False))
