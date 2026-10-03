#!/usr/bin/env python3
"""Generates assets/prague-hero.svg — abstract Prague skyline for the BoC27 cover.
Same flat-colour language as the Porto cover (cream sky, gold sun, terracotta/ochre blocks,
dark-green bridge, teal river), re-composed around the Castle, Charles Bridge and the Vltava."""
import random, sys
random.seed(7)
PINE='#05290D'; GOLD='#F2AF4B'; CREAM='#F7E9C9'; LINEN='#F3F2F0'
o=[]
def a(s): o.append(s)
def rect(x,y,w,h,f,extra=''): a(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{f}" {extra}/>')
def poly(pts,f,extra=''): a(f'<path d="M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)+f' Z" fill="{f}" {extra}/>')
def windows(x,y,w,h,cols,rows,ww=6,wh=9,f=LINEN,op=.55):
    if cols<1 or rows<1: return
    gx=(w-cols*ww)/(cols+1); gy=(h-rows*wh)/(rows+1)
    for r in range(rows):
        for c in range(cols):
            if random.random()<.12: continue
            rect(x+gx+c*(ww+gx), y+gy+r*(wh+gy), ww, wh, f, f'opacity="{op}"')
def bldg(x,y,w,h,body,roof=None,roofh=0,cols=None,rows=None,kind='gable'):
    rect(x,y,w,h,body)
    if roof and roofh:
        if kind=='gable': poly([(x-2,y),(x+w/2,y-roofh),(x+w+2,y)],roof)
        elif kind=='lean': poly([(x-2,y),(x+w*0.15,y-roofh),(x+w+2,y)],roof)
    cols=cols if cols is not None else max(1,int(w//16)); rows=rows if rows is not None else max(1,int((h-12)//22))
    windows(x,y,w,h,cols,rows)

a('<svg viewBox="0 0 1000 581" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">')
a('''<defs>
 <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3E0C2"/><stop offset=".55" stop-color="#F7E9C9"/><stop offset="1" stop-color="#F1E3CB"/></linearGradient>
 <linearGradient id="river" gradientUnits="userSpaceOnUse" x1="0" y1="430" x2="0" y2="581"><stop offset="0" stop-color="#8DB0A6"/><stop offset=".35" stop-color="#7FA39A"/><stop offset="1" stop-color="#3F6259"/></linearGradient>
 <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFC59A"/><stop offset="1" stop-color="#B7B88F"/></linearGradient>
</defs>''')
rect(0,0,1000,581,'url(#sky)')
# sun
a(f'<circle cx="858" cy="138" r="66" fill="{GOLD}" opacity=".95"/>')
a(f'<circle cx="858" cy="138" r="88" fill="none" stroke="{GOLD}" stroke-width="1.2" opacity=".55"/>')
a(f'<circle cx="858" cy="138" r="108" fill="none" stroke="{GOLD}" stroke-width=".8" opacity=".3"/>')
# birds
for bx,by,s in [(612,70,1),(668,98,.8),(728,62,.65),(130,118,.7)]:
    a(f'<path d="M{bx-14*s},{by} q{7*s},{-9*s} {14*s},0 q{7*s},{-9*s} {14*s},0" fill="none" stroke="#6F8F82" stroke-width="2.2" stroke-linecap="round"/>')

# far hill (Petrin / Castle hill)
a('<path d="M-10,372 C 60,330 150,305 250,300 C 360,296 470,318 560,350 C 600,364 620,372 640,380 L640,470 L-10,470 Z" fill="#B9B98F" opacity=".85"/>')
a('<path d="M300,380 C 400,350 520,340 700,372 L700,470 L300,470 Z" fill="#DCCFA6" opacity=".55"/>')

# --- Castle wall + palace block
rect(60,318,470,70,'#E6C27A')
rect(60,318,470,6,'#CDA55C')
windows(60,326,470,62,30,3,ww=6,wh=8,op=.5)
poly([(60,318),(530,318),(522,306),(68,306)],'#B5573F')            # long red roofline
rect(60,388,470,7,'#B9B58C')
# bastion wall / terraces down the hill
poly([(60,395),(530,395),(560,420),(30,420)],'#C8B07E')
for i in range(14): rect(46+i*36,404,18,3,'#A89A6B','opacity=".6"')

# terraced gardens under the wall
poly([(0,404),(60,396),(530,396),(600,430),(600,440),(0,440)],'#A9B38A')
for i,yy in enumerate((408,418,428)): a(f'<path d="M{20+i*10},{yy} L{560-i*8},{yy}" stroke="#8E9C72" stroke-width="2" opacity=".7"/>')
for i in range(26): a(f'<circle cx="{40+i*22}" cy="{414+(i%3)*8}" r="4.2" fill="#7E9468" opacity=".75"/>')
# --- St Vitus Cathedral: nave + twin west towers + great south tower
rect(262,262,140,56,'#EBD7A8')
poly([(256,262),(332,226),(408,262)],'#3E4B45')                     # nave roof
for x in (272,300,328,356,384): rect(x,274,5,32,PINE,'opacity=".28"')   # buttress lines
for x in (246,318):  # two slender west towers
    rect(x,196,26,122,'#EBD7A8')
    poly([(x-4,196),(x+13,120),(x+30,196)],PINE)
    rect(x+8,208,10,22,PINE,'opacity=".35"')
    rect(x+4,246,18,3,GOLD,'opacity=".8"'); 
# great south tower
rect(404,210,32,108,'#E2C98F')
rect(400,196,40,16,'#CDA55C')
poly([(398,196),(420,136),(442,196)],PINE)
a(f'<rect x="419" y="112" width="2" height="26" fill="{PINE}"/>')
rect(410,232,20,26,PINE,'opacity=".3"')
# roof pinnacles
for x in (252,330,408): a(f'<path d="M{x},228 l3,-14 l3,14z" fill="{PINE}"/>')

# --- terracotta houses stepping down the left hill
for x,y,w,h,c,r in [(10,350,38,46,'#B5573F','#3E2A22'),(560,352,34,44,'#D6B48A','#7A3B2A'),(596,360,30,36,'#E8B35E','#3E2A22')]:
    bldg(x,y,w,h,c,r,16)

# --- Mala Strana / Old Town fabric (behind the bridge)
x=582
specs=[(34,92,'#E8B35E','#7A3B2A'),(30,72,'#D6B48A','#3E2A22'),(38,110,'#A25A44','#3E2A22'),(30,84,'#EFE3C9','#7A3B2A'),(34,100,'#C8734F','#3E2A22'),(32,76,'#E8B35E','#7A3B2A'),(36,118,'#5E7B6B','#3E2A22')]
for w,h,c,r in specs:
    bldg(x,440-h,w,h,c,r,18,kind='gable'); x+=w+3
# St Nicholas dome (verdigris)
rect(470,330,64,110,'#EBD7A8'); windows(470,330,64,110,3,3,ww=7,wh=12)
a('<path d="M474,330 a28,28 0 0 1 56,0z" fill="#6E9A8B"/>')
rect(499,276,6,28,'#6E9A8B'); poly([(497,276),(502,252),(507,276)],'#6E9A8B')
a('<path d="M478,330 a24,26 0 0 1 48,0z" fill="#6E9A8B" transform="translate(0,-10) scale(1 1)"/>')
rect(536,356,26,84,'#EBD7A8'); poly([(534,356),(549,322),(564,356)],'#3E2A22')   # belltower
# Tyn church: two slender spires
for xx,hh in [(716,196),(758,212)]:
    rect(xx,440-hh,26,hh-8,'#E2C98F'); windows(xx,440-hh,26,hh-8,1,6,ww=6,wh=14)
    poly([(xx-3,440-hh),(xx+13,440-hh-74),(xx+29,440-hh)],PINE)
    for dx in (-2,22): poly([(xx+dx,440-hh+4),(xx+dx+4,440-hh-22),(xx+dx+8,440-hh+4)],PINE)
rect(716,300,68,16,'#E2C98F',f'opacity="0"')
# lower old-town roofs between spires
bldg(784,350,44,90,'#E8B35E','#B5573F',22)
bldg(826,372,36,68,'#D6B48A','#7A3B2A',18)

# --- Old Town Bridge Tower (right bridge head)
rect(868,300,76,140,'#E2C98F'); rect(868,300,76,8,'#CDA55C')
poly([(862,300),(906,214),(950,300)],'#3E2A22')
for dx in (872,926): poly([(dx,306),(dx+9,262),(dx+18,306)],'#3E2A22'); 
rect(892,318,28,42,PINE,'opacity=".35"'); rect(899,330,14,30,PINE,'opacity=".55"')
rect(868,400,76,6,GOLD,'opacity=".7"')
# Lesser Town bridge towers (left bridge head)
rect(62,372,34,68,'#D6B48A'); poly([(58,372),(79,332),(100,372)],'#B5573F')
rect(100,350,30,90,'#E2C98F'); poly([(96,350),(115,300),(134,350)],'#3E2A22')
windows(100,350,30,90,1,3,ww=6,wh=12)

# --- Charles Bridge (long, low, 16 arches)
BR_Y=432; BR_B=496
rect(20,BR_Y,960,BR_B-BR_Y,PINE)
rect(14,BR_Y-5,972,7,'#0B3A17')                                         # parapet cap
n=16; x0=40; span=(960-40)/n
for i in range(n):
    cx=x0+span*(i+.5); rx=span*.39; ry=40 - abs(i-7.5)*1.1
    a(f'<path d="M{cx-rx:.1f},{BR_B+1} L{cx-rx:.1f},{BR_B-ry*.35:.1f} A{rx:.1f},{ry:.1f} 0 0 1 {cx+rx:.1f},{BR_B-ry*.35:.1f} L{cx+rx:.1f},{BR_B+1} Z" fill="url(#river)"/>')
    # pier cutwater
    px=x0+span*i
    if i>0: poly([(px-4,BR_B),(px,BR_B-14),(px+4,BR_B)],PINE)
    # statue / lamp rhythm on the parapet
    if i%2==0 and 1<=i<=14:
        a(f'<rect x="{px+span*.5-1.5:.1f}" y="{BR_Y-26}" width="3" height="22" fill="{PINE}"/>')
        a(f'<circle cx="{px+span*.5:.1f}" cy="{BR_Y-29}" r="3.4" fill="{PINE}"/>')
    if i%2==1 and 1<=i<=14:
        a(f'<rect x="{px+span*.5-1:.1f}" y="{BR_Y-18}" width="2" height="14" fill="{PINE}"/>')
        a(f'<circle cx="{px+span*.5:.1f}" cy="{BR_Y-21}" r="3" fill="{GOLD}"/>')

# --- River, ripples, reflections
rect(0,BR_B,1000,581-BR_B,'url(#river)')
for cx,w,c in [(150,40,'#B5573F'),(330,60,'#E6C27A'),(520,50,'#6E9A8B'),(660,40,'#E8B35E'),(760,30,'#A25A44'),(905,50,'#E2C98F')]:
    for k in range(5):
        a(f'<rect x="{cx-w/2+random.uniform(-6,6):.1f}" y="{BR_B+12+k*13}" width="{w*(1-k*.12):.1f}" height="3" rx="1.5" fill="{c}" opacity="{.30-k*.045:.2f}"/>')
for k in range(16):
    y=BR_B+10+k*5.5; x=random.uniform(-20,880); w=random.uniform(60,190)
    a(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="1.6" rx=".8" fill="#DDEBE6" opacity="{random.uniform(.12,.26):.2f}"/>')
# sun glint
for k in range(6): a(f'<rect x="{842-k*3}" y="{BR_B+14+k*12}" width="{34+k*6}" height="2.4" rx="1.2" fill="{GOLD}" opacity="{.5-k*.07:.2f}"/>')
# small boat
a(f'<path d="M488,538 h64 l-9,10 h-46 z" fill="{PINE}"/><rect x="518" y="512" width="2.4" height="26" fill="{PINE}"/><path d="M521,514 l22,18 h-22z" fill="{GOLD}"/>')
a('</svg>')
open(sys.argv[1] if len(sys.argv)>1 else 'prague-hero.svg','w').write('\n'.join(o))
