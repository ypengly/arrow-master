#!/usr/bin/env python3
"""Generates enemy definitions and the 100 campaign levels as JSON.
Adding level 101 = drop another levelNNN.json into src/data/levels (no code changes)."""
import json, os
ROOT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')

def en(kind, name, hp, spd, dmg, df, rng, rew, beh, sc, col, acc, shield=False, fr=0, ps=0, accy='none'):
    return dict(kind=kind, name=name, health=hp, speed=spd, damage=dmg, defense=df, attackRange=rng, reward=rew,
                behavior=beh, scale=sc, color=col, accent=acc, shield=shield, fireRate=fr, projectileSpeed=ps, accessory=accy)

enemies = {
 'basic':   en('basic','Raider',60,58,8,0,60,10,'advance',1,0x8a5a3a,0xe0b08a,accy='hood'),
 'shield':  en('shield','Shield Bearer',85,48,9,0.05,60,16,'advance',1,0x5a6a8a,0xe0b08a,True,accy='helmet'),
 'fast':    en('fast','Runner',42,135,7,0,55,14,'dodge',0.95,0x3a8a5a,0xe0b08a,accy='hood'),
 'archer':  en('archer','Bandit Archer',50,42,10,0,640,18,'ranged',1,0x7a4a2a,0xe0b08a,fr=2300,ps=560,accy='hood'),
 'armored': en('armored','Armored Brute',130,42,12,0.45,60,24,'patrol',1.1,0x7a7f8c,0xe0b08a,accy='helmet'),
 'elite':   en('elite','Elite Warlord',240,62,18,0.25,60,50,'cover',1.15,0x8a2a3a,0xd9a37e,True,accy='horns'),
 'mage':    en('mage','Dark Mage',75,36,14,0,720,26,'ranged',1,0x5a3a8a,0xe0b08a,fr=2800,ps=420,accy='hat'),
}
def boss(kind, name, title, hp, sc, col, abil, rng, spd, dmg, shield=False, accy='horns'):
    d = en(kind, name, hp, spd, dmg, 0.1, rng, 300, 'ranged', sc, col, 0xc9a07a, shield, 0, 0, accy)
    d.update(title=title, abilities=abil, weakPoint=True)
    return d
bosses = {
 'stoneGiant':     boss('stoneGiant','Stone Giant','Colossus of the Glade',400,1.9,0x7b7b7b,['rain'],560,28,22),
 'darkKnight':     boss('darkKnight','Dark Knight','Blade of the Dunes',550,1.5,0x2a2a3a,['charge','spread'],560,40,24,True,'helmet'),
 'alphaBeast':     boss('alphaBeast','Alpha Beast','Alpha of the Frost',700,1.6,0x6a4a2a,['charge','spread'],540,46,26),
 'shadowArcher':   boss('shadowArcher','Shadow Archer','Death from Afar',750,1.4,0x2a1a4a,['spread','rain'],700,36,22,False,'hood'),
 'warChief':       boss('warChief','War Chief','Warlord of the Keep',950,1.7,0x8a3a1a,['summon','charge','spread'],580,40,28),
 'ancientGuardian':boss('ancientGuardian','Ancient Guardian','Dragon of the Ruins',1150,2.0,0x3a7a6a,['rain','spread','summon'],600,30,30,False,'horns'),
 'darkMage':       boss('darkMage','Dark Mage Supreme','Sorcerer of Embers',1250,1.5,0x4a2a8a,['spread','rain','summon'],720,32,26,False,'hat'),
 'demonKnight':    boss('demonKnight','Demon Knight','Hellforged Champion',1500,1.8,0x8a1a1a,['charge','spread','rain'],560,44,34,True),
 'kingOfShadows':  boss('kingOfShadows','King of Shadows','Ruler of the Vault',1800,1.9,0x1a1a2a,['summon','spread','charge','rain'],600,40,34,False,'crown'),
 'finalBoss':      boss('finalBoss','Eternal Dragon','The Final Trial',2500,2.3,0x5a0a5a,['spread','rain','summon','charge'],620,38,40,False,'crown'),
}
os.makedirs(os.path.join(ROOT,'enemies'), exist_ok=True)
json.dump(enemies, open(os.path.join(ROOT,'enemies','enemies.json'),'w'), indent=2)
json.dump(bosses, open(os.path.join(ROOT,'enemies','bosses.json'),'w'), indent=2)

envs = ['forest','desert','snow','castle','ruins','volcano','dungeon','temple']
boss_order = list(bosses.keys())
adj = ['Whispering','Crimson','Silent','Broken','Golden','Shattered','Hidden','Frozen','Burning','Forgotten','Haunted','Ancient','Wild','Iron','Misty','Dark','Sunlit','Lost','Cursed','Royal']
noun = {'forest':['Glade','Thicket','Woods','Clearing'],'desert':['Dunes','Oasis','Canyon','Mesa'],'snow':['Pass','Tundra','Glacier','Ridge'],
        'castle':['Ramparts','Keep','Courtyard','Gatehouse'],'ruins':['Ruins','Colonnade','Plaza','Crypt'],'volcano':['Caldera','Lava Fields','Forge','Crater'],
        'dungeon':['Cellars','Depths','Catacombs','Vault'],'temple':['Sanctum','Terrace','Shrine','Halls']}
hints = {1:'Hold to charge, release to shoot. Aim for the head!',11:'Moving targets and fast runners: lead your shots.',
 21:'Cover blocks arrows. Shoot barrels to blast groups!',31:'Shield bearers block frontal arrows: shoot over them.',
 41:'Enemy archers shoot back. Watch your health!',51:'Special arrows! Buy them in the Armory, switch with 1-8.',
 61:'Elites hide behind cover and hit hard.',71:'Mages cast from afar. The terrain gets tricky.',
 81:'Mixed squads: prioritise the dangerous ones.',91:'Extreme challenge. Good luck, Master.',100:'The Eternal Dragon awaits. Aim for the glowing core!'}
lvdir = os.path.join(ROOT,'levels'); os.makedirs(lvdir, exist_ok=True)
for i in range(1,101):
    t = (i-1)//10; k = i - t*10   # k = 1..10 within tier
    env = envs[min(7,(i-1)*8//100)]
    c = {}
    if t == 0: c = {'basic':3+i//2, 'target':2 if i>3 else 1}
    elif t == 1: c = {'basic':3+k//2, 'fast':2+k//2, 'target':3}
    elif t == 2: c = {'basic':4+k//2, 'fast':2+k//3, 'target':2}
    elif t == 3: c = {'basic':3+k//3, 'fast':2, 'shield':2+k//2}
    elif t == 4: c = {'basic':3, 'shield':2, 'archer':2+k//3}
    elif t == 5: c = {'basic':3, 'archer':2, 'armored':2+k//3, 'fast':2}
    elif t == 6: c = {'basic':3, 'shield':2, 'armored':2, 'elite':1+k//4}
    elif t == 7: c = {'basic':3, 'archer':2, 'mage':2+k//3, 'elite':1+k//5}
    elif t == 8: c = {'basic':3,'fast':3,'shield':3,'archer':3,'armored':2+k//4,'elite':2,'mage':2}
    else: c = {'basic':4,'fast':4,'shield':3,'archer':4,'armored':3,'elite':2+k//4,'mage':3}
    boss_id = boss_order[i//10-1] if i%10==0 else None
    if boss_id:
        c = {kk: max(1,v//2) for kk,v in c.items() if kk != 'target'}
    props = {'barrels':0,'crates':0,'covers':0}
    if t >= 2: props = {'barrels':min(3,(k//3)+(1 if t>2 else 0)),'crates':1+(1 if t>=4 else 0),'covers':min(3,1+k//4)}
    if t == 7: props = {'barrels':3,'crates':2,'covers':3}
    enemies_l = [{'type':kk,'count':int(v)} for kk,v in c.items() if v>0]
    total = sum(v for v in c.values())
    interval = max(0.9, 2.3 - i*0.012)
    waves = 1 + (total>8) + (total>16) + (total>26)
    target = int(total*260/50)*50 + (2500 if boss_id else 0)
    d = {'id':i,'name':"Training Grounds" if i==1 else f"{adj[i%len(adj)]} {noun[env][i%4]}",
         'environment':env,'enemies':enemies_l,'waves':waves,'targetScore':target,'threeStarScore':int(target*1.9/100)*100,
         'timeLimit':int((total*interval + 40 + waves*10 + (150 if boss_id else 0))/5)*5,
         'specialAmmo': 14 if t>=5 else 8, 'props':props}
    if boss_id:
        d['boss'] = boss_id; d['name'] = f"{bosses[boss_id]['name']}'s Lair"
    if i in hints: d['hint'] = hints[i]
    json.dump(d, open(os.path.join(lvdir,f'level{i:03d}.json'),'w'), indent=2)
print('generated', len(enemies), 'enemies,', len(bosses), 'bosses, 100 levels')
