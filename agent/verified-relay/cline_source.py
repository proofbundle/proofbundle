"""Byte offsets into Cline's mutable native JSON; never reserialize evidence."""
import json

def message_spans(raw):
    text=raw.decode('utf-8');decoder=json.JSONDecoder();pos=0
    def space(i):
        while i<len(text) and text[i].isspace():i+=1
        return i
    pos=space(pos)
    if text[pos]!='{':raise ValueError('native source must be object')
    pos+=1
    while True:
        pos=space(pos)
        if text[pos]=='}':return
        name,pos=decoder.raw_decode(text,pos);pos=space(pos)
        if text[pos]!=':':raise ValueError('missing member separator')
        pos=space(pos+1)
        if name=='messages':
            if text[pos]!='[':raise ValueError('messages must be array')
            pos=space(pos+1)
            while text[pos]!=']':
                start=pos;row,end=decoder.raw_decode(text,pos)
                byte_start=len(text[:start].encode('utf-8'));byte_end=len(text[:end].encode('utf-8'))
                yield byte_start,raw[byte_start:byte_end],row
                pos=space(end)
                if text[pos]==',':pos=space(pos+1)
                elif text[pos]!=']':raise ValueError('invalid message array')
            return
        _,pos=decoder.raw_decode(text,pos);pos=space(pos)
        if text[pos]==',':pos+=1
        elif text[pos]!='}':raise ValueError('invalid object separator')
