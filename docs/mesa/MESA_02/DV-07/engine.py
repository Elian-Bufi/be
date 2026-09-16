# -*- coding: utf-8 -*-
"""Motor SVG determinista para vistas de casos de uso — DV-04 v0.3
Layouts: 'seq' (circuito horizontal + satélites), 'grid' (agrupación temática).
Posiciones calculadas => cadena recta, cero cruces evitables."""
import math,html
C=dict(ink="#0F1C2E",blue="#1F5FBF",blueSoft="#EAF1FB",blueLine="#9FBFEA",green="#1FA97A",
       grey="#6B7A90",line="#C9D3E0",bg="#FFFFFF",amber="#C98F2C",amberSoft="#FBF1DC")
F='Inter,Segoe UI,Helvetica,Arial,sans-serif'
def T(x,y,s,sz=12.5,fill=None,w=600,a="middle"):
    return f'<text x="{x:.0f}" y="{y:.0f}" font-family="{F}" font-size="{sz}" font-weight="{w}" fill="{fill or C["ink"]}" text-anchor="{a}">{html.escape(s)}</text>'
def node(x,y,uid,lab,kind):
    if kind=="main": rx,ry,fill,st,sw,dash=76,42,"#FFFFFF",C["blue"],1.9,None
    elif kind=="ext": rx,ry,fill,st,sw,dash=70,38,C["amberSoft"],C["amber"],1.5,"6 3"
    else: rx,ry,fill,st,sw,dash=68,37,C["blueSoft"],C["blueLine"],1.3,"4 3"
    d=f' stroke-dasharray="{dash}"' if dash else ''
    o=[f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{st}" stroke-width="{sw}"{d}/>']
    ic={"main":C["blue"],"ext":C["amber"]}.get(kind,C["grey"])
    o.append(T(x,y-ry+17,uid,11.5,ic,700))
    ls=lab.split("|")
    y0=y-ry+34 if len(ls)>1 else y+4
    for i,l in enumerate(ls): o.append(T(x,y0+i*14,l,12 if kind=="main" else 11.5,C["ink"] if kind=="main" else C["grey"],500))
    return "".join(o),(x,y,rx,ry)
def actor(x,y,name):
    g=C["green"]
    return (f'<circle cx="{x:.0f}" cy="{y-26:.0f}" r="8.5" fill="{g}"/>'
            f'<path d="M{x:.0f} {y-17:.0f}V{y+4:.0f} M{x-13:.0f} {y-10:.0f}H{x+13:.0f} '
            f'M{x:.0f} {y+4:.0f}L{x-11:.0f} {y+20:.0f} M{x:.0f} {y+4:.0f}L{x+11:.0f} {y+20:.0f}" '
            f'stroke="{g}" stroke-width="2" fill="none" stroke-linecap="round"/>'+T(x,y+36,name,12,C["ink"],700))
def e_seq(a,b):
    x1,y1,r1,_=a; x2,y2,r2,_=b
    return f'<path d="M{x1+r1+4:.0f} {y1:.0f}L{x2-r2-10:.0f} {y2:.0f}" stroke="{C["green"]}" stroke-width="2.6" fill="none" marker-end="url(#ag)"/>'
def e_inc(a,b):
    x1,y1,r1,q1=a; x2,y2,r2,q2=b
    dx,dy=x2-x1,y2-y1; L=math.hypot(dx,dy) or 1
    sx,sy=x1+dx/L*r1*.9,y1+dy/L*q1*.9; ex,ey=x2-dx/L*(r2+9),y2-dy/L*(q2+9)
    return f'<path d="M{sx:.0f} {sy:.0f}L{ex:.0f} {ey:.0f}" stroke="{C["blue"]}" stroke-width="1.4" stroke-dasharray="5 4" fill="none" marker-end="url(#ab)" opacity=".85"/>'
def e_ext(a,b):
    x1,y1,r1,q1=a; x2,y2,r2,q2=b
    dx,dy=x2-x1,y2-y1; L=math.hypot(dx,dy) or 1
    sx,sy=x1+dx/L*r1*.9,y1+dy/L*q1*.9; ex,ey=x2-dx/L*(r2+9),y2-dy/L*(q2+9)
    mx,my=(sx+ex)/2,(sy+ey)/2
    return (f'<path d="M{sx:.0f} {sy:.0f}L{ex:.0f} {ey:.0f}" stroke="{C["amber"]}" stroke-width="1.5" stroke-dasharray="7 4" fill="none" marker-end="url(#aa)"/>'
            + f'<rect x="{mx-30:.0f}" y="{my-9:.0f}" width="60" height="16" rx="4" fill="#FFFFFF" opacity=".92"/>' + T(mx,my+3,"«extend»",10.5,C["amber"],600))
def e_act(ax,ay,b,lane):  # lane debe estar libre
    x,y,rx,ry=b
    return (f'<path d="M{ax+15:.0f} {ay+10:.0f}C{ax+34:.0f} {lane:.0f} {ax+54:.0f} {lane:.0f} {min(ax+92,x-52):.0f} {lane:.0f}'
            f'L{x-24:.0f} {lane:.0f}Q{x:.0f} {lane:.0f} {x:.0f} {y+ry+3:.0f}" stroke="{C["green"]}" stroke-width="1.3" fill="none" opacity=".55" stroke-linecap="round"/>')
def legend(x,y,w,items,notes):
    o=[f'<rect x="{x}" y="{y}" width="{w}" height="{22+len(items)*21}" rx="10" fill="#FBFCFE" stroke="{C["line"]}"/>']
    for i,(k,t) in enumerate(items):
        yy=y+22+i*21
        if k=="seq": o.append(f'<line x1="{x+20}" y1="{yy-4}" x2="{x+56}" y2="{yy-4}" stroke="{C["green"]}" stroke-width="2.6"/>')
        elif k=="inc": o.append(f'<line x1="{x+20}" y1="{yy-4}" x2="{x+56}" y2="{yy-4}" stroke="{C["blue"]}" stroke-width="1.4" stroke-dasharray="5 4"/>')
        elif k=="ext": o.append(f'<line x1="{x+20}" y1="{yy-4}" x2="{x+56}" y2="{yy-4}" stroke="{C["amber"]}" stroke-width="1.5" stroke-dasharray="7 4"/>')
        elif k=="main": o.append(f'<ellipse cx="{x+38}" cy="{yy-4}" rx="18" ry="10" fill="#FFFFFF" stroke="{C["blue"]}" stroke-width="1.7"/>')
        elif k=="rect": o.append(f'<rect x="{x+20}" y="{yy-13}" width="36" height="18" rx="4" fill="#FFFFFF" stroke="{C["blue"]}" stroke-width="1.7"/>')
        elif k=="rectv": o.append(f'<rect x="{x+20}" y="{yy-13}" width="36" height="18" rx="4" fill="{C["blueSoft"]}" stroke="{C["blueLine"]}" stroke-width="1.3"/>')
        elif k=="rectx": o.append(f'<rect x="{x+20}" y="{yy-13}" width="36" height="18" rx="4" fill="{C["amberSoft"]}" stroke="{C["amber"]}" stroke-width="1.3" stroke-dasharray="5 3"/>')
        elif k=="rel": o.append(f'<line x1="{x+20}" y1="{yy-4}" x2="{x+56}" y2="{yy-4}" stroke="{C["blue"]}" stroke-width="1.5"/>'+T(x+20,yy-9,"1",9,C["grey"],700,"start")+T(x+56,yy-9,"0..N",9,C["grey"],700,"end"))
        elif k=="incn": o.append(f'<ellipse cx="{x+38}" cy="{yy-4}" rx="18" ry="10" fill="{C["blueSoft"]}" stroke="{C["blueLine"]}" stroke-width="1.3" stroke-dasharray="4 3"/>')
        elif k=="extn": o.append(f'<ellipse cx="{x+38}" cy="{yy-4}" rx="18" ry="10" fill="{C["amberSoft"]}" stroke="{C["amber"]}" stroke-width="1.4" stroke-dasharray="6 3"/>')
        o.append(T(x+68,yy,t,11.5,C["ink"],600,"start"))
    for i,n in enumerate(notes): o.append(T(x+w+34,y+22+i*19,n,11.5,C["grey"],500,"start"))
    return "".join(o)
def svg(W,H,title,sub,body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
      f'<defs><marker id="ag" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="{C["green"]}"/></marker>'
      f'<marker id="ab" markerWidth="8" markerHeight="8" refX="7" refY="2.6" orient="auto"><path d="M0,0 L0,5.2 L7,2.6 z" fill="{C["blue"]}"/></marker>'
      f'<marker id="aa" markerWidth="8" markerHeight="8" refX="7" refY="2.6" orient="auto"><path d="M0,0 L0,5.2 L7,2.6 z" fill="{C["amber"]}"/></marker></defs>'
      f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>'
      + T(W/2,44,title,19,C["ink"],700) + T(W/2,66,sub,12.5,C["grey"],500)
      + f'<line x1="40" y1="86" x2="{W-40}" y2="86" stroke="{C["line"]}"/>' + body + '</svg>')

# ── extensión DER/clases: cajas rectangulares ──
def box(x,y,w,h,title,tid,rows,kind="ent",note=None):
    fill={"ent":"#FFFFFF","ver":"#EAF1FB","ext":C["amberSoft"]}[kind]
    st={"ent":C["blue"],"ver":C["blueLine"],"ext":C["amber"]}[kind]
    dash=' stroke-dasharray="5 3"' if kind=="ext" else ''
    o=[f'<rect x="{x-w/2:.0f}" y="{y-h/2:.0f}" width="{w}" height="{h}" rx="8" fill="{fill}" stroke="{st}" stroke-width="{1.8 if kind=="ent" else 1.3}"{dash}/>',
       f'<rect x="{x-w/2:.0f}" y="{y-h/2:.0f}" width="{w}" height="26" rx="8" fill="{st}" opacity="{0.10 if kind!="ent" else 0.13}"/>',
       f'<line x1="{x-w/2:.0f}" y1="{y-h/2+26:.0f}" x2="{x+w/2:.0f}" y2="{y-h/2+26:.0f}" stroke="{st}" stroke-width="1" opacity=".5"/>',
       T(x,y-h/2+17,title,12,C["ink"],700)]
    if tid: o.append(T(x+w/2-9,y+h/2-9,tid,9.5,C["grey"],600,"end"))
    for i,r in enumerate(rows):
        o.append(T(x-w/2+11,y-h/2+42+i*15,r,10.5,C["grey"],500,"start"))
    if note: o.append(T(x,y+h/2+14,note,10,C["grey"],500))
    return "".join(o),(x,y,w/2,h/2)
def rel(a,b,card_a="",card_b="",label="",style="solid"):
    x1,y1,w1,h1=a; x2,y2,w2,h2=b
    import math
    dx,dy=x2-x1,y2-y1
    if abs(dx)>abs(dy):
        sx=x1+(w1 if dx>0 else -w1); sy=y1; ex=x2-(w2 if dx>0 else -w2); ey=y2
    else:
        sx=x1; sy=y1+(h1 if dy>0 else -h1); ex=x2; ey=y2-(h2 if dy>0 else -h2)
    d=' stroke-dasharray="6 4"' if style=="dash" else ''
    o=[f'<path d="M{sx:.0f} {sy:.0f}L{ex:.0f} {ey:.0f}" stroke="{C["blue"]}" stroke-width="1.5" fill="none"{d} opacity=".8"/>']
    if card_a: o.append(T(sx+(14 if ex>sx else -14),sy-7,card_a,10,C["grey"],700))
    if card_b: o.append(T(ex+(-16 if ex>sx else 16),ey-7,card_b,10,C["grey"],700))
    if label:
        mx,my=(sx+ex)/2,(sy+ey)/2
        o.append(f'<rect x="{mx-len(label)*3.1:.0f}" y="{my-8:.0f}" width="{len(label)*6.2:.0f}" height="15" rx="3" fill="#FFFFFF" opacity=".94"/>')
        o.append(T(mx,my+3,label,10,C["grey"],600))
    return "".join(o)
def badge(x,y,txt,color=None):
    w=len(txt)*6.6+16
    c=color or C["amber"]
    return (f'<rect x="{x:.0f}" y="{y-11:.0f}" width="{w:.0f}" height="21" rx="5" fill="{C["amberSoft"] if c==C["amber"] else C["blueSoft"]}" stroke="{c}" stroke-width="1"/>'
            + T(x+w/2,y+3,txt,10.5,c,700))

def selfrel(a,card,label):
    x,y,w,h=a
    return (f'<path d="M{x-w:.0f} {y-h*0.5:.0f}C{x-w-52:.0f} {y-h*0.5:.0f} {x-w-52:.0f} {y+h*0.5:.0f} {x-w:.0f} {y+h*0.5:.0f}" '
            f'stroke="{C["blue"]}" stroke-width="1.5" fill="none" opacity=".8" marker-end="url(#ab)"/>'
            + T(x-w-58,y-6,card,10,C["grey"],700,"end") + T(x-w-58,y+9,label,10,C["grey"],600,"end"))

# ── diagramas de estado ──
def state(x,y,label,kind="normal",w=None):
    w=w or max(112,len(label)*8.4+26); h=44
    fill={"normal":"#FFFFFF","initial":C["green"],"final":"#FFFFFF"}[kind]
    st={"normal":C["blue"],"initial":C["green"],"final":C["ink"]}[kind]
    o=[f'<rect x="{x-w/2:.0f}" y="{y-h/2:.0f}" width="{w:.0f}" height="{h}" rx="12" fill="{fill}" stroke="{st}" stroke-width="{2.2 if kind=="final" else 1.9}"/>']
    if kind=="final": o.append(f'<rect x="{x-w/2+4:.0f}" y="{y-h/2+4:.0f}" width="{w-8:.0f}" height="{h-8}" rx="9" fill="none" stroke="{st}" stroke-width="1"/>')
    o.append(T(x,y+5,label,12,C["ink"],700))
    return "".join(o),(x,y,w/2,h/2)
def initial_dot(x,y):
    return f'<circle cx="{x:.0f}" cy="{y:.0f}" r="8" fill="{C["green"]}"/>'
def trans(a,b,name,guard="",ev="",curve=0):
    x1,y1,w1,h1=a; x2,y2,w2,h2=b
    if abs(x2-x1)>abs(y2-y1): sx,sy,ex,ey=x1+(w1 if x2>x1 else -w1),y1,x2-(w2+9 if x2>x1 else -(w2+9)),y2
    else: sx,sy,ex,ey=x1,y1+(h1 if y2>y1 else -h1),x2,y2-(h2+9 if y2>y1 else -(h2+9))
    mx,my=(sx+ex)/2,(sy+ey)/2+curve
    d=(f'M{sx:.0f} {sy:.0f}Q{mx:.0f} {my:.0f} {ex:.0f} {ey:.0f}' if curve else f'M{sx:.0f} {sy:.0f}L{ex:.0f} {ey:.0f}')
    o=[f'<path d="{d}" stroke="{C["blue"]}" stroke-width="1.7" fill="none" marker-end="url(#ab)"/>']
    ly=my+(curve*0.5 if curve else 0)
    lines=[name]+([f'[{guard}]'] if guard else [])+([f'/ {ev}'] if ev else [])
    bw=max(len(l) for l in lines)*5.6+14
    o.append(f'<rect x="{mx-bw/2:.0f}" y="{ly-9-(len(lines)-1)*7:.0f}" width="{bw:.0f}" height="{15+(len(lines)-1)*13}" rx="4" fill="#FFFFFF" opacity=".95"/>')
    for i,l in enumerate(lines):
        col=C["blue"] if i==0 else (C["grey"] if l.startswith('[') else C["green"])
        o.append(T(mx,ly+3-(len(lines)-1)*7+i*13,l,10 if i==0 else 9.5,col,700 if i==0 else 500))
    return "".join(o)
def selftrans(a,name,guard="",side="top"):
    x,y,w,h=a
    if side=="top":
        d=f'M{x-26:.0f} {y-h:.0f}C{x-40:.0f} {y-h-44:.0f} {x+40:.0f} {y-h-44:.0f} {x+26:.0f} {y-h-3:.0f}'
        ly=y-h-40
    else:
        d=f'M{x-26:.0f} {y+h:.0f}C{x-40:.0f} {y+h+44:.0f} {x+40:.0f} {y+h+44:.0f} {x+26:.0f} {y+h+3:.0f}'
        ly=y+h+52
    o=[f'<path d="{d}" stroke="{C["blue"]}" stroke-width="1.7" fill="none" marker-end="url(#ab)"/>',
       T(x,ly,name,10,C["blue"],700)]
    if guard: o.append(T(x,ly+13,f'[{guard}]',9.5,C["grey"],500))
    return "".join(o)

def cls(x,y,w,name,tid,attrs,ops,inv=None,kind="ent"):
    fill={"ent":"#FFFFFF","ver":C["blueSoft"],"ext":C["amberSoft"],"enum":"#F7F9FC"}[kind]
    st={"ent":C["blue"],"ver":C["blueLine"],"ext":C["amber"],"enum":C["grey"]}[kind]
    dash=' stroke-dasharray="5 3"' if kind=="ext" else ''
    ha,ho=len(attrs)*15,len(ops)*15
    h=30+(ha+8 if attrs else 0)+(ho+8 if ops else 0)+(20 if inv else 0)
    o=[f'<rect x="{x-w/2:.0f}" y="{y-h/2:.0f}" width="{w}" height="{h}" rx="7" fill="{fill}" stroke="{st}" stroke-width="{1.8 if kind=="ent" else 1.3}"{dash}/>',
       f'<rect x="{x-w/2:.0f}" y="{y-h/2:.0f}" width="{w}" height="28" rx="7" fill="{st}" opacity="0.12"/>']
    if kind=="enum": o.append(T(x,y-h/2+12,"«enumeration»",9,C["grey"],600))
    o.append(T(x,y-h/2+(24 if kind=="enum" else 18),name,11.5 if kind=="enum" else 12,C["ink"],700))
    yy=y-h/2+28
    if attrs:
        o.append(f'<line x1="{x-w/2:.0f}" y1="{yy:.0f}" x2="{x+w/2:.0f}" y2="{yy:.0f}" stroke="{st}" stroke-width="1" opacity=".45"/>')
        for i,a in enumerate(attrs): o.append(T(x-w/2+10,yy+16+i*15,a,10.5,C["grey"],500,"start"))
        yy+=ha+8
    if ops:
        o.append(f'<line x1="{x-w/2:.0f}" y1="{yy:.0f}" x2="{x+w/2:.0f}" y2="{yy:.0f}" stroke="{st}" stroke-width="1" opacity=".45"/>')
        for i,op in enumerate(ops): o.append(T(x-w/2+10,yy+16+i*15,op,10.5,C["blue"],600,"start"))
        yy+=ho+8
    if inv:
        o.append(f'<rect x="{x-w/2+6:.0f}" y="{yy+1:.0f}" width="{w-12}" height="17" rx="3" fill="{C["blueSoft"]}"/>')
        o.append(T(x,yy+13,inv,9.5,C["blue"],600))
    if tid: o.append(T(x+w/2-9,y+h/2-8,tid,9.5,C["grey"],600,"end"))
    return "".join(o),(x,y,w/2,h/2)
def assoc(a,b,ma="",mb="",lab="",kind="assoc"):
    x1,y1,w1,h1=a; x2,y2,w2,h2=b
    if abs(x2-x1)>abs(y2-y1): sx,sy,ex,ey=x1+(w1 if x2>x1 else -w1),y1,x2-(w2 if x2>x1 else -w2),y2
    else: sx,sy,ex,ey=x1,y1+(h1 if y2>y1 else -h1),x2,y2-(h2 if y2>y1 else -h2)
    o=[]
    if kind=="comp":
        d=6; mx,my=sx+(d if ex>sx else -d),sy
        o.append(f'<path d="M{sx:.0f} {sy:.0f}l{d if ex>sx else -d} -{d} l{d if ex>sx else -d} {d} l-{d if ex>sx else -d} {d} z" fill="{C["blue"]}"/>')
    st=' stroke-dasharray="6 4"' if kind=="dep" else ''
    o.append(f'<path d="M{sx:.0f} {sy:.0f}L{ex:.0f} {ey:.0f}" stroke="{C["blue"]}" stroke-width="1.5" fill="none"{st} opacity=".8"/>')
    if ma: o.append(T(sx+(16 if ex>sx else -16),sy-7,ma,10,C["grey"],700))
    if mb: o.append(T(ex+(-18 if ex>sx else 18),ey-7,mb,10,C["grey"],700))
    if lab:
        mx,my=(sx+ex)/2,(sy+ey)/2
        o.append(f'<rect x="{mx-len(lab)*3.1:.0f}" y="{my-8:.0f}" width="{len(lab)*6.2:.0f}" height="15" rx="3" fill="#FFFFFF" opacity=".94"/>'+T(mx,my+3,lab,10,C["grey"],600))
    return "".join(o)

# ── diagramas de secuencia ──
def lifeline(x,y0,y1,name,kind="obj"):
    w=max(150,len(name)*8.2+24)
    fill={"actor":"#FFFFFF","obj":"#FFFFFF","ext":C["amberSoft"]}[kind]
    st={"actor":C["green"],"obj":C["blue"],"ext":C["amber"]}[kind]
    o=[f'<rect x="{x-w/2:.0f}" y="{y0-22:.0f}" width="{w:.0f}" height="44" rx="7" fill="{fill}" stroke="{st}" stroke-width="1.8"/>',
       T(x,y0+5,name,11.5,C["ink"],700),
       f'<line x1="{x:.0f}" y1="{y0+22:.0f}" x2="{x:.0f}" y2="{y1:.0f}" stroke="{C["line"]}" stroke-width="1.4" stroke-dasharray="6 5"/>']
    return "".join(o),x
def msg(x1,x2,y,txt,kind="call"):
    col={"call":C["blue"],"ret":C["grey"],"deny":C["red"] if "red" in C else "#B94A48"}[kind]
    d=' stroke-dasharray="6 4"' if kind!="call" else ''
    o=[f'<path d="M{x1:.0f} {y:.0f}L{x2-(9 if x2>x1 else -9):.0f} {y:.0f}" stroke="{col}" stroke-width="1.6" fill="none"{d} marker-end="url(#ab)"/>' if kind=="call"
       else f'<path d="M{x1:.0f} {y:.0f}L{x2-(9 if x2>x1 else -9):.0f} {y:.0f}" stroke="{col}" stroke-width="1.5" fill="none" stroke-dasharray="6 4" marker-end="url(#ab)"/>']
    o.append(T((x1+x2)/2,y-9,txt,10.5,col,600))
    return "".join(o)
def activ(x,y0,y1):
    return f'<rect x="{x-7:.0f}" y="{y0:.0f}" width="14" height="{y1-y0:.0f}" rx="3" fill="#FFFFFF" stroke="{C["blue"]}" stroke-width="1.4"/>'
def frag(x0,y0,x1,y1,label,note=""):
    o=[f'<rect x="{x0:.0f}" y="{y0:.0f}" width="{x1-x0:.0f}" height="{y1-y0:.0f}" rx="6" fill="none" stroke="{C["grey"]}" stroke-width="1.2" stroke-dasharray="5 4"/>',
       f'<path d="M{x0:.0f} {y0:.0f}h72l14 20H{x0:.0f}z" fill="#FFFFFF" stroke="{C["grey"]}" stroke-width="1.2"/>',
       T(x0+36,y0+14,label,10,C["grey"],700)]
    if note: o.append(T(x0+100,y0+14,note,10,C["grey"],500,"start"))
    return "".join(o)
