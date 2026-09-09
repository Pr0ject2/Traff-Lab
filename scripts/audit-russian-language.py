import json, os, re, sys, html as htmlmod
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

# Domain-specific words that should not create noise.
ignore_words={w.lower() for w in '''TrafficLab AdsBridge SubID Click ID FTD CPA RevShare GGR NGR GEO postback постбэк оффер оффера офферы офферов лендинг лендинга лендинги трекер трекера трекеры креатив креатива креативы антидетект прокси iGaming Google TikTok Reddit YouTube Telegram Multilogin Proxys RUVDS YeezyPay Libermall Spy House USDT Visa Mastercard Cloudflare CTR CPC UTM URL API webhook вебхук webhooks publisher advertiser'''.split()}

# Only categories/rules useful for editorial cleanup. Skip typography/style nags.
skip_categories={'TYPOGRAPHY','PUNCTUATION','CASING','STYLE','REDUNDANCY'}
skip_rule_fragments=('WHITESPACE','DASH','QUOTE','COMMA','HYPHEN','EN_UNPAIRED_BRACKETS','UPPERCASE_SENTENCE_START')

tool=language_tool_python.LanguageTool('ru-RU')
rows=[]
for art in article_catalog:
    p=ROOT/art['path']
    if not p.exists(): continue
    text=visible_text(p.read_text(encoding='utf-8'))
    # Cap pathological pages but normally bodies are below this.
    for m in tool.check(text):
        rule=getattr(m,'rule_id','') or ''
        cat=str(getattr(m,'category','') or '')
        if cat in skip_categories or any(x in rule.upper() for x in skip_rule_fragments): continue
        token=text[m.offset:m.offset+m.error_length].strip()
        if token.lower() in ignore_words: continue
        ctx=text[max(0,m.offset-90):min(len(text),m.offset+m.error_length+120)]
        reps=list(getattr(m,'replacements',[]) or [])[:6]
        rows.append({'url':art['url'],'rule':rule,'category':cat,'message':m.message,'token':token,'replacements':reps,'context':ctx})

tool.close()
print(f'Catalog articles checked: {len(article_catalog)}')
print(f'LanguageTool editorial candidates: {len(rows)}')
for r in rows[:250]: print('LT',json.dumps(r,ensure_ascii=False))
if len(rows)>250: print(f'LT omitted: {len(rows)-250}')
